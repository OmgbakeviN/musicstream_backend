from django.urls import path
from . import views
from .views import search_video, add_to_playlist, get_playlist, stream_audio, RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('search/',views.search_video, name='search_video'),
    path('playlist/add/', add_to_playlist, name='add_to_playlist'),
    path('playlist/', get_playlist, name='get_playlist'),
    path('stream/',views.stream_audio),
    path('download/', views.download_media, name='download_media'),
    path('playlist/remove/<str:video_id>/', views.remove_from_playlist),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]