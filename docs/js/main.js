/* Rough Cuts: coming-soon page.
   Plain JavaScript, no libraries. Does five things:
   1. Sizes the ROUGH CUTS wordmark to the width of the screen (stacked on phones).
   2. Makes the orange layer of the wordmark follow the pointer.
   3. Runs the Dark mode and Animation icon switches in the top-right corner (and remembers them).
   4. Tells the page when the fonts are ready so the "power-on" can play.
   5. Checks the animation runs smoothly, and lightens it on devices that struggle.
   The page still reads fine without any of this. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode: fine, just not remembered */ }
  }

  /* ---------- Switches ---------- */

  var themeBtn = document.getElementById('sw-theme');
  var motionBtn = document.getElementById('sw-motion');

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  function motionOn() {
    var m = root.getAttribute('data-motion');
    if (m === 'off') return false;
    if (m === 'on') return true;
    return !(reduceQuery && reduceQuery.matches);
  }

  function syncSwitches() {
    if (themeBtn) themeBtn.setAttribute('aria-checked', String(currentTheme() === 'dark'));
    if (motionBtn) motionBtn.setAttribute('aria-checked', String(motionOn()));
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save('rc-theme', next);
      syncSwitches();
    });
  }

  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      var next = motionOn() ? 'off' : 'on';
      root.setAttribute('data-motion', next);
      save('rc-motion', next);
      if (next === 'off') { pointer.x = 0; pointer.y = 0; setPlate(0, 0); }
      syncSwitches();
    });
  }

  /* Follow the device setting until the visitor makes their own choice. */
  function onQueryChange() { syncSwitches(); }
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', onQueryChange);
  if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener('change', onQueryChange);

  /* ---------- Wordmark sizing ---------- */

  var svgs = Array.prototype.slice.call(document.querySelectorAll('.wm-svg'));
  var plates = Array.prototype.slice.call(document.querySelectorAll('.plate'));
  var metrics = null;
  var refSize = 288;
  var cropRect = document.getElementById('wm-crop-rect');
  var CROP = 0.015;

  function r1(n) { return String(Math.round(n * 10) / 10); }

  /* Measures the lettering in "em" units so the maths works for whichever font is showing. */
  function measure() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = '200px Anton, Impact, "Arial Narrow", sans-serif';
    function em(s) { return ctx.measureText(s).width / 200 + s.length * -0.01; }
    var ascent = ctx.measureText('ROUGH').actualBoundingBoxAscent;
    var flat = ctx.measureText('H').actualBoundingBoxAscent; /* height of a flat-topped capital */
    return { full: em('ROUGH CUTS'), rough: em('ROUGH'), cuts: em('CUTS'), cap: (ascent || 144) / 200, flat: (flat || ascent || 144) / 200 };
  }

  function layout() {
    if (!metrics) metrics = measure();
    if (!metrics || !svgs.length) return;
    var m = metrics;
    var w = root.clientWidth || window.innerWidth || 1440;
    var wide = w >= 700;
    var fsFull = (w * 0.94) / m.full;
    var capFull = m.cap * fsFull;
    var fsA = (w * 0.92) / m.rough;
    var fsB = (w * 0.92) / m.cuts;
    var capA = m.cap * fsA;
    var capB = m.cap * fsB;
    var yA = capA * 1.04;
    var yB = yA + capA * 0.08 + capB;
    var vbH = wide ? capFull * 1.14 : yB + capB * 0.1;
    refSize = wide ? fsFull : fsA;

    var spec = {
      full: { x: w * 0.03, y: capFull * 1.02, fs: fsFull },
      rough: { x: w * 0.04, y: yA, fs: fsA },
      cuts: { x: w * 0.04, y: yB, fs: fsB }
    };

    svgs.forEach(function (svg) {
      svg.setAttribute('viewBox', '0 0 ' + r1(w) + ' ' + r1(vbH));
      var texts = svg.querySelectorAll('text[data-role]');
      Array.prototype.forEach.call(texts, function (t) {
        var role = t.getAttribute('data-role');
        var s = spec[role];
        var show = role === 'full' ? wide : !wide;
        t.setAttribute('display', show ? 'inline' : 'none');
        t.setAttribute('x', r1(s.x));
        t.setAttribute('y', r1(s.y));
        t.setAttribute('font-size', r1(s.fs));
        t.setAttribute('letter-spacing', r1(-0.01 * s.fs));
        t.style.setProperty('--fs', r1(s.fs) + 'px');
      });
    });

    /* Crop: trims 1.5% of the letter size off the top and bottom of the white lettering, so
       round letters (O, G, C, S, U) get flat edges. It treats the wordmark as one block: on one
       line it trims the top and bottom of the line; stacked, the top of ROUGH and the bottom of
       CUTS. The orange layer is not cropped. */
    if (cropRect) {
      var first = wide ? spec.full : spec.rough;
      var last = wide ? spec.full : spec.cuts;
      var cropTop = first.y - m.flat * first.fs + CROP * first.fs;
      var cropBottom = last.y - CROP * last.fs;
      cropRect.setAttribute('y', r1(cropTop));
      cropRect.setAttribute('height', r1(cropBottom - cropTop));
    }
    setPlate(pointer.x, pointer.y);
  }

  /* ---------- Orange layer follows the pointer ---------- */

  var pointer = { x: 0, y: 0 };
  var frame = 0;

  /* At rest the orange layer sits diagonally behind the lettering: 3% of the letter size
     left and 3% down. The pointer then nudges it around that resting spot. */
  function setPlate(mx, my) {
    var tx = -(0.03 + mx * 0.02) * refSize;
    var ty = (0.03 + my * 0.006) * refSize;
    plates.forEach(function (g) { g.setAttribute('transform', 'translate(' + r1(tx) + ' ' + r1(ty) + ')'); });
  }

  function onPointer(x, y) {
    if (!motionOn()) return;
    var w = window.innerWidth || 1440;
    var h = window.innerHeight || 900;
    pointer.x = (x / w) * 2 - 1;
    pointer.y = (y / h) * 2 - 1;
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      setPlate(pointer.x, pointer.y);
    });
  }

  window.addEventListener('mousemove', function (e) { onPointer(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  var heading = document.getElementById('wordmark');
  if (heading) {
    heading.addEventListener('mouseenter', function () { if (motionOn()) heading.classList.add('hot'); });
    heading.addEventListener('mouseleave', function () { heading.classList.remove('hot'); });
  }

  /* ---------- Start-up ---------- */

  var resizeFrame = 0;
  window.addEventListener('resize', function () {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(function () { resizeFrame = 0; layout(); });
  });

  var readied = false;
  function ready() {
    if (readied) return;
    readied = true;
    metrics = null;
    layout();
    root.classList.add('ready');
    window.setTimeout(checkSmoothness, 1600); /* after the power-on has finished */
  }

  /* ---------- Smoothness check ----------
     Watches the animation for about 1.5 seconds. If the device is struggling (choppy
     frames), it switches to a lighter version: the grain stops moving and the scan-line
     roll and glitch flickers are turned off. The wordmark and orange layer stay as they
     are. Not remembered, so it is re-checked on each visit. */
  function checkSmoothness() {
    if (!window.requestAnimationFrame || !motionOn()) return;
    if (document.visibilityState && document.visibilityState !== 'visible') {
      document.addEventListener('visibilitychange', function retry() {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', retry);
        window.setTimeout(checkSmoothness, 500);
      });
      return;
    }
    var frames = 0, slow = 0, last = 0, start = 0, hidden = false;
    function onHide() { hidden = true; }
    document.addEventListener('visibilitychange', onHide);
    function tick(now) {
      if (!start) { start = last = now; window.requestAnimationFrame(tick); return; }
      frames++;
      if (now - last > 34) slow++; /* a frame took longer than about 1/30 of a second */
      last = now;
      if (now - start < 1500) { window.requestAnimationFrame(tick); return; }
      document.removeEventListener('visibilitychange', onHide);
      if (hidden) { window.setTimeout(checkSmoothness, 1000); return; }
      var fps = frames / ((now - start) / 1000);
      if (fps < 40 || slow / frames > 0.25) root.setAttribute('data-perf', 'lite');
    }
    window.requestAnimationFrame(tick);
  }

  syncSwitches();
  layout();

  function loadFonts() {
    Promise.all([
      document.fonts.load('200px Anton'),
      document.fonts.load('italic 64px "Instrument Serif"'),
      document.fonts.load('700 16px "Courier Prime"')
    ]).then(ready, ready);
  }

  if (document.fonts && document.fonts.load) {
    if (document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', function () { metrics = null; layout(); });
    }
    /* The font stylesheet loads in the background; wait for it, then for the fonts themselves. */
    var fontLink = document.getElementById('fonts-css');
    if (fontLink && !fontLink.sheet) {
      fontLink.addEventListener('load', loadFonts);
      fontLink.addEventListener('error', ready);
    } else {
      loadFonts();
    }
  } else {
    ready();
  }
  /* If the fonts are slow or blocked, show the page anyway. */
  window.setTimeout(ready, 2500);
})();
