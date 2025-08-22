# serializers.py
from rest_framework import serializers
from accounts.models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = Message
        fields = ['sender', 'receiver', 'content', 'timestamp']

    def get_sender(self, obj):
        return {
            'id': obj.sender.id,
            'name': obj.sender.name,
            'image': obj.sender.image.url
        }
    def get_receiver(self, obj):
        return {
            'id': obj.receiver.id,
            'name': obj.receiver.name,
            'image': obj.receiver.image.url
        }