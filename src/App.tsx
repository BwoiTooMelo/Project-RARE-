import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Info,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocalizationProvider } from './context/LocalizationContext';
import { LogProvider } from './context/LogContext';
import { Welcome } from './components/rare/welcome';
import { Tour, useTour } from './components/rare/tour';
import { Workspace } from './components/rare/workspace';
import { Pricing } from './components/rare/pricing';
import { Footer } from './components/rare/footer';
import { DebugLogs } from './components/rare/debug-logs';

type AppView = 'welcome' | 'studio' | 'pricing' | 'about';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const { isAuthenticated, user, logout, login } = useAuth();
  const { isFirstTimeUser, markTourComplete } = useTour();

  // Check if we should show the tour when entering studio
  useEffect(() => {
    if (currentView === 'studio' && isFirstTimeUser()) {
      setShowTour(true);
    }
  }, [currentView, isFirstTimeUser]);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('rare_session');
    if (stored) {
      try {
        JSON.parse(stored);
        setCurrentView('studio');
      } catch {
        // Invalid session, stay on welcome
      }
    }
  }, []);

  const handleEnterStudio = () => {
    setCurrentView('studio');
  };

  const handleTourComplete = useCallback(() => {
    markTourComplete();
  }, [markTourComplete]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setCurrentView('welcome');
  };

  const navItems = [
    { id: 'studio' as const, label: 'Studio', icon: LayoutDashboard },
    { id: 'pricing' as const, label: 'Pricing', icon: CreditCard },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  // Show Welcome page if not authenticated and not in studio
  if (currentView === 'welcome') {
    return <Welcome onEnterStudio={handleEnterStudio} />;
  }

  return (
    <div className="min-h-screen bg-rare-black flex flex-col relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="ambient-glow bg-rare-accent-cyan" style={{ top: '10%', left: '10%' }} />
      <div className="ambient-glow bg-rare-accent-magenta" style={{ top: '60%', right: '10%' }} />
      <div className="ambient-glow bg-rare-accent-purple" style={{ bottom: '20%', left: '30%' }} />

      {/* Header */}
      <header className="relative z-50 glass-panel border-b border-rare-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setCurrentView('studio')}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center shadow-lg shadow-rare-accent-cyan/20">
                  <span className="text-xl font-bold text-black">R</span>
                </div>
                <span className="text-xl font-bold text-white hidden sm:block">
                  Project <span className="gradient-text">RARE</span>
                </span>
              </div>
            </div>

            {/* Center: Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white border border-rare-accent-cyan/30 glow-accent'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'studio' && isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rare-accent-cyan animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3">
              {isAuthenticated || user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rare-panel border border-rare-border hover:border-white/20 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center">
                      <span className="text-sm font-semibold text-black">
                        {user?.email?.charAt(0).toUpperCase() || 'R'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm text-white max-w-32 truncate">
                      {user?.email || 'creator@rare.ai'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-xl border border-rare-border overflow-hidden shadow-xl z-50">
                      <div className="p-3 border-b border-rare-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center">
                            <User className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user?.email || 'Creator'}</p>
                            <p className="text-xs text-rare-accent-cyan">
                              {user?.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Pro'} Plan
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-rare-panel hover:text-white transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    await login();
                    setCurrentView('studio');
                  }}
                  className="flex items-center gap-2 px-4 py-2 premium-btn rounded-lg text-sm font-medium text-black"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="lg:hidden py-4 border-t border-rare-border">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setShowMobileMenu(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white/10 text-white border border-rare-accent-cyan/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
        {currentView === 'studio' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <Workspace />
            </div>
            <div className="flex-shrink-0 px-4 lg:px-6 pb-4 pt-2">
              <DebugLogs />
            </div>
          </div>
        )}

        {currentView === 'pricing' && (
          <div className="flex-1 overflow-auto py-8">
            <Pricing />
          </div>
        )}

        {currentView === 'about' && (
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="glass-panel rounded-2xl p-8 border border-rare-border">
                <h1 className="text-4xl font-bold text-white mb-6">
                  About Project <span className="gradient-text">RARE</span>
                </h1>
                <div className="space-y-6 text-gray-300 leading-relaxed">
                  <p className="text-lg">
                    Project RARE is a next-generation AI video production platform powered by{' '}
                    <span className="text-white font-medium">Seedance 2.0</span>, designed to transform your
                    creative vision into stunning cinematic content in seconds.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 my-8">
                    <div className="p-6 rounded-xl bg-rare-panel/50 border border-rare-border">
                      <h3 className="text-lg font-semibold text-white mb-3">Multi-Shot Intelligence</h3>
                      <p className="text-sm">
                        Our AI understands narrative context and creates seamless transitions between scenes,
                        maintaining visual coherence throughout your video.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-rare-panel/50 border border-rare-border">
                      <h3 className="text-lg font-semibold text-white mb-3">Audio-Reactive Rendering</h3>
                      <p className="text-sm">
                        Upload your audio stems and watch the canvas respond dynamically to rhythm,
                        melody, and energy of your soundtrack.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-rare-panel/50 border border-rare-border">
                      <h3 className="text-lg font-semibold text-white mb-3">Style Archives</h3>
                      <p className="text-sm">
                        Choose from curated visual aesthetics: Afrofuturism, Cinematic Noir, and
                        Cyber Neon - each with unique color palettes and visual signatures.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-rare-panel/50 border border-rare-border">
                      <h3 className="text-lg font-semibold text-white mb-3">Premium Exports</h3>
                      <p className="text-sm">
                        Download uncorrupted MP4 files with audio seamlessly stitched into video
                        frames using Web Audio API multiplexing.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-rare-accent-cyan/10 to-rare-accent-purple/10 border border-rare-accent-cyan/30">
                    <h3 className="text-lg font-semibold text-white mb-2">Our Ethical Commitment</h3>
                    <p className="text-sm">
                      RARE utilizes ethically sourced, public domain, and Creative Commons content for its
                      style archives. We explicitly respect CC licenses, strictly avoiding NoDerivatives (ND)
                      materials, ensuring transparent data minimization, and granting users total control to
                      delete their assets or opt-out of model training.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Tour Overlay */}
      <Tour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
}

function App() {
  return (
    <LogProvider>
      <AuthProvider>
        <LocalizationProvider>
          <AppContent />
        </LocalizationProvider>
      </AuthProvider>
    </LogProvider>
  );
}

export default App;
