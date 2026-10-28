// Carrega o jogo na ordem certa, DEPOIS de ligar o SDK do portal. Assim o progresso salvo (modulo de dados do
// CrazyGames) ja esta disponivel quando o jogo le o estado. Sem SDK, comeca na hora.
(function () {
  var SCRIPTS = [
    'js/icons.js', 'js/puzzle.js', 'js/economy.js', 'js/save.js', 'js/state.js', 'js/i18n.js', 'js/audio.js',
    'js/ads.js', 'js/payments.js', 'js/tabs.js', 'js/boosts.js', 'js/game.js', 'js/factory.js',
    'js/achievements.js', 'js/missions.js', 'js/premium.js', 'js/boot.js'
  ];
  var started = false;

  function load(i) {
    if (i >= SCRIPTS.length) return;
    var s = document.createElement('script');
    s.src = SCRIPTS[i];
    s.async = false;
    s.onload = function () { load(i + 1); };
    s.onerror = function () { console.error('Nao foi possivel carregar ' + SCRIPTS[i]); load(i + 1); };
    document.body.appendChild(s);
  }

  function start(ok) {
    if (started) return;
    started = true;
    load(0);
    if (ok) Platform.gameplay(true);
  }

  Platform.init(start);
  setTimeout(function () { start(false); }, 6000);   // se o SDK demorar demais, o jogo abre mesmo assim
})();
