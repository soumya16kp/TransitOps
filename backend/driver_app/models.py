from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Driver(models.Model):
    class LicenseCategory(models.TextChoices):
        LMV = 'LMV', 'Light Motor Vehicle'
        HMV = 'HMV', 'Heavy Motor Vehicle'
        # Add others if necessary, UI shows LMV/HMV

    class DriverStatus(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ON_TRIP = 'ON_TRIP', 'On Trip'
        OFF_DUTY = 'OFF_DUTY', 'Off Duty'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    name = models.CharField(max_length=150, help_text="Full name of the driver")
    license_number = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Unique driving license number"
    )
    license_category = models.CharField(
        max_length=10, 
        choices=LicenseCategory.choices,
        default=LicenseCategory.LMV
    )
    license_expiry_date = models.DateField(
        help_text="Date when the driving license expires"
    )
    contact_number = models.CharField(
        max_length=20, 
        help_text="Contact phone number"
    )
    safety_score = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Driver safety score out of 100"
    )
    status = models.CharField(
        max_length=15,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE,
        db_index=True  # Indexed for faster querying in the Dispatcher UI
    )

    # Auditing timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Driver"
        verbose_name_plural = "Drivers"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.license_number})"