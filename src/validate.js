const { Chess } = require('chess.js');
const { LESSONS, BOOK_EXTRA, BOOK_EXTRA_B } = require('./lessons.js');
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
let errs = 0;
const fail = m => { errs++; console.log('ERR', m); };
function play(g, list, ctx) { for (const s of list) { if (!g.move(s)) { fail(ctx + ' illegal ' + s + ' in ' + list.join(' ') + '\n' + g.ascii()); return false; } } return true; }
function bestCapture(g) {
  let best = null;
  for (const m of g.moves({ verbose: true })) {
    if (!m.captured) continue;
    g.move(m);
    const re = g.moves({ verbose: true }).some(x => x.to === m.to && x.captured);
    g.undo();
    const gain = VAL[m.captured] - (re ? VAL[m.piece] : 0);
    if (!best || gain > best.gain) best = { san: m.san, gain };
  }
  return best;
}
for (const L of LESSONS) {
  const g = new Chess();
  play(g, L.setup, L.id + ' setup');
  L.steps.forEach((s, i) => {
    const ctx = L.id + ':' + i;
    const SQ=/^[a-h][1-8]$/;
    const chk=(arr,w)=>{ for(const x of arr||[]) if(!Array.isArray(x)||!SQ.test(x[0])||!SQ.test(x[1])||!'prd'.includes(x[2])||x[0]===x[1]) fail(ctx+' bad arrow '+w+JSON.stringify(x)); };
    chk(s.see,'see'); chk(s.arrows,'arrows'); if(s.pre){ chk(s.pre.arrows,'pre'); if(!s.pre.sqs&&!SQ.test(s.pre.sq)) fail(ctx+' pre sq'); }
    for(const b of Object.values(s.bad||{})) if(b.line){ if(!b.draws||b.draws.length!==b.line.length) fail(ctx+' draws mismatch '+b.name); else b.draws.forEach(d=>chk(d,'draw')); }
    if(!s.hint) fail(ctx+' no hint');
    const legal = g.moves();
    if (g.turn() !== (L.side || 'w')) fail(ctx + ' wrong side to move');
    for (const k of [...Object.keys(s.good), ...Object.keys(s.ok || {}), ...Object.keys(s.bad || {})]) if (!legal.includes(k)) fail(ctx + ' not legal/SAN mismatch: ' + k + ' legal=' + legal.join(','));
    for (const [k, b] of Object.entries(s.bad || {})) {
      if (b.line) {
        const h = new Chess(g.fen()); h.move(k);
        if (!play(h, b.line, ctx + ' bad ' + k)) continue;
        if (b.notes.length !== b.line.length) fail(ctx + ' notes mismatch ' + k);
      } else if (!b.text) fail(ctx + ' bad without text ' + k);
    }
    // report what the automatic blunder check would say for uncatalogued moves
    const flagged = [];
    for (const m of g.moves({ verbose: true })) {
      if (s.good[m.san] || (s.ok || {})[m.san] || (s.bad || {})[m.san]) continue;
      g.move(m);
      const mate = g.moves().find(x => x.includes('#'));
      const b = bestCapture(g);
      g.undo();
      const net = b ? b.gain - (m.captured ? VAL[m.captured] : 0) : 0;
      if (mate) flagged.push(m.san + '→' + mate); else if (net >= 1) flagged.push(m.san + '→' + b.san);
    }
    console.log(ctx.padEnd(12), Object.keys(s.good)[0].padEnd(6), '| auto-flag:', flagged.join(' '));
    // false-positive check on accepted moves
    for (const k of [...Object.keys(s.good), ...Object.keys(s.ok || {})]) {
      const m = g.move(k); const b = bestCapture(g); g.undo();
      const net = b ? b.gain - (m.captured ? VAL[m.captured] : 0) : 0;
      if (net >= 1) console.log('   note: accepted', k, 'allows', b.san, 'net', net);
    }
    const main = Object.keys(s.good)[0];
    g.move(main);
    if (s.why) { if (s.why.opts.filter(o => o.right).length !== 1) fail(ctx + ' why needs one right'); if (s.why.opts.some(o => !o.right && !o.note)) fail(ctx + ' why note'); }
    if (s.dream) { const h = new Chess(g.fen()); for (const f of s.dream) { chk(f.arrows, 'dream'); if (!f.cap) fail(ctx + ' dream cap'); if (f.play && !h.move(f.play)) fail(ctx + ' dream illegal ' + f.play); } }
    if (s.pre && s.pre.sqs && (!SQ.test(s.pre.target) || !'prd'.includes(s.pre.col))) fail(ctx + ' pre multi');
    if (s.reply) { if (!g.move(s.reply)) fail(ctx + ' reply illegal ' + s.reply); }
    else if (i !== L.steps.length - 1) fail(ctx + ' missing reply');
  });
}
for (const l of BOOK_EXTRA.concat(BOOK_EXTRA_B)) play(new Chess(), l, 'book');
console.log(errs ? errs + ' errors' : 'ALL OK');
