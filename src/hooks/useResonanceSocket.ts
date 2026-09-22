import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Participant, PulseEvent, ServerMessage, ClientMessage } from '../types';
import { PHYSICS_STAGES } from '../stagesData';

const initialStage = PHYSICS_STAGES[0];

const defaultGameState: GameState = {
  gameStatus: 'LOBBY',
  currentStageId: initialStage.id,
  timerSeconds: 120,
  isTimerRunning: false,
  maxTimerSeconds: 120,
  matchDurationSeconds: 120,
  structuralIntegrity: 100,
  accumulatedEnergy: 0,
  targetEnergy: initialStage.breakdownThreshold,
  isBreakdownAchieved: false,
  autoAdvanceCountdown: 0,
  participants: [],
  recentPulses: [],
  teamHarmonicCoherence: 0,
  peakAmplitude: 0,
  stageResults: {}
};

export function useResonanceSocket(callsign?: string, avatar?: string) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [isConnected, setIsConnected] = useState<boolean>(true); // Optimistic default to eliminate initial flicker
  const [lastPulse, setLastPulse] = useState<PulseEvent | null>(null);
  const [breakdownAlert, setBreakdownAlert] = useState<{ stageId: number; mvp: string } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const callsignRef = useRef(callsign);
  const avatarRef = useRef(avatar);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const disconnectGraceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callsignRef.current = callsign;
    avatarRef.current = avatar;
  }, [callsign, avatar]);

  const markConnected = useCallback(() => {
    lastSyncTimeRef.current = Date.now();
    if (disconnectGraceTimeoutRef.current) {
      clearTimeout(disconnectGraceTimeoutRef.current);
      disconnectGraceTimeoutRef.current = null;
    }
    if (isMountedRef.current) {
      setIsConnected(true);
    }
  }, []);

  const markDisconnected = useCallback(() => {
    // Only flag disconnected after 3 seconds of continuous silence across both WebSocket and HTTP
    if (disconnectGraceTimeoutRef.current) return;
    disconnectGraceTimeoutRef.current = window.setTimeout(() => {
      disconnectGraceTimeoutRef.current = null;
      if (Date.now() - lastSyncTimeRef.current > 3000) {
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      }
    }, 2500);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !isMountedRef.current) return;

    // Avoid duplicate connection attempts if already open or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Determine WS protocol and host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        markConnected();
        if (callsignRef.current) {
          socket.send(JSON.stringify({
            type: 'JOIN',
            callsign: callsignRef.current,
            avatar: avatarRef.current || '⚡'
          }));
        }
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        markConnected();
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'STATE_UPDATE') {
            setGameState(msg.state);
          } else if (msg.type === 'PULSE_BROADCAST') {
            setLastPulse(msg.pulse);
            setGameState(prev => ({
              ...prev,
              structuralIntegrity: msg.structureHealth,
              recentPulses: [msg.pulse, ...(prev.recentPulses || []).slice(0, 19)]
            }));
          } else if (msg.type === 'BREAKDOWN_EVENT') {
            setBreakdownAlert({ stageId: msg.stageId, mvp: msg.mvp });
            setTimeout(() => {
              if (isMountedRef.current) setBreakdownAlert(null);
            }, 6000);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      socket.onclose = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        markDisconnected();
        // Attempt clean reconnection after 2.5s
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 2500);
      };

      socket.onerror = () => {
        if (!isMountedRef.current || wsRef.current !== socket) return;
        markDisconnected();
      };
    } catch {
      markDisconnected();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 3000);
    }
  }, [markConnected, markDisconnected]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Initial state fetch to immediately sync
    fetch('/api/state')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && isMountedRef.current) {
          setGameState(data);
          markConnected();
        }
      })
      .catch(() => {});

    // Periodic sync polling (every 2.5s) to guarantee updates and prevent desync
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current) return;
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (isMountedRef.current) {
            setGameState(data);
            markConnected();
          }
        } else {
          markDisconnected();
        }
      } catch {
        markDisconnected();
      }
    }, 2500);

    // iOS Safari backgrounding & tab-switch recovery
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetch('/api/state')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && isMountedRef.current) {
              setGameState(data);
              markConnected();
            }
          })
          .catch(() => {});
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (disconnectGraceTimeoutRef.current) clearTimeout(disconnectGraceTimeoutRef.current);
      clearInterval(pollInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, markConnected, markDisconnected]);

  // Actions
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const joinGame = useCallback((name: string, chosenAvatar: string) => {
    callsignRef.current = name;
    avatarRef.current = chosenAvatar;
    sendMessage({ type: 'JOIN', callsign: name, avatar: chosenAvatar });
    // Also hit REST fallback
    fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callsign: name, avatar: chosenAvatar })
    }).then(res => res.json()).then(data => {
      if (data.state && isMountedRef.current) setGameState(data.state);
    }).catch(() => {});
  }, [sendMessage]);

  const setFrequency = useCallback((frequency: number) => {
    sendMessage({ type: 'SET_FREQUENCY', frequency });
  }, [sendMessage]);

  const triggerPulse = useCallback((frequency: number, questionIndex?: number) => {
    sendMessage({ type: 'PULSE', frequency, questionIndex });
    // If WebSocket is closed or not open (e.g. Safari network restriction), seamlessly fire REST fallback
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      const activeCallsign = callsignRef.current;
      const activeP = gameState.participants.find(p => p.callsign.toLowerCase() === (activeCallsign || '').toLowerCase());
      if (activeP) {
        fetch('/api/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: activeP.id,
            frequency,
            questionIndex
          })
        }).then(res => res.json()).then(data => {
          if (data.state && isMountedRef.current) setGameState(data.state);
        }).catch(() => {});
      }
    }
  }, [sendMessage, gameState.participants]);

  const hostStartGame = useCallback(() => sendMessage({ type: 'HOST_START_GAME' }), [sendMessage]);
  const hostReturnToLobby = useCallback(() => sendMessage({ type: 'HOST_RETURN_TO_LOBBY' }), [sendMessage]);
  const hostNextStage = useCallback(() => sendMessage({ type: 'HOST_NEXT_STAGE' }), [sendMessage]);
  const hostStartTimer = useCallback(() => sendMessage({ type: 'HOST_START_TIMER' }), [sendMessage]);
  const hostPauseTimer = useCallback(() => sendMessage({ type: 'HOST_PAUSE_TIMER' }), [sendMessage]);
  const hostResetTimer = useCallback(() => sendMessage({ type: 'HOST_RESET_TIMER' }), [sendMessage]);
  const hostSetTimer = useCallback((seconds: number) => sendMessage({ type: 'HOST_SET_TIMER', seconds }), [sendMessage]);
  const hostChangeStage = useCallback((stageId: number) => sendMessage({ type: 'HOST_CHANGE_STAGE', stageId }), [sendMessage]);
  const hostResetStage = useCallback(() => sendMessage({ type: 'HOST_RESET_STAGE' }), [sendMessage]);
  const hostTriggerBreakdown = useCallback(() => sendMessage({ type: 'HOST_TRIGGER_BREAKDOWN' }), [sendMessage]);
  const hostAddBots = useCallback((count = 3) => sendMessage({ type: 'HOST_ADD_BOTS', count }), [sendMessage]);
  const hostClearBots = useCallback(() => sendMessage({ type: 'HOST_CLEAR_BOTS' }), [sendMessage]);
  const setReady = useCallback((isReady: boolean) => sendMessage({ type: 'SET_READY', isReady }), [sendMessage]);
  const hostKickParticipant = useCallback((participantId: string) => sendMessage({ type: 'HOST_KICK_PARTICIPANT', participantId }), [sendMessage]);
  const hostClearParticipants = useCallback(() => sendMessage({ type: 'HOST_CLEAR_PARTICIPANTS' }), [sendMessage]);

  const currentStage = PHYSICS_STAGES.find(s => s.id === gameState.currentStageId) || PHYSICS_STAGES[0];

  return {
    gameState,
    currentStage,
    isConnected,
    lastPulse,
    breakdownAlert,
    joinGame,
    setReady,
    setFrequency,
    triggerPulse,
    hostStartGame,
    hostReturnToLobby,
    hostNextStage,
    hostStartTimer,
    hostPauseTimer,
    hostResetTimer,
    hostSetTimer,
    hostChangeStage,
    hostResetStage,
    hostTriggerBreakdown,
    hostKickParticipant,
    hostClearParticipants,
    hostAddBots,
    hostClearBots
  };
}
