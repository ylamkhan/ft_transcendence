

from django.urls import path
from . import views

urlpatterns = [
    # path('', views.index, name='index'),
    path('api/getMessages/<int:userId>/<int:friendId>/', views.getMessages, name='getMessages'),
]

