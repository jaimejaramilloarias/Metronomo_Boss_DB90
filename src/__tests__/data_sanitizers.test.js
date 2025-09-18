import { describe, expect, it } from 'vitest';

import {
  GLOBAL_CONFIG_VERSION,
  sanitizePresetCollection,
  sanitizeSetlistCollection,
  sanitizeConfigState,
  patternStepsToSchedule,
  sanitizePatternSteps,
  serializeUserPatterns,
  deserializeStoredPatterns,
} from '../mockup_web_tipo_boss_db_90_inspirado.jsx';

describe('patternStepsToSchedule', () => {
  it('respects note figures, subdivisions and clamps levels', () => {
    const rawSteps = [
      { level: 5, figure: 'quarter' },
      { level: -2, figure: 'eighth' },
      { level: 1, figure: 'unknown' },
    ];
    const schedule = patternStepsToSchedule(rawSteps, 4);
    expect(schedule).toHaveLength(3);
    expect(schedule[0]).toEqual({ level: 2, duration: 4 });
    expect(schedule[1]).toEqual({ level: 0, duration: 2 });
    expect(schedule[2]).toEqual({ level: 1, duration: 1 });
  });

  it('rounds durations when working with triplet subdivisions', () => {
    const steps = sanitizePatternSteps([
      { level: 1, figure: 'eighth' },
      { level: 1, figure: 'quarter' },
    ]);
    const schedule = patternStepsToSchedule(steps.slice(0, 2), 3);
    expect(schedule[0]).toEqual({ level: 1, duration: 2 });
    expect(schedule[1]).toEqual({ level: 1, duration: 3 });
  });
});

describe('preset and setlist sanitizers', () => {
  it('normalises out of range values and preserves readonly flags', () => {
    const [preset] = sanitizePresetCollection([
      {
        name: '  Rock  ',
        bpm: 10,
        beatsPerBar: 32,
        stepsPerBeat: 8,
        accentMap: [0, 4, 9],
        swing: 2,
        countInBars: -2,
        volumes: { accent: 2, beat: -1, sub: 0.4 },
        soundProfile: 'unknown',
        voiceCount: 'yes',
        coachMode: 'nope',
        muteEvery: '100',
        gradualFrom: '20',
        gradualTo: '999',
        gradualBars: '0',
        a4: 390,
        toneNote: 120,
        stepPattern: [{ level: 5, figure: 'quarter' }],
        seqMode: 'invalid',
        seqEnabled: 'true',
        theme: 'purple',
        readonly: true,
      },
    ]);

    expect(preset.name).toBe('Rock');
    expect(preset.bpm).toBe(30);
    expect(preset.beatsPerBar).toBe(16);
    expect(preset.stepsPerBeat).toBe(1);
    expect(preset.accentMap).toHaveLength(16);
    expect(preset.accentMap[0]).toBe(2);
    expect(preset.swing).toBe(0.75);
    expect(preset.countInBars).toBe(0);
    expect(preset.volumes).toEqual({ accent: 1, beat: 0, sub: 0.4 });
    expect(preset.soundProfile).toBe('beep');
    expect(preset.voiceCount).toBe(true);
    expect(preset.coachMode).toBe('off');
    expect(preset.muteEvery).toBe(32);
    expect(preset.gradualFrom).toBe(30);
    expect(preset.gradualTo).toBe(250);
    expect(preset.gradualBars).toBe(16);
    expect(preset.a4).toBe(400);
    expect(preset.toneNote).toBe(95);
    expect(preset.stepPattern).toHaveLength(16);
    expect(preset.stepPattern[0]).toEqual({ level: 2, figure: 'quarter' });
    expect(preset.seqMode).toBe('replace');
    expect(preset.seqEnabled).toBe(true);
    expect(preset.theme).toBe('green');
    expect(preset.readonly).toBe(true);
  });

  it('sanitizes setlist entries and clamps volume/flags', () => {
    const [entry] = sanitizeSetlistCollection([
      {
        name: '  Intro  ',
        volume: 5,
        toneOn: 'yes',
        tempoLocked: 'true',
        bpm: 90,
        stepPattern: [{ level: 2, figure: 'eighth' }],
      },
    ]);

    expect(entry.name).toBe('Intro');
    expect(entry.volume).toBe(1);
    expect(entry.toneOn).toBe(true);
    expect(entry.tempoLocked).toBe(true);
    expect(entry.stepPattern).toHaveLength(16);
  });

  it('roundtrips preset/setlist payloads when exporting and importing', () => {
    const presets = sanitizePresetCollection([
      { name: 'One', bpm: 100, readonly: false },
      { name: 'Two', bpm: 140, readonly: true },
    ]);
    const setlist = sanitizeSetlistCollection([
      { name: 'A', bpm: 110 },
      { name: 'B', bpm: 120 },
    ]);

    const payload = JSON.parse(JSON.stringify({
      version: GLOBAL_CONFIG_VERSION,
      presets,
      setlist,
    }));

    expect(sanitizePresetCollection(payload.presets)).toEqual(presets);
    expect(sanitizeSetlistCollection(payload.setlist)).toEqual(setlist);
  });
});

describe('global configuration sanitiser', () => {
  it('restores safe defaults for invalid values', () => {
    const state = sanitizeConfigState({
      bpm: 400,
      beatsPerBar: 0,
      stepsPerBeat: 7,
      accentMap: [0, 3],
      swing: -1,
      countInBars: 9,
      volume: 2,
      volumes: { accent: -2, beat: 2, sub: 0.4 },
      soundProfile: '???',
      voiceCount: '1',
      coachMode: 'crazy',
      muteEvery: '80',
      gradualFrom: 10,
      gradualTo: 999,
      gradualBars: 0,
      toneOn: 'yes',
      a4: 390,
      toneNote: 120,
      seqMode: 'unknown',
      seqEnabled: 'true',
      theme: 'pink',
      tempoLocked: 'true',
      patternSteps: [{ level: 5, figure: 'quarter' }],
    });

    expect(state.bpm).toBe(250);
    expect(state.beatsPerBar).toBe(4);
    expect(state.stepsPerBeat).toBe(1);
    expect(state.accentMap).toEqual([2, 2, 0, 0]);
    expect(state.swing).toBe(0);
    expect(state.countInBars).toBe(8);
    expect(state.volume).toBe(1);
    expect(state.volumes).toEqual({ accent: 0, beat: 1, sub: 0.4 });
    expect(state.soundProfile).toBe('beep');
    expect(state.voiceCount).toBe(true);
    expect(state.coachMode).toBe('off');
    expect(state.muteEvery).toBe(32);
    expect(state.gradualFrom).toBe(30);
    expect(state.gradualTo).toBe(250);
    expect(state.gradualBars).toBe(16);
    expect(state.toneOn).toBe(true);
    expect(state.a4).toBe(400);
    expect(state.toneNote).toBe(95);
    expect(state.seqMode).toBe('replace');
    expect(state.seqEnabled).toBe(true);
    expect(state.theme).toBe('green');
    expect(state.tempoLocked).toBe(true);
    expect(state.patternSteps).toHaveLength(16);
  });
});

describe('user pattern serialization', () => {
  it('ensures ids are unique and data is normalised', () => {
    const patterns = serializeUserPatterns([
      { id: 'dup', name: '  Groove  ', steps: [1, 0, 2], seqMode: 'add', seqEnabled: 'true' },
      { id: 'dup', name: '', steps: [{ level: 5, figure: 'quarter' }], seqMode: '???', seqEnabled: 0 },
    ]);

    expect(patterns).toHaveLength(2);
    expect(new Set(patterns.map((p) => p.id)).size).toBe(2);
    expect(patterns[0].name).toBe('Groove');
    expect(patterns[0].seqMode).toBe('add');
    expect(patterns[0].seqEnabled).toBe(true);
    expect(patterns[0].steps).toHaveLength(16);
    expect(patterns[1].name).toBe('Patrón 2');
    expect(patterns[1].seqMode).toBe('replace');
    expect(patterns[1].seqEnabled).toBe(false);
    expect(patterns[1].steps[0]).toEqual({ level: 2, figure: 'quarter' });
  });

  it('deserializes stored payloads and keeps ids unique', () => {
    const stored = {
      version: 1,
      patterns: [
        { id: 'abc', name: 'Clave', steps: [1, 0, 0], seqMode: 'add', seqEnabled: true },
        { id: 'abc', name: null, steps: [{ level: 5, figure: 'quarter' }], seqMode: '???', seqEnabled: 'yes' },
      ],
    };

    const result = deserializeStoredPatterns(stored);
    expect(result).toHaveLength(2);
    expect(new Set(result.map((p) => p.id)).size).toBe(2);
    expect(result[0].name).toBe('Clave');
    expect(result[1].name).toBe('Patrón 2');
    expect(result[1].steps[0]).toEqual({ level: 2, figure: 'quarter' });
  });
});
