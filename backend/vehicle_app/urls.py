from django.urls import path
from . import views

app_name = 'vehicle_app'

urlpatterns = [
    path('',          views.VehicleListCreateView.as_view(), name='vehicle-list-create'),
    path('choices/',  views.VehicleChoicesView.as_view(),    name='vehicle-choices'),
    path('<int:pk>/', views.VehicleDetailView.as_view(),     name='vehicle-detail'),
]
