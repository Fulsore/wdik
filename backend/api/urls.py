from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.HealthView.as_view(), name='health'),
    path('waitlist/count/', views.WaitlistCountView.as_view(), name='waitlist-count'),
    path('waitlist/', views.WaitlistView.as_view(), name='waitlist'),
    path('entries/', views.EntryListCreateView.as_view(), name='entries'),
    path('entries/<uuid:entry_id>/done/', views.EntryDoneView.as_view(), name='entry-done'),
    path('feedback/', views.FeedbackView.as_view(), name='feedback'),
]