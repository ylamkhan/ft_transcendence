from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import UserDetailsSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer
from allauth.account.adapter import get_adapter
from allauth.account import app_settings as allauth_account_settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import URLValidator, ValidationError
from .models import *
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.contrib.auth import get_user_model
from django.utils.text import slugify
import random
from django.core.mail import send_mail
from dj_rest_auth.serializers import PasswordResetSerializer
import svgwrite
import urllib.parse
from django.core.files.base import ContentFile

UserModel = get_user_model()

class CustomRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=allauth_account_settings.EMAIL_REQUIRED)
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    username = serializers.CharField(read_only=True)

    def validate(self, data):
        data['first_name'] = self._validate_name_field(data.get('first_name'), 'first name')
        data['last_name'] = self._validate_name_field(data.get('last_name'), 'last name')
        data['email'] = super().validate_email(data.get('email'))
        data['password1'] = super().validate_password1(data.get('password1'))
        data['password2'] = super().validate_password1(data.get('password2'))
        if data['password1'] != data['password2']:
            raise serializers.ValidationError(_("The two password fields didn't match."))
        return data
    
    def validate_email(self, email):
        email = get_adapter().clean_email(email)
        if allauth_account_settings.UNIQUE_EMAIL:
            if email and UserModel.objects.filter(email=email).exists():
                raise serializers.ValidationError(
                    _('A user is already registered with this e-mail address.'),
                )
        return email

    def _validate_name_field(self, value, field_name):
        if value and '@' in value:
            raise serializers.ValidationError(_(f'Invalid {field_name}.'))
        return value

    def generate_username(self, first_name, last_name):
        base_username = f"{last_name[0]}{first_name}".lower()
        counter = 1
        username = f"{base_username}{counter}"[:30]
        
        while User.objects.filter(username=username).exists():
            counter += 1
            username = f"{base_username}{counter}"[:30]
        
        return username

    def get_cleaned_data(self):
        first_name = self.validated_data.get('first_name', '')
        last_name = self.validated_data.get('last_name', '')
        return {
            'first_name': first_name,
            'last_name': last_name,
            'username': self.generate_username(first_name, last_name),
            'password1': self.validated_data.get('password1', ''),
            'email': self.validated_data.get('email', ''),
        }

    def generate_svg_avatar(self, first_name, last_name):
        color_map = {
            'A': '#FF5733', 'B': '#33FF57', 'C': '#3357FF', 'D': '#FF33A1', 'E': '#33FFF5',
            'F': '#FF8C33', 'G': '#8C33FF', 'H': '#33FF8C', 'I': '#FF3333', 'J': '#33FF33',
            'K': '#5733FF', 'L': '#FF33E1', 'M': '#33D1FF', 'N': '#FF7033', 'O': '#A133FF',
            'P': '#33FFBD', 'Q': '#FF3360', 'R': '#33FF7F', 'S': '#337AFF', 'T': '#FF3391',
            'U': '#33FFD6', 'V': '#FFAD33', 'W': '#B233FF', 'X': '#33FFC2', 'Y': '#FF3357',
            'Z': '#33FF99'
        }

        initials = f"{first_name[0].upper()}{last_name[0].upper()}"
        background_color = color_map.get(initials[0], "#FFFFFF")

        dwg = svgwrite.Drawing(size=("100px", "100px"), profile='tiny')
        dwg.add(dwg.rect(insert=(0, 0), size=("100px", "100px"), fill=background_color))

        y_position = 60
        dwg.add(dwg.text(initials,
                        insert=(50, y_position),
                        text_anchor="middle",
                        font_size="40px",
                        fill="#FFFFFF",
                        font_family="Arial"))

        return dwg.tostring()

    def save(self, request):
        user = super().save(request)
        user.initialize_fake_daily_winning_rates()
        first_name = self.validated_data.get('first_name', '')
        last_name = self.validated_data.get('last_name', '')
        svg_content = self.generate_svg_avatar(first_name, last_name)
        svg_file = ContentFile(svg_content.encode('utf-8'))
        user.avatar.save('avatar.svg', svg_file)
        user.save()
        return user

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "password1", "password2"]

class CustomPasswordResetSerializer(PasswordResetSerializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        self.user = User.objects.filter(email=email).first()
        if not self.user:
            raise serializers.ValidationError(_("This email address is not registered."))
        return email

    def save(self):
        reset_code = random.randint(100000, 999999)
        self.user.reset_password_pin = reset_code
        self.user.save()

        send_mail(
            subject="Password Reset Code",
            message=f"Your password reset code is: {reset_code}",
            from_email="ylamkhantar086@gmail.com",
            recipient_list=[self.user.email],
            fail_silently=False,
        )

class CustomPasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    uid = None
    email = serializers.CharField()

    class Meta:
        fields = ["new_password1", "new_password2", "email", "token"]

    def validate(self, attrs):
        self.user = self._get_user_by_email(attrs.get('email'))
        if not self.user.reset_password_pin == attrs.get('token'):
            raise DRFValidationError({'token': [_('Invalid token')]})
        self._initialize_set_password_form(attrs)
        self.custom_validation(attrs)
        self.user.reset_password_pin = ""
        self.user.save()
        return attrs

    def _get_user_by_email(self, email):
        try:
            return UserModel._default_manager.get(email=email)
        except UserModel.DoesNotExist:
            raise DRFValidationError({'email': [_('Invalid email address')]})

    def _initialize_set_password_form(self, attrs):
        self.set_password_form = self.set_password_form_class(user=self.user, data=attrs)
        if not self.set_password_form.is_valid():
            raise serializers.ValidationError(self.set_password_form.errors)

    def save(self):
        return self.set_password_form.save()

class MyUserDetailsSerializer(UserDetailsSerializer):
    match_history = serializers.SerializerMethodField()
    tournament_history = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        extra_fields = [
            'username', 'email', 'first_name', 'last_name', 'date_of_birth',
            'country_select', 'status', 'is_online', 'avatar', 'about', 'xp', 'win', 
            'draw', 'lose', 'total_match', 'level', 'level_progress', 
            'daily_winning_rates', 'tfa_enabled', 'nickname'
        ]
        fields = ('pk', *extra_fields, 'match_history', 'tournament_history', 'achievements')
        read_only_fields = ('email', 'username', 'status')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        avatar_url = instance.avatar
        representation['avatar'] = self._get_avatar_url(avatar_url)
        
        representation['is_online'] = instance.is_online
        representation['tfa_enabled'] = instance.tfa_enabled

        if representation['total_match'] != 0:
            representation['win'] = round((representation['win'] / representation['total_match']) * 100, 2)
            representation['lose'] = round((representation['lose'] / representation['total_match']) * 100, 2)
            representation['draw'] = round((representation['draw'] / representation['total_match']) * 100, 2)

        xp = representation.get('xp', 0)
        level = representation.get('level', 1)
        
        if instance.level_progress >= 100:
            representation['level'] += 1
            representation['level_progress'] = 0
            self.create_achivement(representation['level'], instance)

            instance.level = representation['level']
            instance.level_progress = 0
            instance.save()

        representation['level_progress'] = instance.level_progress
        daily_winning_rates = self.get_daily_winning_rates(instance)
        representation['daily_winning_rates'] = daily_winning_rates

        achievements = self.get_achievements(instance)
        representation['achievements'] = achievements

        return representation

    def create_achivement(self, level, user):
        Achievement.objects.create(
            user=user,
            achievement_type=f'Level Up to Level {level}',
            description=f'Your level is up to {level}'
        )

    def _get_avatar_url(self, avatar_url):
        if avatar_url:
            try:
                URLValidator()(str(avatar_url))
                return str(avatar_url)
            except ValidationError:
                return avatar_url.url
        return None

    def get_daily_winning_rates(self, instance):
        instance.initialize_fake_daily_winning_rates()
        rates_data = instance.daily_winning_rates
        labels = [date for date, rate in reversed(rates_data)]
        rates = [rate for date, rate in reversed(rates_data)]
        return {'labels': labels, 'rates': rates}

    def get_match_history(self, user):
        pingpong_history = OneToOneHistory.objects.filter(
            (models.Q(player1=user.username) | models.Q(player2=user.username)) & models.Q(game_type='pingpong')
        ).order_by('-date_played')

        tictactoe_history = OneToOneHistory.objects.filter(
            (models.Q(player1=user.username) | models.Q(player2=user.username)) & models.Q(game_type='tictactoe')
        ).order_by('-date_played')

        pingpong_data = OneToOneHistorySerializer(pingpong_history, many=True).data
        tictactoe_data = OneToOneHistorySerializer(tictactoe_history, many=True).data

        return {
            'pingpong': pingpong_data,
            'tictactoe': tictactoe_data
        }

    def get_tournament_history(self, user):
        history = TournamentHistory.objects.filter(user=user.username)
        return TournamentParticipationSerializer(history, many=True).data

    def get_achievements(self, user):
        achievements = Achievement.objects.filter(user=user).order_by('-date_awarded')
        return [
            {
                'achievement_type': achievement.achievement_type,
                'description': achievement.description,
                'date_awarded': achievement.date_awarded
            }
            for achievement in achievements
        ]



class FriendDetailSerializer(MyUserDetailsSerializer):
    match_history = serializers.SerializerMethodField()
    tournament_history = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'date_of_birth', 'country_select', 'status', 'avatar', 'about', 
            'xp', 'win', 'draw', 'lose', 'total_match', 'level', 
            'level_progress', 'daily_winning_rates', 'tfa_enabled',
            'match_history', 'tournament_history', 'achievements'
        ]
        read_only_fields = ('email', 'username', 'status')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['avatar'] = self._get_avatar_url(instance.avatar)

        total_match = representation.get('total_match', 0)
        if total_match > 0:
            representation['win'] = round((representation['win'] / total_match) * 100, 2)
            representation['lose'] = round((representation['lose'] / total_match) * 100, 2)
            representation['draw'] = round((representation['draw'] / total_match) * 100, 2)

        xp = representation.get('xp', 0)
        level = representation.get('level', 1)
        
        if instance.level_progress >= 100:
            representation['level'] += 1
            representation['level_progress'] = 0
            self.create_achivement(representation['level'], instance)

            instance.level = representation['level']
            instance.level_progress = 0
            instance.save()

        representation['level_progress'] = instance.level_progress

        representation['daily_winning_rates'] = self.get_daily_winning_rates(instance)

        representation['match_history'] = self.get_match_history(instance)
        representation['tournament_history'] = self.get_tournament_history(instance)
        representation['achievements'] = self.get_achievements(instance)

        return representation

    def create_achivement(self, level, user):
        Achievement.objects.create(
            user=user,
            achievement_type=f'Level Up to Level {level}',
            description=f'Your level is up to {level}'
        )

    def get_daily_winning_rates(self, instance):
        if hasattr(instance, 'initialize_fake_daily_winning_rates'):
            instance.initialize_fake_daily_winning_rates()

        rates_data = getattr(instance, 'daily_winning_rates', [])
        if not rates_data:
            return {'labels': [], 'rates': []}

        labels = [date for date, rate in reversed(rates_data)]
        rates = [rate for date, rate in reversed(rates_data)]

        return {
            'labels': labels,
            'rates': rates
        }

    def get_match_history(self, user):
        pingpong_history = OneToOneHistory.objects.filter(
            (models.Q(player1=user.username) | models.Q(player2=user.username)) & models.Q(game_type='pingpong')
        ).order_by('-date_played')

        tictactoe_history = OneToOneHistory.objects.filter(
            (models.Q(player1=user.username) | models.Q(player2=user.username)) & models.Q(game_type='tictactoe')
        ).order_by('-date_played')

        pingpong_data = OneToOneHistorySerializer(pingpong_history, many=True).data
        tictactoe_data = OneToOneHistorySerializer(tictactoe_history, many=True).data

        return {
            'pingpong': pingpong_data,
            'tictactoe': tictactoe_data
        }

    def get_tournament_history(self, user):
        history = TournamentHistory.objects.filter(user=user.username)
        return TournamentParticipationSerializer(history, many=True).data

    def get_achievements(self, user):
        achievements = Achievement.objects.filter(user=user).order_by('-date_awarded')
        return [
            {
                'achievement_type': achievement.achievement_type,
                'description': achievement.description,
                'date_awarded': achievement.date_awarded
            }
            for achievement in achievements
        ]

class OneToOneHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OneToOneHistory
        fields = ['game_type', 'player1', 'player2', 'score1', 'score2', 'player1_avatar', 'player2_avatar', 'winner', 'loser', 'date_played']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['date_played'] = instance.date_played.strftime('%Y-%m-%d %H:%M:%S')
        representation['player1_avatar'] = self._get_avatar_url(instance.player1_avatar)
        representation['player2_avatar'] = self._get_avatar_url(instance.player2_avatar)
        return representation

    def _get_avatar_url(self, avatar_url):
        if avatar_url:
            try:
                URLValidator()(str(avatar_url))
                return str(avatar_url)
            except ValidationError:
                return avatar_url.url
        return None

class TournamentParticipationSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name')  # Maps the tournament's name
    joined_date = serializers.DateTimeField(source='joined_at', format="%Y-%m-%d %H:%M:%S", required=False)  # Optional field

    class Meta:
        model = RemoteParticipant
        fields = ['tournament_name', 'joined_date']  # Include all fields you want to expose

class BlockedUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='blocked.username')
    avatar = serializers.CharField(source='blocked.avatar', default='https://via.placeholder.com/150')
    id = serializers.IntegerField(source='blocked.id')

    class Meta:
        model = BlockedUser
        fields = ['id', 'username', 'avatar']

class ProfilesSerSerializer(serializers.ModelSerializer):
    is_friend = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'date_of_birth', 'country_select', 'status', 'avatar', 'about', 'is_friend', 'xp', 'win', 'draw', 'lose')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        avatar_url = instance.avatar
        representation['avatar'] = self._get_avatar_url(avatar_url)
        return representation

    def _get_avatar_url(self, avatar_url):
        if avatar_url:
            try:
                URLValidator()(str(avatar_url))
                return str(avatar_url)
            except ValidationError:
                return avatar_url.url
        return None
