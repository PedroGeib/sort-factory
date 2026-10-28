// Tela de Conquistas: progresso de cada uma, resgate das gemas e avisos de desbloqueio.
(function () {
  var E = Economy;
  var S = Game.state;
  var $ = function (id) { return document.getElementById(id); };
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }

  var GROUPS = [
    { id: 'puzzle',   title: 'Puzzle',   color: '#2ecc71' },
    { id: 'fabrica',  title: 'Fábrica',  color: '#5aa9ff' },
    { id: 'economia', title: 'Economia', color: '#ffd60a' },
    { id: 'boosts',   title: 'Boosts',   color: '#ff8c42' },
    { id: 'offline',  title: 'Offline',  color: '#9aa3b8' }
  ];
  var cards = [];

  function build() {
    var list = $('ach-list');
    GROUPS.forEach(function (g) {
      var defs = E.ACHIEVEMENTS.filter(function (a) { return a.group === g.id; });
      var head = document.createElement('div');
      head.className = 'group-title';
      head.style.setProperty('--tc', g.color);
      head.textContent = g.title;
      list.appendChild(head);
      defs.forEach(function (def) {
        var el = document.createElement('div');
        el.className = 'item ach';
        el.style.setProperty('--tc', g.color);
        el.innerHTML =
          '<div class="i-icon">' + Icons.svg(def.icon) + '</div>' +
          '<div class="i-info">' +
            '<b>' + def.name + '</b>' +
            '<small>' + def.desc + '</small>' +
            '<span class="prog"><i></i></span>' +
            '<small class="i-prog"></small>' +
          '</div>' +
          '<button class="i-buy gem" type="button"><span class="i-n"></span><span class="i-cost"></span></button>';
        var btn = el.querySelector('.i-buy');
        btn.addEventListener('click', function () { claim(def); });
        list.appendChild(el);
        cards.push({ def: def, el: el, btn: btn, fill: el.querySelector('.prog i'), prog: el.querySelector('.i-prog'),
                     n: el.querySelector('.i-n'), cost: el.querySelector('.i-cost') });
      });
    });
  }

  function claim(def) {
    if (!Game.claimAchievement(def.id)) return;
    Sfx.tier();
    Toast.show(Icons.svg('gem') + ' +' + def.gems + ' gemas: ' + def.name);
  }

  function fmtProg(def, p) {
    var f = function (n) { return E.fmt(Math.floor(n)); };
    return f(p.cur) + ' / ' + f(def.max);
  }

  // Atualiza o ponto na aba (quantas conquistas dá para resgatar), mesmo com a tela fechada.
  function updateBadge() {
    var na = Game.claimable(), nm = Game.missionClaimable(), n = na + nm, tab = $('tab-ach'), b = tab.querySelector('.tab-badge');
    var ab = $('ach-badge'), mb = $('mis-badge');
    ab.hidden = na === 0; setText(ab, String(na));
    mb.hidden = nm === 0; setText(mb, String(nm));
    if (!b) { b = document.createElement('b'); b.className = 'tab-badge'; tab.appendChild(b); }
    b.hidden = n === 0;
    setText(b, String(n));
  }

  function update() {
    updateBadge();
    if ($('view-ach').hidden || $('pane-achs').hidden) return;
    var ctx = Game.achCtx(), done = 0, claimable = 0, gemsPending = 0;
    cards.forEach(function (c) {
      var def = c.def, p = E.achProgress(def, ctx), rec = S.achievements[def.id];
      var state = rec ? (rec.claimed ? 'claimed' : 'ready') : 'todo';
      if (state !== 'todo') done++;
      if (state === 'ready') { claimable++; gemsPending += def.gems; }
      var cls = 'item ach ' + state;
      if (c.el.className !== cls) c.el.className = cls;
      c.fill.style.width = (state === 'todo' ? p.pct : 100).toFixed(1) + '%';
      setText(c.prog, state === 'todo' ? fmtProg(def, p) : 'Completa');
      setText(c.n, state === 'ready' ? 'Resgatar' : state === 'claimed' ? 'Resgatado' : 'Recompensa');
      setHtml(c.cost, state === 'claimed' ? Icons.svg('check') : Icons.svg('gem') + ' ' + def.gems);
      c.btn.disabled = state !== 'ready';
    });
    setHtml($('ach-summary'),
      '<span class="pill">' + Icons.svg('medal') + ' ' + done + ' de ' + cards.length + ' conquistas</span>' +
      (claimable ? '<span class="pill hot">' + Icons.svg('gem') + ' ' + gemsPending + ' gemas para resgatar</span>' : ''));
  }

  // Aviso quando uma conquista é desbloqueada.
  Game.onUnlock.push(function (defs) {
    Sfx.tier();
    var first = defs[0];
    Toast.show(Icons.svg('medal') + ' Conquista: ' + first.name + (defs.length > 1 ? ' (+' + (defs.length - 1) + ')' : ''), 3600);
  });

  build();
  $('goal-missions').addEventListener('click', function () { Sfx.click(); showGoal('missions'); });
  $('goal-achs').addEventListener('click', function () { Sfx.click(); showGoal('achs'); });
  function showGoal(which) {
    $('pane-missions').hidden = which !== 'missions';
    $('pane-achs').hidden = which !== 'achs';
    $('goal-missions').classList.toggle('active', which === 'missions');
    $('goal-achs').classList.toggle('active', which === 'achs');
    update();
    window.dispatchEvent(new Event('goals-changed'));
  }
  Game.listeners.push(update);
  Tabs.on('ach', update);
  update();
})();
