from django.contrib import admin
from .models import User, WaitlistUser, Entry, FeedbackItem


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'email',
        'lifestyle',
        'forget_type',
        'is_email_verified',
        'is_2fa_enabled',
        'created_at'
    ]
    search_fields = ['name', 'email']
    list_filter = [
        'lifestyle',
        'forget_type',
        'is_email_verified',
        'is_2fa_enabled'
    ]


@admin.register(WaitlistUser)
class WaitlistUserAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'email',
        'forget_type',
        'position',
        'referral_code',
        'created_at'
    ]
    search_fields = ['name', 'email']
    ordering = ['position']


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'parsed_what',
        'category',
        'importance',
        'is_done',
        'created_at'
    ]
    search_fields = [
        'user__email',
        'raw_text',
        'parsed_what'
    ]
    list_filter = [
        'category',
        'importance',
        'is_done'
    ]


@admin.register(FeedbackItem)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'message',
        'created_at'
    ]
    search_fields = [
        'user__email',
        'message'
    ]