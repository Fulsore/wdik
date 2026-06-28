import io
import base64
import qrcode

from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Entry, FeedbackItem, WaitlistUser
from .serializer import (
    RegisterSerializer,
    UserSerializer,
    EntrySerializer,
    FeedbackSerializer,
    WaitlistSerializer,
)

# DON'T add this yet
from .ai import parse_entry

User = get_user_model()


class WaitlistCountView(APIView):
    def get(self, request):
        count = WaitlistUser.objects.count()
        return Response({'count': count})
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

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

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        if User.objects.filter(
            email=serializer.validated_data["email"]
        ).exists():
            return Response(
                {"email": ["Email already exists."]},
                status=400,
            )

        user = serializer.save()

        tokens = get_tokens(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=201,
        )
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")
        code = request.data.get("totp_code", "")

        user = authenticate(
            request,
            username=email,
            password=password,
        )

        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=401,
            )

        if user.is_2fa_enabled:

            if not code:
                return Response(
                    {"requires_2fa": True}
                )

            if not user.verify_totp(code):
                return Response(
                    {"error": "Invalid 2FA code"},
                    status=401,
                )

        tokens = get_tokens(user)

        return Response({
            "user": UserSerializer(user).data,
            "tokens": tokens,
        })
        
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                "message": "Logged out successfully"
            })

        except KeyError:
            return Response(
                {"error": "Refresh token required"},
                status=400,
            )

        except TokenError:
            return Response(
                {"error": "Invalid token"},
                status=400,
            )
            
class TwoFASetupView(APIView):
    permission_classes = [IsAuthenticated]

    # Step 1: Generate QR Code
    def get(self, request):
        uri = request.user.get_totp_uri()

        qr = qrcode.make(uri)

        buffer = io.BytesIO()
        qr.save(buffer, format="PNG")

        image = (
            "data:image/png;base64,"
            + base64.b64encode(buffer.getvalue()).decode()
        )

        return Response({
            "secret": request.user.totp_secret,
            "qr_code": image,
        })

    # Step 2: Verify code
    def post(self, request):
        code = request.data.get("code")

        if not code:
            return Response(
                {"error": "Code is required"},
                status=400,
            )

        if not request.user.verify_totp(code):
            return Response(
                {"error": "Invalid code"},
                status=400,
            )

        request.user.is_2fa_enabled = True
        request.user.is_2fa_verified = True
        request.user.save()

        return Response({
            "message": "2FA enabled successfully"
        })
class TwoFADisableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.is_2fa_enabled = False
        request.user.is_2fa_verified = False
        request.user.save()

        return Response({
            "message": "2FA disabled"
        })
        

class EntryListCreateView(APIView):

    def get(self, request):
        user = request.user

        if not user or not user.is_authenticated:
            return Response({"error": "unauthorized"}, status=401)

        entries = Entry.objects.filter(user=user, is_done=False)
        serializer = EntrySerializer(entries, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user

        if not user or not user.is_authenticated:
            return Response({"error": "unauthorized"}, status=401)

        data = request.data.copy()
        raw_text = data.get('raw_text', '')

        if not raw_text.strip():
            return Response({'error': 'Tell me something first'}, status=400)

        parsed = parse_entry(raw_text)
        data.update(parsed)

        serializer = EntrySerializer(data=data)

        if serializer.is_valid():
            entry = serializer.save(user=user)
            return Response(EntrySerializer(entry).data, status=201)

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
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "version": "v2"
        })