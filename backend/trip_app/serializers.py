from rest_framework import serializers
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    # Read-only fields to display nested data in the Live Board
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    vehicle_capacity = serializers.CharField(source='vehicle.capacity', read_only=True)
    driver_contact = serializers.CharField(source='driver.contact_number', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = ('tracking_number', 'status')