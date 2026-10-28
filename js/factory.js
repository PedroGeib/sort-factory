// Tela da fábrica: abas, cena animada, painel "Sua fábrica" (tudo que foi instalado) e a loja.
(function () {
  var E = Economy;
  var S = Game.state;
  var $ = function (id) { return document.getElementById(id); };
  // Só troca o HTML quando ele mudou. Refazer o mesmo conteúdo 5 vezes por segundo podia fazer o
  // navegador perder um clique que começou num ícone que acabou de ser substituído.
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }

  // Cor de cada grupo de itens (as 20 máquinas ganham cores em círculo cromático).
  var GROUP = {
    global:  { title: 'Fábrica inteira',       color: '#ffd60a' },
    puzzle:  { title: 'Puzzle',                color: '#2ecc71' },
    offline: { title: 'Funcionamento offline', color: '#9aa3b8' }
  };
  function machineColor(i) { return 'hsl(' + ((200 + i * 18) % 360) + ',85%,62%)'; }
  E.MACHINES.forEach(function (m, i) { GROUP[m.id] = { title: m.name, color: machineColor(i) }; });
  // Cada máquina tem 5 níveis (marcos de unidades); a cor sobe junto.
  var TIER_COLORS = ['#6c7896', '#5aa9ff', '#2ecc71', '#b07cff', '#ffd60a', '#ff70a6'];

  function own(id) { return S.machines[id] || 0; }
  function has(id) { return !!S.upgrades[id]; }
  function tier(id) {
    var n = own(id), t = 0;
    E.MILESTONES.forEach(function (m) { if (n >= m) t++; });
    return t;
  }
  // Quantas melhorias de uma máquina estão instaladas (0 a 2).
  function ulv(id) { return (has(id + '1') ? 1 : 0) + (has(id + '2') ? 1 : 0); }

  function starsHtml(t) {
    var h = '';
    for (var i = 0; i < E.MILESTONES.length; i++) h += Icons.svg(i < t ? 'star' : 'starO', 'mini');
    return h;
  }

  // ---------- Aba da Fábrica ----------
  var viewFactory = $('view-factory');
  var tabFactory = $('tab-factory');
  Tabs.on('factory', function () {
    viewFactory.scrollTop = 0;
    $('hint-factory').hidden = S.settings.seen.factory;
    resizeCanvas(); update(); startAnim();
  });
  Tabs.on('*', function () { updateDot(); });

  // Ponto vermelho na aba da fábrica quando já dá para comprar alguma coisa.
  function updateDot() {
    var can = E.MACHINES.some(function (m, i) { return E.machineUnlocked(S.machines, i) && S.coins >= E.unitCost(m, own(m.id)); }) ||
      E.UPGRADES.some(function (u) { return !has(u.id) && E.unlocked(u, S.machines, S.level) && S.coins >= u.cost; });
    tabFactory.classList.toggle('dot', can && viewFactory.hidden);
  }

  function hideHint() { $('hint-factory').hidden = true; Game.markSeen('factory'); }
  $('hint-factory').querySelector('.hint-ok').addEventListener('click', hideHint);

  // ---------- Loja: abas Máquinas / Melhorias ----------
  var shopTab = 'machines';
  function setShopTab(t) {
    shopTab = t;
    $('pane-machines').hidden = t !== 'machines';
    $('pane-upgrades').hidden = t !== 'upgrades';
    $('shop-machines').classList.toggle('active', t === 'machines');
    $('shop-upgrades').classList.toggle('active', t === 'upgrades');
  }
  $('shop-machines').addEventListener('click', function () { Sfx.click(); setShopTab('machines'); });
  $('shop-upgrades').addEventListener('click', function () { Sfx.click(); setShopTab('upgrades'); });

  // ---------- Loja: máquinas ----------
  var mode = 1;   // 1, 10 ou 'max'
  var mCards = [];

  function qty(m, owned) {
    return mode === 'max' ? Math.max(1, E.maxAffordable(m, owned, S.coins)) : mode;
  }

  function buildMachines() {
    var list = $('machines');
    E.MACHINES.forEach(function (m, idx) {
      var el = document.createElement('div');
      el.className = 'item machine';
      el.style.setProperty('--tc', GROUP[m.id].color);
      el.innerHTML =
        '<div class="i-icon">' + Icons.svg(m.icon) + '</div>' +
        '<div class="i-info">' +
          '<b>' + m.name + ' <span class="i-count"></span></b>' +
          '<span class="i-stars"></span>' +
          '<small>' + m.desc + '</small>' +
          '<small class="i-rate"></small>' +
          '<small class="i-req"></small>' +
        '</div>' +
        '<button class="i-buy" type="button"><span class="i-n"></span><span class="i-cost"></span></button>';
      var btn = el.querySelector('.i-buy');
      btn.addEventListener('click', function () { buyMachine(m); });
      list.appendChild(el);
      mCards.push({
        m: m, idx: idx, el: el, btn: btn, icon: el.querySelector('.i-icon'),
        stars: el.querySelector('.i-stars'), count: el.querySelector('.i-count'),
        rate: el.querySelector('.i-rate'), req: el.querySelector('.i-req'),
        n: el.querySelector('.i-n'), cost: el.querySelector('.i-cost')
      });
    });
    var teaser = document.createElement('div');
    teaser.id = 'teaser';
    teaser.className = 'teaser';
    list.appendChild(teaser);
  }

  function buyMachine(m) {
    var idx = E.MACHINES.indexOf(m);
    if (!E.machineUnlocked(S.machines, idx)) return;
    var owned = own(m.id);
    var n = qty(m, owned);
    var cost = E.bulkCost(m, owned, n);
    if (S.coins < cost) return;
    var tierBefore = tier(m.id);
    S.coins -= cost;
    S.machines[m.id] = owned + n;
    Game.track('machines', n);
    buyPulse[idx] = 1;
    var tierNow = tier(m.id);
    if (tierNow > tierBefore) {
      flash = 1;
      Sfx.tier();
      Toast.show(Icons.svg('star') + ' ' + m.name + ' nível ' + tierNow + '! Produção ×2');
    } else {
      Sfx.buy();
    }
    hideHint();
    Game.emit();
    Game.save();
  }

  // ---------- Loja: melhorias ----------
  var uCards = [];

  function buildUpgrades() {
    var list = $('upgrades');
    var order = ['esteira', 'braco', 'separador', 'linha', 'mega', 'global', 'puzzle', 'offline'];
    order.forEach(function (g) {
      var ups = E.UPGRADES.filter(function (u) { return u.group === g; });
      if (!ups.length) return;
      var head = document.createElement('div');
      head.className = 'group-title';
      head.style.setProperty('--tc', GROUP[g].color);
      head.textContent = GROUP[g].title;
      list.appendChild(head);
      ups.forEach(function (u) {
        var el = document.createElement('div');
        el.className = 'item upgrade';
        el.style.setProperty('--tc', GROUP[g].color);
        el.innerHTML =
          '<div class="i-icon">' + Icons.svg(u.icon) + '</div>' +
          '<div class="i-info">' +
            '<b>' + u.name + '</b>' +
            '<small>' + u.desc + '</small>' +
            '<small class="i-req"></small>' +
          '</div>' +
          '<button class="i-buy" type="button"><span class="i-n"></span><span class="i-cost"></span></button>';
        var btn = el.querySelector('.i-buy');
        btn.addEventListener('click', function () { buyUpgrade(u); });
        list.appendChild(el);
        uCards.push({ u: u, el: el, btn: btn, req: el.querySelector('.i-req'), n: el.querySelector('.i-n'), cost: el.querySelector('.i-cost') });
      });
    });
  }

  function buyUpgrade(u) {
    if (has(u.id) || !E.unlocked(u, S.machines, S.level) || S.coins < u.cost) return;
    S.coins -= u.cost;
    S.upgrades[u.id] = true;
    Game.track('upgrades', 1);
    flash = 1;
    Sfx.tier();
    Toast.show(Icons.svg(u.icon) + ' Instalado: ' + u.name);
    hideHint();
    Game.emit();
    Game.save();
  }

  // ---------- Painel "Sua fábrica": tudo que existe, o que já foi instalado e o que falta ----------
  var invTiles = [];

  function buildInventory() {
    var box = $('inventory');
    function row(label, items) {
      var lab = document.createElement('div');
      lab.className = 'inv-label';
      lab.textContent = label;
      box.appendChild(lab);
      var r = document.createElement('div');
      r.className = 'inv-row';
      items.forEach(function (it) {
        var t = document.createElement('div');
        t.className = 'inv-tile off';
        t.style.setProperty('--tc', GROUP[it.group].color);
        t.innerHTML = Icons.svg(it.icon) + '<span class="inv-badge"></span>' + '<span class="inv-lock">' + Icons.svg('lock') + '</span>';
        t.title = it.name + ' - ' + it.desc;
        r.appendChild(t);
        invTiles.push({ it: it, el: t, badge: t.querySelector('.inv-badge') });
      });
      box.appendChild(r);
    }
    row('Máquinas', E.MACHINES.map(function (m, i) { return { kind: 'm', id: m.id, index: i, group: m.id, icon: m.icon, name: m.name, desc: m.desc }; }));
    row('Melhorias', E.UPGRADES.map(function (u) { return { kind: 'u', id: u.id, group: u.group, icon: u.icon, name: u.name, desc: u.desc, u: u }; }));
  }

  // ---------- Atualização dos textos (sem recriar botões, para não perder cliques) ----------
  var lastInstalled = -1;

  function update() {
    updateDot();
    if (viewFactory.hidden) return;
    var lvl = E.levelMult(S.level, S.upgrades);
    var first = E.totalMachines(S.machines) === 0;

    var maxUnlocked = 0;
    E.MACHINES.forEach(function (m, i) { if (E.machineUnlocked(S.machines, i)) maxUnlocked = i; });
    mCards.forEach(function (c) {
      var idx = c.idx, unl = E.machineUnlocked(S.machines, idx), show = idx <= maxUnlocked + 1;
      c.el.style.display = show ? '' : 'none';
      if (!show) return;
      c.el.classList.toggle('locked', !unl);
      var owned = own(c.m.id), n = qty(c.m, owned), cost = E.bulkCost(c.m, owned, n);
      var next = E.nextMilestone(owned), t = tier(c.m.id);
      c.count.textContent = owned ? '×' + owned : '';
      var starsKey = 'k' + t;
      if (c.stars.getAttribute('data-k') !== starsKey) { c.stars.innerHTML = starsHtml(t); c.stars.setAttribute('data-k', starsKey); }
      c.stars.style.color = TIER_COLORS[t];
      c.icon.style.borderColor = owned ? TIER_COLORS[t] : '';
      var total = E.machineRate(c.m, owned, S.upgrades) * E.mods(S.upgrades).global * lvl;
      var each = E.machineRate(c.m, 1, S.upgrades) * E.mods(S.upgrades).global * lvl;
      c.rate.textContent = (owned ? '+' + E.fmt(total) + '/s no total' : '+' + E.fmt(each) + '/s cada') +
        (next ? ' · dobra com ' + next : ' · nível máximo');
      c.req.textContent = unl ? '' : 'Precisa de ' + E.UNLOCK_PREV + ' ' + E.MACHINES[idx - 1].name;
      c.n.textContent = 'Comprar ×' + n;
      setHtml(c.cost, Icons.svg('coin') + ' ' + E.fmt(cost));
      c.btn.disabled = !unl || S.coins < cost;
      c.btn.classList.toggle('pulse', first && idx === 0);
    });
    var hiddenCount = E.MACHINES.length - 1 - (maxUnlocked + 1);
    var teaser = $('teaser');
    teaser.textContent = hiddenCount > 0 ? hiddenCount + ' máquinas ainda por descobrir...' : '';
    teaser.style.display = hiddenCount > 0 ? '' : 'none';

    var badge = 0;
    uCards.forEach(function (c) {
      var u = c.u, owned = has(u.id), ok = E.unlocked(u, S.machines, S.level);
      var cls = 'item upgrade' + (owned ? ' own' : ok ? '' : ' locked');
      if (c.el.className !== cls) c.el.className = cls;
      c.req.textContent = owned ? 'Instalado' : ok ? '' : E.needText(u);
      c.n.textContent = owned ? 'Instalado' : 'Instalar';
      setHtml(c.cost, owned ? Icons.svg('check') : Icons.svg('coin') + ' ' + E.fmt(u.cost));
      c.btn.disabled = owned || !ok || S.coins < u.cost;
      if (!owned && ok && S.coins >= u.cost) badge++;
    });
    var b = $('up-badge');
    b.hidden = badge === 0;
    b.textContent = badge;

    // painel "Sua fábrica"
    var installed = 0;
    invTiles.forEach(function (t) {
      var it = t.it, isOwn, locked = false;
      if (it.kind === 'm') {
        var n = own(it.id);
        isOwn = n > 0;
        locked = !isOwn && !E.machineUnlocked(S.machines, it.index);
        t.badge.textContent = n ? n : '';
        t.el.style.borderColor = n ? TIER_COLORS[tier(it.id)] : '';
      } else {
        isOwn = has(it.id);
        locked = !isOwn && !E.unlocked(it.u, S.machines, S.level);
        t.badge.textContent = '';
      }
      if (isOwn) installed++;
      var cls = 'inv-tile' + (isOwn ? ' own' : ' off') + (locked ? ' locked' : '');
      if (t.el.className !== cls) t.el.className = cls;
    });
    if (installed !== lastInstalled) {
      $('inv-count').textContent = installed + ' de ' + invTiles.length + ' instalados';
      lastInstalled = installed;
    }

    var boosted = Game.rate() > Game.baseRate() * 1.0001;
    setHtml($('factory-summary'),
      '<span class="pill' + (boosted ? ' hot' : '') + '">' + Icons.svg('bolt') + ' ' + E.fmt(Game.rate()) + ' moedas/s</span>' +
      '<span class="pill">' + Icons.svg('trophy') + ' Bônus do puzzle ×' + E.dec(lvl, 2) + '</span>' +
      '<span class="pill">' + Icons.svg('battery') + ' Offline até ' + Math.round(E.offlineCap(S.upgrades) / 3600) + ' h</span>');
  }

  document.querySelectorAll('#buy-mode button').forEach(function (b) {
    b.addEventListener('click', function () {
      Sfx.click();
      mode = b.dataset.mode === 'max' ? 'max' : Number(b.dataset.mode);
      document.querySelectorAll('#buy-mode button').forEach(function (o) { o.classList.toggle('active', o === b); });
      update();
    });
  });

  // =====================================================================
  // CENA ANIMADA: cada coisa instalada aparece aqui
  // =====================================================================
  var cv = $('belt'), ctx = cv.getContext('2d');
  var W = 300, H = 260, NB = 5, SCENE_H = 260;   // H = altura total do canvas (cena + linha de máquinas)
  var PARK = { cols: 8, rows: 3, tile: 36, gap: 6, top: 26 };
  var buyPulse = [];
  var CEIL = 16, WIN_Y = 22, WIN_H = 72, SHELF_Y = WIN_Y + WIN_H;
  var BELT_Y = 158, BELT_H = 14, BIN_TOP = 184, BIN_H = 52, FLOOR_Y = 240;
  var bins = [], pieces = [], floats = [], sparks = [];
  var pulse = [0, 0, 0, 0, 0], arm = [0, 0, 0, 0, 0], binLevel = [0, 0, 0, 0, 0];
  var spawnAcc = 0, beltOffset = 0, animOn = false, lastT = 0;
  var clock = 0, flash = 0, puffs = [];
  var SHAPE_PATHS = Icons.SHAPES.map(function (d) { return new Path2D(d); });

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);   // telas muito densas não precisam de mais
    W = cv.clientWidth || 300;
    PARK.cols = Math.max(4, Math.floor((W - 12 + PARK.gap) / (PARK.tile + PARK.gap)));
    PARK.rows = Math.ceil(E.MACHINES.length / PARK.cols);
    H = SCENE_H + PARK.top + PARK.rows * (PARK.tile + PARK.gap) + 6;
    cv.style.height = H + 'px';
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bins = [];
    for (var i = 0; i < NB; i++) bins.push(W * (i + 1) / (NB + 1));
  }
  window.addEventListener('resize', function () { if (!viewFactory.hidden) resizeCanvas(); });

  function startAnim() {
    if (animOn) return;
    animOn = true;
    lastT = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(t) {
    if (viewFactory.hidden) { animOn = false; return; }
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function step(dt) {
    var rate = Game.rate();
    var total = E.totalMachines(S.machines);
    var spawnRate = rate > 0 ? Math.min(8, 1 + 1.2 * Math.log(1 + total) / Math.LN2) : 0;
    var speed = 70 + Math.min(110, 14 * Math.log(1 + total) / Math.LN2);
    beltOffset = (beltOffset + speed * dt) % 16;

    spawnAcc += spawnRate * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      pieces.push({ x: -12, y: BELT_Y - 17, c: Math.floor(Math.random() * NB), fall: false, vy: 0 });
    }

    pieces.forEach(function (p) {
      if (!p.fall) {
        p.x += speed * dt;
        if (p.x >= bins[p.c]) { p.x = bins[p.c]; p.fall = true; arm[p.c] = 1; }
      } else {
        p.vy += 900 * dt;
        p.y += p.vy * dt;
        if (p.y >= BIN_TOP - 8) {
          p.done = true;
          pulse[p.c] = 1;
          binLevel[p.c] += 0.09;
          if (binLevel[p.c] >= 1) { binLevel[p.c] = 0; pulse[p.c] = 1.6; }   // caixa cheia: esvazia com um clarão
          floats.push({ x: p.x, y: BIN_TOP - 6, t: 0, txt: '+' + E.fmt(rate / spawnRate) });
          if (has('mestre') && Math.random() < 0.5) sparks.push({ x: p.x, y: BIN_TOP, vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 40, t: 0 });
        }
      }
    });
    pieces = pieces.filter(function (p) { return !p.done; });

    for (var i = 0; i < NB; i++) {
      pulse[i] = Math.max(0, pulse[i] - dt * 4);
      arm[i] = Math.max(0, arm[i] - dt * 3);
    }
    floats.forEach(function (f) { f.t += dt; f.y -= 34 * dt; });
    floats = floats.filter(function (f) { return f.t < 0.9; });
    sparks.forEach(function (s) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; });
    sparks = sparks.filter(function (s) { return s.t < 0.8; });

    clock += dt;
    flash = Math.max(0, flash - dt * 1.5);
    for (var bp = 0; bp < buyPulse.length; bp++) if (buyPulse[bp] > 0) buyPulse[bp] = Math.max(0, buyPulse[bp] - dt * 2.5);

    // fumaça da chaminé da cidade
    var sky = skyline().filter(function (b) { return b.slot === 4; })[0];
    if (sky && Math.random() < dt * (2.5 + ulv('mega') * 2)) puffs.push({ x: sky.x + sky.w - 6, y: WIN_Y + WIN_H - sky.h - 10, t: 0 });
    puffs.forEach(function (p) { p.t += dt; p.y -= 12 * dt; p.x += 4 * dt; });
    puffs = puffs.filter(function (p) { return p.t < 2; });
  }

  // ----- helpers de desenho -----
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function grad(x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function shape(i, cx, cy, size, color) {
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(SHAPE_PATHS[i % SHAPE_PATHS.length]);
    ctx.restore();
  }

  // ----- cidade (Mega-Fábrica) -----
  var SKY_ORDER = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
  function skyline() {
    var n = own('mega');
    if (!n) return [];
    var t = tier('mega'), count = Math.min(10, 2 + Math.floor(n / 2)), sw = W / 10, list = [];
    for (var k = 0; k < count; k++) {
      var slot = SKY_ORDER[k];
      list.push({ x: slot * sw, w: sw - 3, h: Math.min(WIN_H - 6, 18 + ((slot * 37) % 5) * 7 + t * 5 + ulv('mega') * 4), slot: slot });
    }
    return list;
  }

  function drawWindow() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, WIN_Y, W, WIN_H);
    ctx.clip();
    ctx.fillStyle = grad(0, WIN_Y, 0, WIN_Y + WIN_H, [[0, '#0e1530'], [1, '#27386b']]);
    ctx.fillRect(0, WIN_Y, W, WIN_H);
    // estrelas
    for (var i = 0; i < 16; i++) {
      var sx = (i * 97 + 13) % Math.max(60, W), sy = WIN_Y + 4 + ((i * 53) % 40);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(clock * 2 + i)) + ')';
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    var t = tier('mega'), ul = ulv('mega'), base = WIN_Y + WIN_H;
    skyline().forEach(function (b) {
      ctx.fillStyle = grad(0, base - b.h, 0, base, [[0, '#26304d'], [1, '#161c30']]);
      ctx.fillRect(b.x, base - b.h, b.w, b.h);
      if (b.slot === 4) ctx.fillRect(b.x + b.w - 9, base - b.h - 10, 5, 10);   // chaminé
      if (ul >= 2 && b.slot % 3 === 0) { ctx.fillStyle = TIER_COLORS[Math.max(1, t)]; ctx.fillRect(b.x + 2, base - b.h - 3, b.w - 4, 2); }  // luz de aviso
      ctx.fillStyle = TIER_COLORS[Math.max(1, t)];
      ctx.globalAlpha = 0.6;
      for (var wy = base - b.h + 4; wy < base - 5; wy += 8) {
        for (var wx = b.x + 3; wx < b.x + b.w - 5; wx += 7) {
          if (((wx * 7 + wy * 13 + b.slot) | 0) % 3 !== 0) ctx.fillRect(wx, wy, 3, 3);
        }
      }
      ctx.globalAlpha = 1;
    });
    puffs.forEach(function (p) {
      ctx.fillStyle = 'rgba(170,180,200,' + (0.35 * (1 - p.t / 2)) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + p.t * 4, 0, 6.2832);
      ctx.fill();
    });
    // painéis solares (Painéis Solares): nos telhados, à direita
    if (has('solar')) {
      for (var k = 0; k < 3; k++) {
        var px = W - 62 + k * 19, py = WIN_Y + 8 + k * 2;
        ctx.fillStyle = grad(px, py, px + 16, py + 10, [[0, '#2f6fd6'], [1, '#173a82']]);
        ctx.fillRect(px, py, 16, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(px + 0.5, py + 0.5, 15, 9);
        ctx.beginPath(); ctx.moveTo(px + 8, py); ctx.lineTo(px + 8, py + 10); ctx.moveTo(px, py + 5); ctx.lineTo(px + 16, py + 5); ctx.stroke();
      }
    }
    ctx.restore();
    // caixilhos da janela
    ctx.fillStyle = '#323b57';
    for (var m = 0; m <= 4; m++) ctx.fillRect(m * (W - 4) / 4, WIN_Y, 4, WIN_H);
    ctx.fillRect(0, WIN_Y - 2, W, 3);
  }

  // prateleira abaixo da janela: baterias, chip de IA e reator
  function drawShelf() {
    ctx.fillStyle = grad(0, SHELF_Y, 0, SHELF_Y + 16, [[0, '#3a4562'], [1, '#232a40']]);
    ctx.fillRect(0, SHELF_Y, W, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, SHELF_Y, W, 1);
    var bat = (has('bat1') ? 1 : 0) + (has('bat2') ? 1 : 0) + (has('bat3') ? 1 : 0);
    for (var b = 0; b < 3; b++) {
      var bx = 8 + b * 26;
      rr(bx, SHELF_Y + 3, 20, 10, 2.5);
      ctx.fillStyle = b < bat ? '#0e2a1c' : '#1a2033';
      ctx.fill();
      ctx.strokeStyle = b < bat ? '#2ecc71' : '#4b556e';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = b < bat ? '#2ecc71' : '#4b556e';
      ctx.fillRect(bx + 20, SHELF_Y + 6, 2, 4);
      if (b < bat) for (var s = 0; s < 3; s++) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(clock * 3 + s + b); ctx.fillRect(bx + 3 + s * 5.5, SHELF_Y + 5, 4, 6); }
      ctx.globalAlpha = 1;
    }
    if (has('ia')) {   // chip de IA no centro, com luzes em volta
      var cx = W / 2, cy = SHELF_Y + 8;
      ctx.fillStyle = '#12182b';
      rr(cx - 11, cy - 7, 22, 14, 3); ctx.fill();
      ctx.strokeStyle = '#b07cff'; ctx.lineWidth = 1.5; ctx.stroke();
      for (var d = 0; d < 6; d++) {
        var a = clock * 2 + d * 1.047;
        ctx.fillStyle = 'rgba(176,124,255,' + (0.4 + 0.6 * Math.abs(Math.sin(a))) + ')';
        ctx.fillRect(cx - 9 + d * 3.4, cy - 2, 2, 4);
      }
    }
    if (has('reator')) {   // reator: esfera pulsante
      var rx = W - 24, ry = SHELF_Y + 8, pr = 6 + Math.sin(clock * 4) * 1.2;
      var g = ctx.createRadialGradient(rx, ry, 1, rx, ry, 14);
      g.addColorStop(0, 'rgba(255,214,10,0.9)'); g.addColorStop(1, 'rgba(255,214,10,0)');
      ctx.fillStyle = g; ctx.fillRect(rx - 14, ry - 14, 28, 28);
      ctx.fillStyle = '#fff3a3'; ctx.beginPath(); ctx.arc(rx, ry, pr * 0.55, 0, 6.2832); ctx.fill();
    }
  }

  function drawCeiling() {
    ctx.fillStyle = grad(0, 0, 0, CEIL, [[0, '#3a4562'], [1, '#1c2236']]);
    ctx.fillRect(0, 0, W, CEIL);
    if (has('led')) {   // fita de LED colorida
      for (var x = 0; x < W; x += 6) {
        ctx.fillStyle = 'hsl(' + ((clock * 70 + x * 0.6) % 360) + ',90%,62%)';
        ctx.fillRect(x, CEIL - 3, 5, 3);
      }
    }
    var n = own('linha');
    if (n) {   // lâmpadas penduradas (Linha Automática)
      var t = tier('linha'), count = Math.min(9, 1 + Math.floor(n / 2) + t), col = TIER_COLORS[Math.max(1, t)];
      for (var i = 0; i < count; i++) {
        var lx = W * (i + 0.5) / count, r = 14 + t * 3;
        var g = ctx.createRadialGradient(lx, CEIL + 4, 1, lx, CEIL + 4, r);
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = g;
        ctx.fillRect(lx - r, CEIL - r + 4, r * 2, r * 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = col;
        ctx.fillRect(lx - 3, CEIL, 6, 4);
      }
    }
  }

  // esteiras de fundo (Linha Automática): uma, e a segunda com "Segunda Pista"
  function drawBackBelts() {
    var n = own('linha');
    if (!n) return;
    var t = tier('linha'), col = TIER_COLORS[Math.max(1, t)];
    var lanes = 1 + (has('linha1') ? 1 : 0);
    for (var l = 0; l < lanes; l++) {
      var y = SHELF_Y + 20 + l * 11;
      ctx.fillStyle = '#232a40';
      ctx.fillRect(0, y, W, 6);
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.5;
      var dir = l % 2 ? -1 : 1;
      for (var x = ((dir * clock * 24) % 12 + 12) % 12 - 12; x < W; x += 12) ctx.fillRect(x, y + 2, 5, 2);
      ctx.globalAlpha = 1;
      var cnt = Math.min(16, 3 + t * 2 + Math.floor(n / 10));
      for (var i = 0; i < cnt; i++) {
        var px = (((i * W / cnt) + dir * clock * 28) % W + W) % W;
        ctx.fillStyle = Game.COLORS[(i + l * 3) % 9];
        rr(px - 3, y - 4, 7, 7, 2); ctx.fill();
      }
    }
  }

  // esteira principal (Esteira): trilhos, rolos nas pontas, setas e brilho conforme o nível
  function drawBelt() {
    var n = own('esteira'), t = tier('esteira'), col = TIER_COLORS[t], ul = ulv('esteira');
    if (!n) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#4b556e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, BELT_Y + 0.5, W - 2, BELT_H - 1);
      ctx.setLineDash([]);
      return;
    }
    // sombra embaixo
    ctx.fillStyle = grad(0, BELT_Y + BELT_H, 0, BELT_Y + BELT_H + 12, [[0, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, BELT_Y + BELT_H, W, 12);
    if (ul >= 2) {   // brilho neon por baixo (Motor Turbo)
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.fillStyle = col;
      ctx.fillRect(4, BELT_Y + BELT_H, W - 8, 2);
      ctx.restore();
    }
    rr(0, BELT_Y, W, BELT_H, 5);
    ctx.fillStyle = grad(0, BELT_Y, 0, BELT_Y + BELT_H, [[0, '#3c4562'], [1, '#222a40']]);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.5;
    for (var x = -16 + beltOffset; x < W; x += 16) ctx.fillRect(x, BELT_Y + 2, 6, BELT_H - 4);
    ctx.globalAlpha = 1;
    if (t >= 1) { ctx.fillStyle = col; ctx.fillRect(0, BELT_Y - 2, W, 2); }
    if (ul >= 1) {   // setas de velocidade (Rolamentos Premium)
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.8;
      for (var a = -24 + (beltOffset * 2) % 48; a < W; a += 48) {
        ctx.beginPath(); ctx.moveTo(a, BELT_Y + 3); ctx.lineTo(a + 5, BELT_Y + 7); ctx.lineTo(a, BELT_Y + 11); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // rolos nas pontas
    [8, W - 8].forEach(function (cx) {
      ctx.fillStyle = '#4b556e';
      ctx.beginPath(); ctx.arc(cx, BELT_Y + BELT_H / 2, 10, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, BELT_Y + BELT_H / 2, 10, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = '#1b1f2a'; ctx.lineWidth = 2;
      for (var k = 0; k < 3; k++) {
        var an = clock * 6 + k * 2.094;
        ctx.beginPath();
        ctx.moveTo(cx, BELT_Y + BELT_H / 2);
        ctx.lineTo(cx + Math.cos(an) * 8, BELT_Y + BELT_H / 2 + Math.sin(an) * 8);
        ctx.stroke();
      }
    });
  }

  // portais com scanner (Separador Ótico)
  var GATE_POS = [0.083, 0.25, 0.417];
  function drawGates() {
    var n = own('separador');
    if (!n) return;
    var t = tier('separador'), ul = ulv('separador'), cnt = 1 + Math.min(2, t), col = t ? TIER_COLORS[t] : '#00e5ff';
    for (var k = 0; k < cnt; k++) {
      var gx = W * GATE_POS[k], top = BELT_Y - 56;
      ctx.fillStyle = '#323b57';
      ctx.fillRect(gx - 20, top, 5, BELT_Y - top);
      ctx.fillRect(gx + 15, top, 5, BELT_Y - top);
      rr(gx - 22, top - 6, 44, 9, 3);
      ctx.fillStyle = grad(0, top - 6, 0, top + 3, [[0, '#5a6688'], [1, '#323b57']]);
      ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(gx - 18, top + 2, 36, 1.5);
      // feixes de laser (mais feixes com "Laser Triplo", mais largos com "Lente de Precisão")
      var beams = ul >= 2 ? 3 : 1;
      for (var b = 0; b < beams; b++) {
        var yy = top + 6 + (Math.sin(clock * 3 + k + b * 2.1) * 0.5 + 0.5) * (BELT_Y - top - 12);
        ctx.save();
        ctx.shadowColor = col; ctx.shadowBlur = ul >= 1 ? 12 : 6;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(gx - 15, yy, 30, ul >= 1 ? 3 : 2);
        ctx.restore();
      }
      ctx.fillStyle = col; ctx.globalAlpha = 0.07;
      ctx.fillRect(gx - 15, top + 3, 30, BELT_Y - top - 3);
      ctx.globalAlpha = 1;
    }
  }

  // braços robóticos presos no teto (Braço Robótico)
  var ARM_ORDER = [2, 1, 3, 0, 4];
  function drawArm(i, bx) {
    var n = own('braco');
    var shown = n > 0 && ARM_ORDER.indexOf(i) < Math.min(NB, 1 + Math.floor(n / 4));
    if (!shown) {
      ctx.strokeStyle = '#3a4258'; ctx.lineWidth = 1;
      ctx.strokeRect(bx - 11.5, CEIL - 0.5, 23, 6);
      return;
    }
    var t = tier('braco'), ul = ulv('braco'), col = TIER_COLORS[t];
    var ext = arm[i];
    var tip = 82 + 56 * ext;   // altura da ponta da garra
    // placa de fixação
    rr(bx - 12, CEIL - 3, 24, 8, 3);
    ctx.fillStyle = '#4b556e'; ctx.fill();
    // braço de cima (fixo)
    rr(bx - 5, CEIL + 3, 10, 36, 3);
    ctx.fillStyle = grad(bx - 5, 0, bx + 5, 0, [[0, '#9aa6c4'], [1, '#56617f']]); ctx.fill();
    // junta
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, CEIL + 40, 5.5, 0, 6.2832); ctx.fill();
    if (ul >= 2) {   // Articulação Dupla: segunda junta brilhante
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(bx, CEIL + 64, 4.5, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    // braço de baixo (estica)
    rr(bx - 3, CEIL + 40, 6, Math.max(8, tip - CEIL - 40 - 8), 2);
    ctx.fillStyle = grad(bx - 3, 0, bx + 3, 0, [[0, '#c3cce6'], [1, '#6d7aa0']]); ctx.fill();
    // garra: abre quando sobe, fecha quando desce (Garras de Aço = garra grossa e dourada)
    var open = 7 - 5 * ext, gw = ul >= 1 ? 3 : 2;
    ctx.strokeStyle = ul >= 1 ? '#ffd60a' : '#dfe6fa';
    ctx.lineWidth = gw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 1, tip - 8); ctx.lineTo(bx - open, tip); ctx.moveTo(bx + 1, tip - 8); ctx.lineTo(bx + open, tip); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function drawBins() {
    var gold = has('tubos');
    for (var i = 0; i < NB; i++) {
      var bx = bins[i], s = 1 + pulse[i] * 0.1, bw = 44 * s, bh = BIN_H * s;
      var x = bx - bw / 2, y = BIN_TOP + BIN_H - bh;
      // vidro
      rr(x, y, bw, bh, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
      // conteúdo acumulado
      var lv = Math.min(1, binLevel[i]), fh = lv * (bh - 8);
      if (fh > 1) {
        rr(x + 3, y + bh - 3 - fh, bw - 6, fh, 4);
        ctx.fillStyle = Game.COLORS[i]; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      }
      if (pulse[i] > 0) { rr(x, y, bw, bh, 6); ctx.fillStyle = Game.COLORS[i]; ctx.globalAlpha = Math.min(0.5, pulse[i] * 0.4); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = gold ? '#ffd60a' : Game.COLORS[i];
      ctx.lineWidth = gold ? 3 : 2;
      if (gold) { ctx.save(); ctx.shadowColor = '#ffd60a'; ctx.shadowBlur = 6; rr(x, y, bw, bh, 6); ctx.stroke(); ctx.restore(); }
      else { rr(x, y, bw, bh, 6); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 6, y + 6, 3, bh * 0.5);   // reflexo
      if (S.settings.symbols) shape(i, bx, y + bh - 16, 18, 'rgba(255,255,255,0.8)');
    }
  }

  function drawFloor() {
    ctx.fillStyle = grad(0, FLOOR_Y, 0, SCENE_H, [[0, '#2a3250'], [1, '#161b2c']]);
    ctx.fillRect(0, FLOOR_Y, W, SCENE_H - FLOOR_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, FLOOR_Y, W, 1.5);
    // troféus do puzzle: uma estrela dourada por melhoria de puzzle instalada
    var stars = (has('tubos') ? 1 : 0) + (has('mestre') ? 1 : 0) + (has('bonus1') ? 1 : 0) + (has('bonus2') ? 1 : 0);
    for (var s = 0; s < 4; s++) shape(4, W - 14 - s * 17, FLOOR_Y + 10, 13, s < stars ? '#ffd60a' : '#323b57');
  }

  // Linha de máquinas: um espaço para cada uma das 20. Comprada = acesa, com a quantidade; falta comprar = apagada.
  function drawPark() {
    var n = E.MACHINES.length, owned = 0;
    ctx.fillStyle = grad(0, SCENE_H, 0, H, [[0, '#161b2c'], [1, '#0f1320']]);
    ctx.fillRect(0, SCENE_H, W, H - SCENE_H);
    E.MACHINES.forEach(function (m) { if (own(m.id) > 0) owned++; });
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9aa3b8';
    ctx.fillText(I18n.t('LINHA DE MÁQUINAS'), 10, SCENE_H + 13);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd60a';
    ctx.fillText(owned + ' / ' + n, W - 10, SCENE_H + 13);
    ctx.textBaseline = 'alphabetic';

    var rowW = PARK.cols * (PARK.tile + PARK.gap) - PARK.gap, x0 = (W - rowW) / 2;
    E.MACHINES.forEach(function (m, i) {
      var cnt = own(m.id), on = cnt > 0, t = tier(m.id), color = machineColor(i);
      var col = i % PARK.cols, row = Math.floor(i / PARK.cols);
      var sc = 1 + (buyPulse[i] || 0) * 0.25;
      var size = PARK.tile * sc;
      var cx = x0 + col * (PARK.tile + PARK.gap) + PARK.tile / 2;
      var cy = SCENE_H + PARK.top + row * (PARK.tile + PARK.gap) + PARK.tile / 2;
      var bob = on ? Math.sin(clock * 3 + i) * 1.4 : 0;
      if (on && t > 0) { ctx.save(); ctx.shadowColor = TIER_COLORS[t]; ctx.shadowBlur = 8 + t * 2; }
      rr(cx - size / 2, cy - size / 2, size, size, 9);
      ctx.fillStyle = on ? grad(0, cy - size / 2, 0, cy + size / 2, [[0, '#2f3957'], [1, '#1c2338']]) : '#141929';
      ctx.fill();
      ctx.strokeStyle = on ? (t > 0 ? TIER_COLORS[t] : color) : '#2a3148';
      ctx.lineWidth = on ? 2 : 1.2;
      ctx.stroke();
      if (on && t > 0) ctx.restore();
      var img = Icons.image(m.icon, on ? color : '#3a4258');
      if (img.complete && img.naturalWidth) {
        ctx.globalAlpha = on ? 1 : 0.8;
        ctx.drawImage(img, cx - 10 * sc, cy - 10 * sc + bob, 20 * sc, 20 * sc);
        ctx.globalAlpha = 1;
      }
      if (on) {   // quantidade
        var label = String(cnt);
        ctx.font = 'bold 9px system-ui, sans-serif';
        var tw = ctx.measureText(label).width + 6;
        rr(cx + size / 2 - tw + 2, cy + size / 2 - 7, tw, 12, 6);
        ctx.fillStyle = '#0f1320'; ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx + size / 2 - tw / 2 + 2, cy + size / 2 + 2);
      }
    });
    ctx.textAlign = 'start';
  }

  function drawPieces() {
    pieces.forEach(function (p) {
      rr(p.x - 8, p.y, 16, 16, 4);
      ctx.fillStyle = Game.COLORS[p.c]; ctx.fill();
      ctx.fillStyle = grad(0, p.y, 0, p.y + 16, [[0, 'rgba(255,255,255,0.4)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.25)']]);
      rr(p.x - 8, p.y, 16, 16, 4); ctx.fill();
      if (S.settings.symbols) shape(p.c, p.x, p.y + 8, 10, 'rgba(0,0,0,0.55)');
    });
    sparks.forEach(function (s) {
      ctx.globalAlpha = 1 - s.t / 0.8;
      shape(4, s.x, s.y, 8, '#ffd60a');
    });
    ctx.globalAlpha = 1;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    floats.forEach(function (f) {
      ctx.globalAlpha = 1 - f.t / 0.9;
      ctx.fillStyle = '#ffd60a';
      ctx.fillText(f.txt, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = grad(0, 0, 0, SCENE_H, [[0, '#1a2038'], [1, '#121726']]);
    ctx.fillRect(0, 0, W, SCENE_H);
    drawWindow();
    drawShelf();
    drawBackBelts();
    drawCeiling();
    drawBelt();
    drawGates();
    for (var i = 0; i < NB; i++) drawArm(i, bins[i]);
    drawBins();
    drawFloor();
    drawPieces();
    drawPark();

    // boost de produção ativo: brilho dourado nas bordas
    if (Game.rate() > Game.baseRate() * 1.0001) {
      var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(255,214,10,0)');
      g.addColorStop(1, 'rgba(255,214,10,' + (0.22 + 0.08 * Math.sin(clock * 5)) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (flash > 0) {   // clarão quando algo é instalado ou sobe de nível
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = flash * 0.35;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (Game.rate() <= 0) {
      ctx.fillStyle = 'rgba(10,12,20,0.55)';
      ctx.fillRect(0, BELT_Y - 40, W, 100);
      ctx.fillStyle = '#dfe6fa';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(I18n.t('Compre uma Esteira para ligar a fábrica'), W / 2, BELT_Y + 14);
    }
  }

  // ---------- Ganho offline ----------
  function showOffline() {
    var o = Game.offline;
    if (!o) return;
    var capped = o.away > o.counted ? ' (contamos no máximo ' + E.fmtTime(o.cap) + ')' : '';
    $('offline-text').innerHTML =
      'Você ficou fora por ' + E.fmtTime(o.away) + capped + '. A fábrica produziu ' + Icons.svg('coin') + ' ' + E.fmt(o.coins) + '!' +
      (o.boosted ? ' Seus boosts ativos também contaram.' : '');
    var ready = E.BOOSTS.filter(function (b) { return E.boostUnlocked(b, S.machines, S.level) && E.boostStatus(S.boosts[b.id], Date.now()).state === 'ready'; });
    $('offline-boosts').innerHTML = ready.length
      ? Icons.svg('bolt') + ' ' + ready.length + (ready.length === 1 ? ' boost pronto' : ' boosts prontos') + ' para ativar!'
      : '';
    var dbl = $('offline-double');
    dbl.hidden = !Ads.available();
    dbl.disabled = false;
    dbl.onclick = function () {
      dbl.disabled = true;
      Ads.rewarded(function (ok, why) {
        if (!ok) { dbl.disabled = false; Sfx.error(); Toast.show(Icons.svg('lock') + ' ' + Ads.reasonText(why)); return; }
        Game.addCoins(o.coins);
        Sfx.tier();
        dbl.hidden = true;
        $('offline-text').innerHTML += ' ' + Icons.svg('check') + ' Dobrado! +' + Icons.svg('coin') + ' ' + E.fmt(o.coins);
      });
    };
    $('offline').hidden = false;
    Game.offline = null;
  }
  $('offline-ok').addEventListener('click', function () { $('offline').hidden = true; });

  buildMachines();
  buildUpgrades();
  buildInventory();
  Game.listeners.push(update);
  updateDot();
  showOffline();
})();
