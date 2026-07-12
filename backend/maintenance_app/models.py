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
        super().save(*args, **kwargs)
        
        # Enforce state transition rules on the vehicle
        vehicle = self.vehicle
        if self.status == self.ACTIVE:
            if vehicle.status != 'In Shop':
                vehicle.status = 'In Shop'
                vehicle.save(update_fields=['status'])
        elif self.status == self.COMPLETED:
            if vehicle.status == 'In Shop':
                vehicle.status = 'Available'
                vehicle.save(update_fields=['status'])
