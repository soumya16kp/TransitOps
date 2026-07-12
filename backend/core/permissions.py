from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.models import RolePermission

def check_db_permission(user, module_key, method):
    """
    Helper function to query RolePermission dynamically from DB.
    Admin gets full access ('✓').
    """
    if not user or not user.is_authenticated:
        return False
        
    role = user.role
    if role == 'admin':
        return True
        
    try:
        # Load permission row for this role
        perm = RolePermission.objects.get(role_key=role)
        val = getattr(perm, module_key, '—')
        
        if val == '✓':
            return True
        elif val == 'view':
            return method in SAFE_METHODS
        return False
    except RolePermission.DoesNotExist:
        # Fallback to deny access if role configuration is missing
        return False


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class FleetPermission(BasePermission):
    def has_permission(self, request, view):
        return check_db_permission(request.user, 'fleet', request.method)


class DriverPermission(BasePermission):
    def has_permission(self, request, view):
        return check_db_permission(request.user, 'driver', request.method)


class TripsPermission(BasePermission):
    def has_permission(self, request, view):
        return check_db_permission(request.user, 'trips', request.method)


class FuelExpensesPermission(BasePermission):
    def has_permission(self, request, view):
        return check_db_permission(request.user, 'fuel', request.method)


class AnalyticsPermission(BasePermission):
    def has_permission(self, request, view):
        return check_db_permission(request.user, 'analytics', request.method)

