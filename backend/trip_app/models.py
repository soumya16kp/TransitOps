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
    revenue = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Expected revenue from this trip in INR (₹)."
    )

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
        """
        Enforce all mandatory business rules at model level.
        Called on both create (via serializer) and dispatch.
        """
        super().clean()

        # ── Rule 5: Cargo Weight ≤ Vehicle Capacity ────────────────────────────
        if self.vehicle_id and self.cargo_weight:
            vehicle = self.vehicle
            max_cap = vehicle.max_load_capacity
            if self.cargo_weight > max_cap:
                raise ValidationError({
                    "cargo_weight": (
                        f"Cargo weight ({self.cargo_weight} kg) exceeds vehicle capacity "
                        f"({max_cap} kg) for {vehicle.registration_no}."
                    )
                })

        # ── Rule 2: Vehicle must not be Retired or In Shop ────────────────────
        if self.vehicle_id:
            vehicle = self.vehicle
            if vehicle.status in ('Retired', 'In Shop'):
                raise ValidationError({
                    "vehicle": (
                        f"Vehicle '{vehicle.registration_no}' is currently '{vehicle.status}' "
                        f"and cannot be assigned to a trip."
                    )
                })

        # ── Rule 4 (draft creation): Vehicle must not already be On Trip ─────
        if self.vehicle_id and self.pk is None:   # only block on new trip creation
            vehicle = self.vehicle
            if vehicle.status == 'On Trip':
                raise ValidationError({
                    "vehicle": (
                        f"Vehicle '{vehicle.registration_no}' is already On Trip "
                        f"and cannot be assigned."
                    )
                })

        # ── Rules 3 & 4: Driver checks ────────────────────────────────────────
        if self.driver_id:
            driver = self.driver

            # Suspended driver
            if driver.status == 'SUSPENDED':
                raise ValidationError({
                    "driver": f"Driver '{driver.name}' is Suspended and cannot be assigned to trips."
                })

            # Expired license
            if driver.license_expiry_date and driver.license_expiry_date < date.today():
                raise ValidationError({
                    "driver": (
                        f"Driver '{driver.name}' has an expired license "
                        f"(expired {driver.license_expiry_date}). Dispatch blocked."
                    )
                })

            # Already on a trip (only block on new trip creation)
            if self.pk is None and driver.status == 'ON_TRIP':
                raise ValidationError({
                    "driver": (
                        f"Driver '{driver.name}' is already On Trip and cannot be assigned."
                    )
                })

    # ─── STATE TRANSITION METHODS ─────────────────────────────────────────────

    @transaction.atomic
    def dispatch_trip(self):
        """
        Rule 6: Dispatching sets vehicle and driver to On Trip.
        Re-validates all business rules right before commit.
        """
        if self.status != self.TripStatus.DRAFT:
            raise ValidationError("Only Draft trips can be dispatched.")

        # Re-run clean() to enforce Rules 2, 3, 4, 5 at dispatch time
        self.clean()

        # Double-check statuses (catches race conditions)
        if self.vehicle.status != 'Available':
            raise ValidationError(
                f"Vehicle '{self.vehicle.registration_no}' is no longer Available "
                f"(current status: {self.vehicle.status})."
            )
        if self.driver.status != 'AVAILABLE':
            raise ValidationError(
                f"Driver '{self.driver.name}' is no longer Available "
                f"(current status: {self.driver.status})."
            )

        # Commit state transitions
        self.status = self.TripStatus.DISPATCHED
        self.save(update_fields=['status'])

        self.vehicle.status = 'On Trip'
        self.vehicle.save(update_fields=['status'])

        self.driver.status = 'ON_TRIP'
        self.driver.save(update_fields=['status'])

    @transaction.atomic
    def complete_trip(self):
        """
        Rule 7: Completing a trip restores vehicle and driver to Available.
        """
        if self.status != self.TripStatus.DISPATCHED:
            raise ValidationError("Only dispatched trips can be completed.")

        self.status = self.TripStatus.COMPLETED
        self.save(update_fields=['status'])

        # Restore vehicle — only if not Retired
        if self.vehicle.status != 'Retired':
            self.vehicle.status = 'Available'
            self.vehicle.save(update_fields=['status'])

        self.driver.status = 'AVAILABLE'
        self.driver.save(update_fields=['status'])

    @transaction.atomic
    def cancel_trip(self):
        """
        Rule 8: Cancelling a dispatched trip restores vehicle and driver to Available.
        Draft cancellations require no status revert.
        """
        if self.status in [self.TripStatus.COMPLETED, self.TripStatus.CANCELLED]:
            raise ValidationError("Completed or already cancelled trips cannot be cancelled.")

        was_dispatched = (self.status == self.TripStatus.DISPATCHED)
        self.status = self.TripStatus.CANCELLED
        self.save(update_fields=['status'])

        if was_dispatched:
            # Restore vehicle — only if not Retired or In Shop (maintenance may have started)
            if self.vehicle.status not in ('Retired', 'In Shop'):
                self.vehicle.status = 'Available'
                self.vehicle.save(update_fields=['status'])

            self.driver.status = 'AVAILABLE'
            self.driver.save(update_fields=['status'])