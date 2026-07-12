from django.db import models, transaction
from django.core.exceptions import ValidationError
from datetime import date

class Trip(models.Model):
    class TripStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    source = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    
    # Relationships
    vehicle = models.ForeignKey(
        'vehicle_app.Vehicle', 
        on_delete=models.RESTRICT,
        related_name='trips',
        help_text="Select an available vehicle."
    )
    driver = models.ForeignKey(
        'driver_app.Driver',
        on_delete=models.RESTRICT,
        related_name='trips',
        help_text="Select an available driver."
    )
    
    cargo_weight = models.PositiveIntegerField(help_text="Cargo weight in kg.")
    planned_distance = models.PositiveIntegerField(help_text="Planned distance in km.")
    
    status = models.CharField(
        max_length=15,
        choices=TripStatus.choices,
        default=TripStatus.DRAFT
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Trip"
        verbose_name_plural = "Trips"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tracking_number} ({self.source} -> {self.destination})"

    def save(self, *args, **kwargs):
        # Auto-generate tracking number (e.g., TR001)
        if not self.tracking_number:
            last_trip = Trip.objects.order_by('id').last()
            next_id = (last_trip.id + 1) if last_trip else 1
            self.tracking_number = f"TR{next_id:03d}"
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        
        # Mandatory Rule: Cargo Weight <= Vehicle Capacity
        if self.vehicle and self.cargo_weight:
            if self.cargo_weight > self.vehicle.max_load_capacity:
                raise ValidationError({
                    "cargo_weight": f"Exceeds vehicle capacity! Max allowed is {self.vehicle.max_load_capacity} kg."
                })
        
        # Mandatory Rule: Driver License and Suspension Check
        if self.driver:
            if self.driver.status == 'SUSPENDED':
                raise ValidationError({"driver": "Suspended drivers cannot be assigned to trips."})
            if self.driver.license_expiry_date and self.driver.license_expiry_date < date.today():
                raise ValidationError({"driver": "Driver license is expired. Dispatch blocked."})

    # --- STATE TRANSITION METHODS ---

    @transaction.atomic
    def dispatch_trip(self):
        if self.status != self.TripStatus.DRAFT:
            raise ValidationError("Only Draft trips can be dispatched.")
        if self.vehicle.status != 'Available' or self.driver.status != 'AVAILABLE':
            raise ValidationError("Both Vehicle and Driver must be Available.")
        
        # Run clean to ensure rules are respected right before dispatch
        self.clean()
        
        # Change Trip Status
        self.status = self.TripStatus.DISPATCHED
        self.save(update_fields=['status'])
        
        # Change Vehicle & Driver Status (Atomic)
        self.vehicle.status = 'On Trip'
        self.vehicle.save(update_fields=['status'])
        
        self.driver.status = 'ON_TRIP'
        self.driver.save(update_fields=['status'])

    @transaction.atomic
    def complete_trip(self):
        if self.status != self.TripStatus.DISPATCHED:
            raise ValidationError("Only dispatched trips can be completed.")
        
        self.status = self.TripStatus.COMPLETED
        self.save(update_fields=['status'])
        
        self.vehicle.status = 'Available'
        self.vehicle.save(update_fields=['status'])
        
        self.driver.status = 'AVAILABLE'
        self.driver.save(update_fields=['status'])

    @transaction.atomic
    def cancel_trip(self):
        if self.status in [self.TripStatus.COMPLETED, self.TripStatus.CANCELLED]:
            raise ValidationError("Trip cannot be cancelled.")
        
        was_dispatched = (self.status == self.TripStatus.DISPATCHED)
        self.status = self.TripStatus.CANCELLED
        self.save(update_fields=['status'])
        
        # Only revert resources if they were actually dispatched
        if was_dispatched:
            self.vehicle.status = 'Available'
            self.vehicle.save(update_fields=['status'])
            
            self.driver.status = 'AVAILABLE'
            self.driver.save(update_fields=['status'])