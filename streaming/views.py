from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import subprocess
import json

# Playlist globale en mémoire (utile pour les tests)
playlist = []

# 🔍 Vue de recherche YouTube avec yt-dlp
def search_video(request):
    query = request.GET.get('q', '')
    if not query:
        return JsonResponse({'error': 'Aucun mot-clé fourni'}, status=400)

    cmd = ['yt-dlp', f'ytsearch5:{query}', '-j']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        if not result.stdout.strip():
            return JsonResponse({'error': 'Aucune sortie de yt-dlp'}, status=500)

        # Parse chaque ligne JSON retournée par yt-dlp
        lines = result.stdout.strip().split('\n')
        videos = []
        for line in lines:
            try:
                videos.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # Ignore les lignes mal formées

        # Formater la réponse pour le frontend
        response = [
            {
                'id': v['id'],
                'title': v['title'],
                'url': v['webpage_url'],
                'duration': v.get('duration'),
                'thumbnail': v.get('thumbnail'),
            }
            for v in videos
        ]
        return JsonResponse(response, safe=False)
    except subprocess.CalledProcessError as e:
        print("Erreur subprocess:", e.stderr)
        return JsonResponse({'error': 'Erreur avec yt-dlp'}, status=500)

# ➕ Ajouter une vidéo à la playlist
@csrf_exempt
@require_POST
def add_to_playlist(request):
    global playlist
    try:
        data = json.loads(request.body)
        video = {
            'id': data['id'],
            'title': data['title'],
            'url': data['url'],
            'thumbnail': data.get('thumbnail'),
            'duration': data.get('duration'),
        }

        # Limite à 20 vidéos
        if len(playlist) < 20:
            playlist.append(video)
            return JsonResponse({'message': 'Ajouté à la playlist'}, status=200)
        else:
            return JsonResponse({'error': 'Limite de 20 vidéos atteinte'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# 📥 Récupérer la playlist actuelle
def get_playlist(request):
    return JsonResponse(playlist, safe=False)


# stream audio
def stream_audio(request):
    video_id = request.GET.get('id')
    if not video_id:
        return JsonResponse({'error': 'ID manquant'}, status=400)

    try:
        cmd = [
            'yt-dlp',
            f'https://www.youtube.com/watch?v={video_id}',
            '-f', 'bestaudio',
            '-g'  # pour obtenir l'URL directe
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        direct_url = result.stdout.strip()

        return JsonResponse({'url': direct_url})
    except subprocess.CalledProcessError as e:
        return JsonResponse({'error': 'Impossible de générer l’URL'}, status=500)