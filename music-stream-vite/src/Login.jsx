import { useState } from 'react';
import API from './api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
        email,
        password
      });
      localStorage.setItem('token', res.data.access);  // Stocker le token JWT
      navigate('/');  // Rediriger vers la home ou la playlist
    } catch (err) {
      alert('Échec de la connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 overflow-hidden relative">
      {/* Animation de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-800 to-purple-900 animate-gradient-flow"></div>
      </div>

      {/* Carte de connexion */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700">
          {/* Espace pour le logo - Remplacez par votre composant Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/logo.png"
              alt="MusicStream Logo" 
              className="h-20 w-auto"  // Ajustez la taille selon besoin
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-8">Connexion</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition duration-200"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-purple-400 hover:text-purple-300">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-lg transform hover:scale-[1.02]"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Pas encore de compte ?{' '}
            <a href="/register" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
              Inscrivez-vous ici
            </a>
          </p>
        </div>
      </div>

      {/* Styles pour l'animation */}
      <style jsx>{`
        .animate-gradient-flow {
          background-size: 400% 400%;
          animation: gradientFlow 15s ease infinite;
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
    
  );
}
