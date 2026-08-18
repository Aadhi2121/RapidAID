import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  UploadCloud,
  Radio,
  FileAudio,
  CheckCircle,
  AlertCircle,
  X,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Props {
  onAudioSelected?: (presetId: string, textPrompt: string, lang: string) => void;
  onFileUpload?: (file: File) => void;
  customFile?: File | null;
  onClearCustomFile?: () => void;
  isTranscribing?: boolean;
  transcriptionMeta?: {
    engine_used?: string;
    detected_language_name?: string;
    language?: string;
    confidence?: number;
    duration_seconds?: number;
  } | null;
}

export const AUDIO_SAMPLES = [
  {
    id: 'tamil_water',
    title: 'Tamil: Ward 12 Water Shortage',
    lang: 'Tamil',
    badge: 'ta',
    duration: '0:14',
    speaker: 'Senthil Nathan (Ward 12)',
    text: 'வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.',
    categoryHint: 'Water Supply',
  },
  {
    id: 'hindi_power',
    title: 'Hindi: Ward 8 Transformer Sparking',
    lang: 'Hindi',
    badge: 'hi',
    duration: '0:18',
    speaker: 'Rajesh Kumar (Ward 8)',
    text: 'वार्ड 8 में पिछले दो दिनों से बिजली नहीं है। ट्रांसफार्मर में स्पार्क हो रहा है और बच्चों की पढ़ाई रुक गई है।',
    categoryHint: 'Electricity',
  },
  {
    id: 'english_sewage',
    title: 'English: Anna Nagar Sewage Burst',
    lang: 'English',
    badge: 'en',
    duration: '0:16',
    speaker: 'Priya Ramanathan (Ward 104)',
    text: 'Severe sewage overflow and blocked drainage near Anna Nagar 2nd Avenue for 4 days affecting over 500 residents.',
    categoryHint: 'Drainage',
  },
];

export const AudioVisualizer: React.FC<Props> = ({
  onAudioSelected,
  onFileUpload,
  customFile,
  onClearCustomFile,
  isTranscribing = false,
  transcriptionMeta = null,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedSample, setSelectedSample] = useState<string>('tamil_water');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(14);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  // Handle custom audio object URL
  useEffect(() => {
    if (customFile) {
      const url = URL.createObjectURL(customFile);
      setCustomAudioUrl(url);
      setActiveTab('custom');
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setCustomAudioUrl(null);
    }
  }, [customFile]);

  // Audio element time tracking for custom file
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 14);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  // Simulated progress timer when playing preset samples
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && activeTab === 'presets') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            setCurrentTime(0);
            return 0;
          }
          const next = prev + 4;
          setCurrentTime(Math.round((next / 100) * 14));
          return next;
        });
      }, 300);
    } else if (activeTab === 'presets' && !isPlaying) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTab]);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const sample = AUDIO_SAMPLES.find((s) => s.id === sampleId);
    if (sample && onAudioSelected) {
      onAudioSelected(sample.id, sample.text, sample.badge);
    }
  };

  const togglePlay = () => {
    if (activeTab === 'custom' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((err) => console.warn('Audio play error:', err));
        setIsPlaying(true);
      }
    } else {
      // Preset audio playback
      if (!isPlaying) {
        const sample = AUDIO_SAMPLES.find((s) => s.id === selectedSample);
        if (sample && onAudioSelected) {
          onAudioSelected(sample.id, sample.text, sample.badge);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setValidationError(null);
    const validExtensions = ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.flac'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setValidationError(
        `Invalid audio format. Please upload a .wav, .mp3, .m4a, or .webm file (received: ${file.name}).`
      );
      return;
    }

    // Max 25MB check
    if (file.size > 25 * 1024 * 1024) {
      setValidationError('Audio file is too large. Maximum supported file size is 25MB.');
      return;
    }

    setActiveTab('custom');
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const currentSample = AUDIO_SAMPLES.find((s) => s.id === selectedSample) || AUDIO_SAMPLES[0];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md shadow-lg space-y-4">
      {/* Hidden Audio Element for Custom Files */}
      {customAudioUrl && (
        <audio
          ref={audioRef}
          src={customAudioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Header Stream Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-civic-500/10 text-civic-400 border border-civic-500/20">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">
              Citizen Audio Ingestion Stream
            </h3>
            <p className="text-xs text-slate-400">
              Multilingual Speech-to-Text & Acoustic Processor
            </p>
          </div>
        </div>

        {/* Ingestion Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('presets');
              setValidationError(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'presets'
                ? 'bg-civic-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo Presets
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              setValidationError(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-civic-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Custom Upload</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3 rounded-lg border border-rose-800/80 bg-rose-950/40 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: Preset Audio Buttons */}
      {activeTab === 'presets' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Available Demonstration Presets:
            </span>
            <span className="text-[11px] text-civic-400">Zero-GPU Offline Ready</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {AUDIO_SAMPLES.map((sample) => {
              const isSelected = selectedSample === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-civic-500/80 bg-civic-950/50 text-white shadow-sm ring-1 ring-civic-500/30'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {sample.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-civic-400 border border-slate-700">
                      {sample.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{sample.speaker}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tab 2: Custom Audio Upload & Drag and Drop Dropzone */
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".wav,.mp3,.m4a,.webm,.ogg,.flac,audio/*"
            className="hidden"
          />

          {!customFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-civic-400 bg-civic-950/50 ring-2 ring-civic-500/40'
                  : 'border-slate-700 hover:border-civic-500 bg-slate-950/60 hover:bg-slate-950/90'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-civic-500/10 text-civic-400 border border-civic-500/20">
                  <UploadCloud className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Drop your custom voice recording here, or{' '}
                    <span className="text-civic-400 underline underline-offset-2">browse file</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports <span className="text-slate-300 font-mono">.wav, .mp3, .m4a, .webm</span> (Max 25MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded Custom File Card */
            <div className="p-3.5 rounded-xl border border-civic-800/80 bg-slate-950/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-civic-600/20 text-civic-400 border border-civic-500/30 shrink-0">
                  <FileAudio className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white truncate">{customFile.name}</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Loaded
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFileSize(customFile.size)} • {customFile.type || 'audio/wav'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    if (onClearCustomFile) onClearCustomFile();
                    setActiveTab('presets');
                  }}
                  className="p-1 rounded-lg border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300"
                  title="Remove uploaded audio"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcription Engine Status Badge */}
      {transcriptionMeta && (
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                transcriptionMeta.engine_used?.toLowerCase().includes('whisper')
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
              ASR Engine:
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                transcriptionMeta.engine_used?.toLowerCase().includes('whisper')
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {transcriptionMeta.engine_used}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
            {transcriptionMeta.detected_language_name && (
              <span>
                Language: <strong className="text-civic-300">{transcriptionMeta.detected_language_name}</strong>
              </span>
            )}
            {transcriptionMeta.confidence && (
              <span>
                Confidence: <strong className="text-white">{Math.round(transcriptionMeta.confidence * 100)}%</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Audio Player & Dynamic Waveform Visualizer */}
      <div className="bg-slate-950 rounded-lg border border-slate-800/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={isTranscribing}
              className="p-2.5 rounded-full bg-civic-600 hover:bg-civic-500 disabled:opacity-50 text-white shadow-md transition-transform active:scale-95 shrink-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {activeTab === 'custom' && customFile ? customFile.name : currentSample.title}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>{activeTab === 'custom' ? 'Custom Citizen Recording' : currentSample.speaker}</span>
                <span>•</span>
                <span className="font-mono text-civic-400">
                  {activeTab === 'custom' ? formatDuration(audioDuration) : currentSample.duration}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Volume2 className="h-4 w-4 text-slate-500" />
            <span>{activeTab === 'custom' ? 'Audio Stream' : '48.0 kHz WAV'}</span>
          </div>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="flex items-center justify-between gap-1 h-12 px-2 bg-slate-900/90 rounded-md border border-slate-800 overflow-hidden">
          {Array.from({ length: 38 }).map((_, i) => {
            const barProgress = (i / 38) * 100;
            const isBarActive = barProgress <= progress;
            const heightPct = 25 + Math.sin(i * 0.7) * 45 + ((i % 5) * 6);
            return (
              <div
                key={i}
                style={{
                  height: `${heightPct}%`,
                  transform:
                    isPlaying || isTranscribing
                      ? `scaleY(${0.6 + Math.sin((i + progress) * 0.3) * 0.4})`
                      : 'scaleY(0.7)',
                }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isBarActive || isTranscribing
                    ? isTranscribing
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-civic-400 shadow-sm shadow-civic-500/50'
                    : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{activeTab === 'custom' ? formatDuration(audioDuration) : currentSample.duration}</span>
        </div>
      </div>
    </div>
  );
};

