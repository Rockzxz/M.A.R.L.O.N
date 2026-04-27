from django.urls import path
from .views import RegisterView, VerifyOTPView, ProfileView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('login/', LoginView.as_view(), name='login'),
]