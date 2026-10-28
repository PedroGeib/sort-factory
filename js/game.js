// Tela e controles do puzzle. Usa Puzzle (lógica), Game (estado compartilhado) e Sfx (sons).
(function () {
  var FLIGHT_MS = 340;     // tempo de voo de cada peça entre tubos
  var STAGGER_MS = 70;     // atraso entre uma peça e a seguinte
  var fmt = Economy.fmt;
  var S = Game.state;
  // moedas por tubo completo: base x melhorias de puzzle x boost 'Chuva de Moedas'
  function tubeCoins() { return Math.max(1, Math.round(Economy.TUBE_COINS * Game.puzzleMult())); }
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var puzzle = {
    start: null,      // layout inicial do nível (para Reiniciar)
    tubes: null,
    selected: null,
    history: [],
    paid: {},         // cores já pagas neste nível (evita ganhar moedas desfazendo e refazendo)
    moves: 0,
    lastDone: -1,     // tubo que acabou de ficar completo (celebração)
    shake: -1,        // tubo que recusou o movimento
    pending: null,    // { to, count, until }: peças ainda voando para o tubo "to"
    enter: false,     // true = tubos entram animados no próximo desenho
    busy: false,      // trava cliques enquanto a última peça voa (só na jogada da vitória)
    kbd: null,        // tubo em foco quando o jogador usa o teclado (para devolver o foco após redesenhar)
    token: 0          // muda quando o nível reinicia/desfaz, para ignorar animações antigas
  };
  var ghosts = [];    // peças voadoras na tela

  var $ = function (id) { return document.getElementById(id); };
  var board = $('board');
  var hand = $('hand');

  function startLevel() {
    puzzle.start = Puzzle.newLevel(S.level);
    resetToStart();
  }

  function clearFlight() {
    ghosts.forEach(function (g) { g.remove(); });
    ghosts = [];
    puzzle.pending = null;
    puzzle.busy = false;
    puzzle.token++;
  }

  function resetToStart() {
    clearFlight();
    puzzle.tubes = Puzzle.clone(puzzle.start);
    puzzle.selected = null;
    puzzle.history = [];
    puzzle.paid = {};
    puzzle.moves = 0;
    puzzle.lastDone = -1;
    puzzle.shake = -1;
    puzzle.enter = true;
    $('win').hidden = true;
    renderBoard();
    renderHeader();
  }

  // Cabeçalho: nível, moedas e produção por segundo.
  function renderHeader() {
    $('level').textContent = S.level;
    $('coins').textContent = fmt(Math.floor(S.coins));
    $('gems').textContent = fmt(S.gems);
    var r = Game.rate();
    $('rate').textContent = r > 0 ? '+' + fmt(r) + '/s' : '';
    $('rate').classList.toggle('boosted', r > Game.baseRate() * 1.0001);
  }

  function bumpCoins() {
    var el = $('coins');
    el.classList.remove('bump');
    void el.offsetWidth;   // reinicia a animação
    el.classList.add('bump');
  }

  function renderBoard() {
    $('undo').disabled = puzzle.history.length === 0;

    var tubes = puzzle.tubes, sel = puzzle.selected;
    var run = sel !== null ? Puzzle.topRun(tubes[sel]) : 0;
    var pend = puzzle.pending && Date.now() < puzzle.pending.until ? puzzle.pending : null;

    board.innerHTML = '';
    tubes.forEach(function (tube, i) {
      var el = document.createElement('div');
      var landing = pend && pend.to === i;
      var done = Puzzle.isDone(tube) && !landing;
      var accepts = sel !== null && i !== sel && Puzzle.canPour(tubes, sel, i);

      var cls = ['tube'];
      if (i === sel) cls.push('selected');
      if (done) cls.push('done');
      if (done && i === puzzle.lastDone) cls.push('just-done');
      if (i === puzzle.shake) cls.push('shake');
      if (sel !== null && i !== sel) cls.push(accepts ? 'target' : 'dim');
      if (puzzle.enter) { cls.push('enter'); el.style.animationDelay = (i * 70) + 'ms'; }
      el.className = cls.join(' ');
      el.style.setProperty('--c', Game.COLORS[tube[0]] || 'transparent');

      tube.forEach(function (c, k) {
        var seg = document.createElement('div');
        seg.className = 'seg';
        seg.style.backgroundColor = Game.COLORS[c];
        seg.innerHTML = Icons.shape(c);
        if (i === sel && k >= tube.length - run) seg.className += ' hot';
        if (landing && k >= tube.length - pend.count) seg.className += ' pending';
        if (puzzle.enter) {
          seg.className += ' fill';
          seg.style.animationDelay = (i * 70 + 250 + k * 60) + 'ms';
        }
        el.appendChild(seg);
      });

      if (accepts) {
        var arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.innerHTML = Icons.svg('chevron');
        el.appendChild(arrow);
      }
      if (done && i === puzzle.lastDone) {
        var pop = document.createElement('span');
        pop.className = 'pop';
        pop.textContent = '+' + tubeCoins();
        el.appendChild(pop);
      }
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Tubo ' + (i + 1) + ': ' + (tube.length ? tube.length + ' peças' : 'vazio') +
        (i === sel ? ', escolhido' : accepts ? ', aceita a jogada' : ''));
      el.addEventListener('click', function () { puzzle.kbd = null; onTube(i); });
      el.addEventListener('keydown', function (e) { onKey(e, i); });
      board.appendChild(el);
    });
    puzzle.enter = false;
    if (puzzle.kbd !== null && board.children[puzzle.kbd]) board.children[puzzle.kbd].focus({ preventScroll: true });

    // sem jogadas úteis: chama atenção para Desfazer/Reiniciar
    var stuck = !Puzzle.isWon(tubes) && !Puzzle.hasMoves(tubes);
    $('undo').classList.toggle('attn', stuck && puzzle.history.length > 0);
    $('restart').classList.toggle('attn', stuck);

    syncDemo();
  }

  // Teclado: setas trocam de tubo, Enter ou espaço escolhem/despejam.
  function onKey(e, i) {
    var n = puzzle.tubes.length;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      puzzle.kbd = i;
      onTube(i);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      puzzle.kbd = (i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
      board.children[puzzle.kbd].focus();
    }
  }

  function onTube(i) {
    if (puzzle.busy) return;
    var tubes = puzzle.tubes, sel = puzzle.selected;
    puzzle.lastDone = -1;
    puzzle.shake = -1;

    if (sel === null) {
      if (tubes[i].length && !Puzzle.isDone(tubes[i])) { puzzle.selected = i; Sfx.select(); }
    } else if (sel === i) {
      puzzle.selected = null;
      Sfx.select();
    } else if (Puzzle.canPour(tubes, sel, i)) {
      return pourMove(sel, i);
    } else if (Puzzle.isDone(tubes[i])) {
      puzzle.shake = i;     // tubo completo não aceita mais nada
      Sfx.error();
    } else {
      puzzle.selected = i;  // tubo com outra cor no topo: troca a seleção
      Sfx.select();
    }
    renderBoard();
  }

  // Despeja de "from" em "to": o estado muda na hora, e as peças voam até o tubo de destino.
  function pourMove(from, to) {
    var tubes = puzzle.tubes;
    var n = Math.min(Puzzle.topRun(tubes[from]), Puzzle.CAP - tubes[to].length);
    var starts = reduceMotion ? null : captureStarts(from, n);

    puzzle.history.push(Puzzle.clone(tubes));
    Puzzle.pour(tubes, from, to);
    puzzle.moves++;
    puzzle.selected = null;
    Sfx.pour();

    var completes = payTube(to);
    var won = Puzzle.isWon(tubes);
    var dur = starts ? FLIGHT_MS + (n - 1) * STAGGER_MS + 30 : 0;
    var token = puzzle.token;

    if (dur) puzzle.pending = { to: to, count: n, until: Date.now() + dur };
    renderBoard();
    if (dur) fly(starts, to, n);

    function landed() {
      if (token !== puzzle.token) return;   // nível reiniciado ou jogada desfeita no meio do voo
      puzzle.pending = null;
      puzzle.busy = false;
      if (completes && Puzzle.isDone(puzzle.tubes[to])) {
        puzzle.lastDone = to;
        Sfx.done();
        hideHint();
      }
      renderBoard();
      if (dur) {   // o redesenho apagou a quicada do pouso: refaz nas peças que acabaram de chegar
        var arrived = board.children[to].querySelectorAll('.seg');
        for (var q = Math.max(0, arrived.length - n); q < arrived.length; q++) arrived[q].classList.add('land');
      }
      if (completes) sparkle(to);
      if (won && Puzzle.isWon(puzzle.tubes)) win();
    }
    if (dur) {
      puzzle.busy = won;
      setTimeout(landed, dur);
    } else {
      landed();
    }
  }

  // Posição na tela das peças que vão sair (a do topo primeiro).
  function captureStarts(from, n) {
    var segs = board.children[from].querySelectorAll('.seg');
    if (segs.length < n) return null;
    var list = [];
    for (var k = 0; k < n; k++) {
      var r = segs[segs.length - 1 - k].getBoundingClientRect();
      list.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    return list;
  }

  // Peças voam em arco do tubo de origem até o lugar delas no tubo de destino.
  function fly(starts, to, n) {
    var targets = board.children[to].querySelectorAll('.seg.pending');
    var tube = puzzle.tubes[to];
    var colorIdx = tube[tube.length - 1], color = Game.COLORS[colorIdx];
    starts.forEach(function (s, j) {
      var seg = targets[j];
      if (!seg) return;
      var t = seg.getBoundingClientRect();
      var g = document.createElement('div');
      g.className = 'seg ghost';
      g.style.cssText = 'left:' + s.x + 'px;top:' + s.y + 'px;width:' + s.w + 'px;height:' + s.h + 'px;background-color:' + color;
      g.innerHTML = Icons.shape(colorIdx);
      document.body.appendChild(g);
      ghosts.push(g);
      var dx = t.left - s.x, dy = t.top - s.y;
      var anim = g.animate([
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(' + dx / 2 + 'px,' + (dy / 2 - 56) + 'px) scale(1.18)', offset: 0.5 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)' }
      ], { duration: FLIGHT_MS, delay: j * STAGGER_MS, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'both' });
      anim.onfinish = function () {
        g.remove();
        if (seg.isConnected) { seg.classList.remove('pending'); seg.classList.add('land'); }
      };
    });
  }

  // Faíscas saindo do tubo recém-completo.
  function sparkle(i) {
    var el = board.children[i];
    if (!el || reduceMotion) return;
    var color = Game.COLORS[puzzle.tubes[i][0]];
    for (var k = 0; k < 12; k++) {
      var sp = document.createElement('span');
      sp.className = 'spark';
      sp.style.backgroundColor = color;
      el.appendChild(sp);
      var ang = Math.random() * 6.2832, dist = 36 + Math.random() * 40;
      var a = sp.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + Math.sin(ang) * dist + 'px) scale(0)', opacity: 0 }
      ], { duration: 550 + Math.random() * 350, easing: 'ease-out' });
      a.onfinish = (function (node) { return function () { node.remove(); }; })(sp);
    }
  }

  // Paga as moedas de um tubo recém-completo. Devolve true se pagou agora.
  function payTube(i) {
    var tube = puzzle.tubes[i];
    if (Puzzle.isDone(tube) && !puzzle.paid[tube[0]]) {
      puzzle.paid[tube[0]] = true;
      S.stats.tubes++;
      Game.track('tubes', 1);
      Game.addCoins(tubeCoins());
      bumpCoins();
      return true;
    }
    return false;
  }

  function win() {
    var bonus = Math.round((10 + S.level * 2) * Game.puzzleMult());
    var done = S.level;
    var pct = Math.round(Economy.mods(S.upgrades).levelBonus * 100);
    // Mostra a vitória ANTES de mexer no estado: assim os avisos que reagem ao nível novo (como a dica
    // dos boosts) já sabem que a tela de vitória está aberta e esperam.
    $('win-title').textContent = 'Nível ' + done + ' completo!';
    $('win-moves').textContent = puzzle.moves + ' movimentos';
    $('win-text').textContent = '+' + bonus + ' moedas de bônus · produção da fábrica +' + pct + '%';
    $('win').hidden = false;
    S.level += 1;
    Game.track('levels', 1);
    Game.addCoins(bonus);
    bumpCoins();
    Game.save();
    renderBoard();
    Sfx.win();
    confetti();
  }

  function confetti() {
    var box = $('confetti');
    for (var i = 0; i < 40; i++) {
      var d = document.createElement('div');
      d.className = 'confetti';
      d.style.left = Math.random() * 100 + 'vw';
      d.style.background = Game.COLORS[Math.floor(Math.random() * Game.COLORS.length)];
      d.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      d.style.animationDuration = (1.4 + Math.random() * 1.2) + 's';
      d.style.animationDelay = (Math.random() * 0.3) + 's';
      box.appendChild(d);
    }
    setTimeout(function () { box.innerHTML = ''; }, 3200);
  }

  function undo() {
    if (!puzzle.history.length || puzzle.busy) return;
    clearFlight();
    puzzle.tubes = puzzle.history.pop();
    puzzle.selected = null;
    puzzle.lastDone = -1;
    puzzle.moves = Math.max(0, puzzle.moves - 1);
    Sfx.click();
    renderBoard();
  }

  // ---------- Mãozinha do tutorial: mostra o primeiro movimento ----------
  var demoAnim = null;

  function stopDemo() {
    if (demoAnim) { demoAnim.cancel(); demoAnim = null; }
    hand.hidden = true;
  }

  function syncDemo() {
    if (S.settings.seen.puzzle || reduceMotion || $('view-puzzle').hidden || !$('win').hidden) return stopDemo();
    startDemo();
  }

  function pickDemoMove() {
    var tubes = puzzle.tubes, sel = puzzle.selected, pass, i, j;
    for (pass = 0; pass < 2; pass++) {
      for (i = 0; i < tubes.length; i++) {
        if (sel !== null && i !== sel) continue;
        if (!tubes[i].length || Puzzle.isDone(tubes[i])) continue;
        for (j = 0; j < tubes.length; j++) {
          if (!Puzzle.canPour(tubes, i, j)) continue;
          if (pass === 0 && !tubes[j].length) continue;   // 1ª passada: prefere juntar cores iguais
          return [i, j];
        }
      }
    }
    return null;
  }

  function startDemo() {
    stopDemo();
    var move = pickDemoMove();
    if (!move) return;
    var ra = board.children[move[0]].getBoundingClientRect();
    var rb = board.children[move[1]].getBoundingClientRect();
    var A = { x: ra.left + ra.width / 2 - 10, y: ra.top + ra.height * 0.35 };
    var B = { x: rb.left + rb.width / 2 - 10, y: rb.top + ra.height * 0.35 };
    var at = function (p, s, o) { return { transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + s + ')', opacity: o }; };
    var frames = S && puzzle.selected !== null
      ? [at(B, 1, 0), at(B, 1, 1), at(B, 0.8, 1), at(B, 1, 1), at(B, 1, 1), at(B, 1, 0)]       // já escolheu: só mostra onde tocar
      : [at(A, 1, 0), at(A, 1, 1), at(A, 0.8, 1), at(A, 1, 1), at(B, 1, 1), at(B, 0.8, 1), at(B, 1, 1), at(B, 1, 0)];
    hand.hidden = false;
    demoAnim = hand.animate(frames, { duration: 3000, iterations: Infinity, easing: 'ease-in-out' });
  }

  window.addEventListener('puzzle-shown', function () { renderBoard(); });
  window.addEventListener('puzzle-hidden', stopDemo);
  window.addEventListener('resize', syncDemo);

  // ---------- Dica do tutorial ----------
  function showHint() { $('hint-puzzle').hidden = S.settings.seen.puzzle; }
  function hideHint() { $('hint-puzzle').hidden = true; Game.markSeen('puzzle'); stopDemo(); }
  $('hint-puzzle').querySelector('.hint-ok').addEventListener('click', hideHint);

  // ---------- Configurações (som e símbolos) ----------
  function applySettings() {
    document.body.classList.toggle('symbols', S.settings.symbols);
    $('btn-sound').innerHTML = Icons.svg(S.settings.sound ? 'volume' : 'mute');
    $('btn-sound').classList.toggle('off', !S.settings.sound);
    $('btn-symbols').classList.toggle('on', S.settings.symbols);
    $('btn-symbols').setAttribute('aria-pressed', S.settings.symbols);
    $('btn-sound').setAttribute('aria-pressed', S.settings.sound);
  }
  $('btn-sound').addEventListener('click', function () {
    S.settings.sound = !S.settings.sound;
    applySettings();
    Game.save();
    Sfx.click();
  });
  $('btn-symbols').addEventListener('click', function () {
    S.settings.symbols = !S.settings.symbols;
    applySettings();
    Game.save();
    Sfx.click();
  });

  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', function () { Sfx.click(); resetToStart(); });
  $('next').addEventListener('click', function () { Sfx.click(); Ads.afterLevel(startLevel); });
  $('to-factory').addEventListener('click', function () {
    startLevel();
    $('tab-factory').click();
  });

  Icons.fill(document);
  Game.listeners.push(renderHeader);
  applySettings();
  showHint();
  startLevel();
})();
