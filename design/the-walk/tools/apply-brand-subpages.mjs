// One-time edit of tools/subpages.mjs for round 6: marks in the shared chrome, contact list types and order,
// contact spacing and hover, and the privacy text for the per-browser pile. Each edit must match exactly once.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), 'subpages.mjs');
let s = readFileSync(file, 'utf8');
function rep(from, to, count = 1) {
  const n = s.split(from).length - 1;
  if (n !== count) throw new Error('expected ' + count + ', found ' + n + ': ' + from.slice(0, 90));
  s = s.split(from).join(to);
}

// ---------- marks ----------
rep("import { fileURLToPath } from 'node:url';\n", "import { fileURLToPath } from 'node:url';\nimport { headerLockup, footerLockup, MARK_JS } from './brand.mjs';\n");
rep('<a href="/" data-route="/" class="brand" aria-label="Wolfsblvt Works, home"><span class="brand-w">WOLFSBLVT</span><span class="brand-s">WORKS</span></a>',
  '<a href="/" data-route="/" class="brand brand-mark" aria-label="Wolfsblvt Works, home">${headerLockup()}</a>', 2);
rep('<a href="/" data-route="/" class="brand" style="color:#f3e8dc"><span class="brand-w" style="font-size:16px">WOLFSBLVT</span><span class="brand-s">WORKS</span></a>',
  '<a href="/" data-route="/" class="brand-foot" aria-label="Wolfsblvt Works, home">${footerLockup()}</a>');
rep("const easeQuint = (t) => t * t * t * (10 + t * (-15 + 6 * t));\n", "const easeQuint = (t) => t * t * t * (10 + t * (-15 + 6 * t));\n${MARK_JS}\n");
// rooms are reached by navigation: the mark is already written there, it only plays on the first load of the walk
rep("      headStyle: 'background:rgb(16 11 17 / '", "      mark: markVals(this.state.headT, this.props.markTop || 60, W < 640, true),\n      headStyle: 'background:rgb(16 11 17 / '");
rep("const TWEAK_WALK = { walkIntensity: { editor: 'enum', default: 'quiet', options: ['quiet', 'standard'], section: 'The Walk' } };",
  "const TWEAK_WALK = { walkIntensity: { editor: 'enum', default: 'quiet', options: ['quiet', 'standard'], section: 'The Walk' }, markTop: { editor: 'range', default: 60, min: 44, max: 80, step: 2, unit: 'px', section: 'Marks' } };");

// ---------- contact: spacing, row hover, type tags, custom order ----------
rep('.ct-facts{margin:0;padding:0;', '.ct-facts{margin:0 0 0 25px;padding:0;');
rep('.combo-opt.active{background:rgb(115 202 227 / 12%)}', '.combo-opt:hover{background:rgb(243 232 220 / 6%)}\n.combo-opt.active{background:rgb(115 202 227 / 12%)}');
rep('.combo-opt .check{color:#73cae3}', '.combo-opt .check{color:#73cae3}\n.combo-opt .ill{flex:none;min-width:64px;text-align:right}');
rep(`// registered: the contract's PRODUCTS today. The rest only show how the list grows; they are not registered slugs.
const PRODUCTS = [
  { slug: 'wolfsblvt-works', label: 'Wolfsblvt Works website', reg: true },
  { slug: 'wolfsblvt-com', label: 'wolfsblvt.com website', reg: true },
  { slug: 'agents', label: "Wolf's Agents", reg: true },
  { slug: 'diffdevil', label: 'diffdevil', icon: 'diffdevil' },
  { slug: 'smolpng', label: 'smolpng' },
  { slug: 'shikkuri', label: 'Shikkuri' },
  { slug: 'lunescence', label: 'Lunescence' },
  { slug: 'xkcd-tracker', label: 'xkcd tracker' },
];`,
`// The list is hand-ordered, so it can change by moving a line: the Works site first, then the projects in the order
// the walk shows them, then the pile's named pieces in Endless order, and the other sites last.
// reg: in the contract's PRODUCTS today. The others show how the list grows; they are not registered slugs yet.
const PRODUCTS = [
  { slug: 'wolfsblvt-works', label: 'Wolfsblvt Works website', type: 'Website', reg: true },
  { slug: 'diffdevil', label: 'diffdevil', type: 'Tool', icon: 'diffdevil' },
  { slug: 'smolpng', label: 'smolpng', type: 'Tool' },
  { slug: 'shikkuri', label: 'Shikkuri', type: 'Project' },
  { slug: 'lunescence', label: 'Lunescence', type: 'Project' },
  { slug: 'xkcd-tracker', label: 'xkcd tracker', type: 'Extension' },
  { slug: 'openai-tunnel', label: 'OpenAI Tunnel auto-updater', type: 'Tool' },
  { slug: 'baumhaus', label: 'Baumhaus', type: 'Project' },
  { slug: 'rpgm-export', label: 'RPG Maker script export', type: 'Tool' },
  { slug: 'wolfsblvt-com', label: 'wolfsblvt.com website', type: 'Website', reg: true },
  { slug: 'agents', label: "Wolf's Agents", type: 'Website', reg: true },
];`);
rep("<sc-if value=\"{{o.ill}}\" hint-placeholder-val=\"{{ false }}\"><span class=\"ill\">illustrative</span></sc-if>",
  '<span class="ill">{{o.type}}</span>');
rep("Object.assign({ id: 'opt-' + p.slug, label: p.label, ill: !p.reg,", "Object.assign({ id: 'opt-' + p.slug, label: p.label, type: p.type,");
rep("const SELECT_OPTIONS = [['wolfsblvt-works', 'Wolfsblvt Works website'], ['wolfsblvt-com', 'wolfsblvt.com website'], ['agents', 'Wolf’s Agents'], ['diffdevil', 'diffdevil'], ['smolpng', 'smolpng'], ['shikkuri', 'Shikkuri'], ['lunescence', 'Lunescence'], ['xkcd-tracker', 'xkcd tracker']]",
  "const SELECT_OPTIONS = [['wolfsblvt-works', 'Wolfsblvt Works website'], ['diffdevil', 'diffdevil'], ['smolpng', 'smolpng'], ['shikkuri', 'Shikkuri'], ['lunescence', 'Lunescence'], ['xkcd-tracker', 'xkcd tracker'], ['openai-tunnel', 'OpenAI Tunnel auto-updater'], ['baumhaus', 'Baumhaus'], ['rpgm-export', 'RPG Maker script export'], ['wolfsblvt-com', 'wolfsblvt.com website'], ['agents', 'Wolf’s Agents']]");
rep("productList: { editor: 'enum', default: 'with illustrative', options: ['with illustrative', 'registered'], section: 'Projects' },",
  "productList: { editor: 'enum', default: 'everything', options: ['everything', 'registered'], section: 'Projects' },");
rep("(this.props.productList || 'with illustrative') !== 'registered'", "(this.props.productList || 'everything') !== 'registered'");

// ---------- privacy: the pile varies a little per browser; nothing stored ----------
rep('<li>Ask for your own pile and your browser keeps one random number for it. That’s all it remembers.</li>',
  '<li>Your pile is shuffled a little by your browser’s name and language. Nothing about it is stored.</li>');
rep(`<h3>Your own pile</h3>
<p>Everyone gets the same pile on the same day. If you’d rather have your own and click “deal me my own”, your browser saves one random value in its local storage, under <code>works.pile.seed</code>. That value is what makes your pile yours for the day. It isn’t connected to you, it never leaves your device, and nothing is tracked with it. It’s just for fun.</p>
<p>Because you asked for it, storing it is part of what you requested (§ 25(2) no. 2 TDDDG). “Back to everyone’s pile” deletes it, and so does clearing this site’s data in your browser.</p>`,
`<h3>Why your pile might look different</h3>
<p>Today’s pile is shuffled a little per browser, so not everyone sees exactly the same one. The shuffle mixes in your browser’s name, version and language, which your browser sends with every request anyway. That mix is used once, to deal the pile, and isn’t stored, logged or sent anywhere else. Anyone with the same browser and language gets the same pile. It’s just for fun.</p>`);

writeFileSync(file, s);
console.log('subpages.mjs updated');
