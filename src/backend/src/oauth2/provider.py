from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider
from allauth.socialaccount.providers.google.provider import GoogleProvider
from accounts.models import User

class CustomGoogleProvider(GoogleProvider):
    def extract_common_fields(self, data):
        first_name = data.get("given_name", "")
        last_name = data.get("family_name", "")
        return dict(
            username=self.generate_username(first_name, last_name),
            email=data.get("email"),
            last_name=data.get("family_name"),
            first_name=data.get("given_name"),
            avatar=data['picture'],
        )
    def generate_username(self, first_name, last_name):
        base_username = f"{last_name[0]}{first_name}".lower()
        counter = 1
        username = f"{base_username}{counter}"[:30]
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"[:30]
            counter += 1

        return username


class CustomIntraOAuth2Provider(OAuth2Provider):
    id = 'intra'
    name = 'intra'

    def extract_uid(self, data):
        return str(data['id'])

    def extract_common_fields(self, data):
        return dict(
            username=data.get('login'),
            email=data.get('email'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            avatar=data['image']['versions']['medium'],
        )
    

provider_classes = [CustomIntraOAuth2Provider, CustomGoogleProvider]

# from allauth.socialaccount import providers
# providers.registry.register(CustomGoogleProvider)