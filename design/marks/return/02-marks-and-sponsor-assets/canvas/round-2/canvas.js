(async () => {
  const V = window.V2, S = window.V2S;
  const { T, FONTS, iconSvg, glyph, glyphSvg, LUCIDE, stacked, horizontal, wrap, icon } = V;

  const state = { name: 'lit8', sp: 'lit8', cs: 4 };
  const F = (id) => FONTS.find(f => f.id === id);

  // make sure every candidate font is actually loaded before measuring widths
  await Promise.all(FONTS.flatMap(f => [document.fonts.load(`${f.weight} 100px "${f.family}"`, 'WOLFSBLVT')]).concat(document.fonts.load('500 20px "Shantell Sans"')));
  await document.fonts.ready;

  const motionCtl = (m = 'a') => `<span class="mlabel">Motion</span><span class="seg"><button class="btn mbtn" data-mv="a" aria-pressed="${m === 'a'}">A · draw &amp; write</button><button class="btn mbtn" data-mv="b" aria-pressed="${m === 'b'}">B · light &amp; hold</button></span><button class="btn replay">Replay ↻</button>`;
  const boardShell = (id, tag, title, one, body, m = 'a') => `<section class="board" id="${id}" data-m="${m}"><div class="board-h"><div><div class="tag">${tag}</div><h3>${title}</h3><p class="one">${one}</p></div><div class="ctl">${motionCtl(m)}</div></div>${body}</section>`;
  const note = (h, body, cls = '') => `<div class="note ${cls}"><h4>${h}</h4>${body}</div>`;

  /* ---------------- system strip ---------------- */
  function renderSystem() {
    const f = F(state.name);
    document.getElementById('systemStrip').innerHTML = `
      <figure>${iconSvg('I1', 104)}<figcaption><b>Icon</b>holds a dot</figcaption></figure>
      <span class="arrow" aria-hidden="true">→</span>
      <figure style="width:100%">${wrap(horizontal('H1', true, f))}<figcaption><b>Lockup</b>holds the name</figcaption></figure>
      <span class="arrow" aria-hidden="true">→</span>
      <figure style="width:100%"><svg viewBox="0 0 320 140" style="width:100%;height:auto" aria-hidden="true">
        <rect x="1" y="1" width="318" height="138" rx="10" fill="#140d14" stroke="rgb(243 232 220 / 14%)"/>
        ${V.cornerO(T(true), 1.4, 1 + 4.6 * 1.4, 1 + 5 * 1.4)}${V.cornerM(T(true), 1.4, 319 - 4.6 * 1.4, 139 - 4.6 * 1.4)}
        <rect x="30" y="36" width="120" height="12" rx="3" fill="#f3e8dc" opacity=".85"/><rect x="30" y="58" width="150" height="6" rx="3" fill="#d1c0b8" opacity=".5"/><rect x="30" y="70" width="130" height="6" rx="3" fill="#d1c0b8" opacity=".5"/>
        <rect x="30" y="92" width="58" height="18" rx="9" fill="#f3e8dc"/><rect x="94" y="92" width="38" height="18" rx="9" fill="none" stroke="#f3e8dc" opacity=".5"/>
        <text x="306" y="96" text-anchor="end" font-family="${f.family}" font-weight="${f.weight}" font-size="62" fill="none" stroke="#db61aa" stroke-width=".8" opacity=".55" style="font-variation-settings:${f.vs}">BLVT</text>
      </svg><figcaption><b>Sponsor section</b>holds the invitation</figcaption></figure>`;
  }

  /* ---------------- icon ---------------- */
  function renderIcon() {
    const col = (id) => {
      const d = V.ICONS[id];
      const lucide = (dark) => `<div class="slot ${dark ? 'd' : 'l'}">${glyphSvg(LUCIDE.globe)}${glyphSvg(LUCIDE.mail)}<span class="sep"></span><span class="me" title="Works glyph">${glyphSvg(glyph(id))}</span>${glyphSvg(LUCIDE.heart)}<span class="sep"></span><span title="Lucide scan — the neighbour to stay away from" style="opacity:.55">${glyphSvg(LUCIDE.scan)}</span><small style="margin-left:auto">${dark ? 'dark' : 'light'} · 24px · last: Lucide “scan”</small></div>`;
      return `<div class="col">
        <div class="col-h"><b>${id} · ${d.name}</b><span>${id === 'I1' ? 'the dot sits in the middle of the held space' : 'the dot sits low and right, in the magenta’s reach — like WORKS sits off-centre under the name'}</span></div>
        <div class="two" style="gap:12px">
          <div class="panel pd center" style="min-height:220px">${iconSvg(id, 168)}</div>
          <div class="panel pl center" style="min-height:220px">${iconSvg(id, 128, false)}</div>
        </div>
        <div class="panel pd"><p class="cap">Scaled as one piece · stroke grows with size</p>
          <div class="row" style="justify-content:space-between">
            <div class="sizes"><figure>${iconSvg(id, 128)}128</figure><figure>${iconSvg(id, 64)}64</figure><figure>${iconSvg(id, 32)}32</figure><figure>${iconSvg(id, 16)}16</figure><figure>${iconSvg(id, 32, true, { mono: true })}mono</figure></div>
            <div class="col" style="gap:8px"><div class="tabbar d"><div class="tab">${iconSvg(id, 16)} Wolfsblvt Works</div></div><div class="tabbar l"><div class="tab">${iconSvg(id, 16, false)} Wolfsblvt Works</div></div></div>
          </div>
        </div>
        ${lucide(true)}${lucide(false)}
        <div class="row" style="gap:10px">
          <div class="slot d" style="flex:1;justify-content:space-between;font-family:'IBM Plex Sans';font-size:12.5px;background:#151922;border-color:#484d58;color:#aab0bb"><span>diffdevil · MIT</span><span class="row" style="gap:7px">${iconSvg(id, 16)}<span>by <b style="color:#f0f2f5;letter-spacing:.04em">WOLFSBLVT</b></span></span></div>
          <div class="slot l" style="flex:1;justify-content:space-between;font-size:12.5px;background:#fff7ee"><span>A Wolfsblvt Works product</span><span class="row" style="gap:7px">${iconSvg(id, 18, false)}<b style="letter-spacing:.04em">WOLFSBLVT</b></span></div>
        </div>
      </div>`;
    };
    document.getElementById('iconBoard').innerHTML = boardShell('b-icon', 'Icon · two candidates', 'E, held or off-centre',
      'The two corners stay exactly as you picked them. The only fork is where the work sits. Glyph versions keep the 24px, 2px-round, currentColor contract; the Lucide “scan” icon sits at the end of the row on purpose, so you can judge the distance.',
      `<div class="two">${col('I1')}${col('I2')}</div>
       <div class="notes">${note('Motion A · draw', '<p>Each corner draws itself from its open end into the bend — orange first, magenta answering — then the dot lands with a small pop. Reads as “made”.</p>')}
       ${note('Motion B · close in', '<p>The corners arrive from outside the frame and lock into place, then the dot drops in. Reads as “held”. Probably the better loading/splash moment.</p>', 'tilt')}
       ${note('Optical note', '<p>No separate small drawing was needed: the stroke is 3/32 of the box, so at 16px it is a 1.5px line that still reads. Round 3 hints it onto the pixel grid for the 16 and 32 exports.</p>', 'tilt-l')}</div>`);
  }

  /* ---------------- stacked wordmark ---------------- */
  function renderWM() {
    const f = F(state.name);
    const col = (id, title, sub) => `<div class="col"><div class="col-h"><b>${id} · ${title}</b><span>${sub}</span></div>
      <div class="panel pd" style="padding:34px 30px">${wrap(stacked(id, true, f))}</div>
      <div class="panel pl" style="padding:30px 40px">${wrap(stacked(id, false, f))}</div></div>`;
    document.getElementById('wmBoard').innerHTML = boardShell('b-wm', 'Wordmark · two candidates', 'Name in the frame, WORKS written by hand',
      'Both use the icon’s corners stretched around the lockup — same stroke-to-height ratio as the icon, so the corners get heavier as the lockup gets bigger. The fork is whether WORKS is inside the held space or a note written outside it.',
      `<div class="two">${col('WM1', 'Inside', 'the frame holds the name and the note together')}${col('WM2', 'Margin note', 'the frame holds only the name; WORKS is written past the magenta corner')}</div>
       <div class="notes">${note('Motion A · draw &amp; write', '<p>The name is there almost at once; the corners draw; then WORKS is written letter by letter, the big W first, and the underline is the last flick.</p>')}
       ${note('Motion B · light &amp; hold', '<p>The name starts dim and a band of light runs across it, orange to magenta. The corners close in around it, and WORKS is scribbled quickly at the end.</p>', 'tilt')}
       ${note('About the handwriting', '<p>The WORKS here is my hand-drawn stroke set: capitals, a taller W, one stroke per letter so it can really be written on screen. If you write it yourself, I’ll swap your strokes in. Each letter needs to be a single stroke for the write-on to work.</p>', 'tilt-l')}</div>`);
  }

  /* ---------------- horizontal ---------------- */
  function renderH() {
    const f = F(state.name);
    const col = (id, title, sub) => {
      const rd = horizontal(id, true, f);
      return `<div class="col"><div class="col-h"><b>${id} · ${title}</b><span>${sub}</span></div>
        <div class="panel pd" style="padding:30px">${wrap(rd)}<p class="ratio" style="margin:12px 0 0">width ÷ cap height: <b>${rd.ratio.toFixed(1)}</b></p></div>
        <div class="panel pl" style="padding:26px 30px">${wrap(horizontal(id, false, f))}</div>
        <p class="cap" style="margin:6px 0 0">In a site header at real size</p>
        <div class="hdr d"><svg class="lg" viewBox="${rd.vb.join(' ')}" aria-label="Wolfsblvt Works">${rd.svg}</svg><nav><span>Hi</span><span>What</span><span>Why</span><span>Who</span><span>Help</span></nav></div>
        <div class="hdr l"><svg class="lg" viewBox="${horizontal(id, false, f).vb.join(' ')}" aria-label="Wolfsblvt Works">${horizontal(id, false, f).svg}</svg><nav><span>Projects</span><span>Support</span><span>Contact</span></nav></div>
      </div>`;
    };
    document.getElementById('hBoard').innerHTML = boardShell('b-h', 'Horizontal · two candidates', 'Corner, name, WORKS, corner',
      'No separate icon: the orange corner opens the lockup and the magenta corner closes it, at the height of the name. H1 lets WORKS sit a touch below, after the name. H2 writes it over the name’s right end, which is what makes it narrower.',
      `<div class="two">${col('H1', 'Subscript', 'WORKS after the name, slightly lower, with its line')}${col('H2', 'Written over', 'WORKS scribbled across the end of the name, lower')}</div>
       <div class="notes">${note('Width', '<p>The ratio under each dark panel is the whole lockup’s width divided by the name’s cap height, so it’s font-independent and comparable. The font bench below lists it for every font.</p>')}
       ${note('Legibility of H2', '<p>WORKS gets a thin halo in the background colour where it crosses the letters, so it reads as written <i>on top</i>. Without it the rose disappears into the bold strokes.</p>', 'tilt')}
       ${note('Motion', '<p>Same A/B as the wordmark. In a header I’d play it once per visit, on the first load, and never again on navigation.</p>', 'tilt-l')}</div>`);
  }

  /* ---------------- font bench ---------------- */
  function renderBench() {
    const rows = FONTS.map(f => {
      const a = horizontal('H1', true, f), b = horizontal('H2', true, f);
      return `<div class="bl"><b>${f.label}</b><button class="btn usefont" data-f="${f.id}" aria-pressed="${state.name === f.id}">use for name</button></div>
        <div class="cell ${state.name === f.id ? 'sel' : ''}">${wrap(a, '')}</div>
        <div class="cell ${state.name === f.id ? 'sel' : ''}">${wrap(b, '')}</div>
        <div class="ratio">H1 <b>${a.ratio.toFixed(1)}</b><br>H2 <b>${b.ratio.toFixed(1)}</b></div>`;
    }).join('');
    document.getElementById('bench').innerHTML = `<div class="board-h"><div><div class="tag">Measured live</div><h3>Seven heavy serifs, same cap height</h3><p class="one">Literata 800 is the sponsor font you liked. The others are narrower or more characterful options, all free Google Fonts. You can set the sponsor and the name independently in the toolbar — a narrower relative for the name while the sponsor keeps Literata is a real option.</p></div></div>
      <div class="bench"><span class="bh">Font</span><span class="bh">H1 · subscript</span><span class="bh">H2 · written over</span><span class="bh">width ÷ cap</span>${rows}</div>`;
    document.querySelectorAll('.usefont').forEach(b => b.addEventListener('click', () => { state.name = b.dataset.f; syncSelects(); renderAllMarks(); }));
  }

  /* ---------------- sponsor ---------------- */
  const COPY = {
    head: 'Support the work.',
    common: 'Help fund development, maintenance, and the ideas behind Wolfsblvt Works.',
    works: 'Your support gives me more room for the projects that need a longer stretch of attention, and helps cover infrastructure, releases and artwork.',
    smol: 'A little support for smaller images.',
  };
  function banner(variant, host, dark, add) {
    const f = F(state.sp), s = state.cs, veil = { 'h-works': '#140d14', 'h-dd': '#151922', 'h-lt': '#fff7ee' }[host];
    return `<section class="sp ${host}" style="--pad:${s >= 4 ? 60 : 42}px" aria-label="Support the work">
      <div class="sp-art">${S.art(variant, dark, f)}</div><div class="sp-veil"></div>
      ${S.corners(dark, s)}${S.worksNote(dark, s, veil)}
      <div class="sp-copy"><h4>${COPY.head}</h4><p>${COPY.common}</p>${add ? `<p class="add">${add}</p>` : ''}
        <div class="acts"><a class="p" href="#" onclick="return false">GitHub Sponsors</a><a class="s" href="#" onclick="return false">Ko-fi</a></div></div>
    </section>`;
  }
  function renderSp() {
    const block = (v, title, sub) => `<div class="col"><div class="col-h"><b>${v} · ${title}</b><span>${sub}</span></div>
      <p class="cap" style="margin:0">On Works · full Works instance</p>${banner(v, 'h-works', true, COPY.works)}
      <div class="two" style="gap:14px"><div class="col" style="gap:8px"><p class="cap" style="margin:0">On diffdevil · common words only</p>${banner(v, 'h-dd', true, '')}</div>
      <div class="col" style="gap:8px"><p class="cap" style="margin:0">On a light page · example project line</p>${banner(v, 'h-lt', false, COPY.smol)}</div></div></div>`;
    document.getElementById('spBoard').innerHTML = boardShell('b-sp', 'Sponsor · two candidates', 'Big Type, held',
      'The colour run now starts where the letters become visible, so orange shows on the left of the type and magenta on the right. The corners are the icon’s, pinned to the section’s corners at 64 or 128px icon scale (toolbar). WORKS sits just inside the magenta corner, its underline running toward the corner’s foot.',
      `<div class="col" style="gap:34px">${block('SP1', 'Outline', 'the name traced in one line of light, as you liked it')}${block('SP2', 'Lit edges', 'solid letters, lit orange from the top-left and magenta from the bottom-right — the same light as the corners')}</div>
       <div class="notes">${note('Motion A · trace', '<p>The corners draw, the outline is drawn on left to right, then WORKS is written. Calm, once, on entering view.</p>')}
       ${note('Motion B · sweep', '<p>The type is there; a band of light runs along it while the corners close in, then WORKS is scribbled. More “pop”. Could replay on hover or focus of the section, which suits “selective proximity”.</p>', 'tilt')}
       ${note('Corners: 64 vs 128', '<p>At 128 the corners have real presence and need 60px of padding. At 64 they become a quiet signature and the copy can sit closer. On the narrow diffdevil and light versions you can see where each starts to crowd.</p>', 'tilt-l')}</div>`, 'b');
  }

  /* ---------------- closing notes ---------------- */
  document.getElementById('takeNote').innerHTML = `<h4>My read</h4>
    <p><b>Icon:</b> I2 · off-centre. The dot sitting low-right is the same gesture as WORKS sitting low-right under the name. It gives the whole family one shared move, and it’s a little less symmetric, so it moves further from “focus” and “scan” icons.</p>
    <p><b>Wordmark:</b> WM1 · inside, as the formal signature. WM2 is more charming, but WORKS ends up too detached to read as part of the name at small sizes.</p>
    <p><b>Horizontal:</b> H2 · written over. You were right: it is far less wide, and the bold letters can take the scribble with a halo. H1 stays as the fallback when the background is busy.</p>
    <p><b>Sponsor:</b> SP1 at 128px corners, motion B. SP2 is more of an object; SP1 is quieter and lets the host page lead.</p>
    <p><b>Font:</b> the bench surprised me. Across all seven heavy serifs the horizontal lockup only varies by about 11% in width (DM Serif Display is the narrowest). Writing WORKS over the name (H2) saves about 13% on its own. So the width problem is solved by the layout, not the font, and Literata 800, which has the most Works in it, can stay. H2 in DM Serif is the narrowest combination, about 25% narrower than H1 in Literata, if you ever need it.</p>`;
  document.getElementById('openNote').innerHTML = `<h4>Still yours to choose</h4>
    <ul><li>I1 or I2 · WM1 or WM2 · H1 or H2 · SP1 or SP2 — or a mix.</li>
    <li>Motion A or B per piece. They can differ: e.g. icon B, sponsor B, wordmark A.</li>
    <li>Name font, and whether the sponsor shares it.</li>
    <li>Sponsor corners at 64 or 128.</li>
    <li>Your handwriting for WORKS, or keep mine.</li></ul>
    <p style="margin-top:10px">After that, round 3 is production: outlined master SVGs, pixel-hinted favicons, the glyph through the icon standard, the sponsor section as a reusable component plus the static README SVG, and the usage reference.</p>`;

  /* ---------------- wiring ---------------- */
  function syncSelects() {
    for (const [sel, key] of [['fontName', 'name'], ['fontSp', 'sp']]) document.getElementById(sel).value = state[key];
  }
  for (const sel of ['fontName', 'fontSp']) {
    const el = document.getElementById(sel);
    el.innerHTML = FONTS.map(f => `<option value="${f.id}">${f.label}</option>`).join('');
    el.addEventListener('change', () => { state[sel === 'fontName' ? 'name' : 'sp'] = el.value; sel === 'fontName' ? renderAllMarks() : (renderSp(), wire(document.getElementById('b-sp'))); });
  }
  document.querySelectorAll('[data-cs]').forEach(b => b.addEventListener('click', () => {
    state.cs = +b.dataset.cs; document.querySelectorAll('[data-cs]').forEach(x => x.setAttribute('aria-pressed', x === b));
    renderSp(); wire(document.getElementById('b-sp')); play(document.getElementById('b-sp'));
  }));

  const still = new URLSearchParams(location.search).has('still');
  function play(board) { if (still || !board) return; board.classList.remove('play'); void board.offsetWidth; board.classList.add('play'); }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target.dataset.seen) { e.target.dataset.seen = 1; play(e.target); } }), { threshold: .2 });
  function wire(board) {
    board.querySelector('.replay')?.addEventListener('click', () => play(board));
    board.querySelectorAll('.mbtn').forEach(b => b.addEventListener('click', () => {
      board.dataset.m = b.dataset.mv; board.querySelectorAll('.mbtn').forEach(x => x.setAttribute('aria-pressed', x === b)); play(board);
    }));
    io.observe(board);
  }
  function renderAllMarks() {
    const keep = {}; ['b-icon', 'b-wm', 'b-h', 'b-sp'].forEach(id => { const b = document.getElementById(id); if (b) keep[id] = b.dataset.m; });
    renderSystem(); renderIcon(); renderWM(); renderH(); renderBench(); renderSp();
    ['b-icon', 'b-wm', 'b-h', 'b-sp'].forEach(id => { const b = document.getElementById(id); if (keep[id]) { b.dataset.m = keep[id]; b.querySelectorAll('.mbtn').forEach(x => x.setAttribute('aria-pressed', x.dataset.mv === keep[id])); } wire(b); });
  }
  syncSelects();
  renderAllMarks();
  wire(document.getElementById('sys'));
  document.getElementById('replayAll').addEventListener('click', () => document.querySelectorAll('.board[data-m]').forEach(play));
})();
