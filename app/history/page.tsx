'use client';

import React, { useState } from 'react';

interface HistoryItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-6 bg-slate-950 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">📜 Historique des Générations</h1>

      {history.length === 0 ? (
        <p className="text-slate-400">Aucun élément dans l'historique.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-semibold">{item.subject}</span>
                <h3 className="text-lg font-bold mt-2">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.date}</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  📖 Lire
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold rounded-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold">📖 {selectedItem.title}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
              {selectedItem.content}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-800/50">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}