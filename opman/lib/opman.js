/* Op Man Hub: interactive widgets and calculation drills for 3BE216 Operations Management.
   Put a placeholder anywhere in a lesson (a raw HTML line in steps.md) or in a study-path bite:
     <div class="mg" data-g="bars" data-preset="garage"></div>    bar-cutting puzzle (tap or drag pieces onto 12 m / 6 m bars, live CMU)
     <div class="mg" data-g="seqline" data-preset="seminar"></div> gradual / parallel / DBR timeline with toggles
     <div class="mg" data-g="breakeven" data-preset="cnc"></div>   choosing the technology: cost lines, crossing points, capacity jump
     <div class="mg" data-g="rules" data-preset="lecture"></div>   five sequencing rules: tap the jobs into order, the table fills in
     <div class="mg" data-g="sort" data-set="timetypes"></div>     sort cards into groups (tap a card, then a group; or drag)
     <div class="mg" data-g="order" data-set="toc"></div>          put the steps in the right order
     <div class="mg" data-g="trap" data-set="t2"></div>            find the mistake in a worked solution
     <div class="mg" data-g="explain" data-set="t2"></div>         write a theory answer, checked for the key words
     <div class="mg" data-g="drill" data-kind="cmu-sheet,bars"></div>  step-by-step calculations with new numbers every time
     <div class="mg" data-g="mock" data-test="1"></div>            90-minute mock test with new numbers (Test 1 or Test 2)
   Widgets are drawn when they appear in the page (MutationObserver), so the lesson engine needs no changes.
   Facts and methods follow Felipe Martinez's 3BE216 slides and the practice-test answer keys.
   Saved per browser: localStorage "opmanHub.drill" = { kind: rounds solved }. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var DKEY = "opmanHub.drill";
  var DONE = {};
  try { var raw = JSON.parse(localStorage.getItem(DKEY) || "null"); if (raw && typeof raw === "object") DONE = raw; } catch (e) {}
  function saveDone() { try { localStorage.setItem(DKEY, JSON.stringify(DONE)); } catch (e) {} }
  function bump(k) { DONE[k] = (DONE[k] || 0) + 1; saveDone(); }

  /* ---------- helpers ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function xp(n, why) { if (window.GEO && GEO.xp) GEO.xp(n, why); }
  function toast(m) { if (window.GEO && GEO.toast) GEO.toast(m); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function fmt(x, d) {
    if (!isFinite(x)) return "–";
    d = d == null ? 2 : d;
    var v = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    var s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: d }).replace(/,/g, " ");
    return (v < 0 ? "−" : "") + s;
  }
  function rnd(a, b, step) { step = step || 1; var n = Math.floor((b - a) / step) + 1; return a + step * Math.floor(Math.random() * n); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function svgEl(svg, tag, at, txt) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
  function head(tag, title, cls) { return '<div class="mg-head"><span class="mg-tag' + (cls ? " " + cls : "") + '">' + esc(tag) + '</span><span class="mg-title">' + esc(title) + "</span></div>"; }
  function seg(id, opts, on) {
    return '<div class="seg mg-seg" data-seg="' + id + '">' + opts.map(function (o) { return '<button type="button" data-val="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(on)) + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>";
  }
  /* Numbers: accepts "63.62", "63,62", "1 440", "1,440", "63.62 %". Returns every sensible reading, so a comma can be a decimal mark or a thousands mark. */
  function nums(s) {
    s = String(s || "").trim().replace(/[−–]/g, "-").replace(/%/g, "").replace(/\s+/g, "");
    if (!s) return [];
    var out = [];
    function add(t) { if (/^-?\d*\.?\d+$/.test(t)) out.push(+t); }
    if (s.indexOf(",") >= 0 && s.indexOf(".") >= 0) add(s.replace(/,/g, ""));
    else if (s.indexOf(",") >= 0) { add(s.replace(/,/g, ".")); if (/^-?\d{1,3}(,\d{3})+$/.test(s)) add(s.replace(/,/g, "")); }
    else add(s);
    var m = /^(-?\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s); if (m) out.push((+m[1]) / (+m[2]));
    return out;
  }
  function near(cands, a, tol) { for (var i = 0; i < cands.length; i++) if (Math.abs(cands[i] - a) <= tol) return true; return false; }
  function tolOf(s) { return s.tol != null ? s.tol : Math.max(0.011, Math.abs(s.a) * 0.002); }

  /* ======================================================================
     1. CALCULATION DRILLS (new numbers every time, one step at a time)
     A drill returns { text, steps:[{ q, a, tol?, pct?, how } | { q, choice:[...], right | rightText, how }] }.
     pct: the answer is a percentage. Typing 0.9611 instead of 96.11 gets a Moodle-format reminder.
     ====================================================================== */

  /* --- metal sheet geometry (lecture "Resources standards": office chair, 2 ellipses per square) --- */
  function sheetSvg(a, k) {
    var W = 220, s = W / 100, h = '<svg class="mg-svg om-sheet" viewBox="0 0 ' + (W + 2) + " " + (W + 2) + '" role="img" aria-label="One metal sheet of 100 by 100 cm cut into ' + k * k + " squares of " + a + " by " + a + ' cm, two ellipse arms in each square">';
    h += '<rect x="1" y="1" width="' + W + '" height="' + W + '" class="om-off"></rect>';
    for (var r = 0; r < k; r++) for (var c = 0; c < k; c++) {
      var x = 1 + c * a * s, y = 1 + r * a * s;
      h += '<rect x="' + x + '" y="' + y + '" width="' + a * s + '" height="' + a * s + '" class="om-sq"></rect>';
      h += '<ellipse cx="' + (x + a * s / 2) + '" cy="' + (y + a * s / 4) + '" rx="' + a * s / 2 + '" ry="' + a * s / 4 + '" class="om-el"></ellipse>';
      h += '<ellipse cx="' + (x + a * s / 2) + '" cy="' + (y + 3 * a * s / 4) + '" rx="' + a * s / 2 + '" ry="' + a * s / 4 + '" class="om-el"></ellipse>';
    }
    return h + "</svg>";
  }

  /* --- best way to cut bars (exact search on whole centimetres): fewest metres bought, then the biggest leftover --- */
  function bestCut(L, nL, S, nS, stock) {
    var memo = {};
    function f(a, b) {
      if (a <= 0 && b <= 0) return { len: 0, big: 0, plan: [] };
      var key = a + "," + b; if (memo[key]) return memo[key];
      var best = null;
      stock.forEach(function (B) {
        for (var i = 0; i <= a; i++) for (var j = 0; j <= b; j++) {
          if (!i && !j) continue;
          var used = i * L + j * S; if (used > B) continue;
          var r = f(a - i, b - j), cand = { len: r.len + B, big: Math.max(r.big, B - used), plan: [{ B: B, i: i, j: j }].concat(r.plan) };
          if (!best || cand.len < best.len || (cand.len === best.len && cand.big > best.big)) best = cand;
        }
      });
      memo[key] = best; return best;
    }
    return f(nL, nS);
  }
  function planText(plan, L, S) {
    var g = {}, order = [];
    plan.forEach(function (p) { var k = p.B + "|" + p.i + "|" + p.j; if (!g[k]) order.push(k); g[k] = (g[k] || 0) + 1; });
    return order.map(function (k) {
      var x = k.split("|"), B = +x[0], i = +x[1], j = +x[2], parts = [];
      for (var a = 0; a < i; a++) parts.push(fmt(L / 100, 2));
      for (var b = 0; b < j; b++) parts.push(fmt(S / 100, 2));
      return g[k] + " × " + fmt(B / 100, 0) + " m bar: " + parts.join(" + ") + " (left " + fmt((B - i * L - j * S) / 100, 2) + " m)";
    }).join("<br>");
  }

  /* --- calendar (Czech public holidays) --- */
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  function dkey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function czHolidays(y) {
    var e = easter(y), H = {};
    [[1, 1, "New Year / Restoration Day"], [5, 1, "Labour Day"], [5, 8, "Liberation Day"], [7, 5, "Cyril and Methodius"], [7, 6, "Jan Hus Day"], [9, 28, "Czech Statehood Day"], [10, 28, "Independence Day"], [11, 17, "Freedom and Democracy Day"], [12, 24, "Christmas Eve"], [12, 25, "Christmas Day"], [12, 26, "St Stephen's Day"]]
      .forEach(function (x) { H[dkey(new Date(y, x[0] - 1, x[1]))] = x[2]; });
    var gf = new Date(e); gf.setDate(e.getDate() - 2); H[dkey(gf)] = "Good Friday";
    var em = new Date(e); em.setDate(e.getDate() + 1); H[dkey(em)] = "Easter Monday";
    return H;
  }
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function dstr(d) { return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()].slice(0, 3); }
  function isWork(d, H) { var w = d.getDay(); return w !== 0 && w !== 6 && !H[dkey(d)]; }
  function monthGrid(y, m, H, shut) {
    var first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate(), off = (first.getDay() + 6) % 7, h = '<div class="om-month"><b>' + MON[m] + " " + y + '</b><div class="om-cal">';
    ["M", "T", "W", "T", "F", "S", "S"].forEach(function (x) { h += '<span class="om-dow">' + x + "</span>"; });
    for (var i = 0; i < off; i++) h += "<span></span>";
    for (var d = 1; d <= n; d++) {
      var D = new Date(y, m, d), w = D.getDay(), cls = w === 0 || w === 6 ? "we" : H[dkey(D)] ? "hol" : shut && shut[dkey(D)] ? "shut" : "wd";
      h += '<span class="om-d ' + cls + '" title="' + esc(H[dkey(D)] || "") + '">' + d + "</span>";
    }
    return h + "</div></div>";
  }

  /* --- gradual / parallel / DBR lead time ---
     Checked against every number in the practice Test 2 answer key and the Seminar "operations planning" slides
     (seminar 470 / 450 / 238 / 218 / 150; fast op 1: 365 / 350 / 205 / 198; op 2 bottleneck: 530 / 298 / 278 / 258).
     ops: [{ n, t: cycle time, tb: batch (setup) time, P: workplaces, S: units at once }], N: order size.
     units: true = the setup needs units from the previous operation (setups one after the other).
            false = setups can be done before the units arrive (they run from time 0). */
  function leadTimes(ops, N, units) {
    var o = ops.map(function (x) { var cap = x.P * x.S, c = Math.ceil(N / cap); return { n: x.n, t: x.t, tb: x.tb, P: x.P, S: x.S, cap: cap, c: c, len: x.tb + c * x.t, run: c * x.t, last: N - cap * (c - 1) }; });
    var k = o.length, i;
    /* gradual */
    var g = [], tEnd = 0;
    for (i = 0; i < k; i++) {
      var s0 = units || i === 0 ? tEnd + o[i].tb : Math.max(tEnd, o[i].tb);
      g.push({ i: i, setup: [s0 - o[i].tb, s0], run: [s0, s0 + o[i].run] }); tEnd = s0 + o[i].run;
    }
    var grad = tEnd;
    /* the longest operation */
    var L = 0; for (i = 1; i < k; i++) if ((units ? o[i].len : o[i].run) > (units ? o[L].len : o[L].run)) L = i;
    /* head: each operation before L makes just enough cycles to fill the first cycle of the next one */
    var head = [], t = 0;
    for (i = 0; i < L; i++) {
      var need = Math.min(o[i + 1].cap, N), kc = Math.min(o[i].c, Math.ceil(need / o[i].cap));
      var s1 = units || i === 0 ? t + o[i].tb : Math.max(t, o[i].tb);
      head.push({ i: i, cycles: kc, setup: [s1 - o[i].tb, s1], run: [s1, s1 + kc * o[i].t] }); t = s1 + kc * o[i].t;
    }
    var sL = units || L === 0 ? t + o[L].tb : Math.max(t, o[L].tb), body = { i: L, cycles: o[L].c, setup: [sL - o[L].tb, sL], run: [sL, sL + o[L].run] };
    /* tail: after the last cycle of L, the next operations only process the last units that come out */
    var tail = [], te = sL + o[L].run, inc = o[L].last;
    for (i = L + 1; i < k; i++) { var m = Math.ceil(inc / o[i].cap); tail.push({ i: i, cycles: m, units: inc, run: [te, te + m * o[i].t] }); te += m * o[i].t; inc = o[i].last; }
    var par = te;
    /* DBR: the buffer in front of the drum is already full, so nothing upstream delays it */
    var dS = units ? o[L].tb : 0, dEnd = dS + o[L].run, dTail = [], td = dEnd; inc = o[L].last;
    for (i = L + 1; i < k; i++) { var m2 = Math.ceil(inc / o[i].cap); dTail.push({ i: i, cycles: m2, units: inc, run: [td, td + m2 * o[i].t] }); td += m2 * o[i].t; inc = o[i].last; }
    return { o: o, L: L, grad: grad, g: g, par: par, head: head, body: body, tail: tail, dbr: td, drum: { i: L, setup: [0, dS], run: [dS, dEnd] }, dTail: dTail };
  }

  /* --- break-even: cheapest option for every quantity --- */
  function cheapest(opts, q, caps) { var b = -1, bc = Infinity; opts.forEach(function (o, i) { if (caps && o.cap && q > o.cap) return; var c = o.fc + o.vc * q; if (c < bc - 1e-9) { bc = c; b = i; } }); return b; }
  function intervals(opts, caps, qmax) {
    var out = [], cur = -2, from = 1;
    for (var q = 1; q <= qmax; q++) { var b = cheapest(opts, q, caps); if (b !== cur) { if (cur !== -2) out.push({ o: cur, from: from, to: q - 1 }); cur = b; from = q; } }
    out.push({ o: cur, from: from, to: qmax, open: !caps });
    return out;
  }
  function cross(a, b) { return a.vc === b.vc ? null : (b.fc - a.fc) / (a.vc - b.vc); }

  var RULES = { FIFO: "First in, first out (FIFO)", LIFO: "Last in, first out (LIFO)", DD: "Due date (DD)", SOT: "Shortest operation time first (SOT)", LOT: "Longest operation time first (LOT)" };
  var RULE_HOW = { FIFO: "In the order they arrived (the order of the table)", LIFO: "The last one to arrive goes first: reverse the table", DD: "Earliest due date first", SOT: "Shortest process time first", LOT: "Longest process time first" };
  function applyRule(jobs, r) {
    var j = jobs.map(function (x, i) { return [x, i]; });
    if (r === "LIFO") return jobs.slice().reverse();
    if (r === "DD") j.sort(function (a, b) { return a[0].d - b[0].d || a[1] - b[1]; });
    else if (r === "SOT") j.sort(function (a, b) { return a[0].p - b[0].p || a[1] - b[1]; });
    else if (r === "LOT") j.sort(function (a, b) { return b[0].p - a[0].p || a[1] - b[1]; });
    return j.map(function (x) { return x[0]; });
  }
  function runSeq(seq) { var t = 0, fin = [], lt = []; seq.forEach(function (j) { t += j.p; fin.push(t); lt.push(Math.max(0, t - j.d)); }); return { fin: fin, lt: lt, tot: fin.reduce(function (a, b) { return a + b; }, 0), late: lt.reduce(function (a, b) { return a + b; }, 0) }; }
  function parHow(R, units) {
    var o = R.o, h = "The trick: start from the longest operation, <b>" + esc(o[R.L].n) + "</b>. ";
    if (R.head.length) h += "Head (what must happen before it can start): " + R.head.map(function (x) { return esc(o[x.i].n) + " " + (units || x.i === 0 ? o[x.i].tb + " + " : "") + x.cycles + "·" + o[x.i].t; }).join(", ") + (units ? "" : " (setups run from the start; a setup longer than the wait in front of it adds its extra minutes)") + ". ";
    h += "Longest: " + (units || R.L === 0 ? o[R.L].tb + " + " : "") + o[R.L].c + "·" + o[R.L].t + ". ";
    if (R.tail.length) h += "Tail (the last units after it): " + R.tail.map(function (x) { return esc(o[x.i].n) + " gets " + x.units + " unit(s) → " + x.cycles + " cycle(s) · " + o[x.i].t; }).join(", ") + ". ";
    return h + "Total <b>" + R.par + " min</b>.";
  }
  function randomOps() {
    var k = pick([3, 4]), N = rnd(8, 24), ops = [];
    for (var i = 0; i < k; i++) ops.push({ n: "Op" + (i + 1), t: rnd(2, 20), tb: pick([0, 0, 5, 10, 15, 20]), P: pick([1, 1, 2, 2, 3]), S: pick([1, 1, 2, 3, 4]) });
    ops[0].tb = Math.max(ops[0].tb, 5);
    return { N: N, ops: ops };
  }

  var DRILLS = {
    "cmu-sheet": { name: "Metal sheet: the four CMUs", gen: function () {
      var a, k, per, chairs, arms, sheets, bought;
      do { a = pick([24, 25, 30, 33]); k = Math.floor(100 / a); per = 2 * k * k; chairs = rnd(6, 16) * 10; arms = chairs * 5; sheets = Math.ceil(arms / per); bought = Math.ceil(sheets / 5) * 5; } while (arms % per === 0 || bought === sheets);
      var A = a / 2, B = a / 4, el = Math.PI * A * B, cyc = 2 * el / (a * a) * 100, sh = per * el / 100, partArms = arms - (sheets - 1) * per, part = partArms * el / 100, pur = ((sheets - 1) * per * el + partArms * el) / (bought * 10000) * 100;
      return { text: "An order of <span class='mg-k'>" + chairs + " chairs</span>, each needs <span class='mg-k'>5 metal arms</span>. One press cycle cuts <b>2 ellipse arms</b> from a square of <span class='mg-k'>" + a + " × " + a + " cm</span> (each ellipse: half-axes A = " + A + " cm, B = " + B + " cm). Metal sheets are only sold as <span class='mg-k'>100 × 100 cm</span>, in packs of <span class='mg-k'>5</span>. (Like the office-chair example in the lecture.)" + sheetSvg(a, k) + "<p class='mg-help'>Give areas in cm² and every CMU as a percentage with 2 decimals.</p>",
        steps: [
          { q: "How many arms do you need?", a: arms, how: chairs + " chairs × 5 arms = <b>" + arms + "</b>." },
          { q: "How many arms come out of one 100 × 100 sheet?", a: per, how: "100 / " + a + " = " + fmt(100 / a, 2) + " → " + k + " squares per side, " + k + " × " + k + " = " + k * k + " squares, 2 arms each = <b>" + per + "</b>. The strip that is left over is waste." },
          { q: "How many sheets do you need?", a: sheets, how: arms + " / " + per + " = " + fmt(arms / per, 2) + " → always round up: <b>" + sheets + "</b> sheets." },
          { q: "How many sheets do you buy (packs of 5)?", a: bought, how: sheets + " sheets → next multiple of 5 = <b>" + bought + "</b> (" + bought / 5 + " purchases)." },
          { q: "Area of one ellipse (cm²)", a: r2(el), tol: 0.05, how: "Area = π · A · B = π · " + A + " · " + B + " = <b>" + fmt(el) + " cm²</b>." },
          { q: "CMU of one press cycle (one " + a + " × " + a + " square)", a: r2(cyc), tol: 0.05, pct: true, how: "Both ellipses: 2 · " + fmt(el) + " = " + fmt(2 * el) + " cm². Square: " + a * a + " cm². CMU = " + fmt(2 * el) + " / " + a * a + " = <b>" + fmt(cyc) + " %</b>. The same for every size, because the shape is the same." },
          { q: "CMU of one full sheet", a: r2(sh), tol: 0.05, pct: true, how: per + " ellipses · " + fmt(el) + " = " + fmt(per * el) + " cm² of 10 000 cm² → <b>" + fmt(sh) + " %</b>." },
          { q: "CMU of sheet number " + sheets + " (the one not used in full)", a: r2(part), tol: 0.05, pct: true, how: "Arms still needed on it: " + arms + " − " + (sheets - 1) + " · " + per + " = " + partArms + ". " + partArms + " · " + fmt(el) + " = " + fmt(partArms * el) + " cm² of 10 000 → <b>" + fmt(part) + " %</b>." },
          { q: "CMU of the whole purchase", a: r2(pur), tol: 0.05, pct: true, how: "Used: " + (sheets - 1) + " full sheets + the partial one = " + fmt((sheets - 1) * per * el + partArms * el) + " cm². Bought: " + bought + " · 10 000 = " + bought * 10000 + " cm². The " + (bought - sheets) + " sheet(s) you don't touch have CMU 0. CMU = <b>" + fmt(pur) + " %</b>." }
        ] };
    } },
    "bars": { name: "Steel bars: what to buy", gen: function () {
      var L = rnd(500, 580, 10), S = rnd(80, 150, 10), g = rnd(3, 6), perL = pick([2, 3]), nL = g * perL, nS = g;
      if (2 * L + S > 1200) S = Math.max(60, 1200 - 2 * L);
      var best = bestCut(L, nL, S, nS, [1200, 600]), need = nL * L + nS * S, cmu = need / best.len * 100, left = best.len - need, eur = rnd(15, 25) + 0.5, val = left / 100 * eur * 0.5 * 25;
      var only6 = bestCut(L, nL, S, nS, [600]), cmu6 = need / only6.len * 100, sur = pick([2, 5, 8, 12]), days = pick([1, 2, 3]), perDay = pick([2, 3, 5]);
      var waitLoss = days * perDay + (100 - cmu), nowLoss = 100 - cmu6;
      return { text: "You build <span class='mg-k'>" + g + " garages</span>. Each needs <span class='mg-k'>" + perL + " × " + fmt(L / 100) + " m</span> and <span class='mg-k'>1 × " + fmt(S / 100) + " m</span> steel profiles. Profiles are sold as <span class='mg-k'>12 m</span> or <span class='mg-k'>6 m</span> bars. Ignore saw losses here (the material tolerance covers them). (Like practice Test 1, exercises 1 and 3.)",
        steps: [
          { q: "Total demand in metres", a: need / 100, tol: 0.01, how: nL + " × " + fmt(L / 100) + " + " + nS + " × " + fmt(S / 100) + " = <b>" + fmt(need / 100) + " m</b>." },
          { q: "Best combination: how many metres do you buy?", a: best.len / 100, tol: 0.01, how: "Fill the longest bar first: as many long pieces as fit, then fill the rest with short ones. Best plan:<br>" + planText(best.plan, L, S) + "<br>Total bought: <b>" + fmt(best.len / 100) + " m</b>." },
          { q: "CMU of that purchase", a: r2(cmu), tol: 0.05, pct: true, how: "CMU = used / bought = " + fmt(need / 100) + " / " + fmt(best.len / 100) + " = <b>" + fmt(cmu) + " %</b>." },
          { q: "The supplier offers pieces cut to size for " + sur + " % extra. Take it?", choice: ["Yes, take the offer", "No, buy bars"], right: 100 - cmu > sur ? 0 : 1, how: "You lose 1 − CMU = " + fmt(100 - cmu) + " % of the material. " + (100 - cmu > sur ? "That is more than " + sur + " %, so the offer is cheaper: <b>yes</b>." : "That is less than " + sur + " %, so <b>no</b>: keep cutting yourself.") },
          { q: "You can sell the leftovers at 50 % of " + fmt(eur) + " EUR/m. How much is that in CZK (1 EUR = 25 CZK, whole CZK)?", a: Math.round(val), tol: 1.01, how: "Leftover = " + fmt(best.len / 100) + " − " + fmt(need / 100) + " = " + fmt(left / 100) + " m. " + fmt(left / 100) + " · " + fmt(eur) + " · 0.5 · 25 = <b>" + fmt(val, 0) + " CZK</b>. (Anything burnt by the saw no longer exists, so you can't sell it.)" },
          { q: "Only a truck for 6 m bars is free today. What is the CMU if you buy only 6 m bars?", a: r2(cmu6), tol: 0.05, pct: true, how: "With 6 m bars only:<br>" + planText(only6.plan, L, S) + "<br>Bought " + fmt(only6.len / 100) + " m → CMU = " + fmt(need / 100) + " / " + fmt(only6.len / 100) + " = <b>" + fmt(cmu6) + " %</b>." },
          { q: "Waiting " + days + " day(s) for the 12 m truck costs " + perDay + " % of the material cost per day. Wait or go now?", choice: ["Go now with 6 m bars", "Wait for the 12 m truck"], right: nowLoss <= waitLoss ? 0 : 1, how: "Go now: you lose " + fmt(nowLoss) + " %. Wait: " + days + " · " + perDay + " % + " + fmt(100 - cmu) + " % = " + fmt(waitLoss) + " %. " + (nowLoss <= waitLoss ? "<b>Go now</b>: it loses less." : "<b>Wait</b>: it loses less.") }
        ] };
    } },
    "wine": { name: "Material losses: how many bottles?", gen: function () {
      var V = pick([50, 100, 200]), b = pick([500, 750, 1000]), p1 = pick([0.1, 0.2, 0.3]), p2 = pick([0.2, 0.3, 0.4]);
      var l1 = b * p1 / 100, l2 = b * p2 / 100, per = b + l1 + l2, n = Math.floor(V * 1000 / per), cmu = n * b / (V * 1000) * 100;
      return { text: "Wine arrives in barrels of <span class='mg-k'>" + V + " l</span>. Each bottle holds <span class='mg-k'>" + b + " ml</span>. <span class='mg-k'>" + p1 + " %</span> is lost in the pipelines, and bottling loses <span class='mg-k'>" + p2 + " %</span> per batch of 6 bottles. (Like the wine example in the lecture.)",
        steps: [
          { q: "Bottles on paper (no losses)", a: V * 1000 / b, tol: 0.01, how: V + " l = " + V * 1000 + " ml; " + V * 1000 + " / " + b + " = <b>" + fmt(V * 1000 / b) + "</b>. But this ignores the losses." },
          { q: "Pipeline loss per bottle (ml)", a: r2(l1), tol: 0.01, how: b + " ml · " + p1 + " % = <b>" + fmt(l1) + " ml</b> (irreversible)." },
          { q: "Bottling loss per bottle (ml)", a: r2(l2), tol: 0.01, how: "Per batch of 6 bottles: 6 · " + b + " · " + p2 + " % = " + fmt(6 * l2) + " ml, shared by 6 bottles → <b>" + fmt(l2) + " ml</b> per bottle." },
          { q: "Wine you need to fill ONE bottle (ml)", a: r2(per), tol: 0.01, how: b + " + " + fmt(l1) + " + " + fmt(l2) + " = <b>" + fmt(per) + " ml</b>." },
          { q: "How many full bottles can you promise from one barrel?", a: n, how: V * 1000 + " / " + fmt(per) + " = " + fmt(V * 1000 / per, 3) + " → a half-full bottle is not a product: <b>" + n + "</b>." },
          { q: "CMU of the barrel", a: r2(cmu), tol: 0.05, pct: true, how: n + " · " + b + " = " + n * b + " ml used of " + V * 1000 + " ml → <b>" + fmt(cmu) + " %</b>. The fix from the lecture: ask the supplier for a few ml more per barrel." }
        ] };
    } },
    "time-start": { name: "Work standards: when must the order start?", gen: function () {
      for (var tries = 0; tries < 50; tries++) {
        var units = rnd(6, 16) * 10, ta = [["Clamp the piece", rnd(3, 7) / 10], ["Turn one piece", rnd(70, 140) / 10], ["Release the piece", rnd(3, 6) / 10], ["Check each piece", 0.5]];
        var tb = [["Study the drawing", rnd(5, 10)], ["Adjust the machine", rnd(10, 16) * 10], ["Hand over the finished work", rnd(5, 9)]];
        var cS = rnd(4, 6), cE = rnd(4, 6), clean = pick([10, 12, 15]);
        var sa = r2(ta.reduce(function (s, x) { return s + x[1]; }, 0)), sb = tb.reduce(function (s, x) { return s + x[1]; }, 0), sc = cS + cE + clean;
        var need = r2(sa * units + sb), have = 480 - sc, sh = need / have;
        if (sh < 4.95 && sh >= 1.05 && sh % 1 > 0.05) break;
      }
      var full = Math.floor(sh), rest = r2(need - full * have), endC = cE + clean, back = rest + endC;
      function clock(minBack) { var m = Math.round(17 * 60 - minBack), h2 = Math.floor(m / 60), m2 = m - h2 * 60; return h2 + ":" + (m2 < 10 ? "0" : "") + m2; }
      var day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][4 - full], tstr = clock(back);
      var tOpts = [tstr, clock(rest), clock(back + 30), clock(back - 15)].filter(function (x, i, a) { return a.indexOf(x) === i; });
      var rows = "<div class='tw'><table class='mg-t'><tbody><tr><th>Operation</th><th>µ (min)</th></tr>" + [["Prepare the workplace", cS]].concat(tb.slice(0, 2), ta, [tb[2]], [["Clean the workplace", cE]]).map(function (x) { return "<tr><td style='text-align:left'>" + esc(x[0]) + "</td><td>" + fmt(x[1]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      return { text: "A batch of <span class='mg-k'>" + units + " pieces</span> must be finished at the end of the Friday shift. One shift a day, 8 hours, 9:00–17:00. At the end of each shift <span class='mg-k'>" + clean + " min</span> go to general cleaning of the shop floor (written outside the table, like in the test). Preparing the workplace happens at the start of the shift, cleaning the workplace at the end. (Like practice Test 1, exercise 2, the µ column.)" + rows,
        steps: [
          { q: "Which type of time is 'Adjust the machine'?", choice: ["Unit time (A)", "Batch time (B)", "Shift time (C)"], right: 1, how: "It happens once for the whole batch: <b>batch time</b>." },
          { q: "Total unit time t_a (min per piece)", a: sa, tol: 0.011, how: ta.map(function (x) { return fmt(x[1]); }).join(" + ") + " = <b>" + fmt(sa) + "</b> (clamp, turn, release, check: they repeat for every piece)." },
          { q: "Total batch time t_b (min)", a: sb, how: tb.map(function (x) { return x[1]; }).join(" + ") + " = <b>" + sb + "</b>." },
          { q: "Total shift time t_c per shift (min)", a: sc, how: "Prepare " + cS + " + clean the workplace " + cE + " + cleaning the floor " + clean + " = <b>" + sc + "</b>. Don't forget the one written outside the table." },
          { q: "Time you NEED for the batch (min)", a: need, tol: 0.05, how: "need = t_a · units + t_b = " + fmt(sa) + " · " + units + " + " + sb + " = <b>" + fmt(need) + "</b>." },
          { q: "Time you HAVE in one shift (min)", a: have, how: "have = 480 − t_c = 480 − " + sc + " = <b>" + have + "</b>." },
          { q: "Shifts needed (2 decimals)", a: r2(sh), tol: 0.011, how: fmt(need) + " / " + have + " = <b>" + fmt(sh) + "</b> shifts: " + full + " full shift(s) plus part of one more." },
          { q: "Minutes of work left for the first (partial) day", a: rest, tol: 0.05, how: fmt(need) + " − " + full + " · " + have + " = <b>" + fmt(rest) + " min</b>." },
          { q: "On which day does the work start?", choice: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], right: 4 - full, how: "Friday is the last full day. Go back " + full + " full shift(s): the partial day is <b>" + day + "</b>." },
          { q: "At what time on " + day + " must it start?", choice: shuffle(tOpts), rightText: tstr,
            how: "The shift ends at 17:00, and the last " + endC + " min of the day are cleaning (" + cE + " + " + clean + "). So count back " + fmt(rest) + " + " + endC + " = " + fmt(back) + " min from 17:00 → <b>" + tstr + "</b>. (This assumes an activity can be split between days, like in the answer key.)" }
        ] };
    } },
    "avail": { name: "Available time in a quarter", gen: function () {
      var y = rnd(2026, 2029), q = rnd(0, 3), H = czHolidays(y), m0 = q * 3, days = 0, we = 0, hol = 0, holList = [], d, cand = [];
      for (d = new Date(y, m0, 1); d.getMonth() < m0 + 3 && d.getFullYear() === y; d.setDate(d.getDate() + 1)) {
        days++; var w = d.getDay();
        if (w === 0 || w === 6) we++; else if (H[dkey(d)]) { hol++; holList.push(dstr(d) + " (" + H[dkey(d)] + ")"); }
        if (w === 1) cand.push(new Date(d));
      }
      var shut = {}, sd = 0, startM = null, x;
      cand = shuffle(cand);
      for (var c = 0; c < cand.length && !startM; c++) {
        var ok = true; x = new Date(cand[c]);
        for (var i = 0; i < 12; i++) { if (x.getMonth() > m0 + 2 || x.getFullYear() !== y) ok = false; if (H[dkey(x)] && x.getDay() !== 0 && x.getDay() !== 6) ok = false; x.setDate(x.getDate() + 1); }
        if (ok) startM = new Date(cand[c]);
      }
      if (!startM) return DRILLS.avail.gen();
      var endS = new Date(startM); endS.setDate(endS.getDate() + 11);
      for (x = new Date(startM); x <= endS; x.setDate(x.getDate() + 1)) { if (x.getDay() !== 0 && x.getDay() !== 6) { shut[dkey(x)] = 1; sd++; } }
      var work = days - we - hol - sd, shifts = pick([1, 2, 3]), maint = pick([4, 5, 6, 8]), hrs = work * shifts * 8 - maint * 3;
      var cal = '<div class="om-cals">' + [0, 1, 2].map(function (k) { return monthGrid(y, m0 + k, H, shut); }).join("") + '</div><p class="om-legend"><span class="om-d we">S</span> weekend <span class="om-d hol">H</span> public holiday <span class="om-d shut">P</span> plant shutdown <span class="om-d wd">7</span> working day</p>';
      return { text: "Quarter " + (q + 1) + " of " + y + " (" + MON[m0] + "–" + MON[m0 + 2] + "). Planned plant shutdown: <span class='mg-k'>Monday " + startM.getDate() + " " + MON[startM.getMonth()] + " to Friday " + endS.getDate() + " " + MON[endS.getMonth()] + "</span>. Maintenance <span class='mg-k'>" + maint + " h per month</span> during working hours. The plant runs <span class='mg-k'>" + shifts + " shift" + (shifts > 1 ? "s" : "") + " × 8 h</span>. Czech public holidays count. (Like the lecture's third-quarter example.)" + cal,
        steps: [
          { q: "Calendar days in the quarter", a: days, how: [0, 1, 2].map(function (k) { return new Date(y, m0 + k + 1, 0).getDate(); }).join(" + ") + " = <b>" + days + "</b>." },
          { q: "Weekend days", a: we, how: "Count the Saturdays and Sundays (grey): <b>" + we + "</b>." },
          { q: "Public holidays that fall on a working day", a: hol, how: (holList.length ? holList.join(", ") : "none") + " → <b>" + hol + "</b>. A holiday on a weekend is not subtracted twice." },
          { q: "Shutdown working days", a: sd, how: "Two weeks, Monday to Friday = <b>" + sd + "</b> working days (the weekend in between is already counted)." },
          { q: "Working days", a: work, how: days + " − " + we + " − " + hol + " − " + sd + " = <b>" + work + "</b>." },
          { q: "Available time of the line (hours)", a: hrs, how: "AT = " + work + " · " + shifts + " shift(s) · 8 h − " + maint + " h · 3 months = " + work * shifts * 8 + " − " + maint * 3 + " = <b>" + hrs + " h</b>." }
        ] };
    } },
    "little": { name: "Little's Law: two numbers given, find the third", gen: function () {
      var t = rnd(0, 4);
      if (t === 0) { var n = rnd(2, 8) * 10, h = pick([2, 2.5, 4, 5]), stay = n / h; if (stay % 1) return DRILLS.little.gen(); var arr = stay + rnd(4, 16);
        return { text: "In a hospital waiting room <span class='mg-k'>" + n + " people</span> are sitting. Each waits about <span class='mg-k'>" + h + " hours</span>. <span class='mg-k'>" + arr + " people</span> come through the door every hour. (Like the waiting-room example in the lecture.)", steps: [
          { q: "Which two numbers belong to Little's Law here?", choice: ["people in the room and waiting time", "people coming in and waiting time", "people in the room and people coming in"], right: 0, how: "Units in the system (" + n + " people) and time in the system (" + h + " h). The " + arr + " at the door is extra data: exercises often contain data you don't use." },
          { q: "How many people per hour actually stay in the waiting room?", a: stay, how: "rate = units / time = " + n + " / " + h + " = <b>" + stay + " per hour</b>." },
          { q: "How many people per hour leave without waiting?", a: arr - stay, how: arr + " − " + stay + " = <b>" + (arr - stay) + "</b>. Good for a hospital, but in a shop these would be lost customers." }] }; }
      if (t === 1) { var D = rnd(2, 6) * 1000, U = D * rnd(2, 5), hrs = 8, per = hrs * 60 / D, tot = U * per;
        return { text: "There are <span class='mg-k'>" + fmt(U, 0) + " orders</span> in the system. You work <span class='mg-k'>" + hrs + " hours a day</span> and process <span class='mg-k'>" + fmt(D, 0) + " orders per day</span>. (Like the orders example in the lecture.)", steps: [
          { q: "Minutes per order (3 decimals)", a: Math.round(per * 1000) / 1000, tol: 0.0011, how: hrs * 60 + " min / " + D + " = <b>" + fmt(per, 3) + " min</b> per order." },
          { q: "Minutes of work to clear all orders", a: Math.round(tot), tol: 0.6, how: U + " · " + fmt(per, 3) + " = <b>" + fmt(tot, 0) + " min</b>. This number tells you how many people you'd need to finish faster." },
          { q: "Working days to clear them at the current pace", a: U / D, how: U + " / " + D + " = <b>" + U / D + " days</b> (or " + fmt(tot, 0) + " / " + hrs * 60 + ")." }] }; }
      if (t === 2) { var r = pick([2, 4, 5, 8]), C = r * rnd(2, 8);
        return { text: "An office has <span class='mg-k'>" + C + " codes</span> in various stages. <span class='mg-k'>" + r + " codes</span> leave the office per day. A new code arrives now. (Like the office example in the lecture.)", steps: [
          { q: "After how many days is the new code ready to go out?", a: C / r, how: "time = units / rate = " + C + " / " + r + " = <b>" + C / r + " days</b>. The " + C + " codes in front of it must be cleared first." },
          { q: "The office works Monday–Friday and the code arrives on Monday morning. Is it ready the same week?", choice: ["Yes", "No"], right: C / r <= 5 ? 0 : 1, how: C / r <= 5 ? "<b>Yes</b>: " + C / r + " days fit in one working week." : "<b>No</b>: " + C / r + " working days do not fit in one week." }] }; }
      if (t === 3) { var cu = pick([8, 10, 12, 15, 20]), m = pick([3, 4, 5, 6]), T = pick([10, 15, 20, 25, 30]), bar = cu * m / T; if (bar % 1 || bar < 1) return DRILLS.little.gen();
        return { text: "A queue at a coffee shop has <span class='mg-k'>" + cu + " customers</span>. One barista needs about <span class='mg-k'>" + m + " minutes</span> per customer. You want all of them served in <span class='mg-k'>" + T + " minutes</span>. (Like practice Test 1, exercise 4a.)", steps: [
          { q: "Minutes per customer the shop must reach", a: r2(T / cu), tol: 0.011, how: T + " / " + cu + " = <b>" + fmt(T / cu) + " min</b> per customer." },
          { q: "How many baristas?", a: bar, how: "One barista: " + m + " min per customer. Needed: " + fmt(T / cu) + " min. " + m + " / " + fmt(T / cu) + " = <b>" + bar + " baristas</b>." }] }; }
      var bs = pick([10, 20, 50]), pd = bs * rnd(2, 30), dd = pick([2, 3, 4]);
      return { text: "A factory makes <span class='mg-k'>" + pd + " products per day</span>. Products are packed in <span class='mg-k'>batches of " + bs + "</span>. Each batch waits <span class='mg-k'>" + dd + " days</span> in finished-goods inventory before shipping. (Like practice Test 1, exercise 4b.)", steps: [
        { q: "Products in finished-goods inventory", a: pd * dd, how: pd + " per day · " + dd + " days = <b>" + pd * dd + " products</b>." },
        { q: "How many BATCHES is that?", a: pd * dd / bs, how: pd * dd + " / " + bs + " = <b>" + pd * dd / bs + " batches</b>. Exam trap: the data are in products, the question asks for batches (or the other way round), so answers end up " + bs + "× off." }] };
    } },
    "seq-lead": { name: "Gradual, parallel and DBR lead time", gen: function () {
      var X = randomOps(), N = X.N, ops = X.ops, units = Math.random() < 0.6, R = leadTimes(ops, N, units), o = R.o;
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th>Op</th><th>time (min)</th><th>setup (min)</th><th>P</th><th>S</th></tr>" + ops.map(function (x) { return "<tr><td>" + x.n + "</td><td>" + x.t + "</td><td>" + x.tb + "</td><td>" + x.P + "</td><td>" + x.S + "</td></tr>"; }).join("") + "</tbody></table></div>";
      var steps = o.map(function (x) { return { q: "Cycles of " + x.n, a: x.c, how: x.n + ": " + N + " / (" + x.P + " · " + x.S + ") = " + fmt(N / x.cap) + " → cycles are whole numbers, round up: <b>" + x.c + "</b>." }; });
      steps.push({ q: "Lead time with gradual sequencing", a: R.grad, how: units ? "Everything one after the other: " + o.map(function (x) { return "(" + x.tb + " + " + x.c + "·" + x.t + ")"; }).join(" + ") + " = <b>" + R.grad + " min</b>." : "The setups don't need units, so each setup runs while you wait; an operation starts when the previous one has finished AND its own setup is done. Total <b>" + R.grad + " min</b>." });
      steps.push({ q: "Which operation is the longest?", choice: o.map(function (x) { return x.n; }), right: R.L, how: "Compare " + (units ? "setup + cycles · time" : "cycles · time (the setups are hidden)") + ": " + o.map(function (x) { return x.n + " " + (units ? x.len : x.run); }).join(", ") + " → <b>" + o[R.L].n + "</b>." });
      steps.push({ q: "Lead time with parallel sequencing", a: R.par, how: parHow(R, units) });
      steps.push({ q: "Lead time with DBR (drum = the longest operation)", a: R.dbr, how: "The buffer in front of " + o[R.L].n + " is full, so everything before it is hidden. Drum " + (units ? o[R.L].tb + " + " : "") + o[R.L].run + (R.dTail.length ? " + tail " + R.dTail.map(function (x) { return x.cycles + "·" + o[x.i].t; }).join(" + ") : "") + " = <b>" + R.dbr + " min</b>." });
      return { text: "An order of <span class='mg-k'>" + N + " units</span>. P = number of workplaces, S = units processed at once. " + (units ? "The setup of an operation <b>needs the units</b> from the previous operation." : "The setups <b>do not need</b> units from the previous operation (they can start right away).") + " (Like practice Test 2, exercises 1 and 2.)" + tb, steps: steps, ops: ops, N: N };
    } },
    "be": { name: "Choosing the technology (break-even)", gen: function () {
      var a = { fc: rnd(2, 6) * 100000, vc: rnd(30, 45) * 10 }, b = {}, c = {};
      b.vc = a.vc - rnd(4, 12) * 10; b.fc = a.fc + (a.vc - b.vc) * rnd(2, 8) * 1000;
      c.vc = b.vc - rnd(3, 8) * 10; c.fc = b.fc + (b.vc - c.vc) * rnd(5, 14) * 1000;
      var opts = shuffle([a, b, c]); opts.forEach(function (o, i) { o.n = "ABC"[i]; });
      var mx = Math.ceil(Math.max(cross(opts[0], opts[1]), cross(opts[0], opts[2]), cross(opts[1], opts[2])) * 1.5 / 1000) * 1000, iv = intervals(opts, false, mx);
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th></th>" + opts.map(function (o) { return "<th>" + o.n + "</th>"; }).join("") + "</tr><tr><td style='text-align:left'>Fixed costs (CZK/year)</td>" + opts.map(function (o) { return "<td>" + fmt(o.fc, 0) + "</td>"; }).join("") + "</tr><tr><td style='text-align:left'>Variable costs (CZK/unit)</td>" + opts.map(function (o) { return "<td>" + o.vc + "</td>"; }).join("") + "</tr></tbody></table></div>";
      function qfor(x, y) { var q = cross(x, y); return { q: "Q where " + x.n + " and " + y.n + " cost the same", a: r2(q), tol: 0.6, how: "Q = (FC<sub>" + y.n + "</sub> − FC<sub>" + x.n + "</sub>) / (VC<sub>" + x.n + "</sub> − VC<sub>" + y.n + "</sub>) = (" + fmt(y.fc, 0) + " − " + fmt(x.fc, 0) + ") / (" + x.vc + " − " + y.vc + ") = <b>" + fmt(q) + "</b>." }; }
      var tests = shuffle(iv.map(function (s) { return Math.round((s.from + Math.min(s.to, s.from + 5000)) / 2); })).slice(0, 2);
      var steps = [qfor(opts[0], opts[1]), qfor(opts[0], opts[2]), qfor(opts[1], opts[2])];
      tests.forEach(function (q) { var w = cheapest(opts, q, false); steps.push({ q: "You need " + fmt(q, 0) + " units. Which option?", choice: opts.map(function (o) { return o.n; }), right: w, how: "Cheapest intervals: " + iv.map(function (s) { return opts[s.o].n + " " + fmt(s.from, 0) + "–" + (s.open ? "∞" : fmt(s.to, 0)); }).join(", ") + ". At " + fmt(q, 0) + " → <b>" + opts[w].n + "</b>. (A crossing between two lines that are not the lowest does not matter.)" }); });
      return { text: "Three technologies for the same product. (Like the seminar exercises and practice Test 2, exercise 3.)" + tb + "<p class='mg-help'>Sketch it: the line with the lowest fixed cost starts lowest; the one with the lowest variable cost is the flattest.</p>", steps: steps };
    } },
    "rules": { name: "Sequencing rules: average time and lateness", gen: function () {
      var jobs = ["A", "B", "C", "D", "E"].map(function (n) { var p = rnd(1, 7); return { n: n, p: p, d: rnd(p + 1, 14) }; });
      var rule = pick(["FIFO", "LIFO", "DD", "SOT", "LOT"]), seq = applyRule(jobs, rule), res = runSeq(seq);
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th>Job</th>" + jobs.map(function (j) { return "<td>" + j.n + "</td>"; }).join("") + "</tr><tr><th>Process time (days)</th>" + jobs.map(function (j) { return "<td>" + j.p + "</td>"; }).join("") + "</tr><tr><th>Due date</th>" + jobs.map(function (j) { return "<td>" + j.d + "</td>"; }).join("") + "</tr></tbody></table></div>";
      var right = seq.map(function (j) { return j.n; }).join(" → ");
      var wrong = ["FIFO", "LIFO", "DD", "SOT", "LOT"].filter(function (r) { return r !== rule; }).map(function (r) { return applyRule(jobs, r).map(function (j) { return j.n; }).join(" → "); }).filter(function (s, i, a) { return s !== right && a.indexOf(s) === i; });
      return { text: "The jobs arrived in the order A, B, C, D, E. Use the rule <span class='mg-k'>" + RULES[rule] + "</span>. (Like the Steve Smith exercise.)" + tb, steps: [
        { q: "In which order do you do the jobs?", choice: shuffle([right].concat(wrong.slice(0, 3))), rightText: right, how: RULE_HOW[rule] + " → <b>" + right + "</b>." },
        { q: "Total time in process (sum of the finish times)", a: res.tot, how: "Finish times: " + res.fin.join(", ") + " → <b>" + res.tot + "</b>." },
        { q: "Average time in process", a: r2(res.tot / 5), tol: 0.011, how: res.tot + " / 5 = <b>" + fmt(res.tot / 5) + "</b> days." },
        { q: "Total lateness", a: res.late, how: "Lateness = finish − due date, never below 0: " + res.lt.join(", ") + " → <b>" + res.late + "</b>." },
        { q: "Average lateness", a: r2(res.late / 5), tol: 0.011, how: res.late + " / 5 = <b>" + fmt(res.late / 5) + "</b> days." }] };
    } },
    "gantt": { name: "Gantt chart with Czech holidays", gen: function () {
      var y = rnd(2026, 2029), H = Object.assign({}, czHolidays(y), czHolidays(y + 1)), start = new Date(y, 11, rnd(14, 21));
      while (!isWork(start, H)) start.setDate(start.getDate() + 1);
      var jobs = ["I", "II", "III", "IV", "V"].map(function (n) { return { n: n, p: pick([1, 1.5, 2, 2.5, 3, 4, 5]) }; }).sort(function (a, b) { return a.p - b.p; });
      var days = [], d = new Date(start); while (days.length < 40) { if (isWork(d, H)) days.push(new Date(d)); d.setDate(d.getDate() + 1); }
      var cum = 0, steps = [];
      jobs.forEach(function (j) {
        var s = cum; cum += j.p; var endIdx = Math.ceil(cum - 1e-9) - 1, right = days[endIdx];
        var naive = new Date(start); naive.setDate(naive.getDate() + Math.ceil(cum) - 1);
        var opts = [right, days[endIdx + 1], days[Math.max(0, endIdx - 1)], naive].filter(function (x, i, a) { for (var z = 0; z < i; z++) if (dkey(a[z]) === dkey(x)) return false; return true; }).slice(0, 4);
        steps.push({ q: "Job " + j.n + " (" + fmt(j.p, 1) + " days) starts " + (s % 1 ? "at midday of" : "on") + " working day " + (Math.floor(s) + 1) + ". When does it finish?", choice: shuffle(opts.map(dstr)), rightText: dstr(right), how: "After job " + j.n + " you have used " + fmt(cum, 1) + " working days → it ends on working day " + (endIdx + 1) + ": <b>" + dstr(right) + "</b>. Skip weekends and the holidays (24, 25, 26 Dec, 1 Jan)." + (j.p % 1 || s % 1 ? " A half day is shared: the next job starts in the free half." : "") });
      });
      return { text: "The jobs are done in SOT order (shortest first). Work starts on <span class='mg-k'>" + dstr(start) + " " + y + "</span>, Monday to Friday only. Czech public holidays: 24, 25 and 26 December and 1 January." + '<div class="om-cals">' + monthGrid(y, 11, H) + monthGrid(y + 1, 0, H) + "</div>", steps: steps };
    } }
  };

  function drill(box) {
    var kinds = (box.getAttribute("data-kind") || "bars").split(",").map(function (k) { return k.trim(); }).filter(function (k) { return DRILLS[k]; });
    if (!kinds.length) kinds = ["bars"];
    var st = { kind: kinds[0], p: null, i: 0, tries: 0, focus: false };
    function fresh() { st.p = DRILLS[st.kind].gen(); st.i = 0; st.tries = 0; draw(); }
    function rightIdx(s) { return s.rightText != null ? s.choice.indexOf(s.rightText) : s.right; }
    function draw() {
      var p = st.p, h = head("Calculation drill", DRILLS[st.kind].name, "dr");
      if (kinds.length > 1) h += '<div class="seg mg-seg dr-kinds">' + kinds.map(function (k) { return '<button type="button" data-dk="' + k + '" aria-pressed="' + (k === st.kind) + '">' + esc(DRILLS[k].name) + "</button>"; }).join("") + "</div>";
      h += '<div class="dr-task">' + p.text + '</div><ol class="dr-steps">';
      p.steps.forEach(function (s, j) {
        if (j > st.i) return;
        var done = j < st.i;
        h += '<li class="dr-step' + (done ? " done" : "") + '"><p class="dr-q">' + s.q + "</p>";
        if (done) h += '<p class="dr-how">✓ ' + s.how + "</p>";
        else if (s.choice) h += '<div class="dr-opts">' + s.choice.map(function (o, k) { return '<button type="button" class="ghost" data-ch="' + k + '">' + esc(o) + "</button>"; }).join("") + '</div><p class="dr-msg" role="status"></p>';
        else h += '<div class="row dr-row"><input class="dr-in" inputmode="decimal" autocomplete="off" placeholder="' + (s.pct ? "e.g. 96.11" : "your number") + '" aria-label="' + esc(s.q.replace(/<[^>]+>/g, "")) + '">' + (s.pct ? '<span class="om-unit">%</span>' : "") + '<button type="button" class="btn" data-chk>Check</button><button type="button" class="ghost" data-how>Show me how</button></div><p class="dr-msg" role="status"></p>';
        h += "</li>";
      });
      h += "</ol>";
      if (st.i >= p.steps.length) h += '<div class="mg-st ok"><span>All steps done! 🎉</span> Same type with new numbers? Repeat until it feels boring: then it is in your head.</div>';
      h += '<div class="row" style="margin-top:8px"><button type="button" class="btn ' + (st.i >= p.steps.length ? "" : "sec") + '" data-new>🎲 New numbers</button><span class="dr-cnt">Solved so far: ' + (DONE[st.kind] || 0) + "</span></div>";
      box.innerHTML = h;
      var inp = box.querySelector(".dr-in"); if (inp && st.focus) inp.focus({ preventScroll: true });
    }
    function next() {
      st.i++; st.tries = 0; st.focus = true; xp(4, "drill");
      if (st.i >= st.p.steps.length) { bump(st.kind); xp(6, "drill"); toast("Drill solved ✓"); }
      draw();
    }
    box.addEventListener("click", function (e) {
      var t = e.target, s = st.p.steps[st.i], msg = box.querySelector(".dr-msg");
      if (t.closest("[data-new]")) { st.focus = false; fresh(); return; }
      var kb = t.closest("[data-dk]"); if (kb) { st.kind = kb.getAttribute("data-dk"); st.focus = false; fresh(); return; }
      if (!s) return;
      if (t.closest("[data-how]")) { msg.className = "dr-msg"; msg.innerHTML = s.how + "<br><small>Now type the number to go on.</small>"; return; }
      var ch = t.closest("[data-ch]");
      if (ch) { if (+ch.getAttribute("data-ch") === rightIdx(s)) next(); else { ch.classList.add("bad"); msg.className = "dr-msg bad"; msg.innerHTML = "Not this one. " + s.how; } return; }
      if (t.closest("[data-chk]")) {
        var v = nums(box.querySelector(".dr-in").value), tol = tolOf(s);
        if (!v.length) { msg.className = "dr-msg bad"; msg.textContent = "Type a number first."; return; }
        if (near(v, s.a, tol)) { next(); return; }
        if (s.pct && near(v.map(function (x) { return x * 100; }), s.a, tol)) { msg.className = "dr-msg bad"; msg.innerHTML = "Right number, wrong format: the question asks for a <b>percentage</b>. Type " + fmt(s.a) + ", not " + fmt(s.a / 100, 4) + ". Moodle would mark it wrong."; return; }
        st.tries++; msg.className = "dr-msg bad";
        msg.innerHTML = st.tries < 2 ? "Not quite. Check which formula you need and try again." : "Not quite. Here is how: " + s.how;
      }
    });
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("dr-in")) { e.preventDefault(); var b = box.querySelector("[data-chk]"); if (b) b.click(); } });
    fresh();
  }

  /* ======================================================================
     2. BAR-CUTTING PUZZLE
     ====================================================================== */
  var BAR_PRESETS = {
    garage: { text: "Practice Test 1, exercise 1: 5 garages, each needs 3 profiles of 5.4 m and 1 of 1.1 m. Bars are sold as 12 m or 6 m.", L: 540, nL: 15, S: 110, nS: 5 },
    seminar: { text: "Seminar: 5 garages, each needs 3 profiles of 5.4 m and 1 of 1.2 m. Bars are sold as 12 m or 6 m.", L: 540, nL: 15, S: 120, nS: 5 }
  };
  function bars(box) {
    var pr = BAR_PRESETS[box.getAttribute("data-preset")], st;
    function fresh(p) {
      if (!p) { var L = rnd(500, 580, 10), S = rnd(80, 150, 10), g = rnd(2, 5); if (2 * L + S > 1200) S = Math.max(60, 1200 - 2 * L); p = { text: "Random task: " + g + " garages, each needs 3 × " + fmt(L / 100) + " m and 1 × " + fmt(S / 100) + " m. Bars are 12 m or 6 m.", L: L, nL: 3 * g, S: S, nS: g }; }
      st = { p: p, bars: [], sel: null, best: bestCut(p.L, p.nL, p.S, p.nS, [1200, 600]), msg: "" };
      draw();
    }
    function placed(len) { var n = 0; st.bars.forEach(function (b) { b.pc.forEach(function (x) { if (x === len) n++; }); }); return n; }
    function used(b) { return b.pc.reduce(function (s, x) { return s + x; }, 0); }
    function leftOf(len) { var p = st.p; return len === p.L ? p.nL - placed(p.L) : p.nS - placed(p.S); }
    function pieceChip(len, left) { return '<button type="button" class="om-chip' + (st.sel === len ? " sel" : "") + (left ? "" : " done") + '" data-pick="' + len + '" draggable="' + (left ? "true" : "false") + '"' + (left ? "" : " disabled") + ">" + fmt(len / 100) + " m <small>× " + left + " left</small></button>"; }
    function draw() {
      var p = st.p, leftL = leftOf(p.L), leftS = leftOf(p.S), bought = st.bars.reduce(function (s, b) { return s + b.B; }, 0), need = placed(p.L) * p.L + placed(p.S) * p.S;
      var h = head("Drag and drop", "Cut the steel bars") + '<p class="mg-help">' + esc(p.text) + " Tap a piece, then tap a bar (or drag it). Tap a piece on a bar to take it back. Saw losses are ignored here.</p>";
      h += '<div class="om-pieces">' + pieceChip(p.L, leftL) + pieceChip(p.S, leftS) + "</div>";
      h += '<div class="om-bars">' + (st.bars.length ? st.bars.map(function (b, i) {
        var left = b.B - used(b);
        return '<div class="om-barrow"><span class="om-blab">' + b.B / 100 + ' m</span><div class="om-bar" data-bar="' + i + '" style="width:' + b.B / 12 + '%">' + b.pc.map(function (x, k) { return '<button type="button" class="om-pc ' + (x === p.L ? "long" : "short") + '" data-rm="' + i + "," + k + '" style="width:' + x / b.B * 100 + '%" title="' + fmt(x / 100) + ' m, tap to take it back">' + fmt(x / 100, 2) + "</button>"; }).join("") + (left > 0 ? '<span class="om-left" style="width:' + left / b.B * 100 + '%">' + (left >= 50 ? fmt(left / 100, 2) : "") + "</span>" : "") + "</div></div>";
      }).join("") : '<p class="mg-note">No bars yet. Add a 12 m or 6 m bar.</p>') + "</div>";
      h += '<div class="row" style="gap:8px;margin:8px 0;flex-wrap:wrap"><button type="button" class="btn sec" data-add="1200">＋ 12 m bar</button><button type="button" class="btn sec" data-add="600">＋ 6 m bar</button><button type="button" class="ghost" data-clean>Remove empty bars</button><button type="button" class="ghost" data-reset>Start over</button></div>';
      h += '<div class="om-stats"><span>Bought <b>' + fmt(bought / 100) + ' m</b></span><span>Used <b>' + fmt(need / 100) + ' m</b></span><span>CMU <b>' + (bought ? fmt(need / bought * 100) + " %" : "–") + '</b></span><span>Still to place <b>' + (leftL + leftS) + "</b></span></div>";
      h += '<div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn" data-check>Check my plan</button><button type="button" class="ghost" data-best>Show a best plan</button><button type="button" class="ghost" data-rand>🎲 New task</button></div>';
      if (st.msg) h += st.msg;
      box.innerHTML = h;
    }
    function drop(i, len) {
      var b = st.bars[i];
      if (!b || !len) return;
      if (!leftOf(len)) { st.msg = '<p class="dr-msg bad">All pieces of that length are placed.</p>'; draw(); return; }
      if (used(b) + len > b.B) { st.msg = '<p class="dr-msg bad">It does not fit: only ' + fmt((b.B - used(b)) / 100) + " m left on that bar.</p>"; draw(); return; }
      b.pc.push(len); st.msg = ""; if (!leftOf(len)) st.sel = null; draw();
    }
    box.addEventListener("click", function (e) {
      var t = e.target, p = st.p;
      var pk = t.closest("[data-pick]"); if (pk) { var v = +pk.getAttribute("data-pick"); st.sel = st.sel === v ? null : v; draw(); return; }
      var rm = t.closest("[data-rm]"); if (rm) { var a = rm.getAttribute("data-rm").split(","); st.bars[+a[0]].pc.splice(+a[1], 1); st.msg = ""; draw(); return; }
      var br = t.closest("[data-bar]"); if (br) { if (st.sel) drop(+br.getAttribute("data-bar"), st.sel); else { st.msg = '<p class="dr-msg">Tap a piece first.</p>'; draw(); } return; }
      var ad = t.closest("[data-add]"); if (ad) { st.bars.push({ B: +ad.getAttribute("data-add"), pc: [] }); st.msg = ""; draw(); return; }
      if (t.closest("[data-clean]")) { st.bars = st.bars.filter(function (b) { return b.pc.length; }); draw(); return; }
      if (t.closest("[data-reset]")) { fresh(st.p); return; }
      if (t.closest("[data-rand]")) { fresh(null); return; }
      var needAll = p.nL * p.L + p.nS * p.S;
      if (t.closest("[data-best]")) { st.msg = '<div class="mg-st teach"><span>A best plan:</span><br>' + planText(st.best.plan, p.L, p.S) + "<br>Bought " + fmt(st.best.len / 100) + " m, CMU " + fmt(needAll / st.best.len * 100) + " %.</div>"; draw(); return; }
      if (t.closest("[data-check]")) {
        st.bars = st.bars.filter(function (b) { return b.pc.length; });
        var leftAll = leftOf(p.L) + leftOf(p.S), bought = st.bars.reduce(function (s, b) { return s + b.B; }, 0);
        var big = st.bars.reduce(function (m, b) { return Math.max(m, b.B - used(b)); }, 0);
        if (leftAll) st.msg = '<div class="mg-st no"><span>Not finished:</span> ' + leftAll + " piece(s) still to place.</div>";
        else if (bought > st.best.len) st.msg = '<div class="mg-st no"><span>It works, but you buy too much.</span> You buy ' + fmt(bought / 100) + " m (CMU " + fmt(needAll / bought * 100) + " %). The best is " + fmt(st.best.len / 100) + " m (CMU " + fmt(needAll / st.best.len * 100) + " %). Tip: use the 12 m bars as much as possible first.</div>";
        else if (big < st.best.big) st.msg = '<div class="mg-st teach"><span>Same CMU as the best, but…</span> your leftovers are small pieces (largest ' + fmt(big / 100) + " m). The teacher only gives the points for the plan with the <b>bigger leftovers</b> (here up to " + fmt(st.best.big / 100) + " m), because big pieces are easier to sell or reuse.</div>";
        else { st.msg = '<div class="mg-st ok"><span>Perfect! 🎉</span> CMU ' + fmt(needAll / bought * 100) + " %, the best possible, with big leftovers.</div>"; xp(10, "bars"); bump("bars-puzzle"); }
        draw();
      }
    });
    box.addEventListener("dragstart", function (e) { var pk = e.target.closest && e.target.closest("[data-pick]"); if (pk) { st.sel = +pk.getAttribute("data-pick"); e.dataTransfer.setData("text/plain", String(st.sel)); } });
    box.addEventListener("dragover", function (e) { if (e.target.closest && e.target.closest("[data-bar]")) e.preventDefault(); });
    box.addEventListener("drop", function (e) { var br = e.target.closest && e.target.closest("[data-bar]"); if (br) { e.preventDefault(); drop(+br.getAttribute("data-bar"), +e.dataTransfer.getData("text/plain") || st.sel); } });
    fresh(pr || null);
  }

  /* ======================================================================
     3. GRADUAL / PARALLEL / DBR TIMELINE
     ====================================================================== */
  var SEQ_PRESETS = {
    two: { label: "2 operations", title: "Seminar: 2 operations, 10 units", N: 10, ops: [{ n: "Op1", t: 6, tb: 10, P: 1, S: 1 }, { n: "Op2", t: 4, tb: 0, P: 1, S: 1 }] },
    seminar: { label: "Seminar", title: "Seminar: 4 operations, 20 units", N: 20, ops: [{ n: "Op1", t: 20, tb: 20, P: 2, S: 2 }, { n: "Op2", t: 20, tb: 20, P: 4, S: 1 }, { n: "Op3", t: 8, tb: 0, P: 1, S: 2 }, { n: "Op4", t: 15, tb: 0, P: 1, S: 2 }] },
    fast1: { label: "Fast op 1", title: "Seminar: operation 1 becomes fast", N: 20, ops: [{ n: "Op1", t: 2, tb: 5, P: 2, S: 2 }, { n: "Op2", t: 20, tb: 20, P: 4, S: 1 }, { n: "Op3", t: 8, tb: 0, P: 1, S: 2 }, { n: "Op4", t: 15, tb: 0, P: 1, S: 2 }] },
    neck2: { label: "Op 2 bottleneck", title: "Seminar: operation 2 becomes the bottleneck", N: 20, ops: [{ n: "Op1", t: 20, tb: 20, P: 2, S: 2 }, { n: "Op2", t: 20, tb: 20, P: 1, S: 2 }, { n: "Op3", t: 8, tb: 0, P: 4, S: 1 }, { n: "Op4", t: 15, tb: 0, P: 1, S: 2 }] },
    test2a: { label: "Test 2 ex 1", title: "Practice Test 2, exercise 1: 20 units", N: 20, ops: [{ n: "1", t: 10, tb: 10, P: 1, S: 4 }, { n: "2", t: 15, tb: 20, P: 2, S: 2 }, { n: "3", t: 8, tb: 0, P: 2, S: 1 }, { n: "4", t: 7, tb: 0, P: 2, S: 1 }] },
    test2b: { label: "Test 2 ex 2", title: "Practice Test 2, exercise 2: 23 units (D = 12 min as in the task; the answer key's table used 11)", N: 23, ops: [{ n: "A", t: 2, tb: 5, P: 3, S: 1 }, { n: "B", t: 10, tb: 35, P: 2, S: 3 }, { n: "C", t: 5, tb: 0, P: 1, S: 3 }, { n: "D", t: 12, tb: 2, P: 6, S: 1 }, { n: "E", t: 2, tb: 10, P: 1, S: 6 }] }
  };
  function seqline(box) {
    var st = { pre: box.getAttribute("data-preset") || "seminar", mode: box.getAttribute("data-mode") || "par", units: "1", N: 0, ops: null, title: "", shown: false };
    function load() { var p = SEQ_PRESETS[st.pre]; st.N = p.N; st.title = p.title; st.ops = p.ops.map(function (o) { return Object.assign({}, o); }); st.shown = false; }
    function ans(R) { return st.mode === "grad" ? R.grad : st.mode === "par" ? R.par : R.dbr; }
    function draw() {
      var R = leadTimes(st.ops, st.N, st.units === "1"), o = R.o, total = ans(R);
      var h = head("Interactive timeline", "Gradual, parallel and DBR");
      h += '<div class="mg-ctl">' + seg("pre", Object.keys(SEQ_PRESETS).map(function (k) { return [k, SEQ_PRESETS[k].label]; }).concat([["rand", "🎲 Random"]]), st.pre) + "</div>";
      h += '<p class="mg-help"><b>' + esc(st.title) + "</b></p>";
      h += "<div class='tw'><table class='mg-t'><tbody><tr><th>Op</th><th>time</th><th>setup</th><th>P</th><th>S</th><th>units/cycle</th><th>cycles</th><th>setup + cycles·time</th></tr>" + o.map(function (x, i) { return "<tr" + (i === R.L && st.mode !== "grad" && st.shown ? " class='on'" : "") + "><td>" + esc(x.n) + "</td><td>" + x.t + "</td><td>" + x.tb + "</td><td>" + x.P + "</td><td>" + x.S + "</td><td>" + x.cap + "</td><td>" + x.c + "</td><td>" + x.tb + " + " + x.c + "·" + x.t + " = " + x.len + "</td></tr>"; }).join("") + "</tbody></table></div>";
      h += '<div class="mg-ctl">' + seg("mode", [["grad", "Gradual"], ["par", "Parallel"], ["dbr", "DBR"]], st.mode) + seg("units", [["1", "Setup needs units"], ["0", "Setup without units"]], st.units) + "</div>";
      if (!st.shown) h += '<p class="mg-help">Draw it on paper first, then type your lead time.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input class="dr-in" inputmode="decimal" placeholder="lead time" aria-label="Your lead time in minutes"><span class="om-unit">min</span><button type="button" class="btn" data-guess>Check</button><button type="button" class="ghost" data-show>Just show me</button></div><p class="dr-msg" role="status"></p>';
      else {
        h += '<svg class="mg-svg om-tl" role="img" aria-label="Timeline of the operations"></svg><div class="mg-st ok"><span>Lead time: ' + total + " min.</span> " + (st.mode === "grad" ? "Each operation waits until the previous one has finished the whole order." : st.mode === "par" ? parHow(R, st.units === "1") : "The drum is " + esc(o[R.L].n) + ". Its buffer is always full, so everything before it is hidden; only the drum and the tail count.") + "</div>";
        h += '<p class="mg-note">Legend: <span class="om-key su"></span> setup · <span class="om-key ru"></span> processing · <span class="om-key lo"></span> longest operation / drum · <span class="om-key hi"></span> fills the buffer in the background</p><button type="button" class="ghost" data-hide>Hide and try another mode</button>';
      }
      box.innerHTML = h;
      if (st.shown) drawTl(box.querySelector(".om-tl"), R, total);
    }
    function drawTl(svg, R, total) {
      var o = R.o, W = 620, rowH = 26, top = 8, H = top + o.length * rowH + 24, L = 40, sx = function (x) { return L + x / total * (W - L - 12); };
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      o.forEach(function (x, i) { svgEl(svg, "text", { x: 4, y: top + i * rowH + 17, "class": "mg-tick" }, String(x.n).slice(0, 4)); });
      function blk(i, a, b, cls, lab) { if (b - a <= 0) return; var y = top + i * rowH + 3; svgEl(svg, "rect", { x: sx(a), y: y, width: Math.max(1.5, sx(b) - sx(a)), height: rowH - 8, rx: 3, "class": "om-b " + cls }); if (lab !== "" && sx(b) - sx(a) > 28) svgEl(svg, "text", { x: (sx(a) + sx(b)) / 2, y: y + 13, "text-anchor": "middle", "class": "om-bl" }, lab); }
      if (st.mode === "grad") R.g.forEach(function (x) { blk(x.i, x.setup[0], x.setup[1], "su", o[x.i].tb); blk(x.i, x.run[0], x.run[1], "ru", o[x.i].c + "·" + o[x.i].t); });
      else if (st.mode === "par") {
        R.head.forEach(function (x) { blk(x.i, x.setup[0], x.setup[1], "su", o[x.i].tb); blk(x.i, x.run[0], x.run[1], "ru", x.cycles + "·" + o[x.i].t); });
        blk(R.L, R.body.setup[0], R.body.setup[1], "su", o[R.L].tb); blk(R.L, R.body.run[0], R.body.run[1], "lo", o[R.L].c + "·" + o[R.L].t);
        R.tail.forEach(function (x) { blk(x.i, x.run[0], x.run[1], "ru", x.cycles + "·" + o[x.i].t); });
      } else {
        for (var i = 0; i < R.L; i++) blk(i, 0, R.drum.run[1], "hi", "buffer");
        blk(R.L, R.drum.setup[0], R.drum.setup[1], "su", o[R.L].tb); blk(R.L, R.drum.run[0], R.drum.run[1], "lo", "drum " + o[R.L].c + "·" + o[R.L].t);
        R.dTail.forEach(function (x) { blk(x.i, x.run[0], x.run[1], "ru", x.cycles + "·" + o[x.i].t); });
      }
      var yb = top + o.length * rowH + 2;
      svgEl(svg, "line", { x1: L, x2: W - 10, y1: yb, y2: yb, "class": "mg-ax" });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { var v = Math.round(total * f); svgEl(svg, "text", { x: sx(v), y: yb + 15, "text-anchor": "middle", "class": "mg-tick" }, v); });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-seg] button");
      if (b) {
        var k = b.parentNode.getAttribute("data-seg"), v = b.getAttribute("data-val");
        if (k === "pre") { st.pre = v; if (v === "rand") { var X = randomOps(); st.N = X.N; st.ops = X.ops; st.title = "Random order of " + X.N + " units"; st.shown = false; } else load(); }
        else if (k === "mode") { st.mode = v; st.shown = false; }
        else if (k === "units") { st.units = v; st.shown = false; }
        draw(); return;
      }
      if (e.target.closest("[data-show]")) { st.shown = true; draw(); return; }
      if (e.target.closest("[data-hide]")) { st.shown = false; draw(); return; }
      if (e.target.closest("[data-guess]")) {
        var R = leadTimes(st.ops, st.N, st.units === "1"), a = ans(R), inp = box.querySelector(".dr-in"), v2 = nums(inp.value), msg = box.querySelector(".dr-msg");
        if (!v2.length) { msg.className = "dr-msg bad"; msg.textContent = "Type your lead time first."; return; }
        if (near(v2, a, 0.5)) { st.shown = true; xp(8, "seq"); toast("Right! " + a + " min"); draw(); }
        else { msg.className = "dr-msg bad"; msg.innerHTML = "Not " + esc(inp.value) + ". " + (st.mode === "grad" ? "Add every operation one after the other." : st.mode === "par" ? "Start from the longest operation, add the first cycles before it and the last cycles after it." : "Only the drum and the tail after it count.") + " Then try again, or tap Just show me."; }
      }
    });
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("dr-in")) { e.preventDefault(); var b = box.querySelector("[data-guess]"); if (b) b.click(); } });
    if (!SEQ_PRESETS[st.pre]) st.pre = "seminar";
    load(); draw();
  }

  /* ======================================================================
     4. CHOOSING THE TECHNOLOGY (break-even chart)
     ====================================================================== */
  var BE_PRESETS = {
    cnc: { label: "2 CNC machines", title: "Seminar: two CNC machines (25 000 or 35 000 units?)", opts: [{ n: "CNC-A", fc: 2700000, vc: 240, cap: 25000 }, { n: "CNC-B", fc: 3600000, vc: 210, cap: 50000 }] },
    sup: { label: "3 suppliers", title: "Seminar: three transport suppliers", opts: [{ n: "I", fc: 10000, vc: 400, cap: 250 }, { n: "II", fc: 30000, vc: 200, cap: 110 }, { n: "III", fc: 40000, vc: 150, cap: 250 }] },
    abc: { label: "Lines A, B, C", title: "Practice Test 2, exercise 3: three technological lines", opts: [{ n: "A", fc: 1080000, vc: 115, cap: 11000 }, { n: "B", fc: 920000, vc: 135, cap: 5000 }, { n: "C", fc: 1110000, vc: 110, cap: 11000 }] },
    abc20: { label: "A material 20", title: "Seminar: the material cost of A drops from 25 to 20 CZK", opts: [{ n: "A", fc: 1080000, vc: 110, cap: 11000 }, { n: "B", fc: 920000, vc: 135, cap: 5000 }, { n: "C", fc: 1110000, vc: 110, cap: 11000 }] },
    loc: { label: "4 facilities", title: "Practice Test 2, exercise 4: four facilities (fixed transport = 2 CZK/km · km · 1 000 trips)", opts: [{ n: "Liberec", fc: 666000, vc: 50, cap: 9000 }, { n: "Brno", fc: 1062000, vc: 200, cap: 25000 }, { n: "Tabor", fc: 343000, vc: 100, cap: 9000 }, { n: "Plzen", fc: 497000, vc: 70, cap: 6000 }] }
  };
  function breakeven(box) {
    var st = { pre: box.getAttribute("data-preset") || "cnc", caps: false, q: 0 };
    if (!BE_PRESETS[st.pre]) st.pre = "cnc";
    function P() { return BE_PRESETS[st.pre]; }
    function qmax() { var o = P().opts, m = 0; o.forEach(function (a, i) { o.forEach(function (b, j) { if (j > i) { var c = cross(a, b); if (c && c > 0) m = Math.max(m, c); } }); m = Math.max(m, a.cap || 0); }); return Math.ceil(m * 1.15 / 10) * 10; }
    function out(o, w) { return w < 0 ? "none (over every capacity)" : o[w].n; }
    function draw() {
      var p = P(), o = p.opts, mx = qmax(); if (!st.q) st.q = Math.round(mx / 3);
      var iv = intervals(o, st.caps, st.caps ? Math.max.apply(null, o.map(function (x) { return x.cap; })) : mx), pairs = [];
      o.forEach(function (a, i) { o.forEach(function (b, j) { if (j > i) pairs.push([a, b, cross(a, b)]); }); });
      var h = head("Interactive graph", "Choosing the technology");
      h += '<div class="mg-ctl">' + seg("pre", Object.keys(BE_PRESETS).map(function (k) { return [k, BE_PRESETS[k].label]; }), st.pre) + "</div><p class='mg-help'><b>" + esc(p.title) + "</b></p>";
      h += "<div class='tw'><table class='mg-t'><tbody><tr><th></th>" + o.map(function (x) { return "<th>" + esc(x.n) + "</th>"; }).join("") + "</tr><tr><td style='text-align:left'>Fixed cost FC</td>" + o.map(function (x) { return "<td>" + fmt(x.fc, 0) + "</td>"; }).join("") + "</tr><tr><td style='text-align:left'>Variable cost VC</td>" + o.map(function (x) { return "<td>" + x.vc + "</td>"; }).join("") + "</tr><tr><td style='text-align:left'>Capacity</td>" + o.map(function (x) { return "<td>" + fmt(x.cap, 0) + "</td>"; }).join("") + "</tr></tbody></table></div>";
      h += '<div class="mg-ctl">' + seg("caps", [["0", "Without capacities"], ["1", "With capacities"]], st.caps ? "1" : "0") + '<label class="mg-sl"><span>Order size Q <span class="mg-v">' + fmt(st.q, 0) + '</span></span><input type="range" data-q min="1" max="' + mx + '" step="1" value="' + st.q + '"></label></div>';
      var w = cheapest(o, st.q, st.caps);
      h += '<div class="mg-body"><svg class="mg-svg om-be" role="img" aria-label="Total cost lines"></svg><div class="mg-out">';
      h += '<div class="mg-row"><span>Cheapest at Q = <span class="om-qv">' + fmt(st.q, 0) + '</span></span><span class="mg-num ok om-w">' + esc(out(o, w)) + "</span></div>";
      pairs.forEach(function (x) { h += '<div class="mg-row sm"><span>Q where ' + esc(x[0].n) + " = " + esc(x[1].n) + '</span><span class="mg-num sm">' + (x[2] == null ? "parallel lines" : fmt(x[2])) + "</span></div>"; });
      h += '<p class="mg-note" style="margin-top:8px"><b>Cheapest intervals' + (st.caps ? " (with capacities)" : "") + ":</b><br>" + iv.filter(function (s) { return s.o >= 0; }).map(function (s) { return esc(o[s.o].n) + ": " + fmt(s.from, 0) + " – " + (s.open ? "∞" : fmt(s.to, 0)); }).join("<br>") + "</p>";
      if (st.caps) h += '<p class="mg-note">Watch the <b>jump</b>: when the cheapest line hits its capacity, the cheapest line that still exists takes over, even one that was not the cheapest before.</p>';
      else if (pairs.some(function (x) { return x[2] == null; })) h += '<p class="mg-note">Two lines with the same variable cost are <b>parallel</b>: they never cross, and the one with the lower fixed cost always wins.</p>';
      h += "</div></div>";
      box.innerHTML = h;
      drawBe(box.querySelector(".om-be"), o, mx, w);
    }
    function drawBe(svg, o, mx, w) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var W = 360, H = 250, L = 12, R = 10, T = 14, B = 30, ymax = 0;
      o.forEach(function (x) { ymax = Math.max(ymax, x.fc + x.vc * (st.caps ? Math.min(x.cap, mx) : mx)); }); ymax *= 1.08;
      var sx = function (q) { return L + q / mx * (W - L - R); }, sy = function (c) { return H - B - c / ymax * (H - T - B); };
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svgEl(svg, "line", { x1: L, y1: sy(0), x2: W - R, y2: sy(0), "class": "mg-ax" }); svgEl(svg, "line", { x1: L, y1: sy(0), x2: L, y2: T - 6, "class": "mg-ax" });
      svgEl(svg, "text", { x: W - R, y: H - 4, "text-anchor": "end", "class": "mg-axl" }, "Q (units)"); svgEl(svg, "text", { x: L + 4, y: T, "class": "mg-axl" }, "total cost");
      [0.5, 1].forEach(function (f) { svgEl(svg, "text", { x: sx(mx * f), y: sy(0) + 13, "text-anchor": f === 1 ? "end" : "middle", "class": "mg-tick" }, fmt(mx * f, 0)); });
      o.forEach(function (x, i) {
        var end = st.caps ? Math.min(x.cap, mx) : mx;
        svgEl(svg, "line", { x1: sx(0), y1: sy(x.fc), x2: sx(end), y2: sy(x.fc + x.vc * end), "class": "mg-ln k" + (i + 1) + (i === w ? "" : " thin") });
        if (st.caps && x.cap < mx) svgEl(svg, "circle", { cx: sx(end), cy: sy(x.fc + x.vc * end), r: 4, "class": "mg-dot d-no" });
        svgEl(svg, "text", { x: sx(end) - 2, y: sy(x.fc + x.vc * end) - 6, "text-anchor": "end", "class": "mg-lb t" + (i + 1) }, x.n);
      });
      o.forEach(function (a, i) { o.forEach(function (b, j) { if (j <= i) return; var c = cross(a, b); if (c && c > 0 && c < mx && (!st.caps || (c <= a.cap && c <= b.cap))) svgEl(svg, "circle", { cx: sx(c), cy: sy(a.fc + a.vc * c), r: 3.5, "class": "mg-dot" }); }); });
      svgEl(svg, "line", { x1: sx(st.q), y1: sy(0), x2: sx(st.q), y2: T, "class": "mg-dash" });
      if (w >= 0) svgEl(svg, "circle", { cx: sx(st.q), cy: sy(o[w].fc + o[w].vc * st.q), r: 5, "class": "mg-dot d-ok" });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-seg] button"); if (!b) return;
      var k = b.parentNode.getAttribute("data-seg"), v = b.getAttribute("data-val");
      if (k === "pre") { st.pre = v; st.q = 0; } else st.caps = v === "1";
      draw();
    });
    box.addEventListener("input", function (e) {
      if (!e.target.hasAttribute("data-q")) return;
      st.q = +e.target.value; var o = P().opts, w = cheapest(o, st.q, st.caps);
      box.querySelector(".mg-sl .mg-v").textContent = fmt(st.q, 0); box.querySelector(".om-qv").textContent = fmt(st.q, 0); box.querySelector(".om-w").textContent = out(o, w);
      drawBe(box.querySelector(".om-be"), o, qmax(), w);
    });
    draw();
  }

  /* ======================================================================
     5. SEQUENCING RULES (tap the jobs into order)
     ====================================================================== */
  var RULE_PRESETS = {
    lecture: { title: "Lecture example: jobs A–E", jobs: [{ n: "A", p: 5, d: 6 }, { n: "B", p: 3, d: 5 }, { n: "C", p: 6, d: 8 }, { n: "D", p: 2, d: 7 }, { n: "E", p: 1, d: 3 }] },
    steve: { title: "Practice Test 2, exercise 5: jobs I–V", jobs: [{ n: "I", p: 3, d: 5 }, { n: "II", p: 5, d: 6 }, { n: "III", p: 6, d: 8 }, { n: "IV", p: 2, d: 7 }, { n: "V", p: 1, d: 3 }] }
  };
  function rules(box) {
    var st;
    function fresh(key) {
      var jobs = key && RULE_PRESETS[key] ? RULE_PRESETS[key].jobs : ["A", "B", "C", "D", "E"].map(function (n) { var p = rnd(1, 7); return { n: n, p: p, d: rnd(p + 1, 14) }; });
      st = { key: key, jobs: jobs, rule: "FIFO", seq: [], done: {}, msg: "" }; draw();
    }
    function draw() {
      var h = head("Tap to order", "The five sequencing rules") + '<p class="mg-help">' + esc(st.key ? RULE_PRESETS[st.key].title : "Random jobs") + ". The table order is the arrival order. Pick a rule, then tap the jobs in the order you would do them.</p>";
      h += "<div class='tw'><table class='mg-t'><tbody><tr><th>Job</th>" + st.jobs.map(function (j) { return "<td>" + j.n + "</td>"; }).join("") + "</tr><tr><th>Process time (days)</th>" + st.jobs.map(function (j) { return "<td>" + j.p + "</td>"; }).join("") + "</tr><tr><th>Due date</th>" + st.jobs.map(function (j) { return "<td>" + j.d + "</td>"; }).join("") + "</tr></tbody></table></div>";
      h += '<div class="mg-ctl">' + seg("rule", Object.keys(RULES).map(function (r) { return [r, (st.done[r] ? "✓ " : "") + r]; }), st.rule) + "</div><p class='mg-note'>" + esc(RULES[st.rule]) + "</p>";
      h += '<div class="om-pieces">' + st.jobs.map(function (j) { var on = st.seq.indexOf(j) >= 0; return '<button type="button" class="om-chip' + (on ? " done" : "") + '" data-job="' + j.n + '"' + (on ? " disabled" : "") + ">" + j.n + " <small>" + j.p + " d · due " + j.d + "</small></button>"; }).join("") + "</div>";
      h += '<p class="om-seq">Your order: <b>' + (st.seq.length ? st.seq.map(function (j) { return j.n; }).join(" → ") : "…") + '</b> <button type="button" class="ghost" data-undo>Undo</button></p>';
      if (st.msg) h += st.msg;
      var doneK = Object.keys(RULES).filter(function (r) { return st.done[r]; });
      if (doneK.length) {
        h += "<div class='tw'><table class='mg-t'><tbody><tr><th>Rule</th><th>Order</th><th>Total time</th><th>Average time</th><th>Total lateness</th><th>Average lateness</th></tr>" + doneK.map(function (r) { var x = st.done[r]; return "<tr><td>" + r + "</td><td>" + x.order + "</td><td>" + x.tot + "</td><td>" + fmt(x.tot / 5) + "</td><td>" + x.late + "</td><td>" + fmt(x.late / 5) + "</td></tr>"; }).join("") + "</tbody></table></div>";
        if (doneK.length === 5) { var best = doneK.slice().sort(function (a, b) { return st.done[a].tot - st.done[b].tot || st.done[a].late - st.done[b].late; })[0]; h += '<div class="mg-st ok"><span>All five done.</span> The best rule here is <b>' + best + "</b>: the lowest average time in process" + (doneK.filter(function (r) { return st.done[r].tot === st.done[best].tot; }).length > 1 ? " (a tie, so the lower average lateness decides)" : "") + ". Always compare both numbers, like Steve wants.</div>"; }
      }
      h += '<div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">' + Object.keys(RULE_PRESETS).map(function (k) { return '<button type="button" class="ghost" data-pre="' + k + '">' + esc(RULE_PRESETS[k].title.split(":")[0]) + "</button>"; }).join("") + '<button type="button" class="ghost" data-pre="">🎲 Random jobs</button></div>';
      box.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-seg] button"); if (b) { st.rule = b.getAttribute("data-val"); st.seq = []; st.msg = ""; draw(); return; }
      if (e.target.closest("[data-undo]")) { st.seq.pop(); st.msg = ""; draw(); return; }
      var pr = e.target.closest("[data-pre]"); if (pr) { fresh(pr.getAttribute("data-pre")); return; }
      var jb = e.target.closest("[data-job]"); if (!jb) return;
      st.seq.push(st.jobs.filter(function (j) { return j.n === jb.getAttribute("data-job"); })[0]);
      if (st.seq.length === 5) {
        var right = applyRule(st.jobs, st.rule), okOrder = st.seq.every(function (j, i) { var r = right[i]; return j === r || (st.rule === "DD" ? j.d === r.d : st.rule === "SOT" || st.rule === "LOT" ? j.p === r.p : false); });
        if (okOrder) { var res = runSeq(st.seq); st.done[st.rule] = { order: st.seq.map(function (j) { return j.n; }).join("→"), tot: res.tot, late: res.late }; st.msg = '<div class="mg-st ok"><span>Right!</span> Finish times ' + res.fin.join(", ") + ", lateness " + res.lt.join(", ") + ".</div>"; xp(5, "rules"); var nx = Object.keys(RULES).filter(function (r) { return !st.done[r]; })[0]; if (nx) st.rule = nx; }
        else st.msg = '<div class="mg-st no"><span>Not the ' + st.rule + " order.</span> " + RULE_HOW[st.rule] + ". Try again.</div>";
        st.seq = [];
      }
      draw();
    });
    fresh(box.getAttribute("data-preset") || "lecture");
  }

  /* ======================================================================
     6. SORT, ORDER, FIND THE MISTAKE, EXPLAIN (data sets)
     ====================================================================== */
  var SORTS = {
    timetypes: { title: "Unit, batch or shift time? (practice Test 1, exercise 2)", groups: ["A · unit time", "B · batch time", "C · shift time"], items: [["Preparing the workplace", 2], ["Studying workflow and drawing", 1], ["Adjustment of machine", 1], ["Clamp the workpiece in the machine", 0], ["Turning one piece", 0], ["Release workpiece", 0], ["Check one (each) piece", 0], ["Handing over completed work", 1], ["Cleaning workplace", 2], ["General cleaning of the shop floor at the end of each shift", 2]] },
    woodtimes: { title: "Wood-cutting line: which time is it? (lecture example)", groups: ["Unit time", "Batch time", "Shift time"], items: [["Cutting one WS25 every 3.5 min", 0], ["Cutting one WS30 every 3 min", 0], ["Machine setup, 20 min per batch", 1], ["Cleaning and preparing the workplace, 30 min per shift", 2]] },
    nature: { title: "Core, support or service process?", groups: ["Core / main", "Support", "Service"], items: [["The line cuts wood blocks", 0], ["Cold saw maintenance", 1], ["Office supplies purchasing", 2], ["Assembling the phone (your iPhone 11 video)", 0], ["Equipment maintenance on the assembly line", 1], ["After-sales repair of the phone", 2]] },
    stage: { title: "Pre-production, production or post-production? (by time)", groups: ["Pre-production", "Production", "Post-production"], items: [["Cutting the wood", 0], ["The line cuts wood blocks", 1], ["Packaging", 2], ["Design, sourcing, component preparation (iPhone)", 0], ["Board and final assembly, functional test (iPhone)", 1], ["Packaging and distribution (iPhone)", 2]] },
    porter: { title: "Porter's value chain: core or support process?", groups: ["Core process", "Support process"], items: [["Inbound logistics", 0], ["Operations", 0], ["Outbound logistics", 0], ["Marketing & sales", 0], ["Service", 0], ["Firm infrastructure", 1], ["Human resource management", 1], ["Technology development", 1], ["Procurement", 1]] },
    timeloss: { title: "Losses of working time: which kind?", groups: ["Personal", "Technical and organizational", "Force majeure"], items: [["A worker is ill", 0], ["A worker's child is sick, so the worker goes to the doctor", 0], ["IT stops all servers between noon and 1 pm", 1], ["A flood closes the factory", 2]] },
    demand: { title: "Dependent or independent demand?", groups: ["Dependent (you plan it)", "Independent (you forecast it)"], items: [["Tyres for every car on the assembly line", 0], ["Spare parts a garage will need next winter", 1], ["Parts listed in the Bill of Materials for an order", 0], ["How many customers will buy a coffee tomorrow", 1]] },
    codp: { title: "Where is the customer order decoupling point?", groups: ["Make-to-stock (MTS)", "Assemble-to-order (ATO)", "Make-to-order (MTO)", "Engineer-to-order (ETO)"], items: [["Clothes in a shopping mall, waiting to be sold", 0], ["Pizza: the parts are ready, you assemble when the order comes", 1], ["A car in Europe, built after the customer orders it", 2], ["A sofa designed for one customer's living room", 3], ["A screen factory making screens before anyone buys them", 0]] },
    loading: { title: "Finite or infinite loading?", groups: ["Finite loading", "Infinite loading"], items: [["Load the oven with bread, then leave until it is done", 0], ["A 24-hour bank app that never stops taking requests", 1], ["Load a machine for a 4-hour job and come back later", 0], ["A call centre that runs all day, every day", 1]] },
    pushpull: { title: "Push or pull?", groups: ["Push", "Pull"], items: [["Make to stock and hope it sells", 0], ["'Give me what I need in the right time'", 1], ["A kanban card tells the previous step to make one more", 1], ["US car industry: build cars first, sell them later", 0], ["Just in time", 1]] },
    sourcing: { title: "Outsourcing and offshoring (lecture 3, no slide)", groups: ["Insourced, at home", "Outsourced, at home", "Insourced, offshore", "Outsourced, offshore"], items: [["Your own factory in your own region", 0], ["A local company runs your workers' canteen", 1], ["Your own factory, owned by you, in another region of the world", 2], ["A designer brand has independent factories in Bangladesh make its clothes", 3]] },
    vint: { title: "Market, contract or vertical integration? (Brickley et al.)", groups: ["Market transaction", "Contract", "Vertical integration"], items: [["Low asset specificity, low uncertainty (an eraser)", 0], ["Low asset specificity, high uncertainty", 0], ["High asset specificity, low uncertainty: very specific, but you easily find suppliers", 1], ["High asset specificity, high uncertainty: very specific and nobody makes it", 2]] },
    abc: { title: "ABC-XYZ: what suits just in time?", groups: ["Good for just in time", "Keep it in stock"], items: [["AX: high value, used very regularly", 0], ["CZ: low value, used erratically", 1], ["AY: high value, fairly regular use", 0], ["CY: low value, irregular use", 1]] },
    pq: { title: "Performance objectives: Q, S, D, F or C? (your iPhone 11 video)", groups: ["Quality", "Speed", "Dependability", "Flexibility", "Cost"], items: [["First-pass yield", 0], ["Rework rate", 0], ["Cycle time", 1], ["Units per hour", 1], ["Schedule attainment", 2], ["On-time release", 2], ["Model and colour changeover", 3], ["Scrap + rework per unit", 4], ["Labour utilization", 4]] },
    i40: { title: "Industry 4.0: which technology is it? (seminar slides)", groups: ["Advanced robotics", "Big data", "Digital modelling", "Internet of Things", "Augmented reality", "Graphene"], items: [["Robots that co-operate with humans by means of sensors", 0], ["Processing large data for optimization and real-time management", 1], ["Simulation models of digital factories, optimised with virtual reality", 2], ["Connectivity and interaction between objects, and remote control", 3], ["Puts artificially created objects into a real-world image", 4], ["The strongest material; conducts heat and electricity; almost transparent", 5]] }
  };
  var ORDERS = {
    toc: { title: "Theory of Constraints: the 5 steps", items: ["IDENTIFY the system's constraint", "EXPLOIT the constraint", "SUBORDINATE everything else to the constraint", "ELEVATE the constraint", "PREVENT INERTIA from becoming the constraint"] },
    dbr: { title: "Drum-Buffer-Rope", items: ["Drum: find the bottleneck", "Buffer: calculate the number of units in the buffer", "Rope: decide when to pull more units into the line"] },
    tps: { title: "TPS: the four sections, from the base up", items: ["1P · Long-term philosophy", "2P · The right process will produce the right results", "3P · Add value to your organisation by developing your people and partners", "4P · Continuously solving root problems drives organisational learning"] },
    oee: { title: "OEE: from total time down to productive time", items: ["Total time", "Planned time (minus planned shutdown)", "Operating time (minus failures, settings and adjustments)", "Net operating time (minus idling, minor interruptions, reduced speed)", "Productive time (minus defects, rework, losses from start)"] },
    om: { title: "The operations management activities of planning", items: ["Loading: how much to do?", "Sequencing: in what order?", "Scheduling: when?", "Monitoring & controlling: up to plan?"] },
    rev: { title: "The industrial revolutions", items: ["1784 · steam (UK)", "1870 · electricity", "1969 · electronics, the microchip", "2012 · Industry 4.0: connectivity (Germany)"] },
    pull: { title: "Pull, JIT, JIS, Kanban: from philosophy to tool", items: ["Pull: the philosophy ('give me what I need in the right time')", "Just in time: make only what you need, when you need it, in the amount needed", "Just in sequence: parts arrive in the same order as the assembly", "Kanban: the card (signal) that says 'take one, make one'"] },
    test1: { title: "Work standards: when must the order start?", items: ["Classify every activity as unit, batch or shift time", "Add up the unit, batch and shift times", "Time you NEED = unit time · units + batch time", "Time you HAVE = shift length − shift time", "Shifts = NEED / HAVE", "Count back the full shifts, then the minutes of the first day, to find the start time"] },
    bars: { title: "Cutting bars: the teacher's order of work", items: ["Focus on ONE bar of the longest length you can buy", "Fit as many long pieces as possible into it", "Fill the rest of that bar with short pieces", "Use short bars for the short pieces that are still missing", "Calculate the CMU; if two plans tie, keep the one with the bigger leftovers"] },
    be: { title: "Choosing the technology: the steps", items: ["Find the Q where each pair of options costs the same", "Rank the fixed costs (where each line starts)", "Rank the variable costs (how steep each line is)", "Sketch the lines and read the cheapest one for each interval", "Add the capacities and check for jumps"] }
  };
  var TRAPS = {
    t1: [
      { title: "Little's Law", task: "A factory makes 580 products a day in batches of 10. Each batch waits 4 days. How many BATCHES are in finished-goods inventory?", lines: ["Little's Law: units = rate · time", "Rate = 580 products per day", "Time = 4 days", "Answer: 580 · 4 = 2 320 batches"], bad: 3, why: "2 320 is the number of products. The question asks for batches: 2 320 / 10 = 232. The teacher says many students lose points exactly here." },
      { title: "Unit time", task: "An oven bakes 4 pieces at once in 20 minutes. What is the time per piece?", lines: ["The oven works in batches of 4", "One run takes 20 minutes", "So one piece takes 20 / 4 = 5 minutes"], bad: 2, why: "One piece in the oven for 5 minutes is not baked. The 20 minutes is a batch time: the oven always needs 20 minutes, for 1 piece or 4." },
      { title: "Time you need", task: "Cut 20 WS25 (3.5 min each) and 100 WS30 (3 min each). Setup 20 min per batch. Cleaning and preparing 30 min per shift. How much time do you need?", lines: ["WS25: 3.5 · 20 + 20 = 90 min", "WS30: 3 · 100 + 20 = 320 min", "Cleaning: + 30 min", "Need = 90 + 320 + 30 = 440 min"], bad: 2, why: "Cleaning belongs to the shift, not the order: it reduces the time you HAVE (480 − 30 = 450); it is not part of what you NEED. Need = 410 min." },
      { title: "CMU as a percentage", task: "You buy 90 m of steel and use 86.5 m. The question asks for the CMU in %.", lines: ["CMU = used / bought", "= 86.5 / 90", "Answer typed in Moodle: 0.9611"], bad: 2, why: "The question asks for a percentage: type 96.11. 0.9611 is the right number in the wrong format, and Moodle marks it wrong." },
      { title: "Cutting bars", task: "Two plans both buy 90 m and use 86.5 m (CMU 96.11 %). Plan 1 leaves five 0.6 m pieces. Plan 2 leaves two 1.2 m pieces.", lines: ["Both plans have the same CMU", "So both answers are equally good", "Answer: plan 1"], bad: 1, why: "When the CMU is the same, the teacher wants the plan with the bigger leftovers (plan 2): long pieces are easier to sell or reuse." },
      { title: "Shift time outside the table", task: "The table lists preparing (5 min) and cleaning the workplace (5 min). The text says each shift also uses 12 min for general cleaning of the shop floor.", lines: ["Shift time = 5 + 5 = 10 min", "Time you HAVE = 480 − 10 = 470 min"], bad: 0, why: "Part of the shift time is written outside the table: 5 + 5 + 12 = 22 min, so you HAVE 458 min." },
      { title: "Comparative analogy", task: "100 normal chairs need 30 sheets. The kids' chair is 20 % smaller. How many sheets does the kids' order REALLY need?", lines: ["By analogy: 30 · 0.8 = 24 sheets", "Sheets come in packs of 5", "So the real need is 25 sheets"], bad: 2, why: "25 is only the analogy estimate. Calculated properly (24 × 24 squares, 32 arms per sheet) you need 16 sheets → 20 bought. Analogy is quick but can be far off." }
    ],
    t2: [
      { title: "Cycles", task: "20 units, an operation with 2 workplaces that each handle 3 units at once. How many cycles?", lines: ["P · S = 2 · 3 = 6 units per cycle", "20 / 6 = 3.33", "Cycles = 3.33"], bad: 2, why: "A cycle is a whole number; you can't run a third of a cycle. Round up: 4 cycles." },
      { title: "Sequencing rules", task: "Which rule is best? Average time in process: DD 8.4, LIFO 8.4, SOT 7.6. Average lateness: DD 3.2, LIFO 3.8, SOT 3.", lines: ["DD and LIFO have the same average time", "DD has less lateness than LIFO", "So DD is the best rule"], bad: 2, why: "Compare all the rules, not two. SOT has the lowest average time (7.6) AND the lowest lateness (3): SOT is best." },
      { title: "Capacity jump", task: "Option B is cheapest up to 7 600 units, but B can only make 5 000. A and C can make 11 000. A is cheaper than C up to 6 000.", lines: ["Without capacities: B up to 7 600, then C", "With capacities: B up to 5 000", "From 5 001 to 11 000 use C"], bad: 2, why: "After the jump at 5 001, compare the lines that still exist: A is cheaper than C up to 6 000. So A for 5 001–6 000, then C." },
      { title: "Per month instead of per year", task: "The same cost table, but now the numbers are per month instead of per year.", lines: ["Divide every fixed cost by 12", "Recalculate the crossing points", "The intervals change"], bad: 0, why: "Same numbers, only per month: the crossing points stay the same, they are just quantities per month. Don't divide by 12." },
      { title: "Parallel sequencing", task: "Parallel sequencing of 4 operations. Operation 4 is the longest (150 min).", lines: ["Start from the first operation", "Add every operation's full time", "That is the parallel lead time"], bad: 0, why: "That is gradual sequencing. For parallel, start from the LONGEST operation, then add only the first cycles before it and the last cycles after it (the tail)." },
      { title: "Gantt chart", task: "Job A needs 2.5 days and job B 2.5 days, one after the other, starting on Monday.", lines: ["A: Monday, Tuesday, half of Wednesday", "B starts on Thursday", "Both are done after 6 days"], bad: 1, why: "B can start in the free half of Wednesday, so both are done after 5 days." },
      { title: "Setup without units", task: "Gradual sequencing. Operation 1 takes 15 min in total. Operation 2 has a 20 min setup that does NOT need units from operation 1.", lines: ["The setup of op 2 can run in parallel with op 1", "So we save the whole 20 min of setup", "Gradual time = previous time − 20"], bad: 1, why: "You can only hide the setup behind the 15 min of operation 1, so you save 15 min, not 20: operation 2 starts at minute 20, when its setup ends. Draw it!" }
    ]
  };
  var EXPLAIN = {
    t1: [
      { q: "What is a process?", must: [["activit"], ["input"], ["output"]], model: "A set of activities that transforms input into output." },
      { q: "What is a standard?", must: [["document", "reference"], ["requirement", "specification", "guideline"], ["fit for", "purpose", "consistent"]], model: "A document that provides requirements, specifications, guidelines or characteristics that can be used consistently to ensure that materials, products, processes and services are fit for their purpose (ISO). We have standards to manage and to improve the operation." },
      { q: "Why do we need standards? (two words)", must: [["manag"], ["improv"]], model: "To manage (know whether the operation is OK, too fast, too slow) and to improve (see where it can be better)." },
      { q: "What is target costing?", must: [["price", "market"], ["profit", "margin"], ["limit", "maximum", "should cost"]], model: "Cost based on price: start from the goal price the market accepts, subtract the profit you want, and what is left is the limit for your costs (expenses, labour, material). The question is not how much it costs, but how much it should cost." },
      { q: "What is the CMU?", must: [["net", "useful", "use"], ["requirement", "buy", "purchase", "total"]], model: "The coefficient of material utilization: the net (useful) requirement divided by the total material requirement (what you buy). 100 % means you use everything you buy." },
      { q: "What is a Bill of Materials (BOM)?", must: [["part", "component"], ["how many", "quantit"], ["product"]], model: "A document that lists which parts are needed for each product and how many of them: the product structure and the quantity of each part." },
      { q: "What is capacity?", must: [["maximum"], ["output", "product", "unit"], ["time", "period"]], model: "The maximum number of products (outputs) that an operation (line, workshop, office) can produce in a specific time period (year, month, shift) under specific conditions. The answer must contain the word maximum." },
      { q: "What is the difference between product line and product family?", must: [["line"], ["famil"], ["component", "part", "platform", "share"]], model: "A product line groups the products the market sees (what they do for the customer). A product family groups products that share components in production (motors, metal sheets, platforms), like Lego pieces. From the lecture talk: check it against your notes." }
    ],
    t2: [
      { q: "What is the difference between planning and control?", must: [["plan"], ["control"], ["compar", "check", "done"]], model: "Planning formalises what should happen: the activities, duties and timing. Control compares what was actually done with the plan, so you can correct it." },
      { q: "Monitoring vs controlling", must: [["monitor"], ["real time", "while", "during"], ["end", "after", "result"]], model: "Monitoring tracks the process in real time while you work, so you can change things on the way. Controlling checks the results at the end. They are not the same." },
      { q: "Explain DBR", must: [["drum", "bottleneck"], ["buffer"], ["rope", "signal", "pull"]], model: "Drum-Buffer-Rope. Drum: find the bottleneck. Buffer: keep units in front of it so it never stops. Rope: decide when to pull more units into the line when the buffer gets low. Everything after the drum flows; everything before it only works to refill the buffer." },
      { q: "What are the 5 steps of TOC?", must: [["identif"], ["exploit"], ["subordinat"], ["elevat"], ["inertia"]], model: "1 Identify the system's constraint. 2 Exploit it (the bottleneck must work perfectly: a second lost there is lost for the whole system). 3 Subordinate everything else to it. 4 Elevate it. 5 Prevent inertia from becoming the constraint: find the new bottleneck." },
      { q: "What is the difference between Lean and Six Sigma?", must: [["lean"], ["sigma"], ["variab"]], model: "Lean is about effectiveness: more value, less waste, continuous improvement; it sets the standard (the average). Six Sigma is about variability: it reduces the variation around that standard so almost every output is inside what the customer wants." },
      { q: "How are pull, JIT, JIS and Kanban related?", must: [["pull"], ["just in time", "jit"], ["sequence", "jis"], ["kanban", "card", "signal"]], model: "Pull is the philosophy: give me what I need in the right time. Just in time makes only what is needed, when it is needed, in the amount needed. Just in sequence delivers the parts in the same order as the assembly. Kanban is the card (signal) that controls the flow: take one, make one." },
      { q: "What is Industry 4.0?", must: [["fourth", "4"], ["connect", "internet"], ["germany", "2012"]], model: "The fourth industrial revolution (a German concept from 2012): connectivity. Machines and products are connected: the Internet of Things applied to industry (IIoT). After steam (1784), electricity (1870) and electronics (1969)." },
      { q: "What is TPM?", must: [["total"], ["productive"], ["maintenance"]], model: "Total Productive Maintenance. Total: every aspect and everyone, from top management to the workers. Productive: maintenance without stopping production. Maintenance: keeping equipment in good condition. The goal: no product defects, no unplanned downtime, no accidents." },
      { q: "What is the customer order decoupling point? Give an example of each type.", must: [["stock", "mts"], ["assembl", "ato"], ["make", "mto"], ["engineer", "eto"]], model: "The point where pushing (to forecast) turns into pulling (to the customer's order). MTS: clothes in a shopping mall. ATO: pizza, the parts wait and you assemble. MTO: a car in Europe, built after the order. ETO: a sofa designed for your living room. Always give the example." },
      { q: "What principle is used in the ABC-XYZ method?", must: [["value", "abc"], ["regular", "dependab", "xyz", "use"], ["just in time", "jit", "stock", "warehouse"]], model: "Pareto applied to the warehouse. ABC sorts items by value (money); XYZ by how regularly (dependably) they are used. High-value, regularly used items (AX) suit just in time; low-value, erratic items are kept in stock." }
    ]
  };

  function sortw(box) {
    var D = SORTS[box.getAttribute("data-set")]; if (!D) { box.textContent = "Unknown set."; return; }
    var st = { items: shuffle(D.items.map(function (x, i) { return { t: x[0], g: x[1], i: i, at: -1 }; })), sel: null, checked: false };
    function draw() {
      var h = head("Sort it", D.title) + '<p class="mg-help">Tap a card, then tap the group it belongs to. You can also drag the cards.</p>';
      h += '<div class="om-pieces">' + st.items.filter(function (x) { return x.at < 0; }).map(function (x) { return '<button type="button" class="om-chip' + (st.sel === x.i ? " sel" : "") + '" data-it="' + x.i + '" draggable="true">' + esc(x.t) + "</button>"; }).join("") + "</div>";
      h += '<div class="om-groups">' + D.groups.map(function (g, gi) { return '<div class="om-grp' + (st.sel != null ? " ready" : "") + '" data-grp="' + gi + '"><b>' + esc(g) + "</b>" + st.items.filter(function (x) { return x.at === gi; }).map(function (x) { return '<button type="button" class="om-chip in' + (st.checked ? (x.g === gi ? " ok" : " no") : "") + '" data-back="' + x.i + '">' + esc(x.t) + "</button>"; }).join("") + "</div>"; }).join("") + "</div>";
      var left = st.items.filter(function (x) { return x.at < 0; }).length;
      h += '<div class="row" style="margin-top:8px;gap:8px"><button type="button" class="btn" data-check' + (left ? " disabled" : "") + '>Check</button><button type="button" class="ghost" data-again>Shuffle again</button></div>';
      if (st.checked) { var bad = st.items.filter(function (x) { return x.at !== x.g; }); h += bad.length ? '<div class="mg-st no"><span>' + bad.length + " in the wrong group.</span> Tap a red card to send it back and try again.</div>" : '<div class="mg-st ok"><span>All correct! 🎉</span></div>'; }
      box.innerHTML = h;
    }
    function put(i, g) { st.items.forEach(function (x) { if (x.i === i) x.at = g; }); st.sel = null; st.checked = false; draw(); }
    box.addEventListener("click", function (e) {
      var it = e.target.closest("[data-it]"); if (it) { var i = +it.getAttribute("data-it"); st.sel = st.sel === i ? null : i; draw(); return; }
      var bk = e.target.closest("[data-back]"); if (bk) { put(+bk.getAttribute("data-back"), -1); return; }
      var gr = e.target.closest("[data-grp]"); if (gr && st.sel != null) { put(st.sel, +gr.getAttribute("data-grp")); return; }
      if (e.target.closest("[data-check]")) { st.checked = true; if (st.items.every(function (x) { return x.at === x.g; })) { xp(8, "sort"); toast("Sorted ✓"); } draw(); return; }
      if (e.target.closest("[data-again]")) { st.items = shuffle(st.items.map(function (x) { x.at = -1; return x; })); st.checked = false; st.sel = null; draw(); }
    });
    box.addEventListener("dragstart", function (e) { var it = e.target.closest && e.target.closest("[data-it]"); if (it) e.dataTransfer.setData("text/plain", it.getAttribute("data-it")); });
    box.addEventListener("dragover", function (e) { if (e.target.closest && e.target.closest("[data-grp]")) e.preventDefault(); });
    box.addEventListener("drop", function (e) { var gr = e.target.closest && e.target.closest("[data-grp]"); if (gr) { e.preventDefault(); var v = e.dataTransfer.getData("text/plain"); if (v !== "") put(+v, +gr.getAttribute("data-grp")); } });
    draw();
  }

  function orderw(box) {
    var D = ORDERS[box.getAttribute("data-set")]; if (!D) { box.textContent = "Unknown set."; return; }
    var st = { pool: shuffle(D.items.map(function (t, i) { return i; })), seq: [], msg: "" };
    if (st.pool.every(function (x, i) { return x === i; })) st.pool.reverse();
    function draw() {
      var h = head("Put in order", D.title) + '<p class="mg-help">Tap the steps in the right order. Tap a placed step to take it back.</p>';
      h += '<ol class="om-ord">' + st.seq.map(function (i, k) { return '<li><button type="button" class="om-chip in" data-back="' + k + '">' + esc(D.items[i]) + "</button></li>"; }).join("") + "</ol>";
      h += '<div class="om-pieces">' + st.pool.filter(function (i) { return st.seq.indexOf(i) < 0; }).map(function (i) { return '<button type="button" class="om-chip" data-add="' + i + '">' + esc(D.items[i]) + "</button>"; }).join("") + "</div>";
      if (st.msg) h += st.msg;
      box.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var a = e.target.closest("[data-add]"), b = e.target.closest("[data-back]");
      if (a) st.seq.push(+a.getAttribute("data-add"));
      else if (b) st.seq.splice(+b.getAttribute("data-back"), 1);
      else return;
      st.msg = "";
      if (st.seq.length === D.items.length) {
        var wrong = st.seq.filter(function (x, k) { return x !== k; }).length;
        if (!wrong) { st.msg = '<div class="mg-st ok"><span>Perfect order! 🎉</span></div>'; xp(6, "order"); }
        else st.msg = '<div class="mg-st no"><span>' + wrong + " step(s) in the wrong place.</span> Take some back and try again.</div>";
      }
      draw();
    });
    draw();
  }

  function trapw(box) {
    var L = TRAPS[box.getAttribute("data-set")] || TRAPS.t1, st = { i: 0, msg: "", solved: 0 };
    function draw() {
      var T = L[st.i], h = head("Find the mistake", T.title) + '<p class="mg-help">' + (st.i + 1) + " of " + L.length + ". One line of this solution is wrong. Tap it.</p>";
      h += '<div class="dr-task">' + esc(T.task) + '</div><ol class="om-lines">' + T.lines.map(function (l, k) { return '<li><button type="button" class="om-line" data-ln="' + k + '">' + esc(l) + "</button></li>"; }).join("") + "</ol>";
      if (st.msg) h += st.msg;
      h += '<div class="row" style="margin-top:8px"><button type="button" class="btn sec" data-next>Next mistake ▸</button><span class="dr-cnt">Found: ' + st.solved + "</span></div>";
      box.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var ln = e.target.closest("[data-ln]"), T = L[st.i];
      if (ln) { if (+ln.getAttribute("data-ln") === T.bad) { st.msg = '<div class="mg-st ok"><span>Found it!</span> ' + esc(T.why) + "</div>"; st.solved++; xp(5, "trap"); } else st.msg = '<div class="mg-st no"><span>That line is fine.</span> Look again.</div>'; draw(); return; }
      if (e.target.closest("[data-next]")) { st.i = (st.i + 1) % L.length; st.msg = ""; draw(); }
    });
    draw();
  }

  function explainw(box) {
    var L = EXPLAIN[box.getAttribute("data-set")] || EXPLAIN.t1, st = { i: 0, txt: "", res: null };
    function draw() {
      var T = L[st.i], h = head("Write it", T.q) + '<p class="mg-help">' + (st.i + 1) + " of " + L.length + ". Write the answer in your own words, the way you would in the test. The check looks for the key words the teacher expects.</p>";
      h += '<textarea class="om-ta" rows="4" aria-label="Your answer">' + esc(st.txt) + '</textarea><div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn" data-chk>Check</button><button type="button" class="ghost" data-model>Show the model answer</button><button type="button" class="ghost" data-next>Next question ▸</button></div>';
      if (st.res) h += st.res;
      box.innerHTML = h;
    }
    box.addEventListener("click", function (e) {
      var T = L[st.i], ta = box.querySelector(".om-ta"); if (ta) st.txt = ta.value;
      if (e.target.closest("[data-chk]")) {
        var low = st.txt.toLowerCase(), hit = T.must.map(function (g) { return g.some(function (w) { return low.indexOf(w) >= 0; }); }), n = hit.filter(Boolean).length;
        st.res = '<div class="mg-st ' + (n === hit.length ? "ok" : "no") + '"><span>' + n + " of " + hit.length + " key ideas.</span> " + (n === hit.length ? "All the key words are there. 🎉" : "Missing: " + T.must.filter(function (g, k) { return !hit[k]; }).map(function (g) { return "“" + esc(g[0]) + "…”"; }).join(", ")) + '</div><div class="mg-st teach"><span>Model answer:</span> ' + esc(T.model) + "</div>";
        if (n === hit.length) xp(6, "explain");
      } else if (e.target.closest("[data-model]")) st.res = '<div class="mg-st teach"><span>Model answer:</span> ' + esc(T.model) + "</div>";
      else if (e.target.closest("[data-next]")) { st.i = (st.i + 1) % L.length; st.txt = ""; st.res = null; }
      else return;
      draw();
    });
    draw();
  }

  /* ======================================================================
     7. MOCK TEST (90 minutes, new numbers, the structure of the practice tests)
     ====================================================================== */
  var MOCK = {
    "1": { title: "Test 1 mock: material standards, work standards, Little's Law, theory", drills: ["bars", "time-start", "little", "little", "cmu-sheet"], lect: ["t1", "t2", "t3"], nq: 10 },
    "2": { title: "Test 2 mock: sequencing, technology, scheduling, theory", drills: ["seq-lead", "be", "rules", "gantt"], lect: ["t4", "t5", "t6", "t7"], nq: 12 }
  };
  function mock(box) {
    var M = MOCK[box.getAttribute("data-test")] || MOCK["1"], st = null, timer = null;
    function intro() { if (timer) clearInterval(timer); st = null; box.innerHTML = head("Mock test", M.title, "dr") + '<p class="mg-help">Like the real test on Moodle: 90 minutes, open book, new numbers every time, no hints until you hand it in. Have your calculator and notes ready.</p><button type="button" class="btn" data-start>▶ Start the 90 minutes</button>'; }
    function start() {
      var parts = M.drills.map(function (k) { var g = DRILLS[k].gen(); return { name: DRILLS[k].name, text: g.text, steps: g.steps }; });
      var qs = [];
      if (window.GEO && GEO.topics) GEO.topics.filter(function (t) { return M.lect.indexOf(t.id) >= 0; }).forEach(function (t) { t.Q.forEach(function (q) { if (!q.x) qs.push(q); }); });
      qs = shuffle(qs).slice(0, M.nq).map(function (q) { return { q: q.q, o: shuffle(q.o.map(function (x, i) { return [x, i === 0]; })), e: q.e }; });
      st = { parts: parts, qs: qs, end: Date.now() + 90 * 60000, done: false };
      var h = head("Mock test", M.title, "dr") + '<p class="om-timer">⏱ <b>90:00</b> left</p>';
      parts.forEach(function (p, pi) {
        h += '<div class="om-mpart"><h3>' + (pi + 1) + ". " + esc(p.name) + '</h3><div class="dr-task">' + p.text + "</div><ol>";
        p.steps.forEach(function (s, si) {
          h += '<li class="dr-step"><p class="dr-q">' + s.q + "</p>";
          if (s.choice) h += '<div class="dr-opts">' + s.choice.map(function (o, k) { return '<label class="om-rad"><input type="radio" name="m' + pi + "_" + si + '" value="' + k + '"> ' + esc(o) + "</label>"; }).join("") + "</div>";
          else h += '<input class="dr-in" data-m="' + pi + "_" + si + '" inputmode="decimal" autocomplete="off" aria-label="Your answer">' + (s.pct ? '<span class="om-unit">%</span>' : "");
          h += '<p class="dr-how" hidden></p></li>';
        });
        h += "</ol></div>";
      });
      if (qs.length) {
        h += '<div class="om-mpart"><h3>' + (parts.length + 1) + ". Theory</h3><ol>";
        qs.forEach(function (q, qi) { h += '<li class="dr-step"><p class="dr-q">' + esc(q.q) + '</p><div class="dr-opts">' + q.o.map(function (o, k) { return '<label class="om-rad"><input type="radio" name="q' + qi + '" value="' + k + '"> ' + esc(o[0]) + "</label>"; }).join("") + '</div><p class="dr-how" hidden></p></li>'; });
        h += "</ol></div>";
      }
      h += '<button type="button" class="btn" data-submit>Hand in</button><div class="om-score"></div>';
      box.innerHTML = h;
      timer = setInterval(tick, 1000); tick();
    }
    function tick() {
      if (!st || st.done) return;
      if (!document.body.contains(box)) { clearInterval(timer); return; }
      var left = Math.max(0, st.end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60, t = box.querySelector(".om-timer b");
      if (t) t.textContent = m + ":" + (s < 10 ? "0" : "") + s;
      if (!left) submit();
    }
    function submit() {
      if (!st || st.done) return; st.done = true; clearInterval(timer);
      var got = 0, all = 0;
      st.parts.forEach(function (p, pi) {
        p.steps.forEach(function (s, si) {
          all++; var ok = false, li;
          if (s.choice) { var r = box.querySelector('input[name="m' + pi + "_" + si + '"]:checked'), ri = s.rightText != null ? s.choice.indexOf(s.rightText) : s.right; ok = !!r && +r.value === ri; li = box.querySelector('input[name="m' + pi + "_" + si + '"]').closest("li"); }
          else { var inp = box.querySelector('[data-m="' + pi + "_" + si + '"]'); ok = near(nums(inp.value), s.a, tolOf(s)); li = inp.closest("li"); }
          if (ok) got++;
          li.classList.add(ok ? "ok" : "no"); var how = li.querySelector(".dr-how"); how.hidden = false; how.innerHTML = (ok ? "✓ " : "✗ ") + s.how;
        });
      });
      st.qs.forEach(function (q, qi) {
        all++; var r = box.querySelector('input[name="q' + qi + '"]:checked'), ok = !!r && q.o[+r.value][1], li = box.querySelector('input[name="q' + qi + '"]').closest("li");
        if (ok) got++;
        li.classList.add(ok ? "ok" : "no"); var how = li.querySelector(".dr-how"); how.hidden = false; how.innerHTML = (ok ? "✓ " : "✗ Right answer: <b>" + esc(q.o.filter(function (x) { return x[1]; })[0][0]) + "</b>. ") + esc(q.e || "");
      });
      box.querySelectorAll("input").forEach(function (i) { i.disabled = true; });
      var pc = Math.round(got / all * 100), sb = box.querySelector("[data-submit]"); if (sb) sb.remove();
      box.querySelector(".om-score").innerHTML = '<div class="mg-st ' + (pc >= 50 ? "ok" : "no") + '"><span>' + got + " of " + all + " right (" + pc + " %).</span> Read every ✗ explanation, then try a new mock: the numbers change each time.</div><button type=\"button\" class=\"btn sec\" data-again style=\"margin-top:8px\">🎲 New mock test</button>";
      xp(Math.round(got * 1.5), "mock"); bump("mock" + (box.getAttribute("data-test") || "1"));
    }
    box.addEventListener("click", function (e) {
      if (e.target.closest("[data-start]")) start();
      else if (e.target.closest("[data-submit]")) { if (window.confirm("Hand in now? You can't change the answers after this.")) submit(); }
      else if (e.target.closest("[data-again]")) intro();
    });
    intro();
  }

  /* ---------- mount ---------- */
  var KINDS = { drill: drill, bars: bars, seqline: seqline, breakeven: breakeven, rules: rules, sort: sortw, order: orderw, trap: trapw, explain: explainw, mock: mock };
  function mountAll(root) {
    (root || document).querySelectorAll(".mg[data-g]:not([data-on])").forEach(function (b) {
      var f = KINDS[b.getAttribute("data-g")]; b.setAttribute("data-on", "1");
      if (!f) { b.textContent = "Unknown widget: " + b.getAttribute("data-g"); return; }
      try { f(b); } catch (err) { b.textContent = "This exercise could not be drawn."; if (window.console) console.error(err); }
    });
  }
  function start() {
    mountAll(document);
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { mountAll(document); return; } }).observe(document.body, { childList: true, subtree: true });
  }
  window.OpMan = { mount: mountAll, drills: DRILLS, leadTimes: leadTimes, bestCut: bestCut, intervals: intervals, cross: cross, czHolidays: czHolidays, SORTS: SORTS, ORDERS: ORDERS, TRAPS: TRAPS, EXPLAIN: EXPLAIN };
  if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start(); }
})();
