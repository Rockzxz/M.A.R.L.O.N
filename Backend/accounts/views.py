from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer

# 1. THE LOGIN API
class LoginView(views.APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(request, username=email, password=password)

        if user:
            # Give the user a secure token
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

# 2. THE PROFILE API
class ProfileView(views.APIView):
    # You MUST be logged in to see this
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user automatically knows who is calling based on their Token
        serializer = UserSerializer(request.user)
        return Response(serializer.data)