/** The four curated note variants' tape placements: [first tape, optional second tape]. */
export const NOTE_TAPES: Record<'short-slip' | 'wide-note' | 'torn-sheet' | 'folded-note', readonly [string, string]> = {
  'short-slip': ['left:50%;width:70px;transform:translateX(-50%) rotate(-4deg)', ''],
  'wide-note': ['left:8%;width:56px;transform:rotate(-8deg)', 'right:8%;width:56px;transform:rotate(7deg)'],
  'torn-sheet': ['left:40%;width:84px;transform:rotate(3deg)', ''],
  'folded-note': ['left:12%;width:62px;transform:rotate(-5deg)', ''],
};
