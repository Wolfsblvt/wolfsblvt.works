(async () => {
  const V = window.V3, S = window.V3S;
  const { T, FONTS, iconSvg, icon, GLYPH, glyphSvg, LUCIDE, lockup, wrap } = V;
  const state = { font: 'abr' };
  const F = () => FONTS.find(f => f.id === state.font);

  await Promise.all(FONTS.map(f => document.fonts.load(`${f.weight} 100px "${f.family}"`, 'WOLFSBLVT')));
  await document.fonts.ready;

  const note = (h, body, cls = '') => `<div class="note ${cls}"><h4>${h}</h4>${body}</div>`;
  const shell = (id, tag, title, one, body, extra = '') => `<section class="board" id="${id}"><div class="board-h"><div><div class="tag">${tag}</div><h3>${title}</h3><p class="one">${one}</p></div><div class="row">${extra}<button class="btn replay">Replay ↻</button></div></div>${body}</section>`;
  const root = document.documentElement;
  const cssNum = (v) => parseFloat(getComputedStyle(root).getPropertyValue(v));

  /* ---------------- timeline ---------------- */
  function renderTimeline() {
    const sweep = cssNum('--sweep'), ws = cssNum('--ws'), wl = cssNum('--wl'), after = cssNum('--after'), corner = cssNum('--corner');
    const writeEnd = after + 5 * ws + .04 + .36, end = Math.max(after + sweep, writeEnd) + .2;
    const pct = (s) => (s / end * 100).toFixed(2) + '%';
    const seg = (a, b, c) => `<div class="seg" style="left:${pct(a)};width:calc(${pct(b - a)});background:${c}"></div>`;
    const ticks = []; for (let s = 0; s <= end; s += .5) ticks.push(`<span style="left:${pct(s)}">${s.toFixed(1)}s</span>`);
    document.getElementById('timeline').innerHTML = `
      <span>Orange corner</span><div class="track">${seg(.05, .05 + corner, 'var(--orange)')}</div>
      <span>Magenta corner</span><div class="track">${seg(.05 + cssNum('--stagger'), .05 + cssNum('--stagger') + corner, 'var(--magenta)')}</div>
      <span>Dot (icon only)</span><div class="track">${seg(after - .05, after + .45, '#f3e8dc')}</div>
      <span>WOLFSBLVT lights up</span><div class="track">${seg(after, after + sweep, 'linear-gradient(90deg,#3a2b33,var(--orange),var(--magenta))')}</div>
      <span>WORKS is written</span><div class="track">${seg(after, writeEnd, 'var(--rose)')}</div>
      <span></span><div class="ticks">${ticks.join('')}</div>`;
  }

  /* ---------------- icon ---------------- */
  function renderIcon() {
    const lucide = (dark) => `<div class="slot ${dark ? 'd' : 'l'}">${glyphSvg(LUCIDE.github)}${glyphSvg(LUCIDE.mail)}<span class="me" title="Works glyph">${glyphSvg(GLYPH)}</span>${glyphSvg(LUCIDE.heart)}${glyphSvg(LUCIDE.globe)}<small>${dark ? 'dark' : 'light'} · 24px</small></div>`;
    const guide = (size, dot) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${icon(true, { dot })}<g class="g" stroke="#73cae3" stroke-width=".25" opacity=".8"><path d="M16 2V30M2 16H30"/><circle cx="${dot[0]}" cy="${dot[1]}" r=".5" fill="#73cae3"/></g></svg>`;
    document.getElementById('iconBoard').innerHTML = shell('b-icon', 'Icon · final candidate', 'Held, slightly off-centre',
      'The dot sits halfway between round 2’s two candidates: about 1.2 units right and down of true centre on a 32-unit grid. Toggle the guides to see it; without them it just feels settled. The corners are now true circular arcs (radius 8 and 12.4), which is what lets the sponsor section’s border match them exactly.',
      `<div class="two">
        <div class="col">
          <div class="two" style="gap:12px"><div class="panel pd center" style="min-height:240px">${iconSvg(176)}</div><div class="panel pl center" style="min-height:240px">${iconSvg(132, false)}</div></div>
          <div class="panel pd"><p class="cap">Scaled as one piece</p><div class="row" style="justify-content:space-between">
            <div class="sizes"><figure>${iconSvg(128)}128</figure><figure>${iconSvg(64)}64</figure><figure>${iconSvg(32)}32</figure><figure>${iconSvg(16)}16</figure><figure>${iconSvg(32, true, { mono: true })}mono</figure></div>
            <div class="col" style="gap:8px"><div class="tabbar d"><div class="tab">${iconSvg(16)} Wolfsblvt Works</div></div><div class="tabbar l"><div class="tab">${iconSvg(16, false)} Wolfsblvt Works</div></div></div></div></div>
        </div>
        <div class="col">
          <div class="panel pd cmp"><p class="cap">Round 2’s two, and the one between</p><div class="three" style="align-items:end">
            <figure>${guide(120, [16, 16.2])}I1 · held</figure><figure style="color:var(--label-strong)">${guide(120, V.DOT)}<b>chosen</b></figure><figure>${guide(120, [18.3, 18.5])}I2 · off-centre</figure></div>
            <div class="row" style="margin-top:14px"><button class="btn" id="guides" aria-pressed="false">Show centre guides</button></div></div>
          ${lucide(true)}${lucide(false)}
          <div class="row" style="gap:10px">
            <div class="slot d" style="flex:1;justify-content:space-between;font-family:'IBM Plex Sans';font-size:12.5px;background:#151922;border-color:#484d58;color:#aab0bb"><span>diffdevil · MIT</span><span class="row" style="gap:7px">${iconSvg(16)}<span>by <b style="color:#f0f2f5;letter-spacing:.04em">WOLFSBLVT</b></span></span></div>
            <div class="slot l" style="flex:1;justify-content:space-between;font-size:12.5px;background:#fff7ee"><span>A Wolfsblvt Works product</span><span class="row" style="gap:7px">${iconSvg(18, false)}<b style="letter-spacing:.04em">WOLFSBLVT</b></span></div>
          </div>
        </div>
      </div>
      <div class="notes">${note('Motion', '<p>Corners draw (orange, then magenta answering), then the dot pops in at the moment the corners finish — the same beat at which the name would start lighting in the lockup.</p>')}
      ${note('Glyph', '<p>The 24px version uses the same arcs and the same slight offset (12.8, 13). Stroke, caps and currentColor follow the wolfsblvt-icons contract; it still needs the package’s own checks in production.</p>', 'tilt')}</div>`);
    document.getElementById('guides').addEventListener('click', (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); document.getElementById('b-icon').classList.toggle('guides', on); });
  }

  /* ---------------- lockup ---------------- */
  function renderLock() {
    const f = F();
    const col = (id, title, sub) => {
      const d = lockup(id, true, f), l = lockup(id, false, f);
      const hdr = (dark, h) => { const r = dark ? d : l; return `<div class="hdr ${dark ? 'd' : 'l'}"><svg class="lg" style="height:${h}px" viewBox="${r.vb.join(' ')}" role="img" aria-label="Wolfsblvt Works">${r.svg}</svg><nav>${dark ? '<span>Hi</span><span>What</span><span>Why</span><span>Who</span>' : '<span>Projects</span><span>Support</span><span>Contact</span>'}</nav></div>`; };
      return `<div class="col"><div class="col-h"><b>${title}</b><span>${sub}</span></div>
        <div class="panel pd" style="padding:30px">${wrap(d)}<p class="ratio" style="margin:12px 0 0">width ÷ cap height: <b>${d.ratio.toFixed(1)}</b></p></div>
        <div class="panel pl" style="padding:26px 30px">${wrap(l)}</div>
        <p class="cap" style="margin:6px 0 0">In a site header · 44px and 32px tall</p>${hdr(true, 44)}${hdr(false, 44)}${hdr(true, 32)}</div>`;
    };
    document.getElementById('lockBoard').innerHTML = shell('b-lock', 'Lockup · H2', 'Full, and a header version',
      'Your idea for the header: WORKS written bigger and lower, across the end of the name and over the magenta corner piece. If the header version also holds at full size, we may only need one.',
      `<div class="two">${col('H2', 'H2 · full', 'WORKS over the end of the name (round 2)')}${col('H2s', 'H2 · header', 'WORKS bigger and lower, over the name and the magenta corner')}</div>
       <div class="notes">${note('What changed at header size', '<p>At 32–44px the full version’s WORKS falls to about 8px letters. The header version makes it about a third bigger, with a thicker stroke and halo, so it survives. The corners don’t change: they’re part of the name’s height.</p>')}
       ${note('Abril Fatface', '<p>Its thin hairlines and very heavy stems give WORKS clear room to cross the letters: the scribble sits in the gaps instead of fighting a uniform weight. It is also narrower than Literata, so the lockup got shorter for free.</p>', 'tilt')}</div>`);
  }

  /* ---------------- wordmark ---------------- */
  function renderWM() {
    const f = F();
    const col = (id, title, sub) => `<div class="col"><div class="col-h"><b>${title}</b><span>${sub}</span></div>
      <div class="panel pd" style="padding:40px 34px">${wrap(lockup(id, true, f))}</div>
      <div class="panel pl" style="padding:34px 40px">${wrap(lockup(id, false, f))}</div></div>`;
    document.getElementById('wmBoard').innerHTML = shell('b-wm', 'Wordmark · two candidates', 'Over the corner, or just the lockup',
      'WM3 is WM2 with WORKS pulled up so it’s written over the magenta corner: still below the name, not as high as in the lockup. The other option is your fallback: the lockup simply is the wordmark.',
      `<div class="two">${col('WM3', 'WM3 · over the corner', 'WORKS across the magenta corner, below the name')}${col('H2', 'The lockup as wordmark', 'one mark for everything: “because it just works”')}</div>
       <div class="notes">${note('My read', '<p>The lockup-as-wordmark wins. WM3 works, but it adds a second arrangement that people would have to learn, and the difference is too small to earn it. One mark at two drawing sizes (full and header) is simpler and stronger.</p>')}</div>`);
  }

  /* ---------------- sponsor ---------------- */
  const COPY = {
    head: 'Support the work.',
    common: 'Help fund development, maintenance, and the ideas behind Wolfsblvt Works.',
    works: 'Your support gives me more room for the projects that need a longer stretch of attention, and helps cover infrastructure, releases and artwork.',
    smol: 'A little support for smaller images.',
  };
  function banner(host, dark, add, veil) {
    const f = F(), s = 4, r = S.radii(s);
    return `<div class="spw"><section class="sp ${host}" style="border-top-left-radius:${r.tl}px;border-bottom-right-radius:${r.br}px" aria-label="Support the work">
      <div class="sp-art">${S.art(dark, f)}</div><div class="sp-veil"></div>
      <div class="sp-copy"><h4>${COPY.head}</h4><p>${COPY.common}</p>${add ? `<p class="add">${add}</p>` : ''}
        <div class="acts"><a class="p" href="#" onclick="return false">GitHub Sponsors</a><a class="s" href="#" onclick="return false">Ko-fi</a></div></div>
    </section>${S.corners(dark, s)}${S.worksNote(dark, s, veil)}</div>`;
  }
  function renderSp() {
    document.getElementById('spBoard').innerHTML = shell('b-sp', 'Sponsor · final candidate', 'Lit edges, held by the border itself',
      'The corners now lie on the section’s own edges, and the section’s top-left and bottom-right radii are the corners’ bend radii (32px and 50px at the 128px scale), so border and stroke are one curve. The letters wait dark, then the same light pass as the lockup lights them while WORKS is written.',
      `<div class="col" style="gap:30px">
        <div class="col" style="gap:8px"><p class="cap" style="margin:0">On Works · full Works instance</p>${banner('h-works', true, COPY.works, '#140d14')}</div>
        <div class="two" style="gap:18px">
          <div class="col" style="gap:8px"><p class="cap" style="margin:0">On diffdevil · common words only</p>${banner('h-dd', true, '', '#151922')}</div>
          <div class="col" style="gap:8px"><p class="cap" style="margin:0">On a light page · example project line</p>${banner('h-lt', false, COPY.smol, '#fff7ee')}</div>
        </div>
        <div class="col" style="gap:8px"><p class="cap" style="margin:0">Small screens · WORKS written over the corner piece, with its outline</p>
          <div class="row" style="align-items:flex-start;gap:24px"><div class="phone">${banner('h-works', true, COPY.works, '#140d14')}</div><div class="phone" style="background:#e9e3da">${banner('h-lt', false, COPY.smol, '#fff7ee')}</div></div></div>
      </div>
      <div class="notes">${note('Hosts keep their corners', '<p>Only the two held corners take the Works radii; the host keeps its own radius on the other two (diffdevil’s square, the light page’s 24px). That asymmetry is the signature.</p>')}
      ${note('Small screens', '<p>Below about 600px the section switches to one column: the type sits behind the copy at low strength, and WORKS moves onto the magenta corner with its halo, clear of the buttons.</p>', 'tilt')}
      ${note('Static README version', '<p>The SVG for repositories will be this same composition frozen at its end state: lit letters, both corners, WORKS. Text stays editable inside the SVG source.</p>', 'tilt-l')}</div>`);
  }

  /* ---------------- notes ---------------- */
  document.getElementById('takeNote').innerHTML = `<h4>My read</h4>
    <p><b>One mark:</b> H2 as both lockup and wordmark, drawn in two sizes: <i>full</i> for anything 60px and up, <i>header</i> below that. Check whether the header version alone holds at full size; if it does, that’s one drawing for everything.</p>
    <p><b>Icon:</b> the in-between dot is right. With the guides off I can’t point at the offset, but the dot reads as settled into the magenta’s curve instead of floating.</p>
    <p><b>Sponsor:</b> the corners on the border were the missing piece. Now the section itself becomes the icon’s shape, which means even a product page with no other Works trace visibly carries the signature.</p>`;
  document.getElementById('nextNote').innerHTML = `<h4>Next: production</h4>
    <ul><li>Your timing numbers from the toolbar (or “defaults are fine”).</li>
    <li>Full vs header vs one drawing for both.</li>
    <li>WORKS in your handwriting, or keep mine.</li></ul>
    <p style="margin-top:10px">Then I build the real family: outlined master SVGs (Abril Fatface is SIL OFL, so outlining it is allowed), favicon set with the light/dark SVG, the 24px glyph through the wolfsblvt-icons checks, the motion as one small CSS + SVG snippet, the sponsor section as a reusable component plus the static README SVG, and the usage reference with the return note.</p>`;

  /* ---------------- wiring ---------------- */
  const fontSel = document.getElementById('font');
  fontSel.innerHTML = FONTS.map(f => `<option value="${f.id}">${f.label}${f.id === 'abr' ? ' (chosen)' : ''}</option>`).join('');
  fontSel.value = state.font;
  fontSel.addEventListener('change', () => { state.font = fontSel.value; renderAll(); });

  for (const [id, unit, fmt] of [['dim', '', v => (+v).toFixed(2)], ['sweep', 's', v => (+v).toFixed(1) + 's'], ['ws', 's', v => (+v).toFixed(2) + 's']]) {
    const el = document.getElementById(id), out = el.nextElementSibling;
    el.addEventListener('input', () => { root.style.setProperty('--' + id, el.value + unit); out.textContent = fmt(el.value); renderTimeline(); });
    el.addEventListener('change', () => document.querySelectorAll('.board').forEach(play));
  }

  const still = new URLSearchParams(location.search).has('still');
  function play(b) { if (still || !b) return; b.classList.remove('play'); void b.offsetWidth; b.classList.add('play'); }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target.dataset.seen) { e.target.dataset.seen = 1; play(e.target); } }), { threshold: .15 });
  function wire(b) { b.querySelector('.replay')?.addEventListener('click', () => play(b)); io.observe(b); }
  function renderAll() { renderIcon(); renderLock(); renderWM(); renderSp(); ['b-icon', 'b-lock', 'b-wm', 'b-sp'].forEach(id => wire(document.getElementById(id))); }
  renderTimeline(); renderAll();
  document.getElementById('replayAll').addEventListener('click', () => document.querySelectorAll('.board').forEach(play));
})();
