import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Music, Wand2, Palette, Play } from 'lucide-react';
import { useLogs } from '../../context/LogContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId: string;
  position: 'left' | 'center' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'audio',
    title: 'Audio Dock',
    description: 'Upload your original WAV/MP4 musical stems or type an audio URL.',
    icon: <Music className="w-6 h-6" />,
    targetId: 'audio-dock',
    position: 'left',
  },
  {
    id: 'prompt',
    title: 'Prompt Engine',
    description: 'Enter your narrative universe text commands (e.g., Cyber Neon Palm Trees).',
    icon: <Wand2 className="w-6 h-6" />,
    targetId: 'prompt-engine',
    position: 'left',
  },
  {
    id: 'style',
    title: 'Style Archives',
    description: 'Select your visual frequency layer: Afrofuturism, Cinematic Noir, or Cyber Neon.',
    icon: <Palette className="w-6 h-6" />,
    targetId: 'style-matrix',
    position: 'left',
  },
  {
    id: 'render',
    title: 'Render Button',
    description: 'Execute the Seedance 2.0 compile pipeline and download uncorrupted media.',
    icon: <Play className="w-6 h-6" />,
    targetId: 'render-button',
    position: 'left',
  },
];

interface TourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Tour({ isOpen, onClose, onComplete }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { addLog } = useLogs();

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      addLog('SYSTEM', 'Tour completed. Welcome to Project RARE!');
      onComplete();
      onClose();
    }
  }, [currentStep, addLog, onComplete, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    addLog('SYSTEM', 'Tour skipped. You can restart it anytime from settings.');
    onComplete();
    onClose();
  }, [addLog, onComplete, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleSkip]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />

      {/* Tour Card */}
      <div className="relative z-10 max-w-sm w-full mx-4">
        <div className="glass-panel rounded-2xl border border-rare-accent-cyan/30 overflow-hidden shadow-2xl">
          {/* Progress Bar */}
          <div className="h-1 bg-rare-border">
            <div
              className="h-full bg-gradient-to-r from-rare-accent-cyan to-rare-accent-purple transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rare-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-rare-accent-cyan">STEP {currentStep + 1}</span>
              <span className="text-xs text-gray-500">of {TOUR_STEPS.length}</span>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-rare-border rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center mx-auto mb-6">
              <span className="text-black">{step.icon}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
            <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {TOUR_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-rare-accent-cyan'
                      : index < currentStep
                      ? 'bg-rare-accent-purple'
                      : 'bg-rare-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-rare-border bg-rare-panel/50">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentStep === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-rare-border'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-6 py-2 premium-btn rounded-lg text-sm font-medium text-black"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-rare-border rounded text-gray-400">Esc</kbd> to skip,{' '}
          <kbd className="px-1.5 py-0.5 bg-rare-border rounded text-gray-400">→</kbd> to continue
        </p>
      </div>
    </div>
  );
}

// Hook for managing tour state
export function useTour() {
  const TOUR_KEY = 'rare_tour_completed';

  const isFirstTimeUser = () => {
    return !localStorage.getItem(TOUR_KEY);
  };

  const markTourComplete = () => {
    localStorage.setItem(TOUR_KEY, 'true');
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_KEY);
  };

  return { isFirstTimeUser, markTourComplete, resetTour };
}
