(() => {
  const { SYM, GLYPH, LUCIDE, LOCK, glyphSvg, C } = window.WORKS_MARKS;
  const SP = window.WORKS_SPONSOR;
  const svg32 = (inner, size, cls = '') => `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${inner}</svg>`;

  const DIRS = [
    {
      k: 'A', name: 'Chip-cut', tag: 'Direction A · carved',
      one: 'WOLFSBLVT already spells itself like a stone inscription — V for U. Lean in: carved capitals, and the V cut as a chip into the material, lit orange from the left and magenta from the right.',
      idea: 'A chip-carved triangle seen from above: three facets meeting at the deepest point. The top facet sits in shadow; the left catches the warm light, the right the pink. The symbol is literally a V.',
      why: 'It is the Smoke &amp; Fireworks thesis made physical — two lights on one precise cut. “Precise in construction” is the geometry; “warm in atmosphere” is the light; “surprising” is that the colours are lighting, not fill.',
      decides: 'That the V is the signature letter. That the brand reads a little classical/inscriptional. That the two accent colours always appear as a lit pair, left warm, right pink.',
      risk: 'On its own it can feel cool and architectural. A downward triangle has neighbours (warning, play, filter); the facets and the colour do the separating, so the mono glyph needs its centre lines.',
      rich: true,
    },
    {
      k: 'B', name: 'Double-V', tag: 'Direction B · drawn',
      one: 'A W is just two Vs (the French still call it “double-vé”). The symbol is a W made from two unequal, overlapping Vs — one orange, one magenta — and the whole wordmark is drawn in the same single stroke.',
      idea: 'Monoline caps on a 24-unit grid, built from the same 2px-round stroke grammar as the icon slot, scaled up. The right V is wider and deeper, like the right side of the site getting more room. Where they cross, one passes over the other.',
      why: 'The most systematic option: wordmark, symbol and glyph are literally one drawing language, so it holds together everywhere — headers, icons, the GitHub avatar — and it draws itself beautifully.',
      decides: 'A geometric, technical voice for the formal mark. A W-shaped symbol, which edges toward the WW monogram the brief kept open but did not choose.',
      risk: 'Of the five, the most “seen before” at a glance — W monograms are everywhere. The weave and the asymmetry carry the identity; lose them and it’s generic. Also the least warm of the typographic options.',
    },
    {
      k: 'C', name: 'Maker’s punch', tag: 'Direction C · stamped',
      one: 'Silversmiths stamp a maker’s mark on everything they make — spoons, cups, rings — without changing the object. That is exactly the relationship Works has with its products. So: a hallmark punch, with the V notched into its edge.',
      idea: 'A rounded punch with a V-shaped notch. In full it carries WOLFS / BLVT stacked; compact, it carries a W. It is always solid — a stamp, not an outline — and on a product page it is pressed in small next to “by”.',
      why: 'It makes the credit on other products feel <i>authored</i> instead of advertised. It’s the most natural “by WOLFSBLVT”. Very robust at 16 px (a notched tile is a strong silhouette).',
      decides: 'That Works’ signature is a badge object. A more craft/maker register, a little industrial. WOLFS / BLVT split in two lines for the full punch.',
      risk: 'Badges are a crowded genre; the notch is what makes it ours — but at a glance a top notch also reads as a speech-bubble pointer. Moving it to a corner, or making it a cut rather than a dip, would be round 2’s first job. If you look for a wolf, the notch also makes two ears: a nice secret or a problem, your call.',
    },
    {
      k: 'D', name: 'Margin note', tag: 'Direction D · annotated',
      one: 'The site’s best move is the correction: a confident printed line and a human scribble next to it. Make that the logo — WOLFSBLVT set firm and heavy, “works” written underneath by hand, in rose.',
      idea: 'Formal heavy caps + a handwritten lowercase “works” with a quick underline. The compact mark is the heavy W, circled by hand the way an editor circles a word. The scribble should be <i>your</i> handwriting, vectorised.',
      why: 'It is unmistakably the same voice as the hero, the nav and the Why. Personal, candid, a bit cheeky, and it keeps the hierarchy (WORKS is still the smaller, secondary word — just written instead of typeset).',
      decides: 'That handwriting is part of the formal identity, not only site decoration. That WORKS appears lowercase in the expressive lockup (formal all-caps remains available).',
      risk: 'Handwriting gets mushy below ~20 px, so the small sizes rely on the circled W. Couples the identity tightly to the site’s current scribble language; if that changes, the logo carries its memory.',
    },
    {
      k: 'E', name: 'Two lights', tag: 'Direction E · relational',
      one: 'Works styles itself around the work. So the mark is not a letter at all: two unequal winds of light — orange from the upper left, magenta from the lower right — holding a space with something in it.',
      idea: 'Two arcs that never mirror, the right one always reaching further, around a centre. In the lockup they hold the wordmark; on a product page they can hold the product’s own thing. The centre is “the work”.',
      why: 'It’s the only mark that expresses the hosting relationship — Works around projects, not on top of them. Great at framing: sponsor sections, social cards, the credit.',
      decides: 'An abstract, non-letter symbol. That the light-boundary language from the site becomes company identity.',
      risk: 'It borrows the most from the Walk, which the sources say is website expression, not Works itself. And the bare glyph flirts with focus/scan icons; the centre dot and unequal arcs have to stay.',
    },
  ];

  /* ---------------- at a glance ---------------- */
  const glance = document.getElementById('glance');
  glance.innerHTML = DIRS.map(d => `
    <div class="gcell">
      <div class="gd">${svg32(SYM[d.k](true, { rich: !!d.rich }), 64)}${svg32(SYM[d.k](true), 32)}${svg32(SYM[d.k](true, { weave: false, sw: 3.6 }), 16)}</div>
      <div class="gl">${svg32(SYM[d.k](false, { rich: !!d.rich }), 64)}${svg32(SYM[d.k](false), 32)}${svg32(SYM[d.k](false, { weave: false, sw: 3.6 }), 16)}</div>
      <div class="gg">${glyphSvg(GLYPH[d.k], 24)}${glyphSvg(GLYPH[d.k], 16)}<span style="font-size:12px;color:var(--label)">glyph · 24 / 16</span></div>
      <div class="gn"><b>${d.k} · ${d.name}</b><br><span style="color:#b7b0bb">${d.tag.split('· ')[1]}</span></div>
    </div>`).join('');

  /* ---------------- direction boards ---------------- */
  const lucideRow = (k, light) => {
    const icons = [LUCIDE.globe, LUCIDE.mail, GLYPH[k], LUCIDE.heart, LUCIDE.rss];
    return `<div class="slot ${light ? 'l' : 'd'}">${icons.map((ic, i) => `<span class="${i === 2 ? 'me' : ''}" title="${i === 2 ? 'Works glyph candidate' : 'Lucide'}">${glyphSvg(ic, 24)}</span>${i === 1 ? '<span class="sep"></span>' : ''}`).join('')}
      <span style="font-size:11px;opacity:.6;margin-left:auto">${light ? 'light' : 'dark'} · 24px</span></div>`;
  };

  const host = document.getElementById('directions');
  host.innerHTML = DIRS.map(d => {
    const L = LOCK[d.k];
    return `
    <section class="board" id="dir-${d.k}" aria-labelledby="h-${d.k}">
      <div class="board-h">
        <div><div class="tag">${d.tag}</div><h3 id="h-${d.k}">${d.k} · ${d.name}</h3><p class="one">${d.one}</p></div>
        <button class="btn replay">Replay ↻</button>
      </div>
      <div class="dgrid">
        <div class="stack">
          <div class="panel pd hero"><p class="cap">Formal lockup · dark (home)</p>${L.stacked(true)}</div>
          <div class="footer-slice"><div class="links"><b>Wolfsblvt Works</b><span>Projects</span><span>Support the work</span><span>The Pile</span><span>Contact</span></div><div class="big">${L.stacked(true)}</div></div>
        </div>
        <div class="stack">
          <div class="panel pl"><p class="cap">Formal lockup · light (authored, not inverted)</p>${L.stacked(false)}</div>
          <div class="panel pd">
            <p class="cap">Symbol · favicon at real size</p>
            <div class="row">
              ${svg32(SYM[d.k](true, { rich: !!d.rich }), 132, 'sym-big')}
              <div class="stack" style="gap:10px">
                <div class="sizes">
                  <figure>${svg32(SYM[d.k](true), 48)}48</figure><figure>${svg32(SYM[d.k](true), 32)}32</figure><figure>${svg32(SYM[d.k](true, { weave: false, sw: 3.6 }), 16)}16</figure>
                  <figure>${svg32(SYM[d.k](true, { mono: true }), 32)}mono</figure>
                </div>
                <div class="tabbar d"><div class="tab d">${svg32(SYM[d.k](true, { weave: false, sw: 3.6 }), 16)} Wolfsblvt Works</div></div>
                <div class="tabbar l"><div class="tab l">${svg32(SYM[d.k](false, { weave: false, sw: 3.6 }), 16)} Wolfsblvt Works</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dgrid" style="margin-top:16px">
        <div class="stack">
          <div class="panel pd"><p class="cap">Horizontal lockup · header</p><div style="max-width:420px">${L.horizontal(true)}</div></div>
          <div>
            <p class="cap">“by WOLFSBLVT” on product pages</p>
            <div class="stack" style="gap:10px">
              <div class="dd-foot"><span>diffdevil · MIT · v0.x</span><span class="credit">${svg32(SYM[d.k](true, { weave: false, sw: 3.6 }), 16)}<span>by <b style="color:#f0f2f5;letter-spacing:.04em">WOLFSBLVT</b></span></span></div>
              <div class="lt-foot"><span>An open-source project from Wolfsblvt Works</span><span class="credit">${svg32(SYM[d.k](false, { weave: false, sw: 3.6 }), 18)}<b style="letter-spacing:.04em">WOLFSBLVT</b></span></div>
            </div>
          </div>
        </div>
        <div class="stack">
          <p class="cap" style="margin:0">wolfsblvt-icons slot · next to real Lucide</p>
          ${lucideRow(d.k, false)}${lucideRow(d.k, true)}
          <div class="row" style="color:var(--soft)">${glyphSvg(GLYPH[d.k], 48)}<span style="font-size:12.5px;color:var(--label);max-width:34ch">24×24, 2px round strokes, currentColor. The trimmed-down symbol, like diffdevil’s glyph — not the full lockup squeezed.</span></div>
          <p class="legend">${L.note}</p>
        </div>
      </div>
      <div class="notes4">
        <div class="note"><h4>The idea</h4><p>${d.idea}</p></div>
        <div class="note tilt"><h4>Why it’s Works</h4><p>${d.why}</p></div>
        <div class="note tilt-l"><h4>What it decides</h4><p>${d.decides}</p></div>
        <div class="note"><h4>Watch out</h4><p>${d.risk}</p></div>
      </div>
    </section>`;
  }).join('');

  /* ---------------- sponsor boards ---------------- */
  const COPY = {
    head: 'Support the work.',
    common: 'Help fund development, maintenance, and the ideas behind Wolfsblvt Works.',
    works: 'Your support gives me more room for the projects that need a longer stretch of attention, and helps cover infrastructure, releases and artwork.',
    smol: 'A little support for smaller images.',
  };
  const banner = (cls, art, add, extra = '') => `
    <section class="sp ${cls}" aria-label="Support the work">
      <div class="sp-art">${art}</div><div class="sp-veil"></div>
      <div class="sp-copy">
        <h4>${COPY.head}</h4>
        <p>${COPY.common}</p>${add ? `<p class="add">${add}</p>` : ''}
        <div class="acts"><a class="p" href="#" onclick="return false">GitHub Sponsors</a><a class="s" href="#" onclick="return false">Ko-fi</a></div>
      </div>${extra}
    </section>`;

  const SPONSORS = [
    { k: 'lit', name: 'Lit edge', fn: SP.litEdge, nightLight: true,
      one: 'A slice of the Works light language carried onto the page: two unequal winds, their fields, glow and line, with the mark standing in the road between them. On Works, Yoru may sit in it.',
      notes: ['Most recognisably “Works” — anyone who has seen the site sees it here.', 'Quietest of the four; it glows rather than pops. Strong on dark hosts, needs the night window on light ones.', 'Animated: the two lines draw in once when the section enters view, then rest.'] },
    { k: 'fw', name: 'Fireworks', fn: SP.fireworks, nightLight: false,
      one: 'Smoke &amp; Fireworks, literally. A burst of short strokes in orange, rose and magenta (one or two cyan sparks) over drifting smoke, with the mark at the centre of the burst.',
      notes: ['The most “popping”. Reads as celebration, which suits an ask that is also a thank-you.', 'Risk: fireworks are festive-generic if overused; one burst, never an animated loop.', 'Animated: rays shoot out once on entering view; sparks settle and stay.'] },
    { k: 'cv', name: 'Carved field', fn: SP.carved, nightLight: true,
      one: 'A lattice of chip-carved Vs, lit orange from the upper left and magenta from the right, fading out under the copy. The pattern is the mark repeated — so it only makes full sense with A.',
      notes: ['Richest texture; reads as material, not decoration. Very ownable if A wins.', 'With other marks it becomes “just a pattern” — the mark sits on a tile instead.', 'Animated: chips catch the light in a wave from right to left.'] },
    { k: 'bt', name: 'Big type', fn: SP.bigType, nightLight: false,
      one: 'The wordmark itself, huge and cropped, traced in a line of light that runs orange to rose to magenta, with “works” scribbled across the corner.',
      notes: ['Works with any symbol direction — it is the name doing the work.', 'Most typographic and calm; the light gradient gives it the pop.', 'Animated: the outline traces itself once.'] },
  ];

  const spHost = document.getElementById('sponsors');
  let currentSym = 'A';
  function renderSponsors() {
    spHost.innerHTML = SPONSORS.map(s => {
      const worksArt = s.fn({ dark: true, sym: currentSym, resident: s.k === 'lit' });
      const ddArt = s.fn({ dark: true, sym: currentSym });
      const ltArt = s.fn({ dark: !s.nightLight ? false : true, sym: currentSym });
      return `
      <section class="board" aria-labelledby="sp-${s.k}">
        <div class="board-h"><div><div class="tag">Sponsor treatment</div><h3 id="sp-${s.k}">${s.name}</h3><p class="one">${s.one}</p></div><button class="btn replay">Replay ↻</button></div>
        <div class="sp-grid">
          <div class="stack">
            <p class="cap">On Works · full Works instance${s.k === 'lit' ? ' · Yoru as guest' : ''}</p>
            ${banner('h-works', worksArt, COPY.works)}
            <div class="row" style="gap:10px;align-items:stretch">${s.notes.map((n, i) => `<div class="note ${i === 1 ? 'tilt' : ''}" style="flex:1;min-width:200px">${n}</div>`).join('')}</div>
          </div>
          <div class="sp-hosts">
            <p class="cap" style="margin:0">On diffdevil · common words only</p>
            ${banner('h-dd', ddArt, '')}
            <p class="cap" style="margin:0">On a light product page · example project line · ${s.nightLight ? 'Works brings its own night' : 're-lit for daylight'}</p>
            ${banner('h-lt' + (s.nightLight ? ' night' : ''), ltArt, COPY.smol)}
          </div>
        </div>
      </section>`;
    }).join('');
    hookReplays(spHost);
  }

  /* ---------------- inventory ---------------- */
  const INV = [
    ['core', 'Formal wordmark', 'Stacked WOLFSBLVT / WORKS. The “real” signature: about pages, press, the Works footer at full size.'],
    ['core', 'Horizontal lockup', 'Header and narrow strips. Keeps the hierarchy on one line.'],
    ['core', 'WOLFSBLVT alone', 'Very compact uses where WORKS would be illegible. The brief already allows it.'],
    ['core', 'Symbol', 'The compact recognition mark. Source for favicon, avatar and stamp.'],
    ['core', 'Favicon set', 'SVG favicon that switches with light/dark, optical 32 and 16 px cuts, 180 touch icon, 512 maskable. Projection belongs to the site-identity work; I supply the drawings.'],
    ['core', 'wolfsblvt-icons glyph', 'A <code>works</code> provider/social glyph, 24×24 line. The trimmed-down symbol, like diffdevil’s. Goes through the icon-standard checks.'],
    ['core', 'Maker credit', '“by WOLFSBLVT” lockup with the small symbol, plus the text credits (“A Wolfsblvt Works product” …) in host type.'],
    ['core', 'Footer wordmark', 'Yes — you were right to suspect it. A large expressive use at the end of Works pages (the cropped slice on each board), and a calm credit size for product footers.'],
    ['r1', 'Sponsor section (web)', 'Semantic, host-adaptive section: real text and links in the host’s type; Works artwork on the right. Shown above.'],
    ['r1', 'Sponsor banner (static SVG)', 'For READMEs, FUNDING and fixed slots. Same art, editable text in the SVG source, ~880 px wide for GitHub. Round 2, from the chosen treatment.'],
    ['prop', 'Mark motion', 'One signature reveal per mark (draw, light-up, stamp, write) for the site header and footer. Motion is first-class here, so the mark should have its own.'],
    ['prop', 'README maker badge', 'Your root READMEs carry a badge strip. A truthful “WOLFSBLVT WORKS” badge in shields height would put the credit where people actually look.'],
    ['prop', 'Social preview template', '1200×630 card for wolfsblvt.works links and GitHub social previews: symbol, name, one line, the light. One template, not per-page art.'],
    ['prop', 'Sponsor profile art', 'Ko-fi page cover and avatar, GitHub Sponsors avatar — the two destinations the banner sends people to should look like they belong to the same place.'],
    ['not', 'Not proposing', 'Merch, store listings, stickers, email signatures, a Yoru logo variant, per-product co-brand lockups. None has a real use yet.'],
  ];
  const label = { core: 'identity', r1: 'support', prop: 'I’d add', not: 'skip' };
  document.getElementById('inventory').innerHTML = INV.map(([s, h, p]) => `<div class="item"><span class="st ${s}">${label[s]}</span><h5>${h}</h5><p>${p}</p></div>`).join('');

  /* ---------------- motion ---------------- */
  const still = new URLSearchParams(location.search).has('still'); // static review captures
  function play(board) { if (still) return; board.classList.remove('play'); void board.offsetWidth; board.classList.add('play'); }
  function hookReplays(root) {
    root.querySelectorAll('.board').forEach(b => {
      b.querySelector('.replay')?.addEventListener('click', () => play(b));
      io.observe(b);
    });
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target.dataset.seen) { e.target.dataset.seen = 1; play(e.target); } }), { threshold: .25 });
  hookReplays(document.getElementById('directions'));

  document.querySelectorAll('[data-sym]').forEach(b => b.addEventListener('click', () => {
    currentSym = b.dataset.sym;
    document.querySelectorAll('[data-sym]').forEach(x => x.setAttribute('aria-pressed', x === b));
    renderSponsors();
  }));
  renderSponsors();
})();
