from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid
import pyotp


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    LIFESTYLE_CHOICES = [
        ('student', 'Student'),
        ('professional', 'Working Professional'),
        ('parent', 'Parent / Caregiver'),
        ('other', 'Other'),
    ]
    FORGET_CHOICES = [
        ('keys', 'Keys / wallet / phone'),
        ('tasks', 'Tasks and deadlines'),
        ('events', 'Events and birthdays'),
        ('objects', 'Where I put things'),
        ('other', 'Everything honestly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    lifestyle = models.CharField(max_length=20, choices=LIFESTYLE_CHOICES, default='other')
    forget_type = models.CharField(max_length=20, choices=FORGET_CHOICES, default='other')

    # 2FA
    totp_secret = models.CharField(max_length=64, blank=True)
    is_2fa_enabled = models.BooleanField(default=False)
    is_2fa_verified = models.BooleanField(default=False)

    # Auth
    is_email_verified = models.BooleanField(default=False)
    email_verify_token = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Referral
    referral_code = models.CharField(max_length=12, unique=True, blank=True)
    referred_by = models.CharField(max_length=12, blank=True, null=True)
    referral_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    def __str__(self):
        return f"{self.name} <{self.email}>"

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random, string
            self.referral_code = ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=8)
            )
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
        super().save(*args, **kwargs)

    def get_totp_uri(self):
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email, issuer_name='Where App'
        )

    def verify_totp(self, code: str) -> bool:
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code, valid_window=1)

    class Meta:
        ordering = ['-created_at']


class Entry(models.Model):
    CATEGORY_CHOICES = [
        ('task', 'Task'),
        ('event', 'Event'),
        ('object', 'Object / location'),
        ('reminder', 'Reminder'),
        ('query', 'Query'),
        ('other', 'Other'),
    ]
    IMPORTANCE_CHOICES = [(i, str(i)) for i in range(1, 6)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entries')
    raw_text = models.TextField()
    input_mode = models.CharField(max_length=10, default='text', choices=[('text','Text'),('voice','Voice')])

    # Parsed fields
    parsed_what = models.CharField(max_length=400, blank=True)
    parsed_when = models.DateTimeField(null=True, blank=True)
    parsed_where = models.CharField(max_length=400, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    importance = models.PositiveIntegerField(choices=IMPORTANCE_CHOICES, default=3)

    # AI response — what Help says back to user
    ai_response = models.TextField(blank=True)

    # Status
    is_done = models.BooleanField(default=False)
    reminded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email}: {self.parsed_what or self.raw_text[:60]}"


class WaitlistUser(models.Model):
    """V1 waitlist — kept for migration continuity"""
    FORGET_CHOICES = [
        ('keys', 'Keys / wallet / phone'),
        ('tasks', 'Tasks and deadlines'),
        ('events', 'Events and birthdays'),
        ('objects', 'Where I put things'),
        ('other', 'Everything honestly'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    forget_type = models.CharField(max_length=20, choices=FORGET_CHOICES)
    referral_code = models.CharField(max_length=12, unique=True)
    referred_by = models.CharField(max_length=12, blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random, string
            self.referral_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not self.position:
            self.position = WaitlistUser.objects.count() + 1
        super().save(*args, **kwargs)


class FeedbackItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback: {self.message[:60]}"