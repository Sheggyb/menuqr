# Generates ingredient pre-fill SQL for the Prima items (pizza/sallad/kebab)
# Reuses the item data from gen_prima_import.py
import importlib.util
import re

spec = importlib.util.spec_from_file_location("gpi", "scripts/gen_prima_import.py")
gpi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gpi)  # also regenerates the menu import sql — harmless

KEBAB_BASE = ["Sallad", "Tomat", "Lök", "Picklad rödkål", "Fefferoni"]


def parse_ingredients(desc: str):
    """Turn a comma-separated ingredient description into a clean list."""
    if not desc:
        return []
    d = re.sub(r"\([^)]*\)", "", desc)          # drop (inbakad) etc.
    parts = []
    for p in d.split(","):
        p = p.strip()
        p = re.sub(r"^toppas med ", "", p)       # 'toppas med handskalade räkor'
        p = re.sub(r"^Grunden: ", "", p)
        p = re.sub(r"^och ", "", p)
        p = re.sub(r"^alt\. ", "", p)
        if p and p not in ("Grunden",):
            parts.append(p)
    # dedupe case-insensitively, keep first casing
    seen, out = set(), []
    for p in parts:
        k = p.lower()
        if k not in seen:
            seen.add(k)
            out.append(p)
    return out


def esc(s):
    return "'" + s.replace("'", "''") + "'"


L = []
L.append("-- Prima Pizza: ingredient groups (tap-to-remove) for Cafe Bella")
L.append("-- Run AFTER the menu import + the options feature ALTER. Safe to re-run:")
L.append("-- skips items that already have an ingredients group.")
L.append("do $$")
L.append("declare")
L.append("  r_id uuid; i_id uuid; g_id uuid;")
L.append("begin")
L.append("  select id into r_id from restaurants where name ilike 'Cafe Bella' limit 1;")
L.append("  if r_id is null then")
L.append("    raise exception 'No restaurant named \"Cafe Bella\" found';")
L.append("  end if;")
L.append("")

items = []
for name, desc, price in gpi.pizza:
    items.append((name, parse_ingredients(desc)))
for name, desc, price in gpi.sallad:
    items.append((name, parse_ingredients(desc)))
for name, desc, price in gpi.kebab:
    items.append((name, KEBAB_BASE))

for name, ings in items:
    if not ings:
        continue
    L.append(f"  -- {name}")
    L.append(f"  select id into i_id from menu_items where restaurant_id = r_id and name = {esc(name)};")
    L.append(f"  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then")
    L.append(f"    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)")
    L.append(f"      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;")
    L.append(f"    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values")
    rows = [f"      (r_id, g_id, {esc(ing)}, 0, {i})" for i, ing in enumerate(ings)]
    L.append(",\n".join(rows) + ";")
    L.append("  end if;")
    L.append("")

L.append("  raise notice 'Ingredients pre-fill done';")
L.append("end $$;")
L.append("")
L.append("-- Verify")
L.append("select mi.name as item, count(mioc.id) as ingredients")
L.append("  from menu_items mi")
L.append("  join menu_item_options mio on mio.item_id = mi.id and mio.type = 'ingredients'")
L.append("  left join menu_item_option_choices mioc on mioc.option_id = mio.id")
L.append(" where mi.restaurant_id = (select id from restaurants where name ilike 'Cafe Bella' limit 1)")
L.append(" group by mi.name order by mi.name;")

out = "C:/Users/sargo/Documents/Project/MenuQR/scripts/primapizza-ingredients.sql"
open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
total = sum(len(i) for _, i in items if i)
print(f"generated {out} — {len(items)} items, {total} ingredient entries")
