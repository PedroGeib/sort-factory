// Estado do jogo compartilhado entre as telas: moedas, gemas, nível, máquinas, melhorias, boosts e conquistas.
// Também roda o relógio que faz a fábrica produzir e cuida do ganho offline.
var Game = {
  COLORS: ['#e63946', '#3a86ff', '#2ecc71', '#ffd60a', '#9b5de5',
           '#ff8c42', '#ff70a6', '#00c2d1', '#a0522d'],
  state: Save.load(),   // { level, coins, gems, machines, upgrades, boosts, stats, achievements, lastSeen, settings }
  offline: null,        // preenchido se o jogador ficou fora tempo suficiente
  _missionCheck: 0,
  listeners: [],
  onUnlock: [],         // funções chamadas quando conquistas são desbloqueadas

  // Produção por segundo SEM boosts (usada no cofre e no ganho offline).
  baseRate: function () { return Economy.totalRate(Game.state.machines, Game.state.level, Game.state.upgrades); },

  // Produção por segundo agora, com boosts ativos.
  rate: function () { return Game.baseRate() * Economy.boostMult(Game.state.boosts, 'rate', Date.now()); },

  // Multiplicador das moedas do puzzle (melhorias x boost ativo).
  puzzleMult: function () { return Economy.puzzleMult(Game.state.upgrades) * Economy.boostMult(Game.state.boosts, 'puzzle', Date.now()); },

  // Marca uma dica do tutorial como já vista (e salva).
  markSeen: function (key) {
    if (Game.state.settings.seen[key]) return;
    Game.state.settings.seen[key] = true;
    Game.save();
  },

  // ----- moedas -----
  // Ganho de moedas (conta nas estatísticas); gastar é só tirar de state.coins.
  earn: function (n) {
    Game.state.coins += n;
    Game.state.stats.coinsEarned += n;
    Game.track('coins', n);
  },
  addCoins: function (n) { Game.earn(n); Game.emit(); },

  // ----- gemas -----
  addGems: function (n) { Game.state.gems += n; Game.emit(); },
  spendGems: function (n) {
    if (Game.state.gems < n) return false;
    Game.state.gems -= n;
    return true;
  },

  // Compra um item permanente (ou tema) com gemas. Devolve true se comprou.
  buyPremium: function (id) {
    var s = Game.state;
    var item = Economy.PREMIUM.filter(function (p) { return p.id === id; })[0];
    if (!item || s.upgrades[id] || !Game.spendGems(item.gems)) return false;
    s.upgrades[id] = true;
    if (item.kind === 'theme') s.settings.theme = item.theme;
    Game.save();
    Game.emit();
    return true;
  },

  // Troca o tema (só os que já foram comprados, ou o padrão).
  setTheme: function (name) {
    var s = Game.state;
    var ok = name === 'default' || Economy.PREMIUM.some(function (p) { return p.theme === name && s.upgrades[p.id]; });
    if (!ok) return false;
    s.settings.theme = name;
    Game.save();
    Game.emit();
    return true;
  },

  // Recarrega um boost na hora (só se ele estiver recarregando).
  rechargeBoost: function (id) {
    var s = Game.state;
    if (Economy.boostStatus(s.boosts[id], Date.now()).state !== 'cooling') return false;
    if (!Game.spendGems(Economy.RECHARGE_GEMS)) return false;
    s.boosts[id].readyAt = Date.now();
    Game.save();
    Game.emit();
    return true;
  },

  // Compra moedas prontas: horas de produção da sua fábrica agora.
  buyCoinPack: function (id) {
    var item = Economy.CONSUMABLES.filter(function (c) { return c.id === id; })[0];
    var rate = Game.baseRate();
    if (!item || rate <= 0 || !Game.spendGems(item.gems)) return false;
    Game.earn(rate * item.secs);
    Game.save();
    Game.emit();
    return true;
  },

  // Ativa um boost se ele estiver liberado e pronto. Devolve true se ativou.
  activateBoost: function (id) {
    var s = Game.state;
    var def = Economy.BOOSTS.filter(function (b) { return b.id === id; })[0];
    var now = Date.now();
    if (!def || !Economy.boostUnlocked(def, s.machines, s.level)) return false;
    if (Economy.boostStatus(s.boosts[id], now).state !== 'ready') return false;
    var md = Economy.mods(s.upgrades);   // itens premium deixam os boosts mais longos e rápidos de recarregar
    s.boosts[id] = { until: now + def.dur * md.boostDur * 1000, readyAt: now + def.cd * md.boostCd * 1000 };
    if (def.kind === 'instant') Game.earn(Game.baseRate() * def.secs);
    s.stats.boostUses++;
    Game.track('boosts', 1);
    Game.save();
    Game.emit();
    return true;
  },

  // Recarga de boost gratuita (a recompensa de um anúncio): deixa o boost pronto agora.
  freeRechargeBoost: function (id) {
    var s = Game.state;
    if (Economy.boostStatus(s.boosts[id], Date.now()).state !== 'cooling') return false;
    s.boosts[id].readyAt = Date.now();
    Game.save();
    Game.emit();
    return true;
  },

  // ----- gemas de anúncio (limite por dia) -----
  adGemsToday: function () {
    var a = Game.state.adGems;
    return a.day === Economy.periodKeys(new Date()).daily ? a.n : 0;
  },
  claimAdGem: function () {
    var s = Game.state, key = Economy.periodKeys(new Date()).daily, n = Game.adGemsToday();
    if (n >= Economy.AD_GEMS_PER_DAY) return false;
    s.adGems = { day: key, n: n + 1 };
    s.gems += Economy.AD_GEM_REWARD;
    Game.save();
    Game.emit();
    return true;
  },

  // ----- missões -----
  missionCtx: function () {
    var s = Game.state;
    return {
      level: s.level, rate: Game.baseRate(),
      boostsOpen: Economy.BOOSTS.some(function (b) { return Economy.boostUnlocked(b, s.machines, s.level); }),
      adsOpen: typeof Ads !== 'undefined' && Ads.available()
    };
  },

  // Troca as missões quando o dia, a semana ou o mês muda; conta um "dia jogado" por dia.
  refreshMissions: function () {
    var s = Game.state, keys = Economy.periodKeys(new Date()), changed = false;
    Economy.PERIOD_ORDER.forEach(function (p) {
      if (s.missions[p].key === keys[p]) return;
      s.missions[p] = { key: keys[p], list: Economy.makeMissions(p, keys[p], Game.missionCtx()), bonusClaimed: false };
      changed = true;
    });
    if (s.lastDay !== keys.daily) { s.lastDay = keys.daily; changed = true; Game.track('days', 1); }
    if (changed) { Game.save(); }
    return changed;
  },

  // Soma progresso nas missões ativas daquele tipo (tubos, níveis, moedas, boosts, máquinas...).
  track: function (metric, n) {
    var m = Game.state.missions;
    for (var pi = 0; pi < Economy.PERIOD_ORDER.length; pi++) {
      var p = Economy.PERIOD_ORDER[pi], list = m[p].list;
      for (var i = 0; i < list.length; i++) {
        var ms = list[i];
        if (ms.claimed || ms.progress >= ms.target) continue;
        var d = Economy.missionDef(p, ms.id);
        if (d && d.metric === metric) ms.progress = Math.min(ms.target, ms.progress + n);
      }
    }
  },

  // Recompensa: gemas + produção de alguns minutos da fábrica (com um mínimo para o começo do jogo).
  giveMissionReward: function (gems, secs) {
    Game.state.gems += gems;
    Game.earn(Math.max(Game.baseRate() * secs, secs / 5));
  },

  claimMission: function (period, index) {
    var ms = Game.state.missions[period].list[index], P = Economy.PERIODS[period];
    if (!ms || ms.claimed || ms.progress < ms.target) return false;
    ms.claimed = true;
    Game.giveMissionReward(P.gems, P.secs);
    Game.save();
    Game.emit();
    return true;
  },

  // Bônus por completar (e resgatar) todas as missões do período.
  claimMissionBonus: function (period) {
    var mm = Game.state.missions[period], P = Economy.PERIODS[period];
    if (mm.bonusClaimed || !mm.list.length || !mm.list.every(function (x) { return x.claimed; })) return false;
    mm.bonusClaimed = true;
    Game.giveMissionReward(P.bonusGems, P.bonusSecs);
    Game.save();
    Game.emit();
    return true;
  },

  // Quantas recompensas de missão estão prontas para resgatar (inclui os bônus).
  missionClaimable: function () {
    var n = 0, m = Game.state.missions;
    Economy.PERIOD_ORDER.forEach(function (p) {
      var list = m[p].list, all = list.length > 0;
      list.forEach(function (x) { if (!x.claimed) all = false; if (!x.claimed && x.progress >= x.target) n++; });
      if (all && !m[p].bonusClaimed) n++;
    });
    return n;
  },

  // ----- conquistas -----
  achCtx: function () {
    var s = Game.state;
    return { level: s.level, machines: s.machines, upgrades: s.upgrades, stats: s.stats, rate: Game.baseRate() };
  },

  // Procura conquistas novas. Não chama emit (para não entrar em ciclo).
  checkAchievements: function () {
    var s = Game.state, ctx = null, fresh = [];
    Economy.ACHIEVEMENTS.forEach(function (def) {
      if (s.achievements[def.id]) return;
      ctx = ctx || Game.achCtx();
      if (Economy.achProgress(def, ctx).done) {
        s.achievements[def.id] = { at: Date.now(), claimed: false };
        fresh.push(def);
      }
    });
    if (fresh.length) {
      Game.save();
      Game.onUnlock.forEach(function (f) { f(fresh); });
    }
  },

  // Resgata a recompensa (gemas) de uma conquista já desbloqueada.
  claimAchievement: function (id) {
    var a = Game.state.achievements[id];
    var def = Economy.ACHIEVEMENTS.filter(function (d) { return d.id === id; })[0];
    if (!a || a.claimed || !def) return false;
    a.claimed = true;
    Game.state.gems += def.gems;
    Game.save();
    Game.emit();
    return true;
  },

  // Quantas conquistas estão prontas para resgatar.
  claimable: function () {
    var a = Game.state.achievements, n = 0;
    Object.keys(a).forEach(function (k) { if (!a[k].claimed) n++; });
    return n;
  },

  // Avisa a tela de que algo mudou (moedas, nível, máquinas...).
  emit: function () {
    Game.checkAchievements();
    var now = Date.now();
    if (now - Game._missionCheck > 5000) { Game._missionCheck = now; Game.refreshMissions(); }
    Game.listeners.forEach(function (f) { f(); });
  },

  save: function () {
    Game.state.lastSeen = Date.now();
    Save.store(Game.state);
  }
};

(function () {
  var now = Date.now();
  var s = Game.state;

  // Ganho offline: conta o tempo desde a última vez que o jogo salvou (limite de 8h, ou mais com baterias).
  // Boosts de produção que estavam ligados enquanto o jogador estava fora também contam.
  var rate = Game.baseRate();
  if (s.lastSeen > 0 && rate > 0) {
    var away = (now - s.lastSeen) / 1000;
    var cap = Economy.offlineCap(s.upgrades);
    var counted = Math.min(away, cap);
    var boostExtra = Economy.boostExtraSeconds(s.boosts, s.lastSeen, s.lastSeen + counted * 1000);
    var earned = rate * (counted + boostExtra);
    if (away >= 60 && earned >= 1) {
      Game.earn(earned);
      s.stats.offlineReturns++;
      s.stats.bestAwayHours = Math.max(s.stats.bestAwayHours, Math.min(away / 3600, 999));
      Game.offline = { away: away, counted: counted, cap: cap, coins: earned, boosted: boostExtra > 0 };
    }
  }
  s.lastSeen = now;
  Game.refreshMissions();

  // Relógio da fábrica: usa o tempo real decorrido, então aba em segundo plano não atrasa a produção.
  var last = now;
  setInterval(function () {
    var t = Date.now();
    var dt = Math.min((t - last) / 1000, 24 * 3600);
    last = t;
    var r = Game.rate();
    if (r > 0 && dt > 0) Game.earn(r * dt);
    Game.emit();   // também atualiza os cronômetros dos boosts
  }, 200);

  setInterval(Game.save, 5000);
  window.addEventListener('pagehide', Game.save);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Game.save();
  });
})();
