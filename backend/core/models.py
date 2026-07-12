from django.db import models

class RolePermission(models.Model):
    role_key = models.CharField(max_length=50, unique=True)
    role_name = models.CharField(max_length=100)
    fleet = models.CharField(max_length=10, default='—')
    driver = models.CharField(max_length=10, default='—')
    trips = models.CharField(max_length=10, default='—')
    fuel = models.CharField(max_length=10, default='—')
    analytics = models.CharField(max_length=10, default='—')

    def __str__(self):
        return f"{self.role_name} Permissions"
