/* Micro Hub interactive graphs and number drills.
   Put a placeholder anywhere in a lesson (steps.md raw HTML line) or a study-path bite:
     <div class="mg" data-g="pc-firm"></div>               perfectly competitive firm: P, MC, AC, AVC, profit/loss, shut-down, break-even
     <div class="mg" data-g="market" data-mode="surplus"></div>   market: consumer/producer surplus  (modes: surplus, control, shift)
     <div class="mg" data-g="monopoly"></div>              imperfect competition: MR = MC, price from demand, Lerner index, deadweight loss
     <div class="mg" data-g="tr-el"></div>                 total revenue and elasticity on a straight demand line
     <div class="mg" data-g="ps-table"></div>              producer surplus from the lecture table (P − MC)
     <div class="mg" data-g="drill" data-kind="pc-opt,profit"></div>   step-by-step calculations with new numbers every time
   Widgets are drawn when they appear in the page (MutationObserver), so the lesson engine needs no changes.
   Colours come from the CSS variables in index.html, so light and dark mode both work.
   Saved per browser: localStorage "microHub.drill" = { drillKind: rounds solved }. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var DKEY = "microHub.drill";
  var DONE = {};
  try { var raw = JSON.parse(localStorage.getItem(DKEY) || "null"); if (raw && typeof raw === "object") DONE = raw; } catch (e) {}
  function saveDone() { try { localStorage.setItem(DKEY, JSON.stringify(DONE)); } catch (e) {} }

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function xp(n, why) { if (window.GEO && GEO.xp) GEO.xp(n, why); }
  function toast(m, big) { if (window.GEO && GEO.toast) GEO.toast(m, big); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function fmt(x, d) {
    if (!isFinite(x)) return "–";
    var v = d == null ? r2(x) : Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    var s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: d == null ? 2 : d }).replace(/,/g, " ");
    return (v < 0 ? "−" : "") + s;
  }
  function rnd(a, b, step) { step = step || 1; var n = Math.floor((b - a) / step) + 1; return a + step * Math.floor(Math.random() * n); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- tiny SVG chart helper ---------- */
  function Chart(svg, o) {
    var W = o.w || 360, H = o.h || 250, L = o.l || 44, R = o.r || 14, T = o.t || 12, B = o.b || 30, OY = o.oy || 0;
    if (!o.keepBox) { svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("class", "mg-svg"); }
    var c = {
      sx: function (x) { return L + x / o.xmax * (W - L - R); },
      sy: function (y) { return OY + H - B - y / o.ymax * (H - T - B); },
      clear: function () { while (svg.firstChild) svg.removeChild(svg.firstChild); },
      el: function (tag, at, txt) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; },
      axes: function (xl, yl) {
        c.el("line", { x1: L, y1: c.sy(0), x2: W - R + 4, y2: c.sy(0), "class": "mg-ax" });
        c.el("line", { x1: L, y1: c.sy(0), x2: L, y2: OY + T - 4, "class": "mg-ax" });
        c.el("text", { x: W - R, y: c.sy(0) + 24, "text-anchor": "end", "class": "mg-axl" }, xl);
        c.el("text", { x: L + 4, y: OY + T + 2, "text-anchor": "start", "class": "mg-axl" }, yl);
      },
      curve: function (f, x0, x1, cls, n) {
        n = n || 90; var d = "", pen = false;
        for (var i = 0; i <= n; i++) {
          var x = x0 + (x1 - x0) * i / n, y = f(x);
          if (!isFinite(y) || y > o.ymax * 1.02 || y < -0.01) { pen = false; continue; }
          d += (pen ? "L" : "M") + c.sx(x).toFixed(1) + "," + c.sy(y).toFixed(1); pen = true;
        }
        return d ? c.el("path", { d: d, "class": "mg-ln " + cls }) : null;
      },
      line: function (x1, y1, x2, y2, cls) { return c.el("line", { x1: c.sx(x1), y1: c.sy(y1), x2: c.sx(x2), y2: c.sy(y2), "class": cls }); },
      poly: function (pts, cls) { return c.el("polygon", { points: pts.map(function (p) { return c.sx(p[0]).toFixed(1) + "," + c.sy(p[1]).toFixed(1); }).join(" "), "class": cls }); },
      dot: function (x, y, cls) { return c.el("circle", { cx: c.sx(x), cy: c.sy(y), r: 4.5, "class": cls || "mg-dot" }); },
      label: function (x, y, t, cls, anchor) { return c.el("text", { x: c.sx(x), y: c.sy(y), "class": "mg-lb " + (cls || ""), "text-anchor": anchor || "start" }, t); },
      guide: function (x, y, xt, yt) {
        c.el("line", { x1: c.sx(x), y1: c.sy(y), x2: c.sx(x), y2: c.sy(0), "class": "mg-dash" });
        c.el("line", { x1: c.sx(x), y1: c.sy(y), x2: c.sx(0), y2: c.sy(y), "class": "mg-dash" });
        if (xt) c.el("text", { x: c.sx(x), y: c.sy(0) + 13, "text-anchor": "middle", "class": "mg-tick" }, xt);
        if (yt) c.el("text", { x: c.sx(0) - 4, y: c.sy(y) + 4, "text-anchor": "end", "class": "mg-tick" }, yt);
      }
    };
    return c;
  }
  function slider(id, label, min, max, step, val) {
    return '<label class="mg-sl"><span>' + esc(label) + ' <span class="mg-v" data-v="' + id + '"></span></span><input type="range" data-k="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
  }
  function seg(id, opts, on) {
    return '<div class="seg mg-seg" data-seg="' + id + '">' + opts.map(function (o) { return '<button type="button" data-val="' + o[0] + '" aria-pressed="' + (o[0] === on) + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>";
  }
  function frame(box, title, controls, help) {
    box.innerHTML = '<div class="mg-head"><span class="mg-tag">Interactive graph</span><span class="mg-title">' + esc(title) + "</span></div>" +
      (help ? '<p class="mg-help">' + help + "</p>" : "") +
      '<div class="mg-ctl">' + controls + '</div><div class="mg-body"><svg></svg><div class="mg-out" aria-live="polite"></div></div>';
    return { svg: box.querySelector("svg"), out: box.querySelector(".mg-out") };
  }
  function bind(box, state, draw) {
    box.addEventListener("input", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      state[k] = +e.target.value; draw();
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-seg] button"); if (!b) return;
      var s = b.parentNode, k = s.getAttribute("data-seg");
      s.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var v = b.getAttribute("data-val"); state[k] = isNaN(+v) ? v : +v; draw();
    });
    box.addEventListener("pointerdown", function () { xp(2, "graph"); }, { once: true });
  }
  function setV(box, k, txt) { var e = box.querySelector('[data-v="' + k + '"]'); if (e) e.textContent = txt; }
  function status(cls, html) { return '<div class="mg-st ' + cls + '">' + html + "</div>"; }
  function row(label, val, cls, sw) { return '<div class="mg-row">' + (sw ? '<i class="mg-sw ' + sw + '"></i>' : "") + "<span>" + label + '</span><span class="mg-num ' + (cls || "") + '">' + val + "</span></div>"; }

  /* ================= 1. Perfectly competitive firm ================= */
  /* VC = 30Q − 3Q² + 0.15Q³  →  AVC = 30 − 3Q + 0.15Q² (min 15 at Q = 10),  MC = 30 − 6Q + 0.45Q² */
  function pcFirm(box) {
    var S = { P: 34, FC: 135, sup: 0 };
    var ui = frame(box, "Perfectly competitive firm: where should it produce?",
      slider("P", "Market price P =", 6, 56, 1, S.P) + slider("FC", "Fixed cost FC =", 0, 300, 5, S.FC) + seg("sup", [[0, "Profit view"], [1, "Supply curve view"]], 0),
      "The firm cannot change the price (it is a <i>price-taker</i>), so its demand is a flat line <span class='mg-k k-p'>d = AR = MR = P</span>. Move the price and watch the firm pick <span class='mg-k'>Q where P = MC</span>.");
    var C = Chart(ui.svg, { xmax: 20, ymax: 60 });
    function AVC(q) { return 30 - 3 * q + 0.15 * q * q; }
    function MC(q) { return 30 - 6 * q + 0.45 * q * q; }
    function VC(q) { return q * AVC(q); }
    function AC(q) { return AVC(q) + S.FC / q; }
    function minAC() { var best = 1e9, bq = 0; for (var q = 1; q <= 20; q += 0.01) { var a = AC(q); if (a < best) { best = a; bq = q; } } return { q: bq, v: best }; }
    function draw() {
      setV(box, "P", S.P + " CZK"); setV(box, "FC", S.FC + " CZK");
      C.clear(); C.axes("Q (pieces)", "CZK/Q");
      var m = minAC(), P = S.P, shut = P < 15, q = shut ? 0 : Math.min(20, (6 + Math.sqrt(36 - 1.8 * (30 - P))) / 0.9);
      var ac = q > 0 ? AC(q) : 0, pi = P * q - (S.FC + VC(q)), sup = S.sup === 1;
      if (!sup && q > 0) C.poly([[0, P], [q, P], [q, ac], [0, ac]], pi >= 0 ? "mg-a-ok" : "mg-a-no");
      C.curve(AC, 0.3, 20, "k2");
      C.curve(AVC, 0, 20, "k3");
      C.curve(MC, 0, 20, "k1");
      if (sup) {
        C.curve(MC, 10, 20, "k-sup");
        C.line(0, 0, 0, 15, "mg-ln k-sup");
        C.dot(10, 15, "mg-dot d-no"); C.label(10.4, 11.5, "shut-down point", "t-no");
        C.dot(m.q, m.v, "mg-dot d-ok"); C.label(m.q + 0.4, m.v - 3.5, "break-even point", "t-ok");
      }
      C.line(0, P, 20, P, "mg-ln k-p thin");
      C.label(0.4, P + 1.6, "d = AR = MR = P", "t-p");
      C.label(17.3, Math.min(MC(17.3), 57), "MC", "t1", "end"); C.label(19.6, Math.min(AC(19.6), 56) + 2.4, "AC", "t2", "end"); C.label(19.6, AVC(19.6) - 3.2, "AVC", "t3", "end");
      if (q > 0) { C.guide(q, P, "Q* = " + r1(q), ""); C.dot(q, P); }
      var tr = P * q, tc = S.FC + VC(q), html = "";
      html += row("Q* (where P = MC)", shut ? "0 (shut down)" : fmt(q, 1));
      html += row("TR = P · Q", fmt(tr, 0));
      html += row("TC = FC + VC", fmt(tc, 0));
      html += row("Economic profit = TR − TC", fmt(pi, 0), pi >= 0 ? "ok" : "no");
      html += row("min AVC (shut-down price)", "15", "sm");
      html += row("min AC (break-even price)", fmt(m.v, 1), "sm");
      if (Math.abs(P - 15) < 0.5) html += status("no", "<span>⚠ Shut-down point.</span> P = min AVC: TR only covers VC, the loss equals FC whether it produces or not.");
      else if (shut) html += status("no", "<span>Shut down (Q = 0).</span> P &lt; AVC: producing would add more cost than revenue. Loss = FC = " + fmt(S.FC, 0) + ".");
      else if (Math.abs(P - m.v) < 0.5) html += status("ok", "<span>Break-even point.</span> P = min AC, TR = TC: economic profit 0 = <i>normal profit</i>. This is where firms end up in the long run.");
      else if (pi >= 0) html += status("ok", "<span>Economic profit.</span> P &gt; AC. In the long run new firms enter and the price falls towards min AC.");
      else html += status("teach", "<span>Loss, but keep producing.</span> AVC &lt; P &lt; AC: revenue covers all variable cost and part of FC, so the loss (" + fmt(-pi, 0) + ") is smaller than FC (" + fmt(S.FC, 0) + ").");
      if (sup) html += '<p class="mg-note">The firm\'s supply curve is the <span class="mg-k k-sup">MC curve above min AVC</span>. Below the shut-down price it supplies 0.</p>';
      ui.out.innerHTML = html;
    }
    bind(box, S, draw); draw();
  }

  /* ================= 2. Market: surplus, price controls, shifts ================= */
  /* Demand P = a − bQ, supply P = cS + Q. Every demand passes through the base equilibrium Q = 45, P = 55. */
  function market(box) {
    var mode = box.getAttribute("data-mode") || "surplus";
    var S = { kind: "ceiling", pc: 40, dD: 0, dS: 0, el: "mid" };
    var ctl = "", title = "", help = "";
    if (mode === "surplus") { title = "Consumer surplus and producer surplus"; help = "Demand <span class='mg-k k1'>P = 100 − Q</span>, supply <span class='mg-k k2'>P = 10 + Q</span>. Shift the curves and watch the two triangles."; ctl = slider("dD", "Shift demand ΔD =", -30, 30, 5, 0) + slider("dS", "Shift supply ΔS =", -30, 30, 5, 0); }
    else if (mode === "control") { title = "Price ceiling and price floor"; help = "The state fixes the price. A <i>ceiling</i> only matters below the equilibrium price (55), a <i>floor</i> only above it."; ctl = seg("kind", [["ceiling", "Price ceiling (max price)"], ["floor", "Price floor (min price)"]], "ceiling") + slider("pc", "Fixed price =", 15, 95, 1, 40); }
    else { title = "Shifts of demand and supply"; help = "Shift one or both curves. Compare a steep (inelastic) and a flat (elastic) demand."; ctl = slider("dD", "Shift demand ΔD =", -30, 30, 5, 15) + slider("dS", "Shift supply ΔS =", -30, 30, 5, 0) + seg("el", [["flat", "Elastic D (flat)"], ["mid", "Normal D"], ["steep", "Inelastic D (steep)"]], "mid"); S.dD = 15; }
    var ui = frame(box, title, ctl, help);
    var C = Chart(ui.svg, { xmax: 100, ymax: 100 });
    function draw() {
      setV(box, "dD", (S.dD > 0 ? "+" : "") + S.dD); setV(box, "dS", (S.dS > 0 ? "+" : "") + S.dS); setV(box, "pc", S.pc + " CZK");
      var b = S.el === "flat" ? 0.5 : S.el === "steep" ? 2 : 1, a0 = 55 + 45 * b;
      var a = a0 + b * S.dD, cS = 10 - S.dS;
      var D = function (q) { return a - b * q; }, Sp = function (q) { return cS + q; };
      var Qe = (a - cS) / (b + 1), Pe = D(Qe), html = "";
      C.clear(); C.axes("Q", "P (CZK)");
      if (mode === "surplus") {
        C.poly([[0, Math.min(a, 100)], [Qe, Pe], [0, Pe]], "mg-a-cs");
        C.poly([[0, Math.max(cS, 0)], [Qe, Pe], [0, Pe]], "mg-a-ps");
        var cs = 0.5 * (a - Pe) * Qe, ps = 0.5 * (Pe - cS) * Qe;
        html += row("Equilibrium (Qd = Qs)", "Q* = " + fmt(Qe, 1) + ", P* = " + fmt(Pe, 1));
        html += row("Consumer surplus ½·(Pmax − P*)·Q*", fmt(cs, 0), "", "cs");
        html += row("Producer surplus ½·(P* − Pmin)·Q*", fmt(ps, 0), "", "ps");
        html += row("Total surplus (largest at equilibrium)", fmt(cs + ps, 0), "ok");
        html += '<p class="mg-note">CS = what buyers would pay (TU) minus what they really pay. PS = price minus MC on every unit sold.</p>';
      } else if (mode === "control") {
        var P = S.pc, Qd = Math.max(0, (a - P) / b), Qs = Math.max(0, P - cS), binding = S.kind === "ceiling" ? P < Pe : P > Pe;
        if (binding) {
          var Qt = Math.min(Qd, Qs);
          if (S.kind === "ceiling") { C.poly([[0, a], [Qt, D(Qt)], [Qt, P], [0, P]], "mg-a-cs"); C.poly([[0, cS], [Qt, P], [0, P]], "mg-a-ps"); }
          else { C.poly([[0, a], [Qt, P], [0, P]], "mg-a-cs"); C.poly([[0, P], [Qt, P], [Qt, Sp(Qt)], [0, cS]], "mg-a-ps"); }
          C.poly([[Qt, D(Qt)], [Qe, Pe], [Qt, Sp(Qt)]], "mg-a-dwl");
          C.line(Math.min(Qs, Qd), P, Math.max(Qs, Qd), P, "mg-gap");
          C.label((Qs + Qd) / 2, P + (S.kind === "ceiling" ? -5 : 3), S.kind === "ceiling" ? "shortage" : "surplus", "t-no", "middle");
        }
        C.line(0, P, 100, P, "mg-ln k-p thin"); C.label(99, P + 2, S.kind === "ceiling" ? "ceiling" : "floor", "t-p", "end");
        html += row("Equilibrium", "Q* = 45, P* = 55");
        html += row("At P = " + P + ": Qd / Qs", fmt(Qd, 0) + " / " + fmt(Qs, 0));
        if (!binding) html += status("", "<span>Not binding.</span> A " + S.kind + " " + (S.kind === "ceiling" ? "above" : "below") + " P* changes nothing: the market still settles at 55.");
        else {
          html += row("Deadweight loss (lost surplus)", fmt(0.5 * Math.abs(D(Math.min(Qd, Qs)) - Sp(Math.min(Qd, Qs))) * (Qe - Math.min(Qd, Qs)), 0), "no", "dwl");
          html += S.kind === "ceiling" ? status("no", "<span>Shortage = Qd − Qs = " + fmt(Qd - Qs, 0) + ".</span> Only " + fmt(Qs, 0) + " units are sold. Queues, black markets. Example: regulated rents.")
            : status("no", "<span>Surplus = Qs − Qd = " + fmt(Qs - Qd, 0) + ".</span> Only " + fmt(Qd, 0) + " units are bought. Overproduction. Example: subsidised farm prices.");
        }
      } else {
        C.curve(function (q) { return a0 - b * q; }, 0, 100, "k1 ghost"); C.curve(function (q) { return 10 + q; }, 0, 100, "k2 ghost");
        C.dot(45, 55, "mg-dot ghost"); C.label(47, 51, "E₀", "t-mute");
        var dP = Pe - 55, dQ = Qe - 45;
        html += row("Old equilibrium E₀", "Q = 45, P = 55");
        html += row("New equilibrium E₁", "Q = " + fmt(Qe, 1) + ", P = " + fmt(Pe, 1));
        html += row("Change", "ΔP " + (dP >= 0 ? "+" : "") + fmt(dP, 1) + " · ΔQ " + (dQ >= 0 ? "+" : "") + fmt(dQ, 1));
        var rule = "";
        if (S.dD > 0 && S.dS > 0) rule = S.dS > S.dD ? "Both grow, supply more (ΔS &gt; ΔD) → <span>price falls</span>." : S.dD > S.dS ? "Both grow, demand more (ΔD &gt; ΔS) → <span>price rises</span>." : "Both grow equally → price stays, quantity rises.";
        else if (S.dD < 0 && S.dS < 0) rule = "Both fall → quantity falls; the price depends on which fall is bigger.";
        else if (S.dD !== 0 && S.dS === 0) rule = S.dD > 0 ? "Demand ↑ → P ↑ and Q ↑." : "Demand ↓ → P ↓ and Q ↓.";
        else if (S.dS !== 0 && S.dD === 0) rule = S.dS > 0 ? "Supply ↑ → P ↓ and Q ↑." : "Supply ↓ → P ↑ and Q ↓.";
        else if (S.dD || S.dS) rule = "The curves move in opposite directions: one of P or Q is clear, the other depends on which shift is bigger.";
        if (S.dS !== 0 && S.dD === 0 && S.el !== "mid") rule += S.el === "steep" ? " With <span>inelastic</span> demand a supply change mostly moves the <i>price</i>; Q hardly changes." : " With <span>elastic</span> demand a supply change mostly moves the <i>quantity</i>; P hardly changes.";
        if (rule) html += status("", rule);
      }
      C.curve(D, 0, 100, "k1"); C.curve(Sp, 0, 100, "k2");
      if (Qe > 0 && Qe < 100) { C.guide(Qe, Pe, fmt(Qe, 0), fmt(Pe, 0)); C.dot(Qe, Pe); }
      var lq = Math.min(94, (a - 8) / b); C.label(lq, D(lq) + 3, "D", "t1");
      var sq = Math.min(88, 92 - cS); C.label(sq, Sp(sq) + 2, "S", "t2");
      ui.out.innerHTML = html;
    }
    bind(box, S, draw); draw();
  }

  /* ================= 3. Imperfect competition (monopoly) ================= */
  /* D: P = 100 − Q, MR = 100 − 2Q, MC = m + 0.5Q, AVC = m + 0.25Q, AC = AVC + FC/Q */
  function monopoly(box) {
    var S = { m: 20, FC: 400, pc: 1 };
    var ui = frame(box, "Imperfect competition: MR = MC, then the price from demand",
      slider("m", "Cost level: MC starts at", 0, 60, 2, S.m) + slider("FC", "Fixed cost FC =", 0, 1600, 50, S.FC) + seg("pc", [[1, "Compare with perfect competition"], [0, "Hide comparison"]], 1),
      "The firm faces a <i>downward-sloping</i> demand curve <span class='mg-k k1'>d = AR: P = 100 − Q</span>. To sell more it must cut the price, so <span class='mg-k k4'>MR = 100 − 2Q</span> lies below demand.");
    var C = Chart(ui.svg, { xmax: 100, ymax: 100 });
    function draw() {
      setV(box, "m", S.m + " CZK"); setV(box, "FC", S.FC + " CZK");
      var m = S.m, MC = function (q) { return m + 0.5 * q; }, AC = function (q) { return m + 0.25 * q + S.FC / q; };
      var Qm = (100 - m) / 2.5, Pm = 100 - Qm, mc = MC(Qm), ac = AC(Qm), pi = (Pm - ac) * Qm;
      var Qc = (100 - m) / 1.5, Pc = 100 - Qc, dwl = 0.5 * (Pm - mc) * (Qc - Qm), L = (Pm - mc) / Pm;
      C.clear(); C.axes("Q (pieces)", "CZK/Q");
      C.poly([[0, 100], [Qm, Pm], [0, Pm]], "mg-a-cs");
      C.poly([[0, Pm], [Qm, Pm], [Qm, Math.min(ac, 100)], [0, Math.min(ac, 100)]], pi >= 0 ? "mg-a-ok" : "mg-a-no");
      if (S.pc === 1) C.poly([[Qm, Pm], [Qc, Pc], [Qm, mc]], "mg-a-dwl");
      C.curve(function (q) { return 100 - q; }, 0, 100, "k1");
      C.curve(function (q) { return 100 - 2 * q; }, 0, 50, "k4");
      C.curve(MC, 0, 100, "k5");
      C.curve(AC, 1, 100, "k2");
      C.label(97, 8, "d = AR", "t1", "end"); C.label(41, 4, "MR", "t4");
      var mq = Math.min(96, (95 - m) / 0.5); C.label(mq, MC(mq) + 2, "MC", "t5", "end"); C.label(99, Math.min(AC(99), 96) + 3, "AC", "t2", "end");
      C.dot(Qm, mc, "mg-dot d-4");
      C.guide(Qm, Pm, "Q* = " + r1(Qm), String(r1(Pm))); C.dot(Qm, Pm);
      if (S.pc === 1) { C.dot(Qc, Pc, "mg-dot d-ok"); C.label(Qc + 2, Pc + 4, "PC: P = MC", "t-ok"); }
      var html = "";
      html += row("1 · Q* where MR = MC", fmt(Qm, 1));
      html += row("2 · P* from demand (go up to d)", fmt(Pm, 1));
      html += row("MC at Q*", fmt(mc, 1));
      html += row("Profit = (P − AC) · Q", fmt(pi, 0), pi >= 0 ? "ok" : "no");
      html += row("Lerner index L = (P − MC) / P", fmt(L, 2));
      if (S.pc === 1) {
        html += row("Perfect competition (P = MC) would give", "Q = " + fmt(Qc, 1) + ", P = " + fmt(Pc, 1), "sm");
        html += row("Deadweight loss", fmt(dwl, 0), "no", "dwl");
        html += status("teach", "<span>P &gt; MC</span> → less is produced, and it is sold at a higher price than under perfect competition. The lost triangle is the <i>deadweight loss</i>: allocative inefficiency.");
      }
      ui.out.innerHTML = html;
    }
    bind(box, S, draw); draw();
  }

  /* ================= 4. Total revenue and elasticity ================= */
  function trEl(box) {
    var S = { q: 30 };
    var ui = frame(box, "Total revenue and price elasticity",
      slider("q", "Quantity Q =", 2, 98, 1, S.q),
      "Demand <span class='mg-k k1'>P = 100 − Q</span>. Top: demand and MR. Bottom: TR = P · Q. Slide along the demand line.");
    var svg = ui.svg; svg.setAttribute("viewBox", "0 0 360 380"); svg.setAttribute("class", "mg-svg tall");
    var A = Chart(svg, { xmax: 100, ymax: 100, h: 190, b: 30, keepBox: 1 }), B = Chart(svg, { xmax: 100, ymax: 2700, h: 190, oy: 190, b: 30, keepBox: 1 });
    function draw() {
      var q = S.q, P = 100 - q, E = P / q, TR = P * q, MR = 100 - 2 * q;
      setV(box, "q", q);
      A.clear();
      A.poly([[0, 100], [50, 50], [50, 0], [0, 0]], "mg-a-el"); A.poly([[50, 50], [100, 0], [50, 0]], "mg-a-in");
      A.axes("Q", "P");
      A.curve(function (x) { return 100 - x; }, 0, 100, "k1"); A.curve(function (x) { return 100 - 2 * x; }, 0, 50, "k4");
      A.label(6, 70, "elastic |E| > 1", "t-mute"); A.label(56, 30, "inelastic |E| < 1", "t-mute");
      A.label(41, 6, "MR", "t4"); A.label(94, 12, "d", "t1");
      A.guide(q, P, "", fmt(P, 0)); A.dot(q, P);
      B.axes("Q", "TR");
      B.curve(function (x) { return x * (100 - x); }, 0, 100, "k6");
      B.line(50, 0, 50, 2500, "mg-dash"); B.label(51, 2560, "TR max at |E| = 1", "t-mute");
      B.guide(q, TR, String(q), ""); B.dot(q, TR);
      var reg = Math.abs(E - 1) < 0.04 ? "unit" : E > 1 ? "el" : "in", html = "";
      html += row("P = 100 − Q", fmt(P, 0));
      html += row("TR = P · Q", fmt(TR, 0));
      html += row("MR = 100 − 2Q", fmt(MR, 0));
      html += row("Point elasticity |E| = P / (b · Q)", fmt(E, 2));
      if (reg === "unit") html += status("ok", "<span>Unit elastic: |E| = 1, MR = 0, TR is at its maximum.</span>");
      else if (reg === "el") html += status("", "<span>Elastic (|E| &gt; 1): MR &gt; 0.</span> A lower price raises TR. An imperfectly competitive firm always produces here.");
      else html += status("no", "<span>Inelastic (|E| &lt; 1): MR &lt; 0.</span> A lower price lowers TR. A profit-maximising firm never chooses this part (MR = MC needs MR &gt; 0).");
      ui.out.innerHTML = html;
    }
    bind(box, S, draw); draw();
  }

  /* ================= 5. Producer surplus table (lecture example) ================= */
  function psTable(box) {
    var VCs = [0, 5, 12, 20, 29, 39, 50, 62], S = { P: 10 };
    var ui = frame(box, "Producer surplus = Σ (P − MC)", slider("P", "Market price P =", 4, 13, 1, S.P),
      "The lecture table. The firm produces every piece whose MC is not above the price (P = MC). Each piece earns P − MC.");
    var C = Chart(ui.svg, { xmax: 8, ymax: 14 });
    function draw() {
      var P = S.P, i, Q = 0; setV(box, "P", P + " CZK");
      for (i = 1; i < VCs.length; i++) if (VCs[i] - VCs[i - 1] <= P) Q = i;
      C.clear(); C.axes("Q", "CZK");
      for (i = 1; i < VCs.length; i++) {
        var mc = VCs[i] - VCs[i - 1];
        C.el("rect", { x: C.sx(i - 1) + 2, y: C.sy(mc), width: C.sx(1) - C.sx(0) - 4, height: C.sy(0) - C.sy(mc), "class": "mg-bar" + (i <= Q ? " on" : "") });
        if (i <= Q && P > mc) C.poly([[i - 1, mc], [i, mc], [i, P], [i - 1, P]], "mg-a-ps");
        C.el("text", { x: C.sx(i - 0.5), y: C.sy(0) + 13, "text-anchor": "middle", "class": "mg-tick" }, String(i));
      }
      C.line(0, P, 8, P, "mg-ln k-p thin"); C.label(7.9, P + 0.4, "P = " + P, "t-p", "end"); C.label(7.4, 12.4, "MC", "t1", "end");
      var rows = "", sum = 0;
      for (i = 1; i < VCs.length; i++) {
        var m2 = VCs[i] - VCs[i - 1], d = P - m2, on = i <= Q; if (on) sum += d;
        rows += "<tr" + (on ? ' class="on"' : "") + "><td>" + i + "</td><td>" + VCs[i] + "</td><td>" + m2 + "</td><td>" + (on ? d : "–") + "</td></tr>";
      }
      var html = '<div class="tw"><table class="mg-t"><thead><tr><th>Q</th><th>VC</th><th>MC</th><th>P − MC</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
      html += row("Q<sub>E</sub> (last piece with MC ≤ P)", String(Q));
      html += row("PS = Σ (P − MC)", String(sum), "ok", "ps");
      html += row("Check: TR − VC = " + P + " · " + Q + " − " + VCs[Q], String(P * Q - VCs[Q]), "ok");
      ui.out.innerHTML = html;
    }
    bind(box, S, draw); draw();
  }

  /* ================= 6. Drills: new numbers every time, one step at a time ================= */
  var DRILLS = {
    "pc-opt": { name: "Profit-maximising output (perfect competition)", gen: function () {
      var a = rnd(10, 30, 2), P = a + rnd(10, 40, 2), FC = rnd(2, 12) * 100, Q = (P - a) / 2, TR = P * Q, TC = FC + a * Q + Q * Q, pi = TR - TC, avc = a + Q;
      return { text: "A perfectly competitive firm sells at <span class='mg-k'>P = " + P + "</span>. Its costs are <span class='mg-k'>TC = " + FC + " + " + a + "Q + Q²</span>, so <span class='mg-k'>MC = " + a + " + 2Q</span>. (Like Seminar 6, golden rule homework 1.)",
        steps: [
          { q: "Optimal output Q* (use the golden rule)", a: Q, how: "In perfect competition MR = P. Golden rule MR = MC → P = MC → " + P + " = " + a + " + 2Q → 2Q = " + (P - a) + " → <b>Q* = " + Q + "</b>." },
          { q: "Total revenue TR at Q*", a: TR, how: "TR = P · Q = " + P + " · " + Q + " = <b>" + TR + "</b>." },
          { q: "Total cost TC at Q*", a: TC, how: "TC = " + FC + " + " + a + "·" + Q + " + " + Q + "² = " + FC + " + " + a * Q + " + " + Q * Q + " = <b>" + TC + "</b>." },
          { q: "Economic profit (type a minus sign for a loss)", a: pi, how: "π = TR − TC = " + TR + " − " + TC + " = <b>" + pi + "</b>" + (pi < 0 ? " (a loss)." : ".") },
          { q: "AVC at Q*", a: avc, how: "VC = " + a + "Q + Q² (everything except FC), so AVC = VC / Q = " + a + " + Q = " + a + " + " + Q + " = <b>" + avc + "</b>." },
          { q: "Produce or shut down in the short run?", choice: ["Keep producing", "Shut down"], right: P > avc ? 0 : 1, how: P > avc ? "P = " + P + " is above AVC = " + avc + ", so revenue covers all variable cost and part of FC. " + (pi < 0 ? "The loss (" + (-pi) + ") is smaller than FC (" + FC + "), so <b>keep producing</b>." : "It even makes a profit, so <b>keep producing</b>.") : "P is not above AVC, so <b>shut down</b>: the loss is then only FC." }
        ] };
    } },
    "profit": { name: "Accounting vs economic profit", gen: function () {
      var TR = rnd(8, 20) * 100, ex = rnd(3, Math.floor(TR / 100) - 3) * 100, sal = rnd(1, 4) * 50, rent = rnd(1, 4) * 50, AP = TR - ex, imp = sal + rent, EP = AP - imp;
      return { text: "An entrepreneur has total revenue <span class='mg-k'>" + TR + "</span> (thousand CZK). Explicit costs (materials, rent, wages) are <span class='mg-k'>" + ex + "</span>. In another job they could earn <span class='mg-k'>" + sal + "</span>, and they could rent out their own equipment for <span class='mg-k'>" + rent + "</span>. (Like sample test question 6.)",
        steps: [
          { q: "Accounting profit", a: AP, how: "AP = TR − explicit costs = " + TR + " − " + ex + " = <b>" + AP + "</b>." },
          { q: "Implicit (opportunity) costs", a: imp, how: "Implicit costs = what the owner gives up = salary " + sal + " + rent " + rent + " = <b>" + imp + "</b>." },
          { q: "Economic profit (minus for a loss)", a: EP, how: "Eπ = AP − implicit costs = " + AP + " − " + imp + " = <b>" + EP + "</b>." },
          { q: "What does the firm make?", choice: ["Economic profit", "Only normal profit", "Economic loss"], right: EP > 0 ? 0 : EP === 0 ? 1 : 2, how: EP > 0 ? "Eπ &gt; 0: more than the next-best alternative." : EP === 0 ? "Eπ = 0: exactly the normal profit." : "Eπ &lt; 0: the owner would be better off in the alternative." }
        ] };
    } },
    "costs": { name: "Cost table (FC, VC, AVC, AFC, MC)", gen: function () {
      var FC = rnd(2, 8) * 1000, n = 6, Qs = [0], TCs = [FC], q = 0, step = rnd(8, 14) * 100, i;
      for (i = 1; i <= n; i++) { q += rnd(10, 40, 5); Qs.push(q); TCs.push(FC + step * i); }
      var k = rnd(2, n), VC = TCs[k] - FC, avc = VC / Qs[k], afc = FC / Qs[k], mc = (TCs[k] - TCs[k - 1]) / (Qs[k] - Qs[k - 1]);
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th>L</th>" + Qs.map(function (x, j) { return "<td>" + j + "</td>"; }).join("") + "</tr><tr><th>Q</th>" + Qs.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr><tr><th>TC</th>" + TCs.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr></tbody></table></div>";
      return { text: "Each worker costs " + step + " CZK. Total cost for each output level (like sample test question 1). Look at the column <span class='mg-k'>Q = " + Qs[k] + "</span>." + tb + "<p class='mg-help'>Give AVC, AFC and MC to 2 decimals.</p>",
        steps: [
          { q: "Fixed cost FC", a: FC, how: "FC is the cost when nothing is produced (Q = 0): <b>FC = " + FC + "</b>." },
          { q: "Variable cost VC at Q = " + Qs[k], a: VC, how: "VC = TC − FC = " + TCs[k] + " − " + FC + " = <b>" + VC + "</b>." },
          { q: "AVC at Q = " + Qs[k], a: r2(avc), tol: 0.011, how: "AVC = VC / Q = " + VC + " / " + Qs[k] + " = <b>" + fmt(avc) + "</b>." },
          { q: "AFC at Q = " + Qs[k], a: r2(afc), tol: 0.011, how: "AFC = FC / Q = " + FC + " / " + Qs[k] + " = <b>" + fmt(afc) + "</b>." },
          { q: "MC between Q = " + Qs[k - 1] + " and Q = " + Qs[k], a: r2(mc), tol: 0.011, how: "MC = ΔTC / ΔQ = (" + TCs[k] + " − " + TCs[k - 1] + ") / (" + Qs[k] + " − " + Qs[k - 1] + ") = " + (TCs[k] - TCs[k - 1]) + " / " + (Qs[k] - Qs[k - 1]) + " = <b>" + fmt(mc) + "</b>." }
        ] };
    } },
    "ps": { name: "Producer surplus from a table", gen: function () {
      var mc = [], v = rnd(3, 6), i; for (i = 0; i < 7; i++) { mc.push(v); v += rnd(1, 3); }
      var P = mc[rnd(2, 5)], Q = 0, ps = 0, VC = [0];
      mc.forEach(function (m, j) { VC.push(VC[j] + m); if (m <= P) { Q = j + 1; ps += P - m; } });
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th>Q</th>" + VC.map(function (x, j) { return "<td>" + j + "</td>"; }).join("") + "</tr><tr><th>VC</th>" + VC.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr></tbody></table></div>";
      return { text: "A perfectly competitive firm sells at <span class='mg-k'>P = " + P + "</span>. Its variable costs are (like the lecture example):" + tb,
        steps: [
          { q: "MC of piece number " + Q, a: mc[Q - 1], how: "MC = ΔVC / ΔQ = " + VC[Q] + " − " + VC[Q - 1] + " = <b>" + mc[Q - 1] + "</b>." },
          { q: "Optimal output Q<sub>E</sub> (P = MC)", a: Q, how: "MC of each piece: " + mc.join(", ") + ". Produce while MC ≤ P = " + P + " → <b>Q = " + Q + "</b>." },
          { q: "Producer surplus", a: ps, how: "PS = Σ (P − MC) = " + mc.slice(0, Q).map(function (m) { return "(" + P + " − " + m + ")"; }).join(" + ") + " = <b>" + ps + "</b>. Check: TR − VC = " + P + "·" + Q + " − " + VC[Q] + " = " + (P * Q - VC[Q]) + "." }
        ] };
    } },
    "mono": { name: "Imperfect competition: MR = MC", gen: function () {
      var b = pick([1, 2]), c = rnd(4, 20, 2), Q = rnd(5, 25), a = c + 2 * b * Q, P = a - b * Q, L = (P - c) / P;
      return { text: "A monopoly faces demand <span class='mg-k'>P = " + a + " − " + (b === 1 ? "" : b) + "Q</span>. Its marginal cost is constant: <span class='mg-k'>MC = " + c + "</span>.",
        steps: [
          { q: "Write MR. What is MR at Q = 1?", a: a - 2 * b, how: "For a straight demand P = a − bQ, TR = aQ − bQ², so MR = a − 2bQ (twice as steep). MR = " + a + " − " + (2 * b) + "Q, at Q = 1: <b>" + (a - 2 * b) + "</b>." },
          { q: "Optimal output Q* (MR = MC)", a: Q, how: a + " − " + (2 * b) + "Q = " + c + " → " + (2 * b) + "Q = " + (a - c) + " → <b>Q* = " + Q + "</b>." },
          { q: "Price P* (from the demand curve)", a: P, how: "Go up from Q* to the demand curve: P = " + a + " − " + b + "·" + Q + " = <b>" + P + "</b>. Note P &gt; MC." },
          { q: "Lerner index (2 decimals)", a: r2(L), tol: 0.011, how: "L = (P − MC) / P = (" + P + " − " + c + ") / " + P + " = <b>" + fmt(L) + "</b>. Between 0 and 1: the higher, the more monopoly power." }
        ] };
    } },
    "control": { name: "Price ceiling and price floor", gen: function () {
      var Pe = rnd(20, 60, 5), Qe = rnd(60, 140, 10), B = pick([1, 2]), D2 = 1;
      var A = Qe + B * Pe, Cc = Qe - D2 * Pe, ceil = Math.random() < 0.5, Pc = ceil ? Pe - rnd(1, 3) * 5 : Pe + rnd(1, 3) * 5;
      var Qd = A - B * Pc, Qs = Cc + D2 * Pc, sup = Cc === 0 ? "P" : Cc > 0 ? Cc + " + P" : "P − " + (-Cc);
      return { text: "Demand <span class='mg-k'>Qd = " + A + " − " + (B === 1 ? "" : B) + "P</span>, supply <span class='mg-k'>Qs = " + sup + "</span>. The state sets a price " + (ceil ? "<i>ceiling</i>" : "<i>floor</i>") + " of <span class='mg-k'>" + Pc + "</span>.",
        steps: [
          { q: "Equilibrium price P*", a: Pe, how: "Qd = Qs → " + A + " − " + B + "P = " + Cc + " + P → " + (A - Cc) + " = " + (B + 1) + "P → <b>P* = " + Pe + "</b> (Q* = " + Qe + ")." },
          { q: "Quantity demanded at P = " + Pc, a: Qd, how: "Qd = " + A + " − " + B + "·" + Pc + " = <b>" + Qd + "</b>." },
          { q: "Quantity supplied at P = " + Pc, a: Qs, how: "Qs = " + Cc + " + " + Pc + " = <b>" + Qs + "</b>." },
          { q: ceil ? "Shortage (Qd − Qs)" : "Surplus (Qs − Qd)", a: ceil ? Qd - Qs : Qs - Qd, how: ceil ? "The ceiling is below P*, so it binds: shortage = " + Qd + " − " + Qs + " = <b>" + (Qd - Qs) + "</b>." : "The floor is above P*, so it binds: surplus = " + Qs + " − " + Qd + " = <b>" + (Qs - Qd) + "</b>." }
        ] };
    } },
    "tr": { name: "TR, AR, MR and profit from a price table", gen: function () {
      var p1 = rnd(12, 20) * 10, dp = pick([5, 10, 20]), ps = [1, 2, 3, 4, 5].map(function (q) { return p1 - dp * (q - 1); }), tr = ps.map(function (p, i) { return p * (i + 1); });
      var ac = rnd(4, Math.floor(ps[4] / 10) + 2) * 10, pi = tr[4] - ac * 5;
      var tb = "<div class='tw'><table class='mg-t'><tbody><tr><th>P</th>" + ps.map(function (x) { return "<td>" + x + "</td>"; }).join("") + "</tr><tr><th>Q</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr></tbody></table></div>";
      return { text: "The price at which the firm can sell each quantity (like Seminar 6, homework 3):" + tb,
        steps: [
          { q: "Revenue from selling the 3rd unit (MR₃)", a: tr[2] - tr[1], how: "TR₃ = " + ps[2] + "·3 = " + tr[2] + ", TR₂ = " + ps[1] + "·2 = " + tr[1] + ". MR₃ = TR₃ − TR₂ = <b>" + (tr[2] - tr[1]) + "</b>." },
          { q: "Average revenue when 5 units are sold", a: ps[4], how: "AR = TR / Q = P = <b>" + ps[4] + "</b>." },
          { q: "Total revenue from 5 units", a: tr[4], how: "TR₅ = " + ps[4] + " · 5 = <b>" + tr[4] + "</b>." },
          { q: "Profit at Q = 5 if AC₅ = " + ac, a: pi, how: "TC₅ = AC · Q = " + ac + " · 5 = " + ac * 5 + ". π = TR − TC = " + tr[4] + " − " + ac * 5 + " = <b>" + pi + "</b>." }
        ] };
    } }
  };

  function num(s) {
    s = String(s || "").trim().replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
    if (!s) return NaN;
    var m = /^(-?\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s);
    return m ? (+m[1]) / (+m[2]) : (/^-?\d*\.?\d+$/.test(s) ? +s : NaN);
  }
  function drill(box) {
    var kinds = (box.getAttribute("data-kind") || "pc-opt").split(",").map(function (k) { return k.trim(); }).filter(function (k) { return DRILLS[k]; });
    if (!kinds.length) kinds = ["pc-opt"];
    var st = { kind: kinds[0], p: null, i: 0, tries: 0, focus: false };
    function fresh() { st.p = DRILLS[st.kind].gen(); st.i = 0; st.tries = 0; draw(); }
    function draw() {
      var p = st.p, h = '<div class="mg-head"><span class="mg-tag dr">Calculation drill</span><span class="mg-title">' + esc(DRILLS[st.kind].name) + "</span></div>";
      if (kinds.length > 1) h += '<div class="seg mg-seg dr-kinds">' + kinds.map(function (k) { return '<button type="button" data-dk="' + k + '" aria-pressed="' + (k === st.kind) + '">' + esc(DRILLS[k].name) + "</button>"; }).join("") + "</div>";
      h += '<div class="dr-task">' + p.text + '</div><ol class="dr-steps">';
      p.steps.forEach(function (s, j) {
        if (j > st.i) return;
        var done = j < st.i;
        h += '<li class="dr-step' + (done ? " done" : "") + '"><p class="dr-q">' + s.q + "</p>";
        if (done) h += '<p class="dr-how">✓ ' + s.how + "</p>";
        else if (s.choice) h += '<div class="dr-opts">' + s.choice.map(function (o, k) { return '<button type="button" class="ghost" data-ch="' + k + '">' + esc(o) + "</button>"; }).join("") + '</div><p class="dr-msg" role="status"></p>';
        else h += '<div class="row dr-row"><input class="dr-in" inputmode="decimal" autocomplete="off" placeholder="your number" aria-label="' + esc(s.q.replace(/<[^>]+>/g, "")) + '"><button type="button" class="btn" data-chk>Check</button><button type="button" class="ghost" data-how>Show me how</button></div><p class="dr-msg" role="status"></p>';
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
      if (st.i >= st.p.steps.length) { DONE[st.kind] = (DONE[st.kind] || 0) + 1; saveDone(); xp(6, "drill"); toast("Drill solved ✓"); }
      draw();
    }
    box.addEventListener("click", function (e) {
      var t = e.target, s = st.p.steps[st.i], msg = box.querySelector(".dr-msg");
      if (t.closest("[data-new]")) { st.focus = false; fresh(); return; }
      var kb = t.closest("[data-dk]"); if (kb) { st.kind = kb.getAttribute("data-dk"); st.focus = false; fresh(); return; }
      if (!s) return;
      if (t.closest("[data-how]")) { msg.className = "dr-msg"; msg.innerHTML = s.how + "<br><small>Now type the number to go on.</small>"; return; }
      var ch = t.closest("[data-ch]");
      if (ch) { if (+ch.getAttribute("data-ch") === s.right) next(); else { ch.classList.add("bad"); msg.className = "dr-msg bad"; msg.innerHTML = "Not this one. " + s.how; } return; }
      if (t.closest("[data-chk]")) {
        var v = num(box.querySelector(".dr-in").value), tol = s.tol != null ? s.tol : Math.max(0.01, Math.abs(s.a) * 0.002);
        if (isNaN(v)) { msg.className = "dr-msg bad"; msg.textContent = "Type a number first (use a minus sign for a loss)."; return; }
        if (Math.abs(v - s.a) <= tol) { next(); return; }
        st.tries++; msg.className = "dr-msg bad";
        msg.innerHTML = st.tries < 2 ? "Not quite. Check which formula you need and try again." : "Not quite. Here is how: " + s.how;
      }
    });
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("dr-in")) { e.preventDefault(); var b = box.querySelector("[data-chk]"); if (b) b.click(); } });
    fresh();
  }

  var KINDS = { "pc-firm": pcFirm, market: market, monopoly: monopoly, "tr-el": trEl, "ps-table": psTable, drill: drill };
  function mountAll(root) {
    (root || document).querySelectorAll(".mg[data-g]:not([data-on])").forEach(function (b) {
      var f = KINDS[b.getAttribute("data-g")]; b.setAttribute("data-on", "1");
      if (!f) { b.textContent = "Unknown graph: " + b.getAttribute("data-g"); return; }
      try { f(b); } catch (err) { b.textContent = "This graph could not be drawn."; if (window.console) console.error(err); }
    });
  }
  function start() {
    mountAll(document);
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { mountAll(document); return; } }).observe(document.body, { childList: true, subtree: true });
  }
  window.MicroGraphs = { mount: mountAll, drills: DRILLS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
