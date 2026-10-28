// Ícones do jogo, desenhados como SVG (nenhum emoji). Traço de 2px na cor do texto.
// Uso: Icons.svg('bolt')  ou, no HTML,  <span data-icon="bolt"></span>  +  Icons.fill(document).
var Icons = (function () {
  var P = {
    // navegação e controles
    tube:    '<path d="M9 3h6"/><path d="M10 3v6.5L5.6 18a2.6 2.6 0 0 0 2.3 3.8h8.2a2.6 2.6 0 0 0 2.3-3.8L14 9.5V3"/><path d="M7.5 15h9"/>',
    factory: '<path d="M3 21V11l6 4v-4l6 4V4h4v17z"/><path d="M7 21v-3M12 21v-3"/>',
    shapes:  '<circle cx="7" cy="7" r="3.2"/><rect x="14" y="4" width="6" height="6" rx="1"/><path d="M7 14l3.2 6H3.8z"/><path d="M17 13.5l3.2 3.2-3.2 3.2-3.2-3.2z"/>',
    volume:  '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9.5a3.6 3.6 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/>',
    mute:    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    undo:    '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    restart: '<path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/>',
    lock:    '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check:   '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    coin:    '<circle cx="12" cy="12" r="9.5" fill="#ffd60a" stroke="#c99a00" stroke-width="1.6"/><circle cx="12" cy="12" r="6" fill="none" stroke="#c99a00" stroke-width="1.6"/><path d="M12 8.5v7" stroke="#c99a00" stroke-width="1.8"/>',
    star:    '<path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" fill="currentColor" stroke="none"/>',
    starO:   '<path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" stroke-width="1.6"/>',
    hand:    '<path d="M9 11V5.5a1.6 1.6 0 0 1 3.2 0V10.5a1.6 1.6 0 0 1 3.2.3 1.6 1.6 0 0 1 3.1.6V16a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 15a1.7 1.7 0 0 1 2.6-2.1L9 15.2" fill="#fff" stroke="#1b1f2a" stroke-width="1.5"/>',
    // máquinas
    conveyor: '<rect x="2" y="13" width="20" height="6" rx="3"/><circle cx="6" cy="16" r="1"/><circle cx="12" cy="16" r="1"/><circle cx="18" cy="16" r="1"/><path d="M5 9h5M14 9h5M17 7l2 2-2 2"/>',
    arm:      '<path d="M3 21h9"/><path d="M7.5 21v-6"/><circle cx="7.5" cy="13.5" r="2"/><path d="M9 12l5.5-5.5"/><circle cx="16" cy="5.5" r="2"/><path d="M17.5 7l2.5 3.5M17.5 7l3.5 1"/>',
    scanner:  '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M3 12h18"/>',
    assembly: '<rect x="3" y="15" width="18" height="5" rx="2"/><path d="M6 15V9h4v6M14 15V6h4v9"/><path d="M8 6v3"/>',
    city:     '<path d="M3 21V9h6v12M9 21V4h7v17M16 21v-9h5v9M2 21h20"/><path d="M11.5 8h2M11.5 12h2M11.5 16h2"/>',
    funnel:   '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    magnet:   '<path d="M5 3v8a7 7 0 0 0 14 0V3h-4v8a3 3 0 0 1-6 0V3z"/><path d="M5 7h4M15 7h4"/>',
    sieve:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14M3 9.7h18M3 14.3h18"/>',
    camera:   '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    press:    '<path d="M5 3h14M12 3v10"/><rect x="7" y="13" width="10" height="4" rx="1"/><path d="M3 21h18M6 21v-2h12v2"/>',
    mixer:    '<path d="M5 8h14l-2 12H7z"/><path d="M12 3v9"/><path d="M8 13c2 2 6 2 8 0"/>',
    drone:    '<circle cx="12" cy="12" r="2.5"/><path d="M9.5 9.5L6 6M14.5 9.5L18 6M9.5 14.5L6 18M14.5 14.5L18 18"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>',
    recycle:  '<path d="M20 12a8 8 0 0 0-14-5.3L4 9"/><path d="M4 4v5h5"/><path d="M4 12a8 8 0 0 0 14 5.3L20 15"/><path d="M20 20v-5h-5"/>',
    boiler:   '<path d="M6 21V10a6 6 0 0 1 12 0v11z"/><path d="M12 4V2M10 15h4M9 18h6"/>',
    generator:'<circle cx="12" cy="12" r="9"/><path d="M13 5l-5 8h4l-1 6 5-8h-4z"/>',
    tower:    '<path d="M8 3h8l2 18H6z"/><path d="M7 9h10M6.5 15h11"/>',
    robot:    '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.5" r="1.3"/><circle cx="9" cy="13" r="1.5"/><circle cx="15" cy="13" r="1.5"/><path d="M9 17h6M2 13h3M19 13h3"/>',
    atom:     '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    network:  '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5" r="2.2"/><circle cx="19" cy="19" r="2.2"/><circle cx="12" cy="12" r="2.2"/><path d="M7 12h3M14 11l3-5M14 13l3 5"/>',
    orbit:    '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="20" cy="7" r="1.3"/>',
    // melhorias
    bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    gear:    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5V2M12 22v-2.5M4.5 12H2M22 12h-2.5M6.7 6.7L5 5M19 19l-1.7-1.7M6.7 17.3L5 19M19 5l-1.7 1.7"/>',
    turbo:   '<path d="M3 6l6 6-6 6M11 6l6 6-6 6"/><path d="M20 6v12"/>',
    wrench:  '<path d="M14.7 6.3a4 4 0 0 0-5.4 5L3 17.6 6.4 21l6.3-6.3a4 4 0 0 0 5-5.4l-2.6 2.6-2.5-.6-.6-2.5z"/>',
    target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    eye:     '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    flame:   '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-3 2-4 4-4 6-2-1-3-3-3-5-3 3-3 5-3 9a7 7 0 0 0 7 7z"/>',
    layers:  '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    chip:    '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    hexagon: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4"/>',
    bulb:    '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    shield:  '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-1.5-1-3s1-2 2.5-2H18a3 3 0 0 0 3-3C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    trophy:  '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
    crown:   '<path d="M3 18L2 7l6 5 4-8 4 8 6-5-1 11z"/><path d="M3 21h18"/>',
    battery: '<rect x="2" y="8" width="17" height="9" rx="2"/><path d="M22 11v3"/><path d="M6 11v3M10 11v3"/>',
    clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    play:    '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    gem:     '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
    medal:   '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/><path d="M12 6.5v5M10 9h4"/>',
    gift:    '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 14h18"/><path d="M12 9C9 3 5 6 7.5 9M12 9c3-6 7-3 4.5 0"/>',
    hourglass: '<path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4"/>'
  };

  // Formas das cores (modo para daltonismo): preenchidas, desenhadas em 24x24.
  var SHAPES = [
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',                                                     // círculo
    'M12 3l9 17H3z',                                                                            // triângulo
    'M5 5h14v14H5z',                                                                            // quadrado
    'M12 2l10 10-10 10L2 12z',                                                                  // losango
    'M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z',          // estrela
    'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',                                                            // cruz
    'M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z',                 // coração
    'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',                                       // lua
    'M6 3l6 6 6-6 3 3-6 6 6 6-3 3-6-6-6 6-3-3 6-6-6-6z'                                         // xis
  ];

  function svg(name, cls) {
    var inner = P[name] || '';
    return '<svg class="ic ic-' + name + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>';
  }

  function shape(i) {
    return '<svg class="sym" viewBox="0 0 24 24" aria-hidden="true"><path d="' + SHAPES[i % SHAPES.length] + '" fill="currentColor"/></svg>';
  }

  // Troca todo <span data-icon="nome"></span> pelo ícone.
  function fill(root) {
    var nodes = root.querySelectorAll('[data-icon]');
    for (var i = 0; i < nodes.length; i++) nodes[i].innerHTML = svg(nodes[i].getAttribute('data-icon'));
  }

  // Imagem do ícone numa cor fixa, para desenhar no canvas (guarda as já criadas).
  var imgCache = {};
  function image(name, color) {
    var key = name + color;
    if (!imgCache[key]) {
      var img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || '') + '</svg>');
      imgCache[key] = img;
    }
    return imgCache[key];
  }

  return { svg: svg, shape: shape, fill: fill, image: image, SHAPES: SHAPES, names: Object.keys(P), has: function (n) { return !!P[n]; } };
})();
