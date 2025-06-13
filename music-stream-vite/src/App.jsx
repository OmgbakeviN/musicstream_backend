import React, { useState, useEffect } from 'react';
import Player from './Player';
import API from './api';
import { FiSearch, FiPlus, FiTrash2, FiPlay, FiMusic, FiList } from 'react-icons/fi';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' ou 'playlist'

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

  // const addToPlaylist = async (video) => {
  //   try {
  //     await API.post('playlist/add/', video);
  //     fetchPlaylist();
  //     // Basculer sur l'onglet playlist après ajout
  //     setActiveTab('playlist');
  //   } catch (error) {
  //     console.error('Erreur lors de l’ajout à la playlist:', error);
  //   }
  // };
  const addToPlaylist = async (video) => {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://127.0.0.1:8000/api/playlist/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // 👈 très important
      },
      body: JSON.stringify(video),
    });
    fetchPlaylist(); // Recharger après ajout
    setActiveTab('playlist');
  } catch (error) {
    console.error('Erreur lors de l’ajout à la playlist:', error);
  }
};


  // const fetchPlaylist = async () => {
  //   try {
  //     const response = API.get('playlist/');
  //     const data = await response.json();
  //     setPlaylist(Array.isArray(data) ? data : []);
  //   } catch (error) {
  //     console.error('Erreur lors du chargement de la playlist:', error);
  //   }
  // };

  const fetchPlaylist = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.get('playlist/');
    setPlaylist(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Erreur lors du chargement de la playlist:', error);
  } //catch (error) {
  //     console.error('Erreur lors du chargement de la playlist:', error);
  //   }
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

    try {
      await API.delete(`playlist/remove/${videoId}/`);
      fetchPlaylist();
    } catch (error) {
      onsole.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
          Apollon
        </h1>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 pb-24 md:pb-4">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="flex">
            <input
              type="text"
              placeholder="Rechercher des chansons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              className="w-full p-3 pl-10 rounded-l-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={searchSongs}
              className="bg-purple-600 hover:bg-purple-700 px-4 rounded-r-lg flex items-center justify-center"
            >
              <FiSearch className="w-5 h-5" />
            </button>
          </div>
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'search' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('search')}
          >
            <FiMusic className="inline mr-2" />
            Recherche
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'playlist' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('playlist')}
          >
            <FiList className="inline mr-2" />
            Playlist ({playlist.length})
          </button>
        </div>

        {/* Search Results */}
        {activeTab === 'search' && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Résultats</h2>
            {results.length === 0 ? (
              <p className="text-gray-400">Aucun résultat trouvé. Essayez une autre recherche.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((video) => (
                  <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition border border-gray-700">
                    <div className="relative pt-[56.25%]">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-1.5 py-0.5 rounded text-xs">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium line-clamp-2">{video.title}</h3>
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => addToPlaylist(video)}
                          className="text-purple-400 hover:text-purple-300 bg-purple-900 bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full transition"
                          title="Ajouter à la playlist"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Playlist */}
        {activeTab === 'playlist' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Votre Playlist</h2>
              {playlist.length > 0 && (
                <button
                  onClick={() => setShowPlayer(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-lg flex items-center"
                >
                  <FiPlay className="mr-2" />
                  Lire la playlist
                </button>
              )}
            </div>

            {playlist.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiMusic className="mx-auto w-12 h-12 mb-2 opacity-50" />
                <p>Votre playlist est vide</p>
                <p className="text-sm mt-2">Ajoutez des chansons depuis les résultats de recherche</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700 border border-gray-700 rounded-lg overflow-hidden">
                {playlist.map((item, index) => (
                  <div key={index} className="p-3 hover:bg-gray-800 flex items-center group transition">
                    <div className="w-12 h-12 bg-gray-700 rounded mr-3 overflow-hidden flex-shrink-0">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-gray-400 truncate">{formatDuration(item.duration)}</p>
                    </div>
                    <button
                      onClick={() => removeFromPlaylist(item.id)}
                      className="ml-2 text-gray-400 text-red-400 opacity-100 transition p-2"
                      title="Supprimer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Player Modal */}
      {showPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Lecteur</h3>
              <button 
                onClick={() => setShowPlayer(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <Player playlist={playlist} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;