
import { GoogleGenAI, Type } from "@google/genai";
import { NewTranscriptionData } from '../types';

// Helper function to convert a File object to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result looks like "data:audio/mpeg;base64,..."
      // We only need the part after the comma
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const processAudioFiles = async (files: File[]): Promise<NewTranscriptionData> => {
  if (!process.env.API_KEY) {
    throw new Error("La clave de API para Gemini no está configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const audioParts = await Promise.all(
    files.map(async (file) => {
      const base64Audio = await fileToBase64(file);
      return {
        inlineData: {
          mimeType: file.type,
          data: base64Audio,
        },
      };
    })
  );

  const prompt = `
    Eres un sistema avanzado de análisis de audio. Tu tarea es procesar el(los) siguiente(s) archivo(s) de audio y devolver un análisis estructurado en formato JSON.

    Realiza las siguientes tareas:
    1.  **Transcripción con Diarización:** Transcribe el audio completo. Identifica a cada locutor distinto y etiquétalo consistentemente (por ejemplo, "Locutor 1", "Locutor 2"). Si puedes identificar sus nombres reales a partir de la conversación, úsalos como etiquetas.
    2.  **Identificación de Interlocutores:** Crea una lista con los nombres de todos los interlocutores identificados.
    3.  **Resumen:** Escribe un resumen conciso de la conversación, destacando los puntos clave, decisiones y acciones acordadas. Menciona a los interlocutores por su nombre si fueron identificados.
    4.  **Título:** Genera un título breve y descriptivo para la conversación.

    Asegúrate de que tu respuesta se ajuste estrictamente al esquema JSON proporcionado. Responde siempre en español.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Un título breve y descriptivo para la conversación." },
      summary: { type: Type.STRING, description: "Un resumen detallado de la conversación, identificando a los participantes por su nombre si es posible." },
      speakers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Una lista de los nombres de todos los locutores identificados en el audio."
      },
      transcript: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, description: "El identificador del locutor para este segmento (e.g., 'Locutor 1', 'Ana', 'Carlos')." },
            text: { type: Type.STRING, description: "El texto transcrito para este segmento." }
          },
          required: ["speaker", "text"],
        },
        description: "La transcripción completa de la conversación, dividida por locutor."
      }
    },
    required: ["title", "summary", "speakers", "transcript"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [{ text: prompt }, ...audioParts] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text.trim();
    // Clean potential markdown code block delimiters
    const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '');
    const transcriptionData: NewTranscriptionData = JSON.parse(cleanedJsonString);
    
    return transcriptionData;

  } catch (error) {
    console.error("Error processing audio with Gemini:", error);
    let errorMessage = "Hubo un error al procesar el audio. Por favor, revisa la consola para más detalles.";
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            errorMessage = "La clave de API no es válida. Por favor, verifica tu configuración.";
        } else if (error.message.includes('quota')) {
            errorMessage = "Has excedido tu cuota de uso. Por favor, revisa tu plan.";
        } else if (error.message.includes('Invalid')) {
             errorMessage = "El formato de audio no es válido o está corrupto. Intenta con otro archivo.";
        }
    }
    throw new Error(errorMessage);
  }
};


export const askQuestionAboutTranscript = async (transcript: string, question: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Eres un asistente experto que responde preguntas basándose EXCLUSIVAMENTE en el texto de una transcripción.
      No inventes información que no esté en el texto.
      Responde siempre de forma concisa y en español.

      ---
      TRANSCRIPCIÓN:
      ${transcript}
      ---

      PREGUNTA:
      ${question}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error asking question to Gemini:", error);
    return "Lo siento, no pude procesar tu pregunta en este momento.";
  }
};