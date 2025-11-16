
import React, { useState, useCallback } from 'react';
import { Transcription } from './types';
import Sidebar from './components/Sidebar';
import UploadView from './components/UploadView';
import TranscriptionView from './components/TranscriptionView';
import useLocalStorage from './hooks/useLocalStorage';
import { processAudioFiles } from './services/geminiService';

const App: React.FC = () => {
  const [transcriptions, setTranscriptions] = useLocalStorage<Transcription[]>('transcriptions', []);
  const [activeTranscriptionId, setActiveTranscriptionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewTranscription = () => {
    setActiveTranscriptionId(null);
  };

  const handleSelectTranscription = (id: string) => {
    setActiveTranscriptionId(id);
  };

  const handleDeleteTranscription = (id: string) => {
    setTranscriptions(prev => prev.filter(t => t.id !== id));
    if (activeTranscriptionId === id) {
      setActiveTranscriptionId(null);
    }
  };

  const handleProcessAudio = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const newTranscriptionData = await processAudioFiles(files);
      const newTranscription: Transcription = {
        ...newTranscriptionData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        audioFileNames: files.map(f => f.name),
        qaHistory: [],
        notes: [],
      };
      setTranscriptions(prev => [newTranscription, ...prev]);
      setActiveTranscriptionId(newTranscription.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al procesar el audio. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTranscription = useCallback((updatedTranscription: Transcription) => {
    setTranscriptions(prev =>
      prev.map(t => (t.id === updatedTranscription.id ? updatedTranscription : t))
    );
  }, [setTranscriptions]);

  const activeTranscription = transcriptions.find(t => t.id === activeTranscriptionId);

  return (
    <div className="flex h-screen font-sans">
      <Sidebar
        transcriptions={transcriptions}
        activeTranscriptionId={activeTranscriptionId}
        onNewTranscription={handleNewTranscription}
        onSelectTranscription={handleSelectTranscription}
        onDeleteTranscription={handleDeleteTranscription}
      />
      <main className="flex-1 flex flex-col bg-gray-800">
        {activeTranscription ? (
          <TranscriptionView
            key={activeTranscription.id}
            transcription={activeTranscription}
            onUpdate={updateTranscription}
          />
        ) : (
          <UploadView
            onProcess={handleProcessAudio}
            isProcessing={isProcessing}
            error={error}
          />
        )}
      </main>
    </div>
  );
};

export default App;