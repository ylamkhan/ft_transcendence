from django.contrib import admin
from .models import Tournament, Participant, Round, Match

# Register your models here.
admin.site.register(Tournament)
admin.site.register(Participant)
admin.site.register(Round)
admin.site.register(Match)