from django.apps import AppConfig


class Oauth2Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'oauth2'

    def ready(self):
        from allauth.socialaccount.providers import registry
        from .provider import CustomIntraOAuth2Provider
        registry.register(CustomIntraOAuth2Provider)

