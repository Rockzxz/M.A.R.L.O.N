from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import CustomUser 

class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'borrower') # Default role

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_verified:
                return Response({"error": "User with this email already exists and is verified."}, status=status.HTTP_400_BAD_REQUEST)
            # If user exists but is NOT verified, delete the old record so they can try again
            existing_user.delete()

        try:
            # Create user as inactive until verified
            user = CustomUser.objects.create_user(
                username=email, # Using email as username for simplicity, adjust if needed
                email=email,
                password=password,
                role=role,
                is_active=False, # Important: user is inactive until OTP is verified
                is_verified=False # Custom field for OTP verification status
            )
            user.generate_otp() # Generates OTP and saves it to the user

            # Send OTP via email
            send_mail(
                "Your Account Verification Code",
                f"Your verification code is: {user.otp}",
                settings.DEFAULT_FROM_EMAIL, # Uses the email defined in settings.py
                [email],
                fail_silently=False,
            )
            return Response({"message": "Registration successful. OTP sent to your email for verification."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "address": user.address,
            "age": user.age,
            "birthday": user.birthday,
        })

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_provided = request.data.get('otp')

        try:
            user = CustomUser.objects.get(email=email)
            if user.otp == otp_provided:
                user.is_active = True
                user.is_verified = True
                user.otp = None # Clear OTP after successful verification
                user.save()
                return Response({"message": "Account successfully activated!"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

      
        user = authenticate(request, email=email, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "Please verify your OTP first."}, status=status.HTTP_400_BAD_REQUEST)
            
            
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)