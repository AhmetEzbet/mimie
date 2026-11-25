/* Mimie v2 — vanilla, no 3D. Product dialog, Tag builder, lightbox, video. */
(function () {
  'use strict';
  var WA_NUMBER = '';
  var wa = function (t) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(t); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var H = function (c) { return c.replace('#', '').toUpperCase(); };
  if (WA_NUMBER) $$('.wa-empty').forEach(function (e) { e.remove(); });

  /* header hairline after scroll */
  var hd = $('#hd'); var onS = function () { hd.classList.toggle('sc', scrollY > 8); }; addEventListener('scroll', onS, { passive: true }); onS();

  /* fade-in photos */

  /* radio groups (swatches + segmented) with roving tabindex */
  function radio(group, onPick) {
    var items = $$('[role=radio]', group);
    function set(b, fire) {
      items.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      if (fire) onPick(b);
    }
    items.forEach(function (b, i) {
      b.addEventListener('click', function () { set(b, true); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return; e.preventDefault(); var n = items[(i + d + items.length) % items.length]; n.focus(); set(n, true);
      });
    });
    return { val: function () { var b = items.filter(function (x) { return x.getAttribute('aria-checked') === 'true'; })[0]; return { c: b.dataset.c, n: b.dataset.n }; }, set: function (c) { var b = items.filter(function (x) { return x.dataset.c === c; })[0]; if (b) set(b, false); } };
  }
  function swHTML(k, label, opts, def) {
    return '<div class="fld"><div class="fl"><span>' + label + '</span><b data-o="' + k + '">' + opts.filter(function (o) { return o[0] === def; })[0][1] + '</b></div><div class="sws" role="radiogroup" aria-label="' + label + '" data-k="' + k + '">' +
      opts.map(function (o) { var on = o[0] === def; return '<button type="button" role="radio" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" class="sw' + (/^#(F7DE69|A6DED5|F4B6C2|B6C98B|F4A7B9|FFFFFF)$/i.test(o[0]) ? ' lt' : '') + '" style="--c:' + o[0] + '" data-c="' + o[0] + '" data-n="' + o[1] + '" aria-label="' + o[1] + '"></button>'; }).join('') + '</div></div>';
  }

  /* ---------- product dialog ---------- */
  var pd = $('#pd'), pdImg = $('#pdImg'), pdI = $('#pdI'), pdT = $('#pdT'), pdF = $('#pdF'), pdR = $('#pdR'), pdWa = $('#pdWa'), pdBack = $('#pdBack'), lastFocus = null;
  function swap(img, src, cb) { if (reduce) { img.src = src; cb && cb(); return; } img.classList.add('fd'); setTimeout(function () { img.onload = function () { img.classList.remove('fd'); img.onload = null; }; img.src = src; cb && cb(); }, 160); }
  function openDialog(d) { lastFocus = document.activeElement; d.showModal(); document.documentElement.classList.add('lock'); }
  function closeDialog(d) { d.close(); }
  [pd, $('#lb')].forEach(function (d) { d.addEventListener('close', function () { document.documentElement.classList.remove('lock'); if (lastFocus) lastFocus.focus(); }); d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); }); });
  $('#pdX').onclick = function () { closeDialog(pd); };
  /* swipe down to close sheet (phone) */
  (function () { var y0 = null; pd.addEventListener('touchstart', function (e) { y0 = pd.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true }); pd.addEventListener('touchend', function (e) { if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) closeDialog(pd); y0 = null; }); })();

  $$('.pc-b').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.id, P = DATA[id], photo = 'assets/real/' + id + '.webp';
      $('#pdN').textContent = P.name; $('#pdD').textContent = DESC[id];
      $('#pdCr').textContent = CRED[id];
      pdImg.src = photo; pdImg.alt = P.name + ' — gerçek fotoğraf'; pdI.classList.remove('rd'); pdT.textContent = 'Gerçek fotoğraf'; pdR.textContent = ''; pdBack.classList.remove('on');
      $('#pdBackI').src = 'assets/real/' + id + '-s.webp';
      var groups = [];
      if (P.kind === 'pal') pdF.innerHTML = swHTML('c', 'Renk', PAL, P.def);
      else if (P.kind === 'flav') pdF.innerHTML = swHTML('c', 'Lezzet', FLAV, P.def);
      else if (P.kind === 'dual') pdF.innerHTML = swHTML('c', '1. renk · alt', PAL, P.def[0]) + swHTML('c2', '2. renk · üst', PAL, P.def[1]);
      else pdF.innerHTML = '<p class="ds" style="margin:0 0 24px">Bu model fotoğraftaki renklerle basılır.</p>';
      function state() { return groups.map(function (g) { return g.val(); }); }
      function isDef(s) { return P.kind === 'dual' ? (s[0].c === P.def[0] && s[1].c === P.def[1]) : (!s.length || s[0].c === P.def); }
      function msg(s) { return 'Merhaba Mimie! ' + P.name + (s.length ? ' — ' + s.map(function (x) { return x.n; }).join(' / ') : '') + ' sipariş etmek istiyorum.'; }
      function update(animate) {
        var s = state();
        $$('[data-o]', pdF).forEach(function (o, i) { o.textContent = s[i].n; });
        pdWa.href = wa(msg(s));
        if (!s.length) return;
        var def = isDef(s);
        var src = def ? photo : 'assets/p/v/' + id + '-' + s.map(function (x) { return H(x.c); }).join('-') + '.webp';
        var after = function () { pdI.classList.toggle('rd', !def); pdT.textContent = def ? 'Gerçek fotoğraf' : 'Renk önizlemesi · 3D görsel'; pdR.textContent = def ? '' : 'Baskıda ton biraz farklı olabilir.'; pdBack.classList.toggle('on', !def); pdImg.alt = P.name + (def ? ' — gerçek fotoğraf' : ' — ' + s.map(function (x) { return x.n; }).join(' / ') + ' renk önizlemesi'); };
        if (animate) swap(pdImg, src, after); else { pdImg.src = src; after(); }
      }
      $$('.sws', pdF).forEach(function (g) { groups.push(radio(g, function () { update(true); })); });
      pdBack.onclick = function () { if (P.kind === 'dual') { groups[0].set(P.def[0]); groups[1].set(P.def[1]); } else groups[0].set(P.def); update(true); };
      update(false);
      openDialog(pd);
    });
  });

  /* ---------- Tag builder ---------- */
  var tb = $('#tb');
  if (tb) {
    var g = {}; $$('[data-k]', tb).forEach(function (el) { g[el.dataset.k] = radio(el, function () { render(); }); });
    var name = $('#tName'), cnt = $('#tCnt'), hint = $('#tHint'), stack = $('#stack'), ph = $('#tPh'), sum = $('#tSum'), waBtn = $('#tWa');
    var curPhoto = 'tag-5li-pembe';
    var STRAP = {
      clip: '<svg class="strap" viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M60 54V40"/><path d="M60 40c-14 0-22-8-22-18S46 4 60 4s22 8 22 18"/><path d="M82 22v12"/></svg>',
      beads: '<svg class="strap" viewBox="0 0 120 56" fill="currentColor"><circle cx="60" cy="50" r="5"/><circle cx="56" cy="40" r="5"/><circle cx="50" cy="31" r="5"/><circle cx="42" cy="23" r="5"/><circle cx="33" cy="17" r="5"/><circle cx="23" cy="13" r="5"/><path d="M8 8c6-4 12-3 14 2-3 5-9 6-14 2z"/></svg>'
    };
    function clean(v) { return (v || '').replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, '').slice(0, 6); }
    function up(s) { return /^mimie$/i.test(s) ? 'MIMIE' : s.toLocaleUpperCase('tr'); }
    function render() {
      var raw = name.value, c = clean(raw);
      if (c !== raw) { var p = name.selectionStart; name.value = c; hint.textContent = 'Sadece harf ve rakam basılabilir.'; try { name.setSelectionRange(p - 1, p - 1); } catch (e) {} } else hint.textContent = '';
      cnt.textContent = c.length + '/6';
      var body = g.body.val(), tile = g.tile.val(), ink = g.ink.val(), ic = g.icon.val(), st = g.strap.val();
      $$('[data-out]', tb).forEach(function (o) { var k = o.dataset.out; if (g[k]) o.textContent = g[k].val().n; });
      var letters = up(c || 'Mimie').split('');
      stack.style.setProperty('--body-c', body.c); stack.style.setProperty('--tile-c', tile.c); stack.style.setProperty('--ink-c', ink.c);
      stack.style.setProperty('--strap', st.c === 'beads' ? tile.c : '#B98FD6');
      stack.innerHTML = STRAP[st.c] + letters.map(function (L) { return '<div class="tile"><span>' + L + '</span></div>'; }).join('') + '<div class="tile"><span>' + ICONS[ic.c] + '</span></div>';
      var k = PHOTO_BY_BODY[body.c.toUpperCase()] || 'tag-sari';
      if (k !== curPhoto) { curPhoto = k; swap(ph, 'assets/real/' + k + '-s.webp'); ph.alt = 'Gerçek baskı örneği: Mimie Tag'; }
      var nm = up(c || '');
      var rows = [['İsim', nm || '—'], ['Gövde', body.n], ['Karo', tile.n], ['Harf & ikon', ink.n], ['İkon', ic.n], ['Askı', st.n]];
      sum.innerHTML = rows.map(function (r) { return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>'; }).join('');
      waBtn.href = wa('Merhaba Mimie! Bir Mimie Tag sipariş etmek istiyorum.\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n'));
    }
    name.addEventListener('input', render);
    stack.addEventListener('pointerdown', function (e) { var t = e.target.closest('.tile'); if (!t) return; t.classList.add('dn'); if (navigator.vibrate) navigator.vibrate(8); setTimeout(function () { t.classList.remove('dn'); }, 120); });
    render();
  }
  var endWa = $('#endWa'); if (endWa) endWa.href = wa('Merhaba Mimie! Sipariş vermek istiyorum.');

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), lbI = $('#lbI'), list = [], li = 0;
  function show(i) { li = (i + list.length) % list.length; var it = list[li]; swap(lbI, 'assets/real/' + it.k + '.webp'); lbI.alt = 'Mimie Tag — ' + it.c; $('#lbC').textContent = it.c; $('#lbN').textContent = list.length > 1 ? (li + 1) + ' / ' + list.length : ''; }
  $$('[data-lb]').forEach(function (b) {
    b.addEventListener('click', function () {
      var group = b.closest('#strip') ? $$('#strip [data-lb]') : [b];
      list = group.map(function (x) { return { k: x.dataset.lb, c: x.dataset.cap }; });
      lbI.src = 'assets/real/' + b.dataset.lb + '-s.webp';
      show(group.indexOf(b)); $('#lbP').hidden = $('#lbNx').hidden = list.length < 2; openDialog(lb);
    });
  });
  $('#lbX').onclick = function () { closeDialog(lb); };
  $('#lbP').onclick = function () { show(li - 1); }; $('#lbNx').onclick = function () { show(li + 1); };
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(li + 1); if (e.key === 'ArrowLeft') show(li - 1); });
  $('#lbS').addEventListener('click', function (e) { if (e.target.id === 'lbS') closeDialog(lb); });
  (function () { var x0 = null; $('#lbS').addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true }); $('#lbS').addEventListener('touchend', function (e) { if (x0 === null || list.length < 2) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) show(li + (d < 0 ? 1 : -1)); x0 = null; }); })();

  /* ---------- video: tap to play ---------- */
  var v = $('#atV'), vp = $('#atP');
  if (v && vp) {
    var toggle = function () { if (v.paused) { v.play(); vp.hidden = true; } else { v.pause(); vp.hidden = false; } };
    vp.addEventListener('click', toggle); v.addEventListener('click', toggle);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (!es[0].isIntersecting && !v.paused) { v.pause(); vp.hidden = false; } }).observe(v);
  }
})();
