from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('protected/', views.ProtectedView.as_view(), name='protected'),
    path('permissions/', views.RolePermissionListUpdateView.as_view(), name='permissions'),
    path('analytics/', views.AnalyticsSummaryView.as_view(), name='analytics'),
]