/* Lesson data, validated by validate.js.
   Arrow colours: 'p' your plan, 'r' attacks, 'd' defends.
   step.pre   : optional tap-the-square question before the move {q, sq, yes, arrows}
   step.see   : arrows shown with the question;  step.arrows : arrows shown with the answer
   step.good  : accepted moves (first is the main line);  step.ok : fine but not the lesson move
   step.bad   : collectable mistakes {name, line (Black starts), notes, draws (arrows per ply)} or {name, text} */
const OTHER = 'Good move, different opening. Use the king\'s pawn.';
const LATER = 'Useful later. King first.';
const ROOK1 = 'Good move, but rook first here.';
const ASLEEP = 'Fine, but your b1 knight is still asleep.';
const MISSED = 'Bishop saved, free pawn missed. Look at e5.';
const RAN = { name: 'The polite retreat', text: 'You ran from a pawn and missed a winning capture.' };
const EDGE = { name: 'The edge pawn', text: 'Edge pawns fight for nothing. The centre matters.' };
const LESSONS = [
  {
    id: 'first3', group: 'Foundations', title: 'The first three moves', setup: [],
    intro: 'Play what feels right. Wrong moves are part of the lesson.',
    steps: [
      {
        ask: 'Play White\'s first move.', short: 'Your first move.', hint: 'A centre pawn that frees your bishop and queen.',
        good: { e4: 'Centre claimed. Bishop and queen can get out.' },
        why: { q: 'Why a centre pawn first?', opts: [
          { t: 'It frees my bishop and queen', right: true },
          { t: 'It attacks Black\'s king', note: 'Nothing is attacked yet.' },
          { t: 'Every pawn should advance', note: 'Only the centre ones matter now.' }] }, arrows: [['f1', 'c4', 'p'], ['d1', 'h5', 'p']],
        ok: { d4: OTHER, Nf3: OTHER, c4: OTHER },
        bad: { f3: { name: 'The f3 habit', text: 'Steals your knight\'s square and opens your king.' }, h4: EDGE, a4: EDGE },
        reply: 'e5'
      },
      {
        ask: 'Develop a piece and attack something.', short: 'Develop with a threat.', hint: 'A knight can come out and hit e5.',
        good: { Nf3: 'Out with a threat. Black must defend e5.' },
        why: { q: 'Why the knight before the bishop?', opts: [
          { t: 'It makes a threat, so Black must react', right: true },
          { t: 'Knights are worth more', note: 'Same value: about 3 points each.' },
          { t: 'It protects my e4 pawn', note: 'From f3 it does not touch e4.' }] }, arrows: [['f3', 'e5', 'r']],
        ok: { Bc4: 'Fine, but the knight first makes a threat.', Nc3: 'Solid, but it threatens nothing.', d4: 'Playable, but your queen gets dragged out early.' },
        bad: {
          Qh5: {
            name: 'The early queen raid', line: ['Nc6', 'Bc4', 'g6', 'Qf3', 'Nf6'],
            notes: ['e5 defended.', 'Threat: mate on f7.', 'Blocked, and your queen is hit.', 'Mate threat again.', 'Blocked again. Black has two pieces out. You have a wandering queen.'],
            draws: [null, [['h5', 'f7', 'r']], [['g6', 'h5', 'r']], [['f3', 'f7', 'r']], null]
          },
          Ke2: { name: 'The Bongcloud', text: 'Blocks your bishop and queen. No castling, ever.' }
        },
        reply: 'Nc6', replyNote: 'Defends e5.'
      },
      {
        pre: { q: 'Tap the weakest square in Black\'s camp.', qs: 'Tap Black\'s weakest square.', sq: 'f7', yes: 'f7. Only the king guards it.', arrows: [['e8', 'f7', 'd']] },
        ask: 'Aim your bishop at it.', hint: 'Find the diagonal that ends on f7.',
        good: { Bc4: 'The Italian Game. Bishop hits f7, castling is next.' }, arrows: [['c4', 'f7', 'r']], marks: ['f7'],
        ok: { Bb5: 'That is the Ruy Lopez. Aim at f7 instead.', Be2: 'Too shy. Aim at f7.', Nc3: 'Fine, but bishop first.', d4: 'Fine, but bishop first.' },
        bad: {
          Nxe5: { name: 'The defended pawn', line: ['Nxe5'], notes: ['The c6 knight was guarding it. Knight for a pawn.'], draws: [null] },
          Bd3: { name: 'The tall pawn', text: 'Blocks your d-pawn and your other bishop.' }
        },
        reply: 'Bc5', replyNote: 'Black mirrors you.'
      }
    ],
    outro: 'Centre pawn. Knight with a threat. Bishop at f7.'
  },
  {
    id: 'quiet', group: 'Foundations', title: 'The quiet setup',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
    intro: 'Build your home setup, one move at a time.',
    steps: [
      {
        ask: 'You want d4 next. Prepare it with a pawn.', short: 'Prepare d4 with a pawn.', see: [['d2', 'd4', 'p']], hint: 'The pawn next door supports d4.',
        good: { c3: 'Now d4 comes with a pawn ready to recapture.' },
        why: { q: 'Why c3 before d4?', opts: [
          { t: 'So a pawn can recapture on d4', right: true },
          { t: 'To attack the bishop', note: 'c3 attacks nothing.' },
          { t: 'To help my b1 knight', note: 'It takes that knight\'s square.' }] },
        dream: [
          { play: 'd6', cap: 'Say Black plays a quiet move.' },
          { play: 'd4', cap: 'You push.', arrows: [['d4', 'c5', 'r'], ['d4', 'e5', 'r']] },
          { play: 'exd4', cap: 'Black takes.' },
          { play: 'cxd4', cap: 'A pawn takes back. Two centre pawns, and the bishop must run.', arrows: [['d4', 'c5', 'r']] }], arrows: [['d2', 'd4', 'p'], ['c3', 'd4', 'd']],
        ok: { d3: 'Fine, but c3 first keeps d4 in one go.', 'O-O': 'Never bad. Prepare d4 first.', Nc3: 'That square belongs to your c-pawn.', d4: 'Too soon: it just loses a pawn.' },
        bad: {
          Ng5: { name: 'Ng5 at the wrong time', line: ['Qxg5'], notes: ['The queen was watching g5 all along.'], draws: [null] },
          'Bxf7+': { name: 'The hopeful sacrifice', line: ['Kxf7', 'Ng5+', 'Qxg5'], notes: ['King takes.', 'A check...', 'Queen takes. Two pieces gone for a pawn.'], draws: [null, null, null] }
        },
        reply: 'Nf6'
      },
      {
        pre: { q: 'Black just attacked something. Tap it.', qs: 'What did Black attack?', sq: 'e4', yes: 'Your e4 pawn.', arrows: [['f6', 'e4', 'r']] },
        ask: 'Defend it with a pawn.', see: [['f6', 'e4', 'r']], hint: 'The d-pawn, one square.',
        good: { d3: 'Defended, and your c1 bishop is free.' }, arrows: [['d3', 'e4', 'd'], ['c1', 'g5', 'p']],
        ok: { d4: 'The sharp main line. Later.', Qe2: 'Let a pawn do a pawn\'s job.', Qc2: 'Let a pawn do a pawn\'s job.' },
        bad: {
          'O-O': { name: 'Castling past a threat', line: ['Nxe4'], notes: ['Free centre pawn. Threats first, plans second.'], draws: [null] },
          Ng5: { name: 'Attacking a defended square', line: ['O-O'], notes: ['Black castles. f7 has two guards now, and e4 still hangs.'], draws: [[['f8', 'f7', 'd'], ['g8', 'f7', 'd'], ['f6', 'e4', 'r']]] }
        },
        reply: 'd6'
      },
      {
        ask: 'Your king needs a home.', hint: 'Castle.',
        good: { 'O-O': 'Safe. Castle by move 8, every game.' },
        dream: [
          { cap: 'The rook wakes up too.', arrows: [['f1', 'e1', 'p']] },
          { cap: 'Three pawns shield your king.', marks: [['f2', 'd'], ['g2', 'd'], ['h2', 'd']] }],
        ok: { Bg5: LATER, Nbd2: LATER, h3: LATER, Bb3: LATER, b4: LATER },
        bad: { Ng5: { name: 'Attacking a defended square', line: ['O-O'], notes: ['Two attackers, two defenders. Nothing there.'], draws: [[['f8', 'f7', 'd'], ['g8', 'f7', 'd']]] } },
        reply: 'O-O'
      },
      {
        ask: 'Give your f1 rook a job.', hint: 'Behind the e-pawn.',
        good: { Re1: 'Guards e4 and frees f1 for a knight.' }, arrows: [['e1', 'e4', 'd']],
        ok: { h3: ROOK1, Nbd2: ROOK1, Bb3: ROOK1, Bg5: ROOK1, a4: ROOK1 },
        bad: {}, reply: 'a6'
      },
      {
        ask: 'Your b1 knight dreams of g3. Start the trip.', short: 'Knight to g3. First hop?', seeMarks: [['g3', 'p']], hint: 'First stop: d2.',
        good: { Nbd2: 'd2, f1, g3. The Italian knight tour.' },
        dream: [
          { play: 'Ba7', cap: 'Black waits.' },
          { play: 'Nf1', cap: 'Second hop.', arrows: [['f1', 'g3', 'p']] },
          { play: 'h6', cap: 'Black waits again.' },
          { play: 'Ng3', cap: 'Home. It shields the king and eyes f5.', arrows: [['g3', 'f5', 'p'], ['g3', 'h5', 'p']] }], arrows: [['b1', 'd2', 'p'], ['d2', 'f1', 'p'], ['f1', 'g3', 'p']], marks: [['g3', 'p']],
        ok: { h3: ASLEEP, Bb3: ASLEEP, a4: ASLEEP, Bg5: ASLEEP, Be3: ASLEEP },
        bad: { Na3: { name: 'Knight on the rim', text: 'From the edge a knight reaches almost nothing.' } }
      }
    ],
    outro: 'Your home base. Next: h3, Bb3, then d4 when everyone is ready.'
  },
  {
    id: 'liver', group: 'Attack', title: 'The Fried Liver',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'],
    intro: 'Black played 3...Nf6. You can attack at once.',
    steps: [
      {
        pre: { q: 'Tap the square only Black\'s king defends.', qs: 'Which square has one guard?', sq: 'f7', yes: 'f7 again.', arrows: [['e8', 'f7', 'd'], ['c4', 'f7', 'r']] },
        ask: 'Bring a second attacker.', see: [['c4', 'f7', 'r']], hint: 'Your knight can reach g5.',
        good: { Ng5: 'Two attackers, one defender.' },
        why: { q: 'Why does Ng5 work now, but not against 3...Bc5?', opts: [
          { t: 'The f6 knight blocks the queen from g5', right: true },
          { t: 'My bishop protects g5', note: 'Nothing of yours guards g5.' },
          { t: 'It gives check', note: 'No check. Look at the d8 to g5 diagonal.' }] },
        dream: [{ cap: 'The queen\'s view of g5 is blocked.', arrows: [['d8', 'f6', 'd']], marks: [['f6', 'd'], 'g5'] }], arrows: [['c4', 'f7', 'r'], ['g5', 'f7', 'r'], ['e8', 'f7', 'd']], marks: ['f7'],
        ok: { d3: 'Solid, but you can attack now.', d4: 'Sharp, but there is a direct hit on f7.' },
        bad: {
          Nc3: { name: 'The fork trick', line: ['Nxe4', 'Nxe4', 'd5'], notes: ['A free knight?', 'You take.', 'Fork. Black wins the piece back and owns the centre.'], draws: [null, null, [['d5', 'c4', 'r'], ['d5', 'e4', 'r']]] }
        },
        reply: 'd5', replyNote: 'Best defence. It blocks your bishop.'
      },
      {
        ask: 'Your bishop is attacked. Do better than retreat.', short: 'Bishop attacked. Don\'t retreat.', see: [['d5', 'c4', 'r']], hint: 'Take the attacker with a pawn.',
        good: { exd5: 'Attacker gone, pawn won, knight attacked.' }, arrows: [['d5', 'c6', 'r']],
        ok: { Bb3: 'Do not retreat. Take.', Bb5: 'Do not retreat. Take.', Bxd5: 'Take with the pawn. Keep your bishop.' },
        bad: {}, reply: 'Nxd5', replyNote: 'Natural, and a famous mistake.'
      },
      {
        ask: 'Only the king guards f7. Be brave.', short: 'f7 has one guard. Be brave.', see: [['c4', 'f7', 'r'], ['g5', 'f7', 'r'], ['e8', 'f7', 'd']], hint: 'Sacrifice the knight on f7.',
        good: { Nxf7: 'The Fried Liver. It forks queen and rook, so Black must take.' },
        why: { q: 'Why give up a whole knight?', opts: [
          { t: 'To drag the king into the open', right: true },
          { t: 'To win the f7 pawn', note: 'A pawn is not worth a knight.' },
          { t: 'To trade knights', note: 'Black\'s king takes it. No trade.' }] }, arrows: [['f7', 'd8', 'r'], ['f7', 'h8', 'r']],
        ok: { d4: 'Strong too. Learn the famous one first.', Qf3: 'Close. Rip the king out first.', 'O-O': 'Too slow. Strike now.' },
        bad: {}, reply: 'Kxf7'
      },
      {
        pre: { q: 'Tap Black\'s loose piece.', sq: 'd5', yes: 'Guarded only by the queen.', arrows: [['d8', 'd5', 'd'], ['c4', 'd5', 'r']] },
        ask: 'Find a check that also hits it.', short: 'A check that also hits it?', see: [['c4', 'd5', 'r']], hint: 'Queen to f3.',
        good: { 'Qf3+': 'Fork: check, plus a second attacker on the knight.' },
        dream: [
          { play: 'Kg8', cap: 'What if the king hides instead?' },
          { play: 'Bxd5+', cap: 'You take the knight with check.' },
          { play: 'Qxd5', cap: 'Black must take back.' },
          { play: 'Qxd5+', cap: 'And you win the queen. So the king has to step forward.' }], arrows: [['f3', 'f7', 'r'], ['f3', 'd5', 'r'], ['c4', 'd5', 'r']],
        ok: { 'Qh5+': 'A check, but it hits nothing else.' },
        bad: { 'Bxd5+': { name: 'Cashing in too early', line: ['Qxd5'], notes: ['Queen takes back. Attack over, piece down.'], draws: [null] } },
        reply: 'Ke6', replyNote: 'The king has to guard the knight himself.'
      },
      {
        pre: { q: 'Tap both defenders of the d5 knight.', qs: 'Tap d5\'s two defenders.', sqs: ['e6', 'd8'], target: 'd5', col: 'd', yes: 'Two defenders. You have two attackers.' },
        ask: 'Two against two. Add a third attacker.', short: 'Add a third attacker.', see: [['f3', 'd5', 'r'], ['c4', 'd5', 'r'], ['e6', 'd5', 'd'], ['d8', 'd5', 'd']], hint: 'Develop your last knight.',
        good: { Nc3: 'Three against two, and that knight is pinned.' }, arrows: [['c3', 'd5', 'r'], ['f3', 'd5', 'r'], ['c4', 'd5', 'r']],
        ok: { 'O-O': 'Too slow. Add an attacker to d5.', d4: 'Next move. First add an attacker to d5.' },
        bad: { 'Bxd5+': { name: 'Trading away the attack', line: ['Qxd5', 'Qxd5+', 'Kxd5'], notes: ['Queen takes.', 'Queens off.', 'No attackers left, and you are a knight down.'], draws: [null, null, null] } },
        reply: 'Ne7'
      },
      {
        ask: 'Blow the centre open onto the king.', short: 'Blow the centre open.', hint: 'Push the d-pawn two squares.',
        good: { d4: 'Lines open. The king cannot run. Castle next.' },
        why: { q: 'Why blow the centre open?', opts: [
          { t: 'Black\'s king is stuck there and my pieces need lines', right: true },
          { t: 'To win the e5 pawn', note: 'The pawn is not the prize. The king is.' },
          { t: 'To trade pieces', note: 'Never trade when you are the one attacking.' }] },
        dream: [
          { cap: 'Your last bishop gets out.', arrows: [['c1', 'g5', 'p']] },
          { cap: 'You castle, and a rook lands on the open file.', arrows: [['e1', 'c1', 'p'], ['a1', 'd1', 'p'], ['d1', 'd5', 'r']] },
          { cap: 'Everything points at a king with no cover.', arrows: [['f3', 'f7', 'r'], ['c4', 'd5', 'r'], ['c3', 'd5', 'r'], ['d4', 'e5', 'r']], marks: ['e6'] }], arrows: [['d4', 'e5', 'r'], ['c1', 'g5', 'p']],
        ok: { 'O-O': 'Good, but open the centre first.' }, bad: {}
      }
    ],
    outro: 'Ng5, take d5, Nxf7, Qf3+, Nc3, d4. Every move a threat.'
  },
  {
    id: 'na5', group: 'Attack', title: 'When Black knows the Fried Liver',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5'],
    intro: 'Stronger players hit your bishop instead. You still win a pawn.',
    steps: [
      {
        ask: 'Save the bishop with a check.', see: [['a5', 'c4', 'r']], hint: 'One square along, to b5.',
        good: { 'Bb5+': 'Safe, and Black must answer the check.' },
        why: { q: 'Why a check instead of a plain retreat?', opts: [
          { t: 'Black must answer it, so I lose no time', right: true },
          { t: 'It wins the knight', note: 'Nothing is won yet.' },
          { t: 'It protects my d5 pawn', note: 'The pawn is loose either way.' }] }, arrows: [['b5', 'e8', 'r']],
        ok: { d3: 'A real line. The check is simpler.', Bb3: 'The knight just takes it.', Be2: 'Safe, but a check gains time.', Bd3: 'Safe, but a check gains time.' },
        bad: {}, reply: 'c6'
      },
      {
        ask: 'Attacked again. Capture first.', see: [['c6', 'b5', 'r']], hint: 'Your d5 pawn takes.',
        good: { dxc6: 'Still a pawn up.' },
        ok: { Be2: 'You gave the pawn back. Capture first.', Ba4: 'You gave the pawn back. Capture first.' },
        bad: {}, reply: 'bxc6'
      },
      {
        ask: 'Now tuck the bishop away.', see: [['c6', 'b5', 'r']], hint: 'Next to your king, on e2.',
        good: { Be2: 'Safe. It also covers g4 for your knight.' },
        ok: { Bd3: 'Also good. This lesson uses e2.', Ba4: 'Risky out there. Stay near home.', Bf1: 'One square too far.' },
        bad: { 'Bxc6+': { name: 'One defender is enough', line: ['Nxc6'], notes: ['The a5 knight was guarding c6.'], draws: [null] } },
        reply: 'h6'
      },
      {
        ask: 'The knight is kicked. Bring it home.', short: 'Knight kicked. Bring it home.', see: [['h6', 'g5', 'r']], hint: 'Back to f3.',
        good: { Nf3: 'A clean pawn up. Castle and develop.' },
        ok: { Nh3: 'Playable, but f3 is its home.' },
        bad: {
          Nxf7: { name: 'A sacrifice with nothing behind it', line: ['Kxf7'], notes: ['No fork this time. Knight for a pawn.'], draws: [null] },
          Ne4: { name: 'Stepping onto an attacked square', line: ['Nxe4'], notes: ['The f6 knight was watching e4.'], draws: [null] }
        }
      }
    ],
    outro: 'Good defence still costs Black a pawn. That is enough to win.'
  },
  {
    id: 'h6', group: 'Attack', title: 'The useless ...h6',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'h6'],
    intro: 'Some opponents panic and kick the knight.',
    steps: [
      {
        pre: { q: 'Count first. Tap both attackers of f7.', qs: 'Tap f7\'s two attackers.', sqs: ['c4', 'g5'], target: 'f7', col: 'r', yes: 'Two attackers. One defender.' },
        ask: 'Two against one. Take it.', see: [['c4', 'f7', 'r'], ['g5', 'f7', 'r'], ['e8', 'f7', 'd']], hint: 'Knight takes f7.',
        good: { Nxf7: 'Fork. Black loses a rook.' }, arrows: [['f7', 'd8', 'r'], ['f7', 'h8', 'r'], ['c4', 'f7', 'd']],
        ok: { 'Bxf7+': 'Good, but the knight wins a whole rook.' },
        bad: { Nf3: RAN, Nh3: RAN },
        reply: 'Qe7'
      },
      { ask: 'Collect.', see: [['f7', 'h8', 'r']], hint: 'The rook in the corner.', good: { Nxh8: 'A rook up. Now develop and castle.' }, ok: {}, bad: {} }
    ],
    outro: 'Before you retreat, count attackers and defenders.'
  },
  {
    id: 'traxler', group: 'Attack', title: 'The Traxler bluff',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'Bc5'],
    intro: 'Black ignores your threat and aims at f2.',
    steps: [
      {
        ask: 'Take on f7. One way is safe, one is chaos.', short: 'Take f7. With which piece?', see: [['c5', 'f2', 'r']], hint: 'Capture with check.',
        good: { 'Bxf7+': 'With check. Black\'s king can never castle now.' },
        why: { q: 'Why the bishop and not the knight?', opts: [
          { t: 'It is check, so Black gets no time to hit f2', right: true },
          { t: 'The bishop is worth less', note: 'They are worth the same.' },
          { t: 'My knight is pinned', note: 'Nothing is pinned here.' }] },
        ok: { d4: 'Simpler: capture with check.', 'O-O': 'You missed a free pawn with check.' },
        bad: {
          Nxf7: {
            name: 'The Traxler counterattack', line: ['Bxf2+', 'Kxf2', 'Nxe4+', 'Kg1', 'Qh4'],
            notes: ['Black ignores your fork.', 'You take.', 'Check. The knight joins.', 'King back.', 'Mate on f2 is threatened and your pieces are asleep.'],
            draws: [null, null, null, null, [['h4', 'f2', 'r'], ['e4', 'f2', 'r']]]
          }
        },
        reply: 'Ke7'
      },
      {
        ask: 'The king attacks your bishop. Step back.', short: 'Bishop attacked. Step back.', see: [['e7', 'f7', 'r']], hint: 'Back along the diagonal.',
        good: { Bb3: 'Safe, a pawn up, and Black cannot castle.', Bd5: 'Safe, a pawn up, and Black cannot castle.', Bc4: 'Safe, a pawn up, and Black cannot castle.' },
        ok: {}, bad: {}
      }
    ],
    outro: 'With a choice of captures, look at the one with check first.'
  },
  {
    id: 'shilling', group: 'Traps to dodge', title: 'The free pawn that is not free',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4'],
    intro: 'Black leaves e5 undefended. It looks like a gift.',
    steps: [
      {
        ask: 'Free pawn on e5. Take it? Try it and see.', short: 'Free pawn on e5. Take it?', seeMarks: ['e5'], hint: 'Take the knight, not the pawn.',
        good: { Nxd4: 'Bait declined. Annoying knight removed.' },
        why: { q: 'What was the d4 knight for?', opts: [
          { t: 'Bait: it sets up ...Qg5 and a mate on f3', right: true },
          { t: 'Winning my c2 pawn', note: 'c2 is guarded by your queen.' },
          { t: 'Nothing, it was a blunder', note: 'It is a trap. Try taking e5 and see.' }] },
        ok: { c3: 'Fine. Taking the knight is simpler.', 'O-O': 'Fine. Taking the knight is simpler.', d3: 'Fine. Taking the knight is simpler.' },
        bad: {
          Nxe5: {
            name: 'The Blackburne Shilling trap', line: ['Qg5', 'Nxf7', 'Qxg2', 'Rf1', 'Qxe4+', 'Be2', 'Nf3#'],
            notes: ['Queen hits your knight and g2.', 'A fork. Winning?', 'Black ignores it. Rook attacked.', 'Rook moves.', 'Check. If the queen blocks, the knight takes it.', 'Bishop blocks.', 'Checkmate. Your own pieces box you in.'],
            draws: [[['g5', 'e5', 'r'], ['g5', 'g2', 'r']], [['f7', 'g5', 'r'], ['f7', 'h8', 'r']], [['g2', 'h1', 'r']], null, [['e4', 'e1', 'r']], null, [['f3', 'e1', 'r']]]
          }
        },
        reply: 'exd4'
      },
      {
        ask: 'Trap dodged. Make a useful move.', short: 'Now a useful move.', hint: 'Castle, or hit d4 with the c-pawn.',
        good: { 'O-O': 'King safe. Next, hit d4 with c3.', c3: 'Hits the pawn and opens the centre.' },
        ok: { d3: 'Solid. Castling does more.' }, bad: {}
      }
    ],
    outro: 'Free pawn in the opening? Ask what the piece that moved is doing now.'
  },
  {
    id: 'f2', group: 'Traps to dodge', title: 'Your own f2',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'Ng4'],
    intro: 'What you do to f7, Black can do to f2.',
    steps: [
      {
        pre: { q: 'Tap the square Black is aiming at.', qs: 'Where is Black aiming?', sq: 'f2', yes: 'Two attackers. Only your king defends.', arrows: [['c5', 'f2', 'r'], ['g4', 'f2', 'r'], ['e1', 'f2', 'd']] },
        ask: 'One move fixes it.', see: [['c5', 'f2', 'r'], ['g4', 'f2', 'r']], hint: 'Castle.',
        good: { 'O-O': 'Rook and king both guard f2 now.' },
        dream: [
          { play: 'Nxf2', cap: 'What if Black takes anyway?' },
          { play: 'Rxf2', cap: 'Rook takes.' },
          { play: 'Bxf2+', cap: 'Bishop takes.' },
          { play: 'Kxf2', cap: 'Two pieces for a rook and pawn. Good for you.' }], arrows: [['f1', 'f2', 'd'], ['g1', 'f2', 'd'], ['c5', 'f2', 'r'], ['g4', 'f2', 'r']],
        ok: { d4: 'Messy. One move covers f2 and helps your king.', Qe2: 'It works, but it ties your queen down.', Rf1: 'You gave up castling. Do both at once.' },
        bad: {
          h3: { name: 'Kicking a knight into a fork', line: ['Nxf2', 'Qe2', 'Nxh1'], notes: ['Fork. The bishop guards the knight, so your king cannot take.', 'The queen runs.', 'A rook gone.'], draws: [[['f2', 'd1', 'r'], ['f2', 'h1', 'r'], ['c5', 'f2', 'd']], null, null] }
        }
      }
    ],
    outro: 'Until you castle, f2 is your f7.'
  },
  {
    id: 'loose', group: 'Punish', title: 'The defender that wandered off',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Na5'],
    intro: 'Weak opponents move pieces without asking what they were guarding.',
    steps: [
      {
        pre: { q: 'The knight left c6. Tap what it was guarding.', qs: 'What was that knight guarding?', sq: 'e5', yes: 'e5 has no defender now.', arrows: [['f3', 'e5', 'r']] },
        ask: 'Take the free pawn.', see: [['f3', 'e5', 'r'], ['a5', 'c4', 'r']], hint: 'Knight takes e5.',
        good: { Nxe5: 'Free pawn. If Black takes your bishop, the knight takes back.' }, arrows: [['e5', 'c4', 'd'], ['a5', 'c4', 'r']],
        ok: { 'Bxf7+': 'No need to gamble. Take the free pawn.', Be2: MISSED, Bb3: MISSED, Bb5: MISSED, Bd3: MISSED },
        bad: {}, reply: 'Nxc4'
      },
      { ask: 'Take back.', see: [['e5', 'c4', 'p']], hint: 'Knight takes c4.', good: { Nxc4: 'A pawn up. Simple chess wins.' }, ok: {}, bad: {} }
    ],
    outro: 'After every enemy move: what did that piece stop guarding?'
  },
  {
    id: 'legal', group: 'Punish', title: 'Légal\'s mate',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Nc3', 'Bg4', 'h3', 'Bh5'],
    intro: 'Black pins your knight to your queen.',
    steps: [
      {
        pre: { q: 'Tap what Black wins if your f3 knight moves.', qs: 'What is your knight pinned to?', sq: 'd1', yes: 'The pin: bishop, knight, queen in a line.', arrows: [['h5', 'd1', 'r']] },
        ask: 'Move the knight anyway. Dare Black to take the queen.', short: 'Move the knight anyway.', see: [['h5', 'd1', 'r']], hint: 'Knight takes e5.',
        good: { Nxe5: 'A queen sacrifice. Taking it walks into mate.' },
        why: { q: 'Why can you leave the queen hanging?', opts: [
          { t: 'If Black takes it, I have a forced mate', right: true },
          { t: 'Black cannot take it', note: 'Black can. That is the trap.' },
          { t: 'A knight is worth more', note: 'A queen is 9, a knight 3.' }] }, arrows: [['c4', 'f7', 'r'], ['e5', 'f7', 'r']],
        ok: { g4: 'Safe, but something spectacular is on.', Be2: 'Safe, but something spectacular is on.' },
        bad: {}, reply: 'Bxd1', replyNote: 'Black takes the queen.'
      },
      { ask: 'A queen down. Give check.', see: [['c4', 'f7', 'r']], hint: 'Bishop takes f7.', good: { 'Bxf7+': 'The king has one square.' }, arrows: [['e8', 'e7', 'p']], ok: {}, bad: {}, reply: 'Ke7' },
      { ask: 'One more check ends it.', hint: 'The c3 knight jumps in.', good: { 'Nd5#': 'Légal\'s mate. Three small pieces, no queen needed.' }, arrows: [['d5', 'e7', 'r'], ['f7', 'e8', 'r'], ['f7', 'e6', 'r'], ['e5', 'd7', 'r'], ['d5', 'f6', 'r']], ok: {}, bad: {} }
    ],
    outro: 'A pin only works if moving the piece costs more than it wins.'
  },
  {
    id: 'legal2', group: 'Punish', title: 'When Black does not take the queen',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Nc3', 'Bg4', 'h3', 'Bh5', 'Nxe5', 'Nxe5'],
    intro: 'Same trick, but Black takes the knight instead.',
    steps: [
      { ask: 'The pin is gone. Collect.', see: [['d1', 'h5', 'r']], hint: 'The h5 bishop has no defender.', good: { Qxh5: 'Piece back, pawn up.' }, ok: {}, bad: {}, reply: 'Nxc4', replyNote: 'Black grabs your bishop.' },
      { ask: 'Find a check that also hits the c4 knight.', short: 'A check that also hits c4?', seeMarks: ['c4'], hint: 'Slide the queen along the fifth rank.', good: { 'Qb5+': 'Fork: king and knight.' },
        why: { q: 'Why does this win the knight?', opts: [
          { t: 'Black must deal with the check first', right: true },
          { t: 'The knight is pinned', note: 'It is not pinned. It just runs out of time.' },
          { t: 'The queen is protected', note: 'Nothing attacks the queen anyway.' }] }, arrows: [['b5', 'e8', 'r'], ['b5', 'c4', 'r']], ok: {}, bad: {}, reply: 'c6' },
      { ask: 'Finish the job.', see: [['b5', 'c4', 'r']], hint: 'Take the knight.', good: { Qxc4: 'A clean pawn up. Most games are won like this.' }, ok: {}, bad: {} }
    ],
    outro: 'Look for queen checks that also hit a loose piece. Every move.'
  }
  ,
  /* ------------------------------ Black ------------------------------ */
  {
    id: 'bfirst', side: 'b', group: 'Foundations', title: 'Your first three moves as Black', setup: ['e4'],
    intro: 'Same ideas, other side of the board.',
    steps: [
      {
        ask: 'White took the centre. Take your share.', short: 'Take your share of the centre.', hint: 'Mirror the king\'s pawn.',
        good: { e5: 'An equal share of the centre. Bishop and queen can get out.' }, arrows: [['f8', 'c5', 'p'], ['d8', 'h4', 'p']],
        ok: { c5: 'Good move, different opening (the Sicilian). Use the king\'s pawn.', e6: 'Good move, different opening (the French). Use the king\'s pawn.', d5: 'Playable, but your queen gets dragged out early. Use the king\'s pawn.', Nf6: 'A real defence, but a different book. Use the king\'s pawn.' },
        bad: { f6: { name: 'The f6 habit', text: 'Steals your knight\'s square and opens your king.' }, a5: EDGE, h5: EDGE },
        reply: 'Nf3', replyNote: 'A knight comes out with a threat.'
      },
      {
        pre: { q: 'Tap what White is attacking.', qs: 'What is White attacking?', sq: 'e5', yes: 'Your e5 pawn.', arrows: [['f3', 'e5', 'r']] },
        ask: 'Defend it with a developing move.', short: 'Defend it and develop.', see: [['f3', 'e5', 'r']], hint: 'A knight can guard e5.',
        good: { Nc6: 'Defended, and a piece is out.' }, arrows: [['c6', 'e5', 'd']],
        why: { q: 'Why a knight and not the f-pawn?', opts: [
          { t: 'It develops a piece and keeps my king closed', right: true },
          { t: 'Pawns cannot defend pawns', note: 'They can. But try ...f6 and watch.' },
          { t: 'The knight attacks e4', note: 'From c6 it does not reach e4.' }] },
        ok: { d6: 'Solid, but it shuts in your bishop. Use a knight.', Nf6: 'A real defence (the Petrov), but a different book.', Qe7: 'Let a knight do it. The queen blocks your bishop.', Qf6: 'Let a knight do it. The queen takes your knight\'s square.' },
        bad: {
          f6: {
            name: 'The Damiano blunder', line: ['Nxe5', 'fxe5', 'Qh5+', 'Ke7', 'Qxe5+', 'Kf7', 'Bc4+'],
            notes: ['White takes anyway.', 'You take the knight.', 'Check. Your f-pawn used to block this line.', 'The king has to walk.', 'Check again, and a pawn falls.', 'Still running.', 'More pieces arrive with check. Your king is in the open on move 6.'],
            draws: [null, null, [['h5', 'e8', 'r'], ['h5', 'e5', 'r']], null, [['e5', 'h8', 'r']], null, [['c4', 'f7', 'r']]]
          },
          Bd6: { name: 'The tall pawn', text: 'Blocks your d-pawn and your other bishop.' }
        },
        reply: 'Bc4', replyNote: 'The Italian. You know this bishop.'
      },
      {
        pre: { q: 'Tap the square White\'s bishop aims at.', qs: 'Where does that bishop aim?', sq: 'f7', yes: 'Your weak spot. Only the king guards it.', arrows: [['c4', 'f7', 'r'], ['e8', 'f7', 'd']] },
        ask: 'Put your bishop on its best diagonal.', short: 'Bishop to its best diagonal.', see: [['c4', 'f7', 'r']], hint: 'Mirror White\'s bishop.',
        good: { Bc5: 'Mirror image. Your bishop aims at f2.' }, arrows: [['c5', 'f2', 'r']], marks: ['f2'],
        ok: { Nf6: 'A real defence (the Two Knights), but it invites Ng5. That is stage two. Bishop first.', Be7: 'Solid but shy. Aim at f2.', d6: 'Fine, but get the bishop out before the pawn shuts it in.', h6: 'A wasted move. Develop a piece.' },
        bad: { Na5: { name: 'The defender that wandered off', line: ['Nxe5'], notes: ['That knight was guarding e5.'], draws: [null] } }
      }
    ],
    outro: 'Pawn to e5, knight to c6, bishop to c5.'
  },
  {
    id: 'bquiet', side: 'b', group: 'Foundations', title: 'The mirror setup',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3'],
    intro: 'White prepares d4. Build the home base you already know.',
    steps: [
      {
        ask: 'Develop a piece and attack something.', short: 'Develop with a threat.', hint: 'Your g8 knight can hit e4.',
        good: { Nf6: 'Out with a threat. White must look after e4.' }, arrows: [['f6', 'e4', 'r']],
        ok: { d6: 'Fine, but the knight makes a threat first.', Qe7: 'Playable, but develop a knight first.', Nge7: 'It develops, but from e7 the knight attacks nothing.' },
        bad: {}, reply: 'd3'
      },
      {
        ask: 'Support e5 and free your last bishop.', short: 'Support e5, free the bishop.', hint: 'The d-pawn, one square.',
        good: { d6: 'e5 is solid and your c8 bishop can get out.' }, arrows: [['d6', 'e5', 'd'], ['c8', 'g4', 'p']],
        ok: { 'O-O': 'Good, and it comes next. Pawn first here.', a6: 'Useful soon. Centre first.', h6: 'Useful later. Centre first.' },
        bad: { Ng4: { name: 'The premature raid', line: ['O-O'], notes: ['White castles. f2 has two guards and your knight has wasted a move.'], draws: [[['f1', 'f2', 'd'], ['g1', 'f2', 'd']]] } },
        reply: 'O-O'
      },
      {
        ask: 'Your king needs a home too.', short: 'Your king needs a home.', hint: 'Castle.',
        good: { 'O-O': 'Safe. Same rule as White: castled by move 8.' },
        ok: { Bg4: LATER, a6: LATER, h6: LATER, Be6: LATER },
        bad: { Ng4: { name: 'Attacking a defended square', line: ['h3'], notes: ['f2 is guarded twice. The pawn just kicks you back.'], draws: [[['h3', 'g4', 'r']]] } },
        reply: 'Re1'
      },
      {
        pre: { q: 'White wants to chase your c5 bishop with a pawn. Tap that pawn.', qs: 'Which pawn will chase your bishop?', sq: 'b2', yes: 'b4 is coming, then a4 and a5.', arrows: [['b2', 'b4', 'r'], ['b4', 'c5', 'r']] },
        ask: 'Give the bishop an escape square.', short: 'Give the bishop an escape.', see: [['b2', 'b4', 'r']], hint: 'The a-pawn, one square.',
        good: { a6: 'Now the bishop can drop back to a7 and keep its diagonal.' }, arrows: [['c5', 'a7', 'p']],
        ok: { a5: 'Also good: it stops b4 altogether.', Bb6: 'Fine too. The pawn move keeps more options.', h6: 'Useful, but look after your bishop first.', Be6: 'Good move, but look after your c5 bishop first.' },
        bad: {}, reply: 'Nbd2'
      },
      {
        ask: 'Challenge White\'s best piece.', see: [['c4', 'f7', 'r']], hint: 'Your c8 bishop can face it.',
        good: { Be6: 'If White trades, you take back with the f-pawn.' }, arrows: [['e6', 'c4', 'r'], ['f7', 'e6', 'd']],
        dream: [
          { play: 'Bxe6', cap: 'If White trades bishops...' },
          { play: 'fxe6', cap: 'f7 is no longer a target, and your pawns cover d5 and f5.', marks: [['d5', 'd'], ['f5', 'd']] }],
        ok: { Ba7: 'Good, and coming. Get the last bishop out first.', h6: 'Fine. But one piece is still at home.', Bg4: 'A real pin. This lesson uses e6.', Re8: 'Fine. But one piece is still at home.' },
        bad: {}
      }
    ],
    outro: 'Your home base as Black: pawns e5 and d6, knights c6 and f6, bishops c5 and e6, castled. Next: Ba7, Re8, h6.'
  },
  {
    id: 'bng5', side: 'b', group: 'Counter-punches', title: 'When White lunges with Ng5',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'Ng5'],
    intro: 'You know this one from the other side: Ng5 at the wrong time.',
    steps: [
      {
        pre: { q: 'Tap your piece that can see g5.', qs: 'Which piece sees g5?', sq: 'd8', yes: 'The queen has a clear diagonal.', arrows: [['d8', 'g5', 'r']] },
        ask: 'Punish it.', see: [['d8', 'g5', 'r']], hint: 'Take the knight.',
        good: { Qxg5: 'A free knight.' },
        ok: { Nh6: 'It guards f7, but the knight was free.', Qe7: 'It guards f7, but the knight was free.', Qf6: 'It guards f7, but the knight was free.' },
        bad: { Nf6: { name: 'Blocking your own queen', line: ['Nxf7'], notes: ['Fork on queen and rook. Your knight shut the queen\'s view of g5.'], draws: [[['f7', 'd8', 'r'], ['f7', 'h8', 'r']]] } },
        reply: 'd4', replyNote: 'A trick: the pawn hits your bishop and uncovers an attack on your queen.'
      },
      {
        ask: 'Queen and bishop are both attacked. Save the queen by taking something.', short: 'Two pieces attacked. Queen takes what?', see: [['c1', 'g5', 'r'], ['d4', 'c5', 'r']], hint: 'The g2 pawn.',
        good: { Qxg2: 'Queen safe, pawn won, and now White\'s rook is attacked.' }, arrows: [['g2', 'h1', 'r']],
        ok: { Qg6: 'Safe, but White takes your bishop. Take something first.', Qf6: 'Safe, but White takes your bishop. Take something first.', Qh4: 'Safe, but White takes your bishop. Take something first.' },
        bad: {}, reply: 'Rf1'
      },
      {
        ask: 'Now deal with the attack on your bishop, with profit.', short: 'Save the bishop, with profit.', see: [['d4', 'c5', 'r']], hint: 'Take the d4 pawn.',
        good: { Bxd4: 'A knight and two pawns up.', Nxd4: 'A knight and two pawns up.', 'Qxe4+': 'Check first, then the d4 pawn. Also winning.' },
        ok: { Bb6: 'Safe, and still a knight up. You could have taken a pawn too.' }, bad: {}
      }
    ],
    outro: 'Before you defend against a threat, check whether the attacker is simply hanging.'
  },
  {
    id: 'bfork', side: 'b', group: 'Counter-punches', title: 'The fork trick',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'Bc4'],
    intro: 'White brought the c3 knight out before you played ...Bc5. That allows a trick.',
    steps: [
      {
        ask: 'Take a pawn that looks defended.', short: 'Take the pawn anyway.', seeMarks: ['e4'], hint: 'Knight takes e4.',
        good: { Nxe4: 'It looks like a blunder. It is not.' },
        why: { q: 'Why is this safe?', opts: [
          { t: 'After White retakes, ...d5 forks bishop and knight', right: true },
          { t: 'The e4 pawn had no defender', note: 'The c3 knight defends it.' },
          { t: 'White cannot take back', note: 'White can. The trick comes after.' }] },
        ok: { Bc5: 'Solid and fine. But there is a trick here worth knowing.', Bb4: 'Fine. But there is a trick here worth knowing.', d6: 'Fine. But there is a trick here worth knowing.', Be7: 'Fine. But there is a trick here worth knowing.' },
        bad: {}, reply: 'Nxe4'
      },
      {
        ask: 'Win the piece back.', hint: 'A pawn move that attacks two pieces.',
        good: { d5: 'The pawn forks bishop and knight. One of them falls.' }, arrows: [['d5', 'c4', 'r'], ['d5', 'e4', 'r']],
        ok: {}, bad: {}, reply: 'Bd3', replyNote: 'White saves the bishop and guards the knight.'
      },
      {
        ask: 'Take the knight.', see: [['d5', 'e4', 'r']], hint: 'Pawn takes e4.',
        good: { dxe4: 'Piece back. After White retakes you have the centre and easy development.' }, ok: {}, bad: {}
      }
    ],
    outro: 'Knight on c3, bishop on c4, your bishop still on f8: look for ...Nxe4 and ...d5.'
  },
  {
    id: 'braid', side: 'b', group: 'Counter-punches', title: 'The queen raid',
    setup: ['e4', 'e5', 'Qh5'],
    intro: 'The most common trick below 800. Stay calm and it gives you a better game.',
    steps: [
      {
        pre: { q: 'Tap what the queen attacks right now.', qs: 'What does the queen attack?', sq: 'e5', yes: 'e5 first. f7 only matters once a bishop joins.', arrows: [['h5', 'e5', 'r'], ['h5', 'f7', 'r']] },
        ask: 'Defend e5 with a developing move.', short: 'Defend e5 and develop.', see: [['h5', 'e5', 'r']], hint: 'The b8 knight.',
        good: { Nc6: 'Pawn defended, piece out.' }, arrows: [['c6', 'e5', 'd']],
        ok: { d6: 'It defends, but a knight does it and develops.', Qe7: 'Playable, but develop a knight instead.', Qf6: 'Playable, but develop a knight instead.' },
        bad: {
          g6: { name: 'Kicking the queen into your rook', line: ['Qxe5+', 'Qe7', 'Qxh8'], notes: ['The queen takes with check.', 'You block.', 'And the rook goes too. Defend first, kick second.'], draws: [[['e5', 'e8', 'r'], ['e5', 'h8', 'r']], null, null] },
          Nf6: { name: 'Developing past a threat', line: ['Qxe5+'], notes: ['e5 had no defender. Check, and a pawn gone.'], draws: [null] },
          Ke7: { name: 'The four-move disaster', line: ['Qxe5#'], notes: ['Checkmate. Your king blocked its own escape.'], draws: [null] }
        },
        reply: 'Bc4', replyNote: 'Now a bishop joins.'
      },
      {
        pre: { q: 'Tap the square where White threatens mate.', qs: 'Where is mate threatened?', sq: 'f7', yes: 'Queen and bishop both hit it.', arrows: [['h5', 'f7', 'r'], ['c4', 'f7', 'r']] },
        ask: 'Block the queen and attack it at the same time.', short: 'Block the queen and hit it.', see: [['h5', 'f7', 'r'], ['c4', 'f7', 'r']], hint: 'The g-pawn.',
        good: { g6: 'Mate stopped, and the queen has to move again.' }, arrows: [['g6', 'h5', 'r']],
        ok: { Qe7: 'It stops mate. A pawn move does it and gains time.', Qf6: 'It stops mate. A pawn move does it and gains time.', Nh6: 'It holds f7, but the knight is badly placed there.' },
        bad: { Nf6: { name: 'Scholar\'s mate', line: ['Qxf7#'], notes: ['Checkmate in four. Everyone loses to this once.'], draws: [null] } },
        reply: 'Qf3', replyNote: 'Mate on f7 is threatened again.'
      },
      {
        ask: 'Block again, with a developing move.', short: 'Block again and develop.', see: [['f3', 'f7', 'r'], ['c4', 'f7', 'r']], hint: 'The g8 knight.',
        good: { Nf6: 'Blocked. You have two knights out. White has a queen that moved three times.' }, arrows: [['f6', 'f3', 'd']],
        dream: [
          { play: 'Ne2', cap: 'White finally develops.' },
          { play: 'Bg7', cap: 'Your bishop fills the hole the g-pawn left.' },
          { play: 'O-O', cap: 'White castles.' },
          { play: 'O-O', cap: 'So do you. Safe king, and you are ahead in development.' }],
        ok: { Qe7: 'It holds, but a knight blocks and develops.', Qf6: 'Fine: offering a queen trade also ends the attack. A knight is more natural.' },
        bad: {}
      }
    ],
    outro: 'Against an early queen: defend, block with gain of time, develop.'
  },
  {
    id: 'bruy', side: 'b', group: 'Other openings', title: 'The Ruy Lopez',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    intro: 'The bishop attacks the knight that guards e5. It looks scary. It is not, yet.',
    steps: [
      {
        ask: 'Ask the bishop what it wants.', see: [['b5', 'c6', 'r'], ['c6', 'e5', 'd']], hint: 'Kick it with the a-pawn.',
        good: { a6: 'The bishop must take or retreat. Either is fine for you.' }, arrows: [['a6', 'b5', 'r']],
        why: { q: 'What if White takes your knight and then the e5 pawn?', opts: [
          { t: 'My queen forks the knight and e4, and wins the pawn back', right: true },
          { t: 'I am simply a pawn down', note: 'Not here. Watch the preview.' },
          { t: 'My queen takes the bishop', note: 'The bishop is already gone by then.' }] },
        dream: [
          { play: 'Bxc6', cap: 'White takes your knight.' },
          { play: 'dxc6', cap: 'You take back with the d-pawn. Queen and bishop open up.' },
          { play: 'Nxe5', cap: 'White grabs e5.' },
          { play: 'Qd4', cap: 'Fork. You win the pawn back with a fine position.', arrows: [['d4', 'e5', 'r'], ['d4', 'e4', 'r']] }],
        ok: { Nf6: 'A real defence (the Berlin). This lesson kicks the bishop first.', Bc5: 'Playable. This lesson kicks the bishop first.', d6: 'Solid but passive. Kick the bishop first.' },
        bad: {}, reply: 'Ba4'
      },
      {
        ask: 'Develop and attack something.', short: 'Develop with a threat.', hint: 'The g8 knight hits e4.',
        good: { Nf6: 'e4 is attacked. Same idea as always.' }, arrows: [['f6', 'e4', 'r']],
        ok: { b5: 'Fine, and it comes later. Develop first.', Bc5: 'Playable. Knight first here.', d6: 'Solid. The knight is more active.' },
        bad: {}, reply: 'O-O', replyNote: 'White offers the e4 pawn. Leave it for now.'
      },
      {
        ask: 'Get ready to castle.', hint: 'Bishop to e7.',
        good: { Be7: 'It shields your king on the e-file, and you can castle next.' }, arrows: [['e7', 'e8', 'd']],
        ok: { Nxe4: 'Playable, but White gets fast play on the e-file and you need to know the theory. Keep it simple.', Bc5: 'Active and fine. e7 is the sturdier square.', b5: 'Fine: kicking first is also normal.', d6: 'Solid. Bishop first so you can castle.' },
        bad: {}, reply: 'Re1', replyNote: 'Now e4 is guarded, so the threat to e5 is real.'
      },
      {
        pre: { q: 'Tap the piece White wants to remove.', qs: 'Which piece does White want?', sq: 'c6', yes: 'Take the knight, then take e5.', arrows: [['a4', 'c6', 'r'], ['f3', 'e5', 'r']] },
        ask: 'Chase the bishop off that diagonal.', short: 'Chase the bishop away.', see: [['a4', 'c6', 'r']], hint: 'The b-pawn, two squares.',
        good: { b5: 'The bishop can no longer take your knight. e5 is safe.' }, arrows: [['b5', 'a4', 'r'], ['c6', 'e5', 'd']],
        ok: { d6: 'It defends e5 and is playable. Kicking the bishop solves it for good.' },
        bad: { 'O-O': { name: 'Castling past a threat', line: ['Bxc6', 'dxc6', 'Nxe5'], notes: ['The defender goes.', 'You take back.', 'And e5 falls. With e4 guarded, ...Qd4 no longer wins it back.'], draws: [null, null, [['e1', 'e4', 'd']]] } },
        reply: 'Bb3'
      },
      {
        ask: 'Finish the setup.', hint: 'Support e5, or castle.',
        good: { d6: 'Solid. Castle next and your setup is complete.', 'O-O': 'Castled. Next comes ...d6.' }, ok: {}, bad: {}
      }
    ],
    outro: 'Against the Ruy Lopez: a6, Nf6, Be7, b5, d6, castle.'
  },
  {
    id: 'bscotch', side: 'b', group: 'Other openings', title: 'The Scotch',
    setup: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
    intro: 'White opens the centre at once.',
    steps: [
      {
        ask: 'A pawn attacks your pawn. What now?', short: 'Your pawn is attacked.', see: [['d4', 'e5', 'r']], hint: 'Take it with the pawn.',
        good: { exd4: 'Take. Otherwise White takes you and your knight gets pushed around.' },
        ok: { d6: 'Passive. White can trade queens and stop you castling.', Nxd4: 'Playable, but after the trade White\'s queen sits in the centre and nothing can chase it. Take with the pawn.' },
        bad: {}, reply: 'Nxd4'
      },
      {
        ask: 'Develop with a threat.', hint: 'A knight move that hits e4.',
        good: { Nf6: 'e4 is attacked, so White has to spend a move on it.' }, arrows: [['f6', 'e4', 'r']],
        ok: { Bc5: 'Good too: it hits the d4 knight. This lesson uses the knight move.', Nxd4: 'That brings White\'s queen to the centre for free. Develop instead.', Qh4: 'A real line, but risky. Simple development is enough.' },
        bad: {}, reply: 'Nc3'
      },
      {
        ask: 'Pin that knight.', hint: 'Bishop to b4.',
        good: { Bb4: 'The c3 knight is pinned to the king, so e4 is attacked again.' }, arrows: [['b4', 'e1', 'r'], ['f6', 'e4', 'r']],
        ok: { Bc5: 'Good too. b4 puts more pressure on e4.', Be7: 'Solid. b4 is more active.' }, bad: {}
      }
    ],
    outro: 'Against the Scotch: take on d4, then develop with threats.'
  }
];

/* Extra lines for the sparring bot's opening book (Black's moves are what matter). */
const BOOK_EXTRA = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'd6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'O-O'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'h6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'Nc3', 'Nf6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Bc5'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Be7'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Nc3', 'Bc5'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7', 'Kxf7', 'Qf3+', 'Ke6', 'Nc3', 'Nb4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'd4', 'exd4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'h6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Be7'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'c3', 'Bg4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'O-O', 'Bg4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxd4', 'exd4', 'O-O', 'Nf6'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'c3', 'Nxf3+']
];

/* Extra White lines for sparring as Black. */
const BOOK_EXTRA_B = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'Bg5'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6', 'Nc3'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6', 'Ng5'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'Nc3', 'Nf6', 'd3'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5', 'Be3'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'],
  ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'g6', 'Qf3', 'Nf6', 'Ne2'],
  ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'g6', 'Qf3', 'Nf6', 'Ne2'],
  ['e4', 'e5', 'Bc4', 'Nc6', 'Qf3', 'Nf6', 'Ne2']
];

if (typeof module !== 'undefined') module.exports = { LESSONS, BOOK_EXTRA, BOOK_EXTRA_B };
