
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { ReadingsCard } from './components/ReadingsCard';
import { Spinner } from './components/Spinner';
import { WelcomeMessage } from './components/WelcomeMessage';
import { ErrorMessage } from './components/ErrorMessage';
import { getLiturgicalReadings, generateAudioFromText, decodeBase64, createWavBlob } from './services/geminiService';
import { LiturgicalDay, Reading } from './types';

export default function App() {
  const [readings, setReadings] = useState<LiturgicalDay | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const audioUrlRef = useRef<string | null>(null);

  // Effect to clean up blob URL when the component unmounts or a new date is fetched.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const handleFetchReadings = useCallback(async (date: string) => {
    // Revoke any existing blob URL to prevent memory leaks
    if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    setReadings(null);
    setShowWelcome(false);
    try {
      // 1. Fetch text readings first to display them as soon as possible
      const textReadings = await getLiturgicalReadings(date);
      document.title = `Evangelio del día | ${textReadings.diaLiturgico}`;

      // 2. Set the state with text only first, so the user sees the content
      setReadings(textReadings);

      // 3. Combine all text for a multi-speaker audio generation.
      const createReadingPrompt = (speaker: string, title: string, reading: Reading | null) => {
        if (!reading || !reading.texto) return '';
        const cleanedText = reading.texto.replace(/R\./g, 'Respuesta:');
        return `${speaker}: ${title}. Cita: ${reading.cita}. ${cleanedText}\n\n`;
      };

      let multiSpeakerPrompt = `Narrador: Lecturas para ${textReadings.diaLiturgico}.\n\n`;
      multiSpeakerPrompt += createReadingPrompt('Narrador', 'Primera Lectura', textReadings.primeraLectura);
      multiSpeakerPrompt += createReadingPrompt('Narrador', 'Salmo Responsorial', textReadings.salmoResponsorial);
      if (textReadings.segundaLectura) {
        multiSpeakerPrompt += createReadingPrompt('Narrador', 'Segunda Lectura', textReadings.segundaLectura);
      }
      multiSpeakerPrompt += createReadingPrompt('LectorEvangelio', 'Evangelio', textReadings.evangelio);

      // 4. Generate the audio from the combined text.
      const audioB64 = await generateAudioFromText(multiSpeakerPrompt);
      
      let finalReadings = { ...textReadings, audioSrc: undefined };

      if (audioB64) {
        try {
            const pcmData = decodeBase64(audioB64);
            // Gemini TTS provides 24kHz, 1-channel, 16-bit PCM audio.
            const wavBlob = createWavBlob(pcmData, 24000, 1, 16);
            const wavUrl = URL.createObjectURL(wavBlob);
            audioUrlRef.current = wavUrl;
            finalReadings.audioSrc = wavUrl;
        } catch(audioProcessingError) {
            console.error("Failed to process and create WAV file:", audioProcessingError);
            // Audio generation failed, but we still have text.
        }
      }
      
      // 5. Set the final state with text and the single audio source.
      setReadings(finalReadings);

    } catch (err) {
      setError('No se pudieron obtener las lecturas. Por favor, intente con otra fecha o verifique la configuración.');
      document.title = 'Error | Evangelio del día';
      console.error(err);
      setReadings(null); // Clear any partial data
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch today's readings on initial load
  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      handleFetchReadings(today);
  }, [handleFetchReadings]);


  return (
    <>
      <div className="min-h-screen bg-transparent text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
        <Header />
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Controls onFetch={handleFetchReadings} isLoading={isLoading} />
            <div className="mt-8 min-h-[400px] flex items-center justify-center">
              {showWelcome && <WelcomeMessage />}
              {isLoading && !readings && <Spinner />}
              {error && <ErrorMessage message={error} />}
              {readings && <ReadingsCard data={readings} />}
            </div>
          </div>
        </main>
        <footer className="text-center p-4 mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>Generado con la asistencia de IA. Siempre verifique las lecturas con una fuente litúrgica oficial.</p>
        </footer>
      </div>
    </>
  );
}
