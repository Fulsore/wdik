from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Entry, FeedbackItem, WaitlistUser

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'email',
            'name',
            'password',
            'lifestyle',
            'forget_type',
            'referred_by'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'name',
            'lifestyle',
            'forget_type',
            'is_2fa_enabled',
            'is_2fa_verified',
            'referral_code',
            'referral_count',
            'created_at'
        ]

        read_only_fields = [
            'id',
            'referral_code',
            'referral_count',
            'created_at'
        ]
        
        
        
        
        
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
        fields = [
            'id',
            'raw_text',
            'input_mode',
            'parsed_what',
            'parsed_when',
            'parsed_when_display',
            'parsed_where',
            'category',
            'importance',
            'ai_response',
            'is_done',
            'created_at'
        ]

        read_only_fields = [
            'id',
            'created_at',
            'parsed_what',
            'parsed_when',
            'parsed_where',
            'category',
            'importance',
            'ai_response'
        ]

    def get_parsed_when_display(self, obj):
        if obj.parsed_when:
            return obj.parsed_when.strftime('%d %b %Y, %I:%M %p')
        return None
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackItem
        fields = [
            'id',
            'message',
            'created_at'
        ]

        read_only_fields = [
            'id',
            'created_at'
        ]