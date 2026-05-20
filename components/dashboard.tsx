"use client";

import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { ShieldAlert, Crosshair, Navigation, AlertTriangle, Info, Rss, Activity, RadioTower, WifiOff, FileText, Radar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TargetHistoryEntry {
  lat: number;
  lng: number;
  altitude: number;
  timestamp: number;
}

interface Target {
  id: string;
  type: "DRONE" | "BALLOON" | "UNKNOWN" | "AIRCRAFT";
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  altitude: number;
  threatLevel: "HIGH" | "MEDIUM" | "LOW";
  lastUpdated: number;
  history: TargetHistoryEntry[];
}

// Map bounds for Baltic region rough bounding box
const BALTIC_BOUNDS = {
  north: 59.7, // North of Estonia
  south: 53.9, // South of Lithuania
  east: 28.5,  // East border
  west: 20.9,  // West border
};

const INTERFERENCE_ZONES = [
  { id: "J-KAL", lat: 54.71, lng: 20.45, severity: "CRITICAL", type: "GPS_SPOOFING", size: "w-64 h-64" },
  { id: "J-BEL", lat: 53.90, lng: 23.80, severity: "HIGH", type: "RF_JAMMING", size: "w-80 h-80" },
  { id: "J-FIN", lat: 59.80, lng: 26.50, severity: "MEDIUM", type: "COMM_INTERFERENCE", size: "w-48 h-48" }
];

const RADAR_STATIONS = [
  { id: "RDR-LIEPAJA", lat: 56.51, lng: 21.01, type: "PRIMARY" },
  { id: "RDR-TALLINN", lat: 59.43, lng: 24.75, type: "EARLY_WARNING" },
  { id: "RDR-VILNIUS", lat: 54.68, lng: 25.27, type: "SECONDARY" },
  { id: "RDR-SIAULIAI", lat: 55.93, lng: 23.31, type: "AIR_BASE" }
];

const INITIAL_INTEL = [
  { id: 1, time: "09:21Z", severity: "WARN", text: "GPS spoofing signature verified near Kaliningrad border." },
  { id: 2, time: "09:18Z", severity: "INFO", text: "NATO AWACS patrol airborne over central Poland." },
  { id: 3, time: "09:10Z", severity: "CRITICAL", text: "UAV incursion detected. Scramble order issued Siauliai." }
];

export default function Dashboard({ apiKey }: { apiKey: string }) {
  const hasValidKey = Boolean(apiKey) && apiKey !== "YOUR_API_KEY";

  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [intelFeed, setIntelFeed] = useState(INITIAL_INTEL);

  const liveTarget = selectedTarget ? (targets.find(t => t.id === selectedTarget.id) || selectedTarget) : null;

  // Rotating intel effect
  useEffect(() => {
    if (!hasValidKey) return;
    const interval = setInterval(() => {
      setIntelFeed(prev => {
        const newEvent = {
          id: Date.now(),
          time: new Date().toISOString().split('T')[1].substring(0,5) + "Z",
          severity: ["INFO", "WARN", "CRITICAL"][Math.floor(Math.random()*3)],
          text: ["Civilian flights rerouted sector B.", "Unknown RF signature detected.", "No visual ID on target Alpha.", "Allied assets repositioning."][Math.floor(Math.random()*4)]
        };
        return [newEvent, ...prev].slice(0, 8);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [hasValidKey]);

  // Generate mock targets
  useEffect(() => {
    if (!hasValidKey) return;

    const initialTargets: Target[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `TGT-${1000 + i}`,
      type: ["DRONE", "BALLOON", "UNKNOWN", "AIRCRAFT"][Math.floor(Math.random() * 4)] as Target["type"],
      lat: 54.5 + Math.random() * 4.5, // Random lat in Baltics
      lng: 21.0 + Math.random() * 6.5, // Random lng in Baltics
      heading: Math.random() * 360,
      speed: Math.floor(Math.random() * 400) + 50,
      altitude: Math.floor(Math.random() * 10000) + 1000,
      threatLevel: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)] as Target["threatLevel"],
      lastUpdated: Date.now(),
      history: [],
    }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargets(initialTargets);

    const interval = setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => {
          // move target slightly based on heading and speed
          const dLat = (Math.cos((t.heading * Math.PI) / 180) * t.speed) / 111000 / 60; // rough approximation per second
          const dLng = (Math.sin((t.heading * Math.PI) / 180) * t.speed) / (111000 * Math.cos((t.lat * Math.PI) / 180)) / 60;
          
          const newHistoryEntry = {
            lat: t.lat,
            lng: t.lng,
            altitude: t.altitude,
            timestamp: t.lastUpdated,
          };
          
          return {
            ...t,
            lat: t.lat + dLat,
            lng: t.lng + dLng,
            lastUpdated: Date.now(),
            history: [newHistoryEntry, ...t.history].slice(0, 5),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [hasValidKey]);


  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-200 font-mono p-4">
        <div className="max-w-xl text-center space-y-6 border border-rose-900/50 bg-rose-950/10 p-8 rounded-lg">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold tracking-widest text-rose-400">SECURE TERMINAL ACCESS REQUIRED</h2>
          <p className="text-neutral-400">
            A Google Maps API Key is required to authorize the Baltic Overwatch display.
          </p>
          <div className="text-left space-y-4 text-sm mt-8 border-t border-rose-900/30 pt-6">
            <p><strong className="text-rose-400">Step 1:</strong> Get an API Key securely <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noreferrer" className="text-blue-400 underline decoration-blue-900 underline-offset-4">here</a>.</p>
            <p><strong className="text-rose-400">Step 2:</strong> Add it to the terminal environment:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Type <code className="bg-neutral-900 px-2 py-1 text-rose-300 rounded">GOOGLE_MAPS_PLATFORM_KEY</code>, press Enter</li>
              <li>Paste your key and press Enter.</li>
            </ul>
            <p className="text-neutral-500 italic mt-4">The terminal will automatically re-initialize upon key injection.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} version="weekly">
      <div className="flex h-screen bg-neutral-950 overflow-hidden font-mono text-neutral-300">
        
        {/* Left Sidebar - Threat Operations */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/50 flex flex-col z-10 backdrop-blur-md">
          <div className="p-5 border-b border-rose-900/50 bg-rose-950/10">
            <div className="flex items-center gap-3 text-rose-500 mb-1">
              <RadioTower className="w-6 h-6 animate-pulse" />
              <h1 className="font-bold tracking-widest text-lg">OVERWATCH</h1>
            </div>
            <p className="text-xs text-neutral-500 tracking-wider">BALTIC REGION AIRSPACE</p>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-semibold tracking-widest text-neutral-500 mb-4 flex items-center justify-between">
              <span>ACTIVE THREATS</span>
              <span className="bg-rose-500/20 text-rose-400 px-2 rounded-full">{targets.length} TRACKED</span>
            </h3>

            <div className="space-y-3">
              <AnimatePresence>
                {[...targets].sort((a, b) => b.threatLevel.localeCompare(a.threatLevel)).map((t) => (
                  <motion.div
                    key={t.id}
                    layout // Animate sorting changes
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedTarget(t)}
                    className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                      selectedTarget?.id === t.id ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold tracking-wider text-neutral-200">{t.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                        t.threatLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                        t.threatLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                      <div>SPD: {t.speed} KM/H</div>
                      <div>ALT: {t.altitude} M</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 shrink-0">
             <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold tracking-widest">CIVILIAN ADVISORY</h3>
             </div>
             <p className="text-xs text-neutral-400 leading-relaxed mb-3">
               Unidentified UAVs and surveillance balloons detected in proximity. Maintain situational awareness.
             </p>
             <ul className="text-xs space-y-2 text-neutral-300">
               <li className="flex items-start gap-2">
                 <span className="text-rose-500 mt-0.5">▪</span>
                 <span>Do not approach downed objects. Assume explosive or toxic payload.</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="text-rose-500 mt-0.5">▪</span>
                 <span>Report low-altitude incursions to emergency services immediately.</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="text-rose-500 mt-0.5">▪</span>
                 <span>Limit outdoor radio frequency (RF) broadcasts during alerts.</span>
               </li>
             </ul>
          </div>
        </aside>

        {/* Main Map View */}
        <main className="flex-1 relative">
          <Map
            defaultZoom={6}
            defaultCenter={{ lat: 56.5, lng: 24.5 }}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
            // Use dark/night styles via map configuration in the cloud or basic styling.
            // A dark mapId from google cloud is ideal, but here we just rely on the map component.
            // If the MapId isn't real, it falls back to default.
          >
            {targets.map(t => (
               <TargetMarker key={t.id} target={t} isSelected={selectedTarget?.id === t.id} onClick={() => setSelectedTarget(t)} />
            ))}
            
            {/* Interference Zones */}
            {INTERFERENCE_ZONES.map(zone => (
              <AdvancedMarker key={zone.id} position={{ lat: zone.lat, lng: zone.lng }} zIndex={0}>
                <div className="relative flex items-center justify-center w-0 h-0">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className={`absolute ${zone.size} bg-fuchsia-600/20 rounded-full blur-xl pointer-events-none`}
                  />
                  <div className="absolute flex flex-col items-center justify-center -translate-y-1/2 pointer-events-none">
                    <WifiOff className="w-6 h-6 text-fuchsia-500 mb-1 opacity-80" />
                    <span className="text-[9px] font-bold text-fuchsia-400 bg-neutral-950/80 px-1 rounded border border-fuchsia-900/50">{zone.type}</span>
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* Radar Stations */}
            {RADAR_STATIONS.map(radar => (
              <AdvancedMarker key={radar.id} position={{ lat: radar.lat, lng: radar.lng }} zIndex={10}>
                <div className="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 bg-cyan-950 border border-cyan-500/50 rounded-full shadow-[0_0_10px_cyan] pointer-events-none">
                  <Radar className="w-4 h-4 text-cyan-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-cyan-400 opacity-50"
                  />
                  <div className="absolute top-10 text-[9px] font-bold text-cyan-400 whitespace-nowrap bg-neutral-950/80 px-1 rounded">
                    {radar.id}
                  </div>
                </div>
              </AdvancedMarker>
            ))}
          </Map>

          {/* Radar Sweep Overlay Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30 mix-blend-screen" >
             <div className="relative w-[150vh] h-[150vh] rounded-full border-2 border-emerald-900/30">
               {/* 360 Sweep */}
               <motion.div 
                 className="absolute inset-0 rounded-full"
                 style={{
                   background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.4) 100%)'
                 }}
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
               />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
                 <div className="absolute w-24 h-24 border border-emerald-500/20 rounded-full box-border" />
                 <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full box-border" />
                 <div className="absolute w-72 h-72 border border-emerald-500/20 rounded-full box-border" />
                 <div className="absolute w-96 h-96 border border-emerald-500/20 rounded-full box-border" />
               </div>
             </div>
          </div>
          
          {/* Top HUD */}
          <div className="absolute top-4 left-6 right-6 pointer-events-none flex justify-between items-start">
             <div className="bg-neutral-900/80 backdrop-blur border border-rose-900/50 p-3 rounded pointer-events-auto">
               <div className="text-xs text-rose-500 font-bold mb-1 tracking-widest">DEFCON STATUS</div>
               <div className="text-2xl font-black text-rose-400 tracking-widest">ELEVATED</div>
             </div>
             <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 p-3 rounded flex items-center gap-3 text-emerald-500 pointer-events-auto">
               <Activity className="w-4 h-4 animate-pulse" />
               <div className="text-xs font-bold tracking-widest">SYSTEM ONLINE</div>
             </div>
          </div>

          {/* Target Details Panel */}
          <AnimatePresence>
            {liveTarget && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 right-6 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 p-5 rounded-lg w-80 shadow-2xl z-20 pointer-events-auto"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-neutral-500 tracking-widest font-bold mb-1">TARGET LOCK</div>
                    <div className={`text-xl font-black tracking-widest ${
                      liveTarget.threatLevel === 'HIGH' ? 'text-rose-400' :
                      liveTarget.threatLevel === 'MEDIUM' ? 'text-amber-400' :
                      'text-blue-400'
                    }`}>
                      {liveTarget.id}
                    </div>
                  </div>
                  <button onClick={() => setSelectedTarget(null)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                     <span className="text-xs text-neutral-500">TYPE</span>
                     <span className="text-sm font-bold text-neutral-200">{liveTarget.type}</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                     <span className="text-xs text-neutral-500">SPEED</span>
                     <span className="text-sm font-bold text-neutral-200">{liveTarget.speed.toFixed(0)} KM/H</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                     <span className="text-xs text-neutral-500">ALTITUDE</span>
                     <span className="text-sm font-bold text-neutral-200">{liveTarget.altitude.toFixed(0)} M</span>
                   </div>
                   <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                     <span className="text-xs text-neutral-500">HEADING</span>
                     <span className="text-sm font-bold text-neutral-200">{liveTarget.heading.toFixed(1)}°</span>
                   </div>
                   <div className="flex justify-between items-end pb-1">
                     <span className="text-xs text-neutral-500">LAST UPDATED</span>
                     <span className="text-xs font-mono text-neutral-400">
                       {new Date(liveTarget.lastUpdated).toISOString().split('T')[1].split('.')[0]}Z
                     </span>
                   </div>
                </div>

                {liveTarget.history.length > 0 && (
                  <div className="mt-6 border-t border-neutral-800 pt-4">
                    <div className="text-xs text-neutral-500 font-bold mb-3 tracking-widest">POSITION HISTORY</div>
                    <div className="space-y-2">
                      {liveTarget.history.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-neutral-400 font-mono bg-neutral-950/50 p-1.5 rounded">
                          <span>{new Date(entry.timestamp).toISOString().split('T')[1].split('.')[0]}Z</span>
                          <span>{entry.lat.toFixed(3)}, {entry.lng.toFixed(3)}</span>
                          <span>{entry.altitude.toFixed(0)}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {liveTarget.threatLevel === 'HIGH' && (
                  <div className="mt-4 bg-rose-500/10 border border-rose-500/30 p-2 rounded text-xs text-rose-400 text-center animate-pulse">
                    IMMEDIATE INTERCEPT RECOMMENDED
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </main>
        
        {/* Right Sidebar - Intel & Jamming */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-900/50 flex flex-col z-10 backdrop-blur-md shrink-0">
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/80">
            <div className="flex items-center gap-2 text-fuchsia-400 mb-2">
              <WifiOff className="w-5 h-5 animate-pulse" />
              <h3 className="text-xs font-bold tracking-widest">ACTIVE INTERFERENCE</h3>
            </div>
            <div className="space-y-2 mt-4">
              {INTERFERENCE_ZONES.map(zone => (
                 <div key={zone.id} className="text-xs border border-fuchsia-900/30 bg-fuchsia-950/20 p-2 rounded">
                   <div className="flex justify-between font-bold text-fuchsia-400 mb-1">
                     <span>{zone.id}</span>
                     <span>{zone.severity}</span>
                   </div>
                   <div className="text-neutral-500 font-mono text-[10px]">{zone.type}</div>
                 </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-neutral-900/30">
            <div className="flex items-center gap-2 justify-between mb-4 mt-2">
              <div className="flex items-center gap-2 text-amber-500">
                <FileText className="w-4 h-4" />
                <h3 className="text-xs font-bold tracking-widest">LIVE THEATRE FEED</h3>
              </div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {intelFeed.map((intel) => (
                  <motion.div
                    key={intel.id}
                    layout // Ensure smooth re-ordering!
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-3 rounded border border-neutral-800 bg-neutral-950 text-xs"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-500 font-mono text-[10px]">{intel.time}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold tracking-wider text-[9px] ${
                        intel.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        intel.severity === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {intel.severity}
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{intel.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>

      </div>
    </APIProvider>
  );
}

function TargetMarker({ target, isSelected, onClick }: { target: Target, isSelected: boolean, onClick: () => void }) {
  // Determine color based on threat
  const threatColor = target.threatLevel === 'HIGH' ? 'text-rose-500' : target.threatLevel === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500';
  const bgColor = target.threatLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-500' : target.threatLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500';

  return (
    <AdvancedMarker 
      position={{ lat: target.lat, lng: target.lng }} 
      onClick={onClick}
      zIndex={isSelected ? 100 : 1}
    >
      <div className="relative group flex items-center justify-center w-12 h-12 mt-[-24px] ml-[-24px]">
        {/* Pulsing ring for high threat */}
        {target.threatLevel === 'HIGH' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-20 animate-ping" />
        )}
        
        {/* Icon container */}
        <div className={`w-8 h-8 rounded-full border border-current flex items-center justify-center bg-neutral-950 backdrop-blur shadow-lg ${threatColor} transition-transform ${isSelected ? 'scale-125 border-white' : 'scale-100'}`}>
          {target.type === 'DRONE' && <Crosshair className="w-4 h-4" />}
          {target.type === 'AIRCRAFT' && <Navigation className="w-4 h-4" style={{ transform: `rotate(${target.heading - 45}deg)` }} />}
          {target.type === 'BALLOON' && <div className="w-3 h-3 rounded-full border border-current" />}
          {target.type === 'UNKNOWN' && <span className="text-[10px] font-bold">?</span>}
        </div>

        {/* Hover / Selected Label */}
        <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className={`px-2 py-1 text-[10px] font-bold rounded ${bgColor} backdrop-blur-md border border-current`}>
            {target.id}
          </div>
        </div>
      </div>
    </AdvancedMarker>
  );
}
