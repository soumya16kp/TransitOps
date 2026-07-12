from django.urls import path
from . import views

app_name = 'driver_app'

urlpatterns = [
    path('',          views.DriverListCreateView.as_view(), name='driver-list-create'),
    path('choices/',  views.DriverChoicesView.as_view(),    name='driver-choices'),
    path('<int:pk>/', views.DriverDetailView.as_view(),     name='driver-detail'),
]
