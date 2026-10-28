// Lógica pura do puzzle de separar cores (sem tela). Tubos são listas: índice 0 = fundo, último = topo.
(function (root) {
  var CAP = 4;
  var MAX_COLORS = 9;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function isDone(tube) {
    if (tube.length !== CAP) return false;
    for (var i = 1; i < CAP; i++) if (tube[i] !== tube[0]) return false;
    return true;
  }

  function isWon(tubes) {
    return tubes.every(function (t) { return t.length === 0 || isDone(t); });
  }

  function colorsForLevel(n) {
    return Math.min(3 + Math.floor((n - 1) / 2), MAX_COLORS);
  }

  // Sorteia as peças; refaz se algum tubo já nascer completo.
  function newLevel(n) {
    var colors = colorsForLevel(n);
    var tubes;
    do {
      var pool = [];
      for (var c = 0; c < colors; c++) for (var k = 0; k < CAP; k++) pool.push(c);
      shuffle(pool);
      tubes = [];
      for (var t = 0; t < colors; t++) tubes.push(pool.slice(t * CAP, (t + 1) * CAP));
    } while (tubes.some(isDone));
    tubes.push([], []);
    return tubes;
  }

  // Quantas peças iguais seguidas há no topo do tubo.
  function topRun(tube) {
    if (!tube.length) return 0;
    var c = tube[tube.length - 1], n = 0;
    for (var i = tube.length - 1; i >= 0 && tube[i] === c; i--) n++;
    return n;
  }

  function canPour(tubes, from, to) {
    if (from === to) return false;
    var a = tubes[from], b = tubes[to];
    if (!a.length || b.length >= CAP) return false;
    return b.length === 0 || b[b.length - 1] === a[a.length - 1];
  }

  // Despeja e devolve quantas peças foram movidas (0 se o movimento é inválido).
  function pour(tubes, from, to) {
    if (!canPour(tubes, from, to)) return 0;
    var a = tubes[from], b = tubes[to];
    var n = Math.min(topRun(a), CAP - b.length);
    for (var i = 0; i < n; i++) b.push(a.pop());
    return n;
  }

  // Há alguma jogada que ajuda? (despejar um tubo de cor única num tubo vazio não conta)
  function hasMoves(tubes) {
    for (var i = 0; i < tubes.length; i++) {
      for (var j = 0; j < tubes.length; j++) {
        if (!canPour(tubes, i, j)) continue;
        var pointless = tubes[j].length === 0 && topRun(tubes[i]) === tubes[i].length;
        if (!pointless) return true;
      }
    }
    return false;
  }

  function clone(tubes) {
    return tubes.map(function (t) { return t.slice(); });
  }

  var api = {
    CAP: CAP, MAX_COLORS: MAX_COLORS,
    newLevel: newLevel, colorsForLevel: colorsForLevel,
    isDone: isDone, isWon: isWon, canPour: canPour, pour: pour, clone: clone,
    topRun: topRun, hasMoves: hasMoves
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzle = api;
})(this);
