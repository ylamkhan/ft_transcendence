from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.providers.oauth2.views import OAuth2LoginView, OAuth2CallbackView
from dj_rest_auth.registration.views import SocialLoginView

from .adapter import CustomIntraOAuth2Adapter
from django.conf import settings

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.GOOGLE_CALL_BACK_URL
    client_class = OAuth2Client

class IntraLogin(SocialLoginView):
    adapter_class = CustomIntraOAuth2Adapter
    callback_url = settings.INTRA_CALL_BACK_URL
    client_class = OAuth2Client

oauth2_login = OAuth2LoginView.adapter_view(CustomIntraOAuth2Adapter)
oauth2_callback = OAuth2CallbackView.adapter_view(CustomIntraOAuth2Adapter)

# https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-daec3084334d92240b34280c5bd30b55574b8d015a08689d920b9aa0d20c931f&redirect_uri=http://localhost:8080/login/intra/&response_type=code&scope=public&state=a_very_long_random_string_witchmust_be_unguessable
# https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=http://localhost:8080/login/google/&prompt=consent&response_type=code&client_id=160581963104-mln52d9gsik1ue1l52c420b854q6vi47.apps.googleusercontent.com&scope=openid%20email%20profile&access_type=offline
# https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-daec3084334d92240b34280c5bd30b55574b8d015a08689d920b9aa0d20c931f&redirect_uri=https://127.0.0.1:8000/login/intra/&response_type=code&scope=public&state=a_very_long_random_string_witchmust_be_unguessable
# https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https://127.0.0.1:8000/login/google/&prompt=consent&response_type=code&client_id=160581963104-mln52d9gsik1ue1l52c420b854q6vi47.apps.googleusercontent.com&scope=openid%20email%20profile&access_type=offline