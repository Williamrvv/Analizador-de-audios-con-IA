
export interface DiarizedSegment {
  speaker: string;
  text: string;
}

export interface QA {
  id: string;
  question: string;
  answer: string;
}

export interface Note {
  id: string;
  content: string;
}

export interface Transcription {
  id: string;
  title: string;
  summary: string;
  speakers: string[];
  transcript: DiarizedSegment[];
  createdAt: string;
  audioFileNames: string[];
  qaHistory: QA[];
  notes: Note[];
}

export type NewTranscriptionData = Omit<Transcription, 'id' | 'createdAt' | 'audioFileNames' | 'qaHistory' | 'notes'>;
