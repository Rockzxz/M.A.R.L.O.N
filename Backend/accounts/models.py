from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Force email to be unique so it can be used for login
    email = models.EmailField(unique=True)
    
    # The instructor's requested fields
    address = models.CharField(max_length=255, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)

    # Tell Django to use 'email' instead of 'username' for logging in
    USERNAME_FIELD = 'email'
    # 'username' is required by default, so we leave it in REQUIRED_FIELDS for terminal superusers
    REQUIRED_FIELDS = ['username'] 

    def __str__(self):
        return self.email