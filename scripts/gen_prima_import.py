# Generates the Prima Pizza -> Cafe Bella import SQL
pizza = [
 ("Maggan","Husets tomatsås, ost",130),
 ("Den Vanlige","Husets tomatsås, ost, skinka",130),
 ("Sussie","Husets tomatsås, ost, salami",130),
 ("Originalet","Husets tomatsås, ost, skinka, färska champinjoner",130),
 ("Kall Såne","Husets tomatsås, ost, skinka (inbakad)",130),
 ("Vickan","Husets tomatsås, ost, skinka, köttfärssås",130),
 ("Friska Fläkten","Husets tomatsås, ost, skinka, ananas",130),
 ("Gladiator","Husets tomatsås, ost, bacon, lök, cayennepeppar",130),
 ("Lollo","Husets tomatsås, ost, ananas, banan, curry",130),
 ("Mammas","Husets tomatsås, ost, tonfisk, handskalade räkor",140),
 ("Norrmalm","Husets tomatsås, ost, marinerad fläskfilé, lök, vitlök (inbakad)",140),
 ("Freddans favvo","Husets tomatsås, ost, salami, tonfisk, paprika, cayennepeppar, jalapeño",135),
 ("Mackan","Tomat, ost, fläskfilé, färska champinjoner, sparris, grovmalen svartpeppar, bearnaisesås",140),
 ("Hem till gården","Husets tomatsås, ost, färska champinjoner, inlagd paprika, lök, zucchini, vitlöksmarinerad kronärtskocka",140),
 ("Grannen","Husets tomatsås, ost, skinka, salami, marinerad fläskfilé, lök, cayennepeppar",140),
 ("Årstiderna","Husets tomatsås, ost, skinka, blåmusslor, färska champinjoner, toppas med handskalade räkor",145),
 ("Presidenten","Husets tomatsås, ost, skinka, bacon, marinerad fläskfilé, färska champinjoner, lök, cayennepeppar, toppas med handskalade räkor",155),
 ("Brorsan","Husets tomatsås, ost, skinka, champinjoner, lök, kebab, sås",145),
 ("Kusinen","Husets tomatsås, ost, färska tomater, kebab, sås",145),
 ("Farbrorn","Husets tomatsås, ost, ananas, bacon, salami, färska tomater, kebab, sås",145),
 ("Gudsonen","Husets tomatsås, ost, kycklingbröst, rödlök, picklad chili, ruccola, vitlökssås",145),
 ("Västkusten","Crème fraîche, mozzarella, handskalade räkor, stenbitsrom, dill, rödlök, majonnäs",165),
 ("Chevrén","Crème fraîche, mozzarella, chevre, prosciutto, gröna blad, fikon alt. päron, valnötter, honung",165),
 ("Jänkarn","Barbecuesås, mozzarella, pulled pork, picklad rödlök, picklad chili, jalapeño, vitlökssås",165),
 ("Några ostar","Crème fraîche, mozzarella, gorgonzola, parmesan, pecorino",165),
 ("Kall Såne special","Husets tomatsås, ost, skinka, toppas med prosciutto, parmesan, ruccola (inbakad)",165),
 ("Lyxen","Husets tomatsås, mozzarella, ryggbiff, cocktailtomater, picklad rödlök, jalapeño, jalapeñomajjo, ruccola",165),
 ("Baronen","Husets tomatsås, mozzarella, prosciutto, soltorkade tomater, ruccola, olivolja, hyvlad parmesan",165),
]
tillbehor = [
 ("Glutenfri botten",None,30),
 ("Pommes på pizza",None,25),
 ("Sås på pizza",None,15),
 ("Sås bredvid",None,20),
 ("Pommestallrik",None,50),
 ("Sharing (1 pizza för 2 personer)",None,30),
]
sallad = [
 ("Greken","Rödlök, paprika, gurka, oliver, fetaost, granatäppelsirap, olivolja",135),
 ("Amerikanarn","Ost, skinka, majs, ananas, paprika",135),
 ("Kycklingen","Rödkål, rödlök, färska champinjoner, marinerad broccoli, bulgur, fetaost",140),
 ("Tonfisken","Ägg, avokado, mozzarella, oliver, edamamebönor, kapris, citronklyfta",145),
 ("Falafeln","Friterad blomkål, halloumi, rödkål, rödlök, hummus, bulgur",140),
 ("Kebaben","Rödkål, rödlök, majs, paprika, gurka, feferoni",140),
 ("Italienarn","Pestopasta, prosciutto, soltorkade tomater, burrata, brödpinnar, oliver, ruccola",155),
 ("Räkan","Handskalade räkor, rödkål, avokado, ägg, edamamebönor, rödlök, oliver, citronklyfta, dill",155),
 ("Chevren & fikon alt. päron","Chevre, bulgur, gröna blad, rödkål, fikon/päron, valnötter, prosciutto, honung",155),
 ("Ceasarn","Kycklingbröst, romansallad, rödlök, cocktailtomater, bacon, ceasardressing, krutonger, grana padano",155),
 ("Plocksallad","Sallad, tomat, gurka och fem valfria ingredienser, valfri dressing",145),
]
kebab_base = "Välj mellan fläsk/nöt/kyckling alt. falafel. Grunden: sallad, tomat, lök, picklad rödkål, fefferoni"
kebab = [("Kebab Brödet",kebab_base,135),("Kebab Tallriken",kebab_base,145),("Kebab Rullen",kebab_base,145)]
burgare = [
 ("Oscarn","200 gram egenmalet högrev, ost, bacon, picklad rödlök, dressing, sallad, pommes",189),
 ("Tryffeln","200 gram egenmalet högrev, karamelliserad lök, tryffelmajo, tomat, crispsallad, cheddarost, bacon, pommes",189),
 ("Bellan","Panerad halloumiburgare, picklad rödlök, dressing, tomat, sallad, pommes",159),
]
grill = [
 ("Laxen","Västerbottenostgratinerad lax med kokt potatis, räkröra, citron och dill",209),
 ("Lövbiffen","Kryddsmör",199),
 ("Fläskfilén","Bearnaisesås, sparris, handskalade räkor",209),
 ("Ryggbiffen","Rödvinssås, bearnaisesås, stekta grönsaker",229),
 ("Schnitzeln","Kapris, citron, ärtor, kryddsmör",199),
 ("Fish & chipsen","Husets remouladsås, picklad rödlök, citron, pommes",189),
 ("Köttbullen","Kalvärs, hemlagat mos, lingon, pressgurka, gräddsås",209),
 ("Plankan","Ryggbiff eller lax, duchessemos, bearnaisesås, baconlindad haricot verts",249),
 ("Big George","För 2, 4 eller 6 personer — per person",329),
]
pasta = [
 ("Pasta Biffen","Ryggbiff, champinjoner, broccoli, parmesan, vitlök, chili, grädde",189),
 ("Arrabiatan","Tomatsås, chili, vitlök, burrata (vegetarisk)",159),
 ("Bolognese","Med riven parmesan",159),
]
barn = [
 ("Kebabrulle","Välj mellan fläsk/nöt/kyckling alt. falafel/kycklingfilé",119),
 ("Kebabtallrik","Välj mellan fläsk/nöt/kyckling alt. falafel/kycklingfilé",119),
 ("90g hamburgare","Med pommes",109),
 ("Köttbullar","Med potatismos",129),
 ("Pasta bolognese",None,119),
]
cats = [("Pizza","🍕",pizza),("Tillbehör","🧀",tillbehor),("Sallad","🥗",sallad),("Kebab","🥙",kebab),("Burgare","🍔",burgare),("Grill A La Carte","🔥",grill),("Pasta","🍝",pasta),("Barnmeny","🧒",barn)]

def esc(s):
    if s is None: return "NULL"
    return "'" + s.replace("'", "''") + "'"

L = []
L.append("-- Prima Pizza (Skövde) menu -> Cafe Bella import")
L.append("-- Run once in the Supabase SQL editor. Safe to re-run: it deletes and")
L.append("-- re-inserts only these 8 sections; other Cafe Bella categories are untouched.")
L.append("do $$")
L.append("declare")
L.append("  r_id uuid;")
L.append("  c_pizza uuid; c_tillbehor uuid; c_sallad uuid; c_kebab uuid; c_burgare uuid; c_grill uuid; c_pasta uuid; c_barn uuid;")
L.append("begin")
L.append("  select id into r_id from restaurants where name ilike 'Cafe Bella' limit 1;")
L.append("  if r_id is null then")
L.append("    raise exception 'No restaurant named \"Cafe Bella\" found';")
L.append("  end if;")
L.append("")
L.append("  -- Remove previous import (idempotent)")
L.append("  delete from menu_categories")
L.append("   where restaurant_id = r_id")
L.append("     and name in ('Pizza','Tillbehör','Sallad','Kebab','Burgare','Grill A La Carte','Pasta','Barnmeny');")
L.append("")
varmap = {"Pizza":"c_pizza","Tillbehör":"c_tillbehor","Sallad":"c_sallad","Kebab":"c_kebab","Burgare":"c_burgare","Grill A La Carte":"c_grill","Pasta":"c_pasta","Barnmeny":"c_barn"}
for i,(cname,icon,items) in enumerate(cats):
    L.append(f"  insert into menu_categories (restaurant_id, name, icon, sort_order)")
    L.append(f"    values (r_id, {esc(cname)}, {esc(icon)}, {i}) returning id into {varmap[cname]};")
L.append("")
for cname,icon,items in cats:
    v = varmap[cname]
    L.append(f"  -- {cname}")
    L.append(f"  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values")
    rows = []
    for j,(n,d,p) in enumerate(items):
        rows.append(f"    (r_id, {v}, {esc(n)}, {esc(d)}, {p}, true, {j})")
    L.append(",\n".join(rows) + ";")
    L.append("")
L.append("  raise notice 'Import done';")
L.append("end $$;")
L.append("")
L.append("-- Verify")
L.append("select c.name as category, count(i.id) as items")
L.append("  from menu_categories c")
L.append("  left join menu_items i on i.category_id = c.id")
L.append(" where c.restaurant_id = (select id from restaurants where name ilike 'Cafe Bella' limit 1)")
L.append(" group by c.name, c.sort_order order by c.sort_order;")

open("C:/Users/sargo/Documents/Project/MenuQR/scripts/primapizza-import.sql", "w", encoding="utf-8").write("\n".join(L) + "\n")
total = sum(len(items) for _,_,items in cats)
print("generated scripts/primapizza-import.sql —", len(cats), "categories,", total, "items")
