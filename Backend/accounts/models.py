from django.contrib.auth.models import AbstractUser
from django.db import models
import random

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('borrower', 'Borrower'),
    ]

    # Force email to be unique so it can be used for login
    email = models.EmailField(unique=True)

    # The instructor's requested fields
    address = models.CharField(max_length=255, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)

    # User role
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='borrower')

    # Email verification fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def generate_otp(self):
        """Generates a random 6-digit OTP and saves it to the user."""
        self.otp = str(random.randint(100000, 999999))
        self.save()

    def __str__(self):
        return self.email