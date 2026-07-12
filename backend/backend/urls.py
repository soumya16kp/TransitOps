from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('api/core/', include('core.urls')),
    path('api/vehicles/', include('vehicle_app.urls')),
    path('api/drivers/', include('driver_app.urls')),
    path('api/maintenance/', include('maintenance_app.urls')),
    path('api/expenses/', include('expenses.urls')),
]
