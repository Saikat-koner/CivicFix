import React, { useState, useEffect, useRef } from 'react';
import { CivicIssue, NavStep } from '../types';
import { MapView } from './MapView';
import {
  Navigation,
  ArrowRight,
  ArrowLeft,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Compass,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavigationModeProps {
  targetIssue: CivicIssue;
  allIssues: CivicIssue[];
  onClose: () => void;
  onArrived: (issue: CivicIssue) => void;
}

export const NavigationMode: React.FC<NavigationModeProps> = ({
  targetIssue,
  allIssues,
  onClose,
  onArrived,
}) => {
  // Dynamic Start User Location approaching target in Indian city/ward
  const startLoc = { lat: targetIssue.location.lat - 0.0035, lng: targetIssue.location.lng - 0.0035 };
  const targetLoc = targetIssue.location;

  // Navigation Steps generated for the route
  const [steps] = useState<NavStep[]>([
    {
      instruction: `Head straight on the approach road toward ${targetIssue.district}`,
      distance: '350 m',
      distanceMeters: 350,
      turnIcon: 'straight',
    },
    {
      instruction: `Take the turn onto ${targetIssue.address.split(',')[0]}`,
      distance: '500 m',
      distanceMeters: 500,
      turnIcon: 'right',
    },
    {
      instruction: `Continue straight past the junction landmark`,
      distance: '250 m',
      distanceMeters: 250,
      turnIcon: 'straight',
    },
    {
      instruction: `Arrive at hazard: ${targetIssue.title}`,
      distance: '50 m',
      distanceMeters: 50,
      turnIcon: 'destination',
    },
  ]);

  // Generate waypoint route coordinates
  const routePoints: [number, number][] = [
    [startLoc.lat, startLoc.lng],
    [startLoc.lat + (targetLoc.lat - startLoc.lat) * 0.35, startLoc.lng + 0.002],
    [startLoc.lat + (targetLoc.lat - startLoc.lat) * 0.7, startLoc.lng + (targetLoc.lng - startLoc.lng) * 0.6],
    [targetLoc.lat, targetLoc.lng],
  ];

  // Current interpolated position of user
  const [currentUserPos, setCurrentUserPos] = useState({
    lat: startLoc.lat,
    lng: startLoc.lng,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech synthesis announcement
  const speakInstruction = (text: string) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Run simulation
  useEffect(() => {
    if (!isSimulating || hasArrived) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    simTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev + 1.2;
        if (next >= 100) {
          clearInterval(simTimerRef.current!);
          setHasArrived(true);
          speakInstruction(`You have arrived at the reported hazard: ${targetIssue.title}`);
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
          return 100;
        }

        // Determine step index based on progress
        const stepIdx = Math.min(Math.floor((next / 100) * steps.length), steps.length - 1);
        if (stepIdx !== currentStepIndex) {
          setCurrentStepIndex(stepIdx);
          speakInstruction(steps[stepIdx].instruction);
        }

        // Interpolate coordinate
        const t = next / 100;
        const currentLat = startLoc.lat + (targetLoc.lat - startLoc.lat) * t;
        const currentLng = startLoc.lng + (targetLoc.lng - startLoc.lng) * t;
        setCurrentUserPos({ lat: currentLat, lng: currentLng });

        return next;
      });
    }, 150);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, hasArrived, currentStepIndex, steps, startLoc, targetLoc, targetIssue.title, voiceEnabled]);

  const totalDistanceMeters = 1150;
  const remainingDistanceMeters = Math.max(0, Math.round(totalDistanceMeters * (1 - progressPercent / 100)));
  const estimatedSeconds = Math.max(0, Math.round((remainingDistanceMeters / totalDistanceMeters) * 180));
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      {/* Top Navigation HUD Card */}
      <div className="bg-[#121c28] text-white rounded-2xl p-4 md:p-6 shadow-xl border border-[#1d68f2]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Direction Icon and Instruction */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1d68f2] text-white flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-[#1d68f2]/30">
            {steps[currentStepIndex].turnIcon === 'right' ? (
              <ArrowRight className="w-8 h-8" />
            ) : steps[currentStepIndex].turnIcon === 'destination' ? (
              <MapPin className="w-8 h-8 text-amber-300" />
            ) : (
              <Compass className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#b2c5ff] uppercase tracking-wider">
                In {steps[currentStepIndex].distance}
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                LIVE GPS
              </span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
              {steps[currentStepIndex].instruction}
            </h2>
            <p className="text-xs text-gray-300 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Target: <span className="font-semibold text-white">{targetIssue.title}</span> ({targetIssue.address})
            </p>
          </div>
        </div>

        {/* Right: ETA, Distance, Speed, Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-800 pt-3 md:pt-0">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-extrabold text-[#10B981] tracking-tight">
              {hasArrived ? 'Arrived' : `${estimatedMinutes} min`}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {remainingDistanceMeters > 0 ? `${remainingDistanceMeters} m remaining` : 'Destination reached'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (!voiceEnabled) speakInstruction(steps[currentStepIndex].instruction);
              }}
              className={`p-2.5 rounded-xl border transition-colors ${
                voiceEnabled
                  ? 'bg-[#1d68f2] border-[#1d68f2] text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
              title={voiceEnabled ? 'Voice Guidance On' : 'Enable Voice Guidance'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
              title={isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setProgressPercent(0);
                setCurrentStepIndex(0);
                setHasArrived(false);
                setIsSimulating(true);
              }}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
              title="Restart Route"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
              title="Exit Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#10B981] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Map View */}
      <div className="relative">
        <MapView
          issues={allIssues}
          selectedIssue={targetIssue}
          onSelectIssue={() => {}}
          activeStatusFilter="all"
          center={currentUserPos}
          userLocation={currentUserPos}
          routeCoordinates={routePoints}
          zoom={16}
          className="h-[460px]"
        />

        {/* Arrival Confirmation Dialog */}
        {hasArrived && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-20 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#c2c6d7] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-[#10B981]/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#121c28]">You Have Arrived!</h3>
                <p className="text-xs md:text-sm text-[#424655] mt-1">
                  You are at <span className="font-bold text-[#121c28]">{targetIssue.title}</span> on {targetIssue.address}.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => onArrived(targetIssue)}
                  className="w-full py-3 bg-[#1d68f2] hover:bg-[#0050c8] text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                >
                  Verify Resolution & Earn +10 CC
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 border border-[#c2c6d7] text-[#424655] hover:bg-gray-50 font-bold text-xs rounded-xl transition-colors"
                >
                  Close Navigation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
