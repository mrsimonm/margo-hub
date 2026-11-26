/* Formula panel: a "∑ Formulas" button in the top bar that rolls down the 3BE123 formulas on every screen.
   There is no official formula sheet in 3BE123 (the tests are closed book), so every section is typed and named
   (KaTeX, loaded from cdnjs on first open). Formulas follow Ing. Dzbánková's lecture and seminar slides and midterm_info.
   lib/apply.js uses the ids: an exercise part lists the formula ids it needs ("f": ["pc-opt"]). Keep ids stable. */
(function () {
  "use strict";

  var SECTIONS = [
    { id: "rev", title: "Revenue & profit", items: [
      { g: "Revenue" },
      { id: "r-tr", n: "Total revenue", tex: "TR=P\\cdot Q" },
      { id: "r-ar", n: "Average revenue (always the price)", tex: "AR=\\dfrac{TR}{Q}=\\dfrac{P\\cdot Q}{Q}=P" },
      { id: "r-mr", n: "Marginal revenue (extra revenue from one more unit)", tex: "MR=\\dfrac{\\Delta TR}{\\Delta Q}" },
      { g: "Profit" },
      { id: "p-pi", n: "Profit", tex: "\\pi=TR-TC=(P-AC)\\cdot Q" },
      { id: "p-acc", n: "Accounting profit", tex: "AP=TR-\\text{explicit costs}" },
      { id: "p-eco", n: "Economic profit", tex: "E\\pi=AP-\\text{implicit (opportunity) costs}=TR-(\\text{explicit}+\\text{implicit})" },
      { id: "p-norm", n: "Normal profit (economic profit is zero)", tex: "E\\pi=0\\iff AP=\\text{implicit costs}\\iff TR=TC" },
      { id: "p-rule", n: "Golden rule of profit maximisation", tex: "MR=MC\\quad(MC>MR\\Rightarrow\\downarrow Q,\\ \\ MC<MR\\Rightarrow\\uparrow Q)" }
    ] },
    { id: "cost", title: "Costs", items: [
      { g: "Short run" },
      { id: "c-tc", n: "Total cost", tex: "TC=FC+VC" },
      { id: "c-ac", n: "Average (unit) costs", tex: "AC=\\dfrac{TC}{Q},\\quad AVC=\\dfrac{VC}{Q},\\quad AFC=\\dfrac{FC}{Q},\\quad AC=AVC+AFC" },
      { id: "c-mc", n: "Marginal cost", tex: "MC=\\dfrac{\\Delta TC}{\\Delta Q}=\\dfrac{\\Delta VC}{\\Delta Q}" },
      { id: "c-vc", n: "Variable cost from inputs", tex: "VC=w\\cdot L\\ (+\\ \\text{other variable inputs})" },
      { g: "Long run" },
      { id: "c-iso", n: "Isocost line", tex: "TC=P_L\\cdot L+P_K\\cdot K,\\quad K=\\dfrac{TC}{P_K}-\\dfrac{P_L}{P_K}L,\\quad \\text{slope}=\\dfrac{P_L}{P_K}" },
      { id: "c-ldr", n: "Cost minimisation (last-dollar rule)", tex: "\\dfrac{MP_L}{P_L}=\\dfrac{MP_K}{P_K}\\iff MRTS=\\dfrac{MP_L}{MP_K}=\\dfrac{P_L}{P_K}" }
    ] },
    { id: "pc", title: "Perfect competition", items: [
      { id: "pc-mr", n: "Price-taker: demand for the firm is horizontal", tex: "d=AR=MR=P" },
      { id: "pc-opt", n: "Optimum of a perfectly competitive firm", tex: "MR=MC=P\\quad(\\text{on the rising part of }MC)" },
      { id: "pc-shut", n: "Shut-down point", tex: "P=AR=\\min AVC\\iff TR=VC\\Rightarrow \\text{loss}=FC;\\qquad P\\le AVC\\Rightarrow Q=0" },
      { id: "pc-be", n: "Break-even point (long run)", tex: "P=AR=\\min AC\\iff TR=TC\\Rightarrow E\\pi=0" },
      { id: "pc-sr", n: "Short run: produce or shut down?", tex: "P>AVC\\Rightarrow\\text{produce (loss}<FC);\\qquad P<AVC\\Rightarrow\\text{shut down (loss}=FC)" },
      { id: "pc-sup", n: "Supply curves", tex: "s_{firm}=MC\\ \\text{above}\\ \\min AVC,\\qquad S_{industry}=\\textstyle\\sum MC" }
    ] },
    { id: "mkt", title: "Market & surplus", items: [
      { id: "m-eq", n: "Market equilibrium", tex: "Q_D=Q_S\\Rightarrow P^{*},\\ Q^{*}" },
      { id: "m-cs", n: "Consumer surplus", tex: "CS=TU-\\text{real expenditure}=\\textstyle\\sum (MU-P);\\quad \\text{linear: } CS=\\tfrac12 (P_{max}-P^{*})\\,Q^{*}" },
      { id: "m-ps", n: "Producer surplus", tex: "PS=\\textstyle\\sum (P-MC)=TR-VC;\\quad \\text{linear: } PS=\\tfrac12 (P^{*}-P_{min})\\,Q^{*}" },
      { id: "m-eff", n: "Allocative efficiency", tex: "MU=MC\\ (P=MC),\\qquad CS+PS\\ \\text{is the largest}" },
      { id: "m-ctrl", n: "Price ceiling and price floor", tex: "\\text{ceiling}<P^{*}:\\ \\text{shortage}=Q_D-Q_S;\\qquad \\text{floor}>P^{*}:\\ \\text{surplus}=Q_S-Q_D" },
      { id: "m-shift", n: "Both curves shift", tex: "\\Delta S>\\Delta D\\Rightarrow\\ \\downarrow P,\\qquad \\Delta D>\\Delta S\\Rightarrow\\ \\uparrow P" }
    ] },
    { id: "ic", title: "Imperfect competition", items: [
      { id: "i-lin", n: "Linear demand: revenue", tex: "P=a-bQ\\Rightarrow TR=aQ-bQ^2,\\quad MR=a-2bQ\\ (MR<P)" },
      { id: "i-opt", n: "Optimum of an imperfectly competitive firm", tex: "MR=MC\\Rightarrow Q_E,\\ \\text{then } P \\text{ from the demand curve } (P>MC)" },
      { id: "i-ler", n: "Lerner index (monopoly power)", tex: "L=\\dfrac{P-MC}{P},\\quad L\\in(0;1)" },
      { id: "i-el", n: "Total revenue and elasticity", tex: "|E|>1:\\ MR>0;\\quad |E|=1:\\ MR=0,\\ TR\\ \\max;\\quad |E|<1:\\ MR<0" },
      { id: "i-dwl", n: "Deadweight loss (linear)", tex: "DWL=\\tfrac12\\,(P_{IC}-MC)\\,(Q_{PC}-Q_{IC})" }
    ] },
    { id: "t1", title: "Test 1 recap", items: [
      { g: "Consumer" },
      { id: "u-mu", n: "Marginal utility", tex: "MU=\\dfrac{\\Delta TU}{\\Delta Q},\\qquad TU=\\textstyle\\sum MU" },
      { id: "u-opt", n: "Consumer optimum (cardinal)", tex: "\\dfrac{MU_X}{P_X}=\\dfrac{MU_Y}{P_Y}" },
      { id: "u-bl", n: "Budget line", tex: "I=P_X\\cdot X+P_Y\\cdot Y,\\qquad \\text{slope}=\\dfrac{P_X}{P_Y}" },
      { id: "u-mrs", n: "Consumer optimum (ordinal)", tex: "MRS_C=\\dfrac{MU_X}{MU_Y}=\\dfrac{P_X}{P_Y}" },
      { g: "Elasticity" },
      { id: "e-gen", n: "Price elasticity of demand", tex: "E_P=\\dfrac{\\%\\Delta Q}{\\%\\Delta P}" },
      { id: "e-mid", n: "Midpoint method", tex: "E_P=\\dfrac{(Q_2-Q_1)/[(Q_2+Q_1)/2]}{(P_2-P_1)/[(P_2+P_1)/2]}" },
      { g: "Production (short run)" },
      { id: "q-ap", n: "Average and marginal product", tex: "AP=\\dfrac{TP}{L},\\qquad MP=\\dfrac{\\Delta TP}{\\Delta L}" }
    ] }
  ];

  var KATEX = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/";
  var KEY = "microHub.fx";
  var st = { sec: "pc", view: "typed" };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved && saved.sec) st = saved; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var kx = null; // promise for KaTeX
  function loadKatex() {
    if (kx) return kx;
    kx = new Promise(function (ok, bad) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = KATEX + "katex.min.css"; document.head.appendChild(l);
      var s = document.createElement("script"); s.src = KATEX + "katex.min.js";
      s.onload = function () { window.katex ? ok(window.katex) : bad(); };
      s.onerror = function () { kx = null; bad(); };
      document.head.appendChild(s);
    });
    return kx;
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sec(id) { for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].id === id) return SECTIONS[i]; return SECTIONS[0]; }

  var panel, body, btn, q;

  function sheetImg(s) {
    if (s.imgs) return s.imgs.map(function (im) {
      var u = "formulas/" + im[0] + ".jpg";
      return '<h4 class="fx-g">' + esc(im[1]) + '</h4><a href="' + u + '" target="_blank" rel="noopener" class="fx-full">Open full size to zoom ↗</a><img class="fx-img" src="' + u + '" alt="Table: ' + esc(im[1]) + '" loading="lazy">';
    }).join("");
    var src = "formulas/sheet-p" + s.page + ".jpg";
    return '<a href="' + src + '" target="_blank" rel="noopener" class="fx-full">Open full size to zoom ↗</a>' +
      '<img class="fx-img" src="' + src + '" alt="Sheet page ' + (s.page - 1) + ': ' + esc(s.title) + '" loading="lazy">';
  }

  function render() {
    var s = sec(st.sec), term = (q.value || "").trim().toLowerCase();
    panel.querySelectorAll(".fx-chip").forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-sec") === s.id ? "true" : "false"); });
    var typed = true, view = "typed";
    panel.querySelector(".fx-views").hidden = true;
    panel.querySelectorAll(".fx-view").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false"); });
    q.hidden = !(typed && view === "typed");

    if (view === "sheet") {
      body.innerHTML = (typed || s.imgs ? "" : '<p class="fx-note">Typed version of this section is coming. This is the official sheet you get in the exam.</p>') + sheetImg(s);
      return;
    }
    var html = "", shown = 0, group = "";
    s.items.forEach(function (it) {
      if (it.g) { group = it.g; return; }
      if (term && it.n.toLowerCase().indexOf(term) < 0 && group.toLowerCase().indexOf(term) < 0) return;
      if (group) { html += '<h4 class="fx-g">' + esc(group) + "</h4>"; group = ""; }
      html += '<div class="fx-f"><div class="fx-n">' + esc(it.n) + '</div><div class="fx-tex" data-tex="' + esc(it.tex) + '">' + esc(it.tex) + "</div></div>";
      shown++;
    });
    body.innerHTML = shown ? html : '<p class="fx-note">No formula name matches "' + esc(term) + '".</p>';
    loadKatex().then(function (k) {
      body.querySelectorAll(".fx-tex").forEach(function (e) {
        try { k.render(e.getAttribute("data-tex"), e, { throwOnError: false, displayMode: true }); e.classList.add("ok"); } catch (x) {}
      });
    }).catch(function () {
      body.insertAdjacentHTML("afterbegin", '<p class="fx-note">The formulas need a connection the first time you open them. The names and plain versions are shown below.</p>');
    });
  }

  function open(on) {
    panel.hidden = !on;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    if (on) render();
  }

  function init() {
    var hud = document.querySelector(".hud"), top = document.querySelector(".top-in");
    if (!hud || !top) return;
    btn = document.createElement("button");
    btn.className = "hudchip"; btn.id = "fxbtn"; btn.type = "button";
    btn.title = "Formula sheet"; btn.setAttribute("aria-controls", "fxpanel"); btn.setAttribute("aria-expanded", "false");
    btn.textContent = "∑ Formulas";
    hud.insertBefore(btn, hud.firstChild);

    panel = document.createElement("div");
    panel.className = "fxpanel"; panel.id = "fxpanel"; panel.hidden = true;
    panel.setAttribute("role", "region"); panel.setAttribute("aria-label", "Formula sheet");
    panel.innerHTML =
      '<div class="fx-head"><b>Formulas to learn</b><span class="fx-views" hidden><button type="button" class="fx-view" data-view="typed">Typed with names</button><button type="button" class="fx-view" data-view="sheet">Official sheet</button></span><button type="button" class="fx-x" aria-label="Close formula sheet">✕</button></div>' +
      '<div class="fx-chips">' + SECTIONS.map(function (s) {
        return '<button type="button" class="fx-chip" data-sec="' + s.id + '">' + esc(s.title) + (s.items ? "" : ' <span class="fx-pg">sheet</span>') + "</button>";
      }).join("") + "</div>" +
      '<input class="fx-q" type="search" placeholder="Find a formula by name, e.g. profit" aria-label="Find a formula by name">' +
      '<div class="fx-body"></div>';
    top.insertBefore(panel, document.getElementById("tabs"));
    body = panel.querySelector(".fx-body"); q = panel.querySelector(".fx-q");

    btn.onclick = function (e) { e.stopPropagation(); open(panel.hidden); };
    panel.onclick = function (e) {
      e.stopPropagation();
      var c = e.target.closest(".fx-chip"), v = e.target.closest(".fx-view");
      if (c) { st.sec = c.getAttribute("data-sec"); q.value = ""; save(); render(); body.scrollTop = 0; }
      else if (v) { st.view = v.getAttribute("data-view"); save(); render(); }
      else if (e.target.closest(".fx-x")) { open(false); btn.focus(); }
    };
    q.oninput = render;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { open(false); btn.focus(); } });
  }

  /* Used by lib/apply.js: render one section's typed formulas into a box, marking some ids. */
  function byId(fid) {
    for (var i = 0; i < SECTIONS.length; i++) {
      var its = SECTIONS[i].items || [];
      for (var j = 0; j < its.length; j++) if (its[j].id === fid) return its[j];
    }
    return null;
  }
  function renderInto(box, secId, mark) {
    var s = sec(secId), html = "";
    if (!s.items) { box.innerHTML = sheetImg(s); return; }
    s.items.forEach(function (it) {
      if (it.g) { html += '<h4 class="fx-g">' + esc(it.g) + "</h4>"; return; }
      var on = mark && it.id && mark.indexOf(it.id) >= 0;
      html += '<div class="fx-f' + (on ? " fx-on" : "") + '" data-fid="' + esc(it.id || "") + '"><div class="fx-n">' + esc(it.n) + '</div><div class="fx-tex" data-tex="' + esc(it.tex) + '">' + esc(it.tex) + "</div></div>";
    });
    box.innerHTML = html;
    loadKatex().then(function (k) {
      box.querySelectorAll(".fx-tex").forEach(function (e) {
        try { k.render(e.getAttribute("data-tex"), e, { throwOnError: false, displayMode: true }); e.classList.add("ok"); } catch (x) {}
      });
    }).catch(function () {});
  }
  function renderIds(box, ids) {
    box.innerHTML = ids.map(function (fid) {
      var it = byId(fid); if (!it) return "";
      return '<div class="fx-f fx-on"><div class="fx-n">' + esc(it.n) + '</div><div class="fx-tex" data-tex="' + esc(it.tex) + '">' + esc(it.tex) + "</div></div>";
    }).join("");
    loadKatex().then(function (k) {
      box.querySelectorAll(".fx-tex").forEach(function (e) {
        try { k.render(e.getAttribute("data-tex"), e, { throwOnError: false, displayMode: true }); e.classList.add("ok"); } catch (x) {}
      });
    }).catch(function () {});
  }
  window.GEOFormulas = { sections: SECTIONS, byId: byId, renderInto: renderInto, renderIds: renderIds };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
