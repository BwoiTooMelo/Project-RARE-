import React, { useEffect, useRef } from 'react';
import { useLogs } from '../../context/LogContext';

interface VideoCanvasProps {
  prompt: string;
  theme: string;
  isGenerating: boolean;
  duration: number;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  prompt,
  theme,
  isGenerating,
  duration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { addLog } = useLogs();

  // The canvas should keep animating/rendering so there's always live content
  // to capture for export, even while idle. "isGenerating" reflects the
  // simulated AI render step in workspace.tsx, not whether the canvas itself
  // should be drawing — so it no longer gates the render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    addLog('RENDER', 'High-fidelity prompt-reactive visual canvas matrix actively computing frames.');

    // Set canvas size once, outside the per-frame loop, so we never reset
    // drawing state mid-animation or mid-recording.
    if (canvas.width !== 360 || canvas.height !== 640) {
      canvas.width = 360;
      canvas.height = 640;
    }

    const render = () => {
      frame++;

      // Base matrix cleanup
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Determine theme rules based on style selection and prompt strings
      const lowerPrompt = prompt.toLowerCase();

      if (theme === 'neon' || lowerPrompt.includes('neon') || lowerPrompt.includes('palm')) {
        // Theme 1: Cyber Neon Matrix / Palm Grid
        ctx.strokeStyle = 'rgba(0, 214, 255, 0.4)';
        ctx.lineWidth = 2;

        // Grid lines mapping
        const gridY = (frame % 40);
        for (let y = gridY; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Synthwave Sun
        const grad = ctx.createRadialGradient(180, 250, 10, 180, 250, 120);
        grad.addColorStop(0, '#ff00ff');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(180, 250, 100, 0, Math.PI * 2);
        ctx.fill();

      } else if (theme === 'mist' || lowerPrompt.includes('beach') || lowerPrompt.includes('mist')) {
        // Theme 2: Cinematic Noir Fog / Volumetric Shadows
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a1a1a');
        gradient.addColorStop(1, '#020202');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blurring mist particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 15; i++) {
          const shiftX = Math.sin(frame * 0.01 + i) * 50 + 150;
          const shiftY = ((frame * 0.5 + i * 40) % canvas.height);
          ctx.beginPath();
          ctx.arc(shiftX, shiftY, 60 + i * 4, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (theme === 'galaxy' || lowerPrompt.includes('galaxy') || lowerPrompt.includes('stars')) {
        // Theme 3: Cosmic Afrofuturism / Golden Nebula
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.7, '#120224');
        grad.addColorStop(1, '#2b041b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rotating particle constellation
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 35; i++) {
          const angle = (frame * 0.005) + (i * 0.3);
          const radius = 20 + i * 6;
          const x = 180 + Math.cos(angle) * radius;
          const y = 320 + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(x, y, (i % 3 === 0) ? 2.5 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Theme 4: Default Lo-Fi Ambient Reactive Universe
        const timeMod = frame * 0.02;
        const colorGrad = ctx.createRadialGradient(180, 320, 20, 180, 320, 220);
        colorGrad.addColorStop(0, `rgba(139, 92, 246, ${0.15 + Math.sin(timeMod) * 0.05})`);
        colorGrad.addColorStop(1, '#000000');
        ctx.fillStyle = colorGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render abstract rolling audio vector waves
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const y = 320 + Math.sin(x * 0.03 + timeMod) * 25 * Math.cos(x * 0.01);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Display real-time UI stats overlay on top edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, 32);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px monospace';
      ctx.fillText(
        `SEEDANCE 2.0 // RENDER STATE: ${isGenerating ? 'COMPILING' : 'ACTIVE'}`,
        12,
        20
      );
      ctx.fillText(`${duration}s MAX`, canvas.width - 65, 20);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prompt, theme, isGenerating, duration, addLog]);

  return (
    <div className="relative aspect-[9/16] w-full max-w-[320px] mx-auto rounded-xl overflow-hidden border border-rare-border bg-black shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <p className="text-xs text-zinc-500 font-mono tracking-wider animate-pulse">
            COMPILING RENDER // SEEDANCE 2.0
          </p>
        </div>
      )}
    </div>
  );
};
