import React, { useEffect, useState } from 'react';

interface AnnouncementEffectsRendererProps {
  fxType?: string;
  triggerKey?: number | string; // Increment or change to re-trigger animations
}

export const AnnouncementEffectsRenderer: React.FC<AnnouncementEffectsRendererProps> = ({
  fxType = 'military_car',
  triggerKey = 0,
}) => {
  const [active, setActive] = useState(true);

  // Play effect ONCE when triggerKey or fxType changes, then automatically dismiss
  useEffect(() => {
    setActive(false);
    const startTimer = setTimeout(() => {
      setActive(true);
    }, 25);

    // Precise duration for each effect to complete its single cinematic run
    const durations: Record<string, number> = {
      jet_flyover: 3000,
      fireworks: 3800,
      military_car: 5200,
      helicopter: 7000,
      tank_convoy: 8500,
      golden_stars: 4800,
      smoke_screen: 4500,
      camera_flashes: 3200,
      wax_stamp: 3800,
      laser_target: 4200,
      radar_scan: 5400,
      radio_dispatch: 4500,
      marching_drums: 5000,
      breaking_news: 9000,
      red_alert: 5200,
    };

    const duration = durations[fxType] || 5000;
    const endTimer = setTimeout(() => {
      setActive(false);
    }, duration);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [fxType, triggerKey]);

  if (!active || !fxType) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[160] overflow-hidden select-none">
      
      {/* 1. دورية وسيارات عسكرية متحركة (Military Patrol Cruiser with Strobe & Convoy) */}
      {fxType === 'military_car' && (
        <>
          {/* Full-Screen Ambient Emergency Siren Flashes (Red & Blue sweeps over modal) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-red-600/30 blur-3xl animate-siren-red" />
            <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl animate-siren-blue" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-red-600/10 via-transparent to-blue-600/10 animate-pulse pointer-events-none" />
          </div>

          <div className="absolute inset-x-0 bottom-6 sm:bottom-12">
            {/* Road Asphalt Guide Line */}
            <div className="relative w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent">
              <div className="absolute inset-0 bg-repeat-x opacity-60" style={{ backgroundImage: 'linear-gradient(90deg, #f59e0b 50%, transparent 50%)', backgroundSize: '30px 2px' }} />
            </div>

            {/* Lead Cruiser + Escort in Single Pass */}
            <div className="absolute bottom-2 animate-drive-across flex items-center">
              {/* Speed / Dust Trail */}
              <div className="w-24 h-6 bg-gradient-to-r from-transparent via-amber-500/20 to-red-500/30 rounded-full blur-md -mr-4" />

              {/* Tactical Cruiser SVG */}
              <div className="relative w-44 sm:w-56 h-24 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]">
                {/* Powerful Forward High-Beam Cone */}
                <div 
                  className="absolute top-10 left-full w-72 sm:w-96 h-28 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at left, rgba(254,240,138,0.85) 0%, rgba(245,158,11,0.3) 40%, transparent 80%)',
                    clipPath: 'polygon(0 40%, 100% 0%, 100% 100%, 0 60%)',
                  }}
                />

                {/* Strobe Lightbar on Roof */}
                <div className="absolute -top-4 left-[42%] flex items-center gap-1.5 z-20">
                  <div className="w-4 h-3 rounded-sm bg-red-600 animate-ping shadow-[0_0_25px_#ef4444]" />
                  <div className="w-1.5 h-2.5 bg-slate-200" />
                  <div className="w-4 h-3 rounded-sm bg-blue-600 animate-pulse shadow-[0_0_25px_#3b82f6]" />
                </div>
                <div className="absolute -top-2 left-[36%] w-16 h-5 rounded-full bg-red-500/50 blur-md animate-pulse" />

                {/* SVG High-Fidelity Tactical Interceptor */}
                <svg viewBox="0 0 200 85" className="w-full h-full">
                  <defs>
                    <linearGradient id="bodyGradCinematic" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="40%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <linearGradient id="accentGoldCinematic" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>

                  {/* Body & Cabin */}
                  <path d="M 50 45 L 75 16 L 138 16 L 162 45 Z" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                  <path d="M 78 20 L 102 20 L 102 42 L 56 42 Z" fill="#38bdf8" fillOpacity="0.5" stroke="#0284c7" />
                  <path d="M 107 20 L 134 20 L 155 42 L 107 42 Z" fill="#38bdf8" fillOpacity="0.5" stroke="#0284c7" />

                  {/* Push bumper / Bullbar */}
                  <rect x="195" y="45" width="5" height="25" rx="2" fill="#334155" stroke="#000" />
                  <rect x="188" y="52" width="10" height="3" fill="#64748b" />

                  <path d="M 8 50 Q 15 40 28 40 L 178 40 Q 194 44 196 55 L 196 66 Q 190 70 178 70 L 155 70 Q 152 55 138 55 Q 124 55 121 70 L 68 70 Q 65 55 51 55 Q 37 55 34 70 L 12 70 Q 5 66 8 50 Z" fill="url(#bodyGradCinematic)" stroke="#475569" strokeWidth="2" />

                  {/* Golden Reflective Stripes */}
                  <path d="M 15 50 L 190 50 L 188 56 L 13 56 Z" fill="url(#accentGoldCinematic)" />
                  <path d="M 22 59 L 180 59 L 178 61 L 20 61 Z" fill="#38bdf8" />

                  <text x="70" y="54.5" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">PRAVA SPECIAL OPS</text>

                  {/* Xenon Headlights */}
                  <rect x="192" y="48" width="6" height="8" rx="2" fill="#fef08a" className="animate-pulse shadow-[0_0_15px_#fef08a]" />
                  {/* Tail Lights */}
                  <rect x="6" y="50" width="5" height="7" rx="1.5" fill="#ef4444" className="shadow-[0_0_15px_#ef4444]" />

                  {/* Spinning Wheels */}
                  <g className="animate-spin-wheel origin-[43px_68px]">
                    <circle cx="43" cy="68" r="14" fill="#020617" stroke="#475569" strokeWidth="3" />
                    <circle cx="43" cy="68" r="7" fill="#64748b" />
                    <circle cx="43" cy="68" r="3" fill="#f59e0b" />
                    <line x1="33" y1="68" x2="53" y2="68" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="43" y1="58" x2="43" y2="78" stroke="#cbd5e1" strokeWidth="2" />
                  </g>
                  <g className="animate-spin-wheel origin-[130px_68px]">
                    <circle cx="130" cy="68" r="14" fill="#020617" stroke="#475569" strokeWidth="3" />
                    <circle cx="130" cy="68" r="7" fill="#64748b" />
                    <circle cx="130" cy="68" r="3" fill="#f59e0b" />
                    <line x1="120" y1="68" x2="140" y2="68" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="130" y1="58" x2="130" y2="78" stroke="#cbd5e1" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              {/* Escort Tactical Motorcycle / Trailing Interceptor */}
              <div className="relative w-28 sm:w-36 h-18 -mr-6 opacity-90 hidden sm:block">
                <div className="absolute -top-3 left-[40%] w-3 h-2.5 rounded-sm bg-blue-500 animate-ping shadow-[0_0_15px_#3b82f6]" />
                <svg viewBox="0 0 160 80" className="w-full h-full">
                  <path d="M 20 50 L 50 30 L 90 30 L 120 50 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle cx="35" cy="55" r="12" fill="#020617" stroke="#64748b" strokeWidth="2.5" className="animate-spin-wheel origin-[35px_55px]" />
                  <circle cx="115" cy="55" r="12" fill="#020617" stroke="#64748b" strokeWidth="2.5" className="animate-spin-wheel origin-[115px_55px]" />
                  <rect x="125" y="48" width="5" height="5" fill="#fef08a" />
                </svg>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. ألعاب نارية واحتفالات كبرى (Cinematic Multi-Burst Fireworks & Confetti) */}
      {fxType === 'fireworks' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Ambient Blast Flash */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-400/15 blur-3xl animate-ping" />

          {/* Burst 1: Golden Starburst (Center Top) */}
          <div className="absolute top-[18%] left-[28%] animate-firework-burst">
            <div className="relative">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_15px_#fbbf24]"
                  style={{
                    transform: `rotate(${i * 18}deg) translateY(-${55 + (i % 3) * 22}px)`,
                    opacity: 0.95,
                  }}
                />
              ))}
              <div className="w-20 h-20 rounded-full bg-amber-400/40 blur-xl animate-shockwave" />
            </div>
          </div>

          {/* Burst 2: Emerald Military Burst (Right Top) */}
          <div className="absolute top-[26%] right-[22%] animate-firework-burst" style={{ animationDelay: '0.35s' }}>
            <div className="relative">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]"
                  style={{
                    transform: `rotate(${i * 18}deg) translateY(-${65 + (i % 2) * 25}px)`,
                    opacity: 0.95,
                  }}
                />
              ))}
              <div className="w-24 h-24 rounded-full bg-emerald-500/40 blur-xl animate-shockwave" />
            </div>
          </div>

          {/* Burst 3: Sapphire Command Burst (Center-Right) */}
          <div className="absolute top-[14%] right-[44%] animate-firework-burst" style={{ animationDelay: '0.7s' }}>
            <div className="relative">
              {[...Array(22)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_15px_#38bdf8]"
                  style={{
                    transform: `rotate(${i * 16.3}deg) translateY(-${70 + (i % 3) * 18}px)`,
                    opacity: 0.95,
                  }}
                />
              ))}
              <div className="w-24 h-24 rounded-full bg-cyan-500/35 blur-xl animate-shockwave" />
            </div>
          </div>

          {/* Burst 4: Crimson Royal Burst (Left-Mid) */}
          <div className="absolute top-[32%] left-[42%] animate-firework-burst" style={{ animationDelay: '1.05s' }}>
            <div className="relative">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_15px_#f43f5e]"
                  style={{
                    transform: `rotate(${i * 18}deg) translateY(-${60 + (i % 2) * 22}px)`,
                    opacity: 0.95,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Cascading Golden Confetti Ribbons Falling Down */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`conf-${i}`}
              className="absolute animate-star-fall pointer-events-none"
              style={{
                left: `${(i * 3.4 + 2) % 96}%`,
                top: `-${10 + (i % 5) * 5}%`,
                animationDelay: `${(i * 0.1).toFixed(2)}s`,
                animationDuration: `${3.2 + (i % 3) * 0.6}s`,
              }}
            >
              <div 
                className="w-2.5 h-4 rounded-sm shadow-md"
                style={{
                  backgroundColor: ['#f59e0b', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24'][i % 5],
                  transform: `rotate(${i * 35}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. طائرة هليكوبتر أباتشي (Combat Helicopter with Dynamic Searchlight Sweep) */}
      {fxType === 'helicopter' && (
        <div className="absolute top-6 sm:top-10 inset-x-0 pointer-events-none">
          <div className="animate-heli-fly flex items-center justify-center">
            <div className="relative w-56 sm:w-72 h-32 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]">
              
              {/* Powerful Searchlight Beam Sweeping directly OVER announcement card */}
              <div 
                className="absolute top-20 left-16 w-80 sm:w-[480px] h-[550px] pointer-events-none opacity-50 animate-sweep-beam origin-top"
                style={{
                  background: 'linear-gradient(to bottom, rgba(254,240,138,0.9), rgba(56,189,248,0.3) 50%, transparent 90%)',
                  clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
                }}
              />

              {/* Spinning Main Rotor Blades (Blurred Disc with Glint) */}
              <div className="absolute top-2 left-6 w-52 h-2.5 rounded-full bg-slate-200/80 animate-spin-fast shadow-[0_0_20px_rgba(255,255,255,0.9)]" />
              <div className="absolute top-3 left-30 w-2 h-4 bg-slate-800" />

              {/* Helicopter SVG */}
              <svg viewBox="0 0 240 100" className="w-full h-full">
                <path d="M 90 45 L 20 38 L 18 42 L 85 52 Z" fill="#1e293b" stroke="#334155" />
                <rect x="15" y="24" width="4" height="28" rx="2" fill="#cbd5e1" className="animate-spin origin-[17px_38px]" />
                <circle cx="17" cy="38" r="3.5" fill="#ef4444" />

                <path d="M 85 30 L 165 30 Q 192 35 198 55 Q 188 78 145 78 L 85 78 Q 68 72 85 30 Z" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                <path d="M 142 33 L 170 33 Q 188 40 192 53 L 142 53 Z" fill="#38bdf8" fillOpacity="0.65" stroke="#0284c7" />

                {/* Rocket Pods & Hellfire Missiles */}
                <rect x="105" y="56" width="38" height="8" rx="2" fill="#334155" />
                <rect x="110" y="65" width="28" height="5" rx="1.5" fill="#f59e0b" />

                {/* Skids */}
                <line x1="95" y1="78" x2="90" y2="92" stroke="#64748b" strokeWidth="3.5" />
                <line x1="150" y1="78" x2="145" y2="92" stroke="#64748b" strokeWidth="3.5" />
                <rect x="75" y="92" width="95" height="3.5" rx="1.5" fill="#94a3b8" />

                {/* Beacon */}
                <circle cx="95" cy="28" r="3.5" fill="#ef4444" className="animate-ping" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 4. رادار مسح تكتيكي متطور (Tactical Radar Sweep HUD Overlay) */}
      {fxType === 'radar_scan' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[360px] sm:w-[560px] h-[360px] sm:h-[560px] rounded-full border-2 border-emerald-500/50 bg-emerald-950/25 shadow-[0_0_80px_rgba(16,185,129,0.3)] backdrop-blur-[2px]">
            {/* Concentric Grid Rings */}
            <div className="absolute inset-10 rounded-full border border-emerald-500/35" />
            <div className="absolute inset-24 rounded-full border border-emerald-500/35" />
            <div className="absolute inset-40 rounded-full border border-emerald-500/25" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-emerald-500/35" />
            <div className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-emerald-500/35" />

            {/* Rotating Radar Sweep Beam */}
            <div 
              className="absolute inset-0 rounded-full animate-radar-sweep"
              style={{
                background: 'conic-gradient(from 0deg, rgba(16,185,129,0.65) 0deg, transparent 75deg, transparent 360deg)',
              }}
            />

            {/* Blinking Targets with HUD Brackets */}
            <div className="absolute top-[28%] left-[65%] flex items-center gap-1.5 animate-pulse">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 bg-black/80 px-1.5 py-0.5 rounded border border-emerald-500/40">SWAT_LEAD</span>
            </div>
            <div className="absolute top-[68%] left-[28%] flex items-center gap-1.5 animate-ping">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
            </div>
            <div className="absolute top-[42%] left-[25%] flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_15px_#f43f5e]" />
              <span className="text-[9px] font-mono font-bold text-rose-300 bg-black/80 px-1.5 py-0.5 rounded border border-rose-500/40">TARGET_LOCKED</span>
            </div>

            {/* Coordinates HUD */}
            <div className="absolute bottom-5 right-8 text-[11px] font-mono text-emerald-300 bg-black/85 px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR 360° // GRID: 24.7136° N, 46.6753° E</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. مقاتلة حربية نفاثة فائقة السرعة (Supersonic Fighter Jet Flyover with Sonic Boom) */}
      {fxType === 'jet_flyover' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-jet-cross flex items-center">
            {/* Sonic Boom Expansion Ring */}
            <div className="w-24 h-24 rounded-full border-4 border-cyan-400/90 animate-sonic-boom -mr-12 shadow-[0_0_40px_#22d3ee]" />

            {/* Plasma Afterburner Trail */}
            <div className="w-64 sm:w-96 h-4 bg-gradient-to-r from-transparent via-cyan-400/70 to-amber-400 rounded-full blur-[2px] -mr-6 shadow-[0_0_30px_#38bdf8]" />

            {/* Fighter Jet SVG */}
            <div className="w-36 sm:w-52 h-28 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path d="M 195 50 L 120 18 L 68 8 L 80 44 L 18 42 L 12 50 L 18 58 L 80 56 L 68 92 L 120 82 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <ellipse cx="140" cy="50" rx="22" ry="7" fill="#38bdf8" fillOpacity="0.8" stroke="#0284c7" />
                <polygon points="50,30 30,12 65,35" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                <polygon points="50,70 30,88 65,65" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="12" cy="50" rx="8" ry="5" fill="#f59e0b" className="animate-pulse shadow-[0_0_20px_#f59e0b]" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 6. إنذار طوارئ أمني أحمر (DEFCON 1 Red Alert Strobes & Hazard Frame) */}
      {fxType === 'red_alert' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Pulsating Perimeter Glow */}
          <div className="absolute inset-0 border-[10px] border-red-600/90 animate-pulse shadow-[inset_0_0_100px_rgba(239,68,68,0.7)]" />

          {/* 4 Corner Warning Beacons */}
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-red-600/70 blur-2xl animate-ping" />
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-red-600/70 blur-2xl animate-ping" />
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-red-600/70 blur-2xl animate-ping" />
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-red-600/70 blur-2xl animate-ping" />

          {/* Top & Bottom Hazard Tape */}
          <div className="absolute top-0 inset-x-0 h-4 bg-repeat-x opacity-90 shadow-lg" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 18px, #000 18px, #000 36px)' }} />
          <div className="absolute bottom-0 inset-x-0 h-4 bg-repeat-x opacity-90 shadow-lg" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 18px, #000 18px, #000 36px)' }} />

          {/* Central Emergency Alert Banner */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-red-600 text-white font-black text-xs sm:text-sm tracking-wider flex items-center gap-2.5 border-2 border-red-300 shadow-[0_0_40px_rgba(239,68,68,0.9)] animate-bounce">
            <span>🚨</span>
            <span>حالة استنفار أمني وبلاغ عاجل (DEFCON 1)</span>
            <span>🚨</span>
          </div>
        </div>
      )}

      {/* 7. موكب دبابات ومدرعات ثقيلة (Heavy Tank & Armored Escort) */}
      {fxType === 'tank_convoy' && (
        <div className="absolute bottom-6 sm:bottom-10 inset-x-0 pointer-events-none">
          <div className="animate-tank-drive flex items-center">
            {/* SVG Heavy Tank */}
            <div className="w-48 sm:w-64 h-28 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]">
              <svg viewBox="0 0 220 90" className="w-full h-full">
                {/* Cannon Barrel & Muzzle Flash */}
                <rect x="135" y="27" width="85" height="8" rx="2" fill="#334155" stroke="#1e293b" />
                <rect x="214" y="25" width="8" height="12" rx="1.5" fill="#475569" />
                <circle cx="225" cy="31" r="4" fill="#f59e0b" className="animate-ping" />

                {/* Turret */}
                <ellipse cx="115" cy="35" rx="38" ry="17" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
                <rect x="95" y="19" width="24" height="11" rx="3" fill="#0f172a" />
                <line x1="90" y1="19" x2="80" y2="2" stroke="#94a3b8" strokeWidth="2.5" />

                {/* Hull */}
                <polygon points="40,50 175,50 190,65 25,65" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />

                {/* Treads */}
                <rect x="20" y="65" width="175" height="22" rx="11" fill="#020617" stroke="#475569" strokeWidth="2.5" />
                {[35, 60, 85, 110, 135, 160, 180].map((cx, i) => (
                  <circle key={i} cx={cx} cy="76" r="8" fill="#334155" stroke="#64748b" className="animate-spin" />
                ))}
              </svg>
            </div>
            {/* Dust cloud */}
            <div className="w-20 h-8 bg-slate-500/25 rounded-full blur-lg -ml-8" />
          </div>
        </div>
      )}

      {/* 8. أمطار النجوم الذهبية والأوسمة (Golden Medals & Stars Cascade) */}
      {fxType === 'golden_stars' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(32)].map((_, i) => (
            <div
              key={i}
              className="absolute text-amber-400 animate-star-fall pointer-events-none"
              style={{
                left: `${(i * 3.1 + 2) % 96}%`,
                top: `-${Math.random() * 20 + 8}%`,
                animationDelay: `${(i * 0.14).toFixed(2)}s`,
                animationDuration: `${3.2 + (i % 3) * 0.7}s`,
                fontSize: `${16 + (i % 4) * 8}px`,
                filter: 'drop-shadow(0 0 14px rgba(251, 191, 36, 0.95))',
              }}
            >
              {i % 5 === 0 ? '🎖️' : i % 5 === 1 ? '⭐' : i % 5 === 2 ? '✨' : i % 5 === 3 ? '👑' : '💎'}
            </div>
          ))}
        </div>
      )}

      {/* 9. نداء اللاسلكي العسكري (Radio Dispatch HUD Banner) */}
      {fxType === 'radio_dispatch' && (
        <div className="absolute top-6 sm:top-8 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-6 py-3.5 rounded-2xl bg-black/90 border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.4)] backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-top-6">
            <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping shadow-[0_0_15px_#10b981]" />
            <div className="flex items-center gap-1.5">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full animate-eq-bar"
                  style={{
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    height: '26px',
                  }}
                />
              ))}
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-amber-300 font-mono tracking-wider">RADIO DISPATCH: 10-4 ROGER</div>
              <div className="text-[10px] text-slate-300 font-mono">FREQ: 462.5625 MHz // CH-1 [SECURED]</div>
            </div>
          </div>
        </div>
      )}

      {/* 10. طبول واستعراض المشاة العسكري (Military Guard Crest & Wave Pulses) */}
      {fxType === 'marching_drums' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Soundwave Pulse Rings */}
          <div className="w-72 h-72 rounded-full border-4 border-amber-500/30 animate-shockwave" />
          <div className="w-96 h-96 rounded-full border-2 border-amber-500/20 animate-shockwave" style={{ animationDelay: '0.4s' }} />

          {/* Golden Crossed Swords Emblem */}
          <div className="absolute flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="text-6xl sm:text-7xl filter drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]">⚔️</div>
            <div className="mt-3 px-6 py-1.5 rounded-full bg-black/85 border border-amber-500/50 text-amber-300 font-black text-xs sm:text-sm tracking-widest shadow-2xl">
              استعراض وانضباط القوات العسكرية
            </div>
          </div>
        </div>
      )}

      {/* 11. قنبلة دخان وساتر تكتيكي (Volumetric Multi-Layer Smoke Screen) */}
      {fxType === 'smoke_screen' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-emerald-500/30 blur-3xl animate-smoke-rise" />
          <div className="absolute -bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-amber-500/25 blur-3xl animate-smoke-rise" style={{ animationDelay: '0.4s' }} />
          <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-3xl animate-smoke-rise" style={{ animationDelay: '0.8s' }} />
          {/* Laser guide line cutting through smoke */}
          <div className="absolute top-1/2 inset-x-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_#10b981] animate-pulse" />
        </div>
      )}

      {/* 12. شريط الأخبار العاجلة العسكرية (Breaking News Broadcast Banner) */}
      {fxType === 'breaking_news' && (
        <div className="absolute bottom-0 inset-x-0 bg-red-700 text-white py-2.5 px-4 shadow-[0_-10px_30px_rgba(220,38,38,0.5)] flex items-center gap-3.5 z-50 border-t-2 border-red-400 animate-in slide-in-from-bottom">
          <span className="px-3 py-1 rounded-md bg-black text-white font-black text-xs shrink-0 animate-pulse border border-red-500/50">
            🔴 عاجل
          </span>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-marquee font-bold text-xs sm:text-sm text-white tracking-wide">
              تعميم عسكري رسمي ومهم من القيادة العليا لسيرفر PRAVA — يرجى من كافة الضباط والأفراد والمواطنين الاطلاع والالتزام بالتعليمات فوراً.
            </div>
          </div>
        </div>
      )}

      {/* 13. أضواء وعدسات الصحافة الميدانية (Press Flashbulbs & Shutter Reticles) */}
      {fxType === 'camera_flashes' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-40 h-40 rounded-full bg-white/80 blur-2xl animate-flash-fast" />
          <div className="absolute top-[45%] right-[22%] w-52 h-52 rounded-full bg-white/90 blur-2xl animate-flash-fast" style={{ animationDelay: '0.25s' }} />
          <div className="absolute bottom-[28%] left-[38%] w-48 h-48 rounded-full bg-cyan-200/80 blur-2xl animate-flash-fast" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-[30%] right-[38%] w-56 h-56 rounded-full bg-white/95 blur-2xl animate-flash-fast" style={{ animationDelay: '0.75s' }} />
        </div>
      )}

      {/* 14. شبكة استشعار وتصويب ليزري (Laser Target Reticle & Telemetry) */}
      {fxType === 'laser_target' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 sm:w-80 h-72 sm:h-80 border-2 border-red-500/70 rounded-full animate-spin-slow shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <div className="absolute inset-4 border border-red-500/40 rounded-full" />
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-red-500/80" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-red-500/80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-red-600 animate-ping shadow-[0_0_25px_#ef4444]" />
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/90 text-[11px] text-red-400 font-mono font-bold border border-red-500/60 shadow-xl">
              TARGET LOCK ENGAGED: 100%
            </div>
          </div>
        </div>
      )}

      {/* 15. ختم القيادة العسكرية الرسمي (Official Embossed Command Seal Slam) */}
      {fxType === 'wax_stamp' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Shockwave expanding from stamp impact */}
          <div className="absolute w-64 h-64 rounded-full border-4 border-amber-400 animate-shockwave" />

          <div className="animate-stamp-slam">
            <div className="w-56 sm:w-68 h-56 sm:h-68 rounded-full border-4 border-amber-400 bg-amber-950/90 p-4 shadow-[0_0_70px_rgba(245,158,11,0.85)] flex flex-col items-center justify-center text-center backdrop-blur-md transform -rotate-12 border-dashed">
              <div className="text-4xl sm:text-5xl filter drop-shadow-[0_0_15px_#fbbf24]">🦅</div>
              <div className="text-sm sm:text-base font-black text-amber-300 mt-1 tracking-widest">معتمد رسمياً</div>
              <div className="text-xs sm:text-sm font-black text-white tracking-widest border-y-2 border-amber-400/60 py-1 my-1.5 w-full">
                PRAVA GENERAL COMMAND
              </div>
              <div className="text-[10px] text-amber-200/90 font-mono tracking-wider">OFFICIAL SEAL // NO. 12465</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
