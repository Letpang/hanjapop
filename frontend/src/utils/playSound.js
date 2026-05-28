const getCtx = () => {
    try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        if (!window.myAudioCtx) window.myAudioCtx = new Ctor();
        const ctx = window.myAudioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    } catch { return null; }
};

const osc = (ctx, type, freq, freqEnd, freqTime, gain, gainEnd, dur, ramp = 'exp') => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.onended = () => g.disconnect();
    const t = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (ramp === 'exp') o.frequency.exponentialRampToValueAtTime(freqEnd, t + freqTime);
    else o.frequency.linearRampToValueAtTime(freqEnd, t + freqTime);
    g.gain.setValueAtTime(gain, t);
    if (ramp === 'exp') g.gain.exponentialRampToValueAtTime(gainEnd, t + dur);
    else g.gain.linearRampToValueAtTime(gainEnd, t + dur);
    o.start(t); o.stop(t + dur);
};

const SOUNDS = {
    // ShootGame
    shoot:    ctx => osc(ctx, 'square',   800, 100, 0.1, 0.05, 0.01, 0.1),
    boom:     ctx => osc(ctx, 'sawtooth', 120, 20,  0.2, 0.1,  0.01, 0.2),
    damage:   ctx => osc(ctx, 'triangle', 150, 50,  0.3, 0.25, 0.01, 0.3, 'linear'),
    wave:     ctx => osc(ctx, 'sine',     400, 800, 0.3, 0.15, 0.01, 0.3, 'linear'),
    // SentenceQuiz
    correct:  ctx => osc(ctx, 'sine',     400, 800, 0.2, 0.2,  0.01, 0.2, 'linear'),
    wrong:    ctx => osc(ctx, 'sawtooth', 200, 100, 0.3, 0.15, 0.01, 0.3),
    // MatchGame ('mismatch'로 분리 — wrong과 주파수 다름)
    flip:     ctx => osc(ctx, 'sine',     600, 600, 0.09, 0.04, 0, 0.09, 'linear'),
    match:    ctx => {
        const t = ctx.currentTime;
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.onended = () => g2.disconnect();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(600, t);
        o2.frequency.setValueAtTime(800, t + 0.12);
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.06, t + 0.01);
        g2.gain.setValueAtTime(0.06, t + 0.1);
        g2.gain.linearRampToValueAtTime(0, t + 0.32);
        o2.start(t); o2.stop(t + 0.32);
    },
    mismatch: ctx => osc(ctx, 'sine',     280, 200, 0.25, 0.05, 0, 0.25, 'linear'),
};

export const playSound = (type) => {
    try {
        const ctx = getCtx();
        if (!ctx) return;
        SOUNDS[type]?.(ctx);
    } catch {}
};
