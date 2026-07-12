from django.db import models
from django.conf import settings

class FuelLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuel_logs')
    vehicle = models.CharField(max_length=100)
    date = models.DateField()
    liters = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle} - {self.date} - {self.fuel_cost}"

class Expense(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    trip = models.CharField(max_length=100)
    vehicle = models.CharField(max_length=100)
    toll = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    other = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    maint_linked = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, default='Available')  # e.g., 'Available', 'Completed'
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trip} - {self.vehicle} - {self.status}"
