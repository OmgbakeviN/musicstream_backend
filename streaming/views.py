from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import subprocess
import json
# Create your views here.

# vue pour la recherche
def search_video(request):
    query = request.GET.get('q', '')
    if not query:
        return JsonResponse({'error': 'Aucun mot-clé fourni'}, status=400)

    cmd = ['yt-dlp', f'ytsearch5:{query}', '-j']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        if not result.stdout.strip():
            return JsonResponse({'error': 'Aucune sortie de yt-dlp'}, status=500)

        lines = result.stdout.strip().split('\n')
        videos = []
        for line in lines:
            try:
                videos.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Erreur JSON sur la ligne : {line}")
                continue

        response = [
            {
                'id': v['id'],
                'title': v['title'],
                'url': v['webpage_url'],
                'duration': v['duration'],
                'thumbnail': v['thumbnail'],
            }
            for v in videos
        ]
        return JsonResponse(response, safe=False)
    except subprocess.CalledProcessError as e:
        print("Erreur subprocess:", e.stderr)
        return JsonResponse({'error': 'yt-dlp a échoué à exécuter la commande.'}, status=500)


@csrf_exempt
@require_POST
def add_to_playlist(request):
    try:
        data = json.loads(request.body)
        video = {
            'id': data['id'],
            'title': data['title'],
            'url': data['url'],
            'thumbnail': data.get('thumbnail'),
            'duration': data.get('duration'),
        }

        # Initialiser la playlist si elle n’existe pas
        if 'playlist' not in request.session:
            request.session['playlist'] = []

        # Ajouter la chanson si moins de 20 chansons
        if len(request.session['playlist']) < 20:
            request.session['playlist'].append(video)
            request.session.modified = True
            return JsonResponse({'message': 'Ajouté à la playlist'}, status=200)
        else:
            return JsonResponse({'error': 'Limite de 20 chansons atteinte'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_playlist(request):
    playlist = request.session.get('playlist', [])
    return JsonResponse(playlist, safe=False)
