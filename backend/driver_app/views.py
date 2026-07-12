from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Driver
from .serializers import DriverSerializer


class DriverListCreateView(APIView):
    """
    GET  /api/drivers/          → list all drivers
    POST /api/drivers/          → create a new driver
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Driver.objects.all()

        # Filters
        category = request.query_params.get('category')
        driver_status = request.query_params.get('status')
        search = request.query_params.get('search')

        if category:
            queryset = queryset.filter(license_category=category)

        if driver_status:
            queryset = queryset.filter(status=driver_status)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(license_number__icontains=search)
            )

        serializer = DriverSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DriverSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DriverDetailView(APIView):
    """
    GET    /api/drivers/<pk>/   → retrieve single driver
    PUT    /api/drivers/<pk>/   → full update
    PATCH  /api/drivers/<pk>/   → partial update
    DELETE /api/drivers/<pk>/   → delete
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Driver.objects.get(pk=pk)
        except Driver.DoesNotExist:
            return None

    def get(self, request, pk):
        driver = self.get_object(pk)
        if not driver:
            return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DriverSerializer(driver)
        return Response(serializer.data)

    def put(self, request, pk):
        driver = self.get_object(pk)
        if not driver:
            return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DriverSerializer(driver, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        driver = self.get_object(pk)
        if not driver:
            return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DriverSerializer(driver, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        driver = self.get_object(pk)
        if not driver:
            return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
        driver.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DriverChoicesView(APIView):
    """GET /api/drivers/choices/ → returns valid license categories & status choices."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'categories': [{'value': k, 'label': v} for k, v in Driver.LicenseCategory.choices],
            'statuses': [{'value': k, 'label': v} for k, v in Driver.DriverStatus.choices],
        })
