from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # Fields to display in the list view
    list_display = ['email', 'username', 'role', 'is_verified', 'is_staff']
    
    # Fieldsets for the edit page
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('role', 'otp', 'is_verified', 'address', 'age', 'birthday')}),
    )
    
    # Fieldsets for the creation page
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Extra Info', {'fields': ('role', 'is_verified', 'address', 'age', 'birthday')}),
    )
    
    ordering = ['email']

# Register the model
admin.site.register(CustomUser, CustomUserAdmin)
