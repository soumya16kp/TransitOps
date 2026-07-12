from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
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

    def validate(self, data):
        """
        Run model-level clean() during DRF validation so all business rules
        (capacity, driver status, vehicle status) are enforced at trip creation,
        not just at dispatch time.
        """
        # Build a partial instance using submitted + existing data (for updates)
        instance = self.instance
        for attr, value in data.items():
            setattr(instance if instance else Trip(), attr, value)

        # Create a temporary instance to run clean() against
        tmp = Trip(**{
            k: v for k, v in {
                'vehicle': data.get('vehicle', getattr(self.instance, 'vehicle', None)),
                'driver': data.get('driver', getattr(self.instance, 'driver', None)),
                'cargo_weight': data.get('cargo_weight', getattr(self.instance, 'cargo_weight', 0)),
                'pk': self.instance.pk if self.instance else None,
            }.items() if v is not None
        })

        try:
            tmp.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        return data