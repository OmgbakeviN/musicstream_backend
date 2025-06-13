from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.utils.text import slugify
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PlaylistItem
from .serializers import RegisterSerializer
import subprocess
import json
import os 
import yt_dlp
import uuid
import requests
import logging

# Playlist globale en mémoire (utile pour les tests)
playlist = []
YOUTUBE_API_KEY = 'AIzaSyCMP4MoXNyVVFOqLwWAzJoFH3Ufo8mf0XU'  

def search_video(request):
    query = request.GET.get('q', '')
    if not query:
        return JsonResponse({'error': 'Aucun mot-clé fourni'}, status=400)

    search_url = "https://www.googleapis.com/youtube/v3/search"
    video_url = "https://www.googleapis.com/youtube/v3/videos"

    try:
        search_params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': 5,
            'key': YOUTUBE_API_KEY
        }
        search_response = requests.get(search_url, params=search_params)
        if search_response.status_code != 200:
            return JsonResponse({'error': 'Erreur API YouTube (search)'}, status=search_response.status_code)
        search_data = search_response.json()

        video_ids = [item.get('id', {}).get('videoId') for item in search_data.get('items', []) if item.get('id', {}).get('videoId')]
        if not video_ids:
            return JsonResponse([], safe=False)

        details_params = {
            'part': 'contentDetails',
            'id': ','.join(video_ids),
            'key': YOUTUBE_API_KEY
        }
        details_response = requests.get(video_url, params=details_params)
        if details_response.status_code != 200:
            return JsonResponse({'error': 'Erreur API YouTube (videos)'}, status=details_response.status_code)
        details_data = details_response.json()

        video_details = {
            item['id']: item['contentDetails'].get('duration', 'N/A')
            for item in details_data.get('items', [])
        }

        results = []
        for item in search_data.get('items', []):
            video_id = item.get('id', {}).get('videoId')
            if not video_id:
                continue
            snippet = item.get('snippet', {})
            title = snippet.get('title', 'Sans titre')
            thumbnail = snippet.get('thumbnails', {}).get('high', {}).get('url', '')
            duration = video_details.get(video_id, 'N/A')

            results.append({
                'id': video_id,
                'title': title,
                'url': f"https://www.youtube.com/watch?v={video_id}",
                'thumbnail': thumbnail,
                'duration': duration,
            })

        return JsonResponse(results, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


#v1 ➕ Ajouter une vidéo à la playlist
# @csrf_exempt
# @require_POST
# def add_to_playlist(request):
#     global playlist
#     try:
#         data = json.loads(request.body)
#         video = {
#             'id': data['id'],
#             'title': data['title'],
#             'url': data['url'],
#             'thumbnail': data.get('thumbnail'),
#             'duration': data.get('duration'),
#         }

#         # Limite à 20 vidéos
#         if len(playlist) < 20:
#             playlist.append(video)
#             return JsonResponse({'message': 'Ajouté à la playlist'}, status=200)
#         else:
#             return JsonResponse({'error': 'Limite de 20 vidéos atteinte'}, status=400)
#     except Exception as e:
#         return JsonResponse({'error': str(e)}, status=500)

#v2 ➕ Ajouter une vidéo à la playlist
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_playlist(request):
    user = request.user
    data = request.data

    # Limiter à 20 vidéos par utilisateur
    if PlaylistItem.objects.filter(user=user).count() >= 20:
        return Response({'error': 'Limite de 20 vidéos atteinte'}, status=400)

    # Créer l'élément
    PlaylistItem.objects.create(
        user=user,
        video_id=data['id'],
        title=data['title'],
        url=data['url'],
        thumbnail=data.get('thumbnail'),
        duration=data.get('duration')
    )
    return Response({'message': 'Ajouté à la playlist'}, status=200)

#v1 📥 Récupérer la playlist actuelle
# def get_playlist(request):
#     return JsonResponse(playlist, safe=False)

#v2 get playlist par user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_playlist(request):
    user = request.user
    items = PlaylistItem.objects.filter(user=user)
    data = [
        {
            'id': item.video_id,
            'title': item.title,
            'url': item.url,
            'thumbnail': item.thumbnail,
            'duration': item.duration,
        }
        for item in items
    ]
    return Response(data)

# V1 stream audio
# def stream_audio(request):
#     video_id = request.GET.get('id')
#     if not video_id:
#         return JsonResponse({'error': 'ID manquant'}, status=400)

#     try:
#         cmd = [
#             'yt-dlp',
#             f'https://www.youtube.com/watch?v={video_id}',
#             '-f', 'bestaudio',
#             '-g'  # pour obtenir l'URL directe
#         ]
#         result = subprocess.run(cmd, capture_output=True, text=True, check=True)
#         direct_url = result.stdout.strip()

#         return JsonResponse({'url': direct_url})
#     except subprocess.CalledProcessError as e:
#         return JsonResponse({'error': 'Impossible de générer l’URL'}, status=500)

# V2 streaming
logger = logging.getLogger(__name__)

# stream audio
def stream_audio(request):
    video_id = request.GET.get('id')
    if not video_id:
        return JsonResponse({'error': 'ID manquant'}, status=400)

    # Vérifier le cache d'abord
    cache_key = f'audio_url_{video_id}'
    cached_url = cache.get(cache_key)
    if cached_url:
        return JsonResponse({'url': cached_url})

    try:
        cmd = [
            'yt-dlp',
            f'https://www.youtube.com/watch?v={video_id}',
            '-f', 'bestaudio',
            '-g'  # pour obtenir l'URL directe
        ]
        
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True,
            timeout=100  # timeout après 10 secondes
        )
        
        direct_url = result.stdout.strip()
        
        if not direct_url:
            raise ValueError("URL vide reçue de yt-dlp")

        # Mettre en cache pour 6 heures (21600 secondes)
        cache.set(cache_key, direct_url, timeout=21600)
        
        return JsonResponse({'url': direct_url})
        
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout lors de la récupération de l'audio pour {video_id}")
        return JsonResponse(
            {'error': 'Le traitement a pris trop de temps'},
            status=504
        )
    except subprocess.CalledProcessError as e:
        logger.error(f"Erreur yt-dlp pour {video_id}: {e.stderr}")
        return JsonResponse(
            {'error': 'Impossible de générer l\'URL audio'},
            status=502
        )
    except Exception as e:
        logger.error(f"Erreur inattendue pour {video_id}: {str(e)}")
        return JsonResponse(
            {'error': 'Erreur interne du serveur'},
            status=500
        )

@require_GET
def download_media(request):
    video_id = request.GET.get('id')
    mode = request.GET.get('mode', 'audio')  # 'audio' ou 'video'

    if not video_id:
        return JsonResponse({'error': 'ID manquant'}, status=400)

    # 🔍 Récupérer le titre via l'API YouTube
    yt_api_url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        'part': 'snippet',
        'id': video_id,
        'key': YOUTUBE_API_KEY,
    }
    yt_response = requests.get(yt_api_url, params=params).json()
    items = yt_response.get('items', [])
    if not items:
        return JsonResponse({'error': 'Vidéo introuvable'}, status=404)

    title = items[0]['snippet']['title']
    safe_title = slugify(title)[:50]  # sécurise le nom du fichier
    extension = 'mp3' if mode == 'audio' else 'mp4'
    output_path = f"/tmp/{safe_title}.%(ext)s"

    # 🛠️ Commande yt-dlp
    if mode == 'video':
        cmd = [
            'yt-dlp',
            '-f', '18',
            f"https://www.youtube.com/watch?v={video_id}",
            '-o', output_path
        ]
    else:
        cmd = [
            'yt-dlp',
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '5',
            f"https://www.youtube.com/watch?v={video_id}",
            '-o', output_path
        ]

    try:
        subprocess.run(cmd, check=True)

        # Chercher le fichier réel généré
        base_output = output_path.replace('%(ext)s', '')
        actual_file = next(
            (f for f in os.listdir('/tmp') if f.startswith(os.path.basename(base_output))),
            None
        )

        if actual_file:
            file_path = os.path.join('/tmp', actual_file)
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=actual_file  # 👈 Spécifie le vrai nom du fichier
            )
        else:
            return JsonResponse({'error': 'Fichier non trouvé après téléchargement.'}, status=500)

    except subprocess.CalledProcessError as e:
        return JsonResponse({'error': 'Erreur yt-dlp', 'details': str(e)}, status=500)

# v1 remove from playlist
# @csrf_exempt
# @require_http_methods(["DELETE"])
# def remove_from_playlist(request, video_id):
#     global playlist
#     original_len = len(playlist)

#     # Supprimer seulement les éléments dont l'ID correspond strictement
#     playlist = [item for item in playlist if str(item.get('id')) != str(video_id)]

#     if len(playlist) == original_len:
#         return JsonResponse({'error': 'Vidéo non trouvée dans la playlist'}, status=404)

#     return JsonResponse({'message': 'Vidéo retirée avec succès'})

# v2 remove playlist
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_playlist(request, video_id):
    user = request.user
    item = PlaylistItem.objects.filter(user=user, video_id=video_id).first()

    if not item:
        return Response({'error': 'Vidéo non trouvée'}, status=404)

    item.delete()
    return Response({'message': 'Vidéo supprimée'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Créer un token JWT pour connecter automatiquement
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Utilisateur créé avec succès',
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)