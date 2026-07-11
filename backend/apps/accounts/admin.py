from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'username', 'email', 'created_at')
    readonly_fields = ('created_at',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra', {'fields': ('profile_photo', 'created_at')}),
    )
