import React, { useState, useEffect } from 'react';
import Player from './Player'; 

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const searchSongs = async () => {
    const response = await fetch(`http://127.0.0.1:8000/api/search/?q=${query}`);
    const data = await response.json();
    setResults(data);
  };

  const addToPlaylist = async (video) => {
    await fetch('http://127.0.0.1:8000/api/playlist/add/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });

    fetchPlaylist();
  };

  const fetchPlaylist = async () => {
    const response = await fetch('http://127.0.0.1:8000/api/playlist/');
    const data = await response.json();
    setPlaylist(data);
  };

  useEffect(() => {
    fetchPlaylist();
  }, []);

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
      <ul>
        {results.map((video) => (
          <li key={video.id}>
            {video.title}
            <button onClick={() => addToPlaylist(video)}>➕ Ajouter</button>
          </li>
        ))}
      </ul>

      <h2>🎧 Playlist :</h2>
      <ul>
        {playlist.map((item, index) => (
          <li key={index}>{item.title}</li>
        ))}
      </ul>

      <button onClick={() => setShowPlayer(true)} disabled={playlist.length === 0}>
        ▶️ Lire la playlist
      </button>

      {showPlayer && <Player playlist={playlist} />}
    </div>
  );
}

export default App;
