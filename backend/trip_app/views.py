from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from core.permissions import TripsPermission
from rest_framework.permissions import IsAuthenticated
from datetime import date
from vehicle_app.models import Vehicle
from driver_app.models import Driver
from .models import Trip
from .serializers import TripSerializer

def ensure_trips_seeded():
    # Only seed if no vehicles, drivers, or trips exist
    if Vehicle.objects.count() == 0:
        v1 = Vehicle.objects.create(
            registration_no="VAN-05",
            name="Delivery Van A",
            vehicle_type="Van",
            capacity="1000 kg",
            odometer=12000,
            acquisition_cost=25000.00,
            status="On Trip"  # Mark as On Trip since TR001 is dispatched
        )
        v2 = Vehicle.objects.create(
            registration_no="TRK-12",
            name="Heavy Duty Truck B",
            vehicle_type="Truck",
            capacity="8000 kg",
            odometer=45000,
            acquisition_cost=75000.00,
            status="Available"
        )
        v3 = Vehicle.objects.create(
            registration_no="MINI-08",
            name="Mini Shuttle C",
            vehicle_type="Mini",
            capacity="2000 kg",
            odometer=18000,
            acquisition_cost=35000.00,
            status="Available"
        )
    else:
        v1 = Vehicle.objects.filter(registration_no="VAN-05").first() or Vehicle.objects.first()
        v2 = Vehicle.objects.filter(registration_no="TRK-12").first() or Vehicle.objects.first()
        v3 = Vehicle.objects.filter(registration_no="MINI-08").first() or Vehicle.objects.first()

    if Driver.objects.count() == 0:
        d1 = Driver.objects.create(
            name="John Doe",
            license_number="DL-12345",
            license_category="LMV",
            license_expiry_date=date(2029, 6, 30),
            contact_number="+91 98765 43210",
            safety_score=95,
            status="ON_TRIP"  # Mark as ON_TRIP since TR001 is dispatched
        )
        d2 = Driver.objects.create(
            name="Jane Smith",
            license_number="DL-67890",
            license_category="HMV",
            license_expiry_date=date(2028, 12, 31),
            contact_number="+91 98765 01234",
            safety_score=98,
            status="AVAILABLE"
        )
        d3 = Driver.objects.create(
            name="Bob Johnson",
            license_number="DL-11223",
            license_category="LMV",
            license_expiry_date=date(2030, 1, 15),
            contact_number="+91 98765 55555",
            safety_score=88,
            status="AVAILABLE"
        )
    else:
        d1 = Driver.objects.filter(license_number="DL-12345").first() or Driver.objects.first()
        d2 = Driver.objects.filter(license_number="DL-67890").first() or Driver.objects.first()
        d3 = Driver.objects.filter(license_number="DL-11223").first() or Driver.objects.first()

    if Trip.objects.count() == 0 and v1 and v2 and d1 and d2:
        # Create a dispatched trip
        Trip.objects.create(
            source="Mumbai",
            destination="Pune",
            vehicle=v1,
            driver=d1,
            cargo_weight=500,
            planned_distance=150,
            status="DISPATCHED",
            tracking_number="TR001"
        )
        # Create a draft trip
        Trip.objects.create(
            source="Delhi",
            destination="Jaipur",
            vehicle=v2,
            driver=d2,
            cargo_weight=3000,
            planned_distance=270,
            status="DRAFT",
            tracking_number="TR002"
        )

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated, TripsPermission]

    def get_queryset(self):
        """Support ?status= filtering for the live board and kanban board."""
        ensure_trips_seeded()
        queryset = Trip.objects.select_related('vehicle', 'driver').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Catch model-level validation errors during creation."""
        try:
            return super().create(request, *args, **kwargs)
        except DjangoValidationError as e:
            return Response({"error": e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def dispatch_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip.dispatch_trip()
            return Response({
                "status": "Trip Dispatched Successfully",
                "trip": TripSerializer(trip).data
            })
        except DjangoValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            final_odometer      = request.data.get('final_odometer')
            fuel_consumed       = request.data.get('fuel_consumed')
            fuel_cost_per_liter = request.data.get('fuel_cost_per_liter')

            # Convert types safely
            if final_odometer is not None:
                final_odometer = int(final_odometer)
            if fuel_consumed is not None:
                fuel_consumed = float(fuel_consumed)
            if fuel_cost_per_liter is not None:
                fuel_cost_per_liter = float(fuel_cost_per_liter)

            trip.complete_trip(
                final_odometer=final_odometer,
                fuel_consumed=fuel_consumed,
                fuel_cost_per_liter=fuel_cost_per_liter,
            )
            return Response({
                "status": "Trip Completed Successfully",
                "trip": TripSerializer(trip).data,
                "fuel_logged": fuel_consumed is not None and fuel_consumed > 0,
            })
        except DjangoValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError) as e:
            return Response({"error": f"Invalid numeric value: {e}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip.cancel_trip()
            return Response({
                "status": "Trip Cancelled",
                "trip": TripSerializer(trip).data
            })
        except DjangoValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)