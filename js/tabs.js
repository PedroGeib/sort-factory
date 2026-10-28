// Controle das abas do jogo: Puzzle, Fábrica, Conquistas e Premium.
var Tabs = (function () {
  var names = ['puzzle', 'factory', 'ach', 'premium'];
  var handlers = {};
  var current = 'puzzle';

  // Registra uma função para quando uma aba abrir ('*' = qualquer aba).
  function on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); }

  function show(name) {
    current = name;
    names.forEach(function (n) {
      var view = document.getElementById('view-' + n), tab = document.getElementById('tab-' + n);
      if (view) view.hidden = n !== name;
      if (tab) tab.classList.toggle('active', n === name);
    });
    window.dispatchEvent(new Event(name === 'puzzle' ? 'puzzle-shown' : 'puzzle-hidden'));
    (handlers[name] || []).concat(handlers['*'] || []).forEach(function (fn) { fn(name); });
  }

  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { Sfx.click(); show(b.getAttribute('data-tab')); });
  });

  return { show: show, on: on, current: function () { return current; } };
})();
