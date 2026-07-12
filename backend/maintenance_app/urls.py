from django.urls import path
from . import views

app_name = 'maintenance_app'

urlpatterns = [
    path('',         views.ServiceRecordListCreateView.as_view(), name='record-list-create'),
    path('<int:pk>/', views.ServiceRecordDetailView.as_view(),     name='record-detail'),
]
