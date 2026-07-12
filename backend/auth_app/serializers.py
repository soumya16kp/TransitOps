from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'phone_number',
            'role', 'role_display', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'is_active', 'created_at', 'role_display']

    def get_role_display(self, obj):
        return obj.get_role_display()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'phone_number', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        # ── Bug-fix: avoid create_user() positional-arg mismatch ────────────
        # AbstractUser.create_user(username, email, password) doesn't match
        # our custom model where USERNAME_FIELD='email'.  Use safe pattern:
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email    = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password,
            )
            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".'
            )

        attrs['user'] = user
        return attrs


class TokenSerializer(serializers.Serializer):
    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = UserSerializer()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        self.refresh_token = attrs.get('refresh')
        return attrs