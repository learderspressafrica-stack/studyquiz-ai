'use client';

import React, { useState } from 'react';

export default function SearchConceptPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Fonction pour récupérer une image réelle via Wikimedia Commons
  const fetchRealImage = async (searchTerm: string) => {
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          searchTerm + ' electronic component'
        )}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`
      );
      const json = await res.json();
      if (json.query && json.query.pages) {
        const pageId = Object.keys(json.query.pages)[0];
        const thumb = json.query.pages[pageId].thumbnail;
        if (thumb) {
          setImageUrl(thumb.source);
          return;
        }
      }
      setImageUrl('');
    } catch (err) {
      console.error("Erreur image Wikimedia:", err);
      setImageUrl('');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setData(null);

    // 1. Récupérer la vraie photo
    await fetchRealImage(query);

    // 2. Appel à ton API de recherche/IA (ex: /api/search-concept ou route interne)
    try {
      const response = await fetch('/api/search-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      {/* Formulaire de recherche */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Entrez un composant (ex: transistor, diode)..."
          className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-50"
        >
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {/* Affichage des résultats */}
      {data && (
        <div className="bg-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-700">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-blue-400">
              💡 Fiche Technique : {data.titre || query}
            </h2>
            
            {data.definition && (
              <div>
                <h3 className="text-lg font-semibold text-slate-200">📖 Définition & Symbole</h3>
                <p className="text-slate-300 mt-1">{data.definition}</p>
              </div>
            )}

            {data.fonctionnement && (
              <div>
                <h3 className="text-lg font-semibold text-slate-200">⚡ Fonctionnement</h3>
                <p className="text-slate-300 mt-1">{data.fonctionnement}</p>
              </div>
            )}

            {data.caracteristiques && (
              <div>
                <h3 className="text-lg font-semibold text-slate-200">📊 Caractéristiques</h3>
                <ul className="list-disc list-inside text-slate-300 mt-1">
                  {Array.isArray(data.caracteristiques) 
                    ? data.caracteristiques.map((item: string, idx: number) => <li key={idx}>{item}</li>)
                    : <li>{data.caracteristiques}</li>
                  }
                </ul>
              </div>
            )}
          </div>

          {/* Vraie photo du composant */}
          {imageUrl && (
            <div className="flex flex-col items-center justify-start bg-slate-900 p-4 rounded-lg border border-slate-700">
              <img
                src={imageUrl}
                alt={query}
                className="w-full h-48 object-contain rounded-md"
              />
              <span className="text-xs text-slate-400 mt-2 text-center">
                Photo réelle du composant (Wikimedia)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}