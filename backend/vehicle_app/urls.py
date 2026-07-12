from django.urls import path
from . import views

app_name = 'vehicle_app'

urlpatterns = [
    path('',                  views.VehicleListCreateView.as_view(), name='vehicle-list-create'),
    path('choices/',          views.VehicleChoicesView.as_view(),    name='vehicle-choices'),
    path('documents/upload/', views.VehicleDocumentUploadView.as_view(), name='document-upload'),
    path('documents/<int:pk>/', views.VehicleDocumentDeleteView.as_view(), name='document-delete'),
    path('<int:pk>/',         views.VehicleDetailView.as_view(),     name='vehicle-detail'),
]
