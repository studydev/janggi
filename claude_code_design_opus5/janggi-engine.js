/* Janggi (Korean chess) rules engine — pure logic, no DOM.
   Rules per RULES.md: no river; SANG = 1 straight + 2 diagonal; PO must jump
   exactly one screen to MOVE and to CAPTURE, cannot jump or capture a PO;
   JOL moves forward/sideways from the start; CHA/GUNG/SA use palace diagonals;
   pass is legal; CHO moves first; HAN gets +1.5 points. */
window.JanggiEngine = (function () {
  var IDX = function (f, r) { return (r - 1) * 9 + (f - 1); };
  var FOF = function (i) { return (i % 9) + 1; };
  var ROF = function (i) { return Math.floor(i / 9) + 1; };
  var inB = function (f, r) { return f >= 1 && f <= 9 && r >= 1 && r <= 10; };
  var OTHER = function (s) { return s === 'HAN' ? 'CHO' : 'HAN'; };
  var VAL = { CHA: 13, PO: 7, MA: 5, SANG: 3, SA: 3, JOL: 2, GUNG: 0 };
  var HANJA = { CHA: '車', PO: '包', MA: '馬', SANG: '象', SA: '士', JOL: { HAN: '兵', CHO: '卒' }, GUNG: { HAN: '漢', CHO: '楚' } };
  var HANGUL = { CHA: '차', PO: '포', MA: '마', SANG: '상', SA: '사', JOL: { HAN: '병', CHO: '졸' }, GUNG: { HAN: '한', CHO: '초' } };
  var NAME = { CHA: '차', PO: '포', MA: '마', SANG: '상', SA: '사', JOL: '졸', GUNG: '궁' };

  var PAL = {
    HAN: [IDX(4, 1), IDX(6, 1), IDX(5, 2), IDX(4, 3), IDX(6, 3)],
    CHO: [IDX(4, 8), IDX(6, 8), IDX(5, 9), IDX(4, 10), IDX(6, 10)]
  };
  var DIAG = {};
  [[[4, 1], [5, 2]], [[6, 1], [5, 2]], [[5, 2], [4, 3]], [[5, 2], [6, 3]],
   [[4, 8], [5, 9]], [[6, 8], [5, 9]], [[5, 9], [4, 10]], [[5, 9], [6, 10]]]
    .forEach(function (p) {
      var a = IDX(p[0][0], p[0][1]), b = IDX(p[1][0], p[1][1]);
      DIAG[a + ':' + b] = 1; DIAG[b + ':' + a] = 1;
    });
  var isDiagLink = function (a, b) { return !!DIAG[a + ':' + b]; };
  var inPalace = function (i, side) {
    var f = FOF(i), r = ROF(i);
    return f >= 4 && f <= 6 && (side === 'HAN' ? r <= 3 : r >= 8);
  };
  var isPalacePt = function (i) { return PAL.HAN.indexOf(i) >= 0 || PAL.CHO.indexOf(i) >= 0; };

  var ORTH = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  var DIA = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var MA_T = { '0,-1': [[-1, -1], [1, -1]], '0,1': [[-1, 1], [1, 1]], '-1,0': [[-1, -1], [-1, 1]], '1,0': [[1, -1], [1, 1]] };

  function step(i, df, dr) {
    var f = FOF(i) + df, r = ROF(i) + dr;
    return inB(f, r) ? IDX(f, r) : -1;
  }

  /* ---- pseudo-legal generators ---- */
  function genCha(b, i) {
    var out = [], side = b[i].s, d, j, prev, k;
    for (k = 0; k < 4; k++) {
      d = ORTH[k]; prev = i;
      while (true) {
        j = step(prev, d[0], d[1]); if (j < 0) break;
        if (b[j]) { if (b[j].s !== side) out.push(j); break; }
        out.push(j); prev = j;
      }
    }
    for (k = 0; k < 4; k++) {
      d = DIA[k]; prev = i;
      while (true) {
        j = step(prev, d[0], d[1]); if (j < 0 || !isDiagLink(prev, j)) break;
        if (b[j]) { if (b[j].s !== side) out.push(j); break; }
        out.push(j); prev = j;
      }
    }
    return out;
  }

  function genPo(b, i) {
    var out = [], side = b[i].s, k, d, j, prev, screen;
    function ray(dirs, diagonal) {
      for (k = 0; k < 4; k++) {
        d = dirs[k]; prev = i; screen = null;
        while (true) {
          j = step(prev, d[0], d[1]); if (j < 0) break;
          if (diagonal && !isDiagLink(prev, j)) break;
          if (!screen) {
            if (b[j]) {
              if (b[j].t === 'PO') break;  // cannot jump over a PO
              screen = b[j];
            }
          } else {
            if (!b[j]) out.push(j);
            else {
              if (b[j].s !== side && b[j].t !== 'PO') out.push(j); // cannot capture a PO
              break;
            }
          }
          prev = j;
        }
      }
    }
    ray(ORTH, false); ray(DIA, true);
    return out;
  }

  function genMa(b, i) {
    var out = [], side = b[i].s;
    ORTH.forEach(function (d) {
      var mid = step(i, d[0], d[1]);
      if (mid < 0 || b[mid]) return;  // leg blocked
      MA_T[d[0] + ',' + d[1]].forEach(function (dd) {
        var t = step(mid, dd[0], dd[1]);
        if (t < 0) return;
        if (!b[t] || b[t].s !== side) out.push(t);
      });
    });
    return out;
  }

  function genSang(b, i) {
    var out = [], side = b[i].s;
    ORTH.forEach(function (d) {
      var mid = step(i, d[0], d[1]);
      if (mid < 0 || b[mid]) return;
      MA_T[d[0] + ',' + d[1]].forEach(function (dd) {
        var m2 = step(mid, dd[0], dd[1]);
        if (m2 < 0 || b[m2]) return;
        var t = step(m2, dd[0], dd[1]);
        if (t < 0) return;
        if (!b[t] || b[t].s !== side) out.push(t);
      });
    });
    return out;
  }

  function genGung(b, i) {
    var out = [], side = b[i].s;
    ORTH.forEach(function (d) {
      var j = step(i, d[0], d[1]);
      if (j < 0 || !inPalace(j, side)) return;
      if (!b[j] || b[j].s !== side) out.push(j);
    });
    DIA.forEach(function (d) {
      var j = step(i, d[0], d[1]);
      if (j < 0 || !inPalace(j, side) || !isDiagLink(i, j)) return;
      if (!b[j] || b[j].s !== side) out.push(j);
    });
    return out;
  }

  function genJol(b, i) {
    var out = [], side = b[i].s, fwd = side === 'CHO' ? -1 : 1, cands = [], enemy = OTHER(side);
    cands.push(step(i, 0, fwd), step(i, -1, 0), step(i, 1, 0));
    if (isPalacePt(i) && inPalace(i, enemy)) {
      DIA.forEach(function (d) {
        if (d[1] !== fwd) return;
        var j = step(i, d[0], d[1]);
        if (j >= 0 && isDiagLink(i, j)) cands.push(j);
      });
    }
    cands.forEach(function (j) {
      if (j < 0) return;
      if (!b[j] || b[j].s !== side) out.push(j);
    });
    return out;
  }

  function pseudo(b, i) {
    var p = b[i];
    if (!p) return [];
    switch (p.t) {
      case 'CHA': return genCha(b, i);
      case 'PO': return genPo(b, i);
      case 'MA': return genMa(b, i);
      case 'SANG': return genSang(b, i);
      case 'GUNG': case 'SA': return genGung(b, i);
      case 'JOL': return genJol(b, i);
    }
    return [];
  }

  function genAll(b, side) {
    var mv = [], i, t, k;
    for (i = 0; i < 90; i++) {
      if (!b[i] || b[i].s !== side) continue;
      t = pseudo(b, i);
      for (k = 0; k < t.length; k++) mv.push({ from: i, to: t[k] });
    }
    return mv;
  }

  function findGung(b, side) {
    for (var i = 0; i < 90; i++) if (b[i] && b[i].s === side && b[i].t === 'GUNG') return i;
    return -1;
  }

  function isAttacked(b, pos, bySide) {
    for (var i = 0; i < 90; i++) {
      if (!b[i] || b[i].s !== bySide) continue;
      var t = pseudo(b, i);
      for (var k = 0; k < t.length; k++) if (t[k] === pos) return true;
    }
    return false;
  }

  function isCheck(state, side) {
    var g = findGung(state.board, side);
    return g >= 0 ? isAttacked(state.board, g, OTHER(side)) : true;
  }

  function legalMoves(state, side) {
    side = side || state.turn;
    var b = state.board, out = [], all = genAll(b, side);
    for (var k = 0; k < all.length; k++) {
      var m = all[k], cap = b[m.to];
      b[m.to] = b[m.from]; b[m.from] = null;
      var g = findGung(b, side);
      var bad = g < 0 || isAttacked(b, g, OTHER(side));
      b[m.from] = b[m.to]; b[m.to] = cap;
      if (!bad) out.push({ from: m.from, to: m.to, cap: cap ? cap.t : null });
    }
    return out;
  }

  function movesFrom(state, from) {
    return legalMoves(state).filter(function (m) { return m.from === from; });
  }

  function boardKey(state) {
    var s = '';
    for (var i = 0; i < 90; i++) s += state.board[i] ? state.board[i].s[0] + state.board[i].t[0] : '.';
    return s + '|' + state.turn;
  }

  function makeMove(state, mv) {
    var b = state.board.slice(), moving = b[mv.from], cap = b[mv.to];
    b[mv.to] = moving; b[mv.from] = null;
    var captured = { HAN: state.captured.HAN.slice(), CHO: state.captured.CHO.slice() };
    if (cap) captured[moving.s].push(cap);
    var rec = {
      from: mv.from, to: mv.to, t: moving.t, s: moving.s,
      cap: cap ? cap.t : null, capSide: cap ? cap.s : null, pass: false
    };
    var ns = {
      board: b, turn: OTHER(state.turn), history: state.history.concat([rec]),
      captured: captured, config: state.config, reps: Object.assign({}, state.reps)
    };
    var k = boardKey(ns); ns.reps[k] = (ns.reps[k] || 0) + 1;
    return ns;
  }

  function pass(state) {
    var ns = {
      board: state.board.slice(), turn: OTHER(state.turn),
      history: state.history.concat([{ from: -1, to: -1, t: null, s: state.turn, cap: null, pass: true }]),
      captured: { HAN: state.captured.HAN.slice(), CHO: state.captured.CHO.slice() },
      config: state.config, reps: Object.assign({}, state.reps)
    };
    var k = boardKey(ns); ns.reps[k] = (ns.reps[k] || 0) + 1;
    return ns;
  }

  function score(state, side) {
    var s = side === 'HAN' ? 1.5 : 0;
    for (var i = 0; i < 90; i++) if (state.board[i] && state.board[i].s === side) s += VAL[state.board[i].t];
    return Math.round(s * 10) / 10;
  }

  function isBikjang(state) {
    var h = findGung(state.board, 'HAN'), c = findGung(state.board, 'CHO');
    if (h < 0 || c < 0 || FOF(h) !== FOF(c)) return false;
    for (var r = ROF(h) + 1; r < ROF(c); r++) if (state.board[IDX(FOF(h), r)]) return false;
    return true;
  }

  function result(state) {
    var side = state.turn, opp = OTHER(side);
    if (findGung(state.board, side) < 0) return { status: 'CHECKMATE', winner: opp, reason: '궁 포획' };
    if (isCheck(state, side) && legalMoves(state, side).length === 0)
      return { status: 'CHECKMATE', winner: opp, reason: '외통 장군' };
    var sh = score(state, 'HAN'), sc = score(state, 'CHO');
    var byScore = sh === sc ? null : (sh > sc ? 'HAN' : 'CHO');
    if (state.config.bikjang && isBikjang(state))
      return { status: 'DRAW_BY_BIKJANG', winner: byScore, reason: '빅장 — 점수 비교' };
    var k = boardKey(state);
    if ((state.reps[k] || 0) >= (state.config.repLimit || 3))
      return { status: 'DRAW_BY_REPETITION', winner: byScore, reason: '동일 국면 반복 — 점수 비교' };
    return { status: 'PLAYING', winner: null, reason: '' };
  }

  /* ---- notation ---- */
  function coord(i) {
    if (i < 0) return '00';
    return String(FOF(i)) + (ROF(i) === 10 ? '0' : String(ROF(i)));
  }
  function notate(rec) {
    if (rec.pass) return '한수쉼';
    return coord(rec.from) + NAME[rec.t] + coord(rec.to) + (rec.cap ? '×' + NAME[rec.cap] : '');
  }

  /* ---- AI ---- */
  var JOLADV = 0.18, DEV = 0.12;
  function evalBoard(b, side) {
    var s = 0, i, p, f, r;
    for (i = 0; i < 90; i++) {
      p = b[i]; if (!p) continue;
      var v = VAL[p.t];
      f = FOF(i); r = ROF(i);
      if (p.t === 'JOL') v += JOLADV * (p.s === 'CHO' ? (7 - r) : (r - 4));
      if (p.t === 'MA' || p.t === 'SANG') v += DEV * (p.s === 'CHO' ? (10 - r) / 3 : r / 3);
      if (p.t === 'CHA') v += 0.1 * (f >= 4 && f <= 6 ? 1 : 0);
      s += p.s === side ? v : -v;
    }
    s += side === 'HAN' ? 1.5 : -1.5;
    return s;
  }

  function orderMoves(b, mv) {
    mv.forEach(function (m) {
      var c = b[m.to];
      m.sc = c ? VAL[c.t] * 10 - VAL[b[m.from].t] : 0;
    });
    mv.sort(function (a, c) { return c.sc - a.sc; });
    return mv;
  }

  function negamax(b, side, depth, alpha, beta, ctx) {
    ctx.nodes++;
    if (depth === 0 || ctx.nodes > ctx.budget) return evalBoard(b, side);
    var mv = orderMoves(b, genAll(b, side)), best = -Infinity;
    for (var k = 0; k < mv.length; k++) {
      var m = mv[k], cap = b[m.to];
      if (cap && cap.t === 'GUNG') return 9000 + depth;
      b[m.to] = b[m.from]; b[m.from] = null;
      var sc = -negamax(b, OTHER(side), depth - 1, -beta, -alpha, ctx);
      b[m.from] = b[m.to]; b[m.to] = cap;
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best === -Infinity ? evalBoard(b, side) : best;
  }

  var LEVELS = {
    EASY: { depth: 2, noise: 1.6, blunder: 0.3, budget: 30000 },
    NORMAL: { depth: 3, noise: 0.4, blunder: 0.06, budget: 160000 },
    HARD: { depth: 4, noise: 0, blunder: 0, budget: 700000 },
    ULTRA: { depth: 5, noise: 0, blunder: 0, budget: 2500000 }
  };

  function bestMove(state, level) {
    var cfg = LEVELS[level] || LEVELS.NORMAL;
    var side = state.turn, legal = legalMoves(state, side);
    if (!legal.length) return null;
    if (Math.random() < cfg.blunder) return legal[Math.floor(Math.random() * legal.length)];
    var b = state.board.slice(), ctx = { nodes: 0, budget: cfg.budget };
    var best = null, bestSc = -Infinity;
    orderMoves(b, legal).forEach(function (m) {
      var cap = b[m.to];
      b[m.to] = b[m.from]; b[m.from] = null;
      var sc = -negamax(b, OTHER(side), cfg.depth - 1, -Infinity, Infinity, ctx);
      b[m.from] = b[m.to]; b[m.to] = cap;
      sc += (Math.random() - 0.5) * cfg.noise;
      if (sc > bestSc) { bestSc = sc; best = m; }
    });
    return best;
  }

  function newGame(hanSetup, choSetup, config) {
    var b = new Array(90), seq = 1, map = { '마': 'MA', '상': 'SANG' };
    for (var i = 0; i < 90; i++) b[i] = null;
    function put(f, r, t, s) { b[IDX(f, r)] = { t: t, s: s, id: s + t + (seq++) }; }
    var hs = String(hanSetup || '마상마상').split('').map(function (c) { return map[c]; });
    var cs = String(choSetup || '마상마상').split('').map(function (c) { return map[c]; });
    var files = [2, 3, 7, 8];
    put(1, 1, 'CHA', 'HAN'); put(9, 1, 'CHA', 'HAN');
    put(4, 1, 'SA', 'HAN'); put(6, 1, 'SA', 'HAN');
    files.forEach(function (f, n) { put(f, 1, hs[n], 'HAN'); });
    put(5, 2, 'GUNG', 'HAN');
    put(2, 3, 'PO', 'HAN'); put(8, 3, 'PO', 'HAN');
    [1, 3, 5, 7, 9].forEach(function (f) { put(f, 4, 'JOL', 'HAN'); });
    put(1, 10, 'CHA', 'CHO'); put(9, 10, 'CHA', 'CHO');
    put(4, 10, 'SA', 'CHO'); put(6, 10, 'SA', 'CHO');
    files.forEach(function (f, n) { put(f, 10, cs[n], 'CHO'); });
    put(5, 9, 'GUNG', 'CHO');
    put(2, 8, 'PO', 'CHO'); put(8, 8, 'PO', 'CHO');
    [1, 3, 5, 7, 9].forEach(function (f) { put(f, 7, 'JOL', 'CHO'); });
    var st = {
      board: b, turn: 'CHO', history: [], captured: { HAN: [], CHO: [] },
      config: Object.assign({ bikjang: true, repLimit: 3 }, config || {}), reps: {}
    };
    st.reps[boardKey(st)] = 1;
    return st;
  }

  return {
    IDX: IDX, FOF: FOF, ROF: ROF, VAL: VAL, HANJA: HANJA, HANGUL: HANGUL, NAME: NAME,
    OTHER: OTHER, PAL: PAL, inPalace: inPalace,
    newGame: newGame, legalMoves: legalMoves, movesFrom: movesFrom, makeMove: makeMove,
    pass: pass, isCheck: isCheck, isBikjang: isBikjang, result: result, score: score,
    findGung: findGung, notate: notate, coord: coord, bestMove: bestMove, SETUPS: ['마상마상', '상마상마', '마상상마', '상마마상']
  };
})();
