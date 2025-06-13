// src/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';
import axios from 'axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register/', {
      email,
      password
    });      const token = response.data.access;

      localStorage.setItem('token', token); // 🔐 Stocker le token
      navigate('/'); // Redirige vers la page d'accueil
    } catch (error) {
      console.error(error);
      setErrorMsg("Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 overflow-hidden relative">
      {/* Animation de fond identique à la page de login */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-800 to-purple-900 animate-gradient-flow"></div>
      </div>

      {/* Carte d'inscription */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700">
          {/* Espace pour le logo - identique à la page de login */}
          <div className="flex justify-center mb-6">
            <img 
              src="logo.png"
              alt="MusicStream Logo" 
              className="h-20 w-auto"  // Ajustez la taille selon besoin
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-6">Créer un compte</h2>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-red-300 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
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
              <p className="mt-1 text-xs text-gray-400">
                Minimum 8 caractères avec des chiffres et lettres
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                J'accepte les <a href="/terms" className="text-blue-400 hover:underline">conditions d'utilisation</a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg transition duration-200 shadow-lg transform hover:scale-[1.02]"
            >
              S'inscrire
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400">
              Déjà un compte ?{' '}
              <a href="/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                Connectez-vous ici
              </a>
            </p>
          </div>
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
