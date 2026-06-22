from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
import json, re
from datetime import datetime, timedelta
from .models import WaitlistUser, Entry, FeedbackItem
from .serializer import WaitlistSerializer, EntrySerializer, FeedbackSerializer


def parse_entry_with_ai(raw_text):
    """
    Simple rule-based parser for V1.
    Replace this with Claude API call in V2.
    """
    text = raw_text.lower()

    # Detect category
    if any(w in text for w in ['remind', 'birthday', 'meeting', 'event', 'appointment', 'party']):
        category = 'event'
    elif any(w in text for w in ['placed', 'kept', 'put', 'left', 'stored', 'where is', 'find']):
        category = 'object'
    elif any(w in text for w in ['task', 'do', 'complete', 'finish', 'buy', 'call', 'email', 'submit']):
        category = 'task'
    else:
        category = 'reminder'

    # Detect importance (1-5)
    if any(w in text for w in ['urgent', 'asap', 'critical', 'must', 'important', 'deadline']):
        importance = 5
    elif any(w in text for w in ['soon', 'today', 'tonight', 'before']):
        importance = 4
    elif any(w in text for w in ['tomorrow', 'next']):
        importance = 3
    else:
        importance = 2

    # Try to extract a "when" date
    parsed_when = None
    today = datetime.now()

    if 'today' in text:
        parsed_when = today.replace(hour=18, minute=0, second=0)
    elif 'tomorrow' in text:
        parsed_when = (today + timedelta(days=1)).replace(hour=9, minute=0, second=0)
    elif 'next week' in text:
        parsed_when = (today + timedelta(days=7)).replace(hour=9, minute=0, second=0)

    # Extract "what" — first meaningful sentence fragment
    what = raw_text.split('.')[0].strip()
    if len(what) > 120:
        what = what[:120] + '...'

    # Extract "where" for objects
    where_match = re.search(r'(?:in|on|at|inside|under|behind|near)\s+(.{3,40}?)(?:\.|,|$)', text)
    parsed_where = where_match.group(1).strip() if where_match else ''

    return {
        'parsed_what': what,
        'parsed_when': parsed_when.isoformat() if parsed_when else None,
        'parsed_where': parsed_where,
        'category': category,
        'importance': importance,
    }


class WaitlistCountView(APIView):
    def get(self, request):
        count = WaitlistUser.objects.count()
        return Response({'count': count})


class WaitlistView(APIView):
    def post(self, request):
        data = request.data.copy()

        # Check if email already exists
        if WaitlistUser.objects.filter(email=data.get('email', '')).exists():
            user = WaitlistUser.objects.get(email=data['email'])
            return Response({
                'message': 'already_registered',
                'position': user.position,
                'referral_code': user.referral_code,
            }, status=status.HTTP_200_OK)

        serializer = WaitlistSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'success',
                'position': user.position,
                'referral_code': user.referral_code,
                'name': user.name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EntryListCreateView(APIView):
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'email required'}, status=400)
        entries = Entry.objects.filter(user_email=email, is_done=False)
        serializer = EntrySerializer(entries, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        raw_text = data.get('raw_text', '')

        if not raw_text.strip():
            return Response({'error': 'Tell me something first'}, status=400)

        # Parse the entry
        parsed = parse_entry_with_ai(raw_text)
        data.update(parsed)

        serializer = EntrySerializer(data=data)
        if serializer.is_valid():
            entry = serializer.save()
            return Response(EntrySerializer(entry).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=400)


class EntryDoneView(APIView):
    def patch(self, request, entry_id):
        try:
            entry = Entry.objects.get(id=entry_id)
            entry.is_done = True
            entry.save()
            return Response({'message': 'done'})
        except Entry.DoesNotExist:
            return Response({'error': 'not found'}, status=404)


class FeedbackView(APIView):
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'thank you'}, status=201)
        return Response(serializer.errors, status=400)


class HealthView(APIView):
    def get(self, request):
        return Response({'status': 'ok', 'version': 'v1'})