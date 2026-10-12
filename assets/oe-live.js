/* oe-live.js - the break bench for learn-office-energy-with-phoebe
 *
 * MODELLED, end to end. Priyanka is a constructed analyst who sits about nine hours a day; no row
 * here is a real person's day. The page turns a workday (start, end, meetings, lunch) into a
 * minute-by-minute timeline and counts what the day does to sitting. Integer minutes throughout,
 * so the browser and the Python reference (materials/oe_reference.py) agree exactly.
 *
 * The model, in plain words:
 *   - Every working minute is one of three states: S (sitting), T (standing), M (moving).
 *   - Desk time is sitting unless a break says otherwise.
 *   - A meeting has a mode: seated (S), standing (T) or walkable (S, unless walking meetings
 *     are switched on, then M).
 *   - Lunch: "walk" means the first 10 minutes are moving (out to buy food) and the rest is
 *     seated eating; "desk" means all of lunch is seated.
 *   - A break is a cue at a clock time. It only fires if that minute is desk time. If the cue
 *     lands inside a meeting or lunch, the break is DROPPED, silently, the way a reminder is
 *     dismissed when you are on a call. A break that runs into a meeting is cut short.
 *   - A sitting bout is a run of consecutive S minutes. Standing or moving for one minute or more
 *     ends the bout.
 * Rungs:  1 no breaks · 2 stand 2 minutes at the top of every hour · 3 a 3-minute routine every
 *         30 minutes (on the hour and half hour) · 4 rung 3 plus walking meetings.
 * Anti-lever "one 30-minute gym session at lunch": lunch becomes 30 moving minutes.
 * Break button "back-to-back meetings 1-5 pm": every afternoon meeting is replaced by four
 *         seated one-hour meetings from 13:00 to 17:00.
 */
(function (root) {
  "use strict";

  var PRIYANKA = {
    start: 510, end: 1050,                   /* 08:30 to 17:30, nine hours */
    lunch: { start: 750, len: 30, type: "walk" },
    meetings: [
      { s: 570, e: 585, mode: "standing", name: "team stand-up" },
      { s: 660, e: 720, mode: "seated", name: "project review" },
      { s: 840, e: 870, mode: "walkable", name: "1:1 with her manager" },
      { s: 900, e: 960, mode: "seated", name: "client call" }
    ]
  };

  var RUNGS = [
    { id: 1, label: "No breaks", every: 0, len: 0, kind: "", walkMeet: false },
    { id: 2, label: "Stand every hour", every: 60, len: 2, kind: "T", walkMeet: false },
    { id: 3, label: "3-minute routine every 30 min", every: 30, len: 3, kind: "M", walkMeet: false },
    { id: 4, label: "Routine + walking meetings", every: 30, len: 3, kind: "M", walkMeet: true }
  ];

  var LUNCH_WALK = 10;

  function hm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }

  function backToBack(day) {
    var keep = day.meetings.filter(function (x) { return x.e <= 780; });
    for (var h = 780; h < 1020; h += 60) keep.push({ s: h, e: h + 60, mode: "seated", name: "back-to-back meeting" });
    return { start: day.start, end: day.end, lunch: day.lunch, meetings: keep };
  }

  /* simulate one day; opts: {rung, gym, b2b} */
  function simulate(dayIn, opts) {
    var rung = RUNGS[(opts.rung || 1) - 1];
    var day = opts.b2b ? backToBack(dayIn) : dayIn;
    var n = day.end - day.start, i, t;
    var st = [], busy = [];          /* busy: 0 desk, 1 meeting, 2 lunch */
    for (i = 0; i < n; i++) { st.push("S"); busy.push(0); }
    /* lunch */
    var L = day.lunch;
    for (t = L.start; t < L.start + L.len; t++) {
      if (t < day.start || t >= day.end) continue;
      i = t - day.start; busy[i] = 2;
      if (opts.gym) st[i] = "M";
      else if (L.type === "walk" && t < L.start + LUNCH_WALK) st[i] = "M";
      else st[i] = "S";
    }
    /* meetings, in order; a later meeting overwrites an earlier overlap */
    for (var k = 0; k < day.meetings.length; k++) {
      var mt = day.meetings[k];
      for (t = mt.s; t < mt.e; t++) {
        if (t < day.start || t >= day.end) continue;
        i = t - day.start; busy[i] = 1;
        if (mt.mode === "standing") st[i] = "T";
        else if (mt.mode === "walkable" && rung.walkMeet) st[i] = "M";
        else st[i] = "S";
      }
    }
    /* break cues on the clock: every multiple of rung.every strictly after the start */
    var cues = [], taken = 0, dropped = 0, cut = 0;
    if (rung.every > 0) {
      var first = (Math.floor(day.start / rung.every) + 1) * rung.every;
      for (t = first; t < day.end; t += rung.every) {
        i = t - day.start;
        if (busy[i] !== 0) { cues.push({ t: t, ok: false }); dropped++; continue; }
        var got = 0;
        for (var j = 0; j < rung.len && i + j < n && busy[i + j] === 0; j++) { st[i + j] = rung.kind; got++; }
        if (got < rung.len) cut++;
        cues.push({ t: t, ok: true, got: got }); taken++;
      }
    }
    /* metrics */
    var sit = 0, stand = 0, move = 0, longest = 0, longestAt = -1, over30 = 0, run = 0, runStart = 0;
    var bouts = [];
    for (i = 0; i <= n; i++) {
      var s = i < n ? st[i] : "E";
      if (s === "S") { if (run === 0) runStart = i; run++; sit++; }
      else {
        if (run > 0) {
          bouts.push([runStart, run]);
          if (run > 30) over30++;
          if (run > longest) { longest = run; longestAt = runStart; }
        }
        run = 0;
        if (s === "T") stand++; else if (s === "M") move++;
      }
    }
    return {
      minutes: n, sit: sit, stand: stand, move: move,
      longest: longest, longestStart: longestAt < 0 ? -1 : day.start + longestAt,
      over30: over30, bouts: bouts.length,
      cues: cues.length, taken: taken, dropped: dropped, cut: cut,
      states: st.join(""), day: day, cueList: cues
    };
  }

  function summary(r) {
    return { longest: r.longest, longestStart: r.longestStart, over30: r.over30, bouts: r.bouts,
      sit: r.sit, stand: r.stand, move: r.move, cues: r.cues, taken: r.taken, dropped: r.dropped, cut: r.cut };
  }

  function canon() {
    var out = { day: "Priyanka (constructed)", rungs: [], gym: [], b2b: [], gymOnRung1: null };
    for (var g = 1; g <= 4; g++) {
      out.rungs.push(summary(simulate(PRIYANKA, { rung: g })));
      out.gym.push(summary(simulate(PRIYANKA, { rung: g, gym: true })));
      out.b2b.push(summary(simulate(PRIYANKA, { rung: g, b2b: true })));
    }
    return out;
  }

  /* parse "HH:MM" -> minutes, or NaN */
  function parseHM(s) {
    var m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(s || "");
    if (!m) return NaN;
    var h = +m[1], mm = +m[2];
    if (h > 23 || mm > 59) return NaN;
    return h * 60 + mm;
  }
  /* meetings text: one per line "09:30-09:45 standing" (mode optional: seated|standing|walkable) */
  function parseMeetings(txt) {
    var out = [], bad = [];
    (txt || "").split(/\n/).forEach(function (line, k) {
      var l = line.trim(); if (!l) return;
      var m = /^(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})\s*(seated|standing|walkable|walk)?/i.exec(l);
      if (!m) { bad.push(k + 1); return; }
      var s = parseHM(m[1]), e = parseHM(m[2]);
      if (isNaN(s) || isNaN(e) || e <= s) { bad.push(k + 1); return; }
      var mode = (m[3] || "seated").toLowerCase(); if (mode === "walk") mode = "walkable";
      out.push({ s: s, e: e, mode: mode, name: "meeting" });
    });
    out.sort(function (a, b) { return a.s - b.s; });
    return { meetings: out, bad: bad };
  }

  var api = { PRIYANKA: PRIYANKA, RUNGS: RUNGS, simulate: simulate, canon: canon, hm: hm,
    parseHM: parseHM, parseMeetings: parseMeetings, summary: summary, LUNCH_WALK: LUNCH_WALK };

  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.OE = api;

  /* ------------------------------------------------------------------ browser UI */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var state = { rung: 1, gym: false, b2b: false, who: "p", own: null };
  var els = {}, rootEl;

  function currentDay() { return state.who === "p" || !state.own ? PRIYANKA : state.own; }

  function timeline(r) {
    var day = r.day, n = r.minutes, W = 840, X0 = 20, Y = 46, H = 40;
    var sx = function (m) { return X0 + (m - day.start) * W / n; };
    var col = { S: "#E5ECE0", T: "#CFE3C8", M: "#387234" };
    var svg = '<svg viewBox="0 0 880 200" role="img" aria-label="Minute by minute timeline of the workday: pale is sitting, light green standing, green moving. The longest sitting bout is outlined in coral and lasts ' + r.longest + ' minutes.">';
    svg += '<text class="ab-cap" x="20" y="22">sitting</text><rect x="70" y="12" width="14" height="12" rx="2" fill="' + col.S + '" stroke="#566152" stroke-width=".8"/>';
    svg += '<text class="ab-cap" x="96" y="22">standing</text><rect x="156" y="12" width="14" height="12" rx="2" fill="' + col.T + '" stroke="#566152" stroke-width=".8"/>';
    svg += '<text class="ab-cap" x="182" y="22">moving</text><rect x="232" y="12" width="14" height="12" rx="2" fill="' + col.M + '"/>';
    svg += '<text class="ab-cap" x="262" y="22">coral outline: longest sitting bout</text>';
    /* runs of equal state */
    var s = r.states, i = 0;
    while (i < n) {
      var j = i; while (j < n && s[j] === s[i]) j++;
      svg += '<rect x="' + sx(day.start + i).toFixed(1) + '" y="' + Y + '" width="' + ((j - i) * W / n).toFixed(1) + '" height="' + H + '" fill="' + col[s[i]] + '"/>';
      i = j;
    }
    svg += '<rect x="' + X0 + '" y="' + Y + '" width="' + W + '" height="' + H + '" fill="none" stroke="#566152" stroke-width="1"/>';
    if (r.longest > 0) {
      svg += '<rect x="' + sx(r.longestStart).toFixed(1) + '" y="' + (Y - 4) + '" width="' + (r.longest * W / n).toFixed(1) + '" height="' + (H + 8) + '" fill="none" stroke="#B44A34" stroke-width="2.5" rx="3"/>';
    }
    /* meetings band */
    day.meetings.forEach(function (m) {
      var a = Math.max(m.s, day.start), b = Math.min(m.e, day.end); if (b <= a) return;
      svg += '<rect x="' + sx(a).toFixed(1) + '" y="96" width="' + ((b - a) * W / n).toFixed(1) + '" height="10" rx="2" fill="#566152" opacity=".55"/>';
    });
    var L = day.lunch, la = Math.max(L.start, day.start), lb = Math.min(L.start + L.len, day.end);
    if (lb > la) svg += '<rect x="' + sx(la).toFixed(1) + '" y="96" width="' + ((lb - la) * W / n).toFixed(1) + '" height="10" rx="2" fill="#B44A34" opacity=".75"/>';
    svg += '<text class="ab-cap" x="20" y="124">grey: meetings · coral: lunch</text>';
    /* cue markers */
    r.cueList.forEach(function (c) {
      var x = sx(c.t);
      if (c.ok) svg += '<path d="M' + x.toFixed(1) + ' 140 l-4 8 h8 z" fill="#387234"/>';
      else svg += '<circle cx="' + x.toFixed(1) + '" cy="145" r="4" fill="#FFFFFF" stroke="#B44A34" stroke-width="2"/>';
    });
    if (r.cues) svg += '<text class="ab-cap" x="20" y="168">green triangle: break taken · coral ring: cue dropped, it fell in a meeting or lunch</text>';
    /* hour ticks */
    var h0 = Math.ceil(day.start / 60) * 60, step = n > 720 ? 120 : 60;
    for (var h = h0; h <= day.end; h += step) {
      var x2 = sx(h);
      svg += '<path d="M' + x2.toFixed(1) + ' 86 v5" stroke="#566152"/><text class="ab-tick" x="' + x2.toFixed(1) + '" y="190" text-anchor="middle">' + hm(h) + '</text>';
    }
    return svg + "</svg>";
  }

  function metric(kind, label, val, unit) {
    return '<div class="mb-metric"><span class="mb-mkind is-heuristic">' + kind + '</span><span class="mb-mlabel">' + esc(label) + '</span><span class="mb-mvalue">' + esc(val) + '</span><span class="mb-munit">' + esc(unit) + '</span></div>';
  }

  function render() {
    var day = currentDay();
    var r = simulate(day, { rung: state.rung, gym: state.gym, b2b: state.b2b });
    var base = simulate(day, { rung: 1 });
    var cls = r.longest <= 30 ? "is-good" : r.longest <= 60 ? "is-ok" : "is-bad";
    var who = state.who === "p" ? "Priyanka" : "Your day";
    var v = who + ": longest unbroken sit " + r.longest + " min, " + r.over30 + (r.over30 === 1 ? " bout" : " bouts") + " over 30 min";
    if (r.dropped) v += ", " + r.dropped + " of " + r.cues + " breaks dropped";
    els.verdict.className = "mb-verdict " + cls; els.verdict.textContent = v;
    els.metrics.innerHTML =
      metric("modelled", "Longest unbroken sitting bout", r.longest, "minutes (rung 1: " + base.longest + ")") +
      metric("modelled", "Sitting bouts over 30 minutes", r.over30, "bouts (rung 1: " + base.over30 + ")") +
      metric("modelled", "Standing minutes", r.stand, "of " + r.minutes + " working minutes") +
      metric("modelled", "Moving minutes", r.move, "of " + r.minutes + " working minutes") +
      metric("modelled", "Sitting minutes", r.sit, "of " + r.minutes) +
      metric("modelled", "Breaks taken / dropped", r.taken + " / " + r.dropped, r.cut ? r.cut + " cut short by a meeting" : "cues on the clock");
    els.chart.innerHTML = timeline(r);
    els.rungs.forEach(function (x) { x.parentNode.classList.toggle("is-on", +x.value === state.rung); x.checked = +x.value === state.rung; });
    els.gym.parentNode.classList.toggle("is-on", state.gym);
    els.b2b.parentNode.classList.toggle("is-on", state.b2b);
  }

  function readOwn() {
    var s = parseHM(els.fStart.value), e = parseHM(els.fEnd.value), ls = parseHM(els.fLunch.value);
    var ll = parseInt(els.fLunchLen.value, 10), lt = els.fLunchType.value;
    var pm = parseMeetings(els.fMeet.value), msg = [];
    if (isNaN(s) || isNaN(e) || e - s < 60 || e - s > 900) msg.push("start and end must be HH:MM, between 1 and 15 hours apart");
    if (isNaN(ls)) msg.push("lunch start must be HH:MM");
    if (!(ll >= 0 && ll <= 120)) msg.push("lunch length 0 to 120 minutes");
    if (pm.bad.length) msg.push("could not read meeting line " + pm.bad.join(", "));
    if (msg.length) { els.ownMsg.textContent = "Not run: " + msg.join("; ") + "."; return false; }
    state.own = { start: s, end: e, lunch: { start: ls, len: ll, type: lt }, meetings: pm.meetings };
    els.ownMsg.textContent = "Running your day: " + hm(s) + " to " + hm(e) + ", " + pm.meetings.length + " meetings. Nothing leaves this page; close the tab and it is gone.";
    return true;
  }

  function build() {
    rootEl.innerHTML = "";
    var wrap = document.createElement("div"); wrap.className = "mb-wrap"; rootEl.appendChild(wrap);
    wrap.innerHTML = '<h4>The break bench <span class="mb-mkind is-heuristic">modelled</span></h4><p class="mb-intro">A workday turned into 1-minute slots. Every number below is computed in your browser from the schedule you see; none is a measurement of a real person. Not medical advice.</p>';

    var who = document.createElement("div"); who.className = "ab-top";
    who.innerHTML = '<div class="ab-pick" role="radiogroup" aria-label="Whose day">Whose day <label class="oe-who"><input type="radio" name="oe-who" value="p" checked> Priyanka (constructed)</label><label class="oe-who"><input type="radio" name="oe-who" value="o"> My own day</label></div>';
    wrap.appendChild(who);

    var own = document.createElement("div"); own.className = "oe-own"; own.hidden = true;
    own.innerHTML =
      '<div class="oe-fields">' +
      '<label>Start<input id="oe-start" value="08:30" inputmode="numeric"></label>' +
      '<label>End<input id="oe-end" value="17:30" inputmode="numeric"></label>' +
      '<label>Lunch at<input id="oe-lunch" value="12:30" inputmode="numeric"></label>' +
      '<label>Lunch minutes<input id="oe-lunchlen" value="30" inputmode="numeric"></label>' +
      '<label>Lunch is<select id="oe-lunchtype"><option value="walk">a 10-min walk out, then seated</option><option value="desk">at my desk</option></select></label>' +
      '</div>' +
      '<div class="mb-edit"><label for="oe-meet">Meetings, one per line: HH:MM-HH:MM and seated, standing or walkable</label>' +
      '<textarea id="oe-meet" rows="5" spellcheck="false">09:30-09:45 standing\n11:00-12:00 seated\n14:00-14:30 walkable\n15:00-16:00 seated</textarea></div>' +
      '<p class="oe-row"><button class="btn primary" type="button" id="oe-run">Run my day</button> <span class="mb-hint" id="oe-ownmsg">Your day stays in this browser tab. Nothing is stored or sent.</span></p>';
    wrap.appendChild(own);

    var panel = document.createElement("div"); panel.className = "mb-presets"; els.rungs = [];
    var notes = ["Desk time is all sitting", "2 minutes standing at every :00", "3 minutes moving at every :00 and :30", "Rung 3, and walkable meetings become walks"];
    RUNGS.forEach(function (g, i) {
      var l = document.createElement("label"); l.className = "mb-preset";
      l.innerHTML = '<input type="radio" name="oe-rung" value="' + g.id + '"><span class="mb-pname">' + g.id + " · " + esc(g.label) + '</span><span class="mb-pnote">' + esc(notes[i]) + "</span>";
      panel.appendChild(l); els.rungs.push(l.querySelector("input"));
    });
    wrap.appendChild(panel);

    var tog = document.createElement("div"); tog.className = "mb-presets";
    function anti(id, name, note) {
      var l = document.createElement("label"); l.className = "mb-preset is-anti";
      l.innerHTML = '<input type="checkbox" id="' + id + '"><span class="mb-pname">' + esc(name) + '</span><span class="mb-pnote">' + esc(note) + "</span>";
      tog.appendChild(l); return l.querySelector("input");
    }
    els.gym = anti("oe-gym", "One 30-minute gym session at lunch", "The anti-lever: lunch becomes 30 moving minutes");
    els.b2b = anti("oe-b2b", "Break: back-to-back meetings 1-5 pm", "Four seated one-hour meetings replace the afternoon");
    wrap.appendChild(tog);

    els.verdict = document.createElement("div"); wrap.appendChild(els.verdict);
    els.metrics = document.createElement("div"); els.metrics.className = "mb-metrics"; wrap.appendChild(els.metrics);
    var card = document.createElement("div"); card.className = "ab-card";
    card.innerHTML = '<h4>The day, minute by minute <span class="mb-mkind is-heuristic">modelled</span></h4>';
    els.chart = document.createElement("div"); els.chart.className = "mb-stage"; card.appendChild(els.chart);
    wrap.appendChild(card);

    els.fStart = own.querySelector("#oe-start"); els.fEnd = own.querySelector("#oe-end");
    els.fLunch = own.querySelector("#oe-lunch"); els.fLunchLen = own.querySelector("#oe-lunchlen");
    els.fLunchType = own.querySelector("#oe-lunchtype"); els.fMeet = own.querySelector("#oe-meet");
    els.ownMsg = own.querySelector("#oe-ownmsg");

    els.rungs.forEach(function (x) { x.addEventListener("change", function () { state.rung = +x.value; render(); }); });
    els.gym.addEventListener("change", function () { state.gym = els.gym.checked; render(); });
    els.b2b.addEventListener("change", function () { state.b2b = els.b2b.checked; render(); });
    who.querySelectorAll("input").forEach(function (x) {
      x.addEventListener("change", function () {
        state.who = x.value; own.hidden = state.who !== "o";
        if (state.who === "o" && !state.own) readOwn();
        render();
      });
    });
    own.querySelector("#oe-run").addEventListener("click", function () { if (readOwn()) render(); });
    render();
  }

  /* ---------------- 3-minute routine timer: steps through the figures ---------------- */
  var MOVES = [
    { name: "Neck turns", cue: "Turn your head slowly to look over one shoulder, then the other. 5 each side.", stop: "Stop if it causes dizziness, pain down an arm, or pins and needles.", fig: "neck" },
    { name: "Shoulder rolls", cue: "Lift shoulders to your ears, roll them back and down. 8 slow rolls.", stop: "Stop if a shoulder catches or pinches.", fig: "shoulder" },
    { name: "Stand and reach", cue: "Stand, reach both arms up, then lean gently left and right. 4 each side.", stop: "Stop if your back or shoulder pain sharpens.", fig: "reach" },
    { name: "Hip opener", cue: "Step one foot back, tuck your hips under until the front of the back hip stretches. 20 seconds each side.", stop: "Stop if your knee or lower back hurts.", fig: "hip" },
    { name: "Wrist circles", cue: "Make loose fists, circle the wrists 8 times each way, then spread the fingers wide.", stop: "Stop if you feel tingling or numbness in the fingers.", fig: "wrist" },
    { name: "March and look far", cue: "March on the spot and look at something at least 6 metres away. Blink fully.", stop: "Stop if you feel faint or short of breath.", fig: "march" }
  ];
  var STEP_SEC = 30;
  function stick(kind) {
    var g = '<g fill="none" stroke="#1E2A1C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">';
    var head = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#FFFFFF"/>'; };
    var arrow = function (d) { return '<path d="' + d + '" stroke="#B44A34" stroke-width="2.4" marker-end="url(#oeTAr)"/>'; };
    var body = "";
    if (kind === "neck") body = head(100, 40) + '<path d="M100 51 L100 110 M100 66 L76 92 M100 66 L124 92 M100 110 L84 150 M100 110 L116 150"/>' + arrow("M76 26 C86 16 114 16 124 26");
    if (kind === "shoulder") body = head(100, 40) + '<path d="M100 51 L100 110 M100 64 L78 94 M100 64 L122 94 M100 110 L84 150 M100 110 L116 150"/>' + arrow("M70 58 C66 46 78 40 86 50");
    if (kind === "reach") body = head(100, 44) + '<path d="M100 55 L100 112 M100 66 L84 20 M100 66 L116 20 M100 112 L86 150 M100 112 L114 150"/>' + arrow("M130 30 C146 44 146 60 136 72");
    if (kind === "hip") body = head(100, 34) + '<path d="M100 45 L100 100 M100 58 L84 84 M100 58 L116 84 M100 100 L124 150 M100 100 L74 128 L62 150"/>' + arrow("M60 104 C70 96 82 98 90 104");
    if (kind === "wrist") body = head(100, 34) + '<path d="M100 45 L100 100 M100 58 L70 80 L54 70 M100 58 L130 80 L146 70 M100 100 L86 150 M100 100 L114 150"/><circle cx="54" cy="66" r="6"/><circle cx="146" cy="66" r="6"/>' + arrow("M40 54 C34 64 40 76 50 80");
    if (kind === "march") body = head(100, 34) + '<path d="M100 45 L100 100 M100 58 L80 86 M100 58 L120 80 M100 100 L118 122 L110 146 M100 100 L90 150"/><path d="M114 30 L170 30" stroke-dasharray="4 5" stroke-width="2"/>';
    return '<svg viewBox="0 0 200 170" role="img" aria-label="Stick-figure guide: ' + kind + '"><defs><marker id="oeTAr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#B44A34" stroke-width="1.6"/></marker></defs>' + g + body + "</g></svg>";
  }
  function buildTimer(el) {
    var idx = 0, left = STEP_SEC, timer = null;
    el.className = "oe-timer";
    el.innerHTML = '<div class="oe-tfig"></div><div class="oe-tbody"><p class="oe-tstep"></p><h4 class="oe-tname"></h4><p class="oe-tcue"></p><p class="oe-tstop"></p><p class="oe-tclock" aria-live="polite"></p>' +
      '<p class="oe-row"><button class="btn primary" type="button" data-a="go">Start</button> <button class="btn" type="button" data-a="next">Next move</button> <button class="btn" type="button" data-a="reset">Reset</button></p>' +
      '<p class="mb-hint">A guide, not a prescription: move inside a range that feels easy. 6 moves x 30 seconds = 3 minutes.</p></div>';
    var q = function (s) { return el.querySelector(s); };
    function show() {
      var m = MOVES[idx];
      q(".oe-tfig").innerHTML = stick(m.fig);
      q(".oe-tstep").textContent = "Move " + (idx + 1) + " of " + MOVES.length;
      q(".oe-tname").textContent = m.name;
      q(".oe-tcue").textContent = m.cue;
      q(".oe-tstop").textContent = m.stop;
      q(".oe-tclock").textContent = left + " s";
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } q('[data-a="go"]').textContent = "Start"; }
    function tick() {
      left--;
      if (left <= 0) {
        if (idx < MOVES.length - 1) { idx++; left = STEP_SEC; }
        else { left = 0; stop(); show(); q(".oe-tclock").textContent = "Done. Three minutes, six moves."; return; }
      }
      show();
    }
    el.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (!a) return;
      if (a === "go") { if (timer) stop(); else { if (left === 0) { idx = 0; left = STEP_SEC; } timer = setInterval(tick, 1000); e.target.textContent = "Pause"; } }
      if (a === "next") { idx = (idx + 1) % MOVES.length; left = STEP_SEC; show(); }
      if (a === "reset") { stop(); idx = 0; left = STEP_SEC; show(); }
    });
    show();
  }

  function init() {
    rootEl = document.getElementById("break-bench");
    if (rootEl) build();
    var t = document.getElementById("routine-timer");
    if (t) buildTimer(t);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(this);
