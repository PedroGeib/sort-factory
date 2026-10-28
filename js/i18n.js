// Idiomas: portugues (original) e ingles. O jogo escreve tudo em portugues; este modulo traduz o que aparece
// na tela para ingles (dicionario + padroes para frases montadas) e desfaz ao voltar para o portugues.
// O idioma padrao e INGLES (exigencia do CrazyGames); o botao PT/EN troca para portugues e a escolha fica salva.
var I18n = (function () {
  var lang = 'pt';

  // ----- frases fixas: [portugues, ingles] -----
  var PAIRS = [
    // tela principal
    ['Fábrica de Separar', 'Sort Factory'],
    ['Ative o JavaScript para jogar a Fábrica de Separar.', 'Enable JavaScript to play Sort Factory.'],
    ['Nível', 'Level'], ['Puzzle', 'Puzzle'], ['Fábrica', 'Factory'], ['Metas', 'Goals'], ['Premium', 'Premium'],
    ['Toque num tubo para pegar as cores do topo. Os tubos que brilham em verde aceitam essa cor: toque num deles para despejar. Junte cada cor num tubo!',
     'Tap a tube to pick up the top colors. Tubes glowing green accept that color: tap one to pour. Gather each color in one tube!'],
    ['Entendi', 'Got it'], ['Desfazer', 'Undo'], ['Reiniciar', 'Restart'],
    ['Aqui a fábrica trabalha por você! Compre uma Esteira com as moedas do puzzle: ela produz moedas sozinha, até com o jogo fechado. Tudo que você instala aparece na cena e em "Sua fábrica".',
     'Your factory works for you here! Buy a Conveyor Belt with puzzle coins: it makes coins on its own, even while the game is closed. Everything you install shows up in the scene and in "Your factory".'],
    ['Sua fábrica', 'Your factory'], ['Loja', 'Shop'], ['Máquinas', 'Machines'], ['Melhorias', 'Upgrades'],
    ['Comprar:', 'Buy:'], ['Máx', 'Max'], ['Missões', 'Missions'], ['Conquistas', 'Achievements'],
    ['Suas gemas', 'Your gems'], ['Gastar gemas', 'Spend gems'],
    ['Nível completo!', 'Level complete!'], ['Próximo nível', 'Next level'], ['Ir à fábrica', 'Go to factory'],
    ['Bem-vindo de volta!', 'Welcome back!'], ['Dobrar com anúncio', 'Double with an ad'], ['Coletar', 'Collect'],
    ['Separe as cores no puzzle, monte uma fábrica que trabalha sozinha e ative boosts para render ainda mais.',
     'Sort the colors in the puzzle, build a factory that works on its own and activate boosts to earn even more.'],
    ['Mostrar símbolos nas cores', 'Show symbols on colors'], ['Ligar ou desligar o som', 'Turn sound on or off'],
    ['Tubos de cores', 'Color tubes'], ['Sua fábrica separando peças', 'Your factory sorting pieces'],
    ['Idioma', 'Language'],

    // botoes e estados
    ['Resgatar', 'Claim'], ['Resgatada', 'Claimed'], ['Resgatado', 'Claimed'], ['Recompensa', 'Reward'], ['Completa', 'Complete'],
    ['Em andamento', 'In progress'], ['Bloqueado', 'Locked'], ['Assistir', 'Watch'], ['Comprado', 'Owned'], ['Desligar', 'Turn off'],
    ['Usar', 'Use'], ['Ativo', 'Active'], ['Ligado agora', 'On now'], ['Em uso', 'In use'], ['Comprar', 'Buy'], ['Instalar', 'Install'],
    ['Instalado', 'Installed'], ['Ativar', 'Activate'], ['Recarregar', 'Recharge'], ['Grátis', 'Free'], ['Gemas grátis', 'Free gems'],
    ['Para sempre', 'Forever'], ['Temas visuais', 'Visual themes'], ['Atalhos', 'Shortcuts'], ['Já está pronto', 'Already ready'],
    ['Compre uma máquina primeiro', 'Buy a machine first'], ['Volte amanhã para mais', 'Come back tomorrow for more'],
    ['Testar (grátis)', 'Test (free)'], ['Dobrado! +', 'Doubled! +'], ['anúncio', 'ad'], ['anúncios', 'ads'],
    ['Seus boosts ativos também contaram.', 'Your active boosts counted too.'],
    ['Moedas recebidas!', 'Coins received!'], ['Missão resgatada', 'Mission claimed'],
    ['Compre uma Esteira para ligar a fábrica', 'Buy a Conveyor Belt to start the factory'], ['LINHA DE MÁQUINAS', 'MACHINE LINE'],
    ['Simulando um anúncio...', 'Simulating an ad...'], ['Anúncio de teste', 'Test ad'],
    ['Conquista', 'Achievement'], ['Boost liberado', 'Boost unlocked'], ['Hoje', 'Today'],
    ['Deixa o boost pronto agora, sem esperar', 'Makes the boost ready now, no waiting'],
    ['Compras seguras pela plataforma.', 'Secure purchases through the platform.'],
    ['Modo de teste (só neste computador): as compras abaixo dão gemas grátis. Em um site publicado, só aparecem depois de ligar o pagamento da plataforma.',
     'Test mode (this computer only): the purchases below give free gems. On a published site they only appear after the platform payment is connected.'],
    ['Ganhe gemas de graça nas missões, nas conquistas e assistindo anúncios.', 'Earn free gems from missions, achievements and by watching ads.'],
    ['Ganhe gemas de graça nas missões, nas conquistas.', 'Earn free gems from missions and achievements.'],
    ['Compras com dinheiro ainda não estão disponíveis.', 'Purchases with real money are not available yet.'],
    ['Desative o bloqueador de anúncios para receber a recompensa.', 'Turn off your ad blocker to get the reward.'],
    ['Espere um pouco antes do próximo anúncio.', 'Wait a moment before the next ad.'],
    ['Sem anúncio disponível agora. Tente de novo daqui a pouco.', 'No ad available right now. Try again in a moment.'],
    ['Anúncios indisponíveis.', 'Ads unavailable.'], ['Não foi possível mostrar o anúncio.', 'The ad could not be shown.'],
    ['diárias', 'daily'], ['semanais', 'weekly'], ['mensais', 'monthly'],
    ['Diárias', 'Daily'], ['Semanais', 'Weekly'], ['Mensais', 'Monthly'],
    ['nível máximo', 'max level'], ['máquinas', 'machines'], ['máquina', 'machine'], ['Funcionamento offline', 'Offline operation'], ['Fábrica inteira', 'Whole factory'],
    ['Economia', 'Economy'], ['Offline', 'Offline'], ['Boosts', 'Boosts'],

    // maquinas
    ['Esteira', 'Conveyor Belt'], ['Leva as peças até os separadores.', 'Carries the pieces to the sorters.'],
    ['Funil Coletor', 'Collector Funnel'], ['Junta peças soltas num fluxo só.', 'Gathers loose pieces into a single flow.'],
    ['Braço Robótico', 'Robot Arm'], ['Pega peças e coloca na caixa certa.', 'Grabs pieces and drops them in the right box.'],
    ['Ímã Seletor', 'Selector Magnet'], ['Puxa as peças que ele reconhece.', 'Pulls in the pieces it recognizes.'],
    ['Peneira Vibratória', 'Vibrating Sieve'], ['Sacode tudo e separa por tamanho.', 'Shakes everything and sorts by size.'],
    ['Separador Ótico', 'Optical Sorter'], ['Reconhece a cor e separa sozinho.', 'Recognizes the color and sorts on its own.'],
    ['Câmera Industrial', 'Industrial Camera'], ['Confere cada peça em alta velocidade.', 'Checks every piece at high speed.'],
    ['Prensa Hidráulica', 'Hydraulic Press'], ['Compacta lotes inteiros de uma vez.', 'Compacts whole batches at once.'],
    ['Misturador', 'Mixer'], ['Mistura e separa lotes enormes.', 'Mixes and sorts huge batches.'],
    ['Linha Automática', 'Assembly Line'], ['Uma linha inteira de produção.', 'A whole production line.'],
    ['Drone Entregador', 'Delivery Drone'], ['Leva as caixas cheias até o estoque.', 'Carries full boxes to the warehouse.'],
    ['Reciclador', 'Recycler'], ['Reaproveita as peças descartadas.', 'Reuses the discarded pieces.'],
    ['Caldeira', 'Boiler'], ['Fornece vapor para a fábrica toda.', 'Supplies steam for the whole factory.'],
    ['Gerador', 'Generator'], ['Energia extra para as máquinas.', 'Extra power for the machines.'],
    ['Torre de Resfriamento', 'Cooling Tower'], ['Deixa tudo trabalhando sem parar.', 'Keeps everything running nonstop.'],
    ['Robô Montador', 'Assembler Robot'], ['Monta e separa ao mesmo tempo.', 'Assembles and sorts at the same time.'],
    ['Núcleo Quântico', 'Quantum Core'], ['Separa peças em escala atômica.', 'Sorts pieces at the atomic scale.'],
    ['Central de IA', 'AI Hub'], ['Um cérebro que comanda a produção.', 'A brain that runs production.'],
    ['Mega-Fábrica', 'Mega Factory'], ['Separa cores em escala industrial.', 'Sorts colors at industrial scale.'],
    ['Fábrica Orbital', 'Orbital Factory'], ['Produz direto da órbita da Terra.', "Produces straight from Earth's orbit."],

    // melhorias
    ['Rolamentos Premium', 'Premium Bearings'], ['Motor Turbo', 'Turbo Motor'], ['Garras de Aço', 'Steel Claws'],
    ['Articulação Dupla', 'Double Joint'], ['Lente de Precisão', 'Precision Lens'], ['Laser Triplo', 'Triple Laser'],
    ['Segunda Pista', 'Second Lane'], ['Controle Automático', 'Auto Control'], ['Chaminés Turbo', 'Turbo Chimneys'],
    ['Distrito Industrial', 'Industrial District'],
    ['Iluminação LED', 'LED Lighting'], ['Toda a fábrica produz +25%', 'The whole factory produces +25%'],
    ['Painéis Solares', 'Solar Panels'], ['Toda a fábrica produz +50%', 'The whole factory produces +50%'],
    ['Reator Compacto', 'Compact Reactor'], ['Toda a fábrica produz ×2', 'The whole factory produces ×2'],
    ['Inteligência Artificial', 'Artificial Intelligence'], ['Toda a fábrica produz ×3', 'The whole factory produces ×3'],
    ['Tubos Reforçados', 'Reinforced Tubes'], ['Moedas do puzzle ×2', 'Puzzle coins ×2'],
    ['Mestre das Cores', 'Color Master'], ['Moedas do puzzle ×3', 'Puzzle coins ×3'],
    ['Bônus de Nível I', 'Level Bonus I'], ['+2% de produção por nível', '+2% production per level'],
    ['Bônus de Nível II', 'Level Bonus II'], ['+4% de produção por nível', '+4% production per level'],
    ['Bateria Extra', 'Extra Battery'], ['Produz offline por até 12 h', 'Produces offline for up to 12 h'],
    ['Gerador de Reserva', 'Backup Generator'], ['Produz offline por até 16 h', 'Produces offline for up to 16 h'],
    ['Fábrica 24 Horas', '24-Hour Factory'], ['Produz offline por até 24 h', 'Produces offline for up to 24 h'],

    // boosts
    ['Hora Extra', 'Overtime'], ['Chuva', 'Coin Rain'], ['Turbo', 'Turbo'], ['Cofre', 'Vault'],
    ['Produção ×2 por 10 min', 'Production ×2 for 10 min'], ['Chuva de moedas: moedas do puzzle ×3 por 15 min', 'Coin rain: puzzle coins ×3 for 15 min'],
    ['Produção ×5 por 2 min', 'Production ×5 for 2 min'], ['Ganha 10 min de produção na hora', 'Instantly earns 10 min of production'],

    // premium
    ['Motor de Ouro', 'Golden Engine'], ['Toda a fábrica produz +25% para sempre', 'The whole factory produces +25% forever'],
    ['Tubos de Ouro', 'Golden Tubes'], ['Moedas do puzzle ×2 para sempre', 'Puzzle coins ×2 forever'],
    ['Baterias de Ouro', 'Golden Batteries'], ['+4 h de produção offline', '+4 h of offline production'],
    ['Boosts Duradouros', 'Lasting Boosts'], ['Os boosts duram 50% mais', 'Boosts last 50% longer'],
    ['Recarga Veloz', 'Fast Recharge'], ['Os boosts recarregam 25% mais rápido', 'Boosts recharge 25% faster'],
    ['Tema Neon', 'Neon Theme'], ['Visual vibrante em azul neon', 'Vibrant neon blue look'],
    ['Tema Dourado', 'Golden Theme'], ['Visual quente com detalhes dourados', 'Warm look with golden details'],
    ['1 hora de produção', '1 hour of production'], ['Moedas de 1 hora da sua fábrica, na hora', 'Coins from 1 hour of your factory, instantly'],
    ['8 horas de produção', '8 hours of production'], ['Moedas de 8 horas da sua fábrica, na hora', 'Coins from 8 hours of your factory, instantly'],
    ['Punhado de Gemas', 'Handful of Gems'], ['Saco de Gemas', 'Bag of Gems'], ['Baú de Gemas', 'Chest of Gems'], ['Cofre Real', 'Royal Vault'],

    // conquistas
    ['Primeiro Passo', 'First Step'], ['Complete 1 nível', 'Complete 1 level'],
    ['Aprendiz', 'Apprentice'], ['Veterano', 'Veteran'], ['Lenda dos Tubos', 'Tube Legend'], ['Mente Brilhante', 'Bright Mind'],
    ['Colecionador', 'Collector'], ['Fábrica de Tubos', 'Tube Factory'],
    ['Ligando a Fábrica', 'Powering Up'], ['Compre sua primeira máquina', 'Buy your first machine'],
    ['Linha de Produção', 'Production Line'], ['Tenha 5 tipos de máquina', 'Own 5 types of machine'],
    ['Parque Industrial', 'Industrial Park'], ['Tenha 10 tipos de máquina', 'Own 10 types of machine'],
    ['Império Industrial', 'Industrial Empire'], ['Tenha os 20 tipos de máquina', 'Own all 20 machine types'],
    ['Cem Máquinas', 'A Hundred Machines'], ['Tenha 100 máquinas no total', 'Own 100 machines in total'],
    ['Meio Milhar', 'Half a Thousand'], ['Tenha 500 máquinas no total', 'Own 500 machines in total'],
    ['Mil Máquinas', 'A Thousand Machines'], ['Tenha 1000 máquinas no total', 'Own 1000 machines in total'],
    ['Primeira Estrela', 'First Star'], ['Leve uma máquina ao nível 1', 'Take a machine to level 1'],
    ['Constelação', 'Constellation'], ['Some 20 níveis de máquinas', 'Add up 20 machine levels'],
    ['Cinco Estrelas', 'Five Stars'], ['Leve uma máquina ao nível máximo', 'Take a machine to max level'],
    ['Primeira Melhoria', 'First Upgrade'], ['Instale 1 melhoria', 'Install 1 upgrade'],
    ['Engenheiro', 'Engineer'], ['Instale 10 melhorias', 'Install 10 upgrades'],
    ['Fábrica Completa', 'Fully Equipped'], ['Instale todas as melhorias', 'Install every upgrade'],
    ['Mil Moedas', 'A Thousand Coins'], ['Ganhe 1 mil moedas no total', 'Earn 1 thousand coins in total'],
    ['Milionário', 'Millionaire'], ['Ganhe 1 milhão de moedas', 'Earn 1 million coins'],
    ['Bilionário', 'Billionaire'], ['Ganhe 1 bilhão de moedas', 'Earn 1 billion coins'],
    ['Trilionário', 'Trillionaire'], ['Ganhe 1 trilhão de moedas', 'Earn 1 trillion coins'],
    ['Quintilionário', 'Quintillionaire'], ['Ganhe 1 quintilhão de moedas', 'Earn 1 quintillion coins'],
    ['Dono do Mundo', 'World Owner'], ['Ganhe 1 octilhão de moedas', 'Earn 1 octillion coins'],
    ['Cem por Segundo', 'A Hundred per Second'], ['Produza 100 moedas por segundo', 'Produce 100 coins per second'],
    ['Um Milhão por Segundo', 'A Million per Second'], ['Produza 1 milhão por segundo', 'Produce 1 million per second'],
    ['Usina Infinita', 'Endless Powerhouse'], ['Produza 1 trilhão por segundo', 'Produce 1 trillion per second'],
    ['Ativação Manual', 'Manual Activation'], ['Ative um boost', 'Activate a boost'],
    ['Aproveitador', 'Opportunist'], ['Ative 10 boosts', 'Activate 10 boosts'],
    ['Maestro dos Boosts', 'Boost Maestro'], ['Ative 50 boosts', 'Activate 50 boosts'],
    ['Bem-vindo de Volta', 'Welcome Back'], ['Volte ao jogo depois de ficar fora', 'Come back after being away'],
    ['Dorminhoco', 'Heavy Sleeper'], ['Volte depois de 8 horas fora', 'Come back after 8 hours away'],
    ['Complete 5 níveis', 'Complete 5 levels'], ['Complete 10 níveis', 'Complete 10 levels'], ['Complete 25 níveis', 'Complete 25 levels'],
    ['Complete 50 níveis', 'Complete 50 levels'], ['Complete 100 níveis', 'Complete 100 levels'],
    ['Complete 50 tubos', 'Complete 50 tubes'], ['Complete 500 tubos', 'Complete 500 tubes']
  ];

  var EXACT = {};
  PAIRS.forEach(function (p) { EXACT[p[0]] = p[1]; });

  var UNIT = { 'nível': 'level', 'níveis': 'levels', 'tubo': 'tube', 'tubos': 'tubes', 'moeda': 'coin', 'moedas': 'coins',
    'máquina': 'machine', 'máquinas': 'machines', 'boost': 'boost', 'boosts': 'boosts', 'melhoria': 'upgrade', 'melhorias': 'upgrades',
    'anúncio': 'ad', 'anúncios': 'ads', 'dia': 'day', 'dias': 'days' };
  var VERB = { Complete: 'Complete', Ganhe: 'Earn', Compre: 'Buy', Ative: 'Activate', Instale: 'Install', Assista: 'Watch' };
  function plural(n, one, many) { return Number(n) === 1 ? one : many; }

  // ----- frases montadas: [expressao, funcao] -----
  var PATTERNS = [
    [/^Nível (\d+)$/, function (m) { return 'Level ' + m[1]; }],
    [/^(\d+) máquinas?$/, function (m) { return m[1] + ' ' + plural(m[1], 'machine', 'machines'); }],
    [/^Precisa de (\d+) (.+)$/, function (m) { var name = T(m[2]); return 'Requires ' + m[1] + ' ' + (Number(m[1]) > 1 && !/s$/.test(name) ? name + 's' : name); }],
    [/^Chegue ao nível (\d+)$/, function (m) { return 'Reach level ' + m[1]; }],
    [/^Comprar ×(\d+)$/, function (m) { return 'Buy ×' + m[1]; }],
    [/^\+(.+)\/s no total$/, function (m) { return '+' + m[1] + '/s total'; }],
    [/^\+(.+)\/s cada$/, function (m) { return '+' + m[1] + '/s each'; }],
    [/^dobra com (\d+)$/, function (m) { return 'doubles at ' + m[1]; }],
    [/^(\d+) máquinas ainda por descobrir\.\.\.$/, function (m) { return m[1] + ' machines still to discover...'; }],
    [/^(\d+) de (\d+) instalados$/, function (m) { return m[1] + ' of ' + m[2] + ' installed'; }],
    [/^(.+) moedas\/s$/, function (m) { return m[1] + ' coins/s'; }],
    [/^Bônus do puzzle ×(.+)$/, function (m) { return 'Puzzle bonus ×' + m[1]; }],
    [/^Offline até (\d+) h$/, function (m) { return 'Offline up to ' + m[1] + ' h'; }],
    [/^(.+) nível (\d+)! Produção ×2$/, function (m) { return T(m[1]) + ' level ' + m[2] + '! Production ×2'; }],
    [/^Você ficou fora por (.+?)(?: \(contamos no máximo (.+?)\))?\. A fábrica produziu$/, function (m) {
      return 'You were away for ' + m[1] + (m[2] ? ' (we count up to ' + m[2] + ')' : '') + '. Your factory produced'; }],
    [/^(\d+) boosts? prontos? para ativar!$/, function (m) { return m[1] + ' ' + plural(m[1], 'boost is', 'boosts are') + ' ready to activate!'; }],
    [/^Tubo (\d+)$/, function (m) { return 'Tube ' + m[1]; }],
    [/^(\d+) peças$/, function (m) { return m[1] + ' pieces'; }],
    [/^escolhido$/, function () { return 'selected'; }],
    [/^aceita a jogada$/, function () { return 'accepts the move'; }],
    [/^vazio$/, function () { return 'empty'; }],
    [/^Nível (\d+) completo!$/, function (m) { return 'Level ' + m[1] + ' complete!'; }],
    [/^(\d+) movimentos?$/, function (m) { return m[1] + ' ' + plural(m[1], 'move', 'moves'); }],
    [/^\+(\d+) moedas de bônus$/, function (m) { return '+' + m[1] + ' bonus coins'; }],
    [/^produção da fábrica \+(\d+)%$/, function (m) { return 'factory production +' + m[1] + '%'; }],
    [/^(\d+) de (\d+) conquistas$/, function (m) { return m[1] + ' of ' + m[2] + ' achievements'; }],
    [/^(\d+) gemas para resgatar$/, function (m) { return m[1] + ' gems to claim'; }],
    [/^\+(\d+) gemas?!?$/, function (m) { return '+' + m[1] + ' ' + plural(m[1], 'gem', 'gems') + (/!$/.test(m.input) ? '!' : ''); }],
    [/^\+(\d+) gemas? \(modo de teste\)$/, function (m) { return '+' + m[1] + ' ' + plural(m[1], 'gem', 'gems') + ' (test mode)'; }],
    [/^(\d+) gemas$/, function (m) { return m[1] + ' gems'; }],
    [/^(.+) \(\+(\d+)\)$/, function (m) { return T(m[1]) + ' (+' + m[2] + ')'; }],
    [/^(.+) ativado!(?: (.+))?$/, function (m) { return T(m[1]) + ' activated!' + (m[2] ? ' ' + T(m[2]) : ''); }],
    [/^(.+) aberto: \+(.+) moedas$/, function (m) { return T(m[1]) + ' opened: +' + m[2] + ' coins'; }],
    [/^(.+) pronto para ativar!$/, function (m) { return T(m[1]) + ' ready to activate!'; }],
    [/^(.+)! Toque nele para ativar\.$/, function (m) { return T(m[1]) + '! Tap it to activate.'; }],
    [/^(Complete|Ganhe|Compre|Ative|Instale|Assista) (\S+) (\S+)$/, function (m) {
      return (VERB[m[1]] || m[1]) + ' ' + m[2] + ' ' + (UNIT[m[3]] || m[3]); }],
    [/^Jogue em (\S+) dias? diferentes$/, function (m) { return 'Play on ' + m[1] + ' different ' + plural(m[1], 'day', 'days'); }],
    [/^Reinicia em (.+)$/, function (m) { return 'Resets in ' + T(m[1]); }],
    [/^(\d+) (dia|dias) (\d+) h$/, function (m) { return m[1] + ' ' + plural(m[1], 'day', 'days') + ' ' + m[3] + ' h'; }],
    [/^(\d+) de (\d+)$/, function (m) { return m[1] + ' of ' + m[2]; }],
    [/^(\d+) \/ (\d+) resgatadas$/, function (m) { return m[1] + ' / ' + m[2] + ' claimed'; }],
    [/^Bônus: complete todas as (.+)$/, function (m) { return 'Bonus: complete all ' + T(m[1]) + ' missions'; }],
    [/^(.+) de produção$/, function (m) { return m[1] + ' of production'; }],
    [/^Bônus resgatado! \+(\d+) gemas$/, function (m) { return 'Bonus claimed! +' + m[1] + ' gems'; }],
    [/^Missão resgatada! \+(\d+) gemas$/, function (m) { return 'Mission claimed! +' + m[1] + ' gems'; }],
    [/^Restam (\d+) hoje$/, function (m) { return m[1] + ' left today'; }],
    [/^Recarregar (.+)$/, function (m) { return 'Recharge ' + T(m[1]); }],
    [/^Recarrega em (.+)$/, function (m) { return 'Recharges in ' + m[1]; }],
    [/^Assista a um anúncio e ganhe (\d+) gemas? \(até (\d+) por dia\)$/, function (m) {
      return 'Watch an ad and earn ' + m[1] + ' ' + plural(m[1], 'gem', 'gems') + ' (up to ' + m[2] + ' per day)'; }],
    [/^\+(.+) moedas$/, function (m) { return '+' + m[1] + ' coins'; }],
    [/^(.+): produção ×(\d+)$/, function (m) { return T(m[1]) + ': production ×' + m[2]; }],
    [/^Anúncio de teste$/, function () { return 'Test ad'; }]
  ];

  var SEPARATORS = [' · ', ': ', '! ', '. ', ', ', ' - '];
  var cache = {};

  // Traduz um trecho (sem espacos nas pontas). Devolve o proprio texto se nao souber.
  function T(core) {
    if (EXACT.hasOwnProperty(core)) return EXACT[core];
    if (cache.hasOwnProperty(core)) return cache[core];
    var res = core, i, m;
    for (i = 0; i < PATTERNS.length; i++) {
      m = core.match(PATTERNS[i][0]);
      if (m) { res = PATTERNS[i][1](m); break; }
    }
    if (res === core) {   // tenta quebrar por separadores e traduzir cada parte
      for (i = 0; i < SEPARATORS.length && res === core; i++) {
        var sep = SEPARATORS[i], at = core.indexOf(sep);
        if (at > 0) {
          var joined = T(core.slice(0, at)) + sep + T(core.slice(at + sep.length));
          if (joined !== core) res = joined;
        }
      }
    }
    var keys = Object.keys(cache);
    if (keys.length > 3000) cache = {};
    cache[core] = res;
    return res;
  }

  // Traduz um texto qualquer preservando os espacos das pontas.
  function tr(s) {
    if (lang !== 'en' || typeof s !== 'string' || !/[A-Za-zÀ-ÿ]{2,}/.test(s)) return s;
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return s;
    var t = T(m[2]);
    return t === m[2] ? s : m[1] + t + m[3];
  }

  // ----- DOM -----
  var observer = null;
  var ATTRS = ['title', 'aria-label'];
  var SKIP = { SCRIPT: 1, STYLE: 1, CANVAS: 1, NOSCRIPT: 0 };

  function doText(node) {
    var v = node.nodeValue;
    if (node.__i18nTr !== undefined && v === node.__i18nTr) return;   // fomos nos que escrevemos isso
    node.__i18nPt = v;
    var t = tr(v);
    if (t !== v) { node.__i18nTr = t; node.nodeValue = t; } else { node.__i18nTr = undefined; }
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      el.__i18nA = el.__i18nA || {};
      if (el.__i18nA[a] && el.__i18nA[a].tr === v) continue;
      var t = tr(v);
      el.__i18nA[a] = { pt: v, tr: t };
      if (t !== v) el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    doAttrs(root);
    if (root.tagName === 'CANVAS') return;
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  function restore(root) {
    if (root.nodeType === 3) { if (root.__i18nTr !== undefined && root.nodeValue === root.__i18nTr) root.nodeValue = root.__i18nPt; return; }
    if (root.nodeType !== 1) return;
    if (root.__i18nA) Object.keys(root.__i18nA).forEach(function (a) {
      var x = root.__i18nA[a];
      if (root.getAttribute(a) === x.tr) root.setAttribute(a, x.pt);
    });
    for (var c = root.firstChild; c; c = c.nextSibling) restore(c);
  }
  function onMutations(list) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doAttrs(r.target);
      else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
  }
  var PT_TITLE = 'Fábrica de Separar';
  var PT_DESC = null;
  function setDocText() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    document.title = lang === 'en' ? T(PT_TITLE) : PT_TITLE;
    var meta = document.querySelector('meta[name=description]');
    if (meta) {
      if (PT_DESC === null) PT_DESC = meta.getAttribute('content');
      meta.setAttribute('content', lang === 'en' ? T(PT_DESC) : PT_DESC);
    }
  }

  function set(l) {
    if (l !== 'pt' && l !== 'en') return;
    lang = l;
    if (window.Economy && Economy.setDecimal) Economy.setDecimal(l === 'en' ? '.' : ',');
    setDocText();
    if (l === 'en') {
      walk(document.body);
      if (!observer) {
        observer = new MutationObserver(onMutations);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      }
    } else {
      if (observer) { observer.disconnect(); observer = null; }
      restore(document.body);
    }
    var b = document.getElementById('btn-lang');
    if (b) { b.textContent = l === 'en' ? 'EN' : 'PT'; }
    if (window.Game && Game.emit) Game.emit();   // redesenha textos que dependem do idioma (números)
  }

  function detect() {
    var saved = window.Game && Game.state && Game.state.settings && Game.state.settings.lang;
    if (saved === 'pt' || saved === 'en') return saved;
    // O CrazyGames pede: usar o idioma do SDK e, sem ele, inglês. Só vira português se o portal disser que o jogador é pt.
    var loc = window.Platform && Platform.locale ? Platform.locale() : '';
    return /^pt/i.test(loc) ? 'pt' : 'en';
  }

  function init() {
    var b = document.getElementById('btn-lang');
    if (b) b.addEventListener('click', function () {
      var next = lang === 'en' ? 'pt' : 'en';
      Game.state.settings.lang = next;
      Game.save();
      set(next);
      if (window.Sfx) Sfx.click();
    });
    set(detect());
  }

  return { init: init, set: set, t: tr, lang: function () { return lang; }, translate: T };
})();
