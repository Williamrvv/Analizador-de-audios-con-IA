
import React, { useState, useRef, useEffect } from 'react';
import { Transcription, QA, Note } from '../types';
import { askQuestionAboutTranscript } from '../services/geminiService';
import { SendIcon, SpinnerIcon, PencilIcon, TrashIcon, DownloadIcon } from './Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TranscriptionViewProps {
  transcription: Transcription;
  onUpdate: (updatedTranscription: Transcription) => void;
}

type ActiveTab = 'transcription' | 'notes' | 'qa';

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('transcription');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const qaEndRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription.qaHistory]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    const fullTranscriptText = transcription.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    const answer = await askQuestionAboutTranscript(fullTranscriptText, question);
    setIsAsking(false);

    const newQA: QA = { id: crypto.randomUUID(), question, answer };
    onUpdate({ ...transcription, qaHistory: [...transcription.qaHistory, newQA] });
    setQuestion('');
  };

  const handleNoteSubmit = () => {
    if (!noteContent.trim()) return;
    if (editingNoteId) {
      const updatedNotes = transcription.notes.map(n =>
        n.id === editingNoteId ? { ...n, content: noteContent } : n
      );
      onUpdate({ ...transcription, notes: updatedNotes });
      setEditingNoteId(null);
    } else {
      const newNote: Note = { id: crypto.randomUUID(), content: noteContent };
      onUpdate({ ...transcription, notes: [...transcription.notes, newNote] });
    }
    setNoteContent('');
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = transcription.notes.filter(n => n.id !== noteId);
    onUpdate({ ...transcription, notes: updatedNotes });
  };
  
  const handleExportPDF = async () => {
    const element = printableRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#1e1e1e',
    });
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const imgHeightInPdf = pdfWidth / ratio;
    
    let heightLeft = imgHeightInPdf;
    let position = 0;

    pdf.addImage(data, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeightInPdf;
      pdf.addPage();
      pdf.addImage(data, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${transcription.title.replace(/\s+/g, '_')}.pdf`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'transcription':
        return (
            <div>
                 <h2 className="text-2xl font-bold mb-4">{transcription.title}</h2>
                 <div className="bg-gray-900 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-lg text-blue-300 mb-2">Resumen Automático</h3>
                    <p className="text-gray-300 prose prose-invert max-w-none">{transcription.summary}</p>
                 </div>
                 <div className="bg-gray-900 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-lg text-blue-300 mb-2">Interlocutores Detectados</h3>
                    <div className="flex flex-wrap gap-2">
                        {transcription.speakers.map((speaker, i) => (
                            <span key={i} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm">{speaker}</span>
                        ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    {transcription.transcript.map((item, index) => (
                    <div key={index} className="flex flex-col">
                        <span className="font-bold text-sm text-blue-400">{item.speaker}</span>
                        <p className="text-gray-200">{item.text}</p>
                    </div>
                    ))}
                 </div>
            </div>
        );
      case 'notes':
        return (
            <div>
                <h2 className="text-2xl font-bold mb-4">Notas</h2>
                <div className="space-y-4 mb-6">
                    {transcription.notes.map(note => (
                        <div key={note.id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-start">
                           <p className="text-gray-300 flex-1 break-words mr-4">{note.content}</p>
                           <div className="flex space-x-2">
                                <button onClick={() => startEditingNote(note)} className="p-1 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={() => deleteNote(note.id)} className="p-1 text-gray-400 hover:text-white"><TrashIcon className="w-4 h-4"/></button>
                           </div>
                        </div>
                    ))}
                    {transcription.notes.length === 0 && <p className="text-gray-500">Aún no hay notas.</p>}
                </div>
                <div className="flex flex-col space-y-2">
                    <textarea 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder={editingNoteId ? "Editar nota..." : "Añadir nueva nota..."}
                        className="w-full bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                        {editingNoteId && <button onClick={() => { setEditingNoteId(null); setNoteContent(''); }} className="bg-gray-600 px-4 py-2 rounded-md text-sm hover:bg-gray-500">Cancelar</button>}
                        <button onClick={handleNoteSubmit} className="bg-blue-600 px-4 py-2 rounded-md text-sm hover:bg-blue-700">{editingNoteId ? 'Guardar Cambios' : 'Añadir Nota'}</button>
                    </div>
                </div>
            </div>
        );
      case 'qa':
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-6">
                    {transcription.qaHistory.map(qa => (
                        <div key={qa.id}>
                            <div className="text-right">
                                <span className="bg-blue-600 inline-block rounded-lg px-4 py-2 text-white max-w-xl">{qa.question}</span>
                            </div>
                            <div className="text-left mt-2">
                                <span className="bg-gray-700 inline-block rounded-lg px-4 py-2 text-gray-200 max-w-xl">{qa.answer}</span>
                            </div>
                        </div>
                    ))}
                    {isAsking && <div className="text-left mt-2"><SpinnerIcon className="w-5 h-5 text-gray-400"/></div>}
                    <div ref={qaEndRef} />
                    </div>
                </div>
                <div className="mt-auto pt-4">
                    <div className="flex items-center bg-gray-700 rounded-lg p-1">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                        placeholder="Haz una pregunta sobre la transcripción..."
                        className="flex-1 bg-transparent p-2 text-gray-200 focus:outline-none"
                        disabled={isAsking}
                    />
                    <button onClick={handleAskQuestion} disabled={isAsking || !question.trim()} className="p-2 bg-blue-600 rounded-md text-white disabled:bg-gray-500 hover:bg-blue-700">
                        {isAsking ? <SpinnerIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5" />}
                    </button>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
        <header className="flex-shrink-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                { (['transcription', 'notes', 'qa'] as ActiveTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 rounded-md text-sm font-medium ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        {tab === 'transcription' ? 'Transcripción' : tab === 'notes' ? 'Notas' : 'Preguntas y Respuestas'}
                    </button>
                ))}
            </div>
            <button onClick={handleExportPDF} className="flex items-center bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 transition-colors">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar a PDF
            </button>
        </header>
        <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'qa' ? 'flex flex-col' : ''}`}>
            {renderContent()}
        </div>
        
        {/* Hidden element for PDF export */}
        <div className="absolute -left-full -top-full">
            <div ref={printableRef} className="bg-gray-800 text-gray-200 p-10 w-[1200px]">
                <h1 className="text-4xl font-bold mb-6 text-center border-b-2 border-blue-400 pb-4">Informe de Transcripción</h1>
                <h2 className="text-2xl font-bold mb-2">{transcription.title}</h2>
                <p className="text-sm text-gray-400 mb-6">Generado: {new Date().toLocaleString()}</p>

                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">Resumen Automático</h3>
                    <p className="text-gray-300">{transcription.summary}</p>
                </section>

                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">Interlocutores</h3>
                     <p className="text-gray-300">{transcription.speakers.join(', ')}</p>
                </section>

                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">Transcripción Completa</h3>
                    <div className="space-y-3">
                        {transcription.transcript.map((item, index) => (
                        <div key={`pdf-t-${index}`}><span className="font-bold text-blue-400">{item.speaker}: </span>{item.text}</div>
                        ))}
                    </div>
                </section>

                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">Notas del Usuario</h3>
                    {transcription.notes.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2">
                            {transcription.notes.map(note => <li key={`pdf-n-${note.id}`}>{note.content}</li>)}
                        </ul>
                    ) : <p>No hay notas.</p>}
                </section>
                
                <section>
                    <h3 className="text-xl font-semibold text-blue-300 mb-3 border-b border-gray-600 pb-2">Historial de Preguntas y Respuestas</h3>
                    {transcription.qaHistory.length > 0 ? (
                        <div className="space-y-4">
                            {transcription.qaHistory.map(qa => (
                                <div key={`pdf-qa-${qa.id}`}>
                                    <p className="font-bold">P: {qa.question}</p>
                                    <p>R: {qa.answer}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p>No hay preguntas y respuestas.</p>}
                </section>
            </div>
        </div>
    </div>
  );
};

export default TranscriptionView;
