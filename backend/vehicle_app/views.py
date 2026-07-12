from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleListCreateView(APIView):
    """
    GET  /api/vehicles/          → list all vehicles (supports ?type=&status=&search=)
    POST /api/vehicles/          → create a new vehicle
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Vehicle.objects.all()

        # ── Filters ──────────────────────────────────────────────────────────
        vehicle_type = request.query_params.get('type')
        vehicle_status = request.query_params.get('status')
        search = request.query_params.get('search')

        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)

        if vehicle_status:
            queryset = queryset.filter(status__iexact=vehicle_status)

        if search:
            queryset = queryset.filter(
                Q(registration_no__icontains=search) |
                Q(name__icontains=search)
            )

        serializer = VehicleSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = VehicleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VehicleDetailView(APIView):
    """
    GET    /api/vehicles/<pk>/   → retrieve single vehicle
    PUT    /api/vehicles/<pk>/   → full update
    PATCH  /api/vehicles/<pk>/   → partial update
    DELETE /api/vehicles/<pk>/   → delete
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Vehicle.objects.get(pk=pk)
        except Vehicle.DoesNotExist:
            return None

    def get(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = VehicleSerializer(vehicle)
        return Response(serializer.data)

    def put(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = VehicleSerializer(vehicle, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = VehicleSerializer(vehicle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        vehicle = self.get_object(pk)
        if not vehicle:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        vehicle.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VehicleChoicesView(APIView):
    """GET /api/vehicles/choices/ → returns valid type & status choices."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'types':    [{'value': k, 'label': v} for k, v in Vehicle.TYPE_CHOICES],
            'statuses': [{'value': k, 'label': v} for k, v in Vehicle.STATUS_CHOICES],
        })
