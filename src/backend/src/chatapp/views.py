


from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from accounts.models import Message
from .serializers import MessageSerializer
from django.db.models import Q

# Create your views here.
def index(request):
    return render(request, 'chatapp/index.html')

@api_view(['GET'])
def getMessages(request, userId, friendId):
    messages = Message.objects.filter(
        (Q(sender__id=userId) & Q(receiver__id=friendId)) | 
        (Q(sender__id=friendId) & Q(receiver__id=userId))
    ).order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)
