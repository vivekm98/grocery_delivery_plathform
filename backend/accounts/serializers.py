from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailOTP, UserProfile


def verify_and_get_otp(email: str, otp_code: str) -> EmailOTP:
    """Validate an unused, unexpired OTP record for the given email."""
    otp_record = (
        EmailOTP.objects.filter(email=email.lower(), otp=otp_code.strip(), is_used=False)
        .order_by("-created_at")
        .first()
    )
    if not otp_record:
        raise serializers.ValidationError({"otp": "Invalid OTP code."})

    if otp_record.is_expired():
        otp_record.is_used = True
        otp_record.save()
        raise serializers.ValidationError({"otp": "OTP has expired. Please request a new one."})

    return otp_record


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    otp = serializers.CharField(write_only=True, min_length=6, max_length=6)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'phone', 'email', 'password', 'otp']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        otp_code = attrs.get("otp", "")
        attrs["_otp_record"] = verify_and_get_otp(email, otp_code)
        return attrs

    def create(self, validated_data):
        validated_data.pop("otp", None)
        phone = validated_data.pop("phone", "")
        otp_record = validated_data.pop("_otp_record", None)

        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, phone=phone)

        if otp_record:
            otp_record.is_used = True
            otp_record.save()
        return user


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow users to log in with either their username or email address."""

    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "").strip()
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs[self.username_field] = user.username
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "email": self.user.email,
        }
        return data


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    purpose = serializers.ChoiceField(
        choices=["register", "login", "reset"],
        required=False,
        default="login",
    )


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)


class ResetPasswordWithOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError({"email": "No account found with this email."})

        attrs["_user"] = user
        attrs["_otp_record"] = verify_and_get_otp(email, attrs.get("otp", ""))
        return attrs

    def save(self):
        user = self.validated_data["_user"]
        otp_record = self.validated_data["_otp_record"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        otp_record.is_used = True
        otp_record.save()
        return user
