from django.contrib import admin
from .models import (
    ChurchLeader, ChurchLeaderContact, BlogTag, Blog,
    Event, Service, MinistryWork, GalleryImage, Testimony, ActivityLog,
)

@admin.register(ChurchLeader)
class ChurchLeaderAdmin(admin.ModelAdmin):
    list_display  = ["full_name", "position", "is_active", "created_at"]
    list_filter   = ["is_active"]
    search_fields = ["first_name", "last_name", "position"]


@admin.register(ChurchLeaderContact)
class ChurchLeaderContactAdmin(admin.ModelAdmin):
    list_display = ["leader", "phone_number_1", "email_address_1"]


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display  = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display  = ["title", "status", "published_at", "created_at"]
    list_filter   = ["status"]
    search_fields = ["title"]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display  = ["title", "start_date", "status"]
    list_filter   = ["status"]
    search_fields = ["title"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display  = ["title", "start_time", "day_of_week", "runs_every_day"]


@admin.register(MinistryWork)
class MinistryWorkAdmin(admin.ModelAdmin):
    list_display  = ["title", "type", "date"]
    list_filter   = ["type"]


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display  = ["__str__", "caption", "created_at"]


@admin.register(Testimony)
class TestimonyAdmin(admin.ModelAdmin):
    list_display  = ["name", "date", "is_approved"]
    list_filter   = ["is_approved"]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display  = ["user", "action", "model_name", "object_repr", "created_at"]
    list_filter   = ["action", "model_name"]
    readonly_fields = ["user", "action", "model_name", "object_id", "object_repr", "description", "ip_address", "created_at"]