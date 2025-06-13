from django.contrib import admin
from .models import CustomUser, PlaylistItem
# Register your models here.

admin.site.register(CustomUser)
admin.site.register(PlaylistItem)