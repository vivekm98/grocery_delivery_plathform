from datetime import timedelta
import secrets
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailOTP
from .serializers import (
    EmailOrUsernameTokenObtainPairSerializer,
    LogoutSerializer,
    ResetPasswordWithOTPSerializer,
    SendOTPSerializer,
    UserProfileSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class LogoutView(APIView):
    """Blacklist the refresh token to securely log out the user."""

    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile details."""

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class SendOTPView(APIView):
    """Generate and email a 6-digit OTP valid for 5 minutes (with 60s cooldown)."""

    permission_classes = [AllowAny]
    serializer_class = SendOTPSerializer

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        purpose = serializer.validated_data.get("purpose", "login")

        if purpose == "register" and User.objects.filter(email__iexact=email).exists():
            return Response(
                {"email": ["A user with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if purpose == "reset" and not User.objects.filter(email__iexact=email).exists():
            return Response(
                {"email": ["No account found with this email."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        latest_otp = EmailOTP.objects.filter(email=email).order_by("-created_at").first()
        if latest_otp and timezone.now() < latest_otp.created_at + timedelta(seconds=60):
            return Response(
                {"error": "Please wait 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Invalidate previous unused OTPs for this email
        EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)

        otp_code = f"{secrets.randbelow(1000000):06d}"
        EmailOTP.objects.create(email=email, otp=otp_code)

        send_mail(
            subject="Your Grocery Delivery Verification Code",
            message=f"Your 6-digit OTP code is: {otp_code}\n\nThis code expires in 5 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response(
            {"message": "OTP sent successfully to your email."},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    """Verify a 6-digit OTP and issue JWT tokens if the user account exists."""

    permission_classes = [AllowAny]
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        otp_code = serializer.validated_data["otp"].strip()

        otp_record = (
            EmailOTP.objects.filter(email=email, otp=otp_code, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_record:
            return Response(
                {"error": "Invalid OTP code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.is_expired():
            otp_record.is_used = True
            otp_record.save()
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_record.is_used = True
        otp_record.save()

        user = User.objects.filter(email__iexact=email).first()
        if user:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "OTP verified. Logged in successfully.",
                    "verified": True,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "message": "Email verified successfully.",
                "verified": True,
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordWithOTPView(APIView):
    """Reset a user's password after verifying their Email OTP."""

    permission_classes = [AllowAny]
    serializer_class = ResetPasswordWithOTPSerializer

    def post(self, request):
        serializer = ResetPasswordWithOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password reset successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )
