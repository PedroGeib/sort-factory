// Adaptador de pagamento para a venda de gemas com dinheiro de verdade.
//
// IMPORTANTE: este jogo NÃO cobra nada sozinho. Para vender gemas é preciso ligar uma plataforma que
// cobre e confirme o pagamento (ex.: compras dentro do jogo do CrazyGames ou da Steam). Quando essa
// integração existir, basta preencher `Payments.provider` com um objeto { buy(pack, callback) } que
// chame a plataforma e devolva callback(true) só depois que o pagamento for confirmado por ela.
//
// Enquanto não houver provedor:
//  - em localhost (testes do desenvolvedor), as compras dão gemas grátis, marcadas como "teste";
//  - em qualquer outro endereço, os pacotes nem aparecem e nada é concedido.
//
// O saldo de gemas fica salvo no aparelho do jogador, onde ele pode editar. Para valer dinheiro de
// verdade, o saldo deve ser guardado/validado do lado da plataforma (servidor).
var Payments = {
  provider: null,
  testMode: /^(localhost|127\.0\.0\.1)$/.test(location.hostname),

  // 'live' = cobra de verdade; 'test' = só localhost, grátis; 'off' = não existe compra (os pacotes ficam escondidos)
  // Também fica 'off' no Poki, que proíbe vender moeda dentro do jogo.
  status: function () {
    // O pacote de publicação (node build.js) liga esta chave: sem compra de gemas em nenhuma plataforma.
    if (window.GAME_GEM_PURCHASE === false || window.GAME_PLATFORM === 'poki') return 'off';
    return Payments.provider ? 'live' : Payments.testMode ? 'test' : 'off';
  },

  // Tenta comprar um pacote. Chama done(true) só quando as gemas podem ser entregues.
  buy: function (pack, done) {
    var st = Payments.status();
    if (st === 'live') { Payments.provider.buy(pack, function (ok) { done(!!ok); }); return; }
    if (st === 'test') { done(true); return; }
    done(false);
  }
};
