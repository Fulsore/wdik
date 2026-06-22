from django.contrib import admin
from .models import WaitlistUser, Entry, FeedbackItem

@admin.register(WaitlistUser)
class WaitlistUserAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'forget_type', 'position', 'referral_code', 'created_at']
    search_fields = ['name', 'email']
    ordering = ['position']

@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'parsed_what', 'category', 'importance', 'is_done', 'created_at']
    list_filter = ['category', 'is_done', 'importance']
    search_fields = ['user_email', 'raw_text', 'parsed_what']

@admin.register(FeedbackItem)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['email', 'message', 'created_at']