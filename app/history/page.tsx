'use client';

import React, { useState } from 'react';

// Structure type d'un élément d'historique
interface HistoryItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function HistoryManager() {
  // Exemple d'état d'historique (remplacez par vos données réelles ou localStorage/DB)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // État pour la fenêtre modale de lecture
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExportPDF = (item: HistoryItem) => {
    // Insérez ici votre fonction d'exportation PDF existante
    console.log("Exportation PDF pour :", item.title);
  };

  return (
    <div className="p-6 bg-slate-950 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📜 Historique des Générations
      </h2>

      {history.length === 0 ? (
        <p className="text-slate-400">Aucun élément enregistrer dans l'historique pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md hover:border-slate-700 transition"
            >
              <div>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md font-semibold">
                  {item.subject}
                </span>
                <h3 className="text-lg font-bold mt-2 text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                <p className="text-sm text-slate-300 mt-3 line-clamp-3">
                  {item.content}
                </p>
              </div>

              {/* Boutons d'action : Lire, Exporter, Supprimer */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition text-center"
                >
                  📖 Lire
                </button>
                <button
                  onClick={() => handleExportPDF(item)}
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition text-center"
                >
                  📄 Exporter PDF
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALE DE LECTURE DIRECTE --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Entête */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div>
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-semibold">
                  {selectedItem.subject}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  📖 {selectedItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Contenu complet */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-200 leading-relaxed font-sans text-sm whitespace-pre-wrap">
              {selectedItem.content}
            </div>

            {/* Pied de page */}
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/50">
              <button
                onClick={() => handleExportPDF(selectedItem)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                📄 Exporter en PDF
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}