import secrets
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
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    username = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    otp = serializers.CharField(write_only=True, min_length=6, max_length=6)

    class Meta:
        model = User
        fields = ['username', 'full_name', 'first_name', 'last_name', 'phone', 'email', 'password', 'otp']

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
        full_name = validated_data.pop("full_name", "").strip()
        phone = validated_data.pop("phone", "")
        otp_record = validated_data.pop("_otp_record", None)

        if full_name and not validated_data.get("first_name"):
            parts = full_name.split(None, 1)
            validated_data["first_name"] = parts[0]
            validated_data["last_name"] = parts[1] if len(parts) > 1 else ""

        if not validated_data.get("username"):
            base = validated_data["email"].split("@")[0][:20]
            username = base
            while User.objects.filter(username=username).exists():
                username = f"{base}_{secrets.randbelow(10000):04d}"
            validated_data["username"] = username

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


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="profile.phone", required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "phone"]
        read_only_fields = ["id", "username", "email"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if "phone" in profile_data:
            profile.phone = profile_data["phone"]
            profile.save()
        return instance

