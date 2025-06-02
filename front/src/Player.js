import React, { useState, useEffect, useRef } from 'react';

function Player({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [nextAudioUrl, setNextAudioUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const nextAudioRef = useRef(null);
  const preloadedRef = useRef(false);

  const currentTrack = playlist[currentIndex];
  const nextTrack = currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;

  // Charger la piste actuelle
  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/stream/?id=${currentTrack.id}`);
        const data = await res.json();
        if (data.url) {
          setAudioUrl(data.url);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'URL audio :', error);
      }
    };

    if (currentTrack && !isVideo) {
      fetchAudioUrl();
      setNextAudioUrl('');
      preloadedRef.current = false;
    }
  }, [currentTrack, isVideo]);

  // Précharger dynamiquement la prochaine piste
  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (
        !isVideo &&
        nextTrack &&
        audio &&
        audio.duration &&
        audio.currentTime &&
        audio.duration - audio.currentTime < 30 &&
        !preloadedRef.current
      ) {
        fetch(`http://127.0.0.1:8000/api/stream/?id=${nextTrack.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              setNextAudioUrl(data.url);
              if (nextAudioRef.current) {
                nextAudioRef.current.src = data.url;
                nextAudioRef.current.load();
              }
              preloadedRef.current = true;
              console.log('Préchargement de :', nextTrack.title);
            }
          })
          .catch(err => console.error('Erreur préchargement :', err));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextTrack, isVideo]);

  const handleEnded = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (nextAudioUrl) {
        setAudioUrl(nextAudioUrl);
        setNextAudioUrl('');
      }
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
        <>
          <audio
            ref={audioRef}
            controls
            autoPlay
            src={audioUrl}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
          <audio ref={nextAudioRef} style={{ display: 'none' }} />
        </>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setIsVideo(!isVideo)}>
          {isVideo ? '🎧 Mode audio' : '🎥 Mode vidéo'}
        </button>

        {!isVideo && (
          <button onClick={togglePlayPause}>
            {isPlaying ? '⏸️ Pause' : '▶️ Lecture'}
          </button>
        )}

        <button
          onClick={() => {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
            setIsPlaying(true);
          }}
          disabled={currentIndex === 0}
        >
          ⏮️ Précédent
        </button>

        <button
          onClick={() => {
            setCurrentIndex(prev => Math.min(prev + 1, playlist.length - 1));
            setIsPlaying(true);
          }}
          disabled={currentIndex === playlist.length - 1}
        >
          ⏭️ Suivant
        </button>

        <button onClick={() => {
          const mode = isVideo ? 'video' : 'audio';
          const id = currentTrack?.id;
          if (id) {
            window.open(`http://127.0.0.1:8000/api/download/?id=${id}&mode=${mode}`, '_blank');
          } else {
            alert("Aucune vidéo sélectionnée.");
          }
        }}>
          ⬇️ Télécharger
        </button>
      </div>
    </div>
  );
}

export default Player;
