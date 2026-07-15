(function () {
  'use strict';

  // Desregistra qualquer Service Worker antigo (sem cache).
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
    } catch (_) {}
  }

  // ============= GATE: bloqueia PC e tráfego sem UTM =============
  // Redireciona para havan.com.br se não for mobile ou se não tiver parâmetro
  // de anúncio (utm_source, fbclid, ttclid, gclid). Executa antes de qualquer
  // outra coisa para não desperdiçar recursos.
  // Gate mobile/UTM desativado temporariamente para preview.
  // (function gate() {
  //   try {
  //     var ua = navigator.userAgent || '';
  //     var isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile|webOS|BlackBerry/i.test(ua);
  //     var qs = new URLSearchParams(location.search || '');
  //     var hasAdParam = qs.has('utm_source') || qs.has('fbclid') || qs.has('ttclid') || qs.has('gclid') || qs.has('utm_campaign');
  //     if (location.pathname.indexOf('/funil/') !== 0) return;
  //     if (!isMobile || !hasAdParam) {
  //       location.replace('https://www.havan.com.br/');
  //     }
  //   } catch (_) {}
  // })();

  var match = location.pathname.match(/\/funil\/(\d+)(?:\/|$)/);
  var current = match ? Number(match[1]) : 0;
  var prefetched = new Set();

  // Conexão: evita gastar dados em redes ruins.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slow = !!(conn && (conn.saveData || /(^|-)2g$/i.test(conn.effectiveType || '')));

  function keepParams(url) {
    if (!location.search || !url) return url;
    if (url.indexOf('#') === 0 || url.indexOf('javascript:') === 0) return url;
    if (url.indexOf('?') !== -1) return url;
    return url + location.search;
  }

  function prefetch(url) {
    if (!url || slow || prefetched.has(url)) return;
    prefetched.add(url);
    try {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = url;
      document.head.appendChild(link);
    } catch (_) {}
  }

  function warmNext() {
    if (!current || current >= 12) return;
    prefetch('/funil/' + (current + 1) + '/index.html');
  }

  function go(url) { location.href = keepParams(url); }
  window.fastGo = go;

  function isInternal(href) {
    return href && href.indexOf('#') !== 0 && href.indexOf('javascript:') !== 0 &&
      (href.indexOf('/funil/') !== -1 || href.indexOf('../') === 0 || href.indexOf('./') === 0);
  }

  function onHover(e) {
    var t = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!t) return;
    var h = t.getAttribute('href');
    if (isInternal(h)) prefetch(keepParams(h));
  }

  document.addEventListener('pointerover', onHover, { passive: true, capture: true });
  document.addEventListener('touchstart', onHover, { passive: true, capture: true });

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!t) return;
    var h = t.getAttribute('href');
    if (!isInternal(h)) return;
    e.preventDefault();
    go(h);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', warmNext, { once: true });
  } else {
    warmNext();
  }
})();
