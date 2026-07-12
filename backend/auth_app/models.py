from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # ── Role choices ────────────────────────────────────────────────────────
    FLEET_MANAGER    = 'fleet_manager'
    DISPATCHER       = 'dispatcher'
    SAFETY_OFFICER   = 'safety_officer'
    FINANCIAL_ANALYST = 'financial_analyst'
    ADMIN            = 'admin'

    ROLE_CHOICES = [
        (FLEET_MANAGER,    'Fleet Manager'),
        (DISPATCHER,       'Dispatcher'),
        (SAFETY_OFFICER,   'Safety Officer'),
        (FINANCIAL_ANALYST,'Financial Analyst'),
        (ADMIN,            'Admin'),
    ]

    email        = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role         = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default=DISPATCHER,
    )
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"