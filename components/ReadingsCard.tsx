

import React, { useState, useEffect, useRef } from 'react';
import { LiturgicalDay, LiturgicalSeason, Reading } from '../types';
// Removed unused 'AudioWaveIcon' import which was causing an error.
import { BookOpenIcon, CrossIcon, SunIcon, CalendarIcon, ShareIcon, XIcon, WhatsAppIcon, FacebookIcon, EmailIcon, CopyIcon, PlayIcon, PauseIcon } from './icons';

interface ReadingsCardProps {
  data: LiturgicalDay;
}

const seasonColors: { [key in LiturgicalSeason]: { bg: string; text: string; border: string } } = {
    [LiturgicalSeason.Adviento]: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-500' },
    [LiturgicalSeason.Cuaresma]: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-500' },
    [LiturgicalSeason.Navidad]: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-400' },
    [LiturgicalSeason.Pascua]: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-400' },
    [LiturgicalSeason.Ordinario]: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', border: 'border-green-500' },
    [LiturgicalSeason.TriduoPascual]: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', border: 'border-red-500' },
};

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);
  
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
  
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };
  
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => setIsPlaying(false);
  
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleEnded);
  
      // Reset state if src changes
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setProgress(0);
  
      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleEnded);
      };
    }, [src]);
  
    useEffect(() => {
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      } else {
        setProgress(0);
      }
    }, [currentTime, duration]);
  
    const togglePlayPause = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    };
  
    const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio) return;
      const time = Number(e.target.value);
      audio.currentTime = time;
      setCurrentTime(time);
    };
  
    const formatTime = (timeInSeconds: number) => {
      if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return '00:00';
      const floorTime = Math.floor(timeInSeconds);
      const minutes = Math.floor(floorTime / 60);
      const seconds = floorTime % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
  
    return (
      <div className="mt-4 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600/50">
        <audio ref={audioRef} src={src} preload="metadata"></audio>
        <button 
          onClick={togglePlayPause} 
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-800 transition-transform transform active:scale-95 shadow-md"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6 ml-1" />}
        </button>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{formatTime(currentTime)}</span>
          <div className="relative w-full">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="any"
                value={currentTime}
                onChange={handleTimeSliderChange}
                className="slider-progress w-full h-2 rounded-lg cursor-pointer"
                style={{'--seek-before-width': `${progress}%`} as React.CSSProperties}
                aria-label="Barra de progreso del audio"
              />
          </div>
          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{formatTime(duration)}</span>
        </div>
      </div>
    );
};

const ReadingItem: React.FC<{ title: string; reading: Reading | null; icon: React.ReactNode }> = ({ title, reading, icon }) => {
    if (!reading) return null;

    const isPsalm = title.toLowerCase().includes('salmo');
    
    return (
        <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg transition-shadow duration-300 hover:shadow-md">
            <h3 className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
              {icon}
              {title}
            </h3>
            <p className="text-lg font-serif font-medium text-gray-800 dark:text-gray-100 mb-3">{reading.cita}</p>
            <div className="text-gray-700 dark:text-gray-200 leading-relaxed space-y-4">
                {isPsalm ? (
                    <blockquote className="whitespace-pre-wrap">{reading.texto}</blockquote>
                ) : (
                    reading.texto.split('\n').filter(line => line.trim() !== '').map((paragraph, index) => <p key={index}>{paragraph}</p>)
                )}
            </div>
        </div>
    );
};

export const ReadingsCard: React.FC<ReadingsCardProps> = ({ data }) => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  const colors = seasonColors[data.tiempoLiturgico] || seasonColors[LiturgicalSeason.Ordinario];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-CO', options);
  };

  const shareData = {
    title: `Evangelio de hoy: ${data.diaLiturgico}`,
    text: `Descubre las lecturas del día (${data.diaLiturgico} - ${formatDate(data.fecha)}) en el Lector Divino de Televid.`,
    url: "https://televid.tv/santa-misa/",
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
      setCopyStatus('copied');
      setTimeout(() => {
        setCopyStatus('idle');
        setIsShareMenuOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      alert('No se pudo copiar el enlace.');
    }
  };

  const shareOptions = [
    { name: 'WhatsApp', icon: <WhatsAppIcon className="h-5 w-5 mr-3" />, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}` },
    { name: 'X (Twitter)', icon: <XIcon className="h-5 w-5 mr-3" />, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}` },
    { name: 'Facebook', icon: <FacebookIcon className="h-5 w-5 mr-3" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}` },
    { name: 'Email', icon: <EmailIcon className="h-5 w-5 mr-3" />, href: `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}` },
  ];

  return (
    <article className={`w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border-t-4 ${colors.border} ${colors.bg} animate-fade-in`}>
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}</style>
        <div className="p-6 md:p-8">
            <header className="mb-6 border-b pb-4 border-gray-200 dark:border-gray-700/80">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <p className={`font-semibold text-lg ${colors.text}`}>{data.tiempoLiturgico}</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-1">
                      <span className="font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Evangelio de hoy: </span>
                      {data.diaLiturgico}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 text-sm mt-3 text-gray-600 dark:text-gray-400">
                        <span className="flex items-center whitespace-nowrap"><CalendarIcon className="h-4 w-4 mr-1.5"/> {formatDate(data.fecha)}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="whitespace-nowrap">{data.tipoCelebracion}</span>
                        {data.cicloDominical && <><span className="hidden md:inline">•</span><span className="whitespace-nowrap">Ciclo {data.cicloDominical}</span></>}
                        {data.cicloFerial && <><span className="hidden md:inline">•</span><span className="whitespace-nowrap">Año {data.cicloFerial}</span></>}
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 self-end sm:self-auto" ref={shareMenuRef}>
                      <button
                        onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Compartir lecturas"
                        aria-haspopup="true"
                        aria-expanded={isShareMenuOpen}
                      >
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Compartir
                      </button>
                      {isShareMenuOpen && (
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                  {shareOptions.map((option) => (
                                      <a
                                          key={option.name}
                                          href={option.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                          role="menuitem"
                                      >
                                          {option.icon}
                                          <span>{option.name}</span>
                                      </a>
                                  ))}
                                  <button
                                      onClick={handleCopyToClipboard}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      role="menuitem"
                                  >
                                      <CopyIcon className="h-5 w-5 mr-3" />
                                      <span>{copyStatus === 'copied' ? '¡Copiado!' : 'Copiar enlace'}</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                </div>
                {data.audioSrc ? <AudioPlayer src={data.audioSrc} /> :
                  (
                      <div className="mt-4 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600/50">
                          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm font-medium">Generando audio de las lecturas...</span>
                          </div>
                      </div>
                  )
                }
            </header>
            <div className="space-y-6">
                <ReadingItem title="Primera Lectura" reading={data.primeraLectura} icon={<BookOpenIcon className="h-5 w-5 mr-2" />} />
                <ReadingItem title="Salmo Responsorial" reading={data.salmoResponsorial} icon={<SunIcon className="h-5 w-5 mr-2" />} />
                <ReadingItem title="Segunda Lectura" reading={data.segundaLectura} icon={<BookOpenIcon className="h-5 w-5 mr-2" />} />
                <ReadingItem title="Evangelio" reading={data.evangelio} icon={<CrossIcon className="h-5 w-5 mr-2" />} />
            </div>
        </div>
    </article>
  );
};
