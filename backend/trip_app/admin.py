from django.contrib import admin
from .models import Trip

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'source', 'destination', 'vehicle', 'driver', 'revenue', 'status')
    list_filter = ('status',)
    search_fields = ('tracking_number', 'source', 'destination')
    readonly_fields = ('tracking_number', 'created_at', 'updated_at')