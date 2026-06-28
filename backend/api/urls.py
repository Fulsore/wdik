from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Health
    path('health/', views.HealthView.as_view()),

    # Auth
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/logout/', views.LogoutView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view()),

    # 2FA
    path('auth/2fa/setup/', views.TwoFASetupView.as_view()),
    path('auth/2fa/disable/', views.TwoFADisableView.as_view()),

    # Entries
    path('entries/', views.EntryListCreateView.as_view()),
    path('entries/<uuid:entry_id>/done/', views.EntryDoneView.as_view()),

    # Feedback
    path('feedback/', views.FeedbackView.as_view()),

    # Waitlist (V1 compat)
    path('waitlist/', views.WaitlistView.as_view()),
    path('waitlist/count/', views.WaitlistCountView.as_view()),
]