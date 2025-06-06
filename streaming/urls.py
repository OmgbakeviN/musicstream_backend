from django.urls import path
from . import views
from .views import search_video, add_to_playlist, get_playlist, stream_audio

urlpatterns = [
    path('search/',views.search_video, name='search_video'),
    path('playlist/add/', add_to_playlist, name='add_to_playlist'),
    path('playlist/', get_playlist, name='get_playlist'),
    path('stream/',views.stream_audio),
    path('download/', views.download_media, name='download_media'),
    path('playlist/remove/<str:video_id>/', views.remove_from_playlist),
]