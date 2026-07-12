from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from core.permissions import TripsPermission
from rest_framework.permissions import IsAuthenticated
from .models import Trip
from .serializers import TripSerializer


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated, TripsPermission]

    def get_queryset(self):
        """Support ?status= filtering for the live board and kanban board."""
        queryset = Trip.objects.select_related('vehicle', 'driver').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

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
            trip.complete_trip()
            return Response({
                "status": "Trip Completed Successfully",
                "trip": TripSerializer(trip).data
            })
        except DjangoValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)

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