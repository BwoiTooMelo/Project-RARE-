import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLogs } from '../../context/LogContext';
import { useLocalization } from '../../context/LocalizationContext';
import { VideoCanvas } from './video-canvas';
import {
  multiplexMediaStream,
  triggerFileDownload,
  getAvailableResolutions,
  getResolutionLabel,
  isResolutionAllowed,
  type ResolutionTier,
} from '../../lib/download-engine';
import {
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  Clock,
  Volume2,
  Lock,
  ChevronDown
} from 'lucide-react';

interface StyleArchive {
  id: string;
  name: string;
  description: string;
  theme: string;
}

const ALL_RESOLUTIONS: ResolutionTier[] = ['720p', '1080p', '4k'];

export const Workspace: React.FC = () => {
  const { user } = useAuth();
  const { addLog } = useLogs();
  const { currency, formatPrice } = useLocalization();

  const plan = user?.plan ?? 'free';

  // State Management
  const [prompt, setPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState(15);
  const [selectedStyle, setSelectedStyle] = useState('cyber-neon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationsLeft, setGenerationsLeft] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [resolution, setResolution] = useState<ResolutionTier>('720p');
  const [isResolutionMenuOpen, setIsResolutionMenuOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Canvas & Audio References
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const styleArchives: StyleArchive[] = [
    {
      id: 'afrofuturism',
      name: 'Afrofuturism',
      description: 'Cosmic heritage meets tomorrow',
      theme: 'galaxy'
    },
    {
      id: 'cinematic-noir',
      name: 'Cinematic Noir',
      description: 'Shadows tell the story',
      theme: 'mist'
    },
    {
      id: 'cyber-neon',
      name: 'Cyber Neon',
      description: 'Electric pulse of the future',
      theme: 'neon'
    }
  ];

  const quickPrompts = [
    'Cyber Neon Palm Trees',
    'Dark Beach Mist',
    'Lo-fi Rain Window',
    'Galaxy Stars'
  ];

  // Handle Slider Changes
  const handleDurationChange = (value: number) => {
    setVideoDuration(value);
    addLog('SLIDER', `Target clip length adjusted to user setting: ${value} seconds.`);
  };

  // Audio Upload & Decode
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    addLog('AUDIO', `Sync timeline initialized. Uploaded file: ${file.name}`);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Actually decode the file into a reusable AudioBuffer so it can be
      // fed into the export pipeline. Previously this was never done, so
      // uploaded audio never made it into the downloaded video at all.
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = decoded;

      addLog('AUDIO', `Web Audio API multiplexer engaged. Buffer decoded (${decoded.duration.toFixed(1)}s).`);
    } catch (err) {
      audioBufferRef.current = null;
      addLog('AUDIO', 'Failed to initialize or decode Web Audio buffer.');
    }
  };

  // Toggle Audio Playback Simulation
  const toggleAudioPlayback = () => {
    if (!audioFile) return;
    setIsPlayingAudio(!isPlayingAudio);
    addLog('AUDIO', isPlayingAudio ? 'Audio playback paused.' : 'Audio playback started for canvas synchronization.');
  };

  // RARE Pulse Engine — Beat-Reactive Visual Generation Trigger
  const handleGenerate = () => {
    if (!prompt.trim()) {
      addLog('AI_PROMPT', 'Warning: Prompt definition empty. Awaiting user parameters.');
      return;
    }

    setIsGenerating(true);
    addLog('AI_PROMPT', `Pulse Engine compiled tokens: "${prompt}" [Style: ${selectedStyle}]`);
    addLog('RENDER', 'Beat-reactive visual canvas actively computing frames.');

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationsLeft(prev => Math.max(0, prev - 1));
      addLog('RENDER', 'Pulse Engine buffer compilation finished. Presentation matrix active.');
    }, 2500);
  };

  const handleSelectResolution = (tier: ResolutionTier) => {
    if (!isResolutionAllowed(plan, tier)) {
      addLog('DOWNLOAD', `Export resolution ${getResolutionLabel(tier)} requires a higher subscription tier.`);
      return;
    }
    setResolution(tier);
    setIsResolutionMenuOpen(false);
    addLog('DOWNLOAD', `Export resolution set to ${getResolutionLabel(tier)}.`);
  };

  // Real MP4 export via WebCodecs + mp4-muxer (download-engine.ts), with
  // resolution gated by subscription plan.
  const handleDownloadMP4 = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      addLog('DOWNLOAD', 'Error: Target render pipeline canvas context missing.');
      return;
    }

    if (!isResolutionAllowed(plan, resolution)) {
      setDownloadError(`${getResolutionLabel(resolution)} export requires an upgraded plan.`);
      addLog('DOWNLOAD', `Blocked export: ${getResolutionLabel(resolution)} not available on "${plan}" plan.`);
      return;
    }

    setDownloadError(null);
    setIsRecording(true);
    setRecordingProgress(0);
    addLog('DOWNLOAD', `Initializing ${getResolutionLabel(resolution)} timeline encoder for ${videoDuration}s render.`);

    // Coarse progress indicator while encoding runs (real frame-by-frame
    // progress would require threading callbacks out of the engine, but this
    // keeps the UI honest about approximate elapsed time).
    const totalMs = videoDuration * 1000;
    const stepMs = 100;
    let elapsedMs = 0;
    const progressInterval = setInterval(() => {
      elapsedMs += stepMs;
      setRecordingProgress(Math.min(99, (elapsedMs / totalMs) * 100));
    }, stepMs);

    try {
      const result = await multiplexMediaStream({
        canvas,
        audioBuffer: audioBufferRef.current,
        duration: videoDuration,
        fps: 30,
        resolution,
        plan,
      });

      clearInterval(progressInterval);
      setRecordingProgress(100);

      triggerFileDownload(result, `RARE_${selectedStyle}_${videoDuration}s_${resolution}`);

      addLog(
        'DOWNLOAD',
        `Export complete: ${result.extension.toUpperCase()} container, ${getResolutionLabel(resolution)}, ${videoDuration}s.`
      );
    } catch (err) {
      addLog('DOWNLOAD', `Export failed: ${err instanceof Error ? err.message : 'Unknown encoding error.'}`);
      setDownloadError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      clearInterval(progressInterval);
      setIsRecording(false);
      setRecordingProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-6 relative z-10">
      {/* Left Interface Configuration Column */}
      <div className="lg:col-span-7 space-y-6">

        {/* Audio Dock */}
        <div className="glass-panel border border-rare-border p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-rare-accent-cyan to-transparent opacity-50"></div>
          <h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-rare-accent-cyan" /> Audio Dock
          </h3>

          <label className="border-2 border-dashed border-neutral-800 hover:border-rare-accent-cyan/40 bg-black/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/dock">
            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            <Upload className="w-8 h-8 text-neutral-600 group-hover/dock:text-rare-accent-cyan transition-colors mb-2" />
            <p className="text-sm font-medium text-neutral-300">
              {audioFile ? audioFile.name : 'Drop your audio here'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">WAV, MP3 supported</p>
          </label>

          {audioFile && (
            <div className="mt-4 flex items-center justify-between bg-neutral-900/60 border border-neutral-800 px-4 py-2 rounded-lg">
              <span className="text-xs text-neutral-400 truncate max-w-[70%]">{audioFile.name}</span>
              <button
                onClick={toggleAudioPlayback}
                className="p-1.5 rounded-full bg-rare-border hover:bg-neutral-800 text-white transition-colors"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
            </div>
          )}
        </div>

        {/* Prompt Engine */}
        <div className="glass-panel border border-rare-border p-6 rounded-xl relative overflow-hidden">
          <h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rare-accent-purple" /> Prompt Engine
          </h3>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder="Describe your cinematic universe..."
              className="w-full h-32 bg-black border border-neutral-800 focus:border-rare-accent-purple/50 focus:outline-none rounded-xl p-4 text-sm text-white placeholder-neutral-600 resize-none transition-colors"
            />
            <div className="absolute bottom-3 right-3 text-xs text-neutral-600 font-mono">
              {prompt.length} / 500
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-neutral-500 font-medium">Quick prompts:</span>
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => {
                  setPrompt(qp);
                  addLog('AI_PROMPT', `Quick prompt injected: "${qp}"`);
                }}
                className="text-xs bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 px-2.5 py-1 rounded-md transition-all text-neutral-400"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Video Duration Slider */}
        <div className="glass-panel border border-rare-border p-6 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-rare-accent-gold" /> Video Duration
            </h3>
            <span className="text-sm font-mono font-bold text-rare-accent-gold bg-rare-accent-gold/10 px-2.5 py-0.5 rounded border border-rare-accent-gold/20">
              {videoDuration}s
            </span>
          </div>

          <div className="space-y-4">
            <input
              type="range"
              min="15"
              max="20"
              step="1"
              value={videoDuration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="w-full accent-rare-accent-gold bg-neutral-900 h-2 rounded-lg cursor-pointer appearance-none"
            />
            <div className="flex justify-between text-xs text-neutral-600 font-mono px-1">
              <span>15s</span>
              <span>16s</span>
              <span>17s</span>
              <span>18s</span>
              <span>19s</span>
              <span>20s</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[15, 17, 20].map((t) => (
                <button
                  key={t}
                  onClick={() => handleDurationChange(t)}
                  className={`text-xs font-mono py-1.5 rounded-lg border transition-all ${
                    videoDuration === t
                      ? 'bg-rare-accent-gold/10 border-rare-accent-gold text-rare-accent-gold font-bold shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {t}s clip
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style Archives Matrix */}
        <div className="glass-panel border border-rare-border p-6 rounded-xl relative overflow-hidden">
          <h3 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rare-accent-magenta" /> Style Archives
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {styleArchives.map((style) => {
              const isActive = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    setSelectedStyle(style.id);
                    addLog('RENDER', `Active matrix filter shifted to style profile: ${style.name}`);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                    isActive
                      ? 'bg-black border-neutral-400 ring-1 ring-neutral-400 shadow-lg shadow-white/5'
                      : 'bg-neutral-950/60 border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  <p className="text-xs font-bold text-white tracking-wide">{style.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed group-hover:text-neutral-400 transition-colors">
                    {style.description}
                  </p>
                  {isActive && (
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-white"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-900/60 flex items-center justify-between">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex-1 max-w-xs flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-lg premium-btn text-white disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden ${
                selectedStyle === 'cyber-neon' ? 'glow-accent' : selectedStyle === 'cinematic-noir' ? 'glow-purple' : 'glow-magenta'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Compiling Render...' : 'Generate Render [RARE Pulse Engine]'}
            </button>
            <div className="text-right">
              <p className="text-[11px] text-neutral-500 font-mono">Quota Allotment</p>
              <p className="text-xs text-neutral-300 font-mono font-semibold">{generationsLeft} generations remaining</p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Real-time Viewport Render Column */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="glass-panel border border-rare-border rounded-xl p-4 flex flex-col items-center justify-center flex-1 min-h-[450px] lg:min-h-0 relative group">

          {/* Active Ambient Floating Under-glow Rings */}
          <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 opacity-20 blur-[80px] rounded-xl ${
            selectedStyle === 'cyber-neon' ? 'bg-rare-accent-cyan' : selectedStyle === 'cinematic-noir' ? 'bg-rare-accent-purple' : 'bg-rare-accent-magenta'
          }`} />

          {/* Prompt-reactive Canvas Container */}
          <div className="w-full max-w-[280px] aspect-[9/16] bg-black border border-neutral-900 rounded-lg overflow-hidden shadow-2xl relative flex flex-col justify-between z-10">
            <VideoCanvas
              prompt={prompt}
              theme={styleArchives.find(s => s.id === selectedStyle)?.theme || 'neon'}
              isGenerating={isGenerating}
              duration={videoDuration}
            />
          </div>

          {/* Resolution Picker */}
          <div className="w-full max-w-[280px] mt-4 z-10 relative">
            <button
              onClick={() => setIsResolutionMenuOpen((v) => !v)}
              disabled={isRecording}
              className="w-full flex items-center justify-between gap-2 text-xs font-medium tracking-wide py-2 px-3 rounded-lg bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <span>Quality: {getResolutionLabel(resolution)}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isResolutionMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isResolutionMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-xl">
                {ALL_RESOLUTIONS.map((tier) => {
                  const allowed = isResolutionAllowed(plan, tier);
                  const isSelected = tier === resolution;
                  return (
                    <button
                      key={tier}
                      onClick={() => handleSelectResolution(tier)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                        isSelected ? 'bg-rare-accent-cyan/10 text-rare-accent-cyan' : 'text-neutral-300 hover:bg-neutral-900'
                      } ${!allowed ? 'opacity-50' : ''}`}
                    >
                      <span>{getResolutionLabel(tier)}</span>
                      {!allowed && <Lock className="w-3 h-3 text-neutral-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Trigger Block */}
          <div className="w-full max-w-[280px] mt-2 space-y-2 z-10">
            <button
              onClick={handleDownloadMP4}
              disabled={isRecording || isGenerating}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold tracking-wide py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              {isRecording ? `Encoding MP4 (${Math.round(recordingProgress)}%)` : `Download MP4 (${videoDuration}s)`}
            </button>

            {isRecording && (
              <div className="w-full bg-neutral-900 h-[3px] rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-100 ease-linear"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            )}

            {downloadError && (
              <p className="text-[11px] text-rare-accent-magenta text-center pt-1">{downloadError}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
