(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var list = document.querySelector('.nav ul');
  if (btn && list) {
    btn.addEventListener('click', function () {
      var open = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
  }

  // Hero masked headline
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('ready'); }, 60); });

  // Staggered section entrances
  var groups = document.querySelectorAll('[data-stagger]');
  groups.forEach(function (g) {
    var kids = g.querySelectorAll(':scope > *');
    kids.forEach(function (k, i) { k.classList.add('rise'); k.style.setProperty('--d', (i * 75) + 'ms'); });
  });
  var targets = document.querySelectorAll('.rise, .slowzoom');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }
  // Safety: never leave content hidden
  setTimeout(function () { targets.forEach(function (t) { t.classList.add('in'); }); }, 4000);

  var THEMES = {
    corona: 'Coronavirus vaccines and COVID-19 immunity',
    herpes: 'Herpes immunity and therapeutic vaccines',
    genetics: 'Immunogenetics and transplantation',
    global: 'Global Burden of Disease',
    ai: 'AI in vaccinology'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function link(p) {
    if (p.doi) return 'https://doi.org/' + p.doi;
    if (p.pmid) return 'https://pubmed.ncbi.nlm.nih.gov/' + p.pmid + '/';
    return 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.t);
  }

  // Home: book-spine shelf of selected lead-author papers
  var shelf = document.getElementById('shelf');
  if (shelf && window.PUBS) {
    var picks = window.PUBS.filter(function (p) { return p.lead && p.ty !== 'preprint'; }).slice(0, 26);
    shelf.innerHTML = picks.map(function (p) {
      var t = p.t.replace(/\(\+\)/g, '+');
      return '<a class="spine" data-th="' + p.th + '" href="' + link(p) + '" target="_blank" rel="noopener" title="' + esc(t + ' (' + p.j + ', ' + p.y + ')') + '">' +
        '<span class="t">' + esc(t) + '</span><span class="y">' + esc(p.j) + ' ' + p.y + '</span></a>';
    }).join('');
  }

  // Publications explorer
  var host = document.getElementById('pub-list');
  if (host && window.PUBS) {
    var all = window.PUBS;
    var state = { th: 'all', ty: 'all', lead: false, q: '' };
    var count = function (fn) { return all.filter(fn).length; };
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var k = el.getAttribute('data-count');
      var n = k === 'all' ? all.length : k === 'lead' ? count(function (p) { return p.lead; }) :
        THEMES[k] ? count(function (p) { return p.th === k; }) : count(function (p) { return p.ty === k; });
      el.textContent = n;
    });
    function setPressed(group, val) {
      document.querySelectorAll('[data-group="' + group + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-val') === val ? 'true' : 'false');
      });
    }
    document.querySelectorAll('.chip[data-group]').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-group'), v = b.getAttribute('data-val');
        if (g === 'lead') { state.lead = !state.lead; b.setAttribute('aria-pressed', state.lead ? 'true' : 'false'); }
        else { state[g] = v; setPressed(g, v); }
        render();
      });
    });
    var input = document.getElementById('q');
    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { state.q = input.value.trim().toLowerCase(); render(); }, 120); });
    var reset = document.getElementById('reset');
    if (reset) reset.addEventListener('click', function () {
      state = { th: 'all', ty: 'all', lead: false, q: '' }; input.value = '';
      setPressed('th', 'all'); setPressed('ty', 'all');
      document.querySelector('[data-group="lead"]').setAttribute('aria-pressed', 'false'); render();
    });
    var status = document.getElementById('pub-status');
    function authors(a) {
      return esc(a).replace(/Prakash S\b/g, '<b>Prakash S</b>');
    }
    function render() {
      var rows = all.filter(function (p) {
        if (state.th !== 'all' && p.th !== state.th) return false;
        if (state.ty !== 'all' && p.ty !== state.ty) return false;
        if (state.lead && !p.lead) return false;
        if (state.q) {
          var hay = (p.t + ' ' + p.a + ' ' + p.j + ' ' + p.y + ' ' + p.doi + ' ' + p.pmid).toLowerCase();
          if (hay.indexOf(state.q) === -1) return false;
        }
        return true;
      });
      status.textContent = rows.length === all.length ? 'Showing all ' + all.length + ' publications, newest first.' : 'Showing ' + rows.length + ' of ' + all.length + ' publications.';
      if (!rows.length) {
        host.innerHTML = '<p class="empty">No publications match these filters. <button class="chip" type="button" id="reset2">Clear all filters</button></p>';
        document.getElementById('reset2').addEventListener('click', function () { reset.click(); });
        return;
      }
      var byYear = {};
      rows.forEach(function (p) { (byYear[p.y] = byYear[p.y] || []).push(p); });
      var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
      host.innerHTML = years.map(function (y) {
        return '<div class="pub-year"><h3>' + y + '</h3><ol>' + byYear[y].map(function (p) {
          var vol = (p.v ? ' ' + esc(p.v) : '') + (p.i ? esc(p.i) : '') + (p.pg ? ':' + esc(p.pg) : '');
          var tags = [];
          if (p.lead && !p.cf) tags.push('<span class="tag lead">First author</span>');
          if (p.cf) tags.push('<span class="tag lead">Co-first author</span>');
          tags.push('<span class="tag">' + esc(THEMES[p.th]) + '</span>');
          if (p.ty === 'preprint') tags.push('<span class="tag">Preprint</span>');
          if (p.ty === 'review') tags.push('<span class="tag">Review</span>');
          if (p.ty === 'consortium') tags.push('<span class="tag">Consortium author</span>');
          var ids = [];
          if (p.doi) ids.push('<a href="https://doi.org/' + esc(p.doi) + '" target="_blank" rel="noopener">DOI</a>');
          if (p.pmid) ids.push('<a href="https://pubmed.ncbi.nlm.nih.gov/' + esc(p.pmid) + '/" target="_blank" rel="noopener">PubMed ' + esc(p.pmid) + '</a>');
          if (p.pmc) ids.push('<a href="https://pmc.ncbi.nlm.nih.gov/articles/' + esc(p.pmc) + '/" target="_blank" rel="noopener">Full text (PMC)</a>');
          return '<li class="pub"><a class="ti" href="' + link(p) + '" target="_blank" rel="noopener">' + esc(p.t) + '</a>' +
            '<span class="au">' + authors(p.a) + '.</span>' +
            '<span class="meta"><span><i>' + esc(p.j) + '</i>. ' + esc(p.d) + vol + '.</span>' + ids.join('') + '</span>' +
            '<span class="meta">' + tags.join('') + '</span></li>';
        }).join('') + '</ol></div>';
      }).join('');
    }
    var params = new URLSearchParams(location.search);
    if (params.get('theme') && THEMES[params.get('theme')]) { state.th = params.get('theme'); setPressed('th', state.th); }
    render();
  }
})();
