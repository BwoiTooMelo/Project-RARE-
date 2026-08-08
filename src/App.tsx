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
import   Pricing  from './components/rare/pricing';
import { Footer } from './components/rare/footer';
import { DebugLogs } from './components/rare/debug-logs';

type AppView = 'welcome' | 'studio' | 'pricing' | 'about';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const { user, loading, login, logout } = useAuth();
  const { isFirstTimeUser, markTourComplete } = useTour();

  useEffect(() => {
    if (currentView === 'studio' && isFirstTimeUser()) {
      setShowTour(true);
    }
  }, [currentView, isFirstTimeUser]);

  useEffect(() => {
    if (!loading && user) {
      setCurrentView('studio');
    }
  }, [loading, user]);

  const handleEnterStudio = () => setCurrentView('studio');
  const handleTourComplete = useCallback(() => markTourComplete(), [markTourComplete]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rare-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rare-accent-cyan border-t-transparent" />
      </div>
    );
  }

  if (!user || currentView === 'welcome') {
    return <Welcome onEnterStudio={handleEnterStudio} />;
  }

  return (
    <div className="min-h-screen bg-rare-black flex flex-col relative overflow-hidden">
      <div className="ambient-glow bg-rare-accent-cyan" style={{ top: '10%', left: '10%' }} />
      <div className="ambient-glow bg-rare-accent-magenta" style={{ top: '60%', right: '10%' }} />
      <div className="ambient-glow bg-rare-accent-purple" style={{ bottom: '20%', left: '30%' }} />

      <header className="relative z-50 glass-panel border-b border-rare-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors">
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('studio')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center shadow-lg shadow-rare-accent-cyan/20">
                  <span className="text-xl font-bold text-black">R</span>
                </div>
                <span className="text-xl font-bold text-white hidden sm:block">Project <span className="gradient-text">RARE</span></span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white border border-rare-accent-cyan/30 glow-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'studio' && isActive && <div className="w-1.5 h-1.5 rounded-full bg-rare-accent-cyan animate-pulse" />}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rare-panel border border-rare-border hover:border-white/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center">
                    <span className="text-sm font-semibold text-black">{user.email?.charAt(0).toUpperCase() ?? 'R'}</span>
                  </div>
                  <span className="hidden sm:block text-sm text-white max-w-32 truncate">{user.email}</span>
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
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-rare-accent-cyan capitalize">{user.plan} Plan</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-rare-panel hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showMobileMenu && (
            <nav className="lg:hidden py-4 border-t border-rare-border">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button key={item.id} onClick={() => { setCurrentView(item.id); setShowMobileMenu(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white border border-rare-accent-cyan/30' : 'text-gray-400 hover:text-white'}`}>
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

      <main className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
        {currentView === 'studio' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto"><Workspace /></div>
            <div className="flex-shrink-0 px-4 lg:px-6 pb-4 pt-2"><DebugLogs /></div>
          </div>
        )}
        {currentView === 'pricing' && <div className="flex-1 overflow-auto py-8"><Pricing /></div>}
        {currentView === 'about' && (
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="glass-panel rounded-2xl p-8 border border-rare-border">
                <h1 className="text-4xl font-bold text-white mb-6">About Project <span className="gradient-text">RARE</span></h1>
                <div className="space-y-6 text-gray-300 leading-relaxed">
                  <p className="text-lg">Project RARE is a real-time, beat-reactive visual generation platform powered by the <span className="text-white font-medium">RARE Pulse Engine</span>, designed to transform your audio into stunning cinematic content instantly.</p>
                  <div className="grid md:grid-cols-2 gap-6 my-8">
                    {[
                      { title: 'Reactive Visual Themes', body: 'Prompt keywords select curated visual themes and color palettes, rendered live with smooth, coherent transitions throughout your video.' },
                      { title: 'Audio-Reactive Rendering', body: 'Upload your audio stems and watch the canvas respond dynamically to rhythm, melody, and energy of your soundtrack.' },
                      { title: 'Style Archives', body: 'Choose from curated visual aesthetics: Afrofuturism, Cinematic Noir, and Cyber Neon - each with unique color palettes and visual signatures.' },
                      { title: 'Premium Exports', body: 'Download real MP4 files with audio encoded using WebCodecs at 720p, 1080p or 4K depending on your plan.' },
                    ].map((card) => (
                      <div key={card.title} className="p-6 rounded-xl bg-rare-panel/50 border border-rare-border">
                        <h3 className="text-lg font-semibold text-white mb-3">{card.title}</h3>
                        <p className="text-sm">{card.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-rare-accent-cyan/10 to-rare-accent-purple/10 border border-rare-accent-cyan/30">
                    <h3 className="text-lg font-semibold text-white mb-2">Our Ethical Commitment</h3>
                    <p className="text-sm">RARE utilizes ethically sourced, public domain, and Creative Commons content for its style archives. We explicitly respect CC licenses, strictly avoiding NoDerivatives (ND) materials, ensuring transparent data minimization, and granting users total control to delete their assets or opt-out of model training.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <Tour isOpen={showTour} onClose={() => setShowTour(false)} onComplete={handleTourComplete} />
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
