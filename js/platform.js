// Camada de plataforma: conversa com o SDK do portal onde o jogo for publicado (anuncios e eventos de jogo).
// A plataforma e escolhida ao gerar o pacote (node build.js): window.GAME_PLATFORM vale
// 'crazygames', 'poki' ou 'web' (itch.io / site proprio, sem SDK).
//
// Baseado nas documentacoes oficiais:
//  - CrazyGames SDK v3: SDK.init(), SDK.game.gameplayStart/Stop(), SDK.ad.requestAd('rewarded' ou 'midgame', {adStarted, adFinished, adError})
//    https://docs.crazygames.com/sdk/video-ads
//  - Poki SDK: init(), gameLoadingFinished(), gameplayStart/Stop(), commercialBreak(), rewardedBreak() (promessas)
//    https://sdk.poki.com/html5
// O adaptador do CrazyGames segue a documentacao, mas so foi testado com um SDK de mentira; o do Poki nao foi
// testado. Teste os dois no ambiente de QA do portal antes de enviar.
var Platform = (function () {
  var ready = false, playing = false;
  var muteAudio = false;   // o portal pediu silencio (sobrepoe o botao de som do jogo)

  function name() { return window.GAME_PLATFORM || 'web'; }
  function cg() { return window.CrazyGames && window.CrazyGames.SDK; }
  function poki() { return window.PokiSDK; }

  // Le as configuracoes do portal (silenciar o audio) e acompanha mudancas.
  function watchSettings() {
    try {
      var g = cg().game;
      muteAudio = !!(g.settings && g.settings.muteAudio);
      if (g.addSettingsChangeListener) g.addSettingsChangeListener(function (s) { muteAudio = !!(s && s.muteAudio); });
    } catch (e) {}
  }

  // Liga o SDK. done(true) se a plataforma esta pronta; done(false) se nao ha SDK (o jogo roda normalmente).
  function init(done) {
    done = done || function () {};
    var n = name();
    if (n === 'crazygames' && cg()) {
      Promise.resolve().then(function () { return cg().init(); })
        .then(function () { ready = true; watchSettings(); done(true); }, function () { ready = false; done(false); });
    } else if (n === 'poki' && poki()) {
      poki().init().then(function () { ready = true; poki().gameLoadingFinished(); done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  }

  // Ha anuncios reais nesta plataforma?
  function hasAds() {
    var n = name();
    return ready && ((n === 'crazygames' && !!cg()) || (n === 'poki' && !!poki()));
  }

  // Modulo de dados do CrazyGames (igual ao localStorage). Guarda o progresso na conta do jogador, e o proprio SDK
  // usa o armazenamento local para quem nao esta logado. Fora do CrazyGames, estas funcoes nao fazem nada.
  function usesData() { return ready && name() === 'crazygames' && !!cg() && !!cg().data; }
  function dataGet(key) { if (!usesData()) return null; try { return cg().data.getItem(key); } catch (e) { return null; } }
  function dataSet(key, value) { if (!usesData()) return false; try { cg().data.setItem(key, value); return true; } catch (e) { return false; } }

  // Idioma do jogador segundo o portal (SDK system info). Vazio se nao houver SDK ou se o dado nao existir.
  function locale() {
    try { var l = cg() && cg().user && cg().user.systemInfo && cg().user.systemInfo.locale; return typeof l === 'string' ? l : ''; } catch (e) { return ''; }
  }

  // Avisa o portal que o jogador esta (ou nao) jogando. O CrazyGames exige o evento gameplayStart.
  function gameplay(on) {
    if (!ready || playing === on) return;
    playing = on;
    try {
      var n = name();
      if (n === 'crazygames') { if (on) cg().game.gameplayStart(); else cg().game.gameplayStop(); }
      else if (n === 'poki') { if (on) poki().gameplayStart(); else poki().gameplayStop(); }
    } catch (e) {}
  }

  // Pede um anuncio. type = 'rewarded' ou 'midgame'. cb(ok, motivo): ok so e true se o anuncio terminou.
  // O som e cortado quando o anuncio comeca e volta quando termina ou falha (exigencia do CrazyGames).
  function ad(type, cb) {
    var n = name(), finished = false;
    function end(ok, why) {
      if (finished) return;
      finished = true;
      Sfx.setMuted(false);
      cb(ok, why);
    }
    if (n === 'crazygames' && cg()) {
      cg().ad.requestAd(type, {
        adStarted: function () { Sfx.setMuted(true); },
        adFinished: function () { end(true); },
        adError: function (e) { end(false, e && e.code ? e.code : 'other'); }
      });
    } else if (n === 'poki' && poki()) {
      Sfx.setMuted(true);
      var p = type === 'rewarded' ? poki().rewardedBreak() : poki().commercialBreak();
      Promise.resolve(p).then(function (r) { end(type === 'rewarded' ? !!r : true); }, function () { end(false, 'other'); });
    } else {
      end(false, 'unavailable');
    }
  }

  // Quando o jogador sai da aba, avisa o portal que ele parou de jogar.
  document.addEventListener('visibilitychange', function () { gameplay(!document.hidden); });
  // O jogo "comeca" no primeiro toque (o CrazyGames pede o evento quando o jogador ja pode jogar).
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function once() { window.removeEventListener(ev, once); gameplay(true); });
  });

  return {
    name: name, init: init, hasAds: hasAds, gameplay: gameplay, ad: ad,
    usesData: usesData, dataGet: dataGet, dataSet: dataSet, locale: locale,
    isReady: function () { return ready; },
    isMuted: function () { return muteAudio; }
  };
})();
