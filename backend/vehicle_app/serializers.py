from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    status_display       = serializers.SerializerMethodField()
    vehicle_type_display = serializers.SerializerMethodField()

    class Meta:
        model  = Vehicle
        fields = [
            'id',
            'registration_no',
            'name',
            'vehicle_type',
            'vehicle_type_display',
            'capacity',
            'odometer',
            'acquisition_cost',
            'status',
            'status_display',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'status_display', 'vehicle_type_display']

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_vehicle_type_display(self, obj):
        return obj.get_vehicle_type_display()

    def validate_registration_no(self, value):
        """Enforce uppercase registration number."""
        return value.upper().strip()
