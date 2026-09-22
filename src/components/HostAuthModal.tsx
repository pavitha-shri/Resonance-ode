import React, { useState } from 'react';
import { Lock, KeyRound, ArrowLeft, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface HostAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const HostAuthModal: React.FC<HostAuthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === 'odeINresonance') {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Invalid passkey. Host portal is restricted to classroom instructor.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0b1322] border border-cyan-500/50 rounded-2xl p-5 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Host Portal Access
            </h3>
            <p className="text-[11px] text-slate-400">
              Instructor passkey required
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Students are restricted to the mobile harmonic controller. Enter the host passkey to unlock the projector controls and answer review.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Host Security Key:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password..."
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-xl bg-black/70 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setPassword('');
                onCancel();
              }}
              className="flex-1 py-2 rounded-xl bg-black/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold uppercase transition-all shadow-md flex items-center justify-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Authorize
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
