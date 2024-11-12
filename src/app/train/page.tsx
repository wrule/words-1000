'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Phrase {
  id: string;
  text: string;
  translation: string;
  createdAt: number;
  successCount: number;
  failureCount: number;
}

const WAIT_TIME = 30;
const HIGH_RISK_THRESHOLD = 0.3;
const TRANSITION_DELAY = 1500;

export default function TrainPage() {
  const router = useRouter();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WAIT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastPhraseId = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // 清理函数
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsActive(false);
    setCurrentPhrase(null);
    setShowTranslation(false);
    setTimeLeft(WAIT_TIME);
    setIsTransitioning(false);
    lastPhraseId.current = null;
  }, []);

  // 处理返回
  const handleReturn = () => {
    cleanup();
    router.push('/');
  };

  const calculateRiskScore = (phrase: Phrase) => {
    const totalAttempts = phrase.successCount + phrase.failureCount;
    if (totalAttempts === 0) return 1;
    return phrase.failureCount / totalAttempts;
  };

  const getNextPhrase = useCallback(() => {
    if (phrases.length === 0) return null;
    if (phrases.length === 1) return phrases[0];

    const phrasesWithRisk = phrases.map(phrase => ({
      ...phrase,
      riskScore: calculateRiskScore(phrase)
    }));

    const availablePhrases = phrasesWithRisk.filter(
      phrase => phrase.id !== lastPhraseId.current
    );

    const sortedPhrases = availablePhrases.sort((a, b) => b.riskScore - a.riskScore);
    const highRiskPhrases = sortedPhrases.filter(p => p.riskScore >= HIGH_RISK_THRESHOLD);
    
    const pool = Math.random() < 0.8 && highRiskPhrases.length > 0 
      ? highRiskPhrases 
      : sortedPhrases;

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [phrases]);

  useEffect(() => {
    const loadPhrases = () => {
      const savedPhrases = localStorage.getItem('phrases');
      if (savedPhrases) {
        setPhrases(JSON.parse(savedPhrases));
      }
    };

    loadPhrases();
    window.addEventListener('storage', loadPhrases);
    
    return () => {
      cleanup();
      window.removeEventListener('storage', loadPhrases);
    };
  }, [cleanup]);

  const startNewRound = useCallback(() => {
    const nextPhrase = getNextPhrase();
    if (nextPhrase) {
      lastPhraseId.current = nextPhrase.id;
      setCurrentPhrase(nextPhrase);
      setShowTranslation(false);
      setTimeLeft(WAIT_TIME);
      setIsActive(true);
      setIsTransitioning(false);
    }
  }, [getNextPhrase]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!currentPhrase || isTransitioning) return;
    
    setIsTransitioning(true);

    const updatedPhrases = phrases.map(phrase => {
      if (phrase.id === currentPhrase.id) {
        return {
          ...phrase,
          successCount: phrase.successCount + (isCorrect ? 1 : 0),
          failureCount: phrase.failureCount + (isCorrect ? 0 : 1),
        };
      }
      return phrase;
    });

    setPhrases(updatedPhrases);
    localStorage.setItem('phrases', JSON.stringify(updatedPhrases));
    
    setShowTranslation(true);
    setIsActive(false);
    
    // 使用 ref 来存储 timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(startNewRound, TRANSITION_DELAY);
  }, [currentPhrase, isTransitioning, phrases, startNewRound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0 && !showTranslation) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleAnswer(false);
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, showTranslation, handleAnswer]);

  useEffect(() => {
    if (phrases.length > 0 && !currentPhrase && !isTransitioning) {
      startNewRound();
    }
  }, [phrases, currentPhrase, startNewRound, isTransitioning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={handleReturn}
        className="absolute top-4 left-4 px-4 py-2 bg-white text-gray-700 rounded-lg 
                 shadow-sm hover:bg-gray-50 transition-colors duration-200 
                 flex items-center gap-2"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          strokeWidth="2" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="w-full max-w-lg">
        {phrases.length === 0 ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Phrases Available</h2>
            <p className="text-gray-600">Add some phrases first to start training</p>
          </div>
        ) : (
          currentPhrase && (
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / WAIT_TIME) * 100}%` }}
                ></div>
              </div>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentPhrase.id + (showTranslation ? '-trans' : '')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8"
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-4xl font-bold text-gray-800 mb-4">
                    {currentPhrase.text}
                  </h2>
                  {showTranslation && (
                    <p className="text-xl text-gray-600">
                      {currentPhrase.translation}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {!showTranslation && !isTransitioning && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleAnswer(false)}
                    disabled={isTransitioning}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 
                             transition-colors duration-200 shadow-sm disabled:opacity-50"
                  >
                    Don't Know
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    disabled={isTransitioning}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 
                             transition-colors duration-200 shadow-sm disabled:opacity-50"
                  >
                    Know It
                  </button>
                </div>
              )}

              <div className="mt-8 text-sm text-gray-500">
                Success: {currentPhrase.successCount} | Fails: {currentPhrase.failureCount}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
