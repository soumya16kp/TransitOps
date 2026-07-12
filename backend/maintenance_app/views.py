from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.permissions import FleetPermission

from .models import ServiceRecord
from .serializers import ServiceRecordSerializer


class ServiceRecordListCreateView(APIView):
    """
    GET  /api/maintenance/  → list all maintenance records
    POST /api/maintenance/  → log new maintenance record
    """
    permission_classes = [IsAuthenticated, FleetPermission]

    def get(self, request):
        queryset = ServiceRecord.objects.all()
        
        # Optional filters
        vehicle_id   = request.query_params.get('vehicle')
        record_status = request.query_params.get('status')
        
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if record_status:
            queryset = queryset.filter(status=record_status)

        serializer = ServiceRecordSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ServiceRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceRecordDetailView(APIView):
    """
    GET    /api/maintenance/<pk>/  → retrieve detail
    PUT    /api/maintenance/<pk>/  → full update
    PATCH  /api/maintenance/<pk>/  → partial update (e.g. status transition)
    DELETE /api/maintenance/<pk>/  → delete
    """
    permission_classes = [IsAuthenticated, FleetPermission]

    def get_object(self, pk):
        try:
            return ServiceRecord.objects.get(pk=pk)
        except ServiceRecord.DoesNotExist:
            return None

    def get(self, request, pk):
        record = self.get_object(pk)
        if not record:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceRecordSerializer(record)
        return Response(serializer.data)

    def put(self, request, pk):
        record = self.get_object(pk)
        if not record:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceRecordSerializer(record, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        record = self.get_object(pk)
        if not record:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceRecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        record = self.get_object(pk)
        if not record:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
