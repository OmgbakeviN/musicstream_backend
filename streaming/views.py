from django.shortcuts import render
from django.http import JsonResponse
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
