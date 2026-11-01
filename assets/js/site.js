(function(){
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
  document.documentElement.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* entrate */
  var els = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(el){ io.observe(el); });
    requestAnimationFrame(function(){ $$('.hero .rv').forEach(function(el){ el.classList.add('in'); }); });
  } else els.forEach(function(el){ el.classList.add('in'); });

  /* menu */
  var head = $('header'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function(){ var o = head.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Chiudi il menu' : 'Apri il menu'); });
    $$('.overlay a').forEach(function(a){ a.addEventListener('click', function(){ head.classList.remove('open'); burger.setAttribute('aria-expanded', false); }); });
  }

  /* galleria orizzontale */
  var strip = $('#strip');
  if (strip) $$('.strip-nav .round').forEach(function(b){ b.addEventListener('click', function(){ strip.scrollBy({ left: +b.dataset.dir * strip.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' }); }); });

  /* usato: che misura cercate? */
  var range = $('#len');
  if (range) {
    var out = $('#len-out'), hint = $('#hint'), img = $('#near-img'), cap = $('#near-cap'), link = $('#near-link');
    var rows = $$('#list .row');
    var nuove = [['C38', 11.6], ['C42', 12.8], ['C46', 13.95]];
    var update = function(){
      var v = parseFloat(range.value), near = null, best = 99, hits = 0;
      out.textContent = v.toFixed(1).replace('.', ',') + ' metri · ' + Math.round(v / 0.3048) + ' piedi';
      rows.forEach(function(r){ var d = Math.abs(parseFloat(r.dataset.len) - v), m = d <= 0.5; r.classList.toggle('match', m); if (m) hits++; if (d < best) { best = d; near = r; } });
      var nm = nuove.filter(function(n){ return Math.abs(n[1] - v) <= 0.6; }).map(function(n){ return n[0]; });
      hint.textContent = (hits ? hits + (hits > 1 ? ' barche usate' : ' barca usata') + ' entro mezzo metro.' : 'Nessuna usata entro mezzo metro.') + (nm.length ? ' Tra le nuove: la ' + nm.join(' e la ') + '.' : '');
      if (near) {
        var name = near.querySelector('.n').firstChild.textContent.trim();
        img.src = near.dataset.img; img.alt = name; link.href = near.href;
        cap.textContent = 'La più vicina: ' + name + ' del ' + near.querySelector('.y').textContent + ', ' + near.querySelector('.l').textContent.replace(' m', ' metri') + '. Aprite la scheda.';
      }
    };
    range.addEventListener('input', update); update();
  }

  /* elenco barche: filtri e ordinamento */
  var cards = $('#cards');
  if (cards) {
    var chips = $$('.chip'), sel = $('#sort'), empty = $('#empty'), all = $$('.card', cards), f = 'tutte';
    var apply = function(){
      var shown = 0;
      all.forEach(function(c){ var ok = f === 'tutte' || c.dataset.cond === f || c.dataset.tipo === f; c.hidden = !ok; if (ok) shown++; });
      empty.hidden = shown > 0;
      var k = sel.value, arr = all.slice();
      var num = function(c, a){ return parseFloat(c.dataset[a]) || 0; };
      if (k !== 'std') arr.sort(function(a, b){
        if (k === 'len-a') return num(a, 'len') - num(b, 'len');
        if (k === 'len-d') return num(b, 'len') - num(a, 'len');
        if (k === 'an-d') return num(b, 'anno') - num(a, 'anno');
        var pa = num(a, 'prezzo') || 1e9, pb = num(b, 'prezzo') || 1e9;
        return k === 'pr-a' ? pa - pb : (num(b, 'prezzo') - num(a, 'prezzo'));
      });
      arr.forEach(function(c){ cards.appendChild(c); });
    };
    chips.forEach(function(c){ c.addEventListener('click', function(){ f = c.dataset.f; chips.forEach(function(x){ x.setAttribute('aria-pressed', x === c); }); apply(); }); });
    sel.addEventListener('change', apply);
    var q = new URLSearchParams(location.search).get('filtro');
    if (q) { var c0 = chips.filter(function(c){ return c.dataset.f === q; })[0]; if (c0) c0.click(); }
  }

  /* scheda barca: galleria e foto ingrandita */
  var gal = $('[data-gallery]');
  if (gal) {
    var main = $('#gal-main'), thumbs = $$('.thumbs button', gal), lb = $('#lb'), lbImg = lb && $('img', lb), idx = 0;
    var srcs = thumbs.length ? thumbs.map(function(t){ return t.dataset.src; }) : [main.src];
    var show = function(i){
      idx = (i + srcs.length) % srcs.length; main.src = srcs[idx];
      main.alt = main.alt.replace(/foto \d+ di/, 'foto ' + (idx + 1) + ' di');
      thumbs.forEach(function(t, k){ t.setAttribute('aria-current', k === idx); });
      if (lb && lb.open) lbImg.src = srcs[idx];
    };
    thumbs.forEach(function(t, k){ t.addEventListener('click', function(){ show(k); }); });
    if (lb && lb.showModal) {
      main.addEventListener('click', function(){ lbImg.src = srcs[idx]; lbImg.alt = main.alt; lb.showModal(); });
      $$('[data-step]', lb).forEach(function(b){ b.addEventListener('click', function(){ show(idx + +b.dataset.step); }); });
      $('[data-close]', lb).addEventListener('click', function(){ lb.close(); });
      lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
      document.addEventListener('keydown', function(e){ if (!lb.open) return; if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1); });
    }
  }

  /* moduli: invio a Formspree quando c'è l'indirizzo, altrimenti programma di posta */
  $$('form.js-form[data-endpoint]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = $('button[type=submit]', form); btn.disabled = true;
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function(r){ if (!r.ok) throw new Error(r.status); form.reset(); form.closest('.form').classList.add('sent'); })
        .catch(function(){ var ok = $('.ok', form); ok.textContent = 'Invio non riuscito: scriveteci a info@goldsailravenna.com.'; form.closest('.form').classList.add('sent'); })
        .then(function(){ btn.disabled = false; });
    });
  });
})();
