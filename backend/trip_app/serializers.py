from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    # Read-only display fields for the Live Board and Kanban cards
    vehicle_name         = serializers.CharField(source='vehicle.name', read_only=True)
    vehicle_registration = serializers.CharField(source='vehicle.registration_no', read_only=True)
    vehicle_capacity     = serializers.CharField(source='vehicle.capacity', read_only=True)
    vehicle_status       = serializers.CharField(source='vehicle.status', read_only=True)
    driver_name          = serializers.CharField(source='driver.name', read_only=True)
    driver_contact       = serializers.CharField(source='driver.contact_number', read_only=True)
    driver_status        = serializers.CharField(source='driver.status', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = ('tracking_number', 'status')