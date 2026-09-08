// Turns an order into the lines the Live Orders and Kitchen boards render.
//
// PREFERRED PATH: `order_items` rows, written by /api/order from ids it looked
// up and priced itself. Use `linesFromOrder()` — it reads those rows when they
// exist.
//
// FALLBACK: orders created before structured orders landed exist only as a
// packed string in `table_requests.item_name`:
//   x2 Kebab Brödet [Fläsk, − lök | no mayo]
//    │  │             │      │       └ this item's note
//    │  │             │      └ removals (−) and extras (+)
//    │  │             └ chosen options
//    │  └ item name
//    └ quantity
// Parsing a string we generated ourselves is inherently fragile — it caused
// four separate bugs (newlines in notes, parentheses in dish names, the note
// rendering twice, options misread as choices). Anything that does not parse
// cleanly falls back to `raw`, so a kitchen never loses order information to a
// regex that did not match.
//
// Once no pre-migration rows fall inside either board's window, everything
// below `linesFromOrder` can be deleted.

export interface OrderLine {
  /** null when the guest ordered a single unit (no "x1" prefix is emitted) */
  qty: number | null;
  name: string;
  /** Chosen options, e.g. "Fläsk" */
  choices: string[];
  /** Ingredients the guest removed — the highest-risk part of a ticket */
  removed: string[];
  /** Ingredients the guest asked extra of */
  extra: string[];
  /** Free-text note attached to this specific item */
  note: string | null;
  /** The original line, for fallback rendering */
  raw: string;
}

const QTY_RE = /^x(\d{1,3})\s+/i;
// Options ride in a trailing "[...]" group. Square brackets specifically, because
// dish names legitimately contain parentheses — "Sharing (1 pizza för 2 personer)"
// was being read as a chosen option, and with a real choice present the choice
// was demoted to a note. Nothing else in a dish name uses square brackets.
const TRAILING_OPTS_RE = /\s*\[([^\][]*)\]\s*$/;

function emptyLine(raw: string): OrderLine {
  return { qty: null, name: raw, choices: [], removed: [], extra: [], note: null, raw };
}

/** Split one display line into its parts. Never throws. */
export function parseOrderLine(raw: string): OrderLine {
  const line = raw.trim();
  if (!line) return emptyLine(raw);

  let rest = line;

  // Peel the trailing "[...]" payload, if present. Everything left is the dish
  // name — including any parentheses it contains.
  let payload = "";
  const om = rest.match(TRAILING_OPTS_RE);
  if (om && om.index !== undefined) {
    payload = om[1];
    rest = rest.slice(0, om.index).trimEnd();
  }

  // Payload is "options | note". Split on the FIRST pipe only, so a note may
  // contain anything except the delimiters themselves.
  const pipe = payload.indexOf("|");
  const optionBlob = pipe === -1 ? payload : payload.slice(0, pipe);
  const note = pipe === -1 ? null : (payload.slice(pipe + 1).trim() || null);

  // Quantity prefix
  let qty: number | null = null;
  const qm = rest.match(QTY_RE);
  if (qm) {
    const n = Number(qm[1]);
    if (Number.isFinite(n) && n > 0) {
      qty = n;
      rest = rest.slice(qm[0].length);
    }
  }

  const name = rest.trim();
  // If peeling left us with no dish name, the line isn't the shape we expect —
  // show it verbatim rather than guessing.
  if (!name) return emptyLine(raw);


  const choices: string[] = [];
  const removed: string[] = [];
  const extra: string[] = [];
  for (const part of optionBlob.split(",")) {
    const p = part.trim();
    if (!p) continue;
    // The guest menu emits "− X" (U+2212) and "+ X"; accept a plain hyphen too
    if (p.startsWith("−") || p.startsWith("-")) removed.push(p.slice(1).trim());
    else if (p.startsWith("+")) extra.push(p.slice(1).trim());
    else choices.push(p);
  }

  return { qty, name, choices, removed, extra, note, raw };
}

/** Split a whole `item_name` (one line per cart item) into parsed lines. */
export function parseOrderLines(itemName: string | null | undefined): OrderLine[] {
  return (itemName ?? "")
    .split("\n")
    .filter(l => l.trim().length > 0)
    .map(parseOrderLine);
}

/**
 * The one entry point the boards should use.
 *
 * Reads structured `order_items` when the order has them, and falls back to
 * parsing `item_name` for rows created before that table existed. Both produce
 * the same `OrderLine[]`, so the rendering does not care which it got.
 */
export function linesFromOrder(req: {
  item_name?: string | null;
  order_items?: {
    name_snapshot: string;
    quantity: number;
    note: string | null;
    sort_order: number;
    selected_options: {
      choices?: { label: string }[];
      removed?: { label: string }[];
      extra?: { label: string }[];
    } | null;
  }[];
}): OrderLine[] {
  const rows = req.order_items;
  if (!rows || rows.length === 0) return parseOrderLines(req.item_name);

  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(r => {
      const sel = r.selected_options ?? {};
      return {
        qty: r.quantity,
        name: r.name_snapshot,
        choices: (sel.choices ?? []).map(c => c.label).filter(Boolean),
        removed: (sel.removed ?? []).map(c => c.label).filter(Boolean),
        extra: (sel.extra ?? []).map(c => c.label).filter(Boolean),
        note: r.note && r.note.trim() ? r.note.trim() : null,
        raw: r.name_snapshot,
      };
    });
}
