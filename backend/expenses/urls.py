from django.urls import path
from . import views

urlpatterns = [
    path('fuel/', views.FuelLogListCreateAPIView.as_view(), name='fuel-list-create'),
    path('other/', views.ExpenseListCreateAPIView.as_view(), name='expense-list-create'),
    path('summary/', views.ExpenseSummaryAPIView.as_view(), name='expense-summary'),
]
