/* Formula panel: a "∑ Formulas" button in the top bar that rolls down the 3BE216 formulas on every screen.
   The tests are open book on Moodle, but knowing which formula to use is the hard part, so every formula is typed and named
   (KaTeX, loaded from cdnjs on first open). Formulas follow Felipe Martinez's 3BE216 lecture and seminar slides and the practice-test answer keys.
   lib/apply.js uses the ids: an exercise part lists the formula ids it needs ("f": ["m-cmu"]). Keep ids stable. */
(function () {
  "use strict";

  var SECTIONS = [
    { id: "mat", title: "Material standards", items: [
      { g: "Material requirement" },
      { id: "m-req", n: "Material requirement = what you use + what you unavoidably lose", tex: "\\text{Material requirement}=\\text{net (useful) requirement}+\\text{technically unavoidable losses}" },
      { id: "m-cmu", n: "Coefficient of material utilization (CMU)", tex: "CMU=\\dfrac{\\text{net (useful) requirement}}{\\text{total material requirement (what you buy)}}\\cdot 100\\,\\%" },
      { id: "m-loss", n: "Share of material (money) you lose", tex: "\\text{loss}=1-CMU" },
      { id: "m-ell", n: "Area of an ellipse (A, B = the two half-axes)", tex: "\\text{Area}=\\pi\\cdot A\\cdot B" },
      { g: "Buying" },
      { id: "m-units", n: "How many sheets or bars (always round UP)", tex: "\\text{sheets}=\\left\\lceil \\dfrac{\\text{pieces needed}}{\\text{pieces per sheet}}\\right\\rceil" },
      { id: "m-pack", n: "Sold only in packs: round up to a whole pack", tex: "\\text{purchases}=\\left\\lceil \\dfrac{\\text{sheets}}{\\text{sheets per pack}}\\right\\rceil" },
      { id: "m-exact", n: "Buy pieces cut to size from the supplier?", tex: "\\text{yes if }(1-CMU)>\\text{surcharge \\%},\\quad \\text{no if }(1-CMU)<\\text{surcharge \\%}" },
      { id: "m-sell", n: "Value of the leftovers you can sell", tex: "\\text{value}=\\text{leftover metres}\\cdot\\text{price per metre}\\cdot\\text{share of the price}\\cdot\\text{exchange rate}" },
      { id: "m-wait", n: "Wait for a better delivery?", tex: "\\text{wait if } (1-CMU_{\\text{better}})+\\text{days}\\cdot\\text{cost per day} < 1-CMU_{\\text{now}}" }
    ] },
    { id: "time", title: "Time standards and capacity", items: [
      { g: "Types of time" },
      { id: "t-ta", n: "Unit time t_a: repeats for every piece", tex: "t_a\\ (\\text{A})" },
      { id: "t-tb", n: "Batch time t_b: once per batch or order (setup, drawings, handing over)", tex: "t_b\\ (\\text{B})" },
      { id: "t-tc", n: "Shift time t_c: belongs to the shift, not the order (cleaning, breaks)", tex: "t_c\\ (\\text{C})" },
      { g: "Need versus have" },
      { id: "t-need", n: "Time you NEED for an order", tex: "\\text{need}=t_a\\cdot\\text{units}+t_b" },
      { id: "t-have", n: "Time you HAVE in one shift", tex: "\\text{have}=\\text{shift length}-t_c" },
      { id: "t-shifts", n: "Shifts needed", tex: "\\text{shifts}=\\dfrac{\\text{need}}{\\text{have}}" },
      { id: "t-enough", n: "Is it enough? (100 % = ideal)", tex: "\\dfrac{\\text{need}}{\\text{have}}\\cdot 100\\,\\%\\quad(>100\\,\\%\\text{ over capacity},\\ <100\\,\\%\\text{ under capacity})" },
      { g: "Available time" },
      { id: "t-at", n: "Available time of a line", tex: "AT=(\\text{calendar days}-\\text{days off})\\cdot\\text{shifts}\\cdot\\text{hours per shift}-\\text{maintenance}" },
      { id: "t-awt", n: "Available working time of one worker", tex: "AWT=(\\text{calendar days}-\\text{days off}-\\text{vacation})\\cdot\\text{hours per day}\\cdot(1-\\text{illness rate})" },
      { id: "t-tmu", n: "Time Measurement Unit (MTM / MOST)", tex: "1\\ \\text{h}=100\\,000\\ TMU,\\quad 1\\ TMU=0.00001\\ \\text{h}=0.0006\\ \\text{min}=0.036\\ \\text{s}" },
      { id: "t-cp", n: "Process capability", tex: "C_p=\\dfrac{UTL-LTL}{6s}" }
    ] },
    { id: "little", title: "Little's Law", items: [
      { id: "l-law", n: "Little's Law: three numbers, you get two, find the third", tex: "\\text{units in the system}=\\text{rate (units per time)}\\cdot\\text{time in the system}" },
      { id: "l-time", n: "How long does one item stay in the system?", tex: "\\text{time}=\\dfrac{\\text{units in the system}}{\\text{rate}}" },
      { id: "l-rate", n: "Rate needed to clear the system in a given time", tex: "\\text{rate}=\\dfrac{\\text{units}}{\\text{time}}" },
      { id: "l-users", n: "Concurrent users (response time R, think time Z, throughput X)", tex: "N=(R+Z)\\cdot X" }
    ] },
    { id: "seq", title: "Sequencing and scheduling", items: [
      { g: "Five rules for the order of jobs" },
      { id: "s-late", n: "Lateness of a job (never negative)", tex: "\\text{lateness}=\\max(0,\\ \\text{finish}-\\text{due date})" },
      { id: "s-avg", n: "Average time in process and average lateness", tex: "\\bar t=\\dfrac{\\sum\\text{finish times}}{n},\\qquad \\overline{\\text{late}}=\\dfrac{\\sum\\text{lateness}}{n}" },
      { g: "Gradual, parallel, DBR" },
      { id: "s-cyc", n: "Cycles of an operation (P workplaces, S units at once)", tex: "\\text{cycles}=\\left\\lceil\\dfrac{\\text{order size}}{P\\cdot S}\\right\\rceil" },
      { id: "s-op", n: "Length of one operation", tex: "t_{\\text{op}}=t_b+\\text{cycles}\\cdot t_{\\text{cycle}}" },
      { id: "s-grad", n: "Gradual sequencing: one operation after the other", tex: "T_{\\text{gradual}}=\\sum_i\\left(t_{b,i}+\\text{cycles}_i\\cdot t_i\\right)" },
      { id: "s-par", n: "Parallel sequencing: longest operation + what must happen before it + the tail", tex: "T_{\\text{parallel}}=\\underbrace{\\text{first cycles upstream}}_{\\text{head}}+\\text{longest operation}+\\underbrace{\\text{last cycles downstream}}_{\\text{tail}}" },
      { id: "s-dbr", n: "Drum-Buffer-Rope: the buffer hides everything before the drum", tex: "T_{\\text{DBR}}=\\text{drum (bottleneck)}+\\text{tail}" },
      { id: "s-fte", n: "Full-time equivalent", tex: "FTE=\\dfrac{\\text{hours actually worked}}{\\text{hours of one full-time person}}" }
    ] },
    { id: "tech", title: "Choosing the technology", items: [
      { id: "k-tc", n: "Total cost of one option (a straight line)", tex: "TC=FC+VC\\cdot Q\\qquad(y=b+mx)" },
      { id: "k-q", n: "Where two options cost the same (crossing point)", tex: "Q=\\dfrac{FC_B-FC_A}{VC_A-VC_B}" },
      { id: "k-fc", n: "Fixed cost = where the line starts on the cost axis", tex: "FC=\\text{rent}+\\text{depreciation}+\\text{other fixed costs}" },
      { id: "k-vc", n: "Variable cost = the slope (cost per unit)", tex: "VC=\\text{material per unit}+\\text{payroll per unit}+\\ldots" }
    ] }
  ];

  var KATEX = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/";
  var KEY = "opmanHub.fx";
  var st = { sec: "mat", view: "typed" };
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
      '<input class="fx-q" type="search" placeholder="Find a formula by name, e.g. CMU" aria-label="Find a formula by name">' +
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
