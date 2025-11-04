from django.urls import path 
from accounts import views as UserViews
# create registration url pattern from account views.py
urlpatterns = [
    path('register/', UserViews.RegisterView.as_view()),
]
