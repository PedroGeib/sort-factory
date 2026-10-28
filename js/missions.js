// Tela de Missoes (dentro da aba Metas): diarias, semanais e mensais, com contagem para reiniciar,
// resgate de cada missao e bonus por completar todas.
(function () {
  var E = Economy;
  var S = Game.state;
  var $ = function (id) { return document.getElementById(id); };
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }

  var COLORS = { daily: '#5aa9ff', weekly: '#ffd60a', monthly: '#ff70a6' };
  var ICONS = { daily: 'clock', weekly: 'layers', monthly: 'crown' };
  var groups = {};   // por periodo: { key, root, cards[], bonus, timer, count }

  function rewardHtml(P, bonus) {
    var gems = bonus ? P.bonusGems : P.gems, secs = bonus ? P.bonusSecs : P.secs;
    return Icons.svg('gem') + ' ' + gems + ' &middot; ' + Icons.svg('coin') + ' ' + E.fmtTime(secs) + ' de produção';
  }

  function addCard(list, color, icon, title, onClick, extraClass) {
    var el = document.createElement('div');
    el.className = 'item mission' + (extraClass ? ' ' + extraClass : '');
    el.style.setProperty('--tc', color);
    el.innerHTML =
      '<div class="i-icon">' + Icons.svg(icon) + '</div>' +
      '<div class="i-info"><b></b><span class="prog"><i></i></span><small class="i-prog"></small><span class="i-reward"></span></div>' +
      '<button class="i-buy" type="button"><span class="i-n"></span><span class="i-cost"></span></button>';
    el.querySelector('b').textContent = title;
    var btn = el.querySelector('.i-buy');
    btn.addEventListener('click', onClick);
    list.appendChild(el);
    return { el: el, btn: btn, title: el.querySelector('b'), fill: el.querySelector('.prog i'), prog: el.querySelector('.i-prog'),
             reward: el.querySelector('.i-reward'), n: el.querySelector('.i-n'), cost: el.querySelector('.i-cost') };
  }

  // Monta (ou refaz, quando o periodo troca) as missoes de um periodo.
  function build(period) {
    var P = E.PERIODS[period], mm = S.missions[period];
    var g = groups[period];
    if (!g) {
      var root = document.createElement('section');
      root.className = 'mission-group';
      root.innerHTML = '<h3></h3><p class="sub"></p><div class="mission-list"></div>';
      $('pane-missions').appendChild(root);
      g = groups[period] = { root: root, list: root.querySelector('.mission-list'), head: root.querySelector('h3'), sub: root.querySelector('.sub'), cards: [] };
      g.head.innerHTML = Icons.svg(ICONS[period]) + ' <span>' + P.title + '</span><small></small>';
      g.count = g.head.querySelector('small');
    }
    g.key = mm.key;
    g.list.innerHTML = '';
    g.cards = [];
    mm.list.forEach(function (ms, i) {
      var d = E.missionDef(period, ms.id);
      if (!d) return;
      var c = addCard(g.list, COLORS[period], d.icon, E.missionText(period, ms.id, ms.target), function () {
        if (Game.claimMission(period, i)) { Sfx.tier(); Toast.show(Icons.svg('gem') + ' Missão resgatada! +' + P.gems + ' gemas'); } else Sfx.error();
      });
      setHtml(c.reward, rewardHtml(P, false));
      g.cards.push({ c: c, i: i, target: ms.target });
    });
    g.bonus = addCard(g.list, '#b07cff', 'gift', 'Bônus: complete todas as ' + P.title.toLowerCase(), function () {
      if (Game.claimMissionBonus(period)) { Sfx.win(); Toast.show(Icons.svg('gift') + ' Bônus resgatado! +' + P.bonusGems + ' gemas'); } else Sfx.error();
    }, 'bonus');
    setHtml(g.bonus.reward, rewardHtml(P, true));
  }

  function update() {
    var nowDate = new Date(), now = nowDate.getTime();
    // o selo da aba e dos botoes e atualizado em achievements.js; aqui so a tela de missoes
    if ($('view-ach').hidden || $('pane-missions').hidden) return;
    E.PERIOD_ORDER.forEach(function (period) {
      var mm = S.missions[period], P = E.PERIODS[period];
      if (!groups[period] || groups[period].key !== mm.key) build(period);
      var g = groups[period], done = 0;
      g.cards.forEach(function (x) {
        var ms = mm.list[x.i], c = x.c;
        var ready = !ms.claimed && ms.progress >= ms.target;
        if (ms.claimed) done++;
        var state = ms.claimed ? 'claimed' : ready ? 'ready' : 'todo';
        var cls = 'item mission ' + state;
        if (c.el.className !== cls) c.el.className = cls;
        c.fill.style.width = (ms.target ? Math.min(100, ms.progress / ms.target * 100) : 0).toFixed(1) + '%';
        setText(c.prog, ms.claimed ? 'Resgatada' : E.fmt(Math.floor(ms.progress)) + ' / ' + E.fmt(ms.target));
        setText(c.n, ms.claimed ? 'Resgatada' : ready ? 'Resgatar' : 'Em andamento');
        setHtml(c.cost, ms.claimed ? Icons.svg('check') : Icons.svg('gem') + ' ' + P.gems);
        c.btn.disabled = !ready;
      });
      var allClaimed = mm.list.length > 0 && done === mm.list.length;
      var bState = mm.bonusClaimed ? 'claimed' : allClaimed ? 'ready' : 'todo';
      var bcls = 'item mission bonus ' + bState;
      if (g.bonus.el.className !== bcls) g.bonus.el.className = bcls;
      g.bonus.fill.style.width = (mm.list.length ? done / mm.list.length * 100 : 0).toFixed(1) + '%';
      setText(g.bonus.prog, mm.bonusClaimed ? 'Resgatado' : done + ' / ' + mm.list.length + ' resgatadas');
      setText(g.bonus.n, mm.bonusClaimed ? 'Resgatado' : allClaimed ? 'Resgatar' : 'Bloqueado');
      setHtml(g.bonus.cost, mm.bonusClaimed ? Icons.svg('check') : Icons.svg('gem') + ' ' + P.bonusGems);
      g.bonus.btn.disabled = !allClaimed || mm.bonusClaimed;
      setText(g.count, done + ' de ' + mm.list.length);
      var left = (E.nextReset(period, nowDate) - now) / 1000;
      var days = Math.floor(left / 86400);
      setText(g.sub, 'Reinicia em ' + (days >= 1 ? days + (days === 1 ? ' dia ' : ' dias ') + Math.floor((left % 86400) / 3600) + ' h' : E.fmtTime(left)));
    });
  }

  Game.listeners.push(update);
  Tabs.on('ach', update);
  window.addEventListener('goals-changed', update);
  update();
})();
