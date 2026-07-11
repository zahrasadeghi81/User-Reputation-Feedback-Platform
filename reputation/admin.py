from django.contrib import admin

from .models import Feedback, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "emoji", "bg_color", "created_at")
    search_fields = ("user__username",)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "score", "created_at")
    list_filter = ("score", "created_at")
    search_fields = ("from_user__username", "to_user__username", "comment")
