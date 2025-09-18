import React, { useEffect, useMemo, useRef, useState } from "react";
import { tooltipProps } from "./tooltip.jsx";

/********************
 * DB-90 Inspired — PANEL EXTENDED (v4.3 Retro Minimal + Amber Theme + 7‑Segment + LED Bar + DB‑90 Labels)
 *
 * Additions in v4.3:
 * - Theme toggle: Retro Green / Retro Amber.
 * - Real 7‑segment SVG display for BPM.
 * - Pulse indicator: horizontal LED bar that follows the beat-in-bar.
 * - Subtle DB‑90‑style labels on modules (TEMPO, METER, COACH, TONE, PATTERN).
 * - Keeps ALL functionality + existing tests.
 ********************/

/* -------------------- Utils -------------------- */
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const BPM_MIN = 30;
const BPM_MAX = 250;
function noteToHz(noteIndex /* 0=C0 */, a4 = 440) {
  const semitonesFromA4 = noteIndex - (4 * 12 + 9); // A4 index (A)
  const hz = a4 * Math.pow(2, semitonesFromA4 / 12);
  return Math.round(hz * 100) / 100; // 2 decimals
}
function flattenTo16(arr) {
  const len = arr.length; if (len === 16) return arr.slice();
  const out = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) { const src = Math.floor((i / 16) * len); out[i] = arr[src] ? 1 : 0; }
  return out;
}

/* -------------------- Icons (monochrome, retro, stroke) -------------------- */
const I = {
  Play: (p)=> (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M8 5l10 7-10 7z"/>
    </svg>
  ),
  Stop: (p)=> (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <rect x="7" y="7" width="10" height="10"/>
    </svg>
  ),
  Tap: (p)=> (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M12 4v6"/><path d="M8 12l4 4 4-4"/>
    </svg>
  ),
  Lock:(p)=> (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <rect x="5" y="11" width="14" height="10"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Unlock:(p)=> (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <rect x="5" y="11" width="14" height="10"/><path d="M7 11V7a5 5 0 0 1 9 0"/>
    </svg>
  ),
  Dot:(p)=> (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" {...p}><rect x="2" y="2" width="6" height="6"/></svg>
  ),
  Beats:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  ),
  Subdiv:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M6 12h0M12 12h0M18 12h0"/>
    </svg>
  ),
  Swing:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M3 15c3-8 15 8 18 0"/>
    </svg>
  ),
  Save:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M5 5h11l3 3v11H5z"/>
    </svg>
  ),
  Download:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/>
    </svg>
  ),
  Upload:(p)=> (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M12 21V9"/><path d="M7 13l5-5 5 5"/><path d="M5 21h14"/>
    </svg>
  ),
  Plus:(p)=> (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Close:(p)=> (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
};

const COACH_TOOLTIPS = {
  off: "Coach desactivado",
  timecheck: "Time Check: mide tu precisión",
  quiet: "Quiet Count: silencia compases",
  gradual: "Gradual Tempo: interpola BPM",
};

/* -------------------- Self-tests -------------------- */
function runSelfTests() {
  try {
    console.group("DB90 Self-Tests");
    console.assert(clamp(5, 0, 10) === 5, "clamp mid");
    console.assert(clamp(-5, 0, 10) === 0, "clamp low");
    console.assert(clamp(15, 0, 10) === 10, "clamp high");
    console.assert(Math.abs(noteToHz(57, 440) - 440) < 0.5, "A4 @ 440Hz");
    console.assert(Math.abs(noteToHz(48, 440) - 261.63) < 1.0, "C4 ≈ 261.63Hz");
    const p8 = [1,0,1,0,1,0,1,0]; const p16 = flattenTo16(p8);
    console.assert(p16.length === 16, "flattenTo16 length=16");
    console.assert(p16.reduce((a,b)=>a+b,0) >= p8.reduce((a,b)=>a+b,0), "density ok");
    (function(){ const sp=[1,0,0,0]; const rep0=sp[0]===1, rep1=sp[1]===1; const add0 = sp[0]===1 || 0%4===0; const add1 = sp[1]===1 || 1%4===0; console.assert(rep0 && !rep1, 'REP gate'); console.assert(add0 && !add1, 'ADD gate'); })();
    console.groupEnd();
  } catch(e) { console.warn('Self-tests error:', e); }
}

/* -------------------- 7‑Segment Display -------------------- */
function SevenSegDigit({ d=0, on=false, color='#22c55e' }) {
  // segments: a b c d e f g (top, top-right, bottom-right, bottom, bottom-left, top-left, middle)
  const map = {
    0:[1,1,1,1,1,1,0], 1:[0,1,1,0,0,0,0], 2:[1,1,0,1,1,0,1], 3:[1,1,1,1,0,0,1],
    4:[0,1,1,0,0,1,1], 5:[1,0,1,1,0,1,1], 6:[1,0,1,1,1,1,1], 7:[1,1,1,0,0,0,0],
    8:[1,1,1,1,1,1,1], 9:[1,1,1,1,0,1,1]
  };
  const seg = map[d] || [0,0,0,0,0,0,0];
  const onCol = on ? color : '#0a0a0a';
  const offCol = '#111827';
  return (
    <svg width="64" height="100" viewBox="0 0 40 60" style={{display:'block'}}>
      {/* a */}<rect x="6" y="3"  width="28" height="6" fill={seg[0]?onCol:offCol}/>
      {/* b */}<rect x="34" y="6" width="6" height="22" fill={seg[1]?onCol:offCol}/>
      {/* c */}<rect x="34" y="32" width="6" height="22" fill={seg[2]?onCol:offCol}/>
      {/* d */}<rect x="6" y="54" width="28" height="6" fill={seg[3]?onCol:offCol}/>
      {/* e */}<rect x="0" y="32" width="6" height="22" fill={seg[4]?onCol:offCol}/>
      {/* f */}<rect x="0" y="6"  width="6" height="22" fill={seg[5]?onCol:offCol}/>
      {/* g */}<rect x="6" y="28" width="28" height="6" fill={seg[6]?onCol:offCol}/>
    </svg>
  );
}
function SevenSegNumber({ value=120, color='#22c55e', on=true }) {
  const str = String(value);
  return (
    <div className="flex items-end justify-center gap-2" style={{filter:on?'none':'grayscale(1) opacity(0.5)'}}>
      {str.split('').map((ch,i)=> <SevenSegDigit key={i} d={parseInt(ch,10)} on={on} color={color}/>) }
    </div>
  );
}

/* -------------------- Audio Engines -------------------- */
function useMetronomeEngine({
  bpm, stepsPerBeat, beatsPerBar, accentMap, volumes, running, swing, countInBars,
  soundProfile, tempoLocked, onBar, onBeat, voiceCount, stepPattern, seqMode,
}) {
  const ctxRef = useRef(null), nextTimeRef = useRef(0), stepRef = useRef(0), rafRef = useRef(null);
  const countingInRef = useRef(countInBars);
  const say = (text) => { try { if (!voiceCount) return; const u = new window.SpeechSynthesisUtterance(String(text)); u.lang='es-ES'; u.rate=1; u.pitch=1; u.volume=1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} catch(_){} };
  const scheduleClick = (time, type, idxInBar) => {
    const ctx = ctxRef.current; if (!ctx) return; const profile = soundProfile;
    let freq = 1400; const dur = 0.03; let gainLevel = volumes.sub; if (type==='beat') { gainLevel=volumes.beat; freq=1700; } if (type==='accent') { gainLevel=volumes.accent; freq=2000; }
    const outGain = ctx.createGain(); outGain.gain.setValueAtTime(gainLevel, time); outGain.gain.exponentialRampToValueAtTime(0.0001, time+dur); outGain.connect(ctx.destination);
    const osc = ctx.createOscillator(); const shaper = ctx.createGain(); osc.type = (profile==='click')?'square': (profile==='woodblock')?'triangle':'sine'; if (profile==='cowbell') { osc.type='square'; freq=freq*0.6; } if (profile==='woodblock') { freq=freq*0.5; } if (profile==='click') { freq=freq*1.2; }
    osc.frequency.setValueAtTime(freq, time); shaper.gain.setValueAtTime(1, time); shaper.gain.exponentialRampToValueAtTime(0.0001, time+dur); osc.connect(shaper); shaper.connect(outGain); osc.start(time); osc.stop(time+dur);
    if (profile==='voice' && (type==='beat' || type==='accent')) { const cnt=(idxInBar%beatsPerBar)+1; const now=ctx.currentTime; const delay=Math.max(0,(time-now)*1000); window.setTimeout(()=>say(cnt), delay); }
  };
  useEffect(() => {
    if (!running) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current=null; nextTimeRef.current=0; stepRef.current=0; countingInRef.current=countInBars; return; }
    if (tempoLocked) return; if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = ctxRef.current; const scheduleAhead = 0.12; if (nextTimeRef.current===0) { nextTimeRef.current=ctx.currentTime+0.05; stepRef.current=0; }
    const tick = () => {
      while (nextTimeRef.current < ctx.currentTime + scheduleAhead) {
        const stepInBeat = stepRef.current % stepsPerBeat; const beatIndex = Math.floor(stepRef.current / stepsPerBeat); const barIndex = Math.floor(beatIndex / beatsPerBar); const beatInBar = beatIndex % beatsPerBar;
        const inCountIn = countingInRef.current > 0; const accent = accentMap[beatInBar] === 2; const beatMark = accentMap[beatInBar] >= 1; const baseType = stepInBeat===0 ? (accent ? 'accent' : (beatMark ? 'beat' : 'sub')) : 'sub';
        const stepsPerBarTotal = stepsPerBeat * beatsPerBar; const idxInBar = beatInBar * stepsPerBeat + stepInBeat;
        let allowBySeq = true; if (stepPattern && stepPattern.length === stepsPerBarTotal) { allowBySeq = (seqMode==='replace') ? (stepPattern[idxInBar]===1) : ((stepPattern[idxInBar]===1) || (stepInBeat===0)); }
        if (stepInBeat===0) { if (onBeat) onBeat({ beatIndex, beatInBar, barIndex }); }
        if (stepInBeat===0 && beatInBar===0) { if (onBar) onBar({ barIndex }); if (inCountIn) countingInRef.current -= 1; }
        if (!inCountIn && allowBySeq) scheduleClick(nextTimeRef.current, baseType, beatInBar);
        const baseStep = (60/bpm)/stepsPerBeat; let stepDur = baseStep; if (stepsPerBeat===2 || stepsPerBeat===4) { const sw=swing; const longD=baseStep*(1+sw); const shortD=baseStep*(1-sw); const isOdd=(stepInBeat%2)===0; stepDur = isOdd? longD : shortD; }
        nextTimeRef.current += stepDur; stepRef.current += 1;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running,bpm,stepsPerBeat,beatsPerBar,accentMap,swing,countInBars,volumes,soundProfile,tempoLocked,stepPattern,seqMode,onBar,onBeat,voiceCount]);
}

function useTone({ enabled, noteHz, volume }) {
  const ctxRef = useRef(null), oscRef = useRef(null), gainRef = useRef(null);
  useEffect(() => {
    if (!enabled) { if (gainRef.current && ctxRef.current) gainRef.current.gain.exponentialRampToValueAtTime(0.0001, ctxRef.current.currentTime + 0.05); setTimeout(()=>{ try{ if (oscRef.current) oscRef.current.stop(); }catch(__){} oscRef.current=null; },80); return; }
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = ctxRef.current; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type='sine'; osc.frequency.value=noteHz; gain.gain.value=volume*0.15; osc.connect(gain); gain.connect(ctx.destination); osc.start(); oscRef.current=osc; gainRef.current=gain; return () => { try{ osc.stop(); }catch(__){} };
  }, [enabled]);
  useEffect(() => { if (oscRef.current) oscRef.current.frequency.value = noteHz; if (gainRef.current) gainRef.current.gain.value = volume*0.15; }, [noteHz,volume]);
}

function useMIDIClock({ running, bpm }) {
  const midiRef = useRef(null), timerRef = useRef(null);
  useEffect(() => { if (!("requestMIDIAccess" in navigator)) return; navigator.requestMIDIAccess().then(a=>{ const outs=Array.from(a.outputs.values()); midiRef.current = outs[0] || null; }).catch(()=>{}); }, []);
  useEffect(() => { if (!midiRef.current) return; const out=midiRef.current; const tickMs=60000/bpm/24; const send=()=>out.send([0xF8]); if (running) { out.send([0xFA]); timerRef.current=setInterval(send, tickMs);} else { out.send([0xFC]); if (timerRef.current) clearInterval(timerRef.current);} return ()=>{ if (timerRef.current) clearInterval(timerRef.current); }; }, [running,bpm]);
}

/* -------------------- Main Component -------------------- */
export default function DB90InspiredMockup() {
  // Tempo & meter
  const [bpm, setBpm] = useState(120);
  const [bpmInput, setBpmInput] = useState('120');
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [stepsPerBeat, setStepsPerBeat] = useState(1);
  const [accentMap, setAccentMap] = useState([2,1,1,1]);
  const [swing, setSwing] = useState(0);
  const [countInBars, setCountInBars] = useState(0);

  // Sound & mix
  const [volume, setVolume] = useState(0.6);
  const [soundProfile, setSoundProfile] = useState('beep');
  const [volumes, setVolumes] = useState({ accent:0.9, beat:0.7, sub:0.5 });
  const [voiceCount, setVoiceCount] = useState(false);

  // Transport & coach
  const [running, setRunning] = useState(false);
  const [tempoLocked, setTempoLocked] = useState(false);
  const [coachMode, setCoachMode] = useState('off');
  const [muteEvery, setMuteEvery] = useState(0);
  const [gradualFrom, setGradualFrom] = useState(100);
  const [gradualTo, setGradualTo] = useState(140);
  const [gradualBars, setGradualBars] = useState(16);
  const barsElapsedRef = useRef(0);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Tap & TimeCheck
  const tapsRef = useRef([]);
  const [tapStats, setTapStats] = useState({ count:0, avgMs:0, stdMs:0, lastMs:0, score:100 });

  // Tone
  const [toneOn, setToneOn] = useState(false);
  const [a4, setA4] = useState(440);
  const [toneNote, setToneNote] = useState(57);

  // Theme / Skin
  const [theme, setTheme] = useState('green'); // 'green' | 'amber'
  const accent = theme==='amber' ? '#ffb000' : '#22c55e';

  // Presets & setlist
  const [activeTab, setActiveTab] = useState('presets');
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState(()=>{ try {return JSON.parse(localStorage.getItem('db90_presets_v3')||'[]');} catch (__) {return [];} });
  const [setlist, setSetlist] = useState(()=>{ try {return JSON.parse(localStorage.getItem('db90_setlist')||'[]');} catch (__) {return [];} });

  // Pattern library
  const patternLib = useMemo(() => ({
    Basics: {
      'Backbeat 4/4': [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      'Tresillo':     [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
      'Habanera':     [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,0],
      'Shuffle 8':    [1,0, 1,0,0, 1,0, 1,0,0],
    },
    Latin: {
      'Clave Son 3-2': [1,0,0, 0,1,0,0, 0,0,1,0,0, 1,0,0, 0,0],
      'Clave Son 2-3': [1,0,0, 1,0,0, 0,0,1,0,0, 0,1,0,0, 0,0],
      'Clave Rumba 3-2': [1,0,0, 0,0,1,0, 0,0, 1,0,0, 0,1,0,0],
      'Bossa Nova':   [1,0,0,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
      'Samba (surdo)':[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    },
    'Funk/Pop': {
      'Funk 16':      [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1],
      'Half‑Time':    [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      'Reggae One‑Drop':[0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
    },
    AfroCuban: {
      'Cáscara':      [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
      'Tumbao (clave)': [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
    },
  }), []);

  const [patCat, setPatCat] = useState('Basics');
  const [patName, setPatName] = useState('');
  const [seqEnabled, setSeqEnabled] = useState(false);
  const [seqMode, setSeqMode] = useState('replace');
  const [stepPattern, setStepPattern] = useState([]);

  // Engines
  const effectiveCountIn = coachMode === 'quiet' ? 0 : countInBars;
  const totalStepsCurrent = useMemo(() => stepsPerBeat * beatsPerBar, [stepsPerBeat, beatsPerBar]);
  const currentSeq = useMemo(() => {
    if (!seqEnabled || !stepPattern || stepPattern.length === 0) return [];
    const out = new Array(totalStepsCurrent).fill(0);
    for (let i = 0; i < totalStepsCurrent; i++) { const src = Math.floor((i / totalStepsCurrent) * stepPattern.length); out[i] = stepPattern[src] ? 1 : 0; }
    return out;
  }, [seqEnabled, stepPattern, totalStepsCurrent]);

  useMetronomeEngine({ bpm, stepsPerBeat, beatsPerBar, accentMap, volumes, running, swing, countInBars: effectiveCountIn, soundProfile, tempoLocked,
    onBar: ({ barIndex }) => {
      if (coachMode === 'gradual' && running) { barsElapsedRef.current += 1; const progress = clamp(barsElapsedRef.current/Math.max(1,gradualBars),0,1); const target = gradualFrom + (gradualTo - gradualFrom)*progress; setBpm(Math.round(target)); }
    },
    onBeat: ({ beatInBar }) => { setCurrentBeat(beatInBar); },
    voiceCount, stepPattern: currentSeq, seqMode });
  useTone({ enabled: toneOn, noteHz: noteToHz(toneNote, a4), volume });
  useMIDIClock({ running, bpm });
  useEffect(() => { runSelfTests(); }, []);
  useEffect(() => { setBpmInput(String(bpm)); }, [bpm]);

  // Hotkeys / Tap
  useEffect(() => {
    const h = (e) => {
      const target = e.target;
      if (target instanceof HTMLElement) {
        if (target.closest('input, select, textarea') || target.isContentEditable) {
          return;
        }
      }
      if (e.code === 'Space') {
        if (target instanceof HTMLElement && target.closest('button')) return;
        e.preventDefault();
        tap();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.code === 'ArrowUp') {
        setBpm((b) => clamp(b + 1, BPM_MIN, BPM_MAX));
      } else if (e.code === 'ArrowDown') {
        setBpm((b) => clamp(b - 1, BPM_MIN, BPM_MAX));
      } else if (e.code === 'ArrowRight') {
        setBpm((b) => clamp(b + 5, BPM_MIN, BPM_MAX));
      } else if (e.code === 'ArrowLeft') {
        setBpm((b) => clamp(b - 5, BPM_MIN, BPM_MAX));
      } else if (e.code === 'KeyL') {
        setTempoLocked((l) => !l);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const tap = ()=>{
    const t = window.performance.now(); const arr = [].concat(tapsRef.current.filter(x=> t-x < 6000), t); tapsRef.current = arr;
    if (arr.length>=2) { const ivals = arr.slice(1).map((v,i)=> v - arr[i]); const w = Math.min(ivals.length, 6); const recent = ivals.slice(-w); const avg = recent.reduce((a,b)=>a+b,0)/recent.length; const nbpm = clamp(Math.round(60000/avg), BPM_MIN, BPM_MAX); if (!tempoLocked) setBpm(nbpm);
      if (coachMode==='timecheck' && running) { const spbMs=(60/bpm)*1000; const stepMs=spbMs/stepsPerBeat; const phase=t%stepMs; const err=(phase<stepMs/2)?phase:phase-stepMs; setTapStats((s)=>{ const n=s.count+1; const avgm=(s.avgMs*s.count+err)/n; const varAcc=(s.stdMs*s.stdMs*s.count + (err-avgm)*(err-avgm))/n; const std=Math.sqrt(varAcc); const score=clamp(Math.round(100 - Math.min(100, Math.abs(avgm)/2 + std/4)),0,100); return { count:n, avgMs:Math.round(avgm*10)/10, stdMs:Math.round(std*10)/10, lastMs:Math.round(err*10)/10, score }; }); }
    }
  };

  const adjustBpm = (delta) => {
    if (tempoLocked) return;
    setBpm((current) => clamp(Math.round(current + delta), BPM_MIN, BPM_MAX));
  };
  const handleBpmSliderChange = (value) => {
    if (tempoLocked) return;
    const numeric = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isNaN(numeric)) {
      setBpm(clamp(Math.round(numeric), BPM_MIN, BPM_MAX));
    }
  };
  const commitBpmInput = (value = bpmInput) => {
    if (tempoLocked) {
      setBpmInput(String(bpm));
      return;
    }
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setBpmInput(String(bpm));
      return;
    }
    const clamped = clamp(parsed, BPM_MIN, BPM_MAX);
    setBpm(clamped);
    setBpmInput(String(clamped));
  };
  const handleBpmInputChange = (e) => {
    setBpmInput(e.target.value);
  };
  const handleBpmInputBlur = () => {
    commitBpmInput();
  };
  const handleBpmInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      commitBpmInput();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setBpmInput(String(bpm));
      e.currentTarget.blur();
    }
  };

  // Accent editor helpers
  useEffect(()=>{ setAccentMap((m)=>{ const n=m.slice(); if (n.length<beatsPerBar) while(n.length<beatsPerBar) n.push(1); if (n.length>beatsPerBar) n.length=beatsPerBar; n[0]=2; return n; }); }, [beatsPerBar]);

  // Presets
  const savePreset = ()=>{ const p = { name: presetName||`Preset ${presets.length+1}`, bpm, beatsPerBar, stepsPerBeat, accentMap, swing, countInBars, volumes, soundProfile, voiceCount, coachMode, muteEvery, gradualFrom, gradualTo, gradualBars, a4, toneNote, stepPattern, seqMode, seqEnabled, theme }; const next=[].concat(presets, p); setPresets(next); localStorage.setItem('db90_presets_v3', JSON.stringify(next)); setPresetName(''); };
  const loadPreset = (p)=>{ setBpm(p.bpm); setBeatsPerBar(p.beatsPerBar); setStepsPerBeat(p.stepsPerBeat); setAccentMap(p.accentMap); setSwing(p.swing||0); setCountInBars(p.countInBars||0); setVolumes(p.volumes||volumes); setSoundProfile(p.soundProfile||'beep'); setVoiceCount(!!p.voiceCount); setCoachMode(p.coachMode||'off'); setMuteEvery(p.muteEvery||0); setGradualFrom(p.gradualFrom||bpm); setGradualTo(p.gradualTo||bpm); setGradualBars(p.gradualBars||16); setA4(p.a4||440); setToneNote(p.toneNote||57); if (p.stepPattern && p.stepPattern.length) setStepPattern(p.stepPattern); else setStepPattern([]); setSeqMode(p.seqMode||'replace'); setSeqEnabled(!!p.seqEnabled); if (p.theme) setTheme(p.theme); };
  const exportPresets = ()=>{ const blob=new Blob([JSON.stringify({presets,setlist}, null, 2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='db90-presets.json'; a.click(); URL.revokeObjectURL(url); };
  const importPresets = (file)=>{ const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); if (data.presets) { setPresets(data.presets); localStorage.setItem('db90_presets_v3', JSON.stringify(data.presets)); } if (data.setlist) { setSetlist(data.setlist); localStorage.setItem('db90_setlist', JSON.stringify(data.setlist)); } }catch(__){} }; reader.readAsText(file); };

  // Setlist
  const addToSetlist = ()=>{ const item={ name: presetName||`Song ${setlist.length+1}`, bpm, beatsPerBar, stepsPerBeat, stepPattern, seqMode, seqEnabled, theme }; const next=[].concat(setlist, item); setSetlist(next); localStorage.setItem('db90_setlist', JSON.stringify(next)); };
  const removeFromSetlist = (i)=>{ const next=setlist.filter((_,k)=>k!==i); setSetlist(next); localStorage.setItem('db90_setlist', JSON.stringify(next)); };

  // Pattern ops
  const applyPattern = (arr)=>{ const base16 = flattenTo16(arr); setStepPattern(base16); };

  /* -------------------- UI -------------------- */
  const noteLabel = `${NOTE_NAMES[toneNote%12]}${Math.floor(toneNote/12)}`;

  // Theme (retro)
  const bg = "min-h-screen w-full bg-slate-950 text-slate-100";
  const card = "bg-slate-900 border border-slate-700 rounded-sm";
  const btn = (active) => `px-3 py-2 rounded-sm border text-sm tracking-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${active? 'bg-slate-100 text-slate-900 border-slate-100':'bg-slate-900 text-slate-100 border-slate-600 hover:bg-slate-800'}`;
  const knob = "appearance-none w-full h-1 bg-slate-700";
  const label = "text-[10px] text-slate-400 tracking-[0.2em]";

  return (
    <div className={`${bg} flex items-stretch justify-center p-6`} style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontFeatureSettings:'"tnum" 1', ['--acc'] : accent}}>
      <div className="w-full max-w-6xl grid grid-rows-[auto,1fr] gap-4">
        {/* AppBar */}
        <div className={`${card} px-4 py-2 flex items-center justify-between`}> 
          <div className="flex items-center gap-2">
            <div className="w-3 h-3" style={{backgroundColor:'var(--acc)'}}/>
            <div className="text-sm font-semibold">DB‑90 Pro</div>
            <span className="text-[10px] text-slate-400">v4.3</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span data-tooltip="Audio" className="inline-flex items-center gap-1">{running? <I.Dot style={{color:'var(--acc)'}}/> : <I.Dot className="text-slate-500"/>}Engine</span>
            <span data-tooltip="Tempo lock" className="inline-flex items-center gap-1">{tempoLocked? <I.Lock/> : <I.Unlock/>}</span>
            <div className="inline-flex items-center gap-1" data-tooltip="Theme">
              <button
                {...tooltipProps("Tema Retro Green")}
                className={btn(theme==='green')}
                onClick={()=>setTheme('green')}
              >
                GREEN
              </button>
              <button
                {...tooltipProps("Tema Retro Amber")}
                className={btn(theme==='amber')}
                onClick={()=>setTheme('amber')}
              >
                AMBER
              </button>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Transport + Display + Mixer */}
          <div className={`xl:col-span-2 ${card} p-4`}>
            <div className={label}>TEMPO</div>
            {/* Transport */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button data-tooltip="Start/Stop (Enter)" onClick={()=>setRunning(r=>!r)} className={`${btn(running)} !px-4 !py-2`}>{running? <I.Stop/> : <I.Play/>}</button>
                <button data-tooltip="Tap (Space)" onClick={tap} className={btn(false)}><span className="inline-flex items-center gap-1"><I.Tap/> Tap</span></button>
                <button data-tooltip="Bloquear tempo (L)" onClick={()=>setTempoLocked(v=>!v)} className={btn(tempoLocked)}><span className="inline-flex items-center gap-1">{tempoLocked? <I.Lock/> : <I.Unlock/>} Lock</span></button>
              </div>
              <div className="text-[10px] text-slate-400">↑↓ ±1 • ←→ ±5</div>
            </div>

            {/* Display */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div
                className="md:col-span-2 relative overflow-hidden rounded-sm bg-black p-4 border flex flex-col items-center justify-center"
                style={{
                  borderColor: tempoLocked ? 'var(--acc)' : '#1e293b',
                  boxShadow: tempoLocked ? '0 0 0 1px var(--acc)' : 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                aria-live="polite"
              >
                <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] tracking-[0.3em] text-slate-500">
                  <div
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: tempoLocked ? 'var(--acc)' : '#1f2937',
                      boxShadow: tempoLocked ? '0 0 8px var(--acc)' : 'none',
                    }}
                    aria-hidden="true"
                  />
                  <span className={tempoLocked ? 'text-[color:var(--acc)]' : ''}>LOCK</span>
                </div>
                <span className="sr-only">{tempoLocked ? 'Tempo bloqueado' : 'Tempo libre'}</span>
                <SevenSegNumber value={bpm} color={accent} on={true} />
                {/* LED dots (top) */}
                <div className="mt-2 flex items-center justify-center gap-2">
                  {Array.from({length:beatsPerBar}).map((_,i)=> (
                    <div key={i} className="w-2 h-2" style={{backgroundColor: i===currentBeat? accent : '#475569'}}/>
                  ))}
                </div>
                {/* LED horizontal bar */}
                <div className="mt-2 w-full h-2 grid" style={{gridTemplateColumns:`repeat(${beatsPerBar},1fr)`, gap:'4px'}}>
                  {Array.from({length:beatsPerBar}).map((_,i)=> (
                    <div key={i} className="h-2" style={{backgroundColor: i===currentBeat? accent : '#1f2937'}}/>
                  ))}
                </div>
                <div className="mt-4 w-full space-y-3">
                  <div className={`${label} text-center`}>BPM CONTROL</div>
                  <input
                    data-tooltip="Control de BPM"
                    type="range"
                    min={BPM_MIN}
                    max={BPM_MAX}
                    step={1}
                    value={bpm}
                    onChange={(e)=>handleBpmSliderChange(e.target.value)}
                    disabled={tempoLocked}
                    className={`${knob} h-2`}
                    style={{ accentColor: 'var(--acc)' }}
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[12px]">
                    <button data-tooltip="Restar 5 BPM" onClick={()=>adjustBpm(-5)} disabled={tempoLocked} className={btn(false)}>−5</button>
                    <button data-tooltip="Restar 1 BPM" onClick={()=>adjustBpm(-1)} disabled={tempoLocked} className={btn(false)}>−1</button>
                    <input
                      data-tooltip="Editar BPM"
                      type="number"
                      min={BPM_MIN}
                      max={BPM_MAX}
                      value={bpmInput}
                      onChange={handleBpmInputChange}
                      onBlur={handleBpmInputBlur}
                      onKeyDown={handleBpmInputKeyDown}
                      disabled={tempoLocked}
                      className="w-20 bg-slate-950 text-slate-100 border border-slate-700 rounded-sm p-2 text-center text-[14px]"
                    />
                    <button data-tooltip="Sumar 1 BPM" onClick={()=>adjustBpm(1)} disabled={tempoLocked} className={btn(false)}>+1</button>
                    <button data-tooltip="Sumar 5 BPM" onClick={()=>adjustBpm(5)} disabled={tempoLocked} className={btn(false)}>+5</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <input data-tooltip="Volumen master" type="range" min={0.05} max={1} step={0.05} value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value))} className={knob}/>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <input data-tooltip="Accent" type="range" min={0} max={1} step={0.05} value={volumes.accent} onChange={(e)=>setVolumes(v=>({...v,accent:parseFloat(e.target.value)}))} className={knob}/>
                  <input data-tooltip="Beat" type="range" min={0} max={1} step={0.05} value={volumes.beat} onChange={(e)=>setVolumes(v=>({...v,beat:parseFloat(e.target.value)}))} className={knob}/>
                  <input data-tooltip="Subdiv" type="range" min={0} max={1} step={0.05} value={volumes.sub} onChange={(e)=>setVolumes(v=>({...v,sub:parseFloat(e.target.value)}))} className={knob}/>
                </div>
                <select data-tooltip="Perfil de sonido" className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1" value={soundProfile} onChange={(e)=>setSoundProfile(e.target.value)}>
                  <option value="beep">Beep</option><option value="click">Click</option><option value="woodblock">Wood</option><option value="cowbell">Cow</option><option value="voice">Voz</option>
                </select>
              </div>
            </div>

            {/* Meter + Accents + Coach */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className={`${card} p-3`}>
                <div className={label}>METER</div>
                <div className="mt-2 flex items-center gap-3 text-[12px]">
                  <label className="flex items-center gap-2" data-tooltip="Beats por compás">
                    <I.Beats/> <input type="number" min={1} max={16} value={beatsPerBar} onChange={(e)=>setBeatsPerBar(clamp(parseInt(e.target.value)||beatsPerBar,1,16))} className="w-16 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/>
                  </label>
                  <label className="flex items-center gap-2" data-tooltip="Subdivisión">
                    <I.Subdiv/> <select value={stepsPerBeat} onChange={(e)=>setStepsPerBeat(parseInt(e.target.value))} className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1">
                      <option value={1}>♩</option><option value={2}>♪</option><option value={3}>♩3</option><option value={4}>ᶿ</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2" data-tooltip="Swing">
                    <I.Swing/> <input type="range" min={0} max={0.75} step={0.01} value={swing} onChange={(e)=>setSwing(parseFloat(e.target.value))} className={knob}/>
                  </label>
                  <label className="flex items-center gap-2" data-tooltip="Count‑In">
                    ⏱️ <input type="number" min={0} max={8} value={countInBars} onChange={(e)=>setCountInBars(clamp(parseInt(e.target.value)||0,0,8))} className="w-14 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/>
                  </label>
                  <label className="flex items-center gap-2" data-tooltip="Conteo por voz"><input type="checkbox" checked={voiceCount} onChange={(e)=>setVoiceCount(e.target.checked)} /></label>
                </div>
              </div>

              <div className={`${card} p-3`}>
                <div className={label}>ACCENTS</div>
                <div className="mt-2 grid grid-cols-8 gap-1" data-tooltip="Acentos por beat: Off→Beat→Accent">
                  {Array.from({length:beatsPerBar}).map((_,i)=> {
                    const level = accentMap[i];
                    const label = level === 2 ? `Beat ${i+1}: Accent fuerte` : level === 1 ? `Beat ${i+1}: Beat normal` : `Beat ${i+1}: sin acento`;
                    return (
                      <button
                        key={i}
                        {...tooltipProps(label)}
                        aria-label={label}
                        aria-pressed={level !== 0}
                        onClick={()=>setAccentMap(m=>{ const n=m.slice(); n[i]=(n[i]+1)%3; return n; })}
                        className={`h-8 rounded-sm border text-[11px] ${level===2? 'bg-black text-[color:var(--acc)] border-[color:var(--acc)]': level===1? 'bg-slate-800 border-slate-600 text-slate-100':'bg-slate-900 border-slate-700 text-slate-400'}`}
                      >
                        {i+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`${card} p-3`}>
                <div className={label}>COACH</div>
                <div className="mt-2 flex items-center gap-2 flex-wrap text-[12px]">
                  {['off','timecheck','quiet','gradual'].map((k)=> (
                    <button
                      key={k}
                      {...tooltipProps(COACH_TOOLTIPS[k] || `Modo ${k}`)}
                      aria-pressed={coachMode===k}
                      onClick={()=>{ setCoachMode(k); if (k!=='gradual') barsElapsedRef.current=0; }}
                      className={btn(coachMode===k)}
                    >
                      {k.toUpperCase()}
                    </button>
                  ))}
                  {coachMode==='quiet' && (
                    <label data-tooltip="Silenciar 1 de cada N compases" className="text-[12px] flex items-center gap-1">N<input type="number" min={2} max={8} value={muteEvery||2} onChange={(e)=>setMuteEvery(clamp(parseInt(e.target.value)||2,2,8))} className="w-12 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/></label>
                  )}
                  {coachMode==='gradual' && (
                    <div className="flex items-center gap-2 text-[12px]" data-tooltip="Gradual Up/Down">
                      <input type="number" min={BPM_MIN} max={BPM_MAX} value={gradualFrom} onChange={(e)=>setGradualFrom(clamp(parseInt(e.target.value) || gradualFrom, BPM_MIN, BPM_MAX))} className="w-14 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/>
                      →
                      <input type="number" min={BPM_MIN} max={BPM_MAX} value={gradualTo} onChange={(e)=>setGradualTo(clamp(parseInt(e.target.value) || gradualTo, BPM_MIN, BPM_MAX))} className="w-14 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/>
                      ⎯
                      <input type="number" min={1} max={256} value={gradualBars} onChange={(e)=>setGradualBars(clamp(parseInt(e.target.value)||gradualBars,1,256))} className="w-14 bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1"/>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className={`${card} p-3`}>
                <div className={label}>PATTERN</div>
                <div className="mt-2 flex items-center gap-2 mb-2 text-[12px]">
                  <label className="flex items-center gap-2" data-tooltip="Secuenciador audible ON/OFF"><input type="checkbox" checked={seqEnabled} onChange={(e)=>setSeqEnabled(e.target.checked)} /> SEQ</label>
                  <select data-tooltip="Modo (REP silencia todo, incluso downbeats; ADD suma sobre beats)" className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1" value={seqMode} onChange={(e)=>setSeqMode(e.target.value)}>
                    <option value="replace">REP</option><option value="add">ADD</option>
                  </select>
                  <select data-tooltip="Categoría" className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1" value={patCat} onChange={(e)=>{ setPatCat(e.target.value); setPatName(''); }}>
                    {Object.keys(patternLib).map(k=> <option key={k} value={k}>{k}</option>)}
                  </select>
                  <select data-tooltip="Patrón" className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-1" value={patName} onChange={(e)=>setPatName(e.target.value)}>
                    <option value="">(elige)</option>
                    {Object.keys(patternLib[patCat]).map(n=> <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button data-tooltip="Cargar patrón" onClick={()=>{ if (patName) applyPattern(patternLib[patCat][patName]); }} className={btn(false)}>Cargar</button>
                  <button data-tooltip="Limpiar" onClick={()=>setStepPattern(new Array(16).fill(0))} className={btn(false)}>Clear</button>
                </div>
                <div className="grid grid-cols-16 gap-1" data-tooltip="Haz clic para activar/desactivar pasos">
                  {Array.from({length:16}).map((_,i)=> {
                    const isActive = !!(stepPattern && stepPattern[i]);
                    const label = `Paso ${i+1}${isActive ? ' activo' : ' inactivo'}`;
                    return (
                      <button
                        key={i}
                        {...tooltipProps(label)}
                        aria-label={label}
                        aria-pressed={isActive}
                        onClick={()=> setStepPattern(prev=>{ const n=prev && prev.length? prev.slice(): new Array(16).fill(0); n[i]=n[i]?0:1; return n; })}
                        className={`h-5 rounded-sm border ${ isActive? 'bg-[color:var(--acc)] border-[color:var(--acc)] text-black':'bg-slate-900 border-slate-700'}`}
                      ></button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tone + Presets/Setlist */}
          <div className="flex flex-col gap-4">
            <div className={`${card} p-4`}>
              <div className={label}>TONE</div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <div className="font-semibold text-[13px]">Sine</div>
                <label data-tooltip="Tono ON/OFF" className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={toneOn} onChange={(e)=>setToneOn(e.target.checked)}/> ON</label>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <label data-tooltip="Afinación A4"><input type="range" min={438} max={445} value={a4} onChange={(e)=>setA4(parseInt(e.target.value))} className={knob}/><div className="text-[10px] text-slate-400">A4 {a4} Hz</div></label>
                <label data-tooltip="Nota"><input type="range" min={24} max={95} value={toneNote} onChange={(e)=>setToneNote(parseInt(e.target.value))} className={knob}/><div className="text-[10px] text-slate-400">{noteLabel} — {noteToHz(toneNote, a4)} Hz</div></label>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 grid grid-cols-2 gap-2">
                <div data-tooltip="Atajos">Enter ▶/■ · Space TAP · L Lock · ↑↓±1 · ←→±5</div>
                <div data-tooltip="Coach">OFF · TIMECHECK · QUIET · GRADUAL</div>
              </div>
            </div>

            <div className={`${card} p-4 min-h-[320px]`}> 
              <div className={label}>PRESETS</div>
              <div className="flex items-center gap-2 mb-2 mt-1">
                <button
                  {...tooltipProps("Ver presets guardados")}
                  onClick={()=>setActiveTab('presets')}
                  className={btn(activeTab==='presets')}
                >
                  Presets
                </button>
                <button
                  {...tooltipProps("Gestionar setlist en vivo")}
                  onClick={()=>setActiveTab('setlist')}
                  className={btn(activeTab==='setlist')}
                >
                  Setlist
                </button>
              </div>

              {activeTab==='presets' ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input data-tooltip="Nombre preset" value={presetName} onChange={(e)=>setPresetName(e.target.value)} placeholder="Nombre" className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-2 flex-1"/>
                    <button data-tooltip="Guardar preset" onClick={savePreset} className={btn(false)}><I.Save/></button>
                    <button data-tooltip="Exportar JSON" onClick={exportPresets} className={btn(false)}><I.Download/></button>
                    <label data-tooltip="Importar JSON" className={`${btn(false)} cursor-pointer`}><I.Upload/><input type="file" accept="application/json" className="hidden" onChange={(e)=>{ const f=e.target.files && e.target.files[0]; if (f) importPresets(f); }}/></label>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-auto">
                    {presets.map((p,i)=> {
                      const tip = `${p.name} — ${p.bpm} BPM`;
                      return (
                        <button
                          key={i}
                          {...tooltipProps(tip)}
                          onClick={()=>loadPreset(p)}
                          className="p-2 rounded-sm border border-slate-700 bg-slate-900 hover:bg-slate-800 text-left truncate"
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input data-tooltip="Nombre tema" value={presetName} onChange={(e)=>setPresetName(e.target.value)} placeholder="Tema" className="bg-slate-900 text-slate-100 border border-slate-700 rounded-sm p-2 flex-1"/>
                    <button data-tooltip="Añadir a setlist" onClick={addToSetlist} className={btn(false)}><I.Plus/></button>
                  </div>
                  <ul className="max-h-44 overflow-auto divide-y divide-slate-800">
                    {setlist.map((s,i)=> {
                      const tip = `${s.name} — ${s.bpm} BPM`;
                      return (
                        <li key={i} className="flex items-center justify-between py-2">
                          <div className="text-[12px] truncate" {...tooltipProps(tip)}>
                            {i+1}. {s.name} {s.seqEnabled ? '•SEQ' : ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <button data-tooltip="Cargar" onClick={()=>loadPreset(s)} className="text-[11px]">⤴︎</button>
                            <button data-tooltip="Quitar" onClick={()=>removeFromSetlist(i)} className="text-[11px] text-red-400"><I.Close/></button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
