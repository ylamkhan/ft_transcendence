from django.contrib import admin
from accounts.models import PrivateChat, Message
# Register your models here.

admin.site.register(PrivateChat)
admin.site.register(Message)