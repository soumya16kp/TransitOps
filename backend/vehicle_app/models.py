from django.db import models


class Vehicle(models.Model):
    # ── Type choices ─────────────────────────────────────────────────────────
    VAN   = 'Van'
    TRUCK = 'Truck'
    MINI  = 'Mini'
    BUS   = 'Bus'

    TYPE_CHOICES = [
        (VAN,   'Van'),
        (TRUCK, 'Truck'),
        (MINI,  'Mini'),
        (BUS,   'Bus'),
    ]

    # ── Status choices ────────────────────────────────────────────────────────
    AVAILABLE = 'Available'
    ON_TRIP   = 'On Trip'
    IN_SHOP   = 'In Shop'
    RETIRED   = 'Retired'

    STATUS_CHOICES = [
        (AVAILABLE, 'Available'),
        (ON_TRIP,   'On Trip'),
        (IN_SHOP,   'In Shop'),
        (RETIRED,   'Retired'),
    ]

    # ── Fields ────────────────────────────────────────────────────────────────
    registration_no  = models.CharField(max_length=20, unique=True)
    name             = models.CharField(max_length=100)
    vehicle_type     = models.CharField(max_length=20, choices=TYPE_CHOICES, default=VAN)
    capacity         = models.CharField(max_length=50)          # e.g. "500 kg", "5 Ton"
    odometer         = models.PositiveIntegerField(default=0)   # km
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    status           = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=AVAILABLE
    )
    notes            = models.TextField(blank=True, null=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.registration_no} – {self.name} ({self.vehicle_type})"
