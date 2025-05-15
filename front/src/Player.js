import React, { useState, useEffect } from 'react';

function Player({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);

  const currentTrack = playlist[currentIndex];

  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/stream/?id=${currentTrack.id}`);
        const data = await res.json();
        if (data.url) {
          setAudioUrl(data.url);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l’URL audio :', error);
      }
    };

    if (currentTrack && !isVideo) {
      fetchAudioUrl();
    }
  }, [currentTrack, isVideo]);

  if (!currentTrack) return <p>Playlist vide</p>;

  return (
    <div>
      <h2>{currentTrack.title}</h2>

      {isVideo ? (
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1`}
          title="Lecteur vidéo"
          frameBorder="0"
          allow="autoplay"
        ></iframe>
      ) : (
        <audio controls autoPlay src={audioUrl}>
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setIsVideo(!isVideo)}>
          {isVideo ? '🎧 Mode audio' : '🎥 Mode vidéo'}
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
        >
          ⏮️ Précédent
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, playlist.length - 1))}
          disabled={currentIndex === playlist.length - 1}
        >
          ⏭️ Suivant
        </button>
      </div>
    </div>
  );
}

export default Player;
