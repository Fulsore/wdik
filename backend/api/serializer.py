from rest_framework import serializers
from .models import WaitlistUser, Entry, FeedbackItem


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistUser
        fields = ['id', 'name', 'email', 'forget_type', 'referral_code',
                  'referred_by', 'position', 'created_at']
        read_only_fields = ['id', 'referral_code', 'position', 'created_at']


class EntrySerializer(serializers.ModelSerializer):
    parsed_when_display = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = ['id', 'user_email', 'raw_text', 'parsed_what', 'parsed_when',
                  'parsed_when_display', 'parsed_where', 'category', 'importance',
                  'is_done', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_parsed_when_display(self, obj):
        if obj.parsed_when:
            return obj.parsed_when.strftime('%d %b %Y, %I:%M %p')
        return None


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackItem
        fields = ['id', 'email', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']