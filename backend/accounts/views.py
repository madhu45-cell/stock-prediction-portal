from django.shortcuts import render
from .serializers import UserSerializer
from rest_framework import generics #
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny

# create class based view for registration
class RegisterView(generics.CreateAPIView): # CreateAPIView use for creating a boject in databse
    queryset = User.objects.all() #
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
