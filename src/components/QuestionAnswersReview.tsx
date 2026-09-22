import React, { useState } from 'react';
import { PhysicsStage, GameState, Participant } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  BookOpen, 
  Cpu, 
  Zap, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

interface QuestionAnswersReviewProps {
  stages: PhysicsStage[];
  gameState: GameState;
  currentUserCallsign?: string;
  mode?: 'host' | 'student';
  onClose?: () => void;
}

export const QuestionAnswersReview: React.FC<QuestionAnswersReviewProps> = ({
  stages,
  gameState,
  currentUserCallsign = '',
  mode = 'host',
  onClose
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'solved' | 'missed'>('all');
  const [expandedAll, setExpandedAll] = useState<boolean>(false);

  const cleanUser = currentUserCallsign.trim().toUpperCase();
  const currentParticipant = gameState.participants.find(
    p => p.callsign.toUpperCase() === cleanUser
  );

  const userSolvedQuestions = currentParticipant?.solvedQuestions || [];

  const filteredStages = stages.filter(stage => {
    if (filterMode === 'all') return true;
    const isSolved = userSolvedQuestions.includes(stage.id);
    if (filterMode === 'solved') return isSolved;
    if (filterMode === 'missed') return !isSolved;
    return true;
  });

  const selectedStage = stages.find(s => s.id === selectedQuestionId) || stages[0];
  const stageResult = gameState.stageResults[selectedStage.id];
  const isUserSolvedSelected = userSolvedQuestions.includes(selectedStage.id);

  // Solvers for this specific question among connected students
  const stageSolvers = gameState.participants.filter(
    p => p.solvedQuestions && p.solvedQuestions.includes(selectedStage.id)
  );

  return (
    <div className="flex flex-col h-full bg-[#070c14] border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
      
      {/* HEADER */}
      <div className="p-4 md:p-5 bg-[#0b1322] border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                10-Question Physics Answer Key & Details
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                EXAM REVIEW
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Exact resonant frequencies ($f_0$), physical formulas, failure modes & solver records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'student' && currentParticipant && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono">
              <span className="text-slate-400">Your Score:</span>
              <span className="text-emerald-400 font-bold">
                {userSolvedQuestions.length} / 10 Correct
              </span>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* QUESTION TABS (Q1 to Q10) */}
      <div className="bg-black/50 p-2 border-b border-cyan-500/20 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {stages.map((st) => {
            const isSelected = st.id === selectedStage.id;
            const isSolvedByUser = userSolvedQuestions.includes(st.id);
            const isClearedClass = gameState.stageResults[st.id]?.cleared;

            return (
              <button
                key={st.id}
                onClick={() => setSelectedQuestionId(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-lg scale-105'
                    : mode === 'student' && isSolvedByUser
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                    : isClearedClass
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-600/30 hover:bg-cyan-900/40'
                    : 'bg-black/40 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <span>Q{st.id}</span>
                {mode === 'student' && (
                  isSolvedByUser ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-slate-500" />
                )}
                {mode === 'host' && isClearedClass && (
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {mode === 'student' && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-1 rounded text-[11px] font-mono ${
                filterMode === 'all' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (10)
            </button>
            <button
              onClick={() => setFilterMode('solved')}
              className={`px-2 py-1 rounded text-[11px] font-mono ${
                filterMode === 'solved' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solved ({userSolvedQuestions.length})
            </button>
          </div>
        )}
      </div>

      {/* QUESTION DETAIL CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        
        {/* QUESTION TITLE & STATUS BANNER */}
        <div className="bg-[#0b1322] border border-cyan-500/30 rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold">
                  Question {selectedStage.id} of 10
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono capitalize">
                  {selectedStage.difficulty} Level
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono uppercase">
                  {selectedStage.structureType}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {selectedStage.mechanicalObject}
              </h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                {selectedStage.subtitle}
              </p>
            </div>

            {/* Status indicator */}
            {mode === 'student' ? (
              <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
                isUserSolvedSelected
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                {isUserSolvedSelected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SOLVED BY YOU ✓</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>MISSED IN 2:00 ✗</span>
                  </>
                )}
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-cyan-500/40 flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Class Solvers:</span>
                <span className="text-cyan-300 font-bold">
                  {stageSolvers.length} / {gameState.participants.length || 1} Students
                </span>
                {stageResult?.mvpCallsign && (
                  <span className="text-amber-300 font-bold ml-1 pl-2 border-l border-slate-700">
                    MVP: {stageResult.mvpCallsign} ({stageResult.clearTimeSeconds}s)
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {selectedStage.description}
          </p>
        </div>

        {/* KEY ANSWER HIGHLIGHT: Target Frequency & Formula */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Answer Box: Natural Resonant Frequency */}
          <div className="bg-gradient-to-br from-[#0c1a2e] to-[#0a121e] border-2 border-cyan-400/80 rounded-2xl p-4 shadow-[0_0_25px_rgba(0,240,255,0.15)] relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-cyan-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Correct Resonant Frequency ($f_0$)
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded">
                Target Answer
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-mono font-black text-cyan-200 tracking-tight">
                {selectedStage.targetFrequency.toFixed(selectedStage.step < 0.1 ? 2 : 1)}
              </span>
              <span className="text-lg font-mono font-bold text-cyan-400">
                {selectedStage.unit}
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">Resonant Destruction Band:</span>
              <span className="text-emerald-300 font-bold">
                {(selectedStage.targetFrequency - selectedStage.tolerance).toFixed(1)} – {(selectedStage.targetFrequency + selectedStage.tolerance).toFixed(1)} {selectedStage.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Vibrating at exactly this frequency transfers maximum mechanical energy directly into the structure with zero wave cancellation.
            </p>
          </div>

          {/* Governing Physical Formula */}
          <div className="bg-gradient-to-br from-[#181528] to-[#0c0f1a] border border-amber-500/50 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Governing Physical Formula
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded">
                Mechanics
              </span>
            </div>
            <div className="bg-black/60 p-2.5 rounded-xl border border-amber-500/30 font-mono text-sm text-amber-200 text-center font-bold tracking-wide my-1">
              {selectedStage.formula}
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-2 space-y-1">
              <div>
                <strong className="text-slate-400">Eigenmode Equation:</strong>{' '}
                <span className="text-amber-200">{selectedStage.mechanicalParams.naturalFreqFormula}</span>
              </div>
              <div>
                <strong className="text-slate-400">Modal Type:</strong>{' '}
                <span className="text-slate-200">{selectedStage.vibrationMode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DIFFERENTIAL EQUATION & RESONANCE BEHAVIOR SECTION */}
        <div className="bg-[#050a14] border-2 border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <h4 className="text-xs font-mono uppercase text-amber-300 font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Governing Mechanical Differential Equation
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300">
              {selectedStage.difficulty.toUpperCase()} • Q{selectedStage.id}
            </span>
          </div>

          <div className="bg-black/80 p-3 rounded-xl border border-amber-400/30 text-center font-mono text-xs md:text-sm text-amber-200 tracking-wider shadow-inner font-bold">
            {selectedStage.differentialEquation}
          </div>

          {selectedStage.resonanceBehavior && (
            <div className="text-xs text-slate-300 font-sans leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800">
              <strong className="text-cyan-300 font-mono text-[11px] block mb-1">
                Resonance Behavior in this Example:
              </strong>
              {selectedStage.resonanceBehavior}
            </div>
          )}
        </div>

        {/* MECHANICAL PARAMETERS (Stiffness, Mass, Damping) */}
        <div className="bg-[#0b1322] border border-cyan-500/30 rounded-2xl p-4">
          <h4 className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            Physical Mechanical Parameters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                Structural Stiffness ($k$)
              </div>
              <div className="font-mono text-xs font-bold text-white">
                {selectedStage.mechanicalParams.stiffness}
              </div>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                Effective Mass / Inertia ($m$)
              </div>
              <div className="font-mono text-xs font-bold text-white">
                {selectedStage.mechanicalParams.mass}
              </div>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                Damping Ratio ($\zeta$)
              </div>
              <div className="font-mono text-xs font-bold text-white">
                {selectedStage.mechanicalParams.dampingRatio}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED PHYSICS EXPLANATION & REAL-WORLD FAILURE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Engineering Physics Explanation */}
          <div className="bg-[#0b1322] border border-cyan-500/30 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-mono uppercase text-cyan-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Physics Explanation & Energy Transfer
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedStage.physicsExplanation}
            </p>
          </div>

          {/* Real-World Catastrophic Failure Incident */}
          <div className="bg-[#120b13] border border-red-500/40 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-mono uppercase text-red-300 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Real-World Engineering Incident
            </h4>
            <div className="text-xs font-bold text-red-200">
              {selectedStage.realWorldPhenomenon}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedStage.mechanicalParams.realFailure}
            </p>
          </div>
        </div>

        {/* TEACHING DISCUSSION QUESTIONS */}
        {selectedStage.teachingPrompts && selectedStage.teachingPrompts.length > 0 && (
          <div className="bg-black/60 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-mono uppercase text-amber-300 font-bold flex items-center gap-2 mb-2.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Classroom Reflection & Discussion Prompts
            </h4>
            <ul className="space-y-2">
              {selectedStage.teachingPrompts.map((prompt, pIdx) => (
                <li key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {pIdx + 1}
                  </span>
                  <span className="leading-relaxed">{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* STUDENT SOLVER LIST FOR THIS QUESTION (Host View) */}
        {mode === 'host' && (
          <div className="bg-[#0b1322] border border-cyan-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Students Who Solved Question {selectedStage.id} ({stageSolvers.length})
              </h4>
              <span className="text-[11px] font-mono text-cyan-300">
                Resonant Frequency: {selectedStage.targetFrequency} {selectedStage.unit}
              </span>
            </div>

            {stageSolvers.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2">
                No students locked into the exact resonant frequency during the 2-minute limit.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {stageSolvers.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-cyan-500/40 text-xs font-mono text-cyan-200"
                  >
                    <span>{s.avatar}</span>
                    <span className="font-bold">{s.callsign}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER NAVIGATION */}
      <div className="p-3 bg-[#0b1322] border-t border-cyan-500/30 flex items-center justify-between">
        <button
          onClick={() => setSelectedQuestionId(prev => Math.max(1, prev - 1))}
          disabled={selectedStage.id === 1}
          className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-slate-800 disabled:opacity-30 text-xs font-mono text-slate-300 border border-slate-700"
        >
          ← Previous Question
        </button>

        <div className="text-xs font-mono text-slate-400">
          Question {selectedStage.id} of {stages.length}
        </div>

        <button
          onClick={() => setSelectedQuestionId(prev => Math.min(stages.length, prev + 1))}
          disabled={selectedStage.id === stages.length}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-xs font-mono text-black font-bold"
        >
          Next Question →
        </button>
      </div>

    </div>
  );
};
