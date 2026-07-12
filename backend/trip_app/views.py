from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Trip
from .serializers import TripSerializer

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    def create(self, request, *args, **kwargs):
        # Catch model-level validation errors during creation
        try:
            return super().create(request, *args, **kwargs)
        except DjangoValidationError as e:
            return Response({"error": e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def dispatch_trip(self, request, pk=None):
        trip = self.get_object()
        try:
            trip.dispatch_trip()
            return Response({"status": "Trip Dispatched Successfully", "trip": TripSerializer(trip).data})
        except DjangoValidationError as e:
            # E.g., Capacity exceeded, or Driver suspended
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)