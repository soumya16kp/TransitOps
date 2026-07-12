from rest_framework import generics, permissions, views, status
from rest_framework.response import Response
from django.db import models
from django.db.models import Sum
from django.db.models.functions import Coalesce
from core.permissions import FuelExpensesPermission
from .models import FuelLog, Expense
from .serializers import FuelLogSerializer, ExpenseSerializer

def ensure_seeded(user):
    if not FuelLog.objects.filter(user=user).exists() and not Expense.objects.filter(user=user).exists():
        FuelLog.objects.create(user=user, vehicle='VAN-05', date='2026-07-05', liters=42.00, fuel_cost=3150.00)
        FuelLog.objects.create(user=user, vehicle='TRUCK-11', date='2026-07-06', liters=110.00, fuel_cost=8400.00)
        FuelLog.objects.create(user=user, vehicle='MINI-08', date='2026-07-06', liters=28.00, fuel_cost=2050.00)
        Expense.objects.create(user=user, trip='TR001', vehicle='VAN-05', toll=120.00, other=0.00, maint_linked=0.00, status='Available')
        Expense.objects.create(user=user, trip='TR002', vehicle='TRK-12', toll=340.00, other=150.00, maint_linked=18000.00, status='Completed')

class FuelLogListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, FuelExpensesPermission]
    serializer_class = FuelLogSerializer

    def get_queryset(self):
        ensure_seeded(self.request.user)
        return FuelLog.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpenseListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, FuelExpensesPermission]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        ensure_seeded(self.request.user)
        return Expense.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpenseSummaryAPIView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, FuelExpensesPermission]

    def get(self, request):
        user = request.user
        ensure_seeded(user)
        
        fuel_sum = FuelLog.objects.filter(user=user).aggregate(
            total=Coalesce(Sum('fuel_cost'), 0.0, output_field=models.FloatField())
        )['total']
        
        expense_aggregates = Expense.objects.filter(user=user).aggregate(
            maint_sum=Coalesce(Sum('maint_linked'), 0.0, output_field=models.FloatField()),
            toll_sum=Coalesce(Sum('toll'), 0.0, output_field=models.FloatField()),
            other_sum=Coalesce(Sum('other'), 0.0, output_field=models.FloatField())
        )
        
        maint_sum = expense_aggregates['maint_sum']
        toll_sum = expense_aggregates['toll_sum']
        other_sum = expense_aggregates['other_sum']
        
        total_operational_cost = fuel_sum + maint_sum + toll_sum + other_sum
        
        return Response({
            'total_fuel': fuel_sum,
            'total_maint': maint_sum,
            'total_toll': toll_sum,
            'total_other': other_sum,
            'total_operational_cost': total_operational_cost
        }, status=status.HTTP_200_OK)
