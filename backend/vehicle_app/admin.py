from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display  = ('registration_no', 'name', 'vehicle_type', 'capacity',
                     'odometer', 'acquisition_cost', 'status', 'created_at')
    list_filter   = ('vehicle_type', 'status')
    search_fields = ('registration_no', 'name')
    ordering      = ('-created_at',)
