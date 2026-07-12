from rest_framework import serializers
from .models import ServiceRecord


class ServiceRecordSerializer(serializers.ModelSerializer):
    vehicle_name   = serializers.ReadOnlyField(source='vehicle.name')
    vehicle_reg_no = serializers.ReadOnlyField(source='vehicle.registration_no')
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRecord
        fields = [
            'id',
            'vehicle',
            'vehicle_name',
            'vehicle_reg_no',
            'service_type',
            'cost',
            'date',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_display']

    def get_status_display(self, obj):
        return obj.get_status_display()
