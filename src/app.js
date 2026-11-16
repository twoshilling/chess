(function () {
  'use strict';
  var VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  var FILES = 'abcdefgh';
  var $ = function (s) { return document.querySelector(s); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mainOf(s) { return Object.keys(s.good)[0]; }
  var phoneMq = window.matchMedia ? window.matchMedia('(max-width: 700px)') : { matches: false };
  function phone() { return phoneMq.matches; }
  function askText(s) { return phone() && s.short ? s.short : s.ask; }
  function preText(q) { return phone() && q.qs ? q.qs : q.q; }

  /* ---------- saved progress (this browser only) ---------- */
  var store = { done: {}, found: {}, drill: {}, best: 0, coach: true, sound: true, guide: true, glevel: 2, gstreak: 0, gmiss: 0 };
  try { var raw = JSON.parse(localStorage.getItem('italian-trainer') || '{}'); for (var k in raw) store[k] = raw[k]; } catch (e) {}
  if (!(store.glevel >= 1 && store.glevel <= 4)) store.glevel = 2;
  store.guide = store.glevel < 4;
  function save() { try { localStorage.setItem('italian-trainer', JSON.stringify(store)); } catch (e) {} }

  var side = store.side === 'b' ? 'b' : 'w';
  function opp() { return side === 'w' ? 'b' : 'w'; }
  function ON() { return side === 'w' ? 'Black' : 'White'; }
  function S(sq) { return side === 'w' ? sq : sq[0] + (9 - (+sq[1])); }
  function myF() { return S('f2'); }
  function sideOf(L) { return L.side || 'w'; }
  function mine(i) { return sideOf(LESSONS[i]) === side; }
  var ALL_BAD = [];
  function badNames() {
    var out = [];
    LESSONS.forEach(function (L) { if (sideOf(L) !== side) return; L.steps.forEach(function (s) { Object.keys(s.bad || {}).forEach(function (k) { var n = s.bad[k].name; if (out.indexOf(n) < 0) out.push(n); }); }); });
    return out;
  }
  function fkey(n) { return side === 'w' ? n : 'b:' + n; }
  function foundCount() { return ALL_BAD.filter(function (n) { return store.found[fkey(n)]; }).length; }

  /* ---------- state ---------- */
  var game = new Chess();
  var mode = 'learn', run = 0, locked = true;
  var sel = null, targets = [], downSq = null, lastMove = null, marks = [], arrows = [], hintSq = null, badge = null;
  var risky = [];
  var tapQ = null, tapMiss = 0, tapFound = [], lastGood = null, whyOpen = false;

  /* ---------- sound (synthesised, no files) ---------- */
  var actx = null;
  function audio() {
    if (!store.sound) return null;
    if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { actx = new AC(); } catch (e) { return null; } }
    if (actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  function tone(f, t, dur, type, vol, slide) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  function knock(t, vol, freq) {
    var n = Math.floor(actx.sampleRate * 0.07), buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.1; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(actx.destination); src.start(t);
  }
  function sfx(kind) {
    if (!audio()) return;
    try {
      var t = actx.currentTime + 0.01;
      if (kind === 'move') { knock(t, 0.9, 1100); tone(170, t, 0.07, 'sine', 0.3, 90); }
      else if (kind === 'capture') { knock(t, 1.1, 700); knock(t + 0.05, 0.8, 1600); tone(120, t, 0.11, 'sine', 0.45, 60); }
      else if (kind === 'check') { knock(t, 0.9, 1100); tone(170, t, 0.07, 'sine', 0.3, 90); tone(988, t + 0.06, 0.14, 'triangle', 0.1); }
      else if (kind === 'good') { tone(659, t, 0.12, 'triangle', 0.14); tone(988, t + 0.09, 0.22, 'triangle', 0.14); }
      else if (kind === 'ok') { tone(523, t, 0.16, 'triangle', 0.1); }
      else if (kind === 'bad') { tone(196, t, 0.24, 'sawtooth', 0.07, 110); }
      else if (kind === 'card') { tone(523, t, 0.12, 'triangle', 0.12); tone(466, t + 0.11, 0.12, 'triangle', 0.12); tone(392, t + 0.22, 0.3, 'triangle', 0.12); }
      else if (kind === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.09, 0.3, 'triangle', 0.12); }); }
    } catch (e) {}
  }
  function moveSound(m) { sfx(m.san.indexOf('#') >= 0 || m.san.indexOf('+') >= 0 ? 'check' : m.captured ? 'capture' : 'move'); }
  var li = 0, si = 0, tries = 0;
  var drill = { cur: null, streak: 0, seen: 0, right: 0 };
  var spar = { opening: 'any', alarms: 0, over: false };

  /* ---------- board ---------- */
  var boardEl = $('#board'), sqEls = {}, arrowSvg;
  function buildBoard() {
    boardEl.textContent = ''; sqEls = {};
    for (var row = 0; row < 8; row++) for (var col = 0; col < 8; col++) {
      var f = side === 'w' ? col : 7 - col, r = side === 'w' ? 8 - row : row + 1;
      var name = FILES[f] + r, d = el('div', 'sq ' + ((f + r) % 2 ? 'd' : 'l'));
      d.dataset.sq = name;
      if (col === 0) d.appendChild(el('span', 'co r', r));
      if (row === 7) d.appendChild(el('span', 'co f', FILES[f]));
      boardEl.appendChild(d); sqEls[name] = d;
    }
    arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('id', 'arrows'); arrowSvg.setAttribute('viewBox', '0 0 8 8');
    boardEl.appendChild(arrowSvg);
    if (!boardEl.dataset.wired) { boardEl.dataset.wired = '1'; boardEl.addEventListener('pointerdown', onDown); boardEl.addEventListener('pointerup', onUp); }
  }
  function xy(sq) { var f = FILES.indexOf(sq[0]), r = +sq[1]; return side === 'w' ? [f + 0.5, 8 - r + 0.5] : [7 - f + 0.5, r - 1 + 0.5]; }
  function draw(anim) {
    for (var name in sqEls) {
      var d = sqEls[name], p = game.get(name), old = d.querySelector('.pc');
      var want = p ? p.color + p.type : '';
      if ((d.dataset.pc || '') !== want) {
        if (old) old.remove();
        if (p) {
          var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          s.setAttribute('class', 'pc ' + p.color); s.setAttribute('viewBox', '0 0 45 45');
          var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          u.setAttribute('href', '#pc-' + p.type); s.appendChild(u); d.appendChild(s);
        }
        d.dataset.pc = want;
      }
      var c = d.classList;
      c.toggle('last', !!lastMove && (lastMove.from === name || lastMove.to === name));
      c.toggle('sel', sel === name);
      c.toggle('tgt', targets.indexOf(name) >= 0);
      c.toggle('occ', targets.indexOf(name) >= 0 && !!p);
      c.toggle('risk', targets.indexOf(name) >= 0 && risky.indexOf(name) >= 0);
      var mk = ''; for (var mi = 0; mi < marks.length; mi++) { var mm = marks[mi]; if (mm === name) mk = 'r'; else if (mm[0] === name && mm.length === 2 && typeof mm !== 'string') mk = mm[1]; }
      c.toggle('mark', mk === 'r'); c.toggle('markp', mk === 'p'); c.toggle('markd', mk === 'd');
      var ob = d.querySelector('.bdg'); if (ob) ob.remove();
      if (badge && badge.sq === name) d.appendChild(el('span', 'bdg ' + badge.kind, badge.kind === 'yes' ? '\u2713' : badge.kind === 'no' ? '\u2715' : '~'));
      c.toggle('hint', hintSq === name);
      c.toggle('own', !locked && !!p && p.color === side && game.turn() === side);
    }
    var html = '';
    arrows.forEach(function (a) {
      var p1 = xy(a[0]), p2 = xy(a[1]), dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      var ex = p2[0] - ux * 0.42, ey = p2[1] - uy * 0.42, tx = p2[0] - ux * 0.12, ty = p2[1] - uy * 0.12;
      html += '<g class="' + (a[2] || 'r') + '"><line x1="' + (p1[0] + ux * 0.25) + '" y1="' + (p1[1] + uy * 0.25) + '" x2="' + ex + '" y2="' + ey + '"/>' +
        '<path d="M' + tx + ' ' + ty + 'L' + (ex - uy * 0.2) + ' ' + (ey + ux * 0.2) + 'L' + (ex + uy * 0.2) + ' ' + (ey - ux * 0.2) + 'z"/></g>';
    });
    arrowSvg.innerHTML = html;
    if (anim && !reduced) {
      var pe = sqEls[anim.to].querySelector('.pc');
      if (pe) {
        var a = xy(anim.from), b = xy(anim.to);
        pe.classList.add('mv');
        pe.style.transition = 'none';
        pe.style.transform = 'translate(' + ((a[0] - b[0]) * 108.7) + '%,' + ((a[1] - b[1]) * 108.7) + '%)';
        pe.getBoundingClientRect();
        pe.style.transition = 'transform .24s cubic-bezier(.3,.8,.3,1)';
        pe.style.transform = '';
        setTimeout(function () { pe.classList.remove('mv'); }, 260);
      }
    }
    drawStrip(); renderRibbon();
  }
  function drawStrip() {
    var h = game.history(), out = $('#strip'); out.textContent = '';
    for (var i = 0; i < h.length; i++) {
      if (i % 2 === 0) out.appendChild(document.createTextNode((i / 2 + 1) + '. '));
      out.appendChild(i === h.length - 1 ? el('b', '', h[i]) : document.createTextNode(h[i]));
      out.appendChild(document.createTextNode(' '));
    }
  }
  function clearDecor() { sel = null; targets = []; marks = []; arrows = []; hintSq = null; badge = null; }
  function setGame(g) { game = g; tapQ = null; whyOpen = false; boardEl.classList.remove('dream'); cap(''); var h = g.history({ verbose: true }); lastMove = h.length ? h[h.length - 1] : null; clearDecor(); draw(); }
  function playSan(san, arr) { var m = game.move(san); lastMove = m; sel = null; targets = []; hintSq = null; badge = null; marks = []; arrows = arr || []; draw(m); moveSound(m); return m; }
  function rewind(fen) { while (game.fen() !== fen && game.undo()) { } var h = game.history({ verbose: true }); lastMove = h.length ? h[h.length - 1] : null; clearDecor(); draw(); }

  /* squares a piece attacks, whoever is to move */
  function attacksFrom(sq, g) {
    g = g || game;
    var p = g.get(sq), out = []; if (!p) return out;
    var f = FILES.indexOf(sq[0]), r = +sq[1];
    function at(ff, rr) { return ff >= 0 && ff < 8 && rr >= 1 && rr <= 8 ? FILES[ff] + rr : null; }
    function ray(df, dr) { var ff = f + df, rr = r + dr, t; while ((t = at(ff, rr))) { out.push(t); if (g.get(t)) break; ff += df; rr += dr; } }
    function step(df, dr) { var t = at(f + df, r + dr); if (t) out.push(t); }
    var D = [[1, 1], [1, -1], [-1, 1], [-1, -1]], O = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (p.type === 'p') { var dir = p.color === 'w' ? 1 : -1; step(1, dir); step(-1, dir); }
    else if (p.type === 'n') [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].forEach(function (d) { step(d[0], d[1]); });
    else if (p.type === 'k') D.concat(O).forEach(function (d) { step(d[0], d[1]); });
    else { if (p.type !== 'r') D.forEach(function (d) { ray(d[0], d[1]); }); if (p.type !== 'b') O.forEach(function (d) { ray(d[0], d[1]); }); }
    return out;
  }
  function xray(sq) {
    var p = game.get(sq), out = [];
    attacksFrom(sq).forEach(function (t) { var q = game.get(t); if (q && q.type !== 'k' || q && q.color !== p.color) out.push([sq, t, q.color === p.color ? 'd' : 'r']); });
    return out;
  }
  var capEl = $('#cap');
  function cap(t) { if (!capEl) capEl = $('#cap'); capEl.textContent = t || ''; capEl.classList.toggle('on', !!t); }
  function sqAt(e) { var t = document.elementFromPoint(e.clientX, e.clientY); t = t && t.closest ? t.closest('.sq') : null; return t ? t.dataset.sq : null; }
  function onDown(e) {
    audio();
    if (tapQ) { var ts = sqAt(e); if (ts) tapAnswer(ts); return; }
    if (locked || game.turn() !== side) return;
    var sq = sqAt(e); if (!sq) return;
    if (sel && targets.indexOf(sq) >= 0) { userMove(sel, sq); return; }
    var p = game.get(sq);
    if (p && p.color === side) {
      sel = sq; downSq = sq; targets = game.moves({ square: sq, verbose: true }).map(function (m) { return m.to; });
      risky = [];
      if (mode === 'spar' && store.guide) targets.forEach(function (t) {
        var m = game.move({ from: sq, to: t, promotion: 'q' }); if (!m) return;
        if (!game.in_checkmate() && punish(game, m)) risky.push(t);
        game.undo();
      });
    }
    else {
      sel = null; targets = [];
      if (p && p.color === opp()) { arrows = xray(sq); marks = []; }
      else if (mode === 'learn' && !lessonOver) seeDecor(LESSONS[li].steps[si]);
    }
    draw();
  }
  function onUp(e) {
    if (locked || !sel || downSq !== sel) { downSq = null; return; }
    var sq = sqAt(e); downSq = null;
    if (sq && sq !== sel && targets.indexOf(sq) >= 0) userMove(sel, sq);
  }
  function userMove(from, to) {
    var fen = game.fen();
    var m = game.move({ from: from, to: to, promotion: 'q' });
    if (!m) return;
    lastMove = m; clearDecor(); locked = true; draw(m); moveSound(m);
    if (mode === 'learn') learnMove(m, fen);
    else if (mode === 'drill') drillMove(m, fen);
    else if (mode === 'spar') sparMove(m, fen);
  }

  /* ---------- coach feed ---------- */
  var feed = $('#feed');
  /* The coach panel shows one thing at a time: a row of move chips, a caption, one prompt or verdict, one secondary line. */
  var ribbonEl = $('#ribbon'), rnoteEl = $('#rnote'), slotEl = $('#slot'), subEl = $('#sub');
  var noteBy = {}, ribStart = 0, inDemo = false;
  function setSlot(kind, text) { slotEl.className = 'slot ' + kind; slotEl.textContent = text || ''; }
  function setSub(text) { subEl.textContent = text || ''; }
  function setNote(text) { rnoteEl.textContent = text || ''; }
  function clearFeed() { feed.textContent = ''; setSlot('', ''); setSub(''); }
  function restoreNote() { var h = game.history(), n = noteBy[h.length]; setNote(n && n.san === h[h.length - 1] && (n.kind === 'black' || n.kind === 'white') ? n.text : ''); }
  function resetRibbon(start) { noteBy = {}; ribStart = start; setNote(''); }
  function renderLabel() {
    var h = game.history(), ml = $('#mlabel-l'); if (!ml) return;
    if (!h.length) { ml.textContent = ''; ml.className = ''; return; }
    var ply = h.length, n = noteBy[ply], ok = n && n.san === h[ply - 1];
    var t = Math.ceil(ply / 2) + (ply % 2 ? '. ' : '... ') + h[ply - 1];
    if (ok && n.kind === 'good') t = '\u2713 ' + t;
    if (ok && (n.kind === 'black' || n.kind === 'white') && n.text && !inDemo) t += '  \u00b7  ' + n.text;
    ml.textContent = t; ml.className = ok ? n.kind : '';
  }
  function renderRibbon() {
    renderLabel();
    var h = game.history(), start = mode === 'spar' ? Math.max(ribStart, h.length - 2) : ribStart;
    ribbonEl.textContent = '';
    for (var i = start; i < h.length; i++) (function (ply) {
      var n = noteBy[ply], ok = n && n.san === h[ply - 1], mineMove = ((ply % 2 === 1) ? 'w' : 'b') === side;
      var c = el('button', 'rc ' + (ok ? n.kind : '') + (mineMove ? ' me' : ' them'), (ok && n.kind === 'good' ? '\u2713 ' : '') + h[ply - 1]);
      c.type = 'button';
      if (ok && n.text) c.addEventListener('click', function () { setNote(n.text); }); else c.disabled = true;
      ribbonEl.appendChild(c);
    })(i + 1);
  }
  function say(kind, text, san) {
    if (san) noteBy[game.history().length] = { san: san, kind: kind, text: text || '' };
    if (kind === 'black' || kind === 'white') {
      if (inDemo) setSlot('demo', text); else setNote(text);
    } else if (kind === 'info') setSub(text);
    else { setSlot(kind === 'tip' ? 'ask' : kind, text); if (kind !== 'ask' && kind !== 'tip') setSub(''); }
    renderRibbon();
    return slotEl;
  }
  function actions(list, note) {
    var row = el('div', 'acts');
    if (note) row.appendChild(el('span', '', note));
    list.forEach(function (a, i) {
      var b = el('button', a.chip ? 'chip' + (a.plan ? ' plan' : '') : 'btn' + (i === 0 ? ' pri' : ''), a.label);
      b.type = 'button';
      b.addEventListener('click', function () { if (!a.keep) row.remove(); a.go(b); });
      row.appendChild(b);
    });
    feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
    if (!list[0].chip) { try { row.querySelector('button').focus({ preventScroll: true }); } catch (e) {} }
    return row;
  }
  function collectCard(name) {
    var isNew = !store.found[fkey(name)];
    store.found[fkey(name)] = 1; save();
    var c = el('div', 'card');
    ALL_BAD = badNames();
    c.appendChild(el('span', 'eyebrow', (isNew ? 'Mistake collected' : 'Seen before') + ' · ' + foundCount() + ' of ' + ALL_BAD.length));
    c.appendChild(el('strong', '', name));
    feed.appendChild(c); feed.scrollTop = feed.scrollHeight; sfx('card');
    if (mode === 'learn') renderRail();
  }

  /* ---------- automatic blunder check ---------- */
  function bestCapture(g) {
    var best = null;
    g.moves({ verbose: true }).forEach(function (m) {
      if (!m.captured) return;
      g.move(m);
      var re = g.moves({ verbose: true }).some(function (x) { return x.to === m.to && x.captured; });
      g.undo();
      var gain = VAL[m.captured] - (re ? VAL[m.piece] : 0);
      if (!best || gain > best.gain) best = { move: m, gain: gain, re: re };
    });
    return best;
  }
  /* Black to move, just after the user's move mv. Returns {move, text} if the move drops material or allows mate. */
  function punish(g, mv) {
    var ms = g.moves({ verbose: true });
    for (var i = 0; i < ms.length; i++) if (ms[i].san.indexOf('#') >= 0) return { move: ms[i], text: 'That allows mate in one.' };
    var b = bestCapture(g), own = mv.captured ? VAL[mv.captured] : 0;
    if (!b || b.gain - own < 1) return null;
    var what = NAME[b.move.captured], sq = b.move.to, t;
    if (own > 0) t = 'You win a ' + NAME[mv.captured] + ' but lose a ' + what + '.';
    else if (b.re) t = ON() + ' takes your ' + what + ' with a cheaper piece.';
    else if (sq === mv.to) t = 'That ' + what + ' can simply be taken.';
    else t = 'That leaves your ' + what + ' on ' + sq + ' hanging.';
    return { move: b.move, text: t };
  }

  /* Plays out what is wrong with a move. Returns 'ok' | 'bad' | 'auto' | 'miss'. */
  async function showWrong(s, mv, my) {
    var san = mv.san;
    if (s.ok && s.ok[san]) { badge = { sq: mv.to, kind: 'meh' }; draw(); sfx('ok'); say('ok', s.ok[san], san); return 'ok'; }
    badge = { sq: mv.to, kind: 'no' }; draw();
    var b = s.bad && s.bad[san];
    if (b) {
      sfx('bad');
      if (b.line) {
        say('bad', 'Watch.', san); inDemo = true; setNote('');
        for (var i = 0; i < b.line.length; i++) {
          await wait(i === 0 ? 800 : 1500); if (my !== run) { inDemo = false; return 'x'; }
          var m = playSan(b.line[i], b.draws[i]);
          say(m.color === 'b' ? 'black' : 'white', b.notes[i], m.san);
        }
        inDemo = false;
        await wait(600); if (my !== run) return 'x';
      } else say('bad', b.text, san);
      collectCard(b.name);
      return 'bad';
    }
    var p = punish(game, mv);
    if (p) {
      sfx('bad'); say('bad', p.text, san);
      arrows = [[p.move.from, p.move.to, 'r']]; draw();
      await wait(900); if (my !== run) return 'x';
      var pm = playSan(p.move.san);
      say(pm.color === 'b' ? 'black' : 'white', pm.san.indexOf('#') >= 0 ? 'Checkmate.' : '', pm.san);
      return 'auto';
    }
    sfx('bad'); say('miss', 'Not this one.', san);
    return 'miss';
  }

  /* ---------- learn ---------- */
  function basePosition(L, idx) {
    var g = new Chess();
    L.setup.forEach(function (m) { g.move(m); });
    for (var i = 0; i < idx; i++) { g.move(mainOf(L.steps[i])); if (L.steps[i].reply) g.move(L.steps[i].reply); }
    return g;
  }
  function key(L, i) { return L.id + ':' + i; }
  function startLesson(idx, stepIdx) {
    run++; li = idx; si = stepIdx || 0;
    var L = LESSONS[li];
    clearFeed(); lastGood = null; inDemo = false; resetRibbon(L.setup.length); setGame(basePosition(L, si));
    renderRail(); renderUnder(); askStep();
  }
  function header() {
    var L = LESSONS[li], prog = $('#prog'); prog.textContent = '';
    if (mode === 'learn') {
      $('#ctitle').textContent = L.title;
      L.steps.forEach(function (s, i) { prog.appendChild(el('i', i < si ? 'on' : i === si ? 'cur' : '')); });
    } else if (mode === 'drill') {
      $('#ctitle').textContent = 'Drill · ' + (drill.cur ? LESSONS[drill.cur.li].title : '');
    } else if (mode === 'spar') {
      $('#ctitle').textContent = 'Sparring as ' + (side === 'w' ? 'White' : 'Black');
    }
  }
  function askStep(reply) {
    var L = LESSONS[li], s = L.steps[si]; tries = 0;
    header(); clearFeed();
    lastGood = null;
    if (si === 0 && !reply) say('info', L.intro);
    if (reply) say(side === 'w' ? 'black' : 'white', reply.note || '', reply.san);
    if (s.pre) { tapQ = s.pre; tapMiss = 0; tapFound = []; arrows = []; marks = []; say('ask', preText(s.pre)); locked = true; draw(); return; }
    askMove();
  }
  function seeDecor(s, extra) { arrows = (s.see || []).slice(); marks = (s.seeMarks || []).concat(extra || []); }
  function askMove(extraMarks) {
    var s = LESSONS[li].steps[si];
    say('ask', askText(s)); seeDecor(s, extraMarks); badge = null; locked = false; draw();
  }
  function tapAnswer(sq) {
    var q = tapQ, my = run, list = q.sqs || [q.sq];
    if (list.indexOf(sq) < 0 || tapFound.indexOf(sq) >= 0) {
      if (tapFound.indexOf(sq) >= 0) return;
      tapMiss++; badge = { sq: sq, kind: 'no' }; if (tapMiss >= 2) hintSq = list.filter(function (x) { return tapFound.indexOf(x) < 0; })[0]; sfx('bad'); draw(); return;
    }
    tapFound.push(sq); hintSq = null; badge = { sq: sq, kind: 'yes' };
    if (q.sqs) { arrows.push([sq, q.target, q.col]); marks = [q.target]; }
    if (tapFound.length < list.length) { sfx('ok'); draw(); return; }
    tapQ = null; if (!q.sqs) { marks = [sq]; arrows = q.arrows || []; }
    sfx('good'); draw(); say('good', q.yes);
    setTimeout(function () { if (my === run) askMove(q.sqs ? [q.target] : [sq]); }, 1300);
  }
  function nextTap() { if (!tapQ) return null; var list = tapQ.sqs || [tapQ.sq]; return list.filter(function (x) { return tapFound.indexOf(x) < 0; })[0]; }
  function whyQuiz(w, my) {
    return new Promise(function (res) {
      whyOpen = true; say('ask', w.q);
      var row = el('div', 'opts'), opts = w.opts.slice().sort(function () { return Math.random() - 0.5; });
      opts.forEach(function (o) {
        var b = el('button', 'opt', o.t); b.type = 'button';
        b.addEventListener('click', function () {
          if (my !== run || b.disabled) return; audio();
          if (o.right) { b.classList.add('yes'); row.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); sfx('good'); whyOpen = false; setTimeout(res, 500); }
          else { b.classList.add('no'); b.disabled = true; b.appendChild(el('small', '', o.note)); sfx('bad'); feed.scrollTop = feed.scrollHeight; }
        });
        row.appendChild(b);
      });
      feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
    });
  }
  /* Plays an idea out on the board, then puts the position back. */
  async function dream(frames, my) {
    var fen = game.fen();
    boardEl.classList.add('dream');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.play) playSan(f.play, f.arrows); else { arrows = f.arrows || []; badge = null; }
      marks = f.marks || []; draw(); cap(f.cap);
      await wait(f.play && !f.arrows && i < frames.length - 1 ? 1500 : 2300); if (my !== run) return;
    }
    boardEl.classList.remove('dream'); cap(''); rewind(fen);
  }
  async function learnMove(mv, fen, shown) {
    var my = run, L = LESSONS[li], s = L.steps[si], san = mv.san;
    if (s.good[san]) {
      lastGood = say('good', s.good[san], san); sfx('good');
      badge = { sq: mv.to, kind: 'yes' }; arrows = san === mainOf(s) ? (s.arrows || []) : []; marks = s.marks || []; draw();
      if (!shown) { store.done[key(L, si)] = 1; save(); }
      renderRail();
      await wait(s.arrows ? 1900 : 1100); if (my !== run) return;
      if (san === mainOf(s)) {
        if (s.why) { await whyQuiz(s.why, my); if (my !== run) return; }
        if (s.dream) { await dream(s.dream, my); if (my !== run) return; }
      }
      var reply = null;
      if (s.reply && san === mainOf(s)) {
        var r = playSan(s.reply); reply = { san: r.san, note: s.replyNote };
        await wait(450); if (my !== run) return;
      }
      si++;
      if (si < L.steps.length) askStep(reply); else finishLesson();
      return;
    }
    tries++;
    var kind = await showWrong(s, mv, my); if (kind === 'x') return;
    function back() {
      var said = (kind === 'ok' || kind === 'miss') ? san + ': ' + slotEl.textContent : '';
      rewind(fen); seeDecor(s); feed.textContent = ''; restoreNote();
      setSlot('ask', askText(s));
      setSub((said ? said + ' ' : '') + (tries >= 2 || kind === 'miss' ? 'Hint: ' + s.hint : ''));
      if (tries >= 3) { var m = game.move(mainOf(s)); game.undo(); hintSq = m.from; }
      locked = false; draw();
    }
    if (kind === 'bad' || kind === 'auto') actions([{ label: 'Take it back', go: back }]);
    else { await wait(kind === 'ok' ? 1400 : 700); if (my !== run) return; back(); }
  }
  var lessonOver = false;
  function finishLesson() {
    var L = LESSONS[li]; lessonOver = true; header(); sfx('win');
    $('#prog').querySelectorAll('i').forEach(function (i) { i.className = 'on'; });
    say('ask', L.outro);
    var ni = -1; for (var q = li + 1; q < LESSONS.length; q++) if (mine(q)) { ni = q; break; }
    var next = ni >= 0 ? { label: 'Next: ' + LESSONS[ni].title, go: function () { lessonOver = false; startLesson(ni); } }
      : { label: 'Drill everything', go: function () { lessonOver = false; try { location.hash = 'drill'; } catch (e) {} setMode('drill'); } };
    actions([next, { label: 'Repeat', go: function () { lessonOver = false; startLesson(li); } }]);
    var unseen = [];
    L.steps.forEach(function (s, i) { Object.keys(s.bad || {}).forEach(function (k) { if (!store.found[fkey(s.bad[k].name)]) unseen.push({ i: i, k: k }); }); });
    if (unseen.length) actions(unseen.map(function (u) {
      return { label: u.k, chip: true, keep: true, go: function (btn) { btn.remove(); replayMistake(u.i, u.k); } };
    }), 'Mistakes you missed here. Tap one to watch it go wrong:');
  }
  /* Replays a catalogued mistake from an earlier step, then puts the board back. */
  async function replayMistake(stepIdx, k) {
    var my = ++run, L = LESSONS[li], s = L.steps[stepIdx];
    var keep = game, keepLast = lastMove, wasOver = lessonOver;
    locked = true;
    setGame(basePosition(L, stepIdx));
    await wait(600); if (my !== run) return;
    var m = playSan(k);
    await showWrong(s, m, my); if (my !== run) return;
    actions([{ label: 'Back', go: function () { game = keep; lastMove = keepLast; clearDecor(); locked = wasOver || si >= L.steps.length; draw(); } }]);
  }
  function hint() {
    if (mode === 'learn' && tapQ) { hintSq = nextTap(); draw(); return; }
    if (locked || mode !== 'learn') return;
    var s = LESSONS[li].steps[si], m = game.move(mainOf(s)); game.undo();
    hintSq = m.from; say('info', 'Hint: ' + s.hint); draw();
  }
  function showMove() {
    if (mode === 'learn' && tapQ) { while (tapQ) tapAnswer(nextTap()); return; }
    if (locked || mode !== 'learn') return;
    var s = LESSONS[li].steps[si], fen = game.fen();
    locked = true; var m = playSan(mainOf(s)); learnMove(m, fen, true);
  }

  /* ---------- drill ---------- */
  var POOL = [];
  LESSONS.forEach(function (L, a) { L.steps.forEach(function (s, b) { POOL.push({ li: a, si: b }); }); });
  function nextDrill() {
    run++;
    var weights = POOL.map(function (c) {
      if (!mine(c.li)) return 0;
      var d = store.drill[key(LESSONS[c.li], c.si)] || { r: 0, w: 0 };
      var w = 1 + 3 * d.w - 0.6 * d.r; if (w < 0.25) w = 0.25;
      if (drill.cur && drill.cur.li === c.li && drill.cur.si === c.si) w = 0;
      return w;
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * total, i = 0;
    while (i < POOL.length - 1 && (x -= weights[i]) > 0) i++;
    drill.cur = POOL[i]; li = drill.cur.li; si = drill.cur.si;
    var L = LESSONS[li], s = L.steps[si];
    clearFeed(); lastGood = null; inDemo = false; setGame(basePosition(L, si)); resetRibbon(game.history().length); header(); renderRail();
    say('ask', askText(s));
    if (s.pre) marks = [s.pre.target || s.pre.sq];
    locked = false; draw();
  }
  async function drillMove(mv, fen) {
    var my = run, L = LESSONS[li], s = L.steps[si], k = key(L, si);
    var d = store.drill[k] || (store.drill[k] = { r: 0, w: 0 });
    drill.seen++;
    if (s.good[mv.san]) {
      d.r++; drill.right++; drill.streak++; if (drill.streak > store.best) store.best = drill.streak;
      say('good', s.good[mv.san], mv.san); sfx('good');
      badge = { sq: mv.to, kind: 'yes' }; if (mv.san === mainOf(s)) { arrows = s.arrows || []; marks = s.marks || []; } draw();
    } else {
      d.w++; drill.streak = 0;
      var kind = await showWrong(s, mv, my); if (kind === 'x') return;
      await wait(kind === 'bad' || kind === 'auto' ? 1600 : 900); if (my !== run) return;
      rewind(fen);
      var m = playSan(mainOf(s), s.arrows); marks = s.marks || []; draw();
      say('good', s.good[mainOf(s)], m.san);
    }
    save(); renderRail();
    actions([{ label: 'Next position', go: nextDrill }]);
  }

  /* ---------- sparring ---------- */
  function posKey(g) { return g.fen().split(' ').slice(0, 4).join(' '); }
  var BOOK = {};
  (function () {
    function add(l, botColor, from) {
      var g = new Chess();
      l.forEach(function (san) {
        if (g.turn() === botColor && g.history().length >= from) { var k = posKey(g); (BOOK[k] = BOOK[k] || []); if (BOOK[k].indexOf(san) < 0) BOOK[k].push(san); }
        g.move(san);
      });
    }
    BOOK_EXTRA.forEach(function (l) { add(l, 'b', 6); });
    BOOK_EXTRA_B.forEach(function (l) { add(l, 'w', 6); });
    LESSONS.forEach(function (L) {
      var l = L.setup.slice();
      L.steps.forEach(function (s) { l.push(mainOf(s)); if (s.reply) l.push(s.reply); });
      if (sideOf(L) === 'w') add(l, 'b', 6); else add(l, 'w', 6);
    });
  })();
  /* White's first moves when you spar as Black. */
  var FAMILY = { italian: ['e4', 'Nf3', 'Bc4'], raid: ['e4', 'Qh5', 'Bc4', 'Qf3'], raid2: ['e4', 'Bc4', 'Qh5', 'Qf3'], ruy: ['e4', 'Nf3', 'Bb5'], scotch: ['e4', 'Nf3', 'd4'], knights: ['e4', 'Nf3', 'Nc3', 'Bc4'], lunge: ['e4', 'Nf3', 'Bc4', 'Ng5'] };
  var FAMPICK = { any: ['italian', 'italian', 'italian', 'italian', 'lunge', 'lunge', 'raid', 'raid', 'raid2', 'ruy', 'ruy', 'scotch', 'scotch', 'knights', 'knights'], italian: ['italian', 'italian', 'lunge'], raid: ['raid', 'raid2'], ruy: ['ruy'], scotch: ['scotch'], knights: ['knights'] };
  var FIRST = {
    any: ['Bc5', 'Bc5', 'Bc5', 'Bc5', 'Bc5', 'Bc5', 'Nf6', 'Nf6', 'Nf6', 'Nf6', 'Nf6', 'Nf6', 'Nd4', 'Nd4', 'd6', 'd6', 'h6', 'Na5', 'Be7'],
    bc5: ['Bc5'], nf6: ['Nf6'], odd: ['Nd4', 'd6', 'h6', 'Na5', 'Be7']
  };
  function evalPos(g) {
    var b = g.board(), s = 0;
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
      var p = b[r][f]; if (!p) continue;
      var v = VAL[p.type] * 100, home = p.color === 'w' ? 7 : 0;
      if (p.type === 'p') { if ((f === 3 || f === 4) && (r === 3 || r === 4)) v += 22; }
      else if (p.type === 'n' || p.type === 'b') { if (r !== home) v += 14; if (f > 1 && f < 6 && r > 1 && r < 6) v += 8; }
      else if (p.type === 'k') { if (r === home && (f === 6 || f === 2)) v += 35; }
      s += p.color === 'w' ? v : -v;
    }
    return s;
  }
  function botSearch() {
    var g = game, moves = g.moves({ verbose: true }), sg = g.turn() === 'w' ? -1 : 1;
    function ev() { return sg * evalPos(g); }
    if (Math.random() < 0.1) return pick(moves).san;
    var best = null;
    moves.forEach(function (m) {
      g.move(m);
      var sc;
      if (g.in_checkmate()) sc = -1e6;
      else if (g.in_draw() || g.in_stalemate()) sc = 0;
      else {
        sc = -Infinity;
        var ws = g.moves({ verbose: true });
        for (var i = 0; i < ws.length; i++) {
          g.move(ws[i]);
          var v;
          if (g.in_checkmate()) v = 1e6;
          else {
            v = ev();
            var bs = ws[i].captured ? g.moves({ verbose: true, legal: false }) : [];
            for (var j = 0; j < bs.length; j++) {
              var c = bs[j]; if (!c.captured) continue;
              if (!g.move(c)) continue;
              var e = ev();
              if (g.moves({ verbose: true, legal: false }).some(function (x) { return x.to === c.to && x.captured; })) e += VAL[c.piece] * 100;
              g.undo();
              if (e < v) v = e;
            }
          }
          g.undo();
          if (v > sc) sc = v;
        }
      }
      g.undo();
      sc += (Math.random() - 0.5) * 110;
      if (!best || sc < best.sc) best = { san: m.san, sc: sc };
    });
    return best.san;
  }
  /* ---------- sparring guide ---------- */
  var REP = {};
  LESSONS.forEach(function (L, a) { L.steps.forEach(function (st, b) { var k = posKey(basePosition(L, b)); if (!REP[k]) REP[k] = { li: a, si: b }; }); });
  function repHere() { var r = REP[posKey(game)]; return r ? { L: LESSONS[r.li], s: LESSONS[r.li].steps[r.si] } : null; }
  function threatOnMe() {
    try {
      if (game.in_check()) return null;
      var g2 = flip(game); if (!g2) return null;
      var b = bestCapture(g2);
      return b && b.gain >= 1 ? b : null;
    } catch (e) { return null; }
  }
  var focus = null, focusEl = $('#focus');
  var PRINCIPLES = ['Repetition', 'Safety', 'Checks first', 'Free material', 'King safety', 'Activity', 'Attack the king', 'Trade when ahead', 'Open lines', 'Small improvements'];
  var GLABEL = ['', 'Guide: show me', 'Guide: ask me', 'Guide: ask me (hard)', 'Guide: off'];
  function showFocus(f) {
    focus = f; focusEl.textContent = ''; focusEl.className = 'focus';
    focusEl.hidden = !f; $('#stage').classList.toggle('focus-on', !!f); $('#mlabel-r').textContent = f ? (f.name === 'Your opening' ? 'From your lessons' : 'Your priority') : '';
    if (!f) return;
    var lastEl = $('#last'), kind = (slotEl.className.match(/good|ok|bad/) || [''])[0];
    lastEl.className = 'lastv ' + kind; lastEl.textContent = kind ? ((kind === 'good' ? '\u2713 ' : '') + slotEl.textContent + (subEl.textContent ? '  \u00b7  ' + subEl.textContent : '')) : '';
    if (store.glevel === 1 || f.name === 'Your opening') revealFocus(f); else quizFocus(f);
  }
  function quizFocus(f) {
    var first = true, names;
    if (store.glevel === 3) names = PRINCIPLES.slice();
    else {
      var pool = PRINCIPLES.filter(function (n) { return n !== f.name && !(f.name === 'Activity' && n === 'Small improvements') && !(f.name === 'Small improvements' && n === 'Activity') && !(f.name === 'Free material' && n === 'Checks first') && !(f.name === 'Checks first' && n === 'Free material'); });
      pool.sort(function () { return Math.random() - 0.5; });
      names = [f.name, pool[0], pool[1]].sort(function () { return Math.random() - 0.5; });
    }
    arrows = []; marks = []; draw();
    focusEl.className = 'focus quiz';
    focusEl.appendChild(el('span', 'eyebrow', 'Before you move'));
    focusEl.appendChild(el('strong', '', 'What matters most here?'));
    var row = el('div', 'acts seg');
    names.forEach(function (n) {
      var b = el('button', 'chip plan', n); b.type = 'button';
      b.addEventListener('click', function () {
        if (focus !== f || b.disabled) return; audio();
        if (n === f.name) {
          sfx('good');
          if (first) { store.gstreak++; store.gmiss = 0; } save();
          focusEl.textContent = ''; focusEl.className = 'focus'; revealFocus(f, first ? 'Right.' : 'Yes, this one.'); levelCheck();
        } else { first = false; store.gstreak = 0; store.gmiss++; save(); b.disabled = true; b.classList.add('no'); sfx('bad'); }
      });
      row.appendChild(b);
    });
    focusEl.appendChild(row);
  }
  function levelCheck() {
    if (store.glevel === 2 && store.gstreak >= 6) { store.glevel = 3; store.gstreak = 0; save(); renderUnder(); say('info', 'Six right in a row. From now on you pick from every principle, with no shortlist.'); }
    else if (store.glevel === 3 && store.gstreak >= 8) { store.gstreak = 0; save(); say('info', 'Eight right in a row. Try a game with the Guide off.'); }
    else if (store.glevel === 3 && store.gmiss >= 3) { store.glevel = 2; store.gmiss = 0; save(); renderUnder(); say('info', 'Back to a shortlist of three for now.'); }
  }
  function revealFocus(f, verdict) {
    focusEl.classList.add('shown');
    focusEl.appendChild(el('span', 'eyebrow', verdict || 'This move: think about'));
    var head = el('button', 'fname'); head.type = 'button'; head.appendChild(el('strong', '', f.name));
    head.addEventListener('click', function () { focusEl.classList.toggle('open'); });
    focusEl.appendChild(head);
    var det = el('div', 'fdetail'); focusEl.appendChild(det);
    det.appendChild(el('p', '', f.name === 'Your opening' && phone() ? f.text.replace(/ \([^)]*\)$/, '') : f.text));
    if (f.why) { var w = el('p', 'why'); w.appendChild(el('b', '', 'Why now: ')); w.appendChild(document.createTextNode(f.why)); det.appendChild(w); }
    if (f.name === 'Your opening') focusEl.classList.add('open');
    var chips = (f.chips || []).slice();
    if (f.name !== 'Your opening') chips.push({ label: 'Show the move', go: function () {
      hintLine('Thinking...');
      bestMove(f).then(function (m) {
        if (focus !== f || !m) { return; }
        arrows = [[m.from, m.to, 'p']]; marks = []; hintSq = m.from; draw();
        var lead = (m.engine ? 'Best move here: ' : 'One good move here: ') + m.san + '.';
        hintLine(lead);
        var fen = game.fen();
        explainMove(m).then(function (ex) {
          if (focus !== f || game.fen() !== fen) return;
          hintLine(lead + ex.text);
          if (ex.line.length > 1 && !focusEl.querySelector('.lineplay')) {
            var b = el('button', 'chip plan lineplay', 'Play it through'); b.type = 'button';
            b.addEventListener('click', function () { if (!locked && focus === f && game.fen() === fen) playIgnore(lineFrames(ex.line), 'Here is how it goes.'); });
            det.appendChild(b);
          }
        });
      });
    } });
    if (f.ignore) chips.push({ label: 'What if I ignore it?', go: function () { var fr = f.ignore(); if (fr && fr.length) playIgnore(fr); } });
    if (chips.length) {
      var row = el('div', 'acts');
      chips.forEach(function (c) { var b = el('button', 'chip plan', c.label); b.type = 'button'; b.addEventListener('click', function () { if (!locked && focus === f) c.go(); }); row.appendChild(b); });
      det.appendChild(row);
    }
    arrows = f.arrows || []; marks = f.marks || []; draw();
  }
  /* A sound move that fits the principle: safe first, then on-principle, then active. */
  /* ---------- real engine (Stockfish, in a worker) for Show the move ---------- */
  var engine = { w: null, ready: false, failed: false, cb: null, lines: {} };
  function engineStart() {
    try {
      var w = new Worker('stockfish.js'); engine.w = w;
      w.onmessage = function (e) {
        var l = String(e.data);
        if (l === 'uciok') { w.postMessage('setoption name MultiPV value 4'); w.postMessage('isready'); }
        else if (l === 'readyok') engine.ready = true;
        else if (l.indexOf('info ') === 0 && l.indexOf(' pv ') > 0 && l.indexOf(' multipv ') > 0) {
          var mp = +l.split(' multipv ')[1].split(' ')[0], pvs = l.split(' pv ')[1].split(' '), mv = pvs[0], o = { uci: mv, pv: pvs };
          if (l.indexOf(' score mate ') > 0) o.mate = +l.split(' score mate ')[1].split(' ')[0];
          else if (l.indexOf(' score cp ') > 0) o.cp = +l.split(' score cp ')[1].split(' ')[0];
          engine.lines[mp] = o;
        } else if (l.indexOf('bestmove') === 0) {
          var cb = engine.cb; engine.cb = null;
          if (cb) { var out = []; for (var k = 1; k <= 4; k++) if (engine.lines[k]) out.push(engine.lines[k]); cb(out); }
        }
      };
      w.onerror = function () { engine.failed = true; var cb = engine.cb; engine.cb = null; if (cb) cb(null); };
      w.postMessage('uci');
    } catch (e) { engine.failed = true; }
  }
  function analyse(ms, g) {
    g = g || game;
    var fen = g.fen(), h = g.history({ verbose: true });
    function job() {
      return new Promise(function (res) {
        if (!engine.w || !engine.ready || engine.failed) return res(null);
        var done = false;
        engine.lines = {};
        engine.cb = function (r) { if (!done) { done = true; res(r); } };
        var replay = new Chess(); h.forEach(function (m) { replay.move(m); });
        if (h.length && replay.fen() === fen) engine.w.postMessage('position startpos moves ' + h.map(function (m) { return m.from + m.to + (m.promotion || ''); }).join(' '));
        else engine.w.postMessage('position fen ' + fen);
        engine.w.postMessage('go movetime ' + ms);
        setTimeout(function () { if (!done) { done = true; engine.cb = null; try { engine.w.postMessage('stop'); } catch (e) {} res(null); } }, ms + 4000);
      });
    }
    engine.chain = (engine.chain || Promise.resolve()).then(job, job);
    return engine.chain;
  }
  function uciMove(g, u) { return g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }); }
  function clampScore(x) { return Math.max(-2000, Math.min(2000, x)); }
  /* Why the suggested move works when it looks like it loses something, plus a short line to play through. */
  function explainMove(m) {
    var g = new Chess(game.fen()), mv = g.move({ from: m.from, to: m.to, promotion: 'q' });
    var out = { text: '', line: [mv.san] };
    if (!mv) return Promise.resolve(out);
    var p = punish(g, mv);
    function fromPv() {
      var g2 = new Chess(game.fen()), sans = [], pv = (m.pv || []).slice(0, 3);
      for (var i = 0; i < pv.length; i++) { var x = uciMove(g2, pv[i]); if (!x) break; sans.push(x.san); }
      if (sans.length > 1) out.line = sans;
      return out;
    }
    if (!p || g.in_checkmate()) return Promise.resolve(fromPv());
    var reply = g.move(p.move.san); if (!reply) return Promise.resolve(fromPv());
    return analyse(450, g).then(function (res) {
      var fol = res && res[0] ? uciMove(g, res[0].uci) : null;
      if (!fol) { var c = bestCapture(g), mate = g.moves().filter(function (x) { return x.indexOf('#') >= 0; })[0]; fol = mate ? g.move(mate) : c && c.gain > 0 ? g.move(c.move.san) : null; }
      if (fol) {
        out.text = ' It looks like it loses the ' + NAME[reply.captured] + ', but if ' + ON() + ' takes with ' + reply.san + ', you have ' + fol.san + (fol.san.indexOf('#') >= 0 ? ', checkmate.' : '.');
        out.line = [mv.san, reply.san, fol.san];
      }
      return out;
    });
  }
  function lineFrames(sans) {
    var g = new Chess(game.fen()), fr = [];
    sans.forEach(function (san, i) {
      var m = g.move(san); if (!m) return;
      var mine = m.color === side;
      fr.push({ g: new Chess(g.fen()), last: m, cap: (i === 0 ? 'You play ' : mine ? 'Then you play ' : ON() + ' replies ') + m.san + (m.san.indexOf('#') >= 0 ? '. Checkmate.' : '.') });
    });
    return fr;
  }
  /* Engine check on the blunder alarm: drops false alarms, and catches blunders the simple check cannot see. */
  function engineVerdict(pre, mv, p) {
    if (!engine.ready || engine.failed || !pre) return Promise.resolve(p);
    var after1 = analyse(350), after2 = null;
    if (p) { var g2 = new Chess(game.fen()); if (g2.move(p.move.san) && !g2.game_over()) after2 = analyse(350, g2); }
    return Promise.all([pre, after1, after2]).then(function (r) {
      var a0 = r[0], a1 = r[1], a2 = r[2];
      if (!a0 || !a0.length || !a1 || !a1.length) return p;
      var before = clampScore(lineScore(a0[0])), after = clampScore(-lineScore(a1[0])), drop = before - after;
      /* the simple check names one capture: keep the alarm only if that capture really hurts */
      if (p && a2 && a2.length && clampScore(lineScore(a2[0])) >= before - 120) p = null;
      if (p && drop < 120) p = null;
      if (!p && drop >= 300 && after < 500) {
        var g = new Chess(game.fen()), rm = uciMove(g, a1[0].uci);
        if (rm) return { move: rm, text: 'That gives ' + ON() + ' a strong reply.' };
      }
      return p;
    });
  }
  function lineScore(l) { return l.mate != null ? (l.mate > 0 ? 100000 - l.mate : -100000 - l.mate) : (l.cp || 0); }
  /* The engine's choice, preferring a move that is easy to understand when it is nearly as good as the best. */
  function bestMove(f) {
    var g0 = game;
    return analyse(700).then(function (res) {
      if (game !== g0) return null;
      if (!res || !res.length) return suggestMove(f);
      var seen = seenMap(), top = lineScore(res[0]), cands = [];
      res.forEach(function (l, i) {
        var m = game.move({ from: l.uci.slice(0, 2), to: l.uci.slice(2, 4), promotion: l.uci[4] || 'q' }); if (!m) return;
        var c = { from: m.from, to: m.to, san: m.san, sc: lineScore(l), i: i, pv: l.pv, engine: true };
        c.clean = !punish(game, m) && !(seen[posKey(game)] > 0);
        try { c.met = !!(f && f.met && f.met(m)); } catch (e) { c.met = false; }
        game.undo(); cands.push(c);
      });
      if (!cands.length) return suggestMove(f);
      if (res[0].mate != null && res[0].mate > 0) return cands[0];
      var near = cands.filter(function (c) { return top - c.sc <= 60 && c.clean; });
      var onPrinciple = near.filter(function (c) { return c.met && top - c.sc <= 40; });
      return onPrinciple[0] || near[0] || cands[0];
    });
  }
  /* how often each position has already occurred in this game */
  function seenMap() {
    var g = new Chess(), seen = {}, h = game.history();
    seen[posKey(g)] = 1;
    for (var i = 0; i < h.length; i++) { if (!g.move(h[i])) return {}; var k = posKey(g); seen[k] = (seen[k] || 0) + 1; }
    return seen;
  }
  function suggestMove(f) {
    var best = null, sg = side === 'w' ? 1 : -1, seen = seenMap();
    if (f && f.asleep) f.mob0 = mobility(f.asleep);
    game.moves({ verbose: true }).forEach(function (m) {
      var mv = game.move(m), sc;
      if (game.in_checkmate()) sc = 1e6;
      else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) sc = -500;
      else {
        var rep = seen[posKey(game)] || 0, check = game.in_check();
        /* worst case after the opponent's reply, with an immediate recapture counted */
        sc = Infinity;
        var rs = game.moves({ verbose: true });
        for (var i = 0; i < rs.length; i++) {
          var r = game.move(rs[i]), v;
          if (game.in_checkmate()) v = -1e6;
          else {
            v = sg * evalPos(game);
            if (r.captured || r.san.indexOf('+') >= 0) { var c = bestCapture(game); if (c && c.gain > 0) v += c.gain * 100; }
            if (check) {
              /* after a check, look one move further for a follow-up that wins something */
              var fs = game.moves({ verbose: true });
              for (var j = 0; j < fs.length; j++) {
                var x = fs[j]; if (!x.captured && x.san.indexOf('+') < 0 && x.san.indexOf('#') < 0) continue;
                game.move(x);
                var e;
                if (game.in_checkmate()) e = 1e6;
                else { var oc = bestCapture(game); e = sg * evalPos(game) - (oc && oc.gain > 0 ? oc.gain * 100 : 0); }
                game.undo();
                if (e > v) v = e;
              }
            }
          }
          game.undo();
          if (v < sc) sc = v;
        }
        if (mv.piece !== 'p' && mv.piece !== 'k') sc += mobility(mv.to) * 2;
        try { if (f && f.met && f.name !== 'Safety' && !rep && f.met(mv)) sc += 80; } catch (e2) {}
        if (f && f.asleep && game.get(f.asleep) && mv.from !== f.asleep && mobility(f.asleep) > f.mob0) sc += 60;
        if (shieldPush(mv)) sc -= 60;
        if (mv.piece === 'n' && (mv.to[0] === 'a' || mv.to[0] === 'h')) sc -= 30;
        if (rep && material() >= 0) sc -= 300 * rep;
      }
      game.undo();
      if (!best || sc > best.sc) best = { sc: sc, from: m.from, to: m.to, san: m.san };
    });
    return best;
  }
  function flip(g) { var q = g.fen().split(' '); q[1] = q[1] === 'w' ? 'b' : 'w'; q[3] = '-'; var n = new Chess(); return n.load(q.join(' ')) ? n : null; }
  /* Shows Black's follow-up if White does nothing about it, then restores the position. */
  async function playIgnore(frames, intro) {
    var my = run, keep = game, keepLast = lastMove, keepA = arrows, keepM = marks;
    locked = true; sel = null; targets = []; boardEl.classList.add('dream'); cap(intro || 'Say you play something else.'); draw();
    await wait(1100);
    for (var i = 0; i < frames.length && my === run; i++) {
      var f = frames[i];
      game = f.g; lastMove = f.last; arrows = f.arrows || []; marks = []; badge = null; draw(f.last); moveSound(f.last); cap(f.cap);
      await wait(2100);
    }
    if (my !== run) return;
    game = keep; lastMove = keepLast; arrows = keepA; marks = keepM; boardEl.classList.remove('dream'); cap(''); locked = false; draw();
  }
  function cnt(sq) {
    var a = 0, d = 0;
    for (var n in sqEls) { var p = game.get(n); if (p && n !== sq && attacksFrom(n).indexOf(sq) >= 0) { if (p.color !== side) a++; else d++; } }
    return { a: a, d: d };
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function signed(n) { return (n > 0 ? '+' : '') + n; }
  function material() { var t = 0; game.board().forEach(function (row) { row.forEach(function (p) { if (p) t += (p.color === side ? 1 : -1) * VAL[p.type]; }); }); return t; }
  function find(color, type) { var out = []; for (var n in sqEls) { var p = game.get(n); if (p && p.color === color && p.type === type) out.push(n); } return out; }
  function dist(a, b) { return Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(+a[1] - +b[1])); }
  function blackKingExposed() {
    var o = opp(), k = find(o, 'k')[0], f = FILES.indexOf(k[0]), r = +k[1], n = 0, homeR = o === 'b' ? 8 : 1, fw = o === 'b' ? -1 : 1;
    if (Math.abs(r - homeR) >= 2) return k;
    if ((k[0] === 'e' || k[0] === 'd') && r === homeR && game.history().length < 24) return null;
    for (var d = -1; d <= 1; d++) { var ff = f + d; if (ff < 0 || ff > 7) continue; for (var st = 1; st <= 2; st++) { var rr = r + fw * st; if (rr < 1 || rr > 8) continue; var p = game.get(FILES[ff] + rr); if (p && p.color === o && p.type === 'p') { n++; break; } } }
    return n <= 1 ? k : null;
  }
  function listNames(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]; }
  /* Black pieces that hit f2 now, and ones that could after one move. */
  function f2Pressure() {
    var now = [], soon = [], arr = [], join = null;
    for (var n in sqEls) { var p = game.get(n); if (p && p.color === opp() && attacksFrom(n).indexOf(myF()) >= 0) { now.push(NAME[p.type] + ' on ' + n); arr.push([n, myF(), 'r']); } }
    try {
      var g2 = flip(game); if (!g2) throw 0;
      g2.moves({ verbose: true }).forEach(function (m) {
        if (m.piece === 'p' || m.piece === 'k' || m.captured) return;
        if (attacksFrom(m.from, g2).indexOf(myF()) >= 0) return;
        g2.move(m); var hits = attacksFrom(m.to, g2).indexOf(myF()) >= 0, wc = bestCapture(g2); g2.undo();
        if (wc && wc.move.to === m.to && wc.gain >= 1) hits = false;
        if (hits && !join) join = { from: m.from, to: m.to };
        if (hits && soon.indexOf(NAME[m.piece]) < 0) { soon.push(NAME[m.piece]); arr.push([m.from, m.to, 'r'], [m.to, myF(), 'r']); }
      });
    } catch (e) {}
    return { now: now, soon: soon, arrows: arr.slice(0, 5), join: join };
  }
  function developed(color) {
    var home = color === 'w' ? ['b1', 'g1', 'c1', 'f1'] : ['b8', 'g8', 'c8', 'f8'], n = 0;
    find(color, 'n').concat(find(color, 'b')).forEach(function (sq) { if (home.indexOf(sq) < 0) n++; });
    return n;
  }
  function mobility(sq, g) { g = g || game; var p = g.get(sq), n = 0; attacksFrom(sq, g).forEach(function (t) { var q = g.get(t); if (!q || q.color !== p.color) n++; }); return n; }
  function hintLine(t) { var o = focusEl.querySelector('.hintline'), d = focusEl.querySelector('.fdetail') || focusEl; if (!o) { o = el('p', 'why hintline'); d.appendChild(o); } o.textContent = t; focusEl.classList.add('open'); }
  /* Two-step hint: first the piece, then the square. */
  function stepHint(steps) { var i = 0; return { label: 'Hint', go: function () { var st = steps[Math.min(i, steps.length - 1)]; i++; marks = st.marks || []; arrows = st.arrows || []; hintLine(st.text); draw(); } }; }
  function safeMoves(filter) {
    var out = []; game.moves({ verbose: true }).forEach(function (m) { if (!filter(m)) return; game.move(m); var bad = punish(game, m), mob = bad ? 0 : mobility(m.to), chk = game.in_check(); game.undo(); if (!bad) out.push({ m: m, mob: mob, chk: chk }); });
    return out;
  }
  function worstPieceHint() {
    var pcs = [];
    for (var n in sqEls) { var p = game.get(n); if (p && p.color === side && p.type !== 'p' && p.type !== 'k') pcs.push({ sq: n, type: p.type, mob: mobility(n) }); }
    pcs.sort(function (a, b) { return a.mob - b.mob; });
    for (var i = 0; i < pcs.length; i++) {
      var pc = pcs[i], best = null; if (pc.mob > 6) break;
      safeMoves(function (m) { return m.from === pc.sq && !m.captured; }).forEach(function (x) { if (x.mob > pc.mob && (!best || x.mob > best.mob)) best = x; });
      if (best) return stepHint([
        { marks: [[pc.sq, 'p']], text: 'Your ' + NAME[pc.type] + ' on ' + pc.sq + ' reaches only ' + plural(pc.mob, 'square') + '. Where would it do more?' },
        { marks: [[pc.sq, 'p']], arrows: [[pc.sq, best.m.to, 'p']], text: 'From ' + best.m.to + ' it reaches ' + best.mob + '.' }]);
    }
    return stepHint([{ text: 'Every piece already has a job. A safe pawn move or doubling rooks is fine here.' }]);
  }
  function chooseFocus() {
    var r = repHere();
    if (r) return { name: 'Your opening', text: r.s.ask + ' (' + r.L.title + ')', arrows: (r.s.see || []).slice(), marks: (r.s.seeMarks || []).slice(),
      chips: [{ label: 'Show me', go: function () { var cur = repHere(); if (!cur) return; var m = game.move(mainOf(cur.s)); if (!m) return; game.undo(); arrows = [[m.from, m.to, 'p']]; hintSq = m.from; draw(); } }] };
    var seenNow = seenMap()[posKey(game)] || 0;
    if (seenNow >= 2) {
      var ahead = material();
      return { name: 'Repetition', text: 'This exact position has come up twice already. A third time is a draw.',
        why: ahead > 0 ? 'You are ' + ahead + ' points ahead, so a draw throws the win away. Play something you have not tried.' : ahead < 0 ? 'You are behind, so a draw would be a good result here.' : 'Material is level. Repeat only if you are happy with a draw.',
        met: function () { return (this.s0[posKey(game)] || 0) === 0; }, s0: seenMap(), done: 'A new position.', still: function () { return 'that repeats the position again.'; } };
    }
    if (game.in_check()) return { name: 'Safety', text: 'You are in check. Block it, take the checker, or move the king.', marks: find(side, 'k'), met: function () { return true; }, done: 'Check handled.' };
    var t = threatOnMe();
    var tsq = t ? t.move.to : null, c0 = t ? cnt(tsq) : null;
    if (t) return { name: 'Safety',
      ignore: function () { var g2 = flip(game); if (!g2) return null; var m = g2.move({ from: t.move.from, to: t.move.to, promotion: 'q' }); return m ? [{ g: g2, last: m, cap: ON() + ' takes your ' + NAME[t.move.captured] + '.' }] : null; },
      after: function (m) {
        if (m.from === tsq) return 'the ' + NAME[t.move.captured] + ' stepped out of the attack.';
        if (m.to === t.move.from) return 'attacker removed.';
        var c = cnt(tsq); return tsq + ' was ' + plural(c0.a, 'attacker') + ' against ' + plural(c0.d, 'defender') + '. Now ' + c.a + ' against ' + c.d + '.';
      }, text: 'Your ' + NAME[t.move.captured] + ' on ' + t.move.to + ' can be taken. Move it, defend it, or take the attacker.', arrows: [[t.move.from, t.move.to, 'r']],
      why: t.re ? ON() + '\'s ' + NAME[t.move.piece] + ' is worth less than your ' + NAME[t.move.captured] + ', so the trade loses material.' : 'Nothing of yours protects it, so ' + ON() + ' takes it for free.',
      met: function () { return true; }, done: 'Safe again.' };
    if (game.moves().some(function (x) { return x.indexOf('#') >= 0; })) return { name: 'Checks first', text: 'There is a checkmate in one. Look at every check.', met: function (m) { return m.san.indexOf('#') >= 0; }, done: 'Checkmate.' };
    var win = bestCapture(game);
    if (win && win.gain >= 1) return { name: 'Free material', text: ON() + ' has left something loose. Find it and take it.',
      chips: [stepHint([{ marks: [win.move.to], text: 'This ' + NAME[win.move.captured] + ' is loose. What can take it?' }, { marks: [win.move.to], arrows: [[win.move.from, win.move.to, 'r']], text: 'Take it.' }])], why: 'It is worth ' + win.gain + (win.gain === 1 ? ' point' : ' points') + ' for nothing. Free material decides most games at this level.', met: function (m) { return !!m.captured; }, done: 'Taken.', m0: material(),
      after: function () { return 'material ' + signed(this.m0) + ' to ' + signed(material()) + '.'; }, still: function () { return 'the loose piece is still there, for now.'; } };
    if (game.moves().indexOf('O-O') >= 0) {
      var pr = f2Pressure(), kw;
      if (pr.now.length) kw = ON() + '\'s ' + listNames(pr.now) + (pr.now.length > 1 ? ' already aim' : ' already aims') + ' at ' + myF() + ', and only your king guards it.' + (pr.soon.length ? ' The ' + listNames(pr.soon) + ' can join next move.' : '');
      else if (pr.soon.length) kw = ON() + '\'s ' + listNames(pr.soon) + ' can aim at ' + myF() + ' in one move, and only your king guards it. After castling the rook guards it too.';
      else kw = 'Nothing threatens it yet, which is the cheapest time to do it. It also brings your rook into the game.';
      return { name: 'King safety', text: 'Your king is still in the middle. Castle.', why: kw, arrows: [[S('e1'), S('g1'), 'p']].concat(pr.arrows), marks: pr.arrows.length ? [myF()] : [], k0: cnt(myF()),
        after: function () { var c = cnt(myF()); return myF() + ' was ' + plural(this.k0.a, 'attacker') + ' against ' + plural(this.k0.d, 'defender') + '. Now ' + c.a + ' against ' + c.d + '.'; },
        still: function () { var c = cnt(myF()); return c.a ? myF() + ' is still ' + plural(c.a, 'attacker') + ' against ' + plural(c.d, 'defender') + '.' : 'your king is still in the middle.'; },
        ignore: (pr.now.length + (pr.join ? 1 : 0)) < 2 ? null : function () {
          var g2 = flip(game), fr = []; if (!g2) return null;
          if (pr.now.length < 2) { var j = g2.move(pr.join); if (!j) return null; fr.push({ g: g2, last: j, cap: ON() + ' brings a second attacker.', arrows: [[j.to, myF(), 'r']] }); g2 = flip(g2); if (!g2) return fr; }
          var best = null; g2.moves({ verbose: true }).forEach(function (m) { if (m.to === myF() && (!best || VAL[m.piece] < VAL[best.piece])) best = m; });
          if (best) { var g3 = new Chess(g2.fen()), c = g3.move(best); fr.push({ g: g3, last: c, cap: c.san.indexOf('#') >= 0 ? 'Checkmate on ' + myF() + '.' : myF() + ' falls, and your king cannot take back.' }); }
          return fr;
        },
        met: function (m) { return m.san.indexOf('O-O') === 0; }, done: 'King safe.' };
    }
    var asleep = null;
    [['g1', 'n'], ['b1', 'n'], ['f1', 'b'], ['c1', 'b']].forEach(function (h) { var hs = S(h[0]), p = game.get(hs); if (!asleep && p && p.color === side && p.type === h[1]) asleep = hs; });
    if (asleep) return { name: 'Activity', text: 'This piece is not playing yet. Give it a job.', why: 'You have ' + developed(side) + ' of your 4 knights and bishops out. ' + ON() + ' has ' + developed(opp()) + '.', marks: [[asleep, 'p']], asleep: asleep, met: function (m) { return m.from === asleep; }, done: 'Another piece in the game.', d0: developed(side),
      after: function () { return 'pieces out, ' + this.d0 + ' to ' + developed(side) + ' of 4.'; }, still: function () { return 'that piece is still at home.'; } };
    var bk = blackKingExposed();
    var kh = null;
    if (bk) {
      var cands = safeMoves(function (m) { return m.piece !== 'p' && m.piece !== 'k'; }), pickd = null;
      cands.forEach(function (x) { var sc = (x.chk ? 10 : 0) + (dist(x.m.from, bk) - dist(x.m.to, bk)); if (sc > 0 && (!pickd || sc > pickd.sc)) pickd = { x: x, sc: sc }; });
      kh = pickd ? stepHint([{ marks: [bk, [pickd.x.m.from, 'p']], text: 'Your ' + NAME[pickd.x.m.piece] + ' on ' + pickd.x.m.from + ' can get closer.' }, { marks: [bk], arrows: [[pickd.x.m.from, pickd.x.m.to, 'p']], text: pickd.x.chk ? 'It arrives with check.' : 'One step nearer the king, and safe.' }]) : null;
    }
    if (bk) return { name: 'Attack the king', chips: kh ? [kh] : [], text: ON() + '\'s king has little cover. Bring pieces towards it, look at checks, and avoid trades.', why: 'A king without pawns in front of it cannot block checks, so every piece you bring arrives with a threat.', marks: [bk],
      seen0: seenMap(), met: function (m) { if ((this.seen0[posKey(game)] || 0) > 0) return false; return m.san.indexOf('+') >= 0 || (m.piece !== 'p' && m.piece !== 'k' && dist(m.to, bk) < dist(m.from, bk)); }, done: 'Closer to the king.',
      still: function () { return (this.seen0[posKey(game)] || 0) > 0 ? 'that position has been on the board before. Checks that repeat do not make progress.' : ''; } };
    var up = material();
    if (up >= 3) {
      var tr = []; game.moves({ verbose: true }).forEach(function (m) { if (m.captured && m.piece !== 'p' && m.piece !== 'k' && VAL[m.captured] === VAL[m.piece] && tr.length < 2) tr.push([m.from, m.to, 'p']); });
      return { name: 'Trade when ahead', text: 'You are ' + up + ' points up. Swap pieces, not pawns. With fewer pieces on, your extra one decides it.', why: 'Each trade removes a piece ' + ON() + ' could use to fight back.', arrows: tr, met: function (m) { return !!m.captured; }, done: 'Simpler, and still ahead.', after: function () { return 'still ' + signed(material()) + ', with fewer pieces left to fight back.'; } };
    }
    var rook = null, legal = game.moves({ verbose: true });
    function wp(file) { for (var rr = 2; rr <= 7; rr++) { var p = game.get(file + rr); if (p && p.color === side && p.type === 'p') return true; } return false; }
    legal.forEach(function (m) { if (!rook && m.piece === 'r' && m.from[1] === S('a1')[1] && m.to[1] === S('a1')[1] && wp(m.from[0]) && !wp(m.to[0])) { game.move(m); if (!punish(game, m)) rook = m; game.undo(); } });
    if (rook) return { name: 'Open lines', text: 'This rook is stuck behind its own pawn. Rooks want open files.', why: 'On the ' + rook.to[0] + '-file no pawn of yours blocks its view down the board.', arrows: [[rook.from, rook.to, 'p'], [rook.to, rook.to[0] + S('a7')[1], 'p']], met: function (m) { return m.piece === 'r'; }, done: 'Rook on an open file.' };
    var ps = plans();
    if (ps.length) return { name: 'Small improvements', text: 'Nothing urgent. Pick one plan and tap it to see it.', why: 'Nothing is hanging on either side, so the player who improves their pieces faster gets the attack.',
      chips: ps.map(function (pl) { return { label: pl.label, go: function () { arrows = pl.arrows; marks = pl.marks || []; draw(); } }; }),
      met: function (m) { return ps.some(function (pl) { return pl.arrows[0][0] === m.from && pl.arrows[0][1] === m.to; }); }, done: 'Plan under way.' };
    return { name: 'Activity', text: 'Nothing urgent. Find the piece of yours that reaches the fewest squares and give it a better one.', why: 'A piece that reaches few squares is not attacking or defending much.', chips: [worstPieceHint()], met: function () { return false; } };
  }
  function guideNow() {
    if (mode !== 'spar' || !store.guide || spar.over || game.turn() !== side) { showFocus(null); return; }
    showFocus(chooseFocus());
  }
  function preAnalyse() { spar.pre = mode === 'spar' && !spar.over && game.turn() === side ? analyse(450) : null; }
  /* Pushing the f- or g-pawn (or h4) in front of a castled king. */
  function shieldPush(mv) {
    if (mv.piece !== 'p' || mv.captured) return false;
    var k = find(side, 'k')[0];
    if (k !== S('g1') && k !== S('h1')) return false;
    return mv.from === S('f2') || mv.from === S('g2') || mv.to === S('h4') || mv.from === S('f3') || mv.from === S('g3');
  }
  /* Standard Italian plans that are legal and do not lose material in this position. */
  function plans() {
    var out = [], legal = game.moves({ verbose: true });
    /* squares are written from White's side and mirrored when you play Black */
    function W(sq, type) { var p = game.get(S(sq)); return !!p && p.color === side && p.type === type; }
    function B(sq, type) { var p = game.get(S(sq)); return !!p && p.color !== side && p.type === type; }
    function E(sq) { return !game.get(S(sq)); }
    function safe(from, to) {
      var ok = false, m = null;
      for (var i = 0; i < legal.length; i++) if (legal[i].from === from && legal[i].to === to) m = legal[i];
      if (!m) return false;
      game.move(m); ok = !punish(game, m); game.undo(); return ok;
    }
    function add(label, from, to, more) {
      from = S(from); to = S(to); more = (more || []).map(function (a) { return [S(a[0]), S(a[1]), a[2]]; });
      if (out.length < 3 && safe(from, to)) out.push({ label: label, arrows: [[from, to, 'p']].concat(more) });
    }
    if (game.moves().indexOf('O-O') >= 0) out.push({ label: 'Castle', arrows: [[S('e1'), S('g1'), 'p']] });
    if (W('g5', 'b') && B('f6', 'n') && B('g8', 'k')) {
      var m = null; legal.forEach(function (x) { if (x.from === S('g5') && x.to === S('f6')) m = x; });
      if (m) { game.move(m); var re = game.moves({ verbose: true }).filter(function (x) { return x.to === S('f6'); }); game.undo();
        if (re.length && re.every(function (x) { return x.piece === 'p'; })) add('Wreck his king\'s pawn cover', 'g5', 'f6', [['g7', 'f6', 'r']]); }
    }
    if (W('c1', 'b') && B('f6', 'n') && (B('d8', 'q') || B('e7', 'q'))) add('Pin his knight', 'c1', 'g5', [['g5', 'd8', 'r']]);
    if (W('b1', 'n') && E('d2')) add('Wake the queen\'s knight', 'b1', 'd2', [['d2', 'f1', 'p'], ['f1', 'g3', 'p']]);
    if (W('d2', 'n') && E('f1')) add('Continue the knight tour', 'd2', 'f1', [['f1', 'g3', 'p']]);
    if (W('f1', 'n') && E('g3')) add('Finish the knight tour', 'f1', 'g3', [['g3', 'f5', 'p']]);
    if (W('f1', 'r') && W('e4', 'p') && E('e1')) add('Rook behind the e-pawn', 'f1', 'e1');
    if (side === 'b') {
      if (W('c8', 'b') && E('e3') && (B('c5', 'b') || B('b6', 'b'))) add('Challenge his bishop', 'c8', 'e3', [['e3', 'c5', 'r']]);
      if (W('c4', 'b') && W('a2', 'p') && E('a3') && B('c6', 'p')) add('Give your bishop a retreat', 'a2', 'a3', [['c4', 'a2', 'p']]);
      if (W('c3', 'n') && W('d3', 'p') && E('e2') && E('g3') && W('e1', 'r')) add('Reroute the knight', 'c3', 'e2', [['e2', 'g3', 'p']]);
    } else {
      if (W('c3', 'p') && W('d3', 'p') && E('d4') && !W('b1', 'n') && !W('c1', 'b')) add('Break in the centre', 'd3', 'd4', [['c3', 'd4', 'd']]);
    }
    if (W('c4', 'b') && E('b3') && (B('e6', 'b') || B('a5', 'n') || B('b5', 'p'))) add('Tuck the bishop away', 'c4', 'b3');
    if (W('h2', 'p') && E('h3') && E('g4') && (B('c8', 'b') || B('d7', 'b') || B('e6', 'b'))) add('Keep pieces out of ' + S('g4'), 'h2', 'h3');
    return out;
  }
  function newSpar() {
    run++; spar.alarms = 0; spar.over = false; showFocus(null);
    var g = new Chess();
    if (side === 'w') ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'].forEach(function (m) { g.move(m); });
    else spar.fam = FAMILY[pick(FAMPICK[spar.wopen] || FAMPICK.any)];
    clearFeed(); inDemo = false; resetRibbon(side === 'w' ? 5 : 0); setGame(g); header(); renderRail(); renderUnder();
    say('info', side === 'w' ? 'Black replies, then it is a real game.' : 'White opens. You do not know with what.');
    botMove(true);
  }
  /* White's move when the bot has the white pieces: the chosen opening first, then the book, then search. */
  function whiteBotMove() {
    var win = bestCapture(game), mate = game.moves().some(function (x) { return x.indexOf('#') >= 0; });
    if (mate || (win && win.gain >= 1)) return botSearch();
    var n = Math.floor(game.history().length / 2), cands = [];
    if (spar.fam && n < spar.fam.length) cands.push(spar.fam[n]);
    (BOOK[posKey(game)] || []).slice().sort(function () { return Math.random() - 0.5; }).forEach(function (x) { cands.push(x); });
    for (var i = 0; i < cands.length; i++) {
      var m = game.move(cands[i]); if (!m) continue;
      var b = bestCapture(game), bad = b && b.gain - (m.captured ? VAL[m.captured] : 0) >= 2;
      game.undo();
      if (!bad || (i > 0)) return cands[i];
    }
    return botSearch();
  }
  function gameOver() {
    if (!game.game_over()) return false;
    spar.over = true; locked = true; showFocus(null);
    var t;
    if (game.in_checkmate()) { t = game.turn() !== side ? 'Checkmate. You won.' : 'Checkmate. ' + ON() + ' won this one.'; if (game.turn() !== side) sfx('win'); }
    else if (game.in_stalemate()) t = 'Stalemate: no legal move and no check. A draw.';
    else if (game.in_threefold_repetition()) t = 'Draw by repetition: the same position came up three times.';
    else t = 'The game is a draw.';
    say('ask', t);
    if (store.coach) say('info', 'Blunder warnings this game: ' + spar.alarms + '. The goal is zero.');
    actions([{ label: 'New game', go: newSpar }]);
    draw(); return true;
  }
  async function botMove(first) {
    var my = run; locked = true; draw();
    await wait(first ? 600 : 350); if (my !== run) return;
    var san;
    if (side === 'b') san = whiteBotMove();
    else { var opts = game.history().length === 5 ? FIRST[spar.opening] : BOOK[posKey(game)]; if (opts && opts.length) san = pick(opts); else san = botSearch(); }
    var m = playSan(san);
    say(m.color === 'b' ? 'black' : 'white', '', m.san);
    if (gameOver()) return;
    if (store.coach && !store.guide) {
      var mate = game.moves().some(function (x) { return x.indexOf('#') >= 0; });
      var b = bestCapture(game);
      if (mate) say('tip', 'You have mate in one. Look at every check.');
      else if (b && b.gain >= 2) say('tip', ON() + ' left something loose. Find it.');
    }
    locked = false; draw();
    preAnalyse();
    guideNow();
  }
  function sparMove(mv, fen) {
    if (gameOver()) return;
    function takeBack() { rewind(fen); locked = false; draw(); preAnalyse(); guideNow(); }
    if (store.guide) {
      game.undo(); var r = repHere(); game.move(mv);
      if (r) {
        if (r.s.good[mv.san]) { sfx('good'); badge = { sq: mv.to, kind: 'yes' }; draw(); say('good', r.s.good[mv.san], mv.san); botMove(); return; }
        var bad = r.s.bad && r.s.bad[mv.san], ok = r.s.ok && r.s.ok[mv.san], pp = punish(game, mv);
        sfx(ok ? 'ok' : 'bad'); badge = { sq: mv.to, kind: ok ? 'meh' : 'no' };
        if (pp) arrows = [[pp.move.from, pp.move.to, 'r']];
        draw();
        say(ok ? 'ok' : 'bad', ok || (bad ? (bad.text || 'You know this one: ' + bad.name + '.') : pp ? pp.text : 'Not your lesson move here.'), mv.san);
        if (!ok) spar.alarms++;
        actions([{ label: 'Take it back', go: takeBack }, { label: 'Play on anyway', go: function () { botMove(); } }]);
        return;
      }
    }
    var f = focus; showFocus(null);
    if (store.guide && shieldPush(mv) && !(f && f.met && f.name === 'Safety')) {
      sfx('ok'); badge = { sq: mv.to, kind: 'meh' }; draw();
      say('ok', 'King safety: that pawn was part of your king\'s shield. It can never go back.', mv.san);
      actions([{ label: 'Take it back', go: takeBack }, { label: 'Play on anyway', go: function () { botMove(); } }]);
      return;
    }
    var my = run, pre = spar.pre; spar.pre = null;
    engineVerdict(pre, mv, punish(game, mv)).then(function (p) {
      if (my !== run) return;
      var praised = false;
      if (store.guide && f && f.met && !p) {
        if (f.met(mv)) { praised = true; sfx('good'); badge = { sq: mv.to, kind: 'yes' }; draw(); if (phone()) { say('good', f.done, mv.san); var af = f.after ? f.after(mv) : ''; setSub(af ? af.charAt(0).toUpperCase() + af.slice(1) : ''); } else say('good', f.name + ': ' + (f.after ? f.after(mv) : f.done.charAt(0).toLowerCase() + f.done.slice(1)), mv.san); }
        else if (f.still) { var stl = f.still(mv); if (stl) { if (phone()) { say('ok', f.name, mv.san); setSub(stl.charAt(0).toUpperCase() + stl.slice(1)); } else say('ok', f.name + ': ' + stl, mv.san); } }
      }
      if (store.coach && !praised && p) {
        spar.alarms++;
        sfx('bad'); badge = { sq: mv.to, kind: 'no' }; arrows = [[p.move.from, p.move.to, 'r']]; draw();
        say('bad', p.text, mv.san);
        actions([
          { label: 'Take it back', go: takeBack },
          { label: 'Play on anyway', go: function () { botMove(); } }
        ]);
        return;
      }
      botMove();
    });
  }
  function sparUndo() {
    if (mode !== 'spar' || locked || game.history().length < (side === 'w' ? 7 : 2)) return;
    game.undo(); game.undo(); preAnalyse();
    var h = game.history({ verbose: true }); lastMove = h[h.length - 1]; clearDecor(); draw();
    guideNow();
  }

  /* ---------- side rail and controls ---------- */
  function renderRail() {
    var rail = $('#rail'); rail.textContent = ''; ALL_BAD = badNames();
    if (mode === 'learn') {
      rail.appendChild(el('h2', '', 'Lessons'));
      var list = null, grp = '';
      LESSONS.forEach(function (L, i) {
        if (!mine(i)) return;
        if (L.group !== grp) { grp = L.group; rail.appendChild(el('div', 'grp', grp)); list = el('div', 'lessons'); rail.appendChild(list); }
        var b = el('button', 'lesson'); b.type = 'button';
        b.appendChild(el('span', '', L.title));
        var pips = el('span', 'pips');
        L.steps.forEach(function (s, j) { pips.appendChild(el('i', store.done[key(L, j)] ? 'on' : '')); });
        b.appendChild(pips);
        if (i === li) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', function () { lessonOver = false; startLesson(i); });
        list.appendChild(b);
      });
      var shelf = el('div', 'shelf'), n = foundCount();
      shelf.appendChild(el('b', '', n + ' / ' + ALL_BAD.length));
      shelf.appendChild(el('small', '', 'mistakes collected. Play the tempting wrong move to find them.'));
      var meter = el('div', 'meter'), bar = el('span'); bar.style.width = (100 * n / ALL_BAD.length) + '%'; meter.appendChild(bar); shelf.appendChild(meter);
      rail.appendChild(shelf);
    } else if (mode === 'drill') {
      rail.appendChild(el('h2', '', 'Drill'));
      var st = el('div', 'stats');
      [[drill.streak, 'current streak'], [store.best, 'best streak'], [drill.seen, 'answered'], [drill.seen ? Math.round(100 * drill.right / drill.seen) + '%' : '–', 'correct']].forEach(function (x) {
        var c = el('div', 'stat'); c.appendChild(el('b', '', x[0])); c.appendChild(el('span', '', x[1])); st.appendChild(c);
      });
      rail.appendChild(st);
      rail.appendChild(el('p', '', 'One try each. Misses come back more often.'));
    } else if (mode === 'spar') {
      rail.appendChild(el('h2', '', 'Sparring'));
      var f = el('label', 'field', side === 'w' ? 'Black\'s third move' : 'White\'s opening'), s = el('select'); s.id = 'opening';
      var choices = side === 'w' ? [['any', 'Surprise me'], ['bc5', '3...Bc5 (quiet game)'], ['nf6', '3...Nf6 (Two Knights)'], ['odd', 'Something offbeat']]
        : [['any', 'Surprise me'], ['italian', 'The Italian'], ['raid', 'The queen raid'], ['ruy', 'The Ruy Lopez'], ['scotch', 'The Scotch'], ['knights', 'Knight to c3 first']];
      var cur = side === 'w' ? spar.opening : (spar.wopen || 'any');
      choices.forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; if (o[0] === cur) op.selected = true; s.appendChild(op); });
      s.addEventListener('change', function () { if (side === 'w') spar.opening = s.value; else spar.wopen = s.value; newSpar(); });
      f.appendChild(s); rail.appendChild(f);
      var c = el('label', 'check'), cb = el('input'); cb.type = 'checkbox'; cb.id = 'coachOn'; cb.checked = !!store.coach;
      cb.addEventListener('change', function () { store.coach = cb.checked; save(); });
      c.appendChild(cb); c.appendChild(el('span', '', 'Blunder check: stop me when my move loses material.'));
      rail.appendChild(c);
      rail.appendChild(el('p', '', 'Guide (button under the board): tap it to change the level. Show me: the principle is given. Ask me: you pick it from three. Hard: you pick from all of them. Red dots mark squares where a move loses material.'));
      rail.appendChild(el('p', '', 'A sloppy opponent: it sees simple captures and sometimes plays a random move.'));
    }
  }
  function renderUnder() {
    var u = $('#under'); u.textContent = '';
    function btn(label, fn, short) { var b = el('button', 'btn' + (short ? '' : ' sec'), label); b.type = 'button'; if (short) b.dataset.short = short; b.addEventListener('click', fn); u.appendChild(b); return b; }
    if (mode === 'learn') { btn('Hint', hint, 'Hint'); btn('Show me the move', showMove, 'Show'); btn('Restart lesson', restart); }
    else if (mode === 'drill') { btn('Skip this one', nextDrill, 'Skip'); }
    else if (mode === 'spar') {
      btn('New game', newSpar); btn('Take back a move', sparUndo, 'Undo');
      var gb = btn(GLABEL[store.glevel], function () {
        store.glevel = store.glevel % 4 + 1; store.guide = store.glevel < 4; store.gstreak = 0; store.gmiss = 0; save(); renderUnder();
        if (store.guide && !locked) guideNow(); else { showFocus(null); if (!locked) { clearDecor(); draw(); } }
      }, GLABEL[store.glevel]);
      gb.id = 'guide'; if (store.guide) gb.classList.add('pri');
    }
    var mr = $('#m-restart'); if (mr) mr.textContent = mode === 'spar' ? 'New game' : mode === 'drill' ? 'Skip this one' : 'Restart lesson';
  }
  function restart() { lessonOver = false; if (mode === 'spar') newSpar(); else if (mode === 'drill') nextDrill(); else if (mode === 'learn') startLesson(li); }

  /* ---------- modes ---------- */
  function setMode(m, data) {
    if (['learn', 'drill', 'spar', 'rules'].indexOf(m) < 0) m = 'learn';
    mode = m; run++; lessonOver = false; showFocus(null);
    document.querySelectorAll('.tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === m ? 'true' : 'false'); });
    $('#stage').hidden = m === 'rules'; $('#rules').hidden = m !== 'rules'; $('#credit').hidden = m !== 'rules';
    if (m === 'learn') startLesson(data && data.li != null && mine(data.li) ? data.li : firstOpenLesson(), data && data.li != null && mine(data.li) ? data.si : 0);
    else if (m === 'drill') { renderUnder(); nextDrill(); }
    else if (m === 'spar') newSpar();
  }
  function firstOpenLesson() {
    var first = -1;
    for (var i = 0; i < LESSONS.length; i++) { if (!mine(i)) continue; if (first < 0) first = i; for (var j = 0; j < LESSONS[i].steps.length; j++) if (!store.done[key(LESSONS[i], j)]) return i; }
    return first;
  }
  document.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () { try { location.hash = b.dataset.mode; } catch (e) {} setMode(b.dataset.mode); });
  });
  function sideLabel() { document.querySelectorAll('.sides button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.side === side ? 'true' : 'false'); }); $('#legend-x').textContent = 'Tap any ' + (side === 'w' ? 'black' : 'white') + ' piece to see what it hits.'; }
  document.querySelectorAll('.sides button').forEach(function (b) {
    b.addEventListener('click', function () { if (b.dataset.side === side) return; side = b.dataset.side; store.side = side; save(); sideLabel(); drill.cur = null; buildBoard(); setMode(mode); });
  });
  var menu = $('#menu');
  $('#more').addEventListener('click', function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; });
  document.addEventListener('click', function () { menu.hidden = true; });
  $('#m-rules').addEventListener('click', function () { try { location.hash = 'rules'; } catch (e) {} setMode('rules'); });
  $('#m-restart').addEventListener('click', function () { if (mode === 'rules') return; restart(); });
  $('#m-sound').addEventListener('click', function () { store.sound = !store.sound; save(); soundLabel(); sfx('move'); });
  var sb = $('#sound');
  function soundLabel() { $('#m-sound').textContent = store.sound ? 'Sound: on' : 'Sound: off'; sb.textContent = store.sound ? 'Sound on' : 'Sound off'; sb.setAttribute('aria-pressed', store.sound ? 'true' : 'false'); }
  sb.addEventListener('click', function () { store.sound = !store.sound; save(); soundLabel(); sfx('move'); });
  soundLabel();
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (h && h !== mode) setMode(h); });

  function start(data) {
    buildBoard(); sideLabel(); engineStart();
    var h = (location.hash || '').slice(1);
    var m = h || (data && data.mode) || 'learn';
    setMode(m, data && data.mode === m ? data : null);
  }
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return { mode: mode, li: li, si: Math.min(si, LESSONS[li].steps.length - 1) }; });
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});

  window.__trainer = { state: function () { return { mode: mode, side: side, li: li, si: si, locked: locked, focus: focus ? focus.name : null, fen: game.fen(), over: lessonOver, tap: nextTap(), why: whyOpen }; }, engine: function () { return { ready: engine.ready, failed: engine.failed }; }, show: function (fen) { setGame(new Chess(fen)); var f = chooseFocus(); focus = f; return bestMove(f).then(function (m) { return (m && m.san) + ' / ' + f.name + ' / quick: ' + suggestMove(f).san; }); }, best: function () { var r = repHere(); if (r) return mainOf(r.s); var m = suggestMove(focus || chooseFocus()); return m && m.san; }, verdict: function (fen, san) { run++; setGame(new Chess(fen)); var pre = analyse(450); var mv = game.move(san); var p0 = punish(game, mv); return engineVerdict(pre, mv, p0).then(function (p) { return 'simple check: ' + (p0 ? p0.text : 'none') + ' => final: ' + (p ? p.text + ' (' + p.move.san + ')' : 'no alarm'); }); }, show: function (fen) { run++; setGame(new Chess(fen)); locked = false; var f = chooseFocus(); focus = f; return bestMove(f).then(function (m) { return explainMove(m).then(function (ex) { return (m.engine ? 'engine ' : 'fallback ') + m.san + ' |' + ex.text + ' | ' + ex.line.join(' '); }); }); }, engineReady: function () { return engine.ready && !engine.failed; }, botSearch: botSearch, suggest: function (fen) { setGame(new Chess(fen)); return suggestMove(chooseFocus()).san + ' / ' + chooseFocus().name; }, peek: function (fen) { setGame(new Chess(fen)); locked = false; focusEl.hidden = false; focusEl.textContent = ''; var h = worstPieceHint(), out = []; h.go(); out.push(focusEl.textContent + ' ' + JSON.stringify(marks)); h.go(); out.push(focusEl.textContent + ' ' + JSON.stringify(arrows)); return out; } };
})();
