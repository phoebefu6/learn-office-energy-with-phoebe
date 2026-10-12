# Agent brief - shared by every fan-out page of learn-office-energy-with-phoebe

Filled from `~/.claude/skills/course-builder/references/agent-brief.template.md` on 2026-10-12.
Internal build document: never link it from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   4 options per question:
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-office-energy-with-phoebe/courses/01-nine-hours-of-sitting.html`
   (also look at `04-the-break-bench.html` in the same folder for a second example; never edit either.)
2. The source map: every verified number, its evidence tier, per-session coverage, the seams. Use
   ONLY its numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-office-energy-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block for the palette tokens (first 30 lines only):
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-office-energy-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "learn-office-energy-with-phoebe / Session N of 6", #toggle-all,
#zoom-toggle) · masthead (eyebrow "Learn Office Energy with Phoebe · Session N of 6", h1 with one
`<span class="accent">`, .sub, .chip-row with the level chip (🟢 Foundations for session 2,
🟡 Core for session 3, 🟠 Deeper for sessions 5 and 6), then audience chips and the time chip as in
the template, .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker, .lede, .legend pills,
.callout.win "★ What you walk out with tonight") · 3 Parts, each `section.section#part-N` with
section-kicker (klabel "Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE
figure, `details.card` accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`,
`.caret ▶`), at least one `.callout.example` with `span.ex-pill` "Real world" on the page ·
section#demo-1 Build-along (kicker `.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure,
`.steps > .step`, each with a `.prompt-box.good` carrying a `span.label`; the build-along content
is given in your file outline) · section#exercise Homework (ol, 4 items) · section#quiz (3 x
`.quiz-q data-answer="0-based"`, `p.qtext`, 4 x `button.qopt` "A · ...", `p.qwhy`; one
`p.quiz-score` after the last) · section#official, h2 EXACTLY "What this session teaches, and
where it came from", `.covered > .covered-row` (pill solid ✓ / light ◐ + name + note), then the
`.mono` line EXACTLY "Every fact on this page, and its verification tier, is recorded in the
course's source map." · section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin
this</span>", .grid-2 of six .cheat-item) · `.callout.next` with `.nx-pill` "Next session" ·
footer.pagefoot · `<script src="../assets/app.js?v=1"></script>`.

Head: the template's social meta block with this page's own title/description/url;
`<title>Session N · <Title> - learn office energy with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact phrases above are the only
  self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. For constructed data print "your
  numbers will differ", never invented outputs as if run.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
- Citations in the exact form of the map's appendix; anything marked reported is "reported".
- NEVER "lottery" or "lotteries"; say the mechanism.
- Default to the English word. Any non-English term carries its English in brackets right after it,
  every occurrence. Better: just use the English word.
- Titles, widget ids and class names must not collide with siblings: do not use "A system you
  keep", "The one-page marketing plan", "Is it worth the time?", "Where your week actually goes",
  or any id/class starting `oe-` (reserved for the bench widget). Figure prefixes are yours (below).
- **Health rules.** NOT medical advice: never diagnose, never dose, never promise a symptom outcome
  ("this will fix your back pain" is forbidden; "people in this study reported less fatigue" is
  fine). Name when to see a professional using the NHS lists in the map. Every movement shown has:
  a hand-drawn stick-figure SVG step sequence labelled "guide" (never an AI image, never "demo"),
  reps or seconds, a safe range ("move only as far as feels easy", a range in words), and a
  "Stop if" line. Learner data (any self-check) stays in the browser; say so if you add one (you
  should not need to).
- Quiz `data-answer` values for YOUR page are given in your outline. Use exactly those.
- Never mention breathing techniques or stress physiology beyond a one-line pointer to
  Stress Control (seam).

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink `#1E2A1C` · muted `#566152` · leaf green
primary `#387234` · deep `#24501F` · mid `#2F632B` · soft `#CFE3C8` · tint `#F0F6EC` · faint
`#C9D5C3` · hairline `#E5ECE0` · coral `#B44A34` · coral-ink `#82301F` · coral tint `#FCEEEA` ·
`#FFFFFF` · universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `f<session><letter>` (session 2 uses
  f2a, f2b, f2c, f2d; session 3 f3a...; 5 f5a...; 6 f6a...).
- `<defs>` holds with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), optionally a hachure pattern `id="PHc"` (7x7 userSpaceOnUse,
  rotate(-38), one `#387234` line, opacity .5), optionally an open arrowhead `id="PAr"` (path
  `M1 1 L9 5 L1 9`, fill none, ink stroke 1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)"
  fill="none" stroke="#1E2A1C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
  rects carry a tiny rotation (-4 to 4 degrees for hand-placed items, under 1 for panels). Fills:
  white, tint, the hachure for "the pile" or "the data", and coral ONLY for the one thing the
  figure is about. Never put text directly on the hachure: give it a white rect behind, or use tint.
  One doodle anchor per figure, simple strokes, never a mascot.
- Text classes: `.PH` 800 12px ink heading · `.PL` 600 12px ink label · `.PS` 400 11px muted ·
  `.PB` 800 11px coral-ink · `.PV` 800 16-20px deep value · `.PW` 800 12px white on a primary or
  deep fill only · `.PA` 700 11px primary caption · `.PN` 400 12px muted note.
- ALL `<text>` outside the filtered group, sans stack, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110
  chars; 40px between neighbouring point labels; bottom note 22px below the last row, H clears it by
  8px. When in doubt, shorten.
- Geometry the gate rejects: two filled rects that PARTIALLY overlap (full containment is fine, or
  make pieces abut edge to edge); any path or line crossing a text label; text overlapping text;
  anything outside the viewBox. Stick-figure limbs are paths: keep labels clear of them.
- **Stick figures** (movement guides): head `<circle r="10-12" fill="#FFFFFF"/>`, body and limbs as
  paths inside the filtered group, a coral arrow path showing the direction of movement, a step
  number and a seconds/reps label under each figure. 3 or 4 figures across 880 for a sequence.
  Label the figure "guide" in its heading or note.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM (the cue that fires or
  is skipped, the eye's focus distance, the screen height against eye line, the nerve path through
  the wrist, the risk table), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story (a familiar office pattern, stated as a pattern, never a
fabricated named company or statistic). Constructed case: **Priyanka**, a fictional analyst at an
invented logistics firm who sits about nine hours a day: always say "constructed" the first time
she appears on a page. Never use Phoebe's own work, employers or clients. Do not invent a
statistic; if the map lacks a number, teach the uncertainty instead.

## Cross-links (absolute URLs)

- Tai Chi: https://phoebefu6.github.io/learn-taichi-with-phoebe/
- Yoga Theory: https://phoebefu6.github.io/learn-yoga-theory-with-phoebe/
- Stress Control (breathing, stress physiology): https://phoebefu6.github.io/learn-stress-control-with-phoebe/
- Time Management: https://phoebefu6.github.io/learn-time-management-with-phoebe/
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

Footer left: "Session N of 6 · learn-office-energy-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: `<a href="PREV">← Prev: <title></a> &nbsp;·&nbsp; <a href="NEXT">Next: <title> →</a>`
(session 6: "← Prev: Eyes, wrists and the screen" and `<a href="../index.html">Course home</a>`).

Session titles and files (exact, sentence case, one accent span in h1):
1. What nine hours of sitting really does - 01-nine-hours-of-sitting.html
2. There is no perfect posture - 02-no-perfect-posture.html
3. The three-minute routine - 03-three-minute-routine.html
4. The break bench - 04-the-break-bench.html
5. Eyes, wrists and the screen - 05-eyes-wrists-screen.html
6. Making the break automatic - 06-break-automatic.html
