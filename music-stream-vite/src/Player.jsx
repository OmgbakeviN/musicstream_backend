import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiDownload, FiMusic, FiVideo } from 'react-icons/fi';

function Player({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [nextAudioUrl, setNextAudioUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const nextAudioRef = useRef(null);
  const preloadTimeoutRef = useRef(null);

  const currentTrack = playlist[currentIndex];
  const nextTrack = currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;

  // Chargement audio principal
  useEffect(() => {
    if (!isVideo && currentTrack) {
      const loadAudio = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`http://127.0.0.1:8000/api/stream/?id=${currentTrack.id}`);
          const data = await res.json();
          if (data.url) {
            setAudioUrl(data.url);
            setIsPlaying(true);
          }
        } catch (error) {
          console.error("Erreur de chargement audio", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAudio();
    }
  }, [currentTrack, isVideo]);

  // Préchargement de la piste suivante (audio seulement)
  useEffect(() => {
    if (!isVideo && nextTrack && audioRef.current) {
      const preloadNext = async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/stream/?id=${nextTrack.id}`);
          const data = await res.json();
          if (data.url) {
            setNextAudioUrl(data.url);
            if (nextAudioRef.current) {
              nextAudioRef.current.src = data.url;
              nextAudioRef.current.load();
            }
          }
        } catch (error) {
          console.error("Erreur de préchargement", error);
        }
      };

      // Démarrer le préchargement 30s avant la fin
      const checkProgress = () => {
        if (audioRef.current && audioRef.current.duration) {
          const remaining = audioRef.current.duration - audioRef.current.currentTime;
          if (remaining < 30 && !nextAudioUrl) {
            preloadNext();
          }
        }
      };

      preloadTimeoutRef.current = setInterval(checkProgress, 1000);
      return () => clearInterval(preloadTimeoutRef.current);
    }
  }, [nextTrack, isVideo, nextAudioUrl]);

  // Gestion audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.volume = volume / 100;

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [volume]);

  const toggleMode = () => {
    // Arrêter l'audio quand on passe en vidéo
    if (!isVideo && audioRef.current) {
      audioRef.current.pause();
    }
    setIsVideo(!isVideo);
    setIsPlaying(!isVideo); // Auto-play en mode vidéo
  };

  const handleTrackEnd = () => {
    if (nextAudioUrl && currentIndex < playlist.length - 1) {
      setAudioUrl(nextAudioUrl);
      setNextAudioUrl('');
      setCurrentIndex(currentIndex + 1);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const changeTrack = (newIndex) => {
    setCurrentIndex(newIndex);
    setNextAudioUrl(''); // Réinitialiser le préchargement
    setIsPlaying(!isVideo); // Auto-play sauf si mode vidéo
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 max-w-2xl mx-auto">
      {/* Éléments audio cachés */}
      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay={!isVideo}
        onEnded={handleTrackEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
      <audio ref={nextAudioRef} className="hidden" />

      {/* En-tête */}
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden mr-4 flex-shrink-0">
          <img 
            src={currentTrack?.thumbnail} 
            alt={currentTrack?.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{currentTrack?.title || '...'}</h2>
          <p className="text-gray-400 text-sm">
            {currentIndex + 1} / {playlist.length} • {isVideo ? 'Vidéo' : 'Audio'}
            {nextAudioUrl && !isVideo && <span className="ml-2 text-blue-400">✓ Préchargée</span>}
          </p>
        </div>
      </div>

      {/* Barre de chargement */}
      {isLoading && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse"></div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-1">Chargement...</p>
        </div>
      )}

      {/* Lecteur vidéo */}
      {isVideo && currentTrack && (
        <div className="mb-6 aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )}

      {/* Barre de progression (audio seulement) */}
      {!isVideo && (
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              const newProgress = e.target.value;
              setProgress(newProgress);
              if (audioRef.current) {
                audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
              }
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      )}

      {/* Contrôles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={toggleMode}
            className={`p-2 rounded-full ${isVideo ? 'text-purple-400' : 'text-gray-300'} hover:bg-gray-700`}
            title={isVideo ? 'Passer en audio' : 'Passer en vidéo'}
          >
            {isVideo ? <FiMusic size={20} /> : <FiVideo size={20} />}
          </button>
          <button
            onClick={() => window.open(`http://127.0.0.1:8000/api/download/?id=${currentTrack?.id}&mode=${isVideo ? 'video' : 'audio'}`, '_blank')}
            className="p-2 text-gray-300 hover:bg-gray-700 rounded-full"
            title="Télécharger"
          >
            <FiDownload size={20} />
          </button>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => changeTrack(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-2 disabled:text-gray-600 text-gray-300 hover:bg-gray-700 rounded-full"
          >
            <FiSkipBack size={24} />
          </button>
          
          {!isVideo ? (
            <button
              onClick={() => audioRef.current?.paused ? audioRef.current.play() : audioRef.current?.pause()}
              className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full text-white"
            >
              {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
            </button>
          ) : (
            <div className="p-3 bg-gray-600 rounded-full text-gray-400">
              <FiPlay size={24} />
            </div>
          )}

          <button
            onClick={() => changeTrack(Math.min(playlist.length - 1, currentIndex + 1))}
            disabled={currentIndex >= playlist.length - 1}
            className="p-2 disabled:text-gray-600 text-gray-300 hover:bg-gray-700 rounded-full"
          >
            <FiSkipForward size={24} />
          </button>
        </div>

        <div className="flex items-center w-24">
          <FiVolume2 className="text-gray-400 mr-2" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => {
              setVolume(e.target.value);
              if (audioRef.current) audioRef.current.volume = e.target.value / 100;
            }}
            disabled={isVideo}
            className={`w-full ${isVideo ? 'accent-gray-600' : 'accent-blue-500'}`}
          />
        </div>
      </div>

      {/* Playlist */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <h3 className="px-4 py-2 bg-gray-700 text-gray-300 font-medium">À suivre</h3>
        <div className="max-h-40 overflow-y-auto">
          {playlist.slice(currentIndex + 1).map((track, i) => (
            <div
              key={track.id}
              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => changeTrack(currentIndex + i + 1)}
            >
              <img src={track.thumbnail} alt="" className="w-10 h-10 rounded mr-3" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{track.title}</p>
                {i === 0 && nextAudioUrl && (
                  <p className="text-xs text-blue-400">Prête à jouer</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Player;