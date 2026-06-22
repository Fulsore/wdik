from django.db import models
import uuid


class WaitlistUser(models.Model):
    """People who sign up before launch"""
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

    def __str__(self):
        return f"{self.name} <{self.email}>"

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random, string
            self.referral_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not self.position:
            self.position = WaitlistUser.objects.count() + 1
        super().save(*args, **kwargs)


class Entry(models.Model):
    """A brain dump — thing the user wants remembered"""
    CATEGORY_CHOICES = [
        ('task', 'Task'),
        ('event', 'Event'),
        ('object', 'Object / location'),
        ('reminder', 'Reminder'),
        ('other', 'Other'),
    ]
    IMPORTANCE_CHOICES = [(i, str(i)) for i in range(1, 6)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_email = models.EmailField()
    raw_text = models.TextField()
    parsed_what = models.CharField(max_length=300, blank=True)
    parsed_when = models.DateTimeField(null=True, blank=True)
    parsed_where = models.CharField(max_length=300, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    importance = models.PositiveIntegerField(choices=IMPORTANCE_CHOICES, default=3)
    is_done = models.BooleanField(default=False)
    reminded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_email}: {self.parsed_what or self.raw_text[:50]}"


class FeedbackItem(models.Model):
    """Inline feedback from dashboard"""
    email = models.EmailField(blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback from {self.email or 'anonymous'}: {self.message[:60]}"