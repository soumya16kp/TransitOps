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

    @property
    def max_load_capacity(self):
        import re
        val = self.capacity.lower().strip()
        match = re.search(r'([\d\.,]+)', val)
        if match:
            num_str = match.group(1).replace(',', '')
            try:
                num = float(num_str)
            except ValueError:
                return 1000
            if 'ton' in val or 't' in val:
                return int(num * 1000)
            elif 'lbs' in val or 'lb' in val:
                return int(num * 0.453592)
            return int(num)
        return 1000


class VehicleDocument(models.Model):
    RC = 'RC'
    DL = 'DL'
    INSURANCE = 'Insurance'
    PUC = 'PUC'
    PERMIT_FITNESS = 'Permit_Fitness'

    DOC_TYPE_CHOICES = [
        (RC, 'Registration Certificate (RC)'),
        (DL, 'Driving Licence (DL)'),
        (INSURANCE, 'Motor Insurance Policy'),
        (PUC, 'Pollution Under Control (PUC) Certificate'),
        (PERMIT_FITNESS, 'Commercial Permits & Fitness Certificate'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to='vehicle_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('vehicle', 'document_type')
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.vehicle.registration_no} - {self.document_type}"

