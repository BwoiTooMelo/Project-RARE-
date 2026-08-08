import { Heart, Shield, Scale } from 'lucide-react';

export function Footer() {
  return (
    <footer className="glass-panel border-t border-rare-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rare-accent-cyan to-rare-accent-purple flex items-center justify-center">
                <span className="text-sm font-bold text-black">R</span>
              </div>
              <span className="text-lg font-bold text-white">Project RARE</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Real-time, beat-reactive video generation powered by the RARE Pulse Engine. Create stunning cinematic content instantly.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-rare-border pt-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-rare-panel/50 rounded-xl border border-rare-border">
            <Shield className="w-5 h-5 text-rare-accent-cyan flex-shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed">
              RARE utilizes ethically sourced, public domain, and Creative Commons content for its style archives. We explicitly respect CC licenses, strictly avoiding NoDerivatives (ND) materials, ensuring transparent data minimization, and granting users total control to delete their assets or opt-out of model training.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>by the RARE team</span>
          </div>
          <div>&copy; {new Date().getFullYear()} Project RARE. All rights reserved.</div>
          <div className="flex items-center gap-1">
            <Scale className="w-3 h-3" />
            <span>Ethically Built AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
