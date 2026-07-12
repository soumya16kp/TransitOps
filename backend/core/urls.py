from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('protected/', views.ProtectedView.as_view(), name='protected'),
]