// Barra de boosts: habilidades que o jogador precisa ATIVAR à mão e que recarregam com o tempo.
// Quem não volta para ativar perde o bônus; é o que faz o jogador entrar de tempos em tempos.
var Toast = {
  timer: null,
  show: function (html, ms) {
    var el = document.getElementById('toast');
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(Toast.timer);
    Toast.timer = setTimeout(function () { el.hidden = true; }, ms || 2600);
  }
};

(function () {
  var E = Economy, S = Game.state;
  var bar = document.getElementById('boosts');
  var chips = [], prev = {}, firstPass = true, pendingUnlocks = [];

  E.BOOSTS.forEach(function (b) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'boost';
    el.title = b.desc;
    el.setAttribute('aria-label', b.name + ': ' + b.desc);
    el.innerHTML =
      '<span class="b-ico">' + Icons.svg(b.icon) + '</span>' +
      '<span class="b-txt"><b>' + b.name + '</b><small class="b-st"></small></span>' +
      '<span class="b-bar"><i></i></span>';
    el.addEventListener('click', function () { activate(b); });
    bar.appendChild(el);
    chips.push({ b: b, el: el, st: el.querySelector('.b-st'), fill: el.querySelector('.b-bar i') });
  });

  // Texto curto do que falta para liberar: "Nível 3" ou "12 máquinas".
  function needShort(b) { return b.need.level ? 'Nível ' + b.need.level : b.need.total + ' máquinas'; }

  function activate(b) {
    if (!E.boostUnlocked(b, S.machines, S.level)) {
      Sfx.error();
      Toast.show(Icons.svg('lock') + ' ' + b.name + ': ' + E.needText(b));
      return;
    }
    var gain = b.kind === 'instant' ? Game.baseRate() * b.secs : 0;
    if (!Game.activateBoost(b.id)) { Sfx.error(); return; }
    Sfx.tier();
    if (b.kind === 'instant') {
      Toast.show(Icons.svg('gift') + ' ' + b.name + ' aberto: +' + E.fmt(gain) + ' moedas');
    } else {
      Toast.show(Icons.svg(b.icon) + ' ' + b.name + ' ativado! ' + b.desc);
    }
  }

  function update() {
    var now = Date.now();
    var anyReady = false;
    chips.forEach(function (c) {
      var open = E.boostUnlocked(c.b, S.machines, S.level);
      var s = open ? E.boostStatus(S.boosts[c.b.id], now) : { state: 'locked', left: 0 };
      if (prev[c.b.id + ':open'] === false && open && !firstPass) pendingUnlocks.push(c.b);   // acabou de abrir
      prev[c.b.id + ':open'] = open;
      var cls = 'boost ' + s.state;
      if (c.el.className !== cls) c.el.className = cls;

      var text, pct;
      if (s.state === 'locked') { text = needShort(c.b); pct = 0; }
      else if (s.state === 'ready') { text = 'Ativar'; pct = 0; }
      else if (s.state === 'active') { text = E.fmtClock(s.left); pct = s.left / c.b.dur * 100; }
      else { text = E.fmtClock(s.left); pct = (1 - s.left / c.b.cd) * 100; }
      if (c.st.textContent !== text) c.st.textContent = text;
      c.fill.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';

      if (prev[c.b.id] === 'cooling' && s.state === 'ready') Sfx.ready();   // acabou de recarregar
      prev[c.b.id] = s.state;
      if (s.state === 'ready') anyReady = true;
    });
    firstPass = false;
    // Avisa quando um boost é liberado (espera a tela de vitória fechar, para o aviso não ficar por cima dela).
    if (pendingUnlocks.length && document.getElementById('win').hidden) {
      var b = pendingUnlocks.shift();
      Sfx.tier();
      Game.markSeen('boosts');
      Toast.show(Icons.svg(b.icon) + ' Boost liberado: ' + b.name + '! Toque nele para ativar.', 5000);
    }
  }

  Game.listeners.push(update);
  update();
})();
