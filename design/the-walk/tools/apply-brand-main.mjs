// One-time migration of Main.dc.html onto the returned marks (round 6): header lockup with the scroll ease,
// footer lockup, the Works sponsor section in place of the old support block, and the per-browser pile.
// Every replacement must match exactly once, so a re-run or a drifted file fails loudly instead of half-applying.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headerLockup, footerLockup, sponsorSection, sponsorCss, markCss, MARK_JS } from './brand.mjs';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'project', 'Main.dc.html');
let s = readFileSync(file, 'utf8');
function rep(from, to) {
  const n = typeof from === 'string' ? s.split(from).length - 1 : (s.match(new RegExp(from.source, from.flags.replace('g', '') + 'g')) || []).length;
  if (n !== 1) throw new Error('expected 1 match, found ' + n + ': ' + String(from).slice(0, 90));
  s = s.replace(from, typeof to === 'function' ? to : () => to);
}

// ---------- header and footer marks ----------
rep('<a href="#hi" onClick="{{goHi}}" class="brand" aria-label="Wolfsblvt Works, back to the start"><span class="brand-w">WOLFSBLVT</span><span class="brand-s">WORKS</span></a>',
  '<a href="#hi" onClick="{{goHi}}" class="brand brand-mark" aria-label="Wolfsblvt Works, back to the start">' + headerLockup() + '</a>');
rep('<a href="#hi" onClick="{{goHi}}" class="brand" style="color:#f3e8dc"><span class="brand-w" style="font-size:16px">WOLFSBLVT</span><span class="brand-s">WORKS</span></a>',
  '<a href="#hi" onClick="{{goHi}}" class="brand-foot" aria-label="Wolfsblvt Works, back to the start">' + footerLockup() + '</a>');
rep('.brand-s{', `/* the lockup in the header: hangs over the border at the top, eases into the compact drawing as you scroll */
.brand-mark{align-self:flex-start;position:relative;z-index:2}
.mark-head{display:block;overflow:visible}
.brand-foot{display:inline-block;margin:-6px 0 4px -6px}
.mark-foot{display:block;height:54px;width:auto;overflow:visible}
${markCss()}
.brand-s{`);

// ---------- the sponsor section replaces the old support block ----------
rep(/<section id="help" class="frame sec lift" aria-labelledby="sp-h">[\s\S]*?<\/section>/,
  '<section id="help" class="frame sec lift" aria-labelledby="sp-works-title">\n' + sponsorSection() + '\n</section>');
rep('/* ---------- the pile ---------- */', `/* ---------- sponsor section (Works instance of the shared component) ---------- */
${sponsorCss()}
#help .works-sponsor h2{color:#f3e8dc}
#help .works-sponsor .actions a{transition:transform .2s,border-color .2s,color .2s}
#help .works-sponsor .primary:hover{transform:translateY(-1px);color:#140d14}
#help .works-sponsor .secondary:hover{border-color:#73cae3;color:#73cae3}
/* ---------- the pile ---------- */`);

// ---------- pile: shared daily pile, varied a little per browser; nothing stored ----------
rep(/const SEED_KEY = [^\n]*\nfunction newSeed\(\) [^\n]*\n/,
  `// best-effort variety: a hash of what every request already carries (browser name, version, language). In production the
// Worker takes it from the request headers; it is used once to deal the pile and never stored, logged or sent anywhere.
function browserSeed() { try { return hashStr((navigator.userAgent || '') + '|' + (navigator.language || '')).toString(36); } catch (e) { return ''; } }
${MARK_JS}`);
rep(/  loadSeed\(\) \{[\s\S]*?\n  backToShared = [^\n]*\n/,
  `  loadSeed() {
    const seed = (this.props.pileSeed || 'browser') === 'browser' ? browserSeed() : null;
    if (seed !== this.state.seed) this.setState({ seed });
  }
`);
rep(`<div style="text-align:right"><div class="scribble" style="font-size:19px;transform:rotate(-2deg)">{{pileWhose}}</div><div class="ui" style="font-size:12.5px;color:#9c8c93;margin-top:2px">{{pileDate}}</div>
<sc-if value="{{canDeal}}" hint-placeholder-val="{{ true }}"><button class="deal" type="button" onClick="{{dealOwn}}">deal me my own</button></sc-if>
<sc-if value="{{canShare}}" hint-placeholder-val="{{ false }}"><button class="deal" type="button" onClick="{{backToShared}}">back to everyone’s pile</button></sc-if></div>`,
  `<div style="text-align:right"><div class="scribble" style="font-size:19px;transform:rotate(-2deg)">that’s today’s pile.</div><div class="ui" style="font-size:12.5px;color:#9c8c93;margin-top:2px">{{pileDate}}</div></div>`);
rep(/\.deal\{[^\n]*\n\.deal:hover\{[^\n]*\n/, '');
rep(/      pileWhose: [^\n]*\n      canDeal: [^\n]*\n      canShare: [^\n]*\n      dealOwn: [^\n]*\n/, '');
rep('"pileSeed":{"editor":"enum","default":"on-request","options":["shared","on-request","first-visit"],"section":"The Pile"}',
  '"pileSeed":{"editor":"enum","default":"browser","options":["browser","shared"],"section":"The Pile"},"markTop":{"editor":"range","default":60,"min":44,"max":80,"step":2,"unit":"px","section":"Marks"},"markMotion":{"editor":"boolean","default":true,"section":"Marks"}');

// ---------- render values: the mark follows the header's scroll progress; the sponsor plays once in view ----------
rep('      headStyle: (() => {', '      mark: markVals(this.state.headT, this.props.markTop || 60, W < 640, this.props.markMotion === false || this._reduce),\n      sponsorRef: this.sponsorRef,\n      headStyle: (() => {');
rep('footRef = React.createRef(); navRef = React.createRef();', 'footRef = React.createRef(); navRef = React.createRef(); sponsorRef = React.createRef();');
rep('    this._footIo = new IntersectionObserver(', `    // the shared sponsor component plays its motion once, the first time it is properly in view
    const sp = this.sponsorRef.current;
    if (sp && !this._reduce) { sp.classList.add('will-play'); this._spIo = new IntersectionObserver((es) => { if (es[0].isIntersecting) { sp.classList.add('is-playing'); this._spIo.disconnect(); } }, { threshold: 0.35, rootMargin: '0px 0px -12% 0px' }); this._spIo.observe(sp); }
    this._footIo = new IntersectionObserver(`);
rep('[this._io, this._ioBig, this._heroIo, this._pileIo, this._whoIo, this._footIo]', '[this._io, this._ioBig, this._heroIo, this._pileIo, this._whoIo, this._footIo, this._spIo]');

writeFileSync(file, s);
console.log('Main.dc.html migrated', s.length);
