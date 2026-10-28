// Anuncios: com recompensa (o jogador escolhe assistir) e entre niveis. Usa Platform (SDK do portal).
// Em localhost existe um anuncio de TESTE (3 segundos) so para o desenvolvedor ver o fluxo; em site publicado
// sem SDK de anuncios, os botoes de anuncio nem aparecem.
var Ads = (function () {
  var levelsSince = 0;

  function simulated() { return !Platform.hasAds() && /^(localhost|127\.0\.0\.1)$/.test(location.hostname); }
  function available() { return Platform.hasAds() || simulated(); }

  // Texto para o jogador quando o anuncio nao rolou.
  function reasonText(code) {
    if (code === 'adblock') return 'Desative o bloqueador de anúncios para receber a recompensa.';
    if (code === 'adCooldown') return 'Espere um pouco antes do próximo anúncio.';
    if (code === 'unfilled') return 'Sem anúncio disponível agora. Tente de novo daqui a pouco.';
    if (code === 'adsDisabled' || code === 'unavailable') return 'Anúncios indisponíveis.';
    return 'Não foi possível mostrar o anúncio.';
  }

  // Anuncio de teste (so em localhost).
  function fake(cb) {
    var box = document.createElement('div');
    box.className = 'overlay adsim';
    box.innerHTML = '<div class="card"><h2>Anúncio de teste</h2><p>Simulando um anúncio... <b>3</b></p></div>';
    document.body.appendChild(box);
    Sfx.setMuted(true);
    var n = 3, tick = setInterval(function () {
      n--;
      box.querySelector('b').textContent = n;
      if (n <= 0) {
        clearInterval(tick);
        box.remove();
        Sfx.setMuted(false);
        cb(true);
      }
    }, 1000);
  }

  // Anuncio com recompensa. cb(ok, motivo). Quem chama so entrega o premio se ok for true.
  function rewarded(cb) {
    if (!available()) { cb(false, 'unavailable'); return; }
    var done = function (ok, why) {
      if (ok) Game.track('ads', 1);
      cb(ok, why);
    };
    if (Platform.hasAds()) Platform.ad('rewarded', done); else fake(done);
  }

  // Anuncio entre niveis (so em plataforma com anuncios reais): a cada 3 niveis, quando o jogador clica em
  // "Proximo nivel". O SDK ainda controla o intervalo minimo (cooldown). Chama done() de qualquer jeito.
  function afterLevel(done) {
    levelsSince++;
    if (levelsSince >= 3 && Platform.hasAds()) {
      levelsSince = 0;
      Platform.ad('midgame', function () { done(); });
    } else {
      done();
    }
  }

  return { available: available, rewarded: rewarded, afterLevel: afterLevel, reasonText: reasonText, isSimulated: simulated };
})();
