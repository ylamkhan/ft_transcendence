from allauth.socialaccount.adapter import DefaultSocialAccountAdapter, get_adapter
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if data.get('avatar'):
            user.avatar = data.get('avatar')
        return user
    
    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form=None)
        return user

class CustomIntraOAuth2Adapter(OAuth2Adapter):
    provider_id = "intra"
    api_url = "https://api.intra.42.fr"

    access_token_url = f"{api_url}/oauth/token"
    authorize_url = f"{api_url}/oauth/authorize"
    profile_url = f"{api_url}/v2/me"

    def complete_login(self, request, app, token, **kwargs):
        headers = {"Authorization": f"Bearer {token.token}"}
        resp = get_adapter().get_requests_session().get(self.profile_url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return self.get_provider().sociallogin_from_response(request, data)
