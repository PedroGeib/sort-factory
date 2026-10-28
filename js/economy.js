// Contas da fábrica (sem tela): máquinas, melhorias, boosts, custos, produção, ganho offline e formatação.
(function (root) {
  var GROWTH = 1.12;                   // cada máquina comprada encarece a próxima em 12%
  var MILESTONES = [10, 25, 50, 75, 100]; // ao atingir, a produção daquela máquina dobra
  var LEVEL_BONUS = 0.02;              // +2% de produção por nível do puzzle concluído
  var OFFLINE_CAP = 8 * 3600;          // máximo de segundos contados com o jogo fechado
  var UNLOCK_PREV = 5;                 // unidades da máquina anterior para liberar a próxima
  var TUBE_COINS = 5;                  // moedas por tubo completo no puzzle (antes de melhorias)

  // 20 máquinas, da mais simples à mais poderosa. Cada uma custa 7x e rende 4,4x a anterior (a próxima demora a se pagar, então a escada leva dias).
  var COST_STEP = 7, RATE_STEP = 4.4;
  function nice(x) {   // arredonda para 2 algarismos significativos (números "redondos" na loja)
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10) - 1);
    return Number((Math.round(x / p) * p).toPrecision(2));
  }
  var MACHINE_DEFS = [
    ['esteira',    'Esteira',              'conveyor',  'Leva as peças até os separadores.'],
    ['funil',      'Funil Coletor',        'funnel',    'Junta peças soltas num fluxo só.'],
    ['braco',      'Braço Robótico',       'arm',       'Pega peças e coloca na caixa certa.'],
    ['iman',       'Ímã Seletor',          'magnet',    'Puxa as peças que ele reconhece.'],
    ['peneira',    'Peneira Vibratória',   'sieve',     'Sacode tudo e separa por tamanho.'],
    ['separador',  'Separador Ótico',      'scanner',   'Reconhece a cor e separa sozinho.'],
    ['camera',     'Câmera Industrial',    'camera',    'Confere cada peça em alta velocidade.'],
    ['prensa',     'Prensa Hidráulica',    'press',     'Compacta lotes inteiros de uma vez.'],
    ['misturador', 'Misturador',           'mixer',     'Mistura e separa lotes enormes.'],
    ['linha',      'Linha Automática',     'assembly',  'Uma linha inteira de produção.'],
    ['drone',      'Drone Entregador',     'drone',     'Leva as caixas cheias até o estoque.'],
    ['reciclador', 'Reciclador',           'recycle',   'Reaproveita as peças descartadas.'],
    ['caldeira',   'Caldeira',             'boiler',    'Fornece vapor para a fábrica toda.'],
    ['gerador',    'Gerador',              'generator', 'Energia extra para as máquinas.'],
    ['torre',      'Torre de Resfriamento','tower',     'Deixa tudo trabalhando sem parar.'],
    ['robo',       'Robô Montador',        'robot',     'Monta e separa ao mesmo tempo.'],
    ['atomo',      'Núcleo Quântico',      'atom',      'Separa peças em escala atômica.'],
    ['central',    'Central de IA',        'network',   'Um cérebro que comanda a produção.'],
    ['mega',       'Mega-Fábrica',         'city',      'Separa cores em escala industrial.'],
    ['orbital',    'Fábrica Orbital',      'orbit',     'Produz direto da órbita da Terra.']
  ];
  var MACHINES = MACHINE_DEFS.map(function (d, k) {
    return { id: d[0], name: d[1], icon: d[2], desc: d[3],
             base: k === 0 ? 20 : nice(20 * Math.pow(COST_STEP, k)), rate: nice(Math.pow(RATE_STEP, k)) };
  });
  var machineById = {};
  MACHINES.forEach(function (m) { machineById[m.id] = m; });

  // O -1e-6 evita que erro de arredondamento do computador some 1 moeda a mais.
  function ceil(v) { return Math.ceil(v - 1e-6); }

  function unitCost(m, owned) { return ceil(m.base * Math.pow(GROWTH, owned)); }

  // Custo de comprar n máquinas de uma vez (soma geométrica).
  function bulkCost(m, owned, n) {
    if (n <= 1) return unitCost(m, owned);
    return ceil(m.base * Math.pow(GROWTH, owned) * (Math.pow(GROWTH, n) - 1) / (GROWTH - 1));
  }

  // Quantas dá para comprar com as moedas atuais (0 se nem uma).
  function maxAffordable(m, owned, coins) {
    if (coins < unitCost(m, owned)) return 0;
    var first = m.base * Math.pow(GROWTH, owned);
    var n = Math.max(1, Math.floor(Math.log(1 + coins * (GROWTH - 1) / first) / Math.log(GROWTH)));
    while (n > 1 && bulkCost(m, owned, n) > coins) n--;
    while (bulkCost(m, owned, n + 1) <= coins) n++;
    return n;
  }

  // A máquina só é liberada depois de ter UNLOCK_PREV unidades da anterior.
  function machineUnlocked(machines, index) {
    return index === 0 || (machines[MACHINES[index - 1].id] || 0) >= UNLOCK_PREV;
  }

  function milestoneMult(owned) {
    var k = 0;
    for (var i = 0; i < MILESTONES.length; i++) if (owned >= MILESTONES[i]) k++;
    return Math.pow(2, k);
  }

  function nextMilestone(owned) {
    for (var i = 0; i < MILESTONES.length; i++) if (owned < MILESTONES[i]) return MILESTONES[i];
    return null;
  }

  // ---------- Melhorias (compra única) ----------
  // group: de qual máquina ela é ('esteira'...), ou 'global', 'puzzle', 'offline'.
  // need: o que é preciso para liberar { machine, n } | { total } | { level } | null.
  // effect: { machine, mult } | { global } | { puzzle } | { levelBonus } | { offlineHours }
  var UPGRADES = [];

  function machineUpgrade(machineId, tier, name, icon, need, mult, k) {
    var m = machineById[machineId];
    UPGRADES.push({
      id: machineId + tier, group: machineId, name: name, icon: icon,
      desc: m.name + ': produção ×' + mult,
      need: { machine: machineId, n: need },
      cost: Math.round(m.base * Math.pow(GROWTH, need) * k),
      effect: { machine: machineId, mult: mult }
    });
  }
  machineUpgrade('esteira',   1, 'Rolamentos Premium',   'gear',    10, 2, 12);
  machineUpgrade('esteira',   2, 'Motor Turbo',          'turbo',   50, 3, 40);
  machineUpgrade('braco',     1, 'Garras de Aço',        'wrench',  10, 2, 12);
  machineUpgrade('braco',     2, 'Articulação Dupla',    'target',  50, 3, 40);
  machineUpgrade('separador', 1, 'Lente de Precisão',    'eye',     10, 2, 12);
  machineUpgrade('separador', 2, 'Laser Triplo',         'flame',   50, 3, 40);
  machineUpgrade('linha',     1, 'Segunda Pista',        'layers',  10, 2, 12);
  machineUpgrade('linha',     2, 'Controle Automático',  'chip',    50, 3, 40);
  machineUpgrade('mega',      1, 'Chaminés Turbo',       'flame',   10, 2, 12);
  machineUpgrade('mega',      2, 'Distrito Industrial',  'hexagon', 50, 3, 40);

  function other(id, group, name, icon, desc, need, cost, effect) {
    UPGRADES.push({ id: id, group: group, name: name, icon: icon, desc: desc, need: need, cost: cost, effect: effect });
  }
  other('led',     'global', 'Iluminação LED',      'bulb',    'Toda a fábrica produz +25%',  { total: 20 },  3000,       { global: 1.25 });
  other('solar',   'global', 'Painéis Solares',     'sun',     'Toda a fábrica produz +50%',  { total: 60 },  800000,     { global: 1.5 });
  other('reator',  'global', 'Reator Compacto',     'bolt',    'Toda a fábrica produz ×2',    { total: 150 }, 300000000,  { global: 2 });
  other('ia',      'global', 'Inteligência Artificial', 'chip', 'Toda a fábrica produz ×3',   { total: 300 }, 100000000000, { global: 3 });
  other('tubos',   'puzzle', 'Tubos Reforçados',    'shield',  'Moedas do puzzle ×2',         null,           300,        { puzzle: 2 });
  other('mestre',  'puzzle', 'Mestre das Cores',    'palette', 'Moedas do puzzle ×3',         { level: 8 },   15000,      { puzzle: 3 });
  other('bonus1',  'puzzle', 'Bônus de Nível I',    'trophy',  '+2% de produção por nível',   { level: 12 },  150000,     { levelBonus: 0.02 });
  other('bonus2',  'puzzle', 'Bônus de Nível II',   'crown',   '+4% de produção por nível',   { level: 40 },  60000000,   { levelBonus: 0.04 });
  other('bat1',    'offline', 'Bateria Extra',      'battery', 'Produz offline por até 12 h', { total: 10 },  25000,      { offlineHours: 12 });
  other('bat2',    'offline', 'Gerador de Reserva', 'clock',   'Produz offline por até 16 h', { total: 80 },  20000000,   { offlineHours: 16 });
  other('bat3',    'offline', 'Fábrica 24 Horas',   'hourglass', 'Produz offline por até 24 h', { total: 200 }, 20000000000, { offlineHours: 24 });

  var upgradeById = {};
  UPGRADES.forEach(function (u) { upgradeById[u.id] = u; });

  // Soma o efeito das melhorias compradas. "ups" é { id: true }.
  function mods(ups) {
    var r = { global: 1, machine: {}, puzzle: 1, levelBonus: LEVEL_BONUS, offlineCap: OFFLINE_CAP, boostDur: 1, boostCd: 1 };
    if (!ups) return r;
    var bonusHours = 0;
    UPGRADES.concat(PREMIUM).forEach(function (u) {
      if (!ups[u.id] || !u.effect) return;
      var e = u.effect;
      if (e.machine) r.machine[e.machine] = (r.machine[e.machine] || 1) * e.mult;
      else if (e.global) r.global *= e.global;
      else if (e.puzzle) r.puzzle *= e.puzzle;
      else if (e.levelBonus) r.levelBonus += e.levelBonus;
      else if (e.offlineHours) r.offlineCap = Math.max(r.offlineCap, e.offlineHours * 3600);
      else if (e.offlineBonusHours) bonusHours += e.offlineBonusHours;
      else if (e.boostDur) r.boostDur *= e.boostDur;
      else if (e.boostCd) r.boostCd *= e.boostCd;
    });
    r.offlineCap += bonusHours * 3600;
    return r;
  }

  function totalMachines(machines) {
    var t = 0;
    MACHINES.forEach(function (m) { t += machines[m.id] || 0; });
    return t;
  }

  // A melhoria já pode ser comprada? (não olha as moedas)
  function unlocked(u, machines, level) {
    var n = u.need;
    if (!n) return true;
    if (n.machine) return (machines[n.machine] || 0) >= n.n;
    if (n.total) return totalMachines(machines) >= n.total;
    if (n.level) return level >= n.level;
    return true;
  }

  // Texto do que falta para liberar.
  function needText(u) {
    var n = u.need;
    if (!n) return '';
    if (n.machine) return 'Precisa de ' + n.n + ' ' + machineById[n.machine].name;
    if (n.total) return 'Precisa de ' + n.total + ' máquinas';
    if (n.level) return 'Chegue ao nível ' + n.level;
    return '';
  }

  // "level" é o nível atual do jogador; os concluídos são level - 1.
  function levelMult(level, ups) { return 1 + mods(ups).levelBonus * Math.max(0, level - 1); }

  function machineRate(m, owned, ups) {
    return m.rate * owned * milestoneMult(owned) * (mods(ups).machine[m.id] || 1);
  }

  function totalRate(machines, level, ups) {
    var md = mods(ups), sum = 0;
    MACHINES.forEach(function (m) {
      var owned = machines[m.id] || 0;
      sum += m.rate * owned * milestoneMult(owned) * (md.machine[m.id] || 1);
    });
    return sum * md.global * (1 + md.levelBonus * Math.max(0, level - 1));
  }

  function puzzleMult(ups) { return mods(ups).puzzle; }
  function offlineCap(ups) { return mods(ups).offlineCap; }

  function offlineEarnings(rate, elapsedSeconds, cap) {
    return rate * Math.min(Math.max(elapsedSeconds, 0), cap || OFFLINE_CAP);
  }

  // ---------- Boosts (o jogador precisa ativar à mão e esperar recarregar) ----------
  // kind: 'rate' = multiplica a produção; 'puzzle' = multiplica as moedas do puzzle;
  //       'instant' = dá "secs" segundos de produção na hora.
  // dur = duração (s); cd = tempo até poder ativar de novo, contado desde a ativação (s).
  var BOOSTS = [
    { id: 'hora',  need: { level: 3 },  name: 'Hora Extra',       icon: 'clock', kind: 'rate',    mult: 2, dur: 600, cd: 7200,  desc: 'Produção ×2 por 10 min' },
    { id: 'chuva', need: { level: 5 },  name: 'Chuva',            icon: 'coin',  kind: 'puzzle',  mult: 3, dur: 900, cd: 3600,  desc: 'Chuva de moedas: moedas do puzzle ×3 por 15 min' },
    { id: 'turbo', need: { total: 30 }, name: 'Turbo',            icon: 'bolt',  kind: 'rate',    mult: 5, dur: 120, cd: 21600, desc: 'Produção ×5 por 2 min' },
    { id: 'cofre', need: { total: 12 }, name: 'Cofre',            icon: 'gift',  kind: 'instant', secs: 600, dur: 0, cd: 14400, desc: 'Ganha 10 min de produção na hora' }
  ];
  var boostById = {};
  BOOSTS.forEach(function (b) { boostById[b.id] = b; });

  // O boost já foi liberado? (usa a mesma regra das melhorias: nível ou quantidade de máquinas)
  function boostUnlocked(b, machines, level) { return unlocked(b, machines, level); }

  // Situação de um boost: 'active' (ligado), 'cooling' (recarregando) ou 'ready'. "left" em segundos.
  function boostStatus(st, nowMs) {
    st = st || {};
    if ((st.until || 0) > nowMs) return { state: 'active', left: (st.until - nowMs) / 1000 };
    if ((st.readyAt || 0) > nowMs) return { state: 'cooling', left: (st.readyAt - nowMs) / 1000 };
    return { state: 'ready', left: 0 };
  }

  // Multiplicador ativo de um tipo de boost ('rate' ou 'puzzle') agora.
  function boostMult(boosts, kind, nowMs) {
    var m = 1;
    BOOSTS.forEach(function (b) {
      if (b.kind === kind && boostStatus(boosts && boosts[b.id], nowMs).state === 'active') m *= b.mult;
    });
    return m;
  }

  // Quantos segundos EXTRAS de produção os boosts de produção deram enquanto o jogador estava fora
  // (entre fromMs e toMs). Cada segundo de boost ×2 vale 1 segundo extra.
  function boostExtraSeconds(boosts, fromMs, toMs) {
    var extra = 0;
    BOOSTS.forEach(function (b) {
      if (b.kind !== 'rate') return;
      var until = boosts && boosts[b.id] && boosts[b.id].until || 0;
      var overlap = Math.min(until, toMs) - fromMs;
      if (overlap > 0) extra += (b.mult - 1) * overlap / 1000;
    });
    return extra;
  }

  // ---------- Gemas: a segunda moeda ----------
  // Ganha-se de graça nas conquistas e também dá para comprar com dinheiro de verdade (pela plataforma).
  // Itens permanentes de gemas ficam em "ups" junto das melhorias (ids começam com p_).
  var PREMIUM = [
    { id: 'p_motor',    kind: 'perm',  name: 'Motor de Ouro',       icon: 'bolt',    desc: 'Toda a fábrica produz +25% para sempre',      gems: 80,  effect: { global: 1.25 } },
    { id: 'p_puzzle',   kind: 'perm',  name: 'Tubos de Ouro',       icon: 'shield',  desc: 'Moedas do puzzle ×2 para sempre',             gems: 60,  effect: { puzzle: 2 } },
    { id: 'p_offline',  kind: 'perm',  name: 'Baterias de Ouro',    icon: 'battery', desc: '+4 h de produção offline',                    gems: 60,  effect: { offlineBonusHours: 4 } },
    { id: 'p_boostdur', kind: 'perm',  name: 'Boosts Duradouros',   icon: 'clock',   desc: 'Os boosts duram 50% mais',                    gems: 100, effect: { boostDur: 1.5 } },
    { id: 'p_boostcd',  kind: 'perm',  name: 'Recarga Veloz',       icon: 'restart', desc: 'Os boosts recarregam 25% mais rápido',        gems: 100, effect: { boostCd: 0.75 } },
    { id: 'p_theme_neon', kind: 'theme', theme: 'neon', name: 'Tema Neon',    icon: 'palette', desc: 'Visual vibrante em azul neon',          gems: 40 },
    { id: 'p_theme_gold', kind: 'theme', theme: 'gold', name: 'Tema Dourado', icon: 'crown',   desc: 'Visual quente com detalhes dourados',    gems: 40 }
  ];
  var CONSUMABLES = [
    { id: 'c_hora', name: '1 hora de produção',  icon: 'clock',   secs: 3600,  gems: 12, desc: 'Moedas de 1 hora da sua fábrica, na hora' },
    { id: 'c_dia',  name: '8 horas de produção', icon: 'battery', secs: 28800, gems: 80, desc: 'Moedas de 8 horas da sua fábrica, na hora' }
  ];
  var RECHARGE_GEMS = 8;   // preço de recarregar um boost na hora
  var PACKS = [
    { id: 'g80',   name: 'Punhado de Gemas', gems: 80,   price: 'R$ 4,90',  bonus: '' },
    { id: 'g450',  name: 'Saco de Gemas',    gems: 450,  price: 'R$ 24,90', bonus: '+12%' },
    { id: 'g1000', name: 'Baú de Gemas',     gems: 1000, price: 'R$ 49,90', bonus: '+25%' },
    { id: 'g2200', name: 'Cofre Real',       gems: 2200, price: 'R$ 99,90', bonus: '+35%' }
  ];

  // ---------- Conquistas ----------
  // cur(ctx) devolve o progresso atual; ctx = { level, machines, upgrades, stats, rate }.
  var ACHIEVEMENTS = [];
  function ach(id, group, name, desc, icon, gems, max, cur) {
    ACHIEVEMENTS.push({ id: id, group: group, name: name, desc: desc, icon: icon, gems: gems, max: max, cur: cur });
  }
  function tierOf(n) { var t = 0; MILESTONES.forEach(function (m) { if (n >= m) t++; }); return t; }
  var levelsDone = function (c) { return Math.max(0, c.level - 1); };
  var kinds = function (c) { var k = 0; MACHINES.forEach(function (m) { if ((c.machines[m.id] || 0) > 0) k++; }); return k; };
  var units = function (c) { return totalMachines(c.machines); };
  var maxTier = function (c) { var t = 0; MACHINES.forEach(function (m) { t = Math.max(t, tierOf(c.machines[m.id] || 0)); }); return t; };
  var tierSum = function (c) { var t = 0; MACHINES.forEach(function (m) { t += tierOf(c.machines[m.id] || 0); }); return t; };
  var upCount = function (c) { var k = 0; UPGRADES.forEach(function (u) { if (c.upgrades[u.id]) k++; }); return k; };
  var stat = function (name) { return function (c) { return c.stats[name] || 0; }; };

  ach('lvl1',   'puzzle', 'Primeiro Passo',     'Complete 1 nível',       'tube',    2,  1,   levelsDone);
  ach('lvl5',   'puzzle', 'Aprendiz',           'Complete 5 níveis',      'tube',    3,  5,   levelsDone);
  ach('lvl10',  'puzzle', 'Veterano',           'Complete 10 níveis',     'tube',    5,  10,  levelsDone);
  ach('lvl25',  'puzzle', 'Mestre das Cores',   'Complete 25 níveis',     'palette', 8,  25,  levelsDone);
  ach('lvl50',  'puzzle', 'Lenda dos Tubos',    'Complete 50 níveis',     'trophy',  12, 50,  levelsDone);
  ach('lvl100', 'puzzle', 'Mente Brilhante',    'Complete 100 níveis',    'crown',   20, 100, levelsDone);
  ach('tubes50',  'puzzle', 'Colecionador',       'Complete 50 tubos',    'shield',  3,  50,  stat('tubes'));
  ach('tubes500', 'puzzle', 'Fábrica de Tubos',   'Complete 500 tubos',   'shield',  8,  500, stat('tubes'));

  ach('first',    'fabrica', 'Ligando a Fábrica',    'Compre sua primeira máquina',        'conveyor', 2,  1,    kinds);
  ach('kinds5',   'fabrica', 'Linha de Produção',    'Tenha 5 tipos de máquina',           'assembly', 3,  5,    kinds);
  ach('kinds10',  'fabrica', 'Parque Industrial',    'Tenha 10 tipos de máquina',          'factory',  6,  10,   kinds);
  ach('kinds20',  'fabrica', 'Império Industrial',   'Tenha os 20 tipos de máquina',       'city',     15, 20,   kinds);
  ach('units100', 'fabrica', 'Cem Máquinas',         'Tenha 100 máquinas no total',        'gear',     4,  100,  units);
  ach('units500', 'fabrica', 'Meio Milhar',          'Tenha 500 máquinas no total',        'gear',     8,  500,  units);
  ach('units1000','fabrica', 'Mil Máquinas',         'Tenha 1000 máquinas no total',       'hexagon',  15, 1000, units);
  ach('tier1',    'fabrica', 'Primeira Estrela',     'Leve uma máquina ao nível 1',        'star',     2,  1,    maxTier);
  ach('tiersum',  'fabrica', 'Constelação',          'Some 20 níveis de máquinas',         'star',     8,  20,   tierSum);
  ach('tier5',    'fabrica', 'Cinco Estrelas',       'Leve uma máquina ao nível máximo',   'crown',    10, 5,    maxTier);
  ach('up1',      'fabrica', 'Primeira Melhoria',    'Instale 1 melhoria',                 'wrench',   2,  1,    upCount);
  ach('up10',     'fabrica', 'Engenheiro',           'Instale 10 melhorias',               'wrench',   5,  10,   upCount);
  ach('upall',    'fabrica', 'Fábrica Completa',     'Instale todas as melhorias',         'chip',     12, UPGRADES.length, upCount);

  ach('earn1k',  'economia', 'Mil Moedas',        'Ganhe 1 mil moedas no total',   'coin', 1,  1e3,  stat('coinsEarned'));
  ach('earn1m',  'economia', 'Milionário',        'Ganhe 1 milhão de moedas',      'coin', 3,  1e6,  stat('coinsEarned'));
  ach('earn1b',  'economia', 'Bilionário',        'Ganhe 1 bilhão de moedas',      'coin', 6,  1e9,  stat('coinsEarned'));
  ach('earn1t',  'economia', 'Trilionário',       'Ganhe 1 trilhão de moedas',     'coin', 10, 1e12, stat('coinsEarned'));
  ach('earn1qi', 'economia', 'Quintilionário',    'Ganhe 1 quintilhão de moedas',  'coin', 15, 1e18, stat('coinsEarned'));
  ach('earn1no', 'economia', 'Dono do Mundo',     'Ganhe 1 octilhão de moedas',    'coin', 25, 1e27, stat('coinsEarned'));
  ach('rate100', 'economia', 'Cem por Segundo',   'Produza 100 moedas por segundo',  'bolt', 3,  100, function (c) { return c.rate; });
  ach('rate1m',  'economia', 'Um Milhão por Segundo', 'Produza 1 milhão por segundo', 'bolt', 8,  1e6, function (c) { return c.rate; });
  ach('rate1t',  'economia', 'Usina Infinita',    'Produza 1 trilhão por segundo', 'bolt', 15, 1e12, function (c) { return c.rate; });

  ach('boost1',  'boosts', 'Ativação Manual',    'Ative um boost',     'bolt',  2,  1,  stat('boostUses'));
  ach('boost10', 'boosts', 'Aproveitador',       'Ative 10 boosts',    'clock', 4,  10, stat('boostUses'));
  ach('boost50', 'boosts', 'Maestro dos Boosts', 'Ative 50 boosts',    'gift',  10, 50, stat('boostUses'));

  ach('off1', 'offline', 'Bem-vindo de Volta', 'Volte ao jogo depois de ficar fora', 'battery',   2, 1, stat('offlineReturns'));
  ach('off8', 'offline', 'Dorminhoco',         'Volte depois de 8 horas fora',       'hourglass', 6, 8, stat('bestAwayHours'));

  // Progresso de uma conquista: { cur, max, done, pct }
  function achProgress(def, ctx) {
    var cur = Math.min(def.cur(ctx), def.max);
    return { cur: cur, max: def.max, done: cur >= def.max, pct: Math.max(0, Math.min(100, cur / def.max * 100)) };
  }

  // ---------- Anuncios com recompensa: gemas gratis por dia ----------
  var AD_GEM_REWARD = 1;     // gemas por anuncio assistido
  var AD_GEMS_PER_DAY = 5;   // limite diario

  // ---------- Missoes: diarias, semanais e mensais ----------
  // Cada periodo sorteia algumas missoes de um conjunto (o sorteio e o mesmo durante o periodo todo).
  // A recompensa de cada missao e em gemas + alguns minutos da producao da fabrica.
  var PERIODS = {
    daily:   { title: 'Diárias',  count: 4, gems: 1,  bonusGems: 2,  secs: 300,   bonusSecs: 900 },
    weekly:  { title: 'Semanais', count: 4, gems: 5,  bonusGems: 8,  secs: 1800,  bonusSecs: 5400 },
    monthly: { title: 'Mensais',  count: 3, gems: 15, bonusGems: 30, secs: 10800, bonusSecs: 32400 }
  };
  var PERIOD_ORDER = ['daily', 'weekly', 'monthly'];

  // Meta de moedas que acompanha a fabrica: "hours" horas da producao atual (com um minimo).
  function coinsTarget(hours, min) { return function (c) { return nice(Math.max(min, c.rate * hours * 3600)); }; }
  var boostsOpen = function (c) { return c.boostsOpen; };
  var laterGame = function (c) { return c.level >= 4; };
  var adsOpen = function (c) { return c.adsOpen; };
  function def(id, metric, icon, text, unit, n, need) { return { id: id, metric: metric, icon: icon, text: text, unit: unit, n: n, need: need || null }; }

  var MISSION_POOL = {
    daily: [
      def('lvl',   'levels',   'tube',     'Complete {n} {u}', ['nível', 'níveis'],       3),
      def('tubes', 'tubes',    'shield',   'Complete {n} {u}', ['tubo', 'tubos'],         15),
      def('coins', 'coins',    'coin',     'Ganhe {n} {u}',    ['moeda', 'moedas'],       coinsTarget(0.5, 300)),
      def('buy',   'machines', 'conveyor', 'Compre {n} {u}',   ['máquina', 'máquinas'],   8),
      def('boost', 'boosts',   'bolt',     'Ative {n} {u}',    ['boost', 'boosts'],       2, boostsOpen),
      def('upg',   'upgrades', 'wrench',   'Instale {n} {u}',  ['melhoria', 'melhorias'], 1, laterGame),
      def('ad',    'ads',      'play',     'Assista {n} {u}',  ['anúncio', 'anúncios'],   1, adsOpen)
    ],
    weekly: [
      def('lvl',   'levels',   'tube',     'Complete {n} {u}', ['nível', 'níveis'],       15),
      def('tubes', 'tubes',    'shield',   'Complete {n} {u}', ['tubo', 'tubos'],         100),
      def('coins', 'coins',    'coin',     'Ganhe {n} {u}',    ['moeda', 'moedas'],       coinsTarget(4, 2000)),
      def('buy',   'machines', 'conveyor', 'Compre {n} {u}',   ['máquina', 'máquinas'],   50),
      def('days',  'days',     'clock',    'Jogue em {n} {u} diferentes', ['dia', 'dias'], 4),
      def('boost', 'boosts',   'bolt',     'Ative {n} {u}',    ['boost', 'boosts'],       8, boostsOpen),
      def('upg',   'upgrades', 'wrench',   'Instale {n} {u}',  ['melhoria', 'melhorias'], 3, laterGame),
      def('ad',    'ads',      'play',     'Assista {n} {u}',  ['anúncio', 'anúncios'],   5, adsOpen)
    ],
    monthly: [
      def('lvl',   'levels',   'tube',     'Complete {n} {u}', ['nível', 'níveis'],       60),
      def('tubes', 'tubes',    'shield',   'Complete {n} {u}', ['tubo', 'tubos'],         400),
      def('coins', 'coins',    'coin',     'Ganhe {n} {u}',    ['moeda', 'moedas'],       coinsTarget(24, 20000)),
      def('buy',   'machines', 'conveyor', 'Compre {n} {u}',   ['máquina', 'máquinas'],   250),
      def('days',  'days',     'clock',    'Jogue em {n} {u} diferentes', ['dia', 'dias'], 15),
      def('boost', 'boosts',   'bolt',     'Ative {n} {u}',    ['boost', 'boosts'],       30, boostsOpen),
      def('upg',   'upgrades', 'wrench',   'Instale {n} {u}',  ['melhoria', 'melhorias'], 8, laterGame)
    ]
  };
  var missionDefs = {};
  PERIOD_ORDER.forEach(function (p) { MISSION_POOL[p].forEach(function (d) { missionDefs[p + ':' + d.id] = d; }); });
  function missionDef(period, id) { return missionDefs[period + ':' + id] || null; }

  // Texto final da missao com a meta: "Complete 3 niveis".
  function missionText(period, id, target) {
    var d = missionDef(period, id);
    if (!d) return '';
    return d.text.replace('{n}', fmt(target)).replace('{u}', target === 1 ? d.unit[0] : d.unit[1]);
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  // Chaves dos periodos atuais (hora local): dia, semana (comeca na segunda) e mes.
  function periodKeys(date) {
    var mon = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    return { daily: ymd(date), weekly: ymd(mon), monthly: date.getFullYear() + '-' + pad2(date.getMonth() + 1) };
  }

  // Quando o periodo reinicia (meia-noite local, segunda-feira ou dia 1), em milissegundos.
  function nextReset(period, date) {
    var y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
    if (period === 'daily') return new Date(y, m, d + 1).getTime();
    if (period === 'weekly') return new Date(y, m, d + (7 - ((date.getDay() + 6) % 7))).getTime();
    return new Date(y, m + 1, 1).getTime();
  }

  function hashStr(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {   // gerador de numeros "aleatorios" repetivel: mesma semente, mesma sequencia
    var a = seed;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Sorteia as missoes de um periodo. ctx = { level, rate, boostsOpen, adsOpen }.
  function makeMissions(period, key, ctx) {
    var pool = MISSION_POOL[period].filter(function (d) { return !d.need || d.need(ctx); });
    var rand = rng(hashStr(period + key));
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, PERIODS[period].count).map(function (d) {
      var target = typeof d.n === 'function' ? d.n(ctx) : d.n;
      return { id: d.id, target: target, progress: 0, claimed: false };
    });
  }

  // Separador decimal: virgula em portugues, ponto em ingles (muda com o idioma).
  var DEC = ',';
  function setDecimal(ch) { DEC = ch; }
  function dec(x, digits) { return x.toFixed(digits).replace('.', DEC); }

  var SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 1000) {
      return n < 10 ? (Math.round(n * 10) / 10).toString().replace('.', DEC) : String(Math.floor(n));
    }
    var i = 0;
    while (n >= 999.5 && i < SUFFIX.length - 1) { n /= 1000; i++; }
    var s = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0);
    return s.replace('.', DEC) + SUFFIX[i];
  }

  function fmtTime(sec) {
    sec = Math.floor(sec);
    if (sec < 60) return sec + 's';
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? h + 'h ' + (m < 10 ? '0' : '') + m + 'min' : m + 'min';
  }

  // Relógio de contagem regressiva: 9:05 ou 1:02:09.
  function fmtClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return h > 0 ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
  }

  var api = {
    MACHINES: MACHINES, MILESTONES: MILESTONES, OFFLINE_CAP: OFFLINE_CAP, LEVEL_BONUS: LEVEL_BONUS, TUBE_COINS: TUBE_COINS, UNLOCK_PREV: UNLOCK_PREV,
    UPGRADES: UPGRADES, BOOSTS: BOOSTS, GROWTH: GROWTH,
    AD_GEM_REWARD: AD_GEM_REWARD, AD_GEMS_PER_DAY: AD_GEMS_PER_DAY,
    PERIODS: PERIODS, PERIOD_ORDER: PERIOD_ORDER, MISSION_POOL: MISSION_POOL,
    missionDef: missionDef, missionText: missionText, makeMissions: makeMissions, periodKeys: periodKeys, nextReset: nextReset,
    PREMIUM: PREMIUM, CONSUMABLES: CONSUMABLES, PACKS: PACKS, RECHARGE_GEMS: RECHARGE_GEMS,
    ACHIEVEMENTS: ACHIEVEMENTS, achProgress: achProgress,
    unitCost: unitCost, bulkCost: bulkCost, maxAffordable: maxAffordable, machineUnlocked: machineUnlocked,
    milestoneMult: milestoneMult, nextMilestone: nextMilestone, levelMult: levelMult,
    machineRate: machineRate, totalMachines: totalMachines, totalRate: totalRate,
    mods: mods, unlocked: unlocked, needText: needText, puzzleMult: puzzleMult, offlineCap: offlineCap,
    offlineEarnings: offlineEarnings,
    boostUnlocked: boostUnlocked, boostStatus: boostStatus, boostMult: boostMult, boostExtraSeconds: boostExtraSeconds,
    fmt: fmt, fmtTime: fmtTime, fmtClock: fmtClock, setDecimal: setDecimal, dec: dec
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Economy = api;
})(this);
