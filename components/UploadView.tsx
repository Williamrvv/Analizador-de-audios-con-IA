
import React, { useState, useCallback } from 'react';
import { UploadIcon, SpinnerIcon } from './Icons';

interface UploadViewProps {
  onProcess: (files: File[]) => void;
  isProcessing: boolean;
  error: string | null;
}

const UploadView: React.FC<UploadViewProps> = ({ onProcess, isProcessing, error }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 3));
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files) {
        const newFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...newFiles].slice(0, 3));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);


  const handleSubmit = () => {
    if (files.length > 0) {
      onProcess(files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Analizador de Audio IA</h1>
        <p className="text-gray-400 mb-8">
          Sube hasta 3 archivos de audio para transcribir, resumir y analizar.
        </p>

        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative bg-gray-900 border-2 border-dashed rounded-lg p-8 transition-colors ${dragOver ? 'border-blue-500 bg-gray-700' : 'border-gray-600'}`}
        >
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          <div className="flex flex-col items-center">
            <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-lg text-gray-300">
              Arrastra y suelta tus archivos aquí, o <span className="font-semibold text-blue-400">haz clic para buscar</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Máximo 3 archivos de audio</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="font-semibold text-gray-300">Archivos seleccionados:</h3>
            <ul className="mt-2 space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded-md text-sm">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300" disabled={isProcessing}>&times;</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-red-400 mt-4">{error}</p>}
        
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || isProcessing}
          className="mt-8 w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2" />
              Procesando...
            </>
          ) : (
            'Analizar Audio'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadView;
