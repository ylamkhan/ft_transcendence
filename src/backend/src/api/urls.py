from django.contrib import admin
from django.urls import path, re_path, include
from dj_rest_auth.registration.views import RegisterView, VerifyEmailView, ResendEmailVerificationView
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView, PasswordChangeView, PasswordResetView, PasswordResetConfirmView
from accounts.serializers import CustomPasswordResetSerializer, CustomPasswordResetConfirmSerializer
from accounts.views import *

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path("api/register/", RegisterView.as_view(), name="rest_register"),
    path("api/login/", LoginView.as_view(), name="rest_login"),
    path("api/logout/", LogoutView.as_view(), name="rest_logout"),
    path("api/user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("api/otp/check/", OtpCheck, name="otp_check"),
    path("api/otp/verify/", OtpVerify, name="otp_verify"),
    path("api/enabletfa/", TfaEnable, name="tfa_enable"),
    path("api/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
    path('api/resend-email/', ResendEmailVerificationView.as_view(),
         name="rest_resend_email"),
    re_path(
        r'^api/account-confirm-email/', VerifyEmailView.as_view(),
        name='account_confirm_email',
    ),
    path('api/password/reset/', PasswordResetView.as_view(serializer_class=CustomPasswordResetSerializer), name='rest_password_reset'),
    path('api/password/reset/confirm/', PasswordResetConfirmView.as_view(serializer_class=CustomPasswordResetConfirmSerializer), name='password_reset_confirm'),
    path("", include('accounts.urls')),
    path("", include('chatapp.urls')),

    path('', include('oauth2.urls')),
    path('api/users/', get_all_users, name='get_all_users'),
]

from dj_rest_auth.app_settings import api_settings
if api_settings.USE_JWT:
    from rest_framework_simplejwt.views import TokenVerifyView
    from dj_rest_auth.jwt_auth import get_refresh_view

    urlpatterns += [
        path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
        path('api/token/refresh/', get_refresh_view().as_view(), name='token_refresh'),
    ]

from accounts.views import send_friend_request

urlpatterns += [
    path('api/friend-request/', send_friend_request, name='send_friend_request'),
    path('api/friend-requests/', get_friend_requests, name='get_friend_requests'),
    path("api/get-friends/", get_friends, name="get_friends"),
    path("api/get-chats/", get_chats, name="get_chats"),
    path("api/get-online-friends/", get_online_friends, name="get_online_friends"),
    path("api/get-notifications/", get_notifications, name="get_notifications"),
    path('api/accept-friend-request/<int:request_id>/', accept_friend_request, name='accept_friend_request'),
    path('api/reject-friend-request/<int:request_id>/', reject_friend_request, name='reject_friend_request'),
    path('api/disconnect-friend/<str:username>/', disconnect_friend, name='disconnect_friend'),
    path('api/block-friend/<str:username>/', block_friend, name='block_friend'),
    path('api/unblock-friend/<str:username>/', unblock_friend, name='unblock_friend'),
    path('api/users/search', search_users, name='search_users'),
    path('api/blocked-users/', get_blocked_users, name='get_blocked_users'),
    path('api/user/<int:user_id>/profile/', user_profile, name='user_profile'),
    path('api/targetuser/<int:user_id>/discussion/', get_target_discussion, name='get_target_discussion'),
    path('api/mark-message-read/', mark_message_read, name='mark_message_read'),
    path('api/mark-notification-read/', mark_notification_read, name='mark_notification_read'),
    path('api/mark-notification-treated/', mark_notification_treated, name='mark_notification_treated'),
    path('api/check-tournament-name/', check_tournament_name, name='check_tournament_name'),
    path('api/change-nickname/', change_nickname, name='change_nickname'),
]
