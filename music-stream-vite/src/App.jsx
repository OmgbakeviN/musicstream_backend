import React, { useState, useEffect } from 'react';
import Player from './Player';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const searchSongs = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/search/?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error('Résultat inattendu:', data);
        setResults([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    }
  };

  const addToPlaylist = async (video) => {
    try {
      await fetch('http://127.0.0.1:8000/api/playlist/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      fetchPlaylist();
    } catch (error) {
      console.error('Erreur lors de l’ajout à la playlist:', error);
    }
  };

  const fetchPlaylist = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/playlist/');
      const data = await response.json();
      setPlaylist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement de la playlist:', error);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const formatDuration = (isoDuration) => {
    if (!isoDuration) return 'Inconnue';
    const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    const minutes = match?.[1] || '0';
    const seconds = match?.[2] || '00';
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const removeFromPlaylist = async (videoId) => {
  const confirmed = window.confirm("Supprimer cette chanson de la playlist ?");
  if (!confirmed) return;

  await fetch(`http://127.0.0.1:8000/api/playlist/remove/${videoId}/`, {
    method: 'DELETE',
  });

  fetchPlaylist(); // rafraîchir l'affichage
};


  return (
    <div className="App">
      <h1>🎵 Music Stream</h1>

      <div>
        <input
          type="text"
          placeholder="Recherche une chanson..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={searchSongs}>🔍 Rechercher</button>
      </div>

      <h2>Résultats :</h2>
      {results.length === 0 ? (
        <p>Aucun résultat trouvé.</p>
      ) : (
        <ul>
          {results.map((video) => (
            <li key={video.id}>
              <img src={video.thumbnail} alt={video.title} width="120" style={{ marginRight: '10px' }} />
              <strong>{video.title}</strong> ({formatDuration(video.duration)})
              <button onClick={() => addToPlaylist(video)}>➕ Ajouter</button>
            </li>
          ))}
        </ul>
      )}

      <h2>🎧 Playlist :</h2>
      {playlist.length === 0 ? (
        <p>Aucune chanson dans la playlist.</p>
      ) : (
        <ul>
          {playlist.map((item, index) => (
            <li key={index}>
              {item.title}
              <button onClick={() => removeFromPlaylist(item.id)} style={{ marginLeft: '10px' }}>
                ❌ Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => setShowPlayer(true)} disabled={playlist.length === 0}>
        ▶️ Lire la playlist
      </button>

      {showPlayer && <Player playlist={playlist} />}
    </div>
  );
}

export default App;
