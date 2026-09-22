import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, CheckCircle2, Award, Sparkles, Flame, RefreshCw } from 'lucide-react';
import { Participant, GameState, HallOfFameEntry } from '../types';
import { safeLocalStorage } from '../utils/storage';

interface LeaderboardPanelProps {
  gameState: GameState;
  highlightCallsign?: string;
  compact?: boolean;
  onClose?: () => void;
  isGameOver?: boolean;
  onKickParticipant?: (participantId: string) => void;
  initialTab?: 'current' | 'hallOfFame';
}

const DEFAULT_HALL_OF_FAME: HallOfFameEntry[] = [];
const HISTORICAL_SCIENTISTS = ['NIKOLA_TESLA', 'GALILEO_GALILEI', 'LEONHARD_EULER', 'LORD_RAYLEIGH', 'THEODORE_VONKARMAN'];

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  gameState,
  highlightCallsign = '',
  compact = false,
  onClose,
  isGameOver = false,
  onKickParticipant,
  initialTab = 'current'
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'hallOfFame'>(initialTab);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('resonance_hall_of_fame');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge any pre-seeded scientist entries
          const filtered = parsed.filter(item => {
            const name = (item.callsign || '').toUpperCase();
            return !HISTORICAL_SCIENTISTS.includes(name) && !name.includes('TESLA') && !name.includes('GALILEI') && !name.includes('EULER') && !name.includes('RAYLEIGH') && !name.includes('VONKARMAN');
          });
          safeLocalStorage.setItem('resonance_hall_of_fame', JSON.stringify(filtered));
          return filtered;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Automatically induct top performers when game reaches GAME_OVER
  useEffect(() => {
    if (isGameOver || gameState.gameStatus === 'GAME_OVER') {
      const eligible = gameState.participants.filter(
        p => p.questionsCompleted && p.questionsCompleted >= 3
      );

      if (eligible.length > 0) {
        setHallOfFame(prev => {
          let updated = [...prev];
          for (const p of eligible) {
            const alreadyExists = updated.some(
              h => h.callsign.toUpperCase() === p.callsign.toUpperCase() && 
                   h.questionsCompleted >= (p.questionsCompleted ?? 0)
            );
            if (!alreadyExists) {
              const newEntry: HallOfFameEntry = {
                id: `hof-${Date.now()}-${p.id}`,
                callsign: p.callsign,
                avatar: p.avatar,
                score: p.score ?? (p.questionsCompleted * 800),
                questionsCompleted: p.questionsCompleted ?? 0,
                totalTimeSeconds: p.totalTimeSeconds ?? 120,
                precisionPercent: p.precisionPercent ?? 95,
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                accolade: (p.questionsCompleted ?? 0) >= 10 
                  ? 'All-10 Shattered Master' 
                  : (p.questionsCompleted ?? 0) >= 7 
                  ? 'High Harmonic Champion' 
                  : 'Resonance Contender'
              };
              updated.push(newEntry);
            }
          }

          // Sort Hall of Fame by Questions Completed (desc), then Time (asc), then Precision (desc)
          updated.sort((a, b) => {
            if (b.questionsCompleted !== a.questionsCompleted) return b.questionsCompleted - a.questionsCompleted;
            if (a.totalTimeSeconds !== b.totalTimeSeconds) return a.totalTimeSeconds - b.totalTimeSeconds;
            return b.precisionPercent - a.precisionPercent;
          });

          // Keep top 12
          const trimmed = updated.slice(0, 12);
          try {
            safeLocalStorage.setItem('resonance_hall_of_fame', JSON.stringify(trimmed));
          } catch {
            // ignore storage errors
          }
          return trimmed;
        });
      }
    }
  }, [isGameOver, gameState.gameStatus, gameState.participants]);

  // Sort participants for Current Game Leaderboard
  const rankedParticipants = [...gameState.participants].sort((a, b) => {
    const qA = a.questionsCompleted ?? 0;
    const qB = b.questionsCompleted ?? 0;
    if (qB !== qA) return qB - qA;

    const tA = a.totalTimeSeconds && a.totalTimeSeconds > 0 ? a.totalTimeSeconds : 999;
    const tB = b.totalTimeSeconds && b.totalTimeSeconds > 0 ? b.totalTimeSeconds : 999;
    if (tA !== tB) return tA - tB;

    const pA = a.precisionPercent ?? 0;
    const pB = b.precisionPercent ?? 0;
    return pB - pA;
  });

  const userClean = highlightCallsign.trim().toUpperCase();
  const myRank = rankedParticipants.findIndex(p => p.callsign.toUpperCase() === userClean) + 1;

  const formatTime = (secs: number) => {
    if (!secs || secs <= 0) return '--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleResetHallOfFame = () => {
    if (typeof window !== 'undefined' && window.confirm('Clear Hall of Fame records from past matches?')) {
      setHallOfFame([]);
      try {
        safeLocalStorage.removeItem('resonance_hall_of_fame');
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080d15] border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl ${
      compact ? 'p-3' : 'p-5'
    }`}>
      {/* Header with Title and Tab Switcher */}
      <div className="pb-3 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
              activeTab === 'current'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-amber-500/20 border-amber-400 text-amber-300'
            }`}>
              {activeTab === 'current' ? <Trophy className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                {activeTab === 'current' ? 'Current Game Leaderboard' : 'Overall Hall of Fame'}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {activeTab === 'current' ? 'LIVE MATCH' : 'ALL-TIME'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {activeTab === 'current' 
                  ? 'Real-time ranking of students in active classroom match' 
                  : 'All-time fastest & highest accuracy harmonic masters'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Dual Leaderboard Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-1 rounded-xl border border-cyan-500/30">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'current'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Current Game Match ({rankedParticipants.length})
          </button>
          <button
            onClick={() => setActiveTab('hallOfFame')}
            className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'hallOfFame'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Overall Hall of Fame ({hallOfFame.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CURRENT GAME MATCH LEADERBOARD */}
      {activeTab === 'current' && (
        <>
          {/* User's position banner (if student view) */}
          {userClean && myRank > 0 && (
            <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-400/50 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">Your Live Rank:</span>
                <span className="text-white font-bold text-sm">#{myRank}</span>
                <span className="text-slate-300">({userClean})</span>
              </div>
              <div className="text-emerald-300 font-bold">
                {rankedParticipants[myRank - 1]?.questionsCompleted ?? 0} / 10 Done
              </div>
            </div>
          )}

          {/* Column Headers */}
          <div className="grid grid-cols-12 text-[11px] font-mono text-slate-400 px-3 py-1.5 bg-black/40 rounded-lg mb-2">
            <div className="col-span-1 text-center font-bold">#</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Time
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <Target className="w-3 h-3 text-amber-400" /> Accuracy
            </div>
          </div>

          {/* Ranked Rows */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
            {rankedParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-500 text-xs font-mono space-y-1">
                <Trophy className="w-6 h-6 text-slate-600 mb-1" />
                <span>No students connected yet</span>
                <span className="text-[10px] text-slate-600">Share host link with classroom to join!</span>
              </div>
            ) : (
              rankedParticipants.map((p, idx) => {
                const isMe = p.callsign.toUpperCase() === userClean;
                const rank = idx + 1;
                const questionsDone = p.questionsCompleted ?? 0;
                const timeTaken = p.totalTimeSeconds ?? 0;
                const precision = p.precisionPercent ?? 100;

                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-12 items-center px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      isMe
                        ? 'bg-cyan-950/70 border border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : rank === 1
                        ? 'bg-amber-950/40 border border-amber-500/50 text-amber-100'
                        : rank === 2
                        ? 'bg-slate-800/40 border border-slate-600/40 text-slate-200'
                        : rank === 3
                        ? 'bg-amber-900/20 border border-amber-700/30 text-slate-300'
                        : 'bg-black/40 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank badge */}
                    <div className="col-span-1 text-center font-bold">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    {/* Name */}
                    <div className="col-span-5 flex items-center justify-between gap-1 overflow-hidden pr-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-base">{p.avatar}</span>
                        <span className="font-bold truncate text-slate-100">
                          {p.callsign}
                        </span>
                      </div>
                      {onKickParticipant && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onKickParticipant(p.id);
                          }}
                          className="text-slate-600 hover:text-red-400 text-xs px-1 hover:bg-red-950/40 rounded transition-colors shrink-0"
                          title={`Remove ${p.callsign}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Questions Done */}
                    <div className="col-span-2 text-center font-bold text-emerald-400">
                      {questionsDone}/10
                    </div>

                    {/* Speed / Time */}
                    <div className="col-span-2 text-center text-cyan-300">
                      {formatTime(timeTaken)}
                    </div>

                    {/* Precision % */}
                    <div className="col-span-2 text-right font-bold text-amber-300">
                      {precision.toFixed(1)}%
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer summary */}
          <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{rankedParticipants.length} Connected Students</span>
            <span>Match Duration: 2 Minutes</span>
          </div>
        </>
      )}

      {/* TAB 2: OVERALL HALL OF FAME */}
      {activeTab === 'hallOfFame' && (
        <>
          {/* Column Headers */}
          <div className="grid grid-cols-12 text-[11px] font-mono text-slate-400 px-3 py-1.5 bg-black/40 rounded-lg mb-2">
            <div className="col-span-1 text-center font-bold">#</div>
            <div className="col-span-5">All-Time Legend</div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Solved
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Best Time
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <Target className="w-3 h-3 text-amber-400" /> Precision
            </div>
          </div>

          {/* Hall of Fame Rows */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
            {hallOfFame.length === 0 ? (
              <div className="py-14 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5">
                  <Award className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-200 text-sm">Classroom Hall of Fame is Empty</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Run classroom matches to etch your top student performers here. Records are saved from actual matches!
                </p>
              </div>
            ) : (
              hallOfFame.map((entry, idx) => {
                const rank = idx + 1;
                const isCurrentUser = entry.callsign.toUpperCase() === userClean;

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 items-center px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      isCurrentUser
                        ? 'bg-cyan-950/70 border border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : rank === 1
                        ? 'bg-gradient-to-r from-amber-950/60 to-black/60 border border-amber-500/60 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : rank === 2
                        ? 'bg-slate-800/40 border border-slate-500/50 text-slate-200'
                        : rank === 3
                        ? 'bg-amber-900/20 border border-amber-700/40 text-slate-300'
                        : 'bg-black/40 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center font-bold">
                      {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    {/* Callsign & Accolade */}
                    <div className="col-span-5 flex flex-col min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-base">{entry.avatar}</span>
                        <span className="font-bold truncate text-white">
                          {entry.callsign}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-300/80 truncate">
                        {entry.accolade}
                      </span>
                    </div>

                    {/* Questions Solved */}
                    <div className="col-span-2 text-center font-bold text-emerald-400">
                      {entry.questionsCompleted}/10
                    </div>

                    {/* Best Time */}
                    <div className="col-span-2 text-center text-cyan-300 font-bold">
                      {formatTime(entry.totalTimeSeconds)}
                    </div>

                    {/* Precision */}
                    <div className="col-span-2 text-right font-bold text-amber-300">
                      {entry.precisionPercent.toFixed(1)}%
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Hall of Fame Footer */}
          <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> Top Student Match Records
            </span>
            {hallOfFame.length > 0 && (
              <button
                onClick={handleResetHallOfFame}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline flex items-center gap-1 cursor-pointer"
                title="Clear past match Hall of Fame records"
              >
                <RefreshCw className="w-3 h-3" /> Clear Records
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
