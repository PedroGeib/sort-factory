// Tela Premium: comprar gemas (com dinheiro de verdade, via js/payments.js) e gastar gemas.
(function () {
  var E = Economy;
  var S = Game.state;
  var $ = function (id) { return document.getElementById(id); };
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }

  // ---------- Tema visual ----------
  var appliedTheme = null;
  function applyTheme() {
    var t = S.settings.theme || 'default';
    if (t === appliedTheme) return;
    appliedTheme = t;
    document.body.classList.remove('theme-neon', 'theme-gold');
    if (t !== 'default') document.body.classList.add('theme-' + t);
  }

  // ---------- Pacotes de gemas ----------
  var packCards = [];
  function buildPacks() {
    if (Payments.status() === 'off') return;   // sem compra de gemas: nada de pacotes na tela
    var box = $('packs');
    E.PACKS.forEach(function (p) {
      var el = document.createElement('div');
      el.className = 'pack';
      el.innerHTML =
        '<div class="pack-gem">' + Icons.svg('gem') + '</div>' +
        '<b>' + p.gems + ' gemas</b>' +
        '<small>' + p.name + (p.bonus ? ' · ' + p.bonus : '') + '</small>' +
        '<button type="button" class="i-buy gem"></button>';
      var btn = el.querySelector('button');
      btn.addEventListener('click', function () { buyPack(p); });
      box.appendChild(el);
      packCards.push({ p: p, btn: btn });
    });
  }

  function buyPack(p) {
    Payments.buy(p, function (ok) {
      if (!ok) { Sfx.error(); Toast.show(Icons.svg('lock') + ' Compras com dinheiro ainda não estão disponíveis.'); return; }
      Sfx.tier();
      Game.addGems(p.gems);
      Game.save();
      Toast.show(Icons.svg('gem') + ' +' + p.gems + ' gemas' + (Payments.status() === 'test' ? ' (modo de teste)' : ''));
    });
  }

  // ---------- Itens para gastar gemas ----------
  var itemCards = [], boostRows = [], freeCard = null;

  function addItem(list, color, icon, name, desc, onClick) {
    var el = document.createElement('div');
    el.className = 'item';
    el.style.setProperty('--tc', color);
    el.innerHTML =
      '<div class="i-icon">' + Icons.svg(icon) + '</div>' +
      '<div class="i-info"><b>' + name + '</b><small>' + desc + '</small><small class="i-req"></small></div>' +
      '<button class="i-buy gem" type="button"><span class="i-n"></span><span class="i-cost"></span></button>';
    var btn = el.querySelector('.i-buy');
    btn.addEventListener('click', onClick);
    list.appendChild(el);
    return { el: el, btn: btn, req: el.querySelector('.i-req'), n: el.querySelector('.i-n'), cost: el.querySelector('.i-cost') };
  }

  function title(list, text, color) {
    var h = document.createElement('div');
    h.className = 'group-title';
    h.style.setProperty('--tc', color);
    h.textContent = text;
    list.appendChild(h);
  }

  function buildItems() {
    var list = $('gem-items');
    title(list, 'Grátis', '#ff8c42');
    freeCard = addItem(list, '#ff8c42', 'play', 'Gemas grátis', 'Assista a um anúncio e ganhe ' + E.AD_GEM_REWARD + ' gema (até ' + E.AD_GEMS_PER_DAY + ' por dia)', function () {
      Ads.rewarded(function (ok, why) {
        if (!ok) { Sfx.error(); Toast.show(Icons.svg('lock') + ' ' + Ads.reasonText(why)); return; }
        if (Game.claimAdGem()) { Sfx.tier(); Toast.show(Icons.svg('gem') + ' +' + E.AD_GEM_REWARD + ' gema!'); }
      });
    });
    freeCard.el.className = 'item ad-card';
    title(list, 'Para sempre', '#b07cff');
    E.PREMIUM.filter(function (p) { return p.kind === 'perm'; }).forEach(function (item) {
      var c = addItem(list, '#b07cff', item.icon, item.name, item.desc, function () {
        if (Game.buyPremium(item.id)) { Sfx.tier(); Toast.show(Icons.svg(item.icon) + ' ' + item.name + ' ativado!'); } else Sfx.error();
      });
      c.item = item; c.kind = 'perm'; itemCards.push(c);
    });

    title(list, 'Temas visuais', '#00e5ff');
    E.PREMIUM.filter(function (p) { return p.kind === 'theme'; }).forEach(function (item) {
      var c = addItem(list, '#00e5ff', item.icon, item.name, item.desc, function () {
        if (S.upgrades[item.id]) { Game.setTheme(S.settings.theme === item.theme ? 'default' : item.theme); Sfx.click(); }
        else if (Game.buyPremium(item.id)) { Sfx.tier(); Toast.show(Icons.svg(item.icon) + ' ' + item.name + ' ativado!'); }
        else Sfx.error();
      });
      c.item = item; c.kind = 'theme'; itemCards.push(c);
    });

    title(list, 'Atalhos', '#ffd60a');
    E.CONSUMABLES.forEach(function (item) {
      var c = addItem(list, '#ffd60a', item.icon, item.name, item.desc, function () {
        if (Game.buyCoinPack(item.id)) { Sfx.buy(); Toast.show(Icons.svg('coin') + ' Moedas recebidas!'); } else Sfx.error();
      });
      c.item = item; c.kind = 'coins'; itemCards.push(c);
    });
    E.BOOSTS.forEach(function (b) {
      var c = addItem(list, '#ff8c42', b.icon, 'Recarregar ' + b.name, 'Deixa o boost pronto agora, sem esperar', function () {
        if (Game.rechargeBoost(b.id)) { Sfx.ready(); Toast.show(Icons.svg(b.icon) + ' ' + b.name + ' pronto para ativar!'); } else Sfx.error();
      });
      var col = document.createElement('div');
      col.className = 'btncol';
      c.el.appendChild(col);
      col.appendChild(c.btn);
      var adBtn = document.createElement('button');
      adBtn.type = 'button';
      adBtn.className = 'i-buy ad';
      adBtn.innerHTML = '<span class="i-n">Grátis</span><span class="i-cost">' + Icons.svg('play') + ' anúncio</span>';
      adBtn.addEventListener('click', function () {
        Ads.rewarded(function (ok, why) {
          if (!ok) { Sfx.error(); Toast.show(Icons.svg('lock') + ' ' + Ads.reasonText(why)); return; }
          if (Game.freeRechargeBoost(b.id)) { Sfx.ready(); Toast.show(Icons.svg(b.icon) + ' ' + b.name + ' pronto para ativar!'); }
        });
      });
      col.appendChild(adBtn);
      c.ad = adBtn;
      c.boost = b; c.kind = 'recharge'; boostRows.push(c);
    });
  }

  // ---------- Atualização ----------
  function update() {
    applyTheme();
    setText($('gems'), E.fmt(S.gems));
    if ($('view-premium').hidden) return;

    var status = Payments.status();
    var adsOn = Ads.available();
    setText($('gems-big'), E.fmt(S.gems));
    $('packs').style.display = status === 'off' ? 'none' : '';
    setText($('pay-note'), status === 'live' ? 'Compras seguras pela plataforma.' :
      status === 'test' ? 'Modo de teste (só neste computador): as compras abaixo dão gemas grátis. Em um site publicado, só aparecem depois de ligar o pagamento da plataforma.' :
      'Ganhe gemas de graça nas missões, nas conquistas' + (adsOn ? ' e assistindo anúncios.' : '.'));
    packCards.forEach(function (c) {
      setHtml(c.btn, '<span class="i-n">' + (status === 'live' ? c.p.price : 'Testar (grátis)') + '</span>' + (status === 'live' ? '' : '<span class="i-cost">' + c.p.price + '</span>'));
      c.btn.disabled = status === 'off';
    });

    // gemas grátis por anúncio
    var left = E.AD_GEMS_PER_DAY - Game.adGemsToday();
    freeCard.el.style.display = adsOn ? '' : 'none';
    setText(freeCard.req, left > 0 ? 'Restam ' + left + ' hoje' : 'Volte amanhã para mais');
    setText(freeCard.n, 'Assistir');
    setHtml(freeCard.cost, Icons.svg('play') + ' +' + E.AD_GEM_REWARD);
    freeCard.btn.disabled = left <= 0;

    var now = Date.now();
    itemCards.forEach(function (c) {
      var item = c.item, owned = !!S.upgrades[item.id], afford = S.gems >= item.gems, el = c.el;
      var cls = 'item' + (owned && c.kind !== 'coins' ? ' own' : '');
      if (el.className !== cls) el.className = cls;
      if (c.kind === 'coins') {
        var noFactory = Game.baseRate() <= 0;
        setText(c.req, noFactory ? 'Compre uma máquina primeiro' : '+' + E.fmt(Game.baseRate() * item.secs) + ' moedas');
        setText(c.n, 'Comprar');
        setHtml(c.cost, Icons.svg('gem') + ' ' + item.gems);
        c.btn.disabled = noFactory || !afford;
      } else if (c.kind === 'theme' && owned) {
        var using = S.settings.theme === item.theme;
        setText(c.req, using ? 'Em uso' : 'Comprado');
        setText(c.n, using ? 'Desligar' : 'Usar');
        setHtml(c.cost, Icons.svg('check'));
        c.btn.disabled = false;
      } else {
        setText(c.req, owned ? 'Ativo' : '');
        setText(c.n, owned ? 'Comprado' : 'Comprar');
        setHtml(c.cost, owned ? Icons.svg('check') : Icons.svg('gem') + ' ' + item.gems);
        c.btn.disabled = owned || !afford;
      }
    });
    boostRows.forEach(function (c) {
      var b = c.boost, open = E.boostUnlocked(b, S.machines, S.level);
      c.el.style.display = open ? '' : 'none';
      if (!open) return;
      var st = E.boostStatus(S.boosts[b.id], now);
      setText(c.req, st.state === 'cooling' ? 'Recarrega em ' + E.fmtClock(st.left) : st.state === 'active' ? 'Ligado agora' : 'Já está pronto');
      setText(c.n, 'Recarregar');
      setHtml(c.cost, Icons.svg('gem') + ' ' + E.RECHARGE_GEMS);
      c.btn.disabled = st.state !== 'cooling' || S.gems < E.RECHARGE_GEMS;
      c.ad.style.display = adsOn ? '' : 'none';
      c.ad.disabled = st.state !== 'cooling';
    });
  }

  buildPacks();
  buildItems();
  Game.listeners.push(update);
  Tabs.on('premium', update);
  applyTheme();
  update();
})();
