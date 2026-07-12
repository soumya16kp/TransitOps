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
        # Admin check
        if request.user.role != 'admin':
            return Response({"error": "Only admins can edit permissions."}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data  # expected list of role permission objects
        if not isinstance(data, list):
            data = [data]

        for item in data:
            role_key = item.get('role_key')
            if not role_key:
                continue
            RolePermission.objects.update_or_create(
                role_key=role_key,
                defaults={
                    'fleet': item.get('fleet', '—'),
                    'driver': item.get('driver', '—'),
                    'trips': item.get('trips', '—'),
                    'fuel': item.get('fuel', '—'),
                    'analytics': item.get('analytics', '—'),
                }
            )
        
        queryset = RolePermission.objects.all()
        serializer = RolePermissionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)