from django.contrib import admin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display  = ("username", "email", "first_name", "last_name", "user_type", "is_active", "is_email_verified", "date_joined")
    list_filter   = ("user_type", "is_active", "is_email_verified", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering      = ("-date_joined",)
    readonly_fields = ("date_joined", "setupkey", "password_changed_on_temp_key_access")

    fieldsets = (
        ("Account", {
            "fields": ("username", "email", "password")
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name", "phone_number", "country", "gender")
        }),
        ("Roles & Status", {
            "fields": ("user_type", "is_active", "is_staff", "is_superuser", "is_email_verified")
        }),
        ("Setup", {
            "fields": ("setupkey", "password_changed_on_temp_key_access")
        }),
        ("Permissions", {
            "fields": ("groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Dates", {
            "fields": ("date_joined", "last_login")
        }),
    )
