
import React from 'react';
import { Transcription } from '../types';
import { PlusIcon, ChatBubbleIcon, TrashIcon } from './Icons';

interface SidebarProps {
  transcriptions: Transcription[];
  activeTranscriptionId: string | null;
  onNewTranscription: () => void;
  onSelectTranscription: (id: string) => void;
  onDeleteTranscription: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  transcriptions,
  activeTranscriptionId,
  onNewTranscription,
  onSelectTranscription,
  onDeleteTranscription
}) => {
  return (
    <aside className="w-72 bg-gray-900 text-gray-200 flex flex-col p-2 space-y-2">
      <button
        onClick={onNewTranscription}
        className="flex items-center justify-between w-full p-2 text-sm font-semibold rounded-md hover:bg-gray-700 transition-colors border border-gray-600"
      >
        Nueva Transcripción
        <PlusIcon className="w-5 h-5" />
      </button>
      <div className="flex-1 overflow-y-auto pr-1">
        <span className="text-xs font-bold text-gray-400 px-2">Recientes</span>
        <nav className="mt-2 space-y-1">
          {transcriptions.map((transcription) => (
            <div
              key={transcription.id}
              className={`group flex items-center justify-between p-2 text-sm rounded-md cursor-pointer ${
                activeTranscriptionId === transcription.id
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              }`}
            >
                <div onClick={() => onSelectTranscription(transcription.id)} className="flex items-center truncate flex-1">
                    <ChatBubbleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{transcription.title}</span>
                </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
                    onDeleteTranscription(transcription.id);
                  }
                }}
                className="ml-2 p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
