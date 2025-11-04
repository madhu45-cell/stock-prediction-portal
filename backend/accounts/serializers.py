# import user model from django default user model use
from django.contrib.auth.models import User
from rest_framework import serializers # serializers bring from dhango rest framework

# make serializer class
class UserSerializer(serializers.ModelSerializer): # inherit from serializers.modelserializer class, its django custom user model default .
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'}) # password field we make write_only true, its means password not show in response, its onlt work with the put and post request not with geet request .
    class Meta:
        model  = User # which modle we use in srializer
        fields = ['username', 'email', 'password'] # which fields we use in serializer

        #now we create a data, we store user in database, this possible by serializer only

        def create(self, validate_data): # the serializer automatically validate the data from u have entered in the form.
            user = User.objects.create_user( # here we can pass the validated_data 
                # User.object.create = save the password in plain text
                # User.object.create_user = automaticlly hash the password before saving into database
                validate_data['username'],
                validate_data['email'],
                validate_data['password']
            )
            return user
