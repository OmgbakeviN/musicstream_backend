import axios from 'axios';
import { FiDownload } from 'react-icons/fi';

function DownloadButton({ currentTrack, isVideo }) {
  const handleDownload = async () => {
    const url = `http://127.0.0.1:8000/api/download/?id=${currentTrack?.id}&mode=${isVideo ? 'video' : 'audio'}`;

    try {
      const response = await axios.get(url, {
        responseType: 'blob', // 🔁 Important pour récupérer le fichier brut
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // 🔽 Étape suivante : Stocker ce blob localement (on le fera dans l'étape 2)
      console.log('Téléchargement réussi ! Blob reçu :', response.data);

      // TEMPORAIRE : pour tester le téléchargement (téléchargement forcé dans navigateur, à supprimer après test)
      const blob = new Blob([response.data], { type: response.data.type });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${currentTrack?.title || 'fichier'}.${isVideo ? 'mp4' : 'mp3'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Erreur pendant le téléchargement :', error);
      alert("Téléchargement échoué. Vérifie que tu es connecté.");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="p-2 text-gray-300 hover:bg-gray-700 rounded-full"
      title="Télécharger"
    >
      <FiDownload size={20} />
    </button>
  );
}

export default DownloadButton;
