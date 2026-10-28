// Salva o progresso no navegador. Se o navegador bloquear, o jogo segue sem salvar.
// Atenção: isto fica no aparelho do jogador e pode ser editado por ele. Para vender gemas de verdade,
// o saldo precisa ser confirmado pela plataforma/servidor (ver js/payments.js).
var Save = {
  KEY: 'fabrica-de-separar',
  load: function () {
    var data = {
      level: 1, coins: 0, gems: 0, machines: {}, upgrades: {}, boosts: {}, lastSeen: 0,
      stats: { coinsEarned: 0, tubes: 0, boostUses: 0, offlineReturns: 0, bestAwayHours: 0 },
      achievements: {},
      missions: { daily: { key: '', list: [], bonusClaimed: false }, weekly: { key: '', list: [], bonusClaimed: false }, monthly: { key: '', list: [], bonusClaimed: false } },
      lastDay: '', adGems: { day: '', n: 0 },
      settings: { sound: true, symbols: false, lang: null, theme: 'default', seen: { puzzle: false, factory: false, boosts: false } }
    };
    var num = function (v) { return typeof v === 'number' && isFinite(v) && v >= 0; };
    try {
      // No CrazyGames o progresso vem do modulo de dados; se ainda nao ha nada la, aproveita o que existir no aparelho.
      var raw = window.Platform && Platform.usesData() ? Platform.dataGet(Save.KEY) : null;
      if (raw === null || raw === undefined) raw = localStorage.getItem(Save.KEY);
      var d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        var st = d.settings;
        if (st && typeof st === 'object') {
          if (typeof st.sound === 'boolean') data.settings.sound = st.sound;
          if (typeof st.symbols === 'boolean') data.settings.symbols = st.symbols;
          if (typeof st.theme === 'string') data.settings.theme = st.theme;
          if (st.lang === 'pt' || st.lang === 'en') data.settings.lang = st.lang;
          if (st.seen && typeof st.seen === 'object') {
            data.settings.seen.puzzle = st.seen.puzzle === true;
            data.settings.seen.factory = st.seen.factory === true;
            data.settings.seen.boosts = st.seen.boosts === true;
          }
        }
        if (typeof d.level === 'number' && d.level >= 1) data.level = Math.floor(d.level);
        if (num(d.coins)) data.coins = d.coins;
        if (num(d.gems)) data.gems = Math.floor(d.gems);
        if (typeof d.lastSeen === 'number') data.lastSeen = d.lastSeen;
        if (d.machines && typeof d.machines === 'object') {
          Object.keys(d.machines).forEach(function (k) {
            if (num(d.machines[k])) data.machines[k] = Math.floor(d.machines[k]);
          });
        }
        if (d.upgrades && typeof d.upgrades === 'object') {
          Object.keys(d.upgrades).forEach(function (k) { if (d.upgrades[k] === true) data.upgrades[k] = true; });
        }
        if (d.boosts && typeof d.boosts === 'object') {
          Object.keys(d.boosts).forEach(function (k) {
            var b = d.boosts[k];
            if (b && typeof b.until === 'number' && typeof b.readyAt === 'number') data.boosts[k] = { until: b.until, readyAt: b.readyAt };
          });
        }
        if (d.stats && typeof d.stats === 'object') {
          Object.keys(data.stats).forEach(function (k) { if (num(d.stats[k])) data.stats[k] = d.stats[k]; });
        }
        if (typeof d.lastDay === 'string') data.lastDay = d.lastDay;
        if (d.adGems && typeof d.adGems.day === 'string' && num(d.adGems.n)) data.adGems = { day: d.adGems.day, n: Math.floor(d.adGems.n) };
        if (d.missions && typeof d.missions === 'object') {
          ['daily', 'weekly', 'monthly'].forEach(function (p) {
            var m = d.missions[p];
            if (!m || typeof m.key !== 'string' || !Array.isArray(m.list)) return;
            data.missions[p] = { key: m.key, bonusClaimed: m.bonusClaimed === true, list: m.list.filter(function (x) {
              return x && typeof x.id === 'string' && num(x.target) && num(x.progress);
            }).map(function (x) { return { id: x.id, target: x.target, progress: Math.min(x.progress, x.target), claimed: x.claimed === true }; }) };
          });
        }
        if (d.achievements && typeof d.achievements === 'object') {
          Object.keys(d.achievements).forEach(function (k) {
            var a = d.achievements[k];
            if (a && typeof a === 'object') data.achievements[k] = { at: typeof a.at === 'number' ? a.at : 0, claimed: a.claimed === true };
          });
        }
      }
    } catch (e) {}
    return data;
  },
  store: function (data) {
    var json = JSON.stringify(data);
    if (window.Platform && Platform.usesData() && Platform.dataSet(Save.KEY, json)) return;   // so o modulo de dados, como o portal pede
    try { localStorage.setItem(Save.KEY, json); } catch (e) {}
  }
};
