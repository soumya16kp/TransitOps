from django.db import models
from django.conf import settings


class FuelLog(models.Model):
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuel_logs')
    # Link to the trip that generated this fuel log (null for standalone/legacy logs)
    trip        = models.OneToOneField(
        'trip_app.Trip',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='fuel_log',
        help_text="The trip this fuel was consumed on."
    )
    vehicle          = models.CharField(max_length=100)
    date             = models.DateField()
    liters           = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_cost        = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_liter   = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        trip_ref = f" [Trip: {self.trip.tracking_number}]" if self.trip else ""
        return f"{self.vehicle} - {self.date} - {self.liters}L{trip_ref}"


class Expense(models.Model):
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    trip         = models.CharField(max_length=100)
    vehicle      = models.CharField(max_length=100)
    toll         = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    other        = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    maint_linked = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status       = models.CharField(max_length=50, default='Available')
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trip} - {self.vehicle} - {self.status}"
