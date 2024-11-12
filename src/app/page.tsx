'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Phrase {
  id: string;
  text: string;
  translation: string;
  createdAt: number;
  successCount: number;
  failureCount: number;
}

export default function PhrasePage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPhrase, setNewPhrase] = useState({ text: '', translation: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPhrases = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const savedPhrases = localStorage.getItem('phrases');
        if (savedPhrases) {
          setPhrases(JSON.parse(savedPhrases));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPhrases();
  }, []);

  useEffect(() => {
    if (phrases.length > 0) {
      localStorage.setItem('phrases', JSON.stringify(phrases));
    }
  }, [phrases]);

  const addPhrase = () => {
    if (newPhrase.text.trim() && newPhrase.translation.trim()) {
      const updatedPhrases = [{
        ...newPhrase,
        id: Date.now().toString(),
        createdAt: Date.now(),
        successCount: 0,
        failureCount: 0
      }, ...phrases];
      
      setPhrases(updatedPhrases);
      localStorage.setItem('phrases', JSON.stringify(updatedPhrases));
      setNewPhrase({ text: '', translation: '' });
      setIsModalOpen(false);
    }
  };

  const deletePhrase = (id: string) => {
    const updatedPhrases = phrases.filter(phrase => phrase.id !== id);
    setPhrases(updatedPhrases);
    localStorage.setItem('phrases', JSON.stringify(updatedPhrases));
    setDeleteConfirmId(null);
  };

  const updatePhrase = (id: string, updatedText: string, updatedTranslation: string) => {
    const updatedPhrases = phrases.map(phrase => 
      phrase.id === id 
        ? { ...phrase, text: updatedText, translation: updatedTranslation }
        : phrase
    );
    setPhrases(updatedPhrases);
    localStorage.setItem('phrases', JSON.stringify(updatedPhrases));
    setEditingId(null);
  };

  const filteredPhrases = phrases.filter(phrase => 
    phrase.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phrase.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Phrase Collection
          </h1>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search phrases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="absolute right-3 top-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Phrase
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPhrases.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No phrases found</p>
            <p className="text-gray-400">Start by adding your first phrase</p>
          </div>
        )}

        {/* Phrases List */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredPhrases.map(phrase => (
                <motion.div
                  key={phrase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {editingId === phrase.id ? (
                    <div className="p-3">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phrase
                          </label>
                          <input
                            type="text"
                            value={phrase.text}
                            onChange={(e) => setPhrases(prev => prev.map(p => 
                              p.id === phrase.id ? { ...p, text: e.target.value } : p
                            ))}
                            className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Translation
                          </label>
                          <input
                            type="text"
                            value={phrase.translation}
                            onChange={(e) => setPhrases(prev => prev.map(p => 
                              p.id === phrase.id ? { ...p, translation: e.target.value } : p
                            ))}
                            className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updatePhrase(phrase.id, phrase.text, phrase.translation)}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-medium text-gray-800 truncate">{phrase.text}</h3>
                            <span className="text-gray-400">·</span>
                            <p className="text-gray-600 truncate">{phrase.translation}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${phrase.successCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {phrase.successCount}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${phrase.failureCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {phrase.failureCount}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(phrase.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingId(phrase.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(phrase.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Phrase Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Add New Phrase</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phrase
                  </label>
                  <input
                    type="text"
                    value={newPhrase.text}
                    onChange={(e) => setNewPhrase(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter phrase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Translation
                  </label>
                  <input
                    type="text"
                    value={newPhrase.translation}
                    onChange={(e) => setNewPhrase(prev => ({ ...prev, translation: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter translation"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addPhrase}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Delete Phrase</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this phrase? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletePhrase(deleteConfirmId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
