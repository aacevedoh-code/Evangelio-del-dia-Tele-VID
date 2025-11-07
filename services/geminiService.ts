
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LiturgicalDay } from '../types';

// Decodes a base64 string into a Uint8Array.
export function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper to write a string to a DataView.
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Creates a WAV file Blob from raw PCM data.
export function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // file-size - 8
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size (16 for PCM)
    view.setUint16(20, 1, true); // audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    const audioBytes = new Uint8Array(buffer, 44);
    audioBytes.set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const readingSchema = {
    type: Type.OBJECT,
    properties: {
        cita: { type: Type.STRING, description: 'Cita bíblica completa. Ej: Isaías 2, 1-5' },
        texto: { type: Type.STRING, description: 'El texto bíblico completo correspondiente a la cita.' },
    },
    required: ['cita', 'texto'],
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        fecha: { type: Type.STRING, description: 'La fecha para la cual se generaron las lecturas, en formato YYYY-MM-DD.' },
        diaLiturgico: { type: Type.STRING, description: 'Ej: I Domingo de Adviento, Miércoles de la V Semana de Pascua' },
        tiempoLiturgico: { type: Type.STRING, description: 'Adviento, Navidad, Cuaresma, Triduo Pascual, Pascua, T. Ordinario' },
        cicloDominical: { type: Type.STRING, nullable: true, description: 'A, B, o C. Nulo para ferias.' },
        cicloFerial: { type: Type.STRING, nullable: true, description: 'I o II. Nulo para domingos/solemnidades.' },
        tipoCelebracion: { type: Type.STRING, description: 'Solemnidad, Fiesta, Memoria Obligatoria, Memoria Libre, Feria' },
        primeraLectura: readingSchema,
        salmoResponsorial: readingSchema,
        segundaLectura: { ...readingSchema, nullable: true, description: 'Lectura completa. Nulo si no aplica.' },
        evangelio: readingSchema,
    },
    required: ['fecha', 'diaLiturgico', 'tiempoLiturgico', 'tipoCelebracion', 'primeraLectura', 'salmoResponsorial', 'evangelio']
};

export async function getLiturgicalReadings(date: string): Promise<LiturgicalDay> {
    const prompt = `
        Genera las lecturas litúrgicas y el texto bíblico completo para la fecha ${date}.
        Debes seguir ESTRICTAMENTE el Ordo Litúrgico Católico Romano aprobado para Colombia por la Conferencia Episcopal de Colombia (CEC). Ignora cualquier otra variación regional.
        
        Instrucciones:
        1.  Para la fecha ${date}, determina el Tiempo Litúrgico, el tipo de celebración (Solemnidad, Fiesta, Memoria, Feria), y los ciclos bíblicos correspondientes (Ciclo Dominical A, B, o C; Ciclo Ferial I o II) que se usan en Colombia.
        2.  Para cada lectura (Primera Lectura, Salmo Responsorial, Segunda Lectura, Evangelio), proporciona un objeto con la 'cita' y el 'texto' completo.
        3.  El texto bíblico debe ser de una versión aprobada para la liturgia en Colombia (ej. la versión oficial de la Conferencia Episcopal de Colombia, si está disponible, o una traducción de uso común como la Biblia de Jerusalén).
        4.  Para el Salmo Responsorial, formatea el texto con saltos de línea para la antífona (R.) y las estrofas.
        5.  La Segunda Lectura solo se incluye los domingos y solemnidades. Para otros días, el campo 'segundaLectura' debe ser nulo.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2
            },
        });
        
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse;

    } catch (error) {
        console.error("Error fetching liturgical readings:", error);
        throw new Error("Failed to fetch liturgical readings from Gemini API.");
    }
}

export async function generateAudioFromText(text: string): Promise<string | null> {
  try {
    const prompt = `Lee el siguiente texto. La voz del "Narrador" debe ser tranquila y emocional. La voz del "LectorEvangelio" debe ser solemne y clara.\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Narrador', // Female narrator for non-Gospel parts
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' } 
                }
              },
              {
                speaker: 'LectorEvangelio', // Male reader for the Gospel
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Zephyr' }
                }
              }
            ]
          }
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return base64Audio || null;
  } catch (error) {
    console.error("Error generating audio:", error);
    // Return null to indicate failure, allowing the UI to handle it gracefully.
    return null;
  }
}
