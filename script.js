(() => {
  'use strict';

  const el = {
    ring: document.getElementById('ring'),
    time: document.getElementById('time'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    toggle: document.getElementById('toggle'),
    reset: document.getElementById('reset'),
  };

  // 状態
  let total = 0;         // 設定秒数
  let remain = 0;        // 残り秒数
  let running = false;   // 実行中か
  let timerId = null;

  // 初期値をロード
  const loadDefaults = () => {
    const m = localStorage.getItem('timer:minutes');
    const s = localStorage.getItem('timer:seconds');
    el.minutes.value = m !== null ? clampInt(m, 0, 999) : 1;
    el.seconds.value = s !== null ? clampInt(s, 0, 59) : 0;
    total = getInputSeconds();
    remain = total;
    render();
  };

  const clampInt = (v, min, max) => {
    const n = Math.max(min, Math.min(max, parseInt(v, 10) || 0));
    return n;
  };

  const getInputSeconds = () => {
    const m = clampInt(el.minutes.value, 0, 999);
    const s = clampInt(el.seconds.value, 0, 59);
    return m * 60 + s;
  };

  const setProgress = (fraction) => {
    const f = isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
    document.documentElement.style.setProperty('--p', String(f));
  };

  const format = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const render = () => {
    el.time.textContent = format(remain);
    const frac = total > 0 ? (total - remain) / total : 0;
    setProgress(frac);
    document.title = running ? `⏳ ${format(remain)} • Timer` : `Timer`;
  };

  const setRunning = (on) => {
    running = on;
    el.toggle.textContent = on ? '一時停止' : '開始';
    el.minutes.disabled = on;
    el.seconds.disabled = on;
  };

  const stop = ({ keepRemain = true } = {}) => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    setRunning(false);
    if (!keepRemain) {
      remain = total;
    }
    render();
  };

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.4);
      setTimeout(() => ctx.close(), 500);
    } catch (_) { /* 無音でもOK */ }
  };

  const tick = () => {
    if (remain > 0) {
      remain -= 1;
      render();
      if (remain === 0) {
        stop({ keepRemain: true });
        beep();
      }
    }
  };

  // ハンドラ
  el.toggle.addEventListener('click', () => {
    if (!running) {
      total = getInputSeconds();
      if (total <= 0) return;
      if (remain <= 0 || remain > total) {
        remain = total;
      }
      setRunning(true);
      render();
      timerId = setInterval(tick, 1000);
    } else {
      stop({ keepRemain: true });
    }
  });

  el.reset.addEventListener('click', () => {
    total = getInputSeconds();
    remain = total;
    stop({ keepRemain: true });
    render();
  });

  const persistInputs = () => {
    localStorage.setItem('timer:minutes', String(clampInt(el.minutes.value, 0, 999)));
    localStorage.setItem('timer:seconds', String(clampInt(el.seconds.value, 0, 59)));
  };

  el.minutes.addEventListener('input', () => {
    el.minutes.value = clampInt(el.minutes.value, 0, 999);
    persistInputs();
    if (!running) {
      total = getInputSeconds();
      remain = total;
      render();
    }
  });
  el.seconds.addEventListener('input', () => {
    el.seconds.value = clampInt(el.seconds.value, 0, 59);
    persistInputs();
    if (!running) {
      total = getInputSeconds();
      remain = total;
      render();
    }
  });

  // キーボードショートカット
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      el.toggle.click();
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      el.reset.click();
    }
  });

  loadDefaults();
})();

