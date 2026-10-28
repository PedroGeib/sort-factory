// Efeitos sonoros gerados por código (sem arquivos de som). O navegador só libera o áudio
// depois de um toque do jogador, então o contexto é criado no primeiro som.
var Sfx = (function () {
  var ctx = null;
  var played = 0;      // quantos sons foram agendados (usado nos testes)
  var muted = false;   // true enquanto um anúncio toca

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    if (!Game.state.settings.sound || muted || (window.Platform && Platform.isMuted())) return;
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + start;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
    played++;
  }

  function arpeggio(notes, step, dur, type, vol) {
    notes.forEach(function (f, i) { tone(f, i * step, dur, type, vol); });
  }

  return {
    select: function () { tone(520, 0, 0.07, 'sine', 0.12); },
    click:  function () { tone(400, 0, 0.04, 'sine', 0.08); },
    pour:   function () { tone(330, 0, 0.16, 'triangle', 0.16, 560); },
    error:  function () { tone(180, 0, 0.12, 'square', 0.08, 140); },
    done:   function () { arpeggio([523, 659, 784], 0.08, 0.18, 'sine', 0.14); },
    win:    function () { arpeggio([523, 659, 784, 1047, 1319], 0.09, 0.25, 'triangle', 0.15); },
    buy:    function () { tone(660, 0, 0.08, 'square', 0.07); tone(990, 0.07, 0.12, 'square', 0.07); },
    tier:   function () { arpeggio([659, 784, 988, 1319], 0.07, 0.22, 'triangle', 0.15); },
    ready:  function () { tone(880, 0, 0.1, 'sine', 0.1); tone(1175, 0.1, 0.16, 'sine', 0.1); },
    setMuted: function (m) { muted = m; if (ctx) { if (m) ctx.suspend(); else ctx.resume(); } },
    count:  function () { return played; }
  };
})();
