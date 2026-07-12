from rest_framework import serializers
from .models import FuelLog, Expense

class FuelLogSerializer(serializers.ModelSerializer):
    trip_tracking_number = serializers.CharField(source='trip.tracking_number', read_only=True)

    class Meta:
        model = FuelLog
        fields = ['id', 'trip', 'trip_tracking_number', 'vehicle', 'date', 'liters', 'fuel_cost', 'cost_per_liter', 'created_at']
        read_only_fields = ['id', 'trip_tracking_number', 'created_at']

class ExpenseSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'trip', 'vehicle', 'toll', 'other', 'maint_linked', 'status', 'total', 'created_at']
        read_only_fields = ['id', 'total', 'created_at']

    def get_total(self, obj):
        return obj.toll + obj.other + obj.maint_linked
