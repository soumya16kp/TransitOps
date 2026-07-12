from rest_framework import serializers
from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField()
    license_category_display = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            'id',
            'name',
            'license_number',
            'license_category',
            'license_category_display',
            'license_expiry_date',
            'contact_number',
            'safety_score',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_display', 'license_category_display']

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_license_category_display(self, obj):
        return obj.get_license_category_display()

    def validate_license_number(self, value):
        return value.upper().strip()
