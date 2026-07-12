from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import RolePermission
from .serializers import RolePermissionSerializer

# Default permission matrix
DEFAULT_RBAC = [
    { 'role_key': 'fleet_manager',     'role_name': 'Fleet Manager',     'fleet': '✓',    'driver': '✓',    'trips': '—',    'fuel': '—',    'analytics': '✓' },
    { 'role_key': 'dispatcher',        'role_name': 'Dispatcher',        'fleet': 'view', 'driver': '—',    'trips': '✓',    'fuel': '—',    'analytics': '—' },
    { 'role_key': 'safety_officer',    'role_name': 'Safety Officer',    'fleet': '—',    'driver': '✓',    'trips': 'view', 'fuel': '—',    'analytics': '—' },
    { 'role_key': 'financial_analyst', 'role_name': 'Financial Analyst', 'fleet': 'view', 'driver': '—',    'trips': '—',    'fuel': '✓',    'analytics': '✓' },
]

def ensure_rbac_seeded():
    if RolePermission.objects.count() == 0:
        for item in DEFAULT_RBAC:
            RolePermission.objects.create(
                role_key=item['role_key'],
                role_name=item['role_name'],
                fleet=item['fleet'],
                driver=item['driver'],
                trips=item['trips'],
                fuel=item['fuel'],
                analytics=item['analytics']
            )

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'message': 'This is a protected endpoint',
            'user': request.user.email
        })

class RolePermissionListUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_rbac_seeded()
        queryset = RolePermission.objects.all()
        serializer = RolePermissionSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Only admins can edit permissions."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        if not isinstance(data, list):
            data = [data]

        for item in data:
            role_key = item.get('role_key')
            if not role_key:
                continue
            RolePermission.objects.update_or_create(
                role_key=role_key,
                defaults={
                    'fleet':     item.get('fleet',     '—'),
                    'driver':    item.get('driver',    '—'),
                    'trips':     item.get('trips',     '—'),
                    'fuel':      item.get('fuel',      '—'),
                    'analytics': item.get('analytics', '—'),
                }
            )

        queryset = RolePermission.objects.all()
        serializer = RolePermissionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import datetime
        from collections import OrderedDict
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        from vehicle_app.models import Vehicle
        from trip_app.models import Trip
        from expenses.models import FuelLog, Expense
        from maintenance_app.models import ServiceRecord
        from core.permissions import AnalyticsPermission

        # ── RBAC gate ─────────────────────────────────────────────────────────
        perm = AnalyticsPermission()
        if not perm.has_permission(request, self):
            return Response(
                {"error": "Access Denied: Insufficient permissions for analytics"},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Optional vehicle filter (by registration_no) ──────────────────────
        vehicle_reg = request.query_params.get('vehicle', '').strip()
        vehicle_obj = None
        if vehicle_reg and vehicle_reg != 'ALL':
            vehicle_obj = Vehicle.objects.filter(registration_no=vehicle_reg).first()

        # ── Base querysets scoped to vehicle filter ───────────────────────────
        if vehicle_obj:
            trip_qs    = Trip.objects.filter(status='COMPLETED', vehicle=vehicle_obj)
            fuel_qs    = FuelLog.objects.filter(vehicle=vehicle_reg)
            expense_qs = Expense.objects.filter(vehicle=vehicle_reg)
            maint_qs   = ServiceRecord.objects.filter(vehicle=vehicle_obj)
        else:
            trip_qs    = Trip.objects.filter(status='COMPLETED')
            fuel_qs    = FuelLog.objects.all()
            expense_qs = Expense.objects.all()
            maint_qs   = ServiceRecord.objects.all()

        # ── 1. Fuel totals ────────────────────────────────────────────────────
        total_fuel_cost   = float(fuel_qs.aggregate(Sum('fuel_cost'))['fuel_cost__sum'] or 0)
        total_fuel_liters = float(fuel_qs.aggregate(Sum('liters'))['liters__sum'] or 0)

        # ── 2. Maintenance & expense totals ───────────────────────────────────
        other_agg = expense_qs.aggregate(
            toll_sum=Sum('toll'),
            other_sum=Sum('other'),
            maint_sum=Sum('maint_linked')
        )
        total_toll         = float(other_agg['toll_sum']   or 0)
        total_other        = float(other_agg['other_sum']  or 0)
        total_maint_linked = float(other_agg['maint_sum']  or 0)
        total_maint_direct = float(maint_qs.aggregate(Sum('cost'))['cost__sum'] or 0)
        total_maint        = total_maint_linked + total_maint_direct

        # ── 3. Total Operational Cost ─────────────────────────────────────────
        total_operational_cost = total_fuel_cost + total_maint + total_toll + total_other

        # ── 4. Total distance of completed trips ──────────────────────────────
        total_distance = float(
            trip_qs.aggregate(Sum('planned_distance'))['planned_distance__sum'] or 0
        )

        # ── 5. Fuel Efficiency (km/l) ─────────────────────────────────────────
        if total_fuel_liters > 0 and total_distance > 0:
            fuel_efficiency = round(total_distance / total_fuel_liters, 1)
        else:
            fuel_efficiency = None  # No data, show "N/A"

        # ── 6. Fleet Utilization (%) ──────────────────────────────────────────
        if vehicle_obj:
            # Single vehicle: 100% if On Trip, 0% otherwise
            fleet_utilization = 100 if vehicle_obj.status == 'On Trip' else 0
        else:
            on_trip  = Vehicle.objects.filter(status='On Trip').count()
            total_v  = Vehicle.objects.count()
            fleet_utilization = round((on_trip / total_v) * 100) if total_v > 0 else 0

        # ── 7. Revenue & ROI ──────────────────────────────────────────────────
        if vehicle_obj:
            acquisition = float(vehicle_obj.acquisition_cost or 0)
        else:
            acquisition = float(
                Vehicle.objects.aggregate(Sum('acquisition_cost'))['acquisition_cost__sum'] or 0
            )

        total_revenue = sum(float(t.revenue or 0) for t in trip_qs)

        if acquisition > 0:
            net_income = total_revenue - (total_fuel_cost + total_maint)
            roi = round((net_income / acquisition) * 100, 1)
            if roi <= 0:
                roi = None  # Meaningful zero/negative — show as N/A
        else:
            roi = None

        # ── 8. Monthly Revenue — 100% real historical data ────────────────────
        today = datetime.date.today()
        seven_months_ago = today.replace(day=1) - datetime.timedelta(days=30 * 6)

        # Build ordered month scaffold for last 7 months (current included)
        months_data = OrderedDict()
        for i in range(6, -1, -1):
            # Step step back month by month
            d = today - datetime.timedelta(days=30 * i)
            months_data[d.strftime('%b %Y')] = 0.0

        # Real DB aggregation using TruncMonth
        real_monthly = (
            trip_qs.filter(created_at__date__gte=seven_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('revenue'))
            .order_by('month')
        )
        for row in real_monthly:
            key = row['month'].strftime('%b %Y')
            if key in months_data:
                months_data[key] = float(row['revenue'] or 0)

        monthly_revenue = [
            {'month': k.split(' ')[0], 'revenue': v}   # strip year for display
            for k, v in months_data.items()
        ]

        # ── 9. Top Costliest Vehicles (fuel logs only) ────────────────────────
        if vehicle_obj:
            # Single vehicle: show its own fuel cost only
            top_costliest = [{'vehicle': vehicle_reg, 'cost': total_fuel_cost}]
        else:
            vehicle_costs = {}
            for item in fuel_qs.values('vehicle').annotate(tot=Sum('fuel_cost')):
                vehicle_costs[item['vehicle']] = (
                    vehicle_costs.get(item['vehicle'], 0) + float(item['tot'] or 0)
                )
            sorted_costs  = sorted(vehicle_costs.items(), key=lambda x: x[1], reverse=True)
            top_costliest = [{'vehicle': v, 'cost': c} for v, c in sorted_costs[:3]]

        # ── Vehicle list for the frontend filter dropdown ─────────────────────
        all_vehicles = list(
            Vehicle.objects.values('registration_no', 'name', 'vehicle_type')
            .order_by('registration_no')
        )

        return Response({
            'fuel_efficiency':   f"{fuel_efficiency} km/l" if fuel_efficiency else "N/A",
            'fleet_utilization': f"{fleet_utilization}%",
            'operational_cost':  total_operational_cost,
            'roi':               f"{roi}%" if roi is not None else "N/A",
            'monthly_revenue':   monthly_revenue,
            'top_costliest':     top_costliest,
            'vehicles':          all_vehicles,
            'filtered_vehicle':  vehicle_reg or 'ALL',
        })
