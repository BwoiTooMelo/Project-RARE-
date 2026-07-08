import { useState } from 'react';
import { Play, Sparkles, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogs } from '../../context/LogContext';
import { Loader2 } from 'lucide-react';

interface WelcomeProps {
  onEnterStudio: () => void;
}

export function Welcome({ onEnterStudio }: WelcomeProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { login } = useAuth();
  const { addLog } = useLogs();

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    addLog('AUTH', 'Google Sign-In sequence simulation verified successfully.');
    await login();
    setIsSigningIn(false);

    setTimeout(() => {
      onEnterStudio();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-rare-black relative overflow-hidden flex flex-col">
      {/* Ambient glow rings */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[150px]"
          style={{
            background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #ff00ff 0%, transparent 70%)',
            bottom: '10%',
            right: '-10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            top: '40%',
            left: '-5%',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center shadow-lg shadow-rare-accent-cyan/20">
            <span className="text-2xl font-bold text-black">R</span>
          </div>
          <span className="text-xl font-bold text-white">
            Project <span className="gradient-text">RARE</span>
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Powered by Seedance 2.0
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-rare-border mb-8">
            <Sparkles className="w-4 h-4 text-rare-accent-cyan" />
            <span className="text-sm text-gray-300">AI-Powered Video Generation Studio</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            <span className="block">UNIVERSAL AI</span>
            <span className="block gradient-text">CINEMATIC RESYNC</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transform audio stems into prompt-reactive vertical video using{' '}
            <span className="text-white font-medium">Seedance 2.0</span> multi-shot intelligence.
          </p>

          {/* Auth Card */}
          <div className="max-w-md mx-auto">
            <div className="glass-panel rounded-2xl p-8 border border-rare-border relative overflow-hidden">
              {/* Glow effect */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                }}
              />

              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-2">Start Creating</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Sign in to access your studio workspace
                </p>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign In with Google</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-xs text-gray-500">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-gray-400 hover:text-white">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-16 border-t border-rare-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-white/[0.02] border border-rare-border hover:border-rare-accent-cyan/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rare-accent-cyan/20 to-rare-accent-cyan/5 flex items-center justify-center mx-auto mb-4">
                <Play className="w-7 h-7 text-rare-accent-cyan" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Audio-to-Video</h3>
              <p className="text-sm text-gray-400">
                Upload your audio stems and watch them transform into stunning visual narratives
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/[0.02] border border-rare-border hover:border-rare-accent-magenta/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rare-accent-magenta/20 to-rare-accent-magenta/5 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-rare-accent-magenta" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Prompt Reactive</h3>
              <p className="text-sm text-gray-400">
                Type your vision and watch the canvas respond with dynamic, AI-powered visuals
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white/[0.02] border border-rare-border hover:border-rare-accent-purple/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rare-accent-purple/20 to-rare-accent-purple/5 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-7 h-7 text-rare-accent-purple" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Premium Exports</h3>
              <p className="text-sm text-gray-400">
                Download uncorrupted MP4 files with audio stitched directly into video frames
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-rare-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            © 2024 Project RARE. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
