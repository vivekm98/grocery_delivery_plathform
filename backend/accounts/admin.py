from django.contrib import admin
from .models import EmailOTP, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "phone")
    search_fields = ("user__username", "user__email", "phone")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "otp", "is_used", "created_at")
    list_filter = ("is_used", "created_at")
    search_fields = ("email",)
