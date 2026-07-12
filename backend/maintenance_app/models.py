from django.db import models
from vehicle_app.models import Vehicle


class ServiceRecord(models.Model):
    # ── Status choices ────────────────────────────────────────────────────────
    ACTIVE    = 'Active'
    COMPLETED = 'Completed'

    STATUS_CHOICES = [
        (ACTIVE,    'Active'),
        (COMPLETED, 'Completed'),
    ]

    # ── Fields ────────────────────────────────────────────────────────────────
    vehicle      = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    service_type = models.CharField(max_length=100) # e.g. "Oil Change", "Engine Repair"
    cost         = models.DecimalField(max_digits=12, decimal_places=2)
    date         = models.DateField() # format: YYYY-MM-DD
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.vehicle.registration_no} – {self.service_type} ({self.status})"

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError

        vehicle = self.vehicle

        # Rule 9: Creating an ACTIVE maintenance record sets vehicle to In Shop.
        # Guard: Cannot create maintenance if vehicle is On Trip.
        if self.status == self.ACTIVE:
            if vehicle.status == 'On Trip':
                raise ValidationError(
                    f"Cannot create maintenance for '{vehicle.registration_no}' "
                    f"while it is On Trip. Complete or cancel the trip first."
                )
            if vehicle.status != 'In Shop':
                vehicle.status = 'In Shop'
                vehicle.save(update_fields=['status'])

        # Rule 10: Closing maintenance → Available, UNLESS vehicle is Retired.
        elif self.status == self.COMPLETED:
            if vehicle.status == 'In Shop':
                # Re-fetch to ensure we're not overwriting a Retired status
                # (admins could retire a vehicle while it's in the shop)
                fresh_vehicle = vehicle.__class__.objects.get(pk=vehicle.pk)
                if fresh_vehicle.status != 'Retired':
                    fresh_vehicle.status = 'Available'
                    fresh_vehicle.save(update_fields=['status'])

        super().save(*args, **kwargs)
