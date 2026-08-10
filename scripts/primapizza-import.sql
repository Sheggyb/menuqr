-- Prima Pizza (Skövde) menu -> Cafe Bella import
-- Run once in the Supabase SQL editor. Safe to re-run: it deletes and
-- re-inserts only these 8 sections; other Cafe Bella categories are untouched.
do $$
declare
  r_id uuid;
  c_pizza uuid; c_tillbehor uuid; c_sallad uuid; c_kebab uuid; c_burgare uuid; c_grill uuid; c_pasta uuid; c_barn uuid;
begin
  select id into r_id from restaurants where name ilike 'Cafe Bella' limit 1;
  if r_id is null then
    raise exception 'No restaurant named "Cafe Bella" found';
  end if;

  -- Remove previous import (idempotent)
  delete from menu_categories
   where restaurant_id = r_id
     and name in ('Pizza','Tillbehör','Sallad','Kebab','Burgare','Grill A La Carte','Pasta','Barnmeny');

  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Pizza', '🍕', 0) returning id into c_pizza;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Tillbehör', '🧀', 1) returning id into c_tillbehor;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Sallad', '🥗', 2) returning id into c_sallad;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Kebab', '🥙', 3) returning id into c_kebab;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Burgare', '🍔', 4) returning id into c_burgare;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Grill A La Carte', '🔥', 5) returning id into c_grill;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Pasta', '🍝', 6) returning id into c_pasta;
  insert into menu_categories (restaurant_id, name, icon, sort_order)
    values (r_id, 'Barnmeny', '🧒', 7) returning id into c_barn;

  -- Pizza
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_pizza, 'Maggan', 'Husets tomatsås, ost', 130, true, 0),
    (r_id, c_pizza, 'Den Vanlige', 'Husets tomatsås, ost, skinka', 130, true, 1),
    (r_id, c_pizza, 'Sussie', 'Husets tomatsås, ost, salami', 130, true, 2),
    (r_id, c_pizza, 'Originalet', 'Husets tomatsås, ost, skinka, färska champinjoner', 130, true, 3),
    (r_id, c_pizza, 'Kall Såne', 'Husets tomatsås, ost, skinka (inbakad)', 130, true, 4),
    (r_id, c_pizza, 'Vickan', 'Husets tomatsås, ost, skinka, köttfärssås', 130, true, 5),
    (r_id, c_pizza, 'Friska Fläkten', 'Husets tomatsås, ost, skinka, ananas', 130, true, 6),
    (r_id, c_pizza, 'Gladiator', 'Husets tomatsås, ost, bacon, lök, cayennepeppar', 130, true, 7),
    (r_id, c_pizza, 'Lollo', 'Husets tomatsås, ost, ananas, banan, curry', 130, true, 8),
    (r_id, c_pizza, 'Mammas', 'Husets tomatsås, ost, tonfisk, handskalade räkor', 140, true, 9),
    (r_id, c_pizza, 'Norrmalm', 'Husets tomatsås, ost, marinerad fläskfilé, lök, vitlök (inbakad)', 140, true, 10),
    (r_id, c_pizza, 'Freddans favvo', 'Husets tomatsås, ost, salami, tonfisk, paprika, cayennepeppar, jalapeño', 135, true, 11),
    (r_id, c_pizza, 'Mackan', 'Tomat, ost, fläskfilé, färska champinjoner, sparris, grovmalen svartpeppar, bearnaisesås', 140, true, 12),
    (r_id, c_pizza, 'Hem till gården', 'Husets tomatsås, ost, färska champinjoner, inlagd paprika, lök, zucchini, vitlöksmarinerad kronärtskocka', 140, true, 13),
    (r_id, c_pizza, 'Grannen', 'Husets tomatsås, ost, skinka, salami, marinerad fläskfilé, lök, cayennepeppar', 140, true, 14),
    (r_id, c_pizza, 'Årstiderna', 'Husets tomatsås, ost, skinka, blåmusslor, färska champinjoner, toppas med handskalade räkor', 145, true, 15),
    (r_id, c_pizza, 'Presidenten', 'Husets tomatsås, ost, skinka, bacon, marinerad fläskfilé, färska champinjoner, lök, cayennepeppar, toppas med handskalade räkor', 155, true, 16),
    (r_id, c_pizza, 'Brorsan', 'Husets tomatsås, ost, skinka, champinjoner, lök, kebab, sås', 145, true, 17),
    (r_id, c_pizza, 'Kusinen', 'Husets tomatsås, ost, färska tomater, kebab, sås', 145, true, 18),
    (r_id, c_pizza, 'Farbrorn', 'Husets tomatsås, ost, ananas, bacon, salami, färska tomater, kebab, sås', 145, true, 19),
    (r_id, c_pizza, 'Gudsonen', 'Husets tomatsås, ost, kycklingbröst, rödlök, picklad chili, ruccola, vitlökssås', 145, true, 20),
    (r_id, c_pizza, 'Västkusten', 'Crème fraîche, mozzarella, handskalade räkor, stenbitsrom, dill, rödlök, majonnäs', 165, true, 21),
    (r_id, c_pizza, 'Chevrén', 'Crème fraîche, mozzarella, chevre, prosciutto, gröna blad, fikon alt. päron, valnötter, honung', 165, true, 22),
    (r_id, c_pizza, 'Jänkarn', 'Barbecuesås, mozzarella, pulled pork, picklad rödlök, picklad chili, jalapeño, vitlökssås', 165, true, 23),
    (r_id, c_pizza, 'Några ostar', 'Crème fraîche, mozzarella, gorgonzola, parmesan, pecorino', 165, true, 24),
    (r_id, c_pizza, 'Kall Såne special', 'Husets tomatsås, ost, skinka, toppas med prosciutto, parmesan, ruccola (inbakad)', 165, true, 25),
    (r_id, c_pizza, 'Lyxen', 'Husets tomatsås, mozzarella, ryggbiff, cocktailtomater, picklad rödlök, jalapeño, jalapeñomajjo, ruccola', 165, true, 26),
    (r_id, c_pizza, 'Baronen', 'Husets tomatsås, mozzarella, prosciutto, soltorkade tomater, ruccola, olivolja, hyvlad parmesan', 165, true, 27);

  -- Tillbehör
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_tillbehor, 'Glutenfri botten', NULL, 30, true, 0),
    (r_id, c_tillbehor, 'Pommes på pizza', NULL, 25, true, 1),
    (r_id, c_tillbehor, 'Sås på pizza', NULL, 15, true, 2),
    (r_id, c_tillbehor, 'Sås bredvid', NULL, 20, true, 3),
    (r_id, c_tillbehor, 'Pommestallrik', NULL, 50, true, 4),
    (r_id, c_tillbehor, 'Sharing (1 pizza för 2 personer)', NULL, 30, true, 5);

  -- Sallad
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_sallad, 'Greken', 'Rödlök, paprika, gurka, oliver, fetaost, granatäppelsirap, olivolja', 135, true, 0),
    (r_id, c_sallad, 'Amerikanarn', 'Ost, skinka, majs, ananas, paprika', 135, true, 1),
    (r_id, c_sallad, 'Kycklingen', 'Rödkål, rödlök, färska champinjoner, marinerad broccoli, bulgur, fetaost', 140, true, 2),
    (r_id, c_sallad, 'Tonfisken', 'Ägg, avokado, mozzarella, oliver, edamamebönor, kapris, citronklyfta', 145, true, 3),
    (r_id, c_sallad, 'Falafeln', 'Friterad blomkål, halloumi, rödkål, rödlök, hummus, bulgur', 140, true, 4),
    (r_id, c_sallad, 'Kebaben', 'Rödkål, rödlök, majs, paprika, gurka, feferoni', 140, true, 5),
    (r_id, c_sallad, 'Italienarn', 'Pestopasta, prosciutto, soltorkade tomater, burrata, brödpinnar, oliver, ruccola', 155, true, 6),
    (r_id, c_sallad, 'Räkan', 'Handskalade räkor, rödkål, avokado, ägg, edamamebönor, rödlök, oliver, citronklyfta, dill', 155, true, 7),
    (r_id, c_sallad, 'Chevren & fikon alt. päron', 'Chevre, bulgur, gröna blad, rödkål, fikon/päron, valnötter, prosciutto, honung', 155, true, 8),
    (r_id, c_sallad, 'Ceasarn', 'Kycklingbröst, romansallad, rödlök, cocktailtomater, bacon, ceasardressing, krutonger, grana padano', 155, true, 9),
    (r_id, c_sallad, 'Plocksallad', 'Sallad, tomat, gurka och fem valfria ingredienser, valfri dressing', 145, true, 10);

  -- Kebab
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_kebab, 'Kebab Brödet', 'Välj mellan fläsk/nöt/kyckling alt. falafel. Grunden: sallad, tomat, lök, picklad rödkål, fefferoni', 135, true, 0),
    (r_id, c_kebab, 'Kebab Tallriken', 'Välj mellan fläsk/nöt/kyckling alt. falafel. Grunden: sallad, tomat, lök, picklad rödkål, fefferoni', 145, true, 1),
    (r_id, c_kebab, 'Kebab Rullen', 'Välj mellan fläsk/nöt/kyckling alt. falafel. Grunden: sallad, tomat, lök, picklad rödkål, fefferoni', 145, true, 2);

  -- Burgare
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_burgare, 'Oscarn', '200 gram egenmalet högrev, ost, bacon, picklad rödlök, dressing, sallad, pommes', 189, true, 0),
    (r_id, c_burgare, 'Tryffeln', '200 gram egenmalet högrev, karamelliserad lök, tryffelmajo, tomat, crispsallad, cheddarost, bacon, pommes', 189, true, 1),
    (r_id, c_burgare, 'Bellan', 'Panerad halloumiburgare, picklad rödlök, dressing, tomat, sallad, pommes', 159, true, 2);

  -- Grill A La Carte
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_grill, 'Laxen', 'Västerbottenostgratinerad lax med kokt potatis, räkröra, citron och dill', 209, true, 0),
    (r_id, c_grill, 'Lövbiffen', 'Kryddsmör', 199, true, 1),
    (r_id, c_grill, 'Fläskfilén', 'Bearnaisesås, sparris, handskalade räkor', 209, true, 2),
    (r_id, c_grill, 'Ryggbiffen', 'Rödvinssås, bearnaisesås, stekta grönsaker', 229, true, 3),
    (r_id, c_grill, 'Schnitzeln', 'Kapris, citron, ärtor, kryddsmör', 199, true, 4),
    (r_id, c_grill, 'Fish & chipsen', 'Husets remouladsås, picklad rödlök, citron, pommes', 189, true, 5),
    (r_id, c_grill, 'Köttbullen', 'Kalvärs, hemlagat mos, lingon, pressgurka, gräddsås', 209, true, 6),
    (r_id, c_grill, 'Plankan', 'Ryggbiff eller lax, duchessemos, bearnaisesås, baconlindad haricot verts', 249, true, 7),
    (r_id, c_grill, 'Big George', 'För 2, 4 eller 6 personer — per person', 329, true, 8);

  -- Pasta
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_pasta, 'Pasta Biffen', 'Ryggbiff, champinjoner, broccoli, parmesan, vitlök, chili, grädde', 189, true, 0),
    (r_id, c_pasta, 'Arrabiatan', 'Tomatsås, chili, vitlök, burrata (vegetarisk)', 159, true, 1),
    (r_id, c_pasta, 'Bolognese', 'Med riven parmesan', 159, true, 2);

  -- Barnmeny
  insert into menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) values
    (r_id, c_barn, 'Kebabrulle', 'Välj mellan fläsk/nöt/kyckling alt. falafel/kycklingfilé', 119, true, 0),
    (r_id, c_barn, 'Kebabtallrik', 'Välj mellan fläsk/nöt/kyckling alt. falafel/kycklingfilé', 119, true, 1),
    (r_id, c_barn, '90g hamburgare', 'Med pommes', 109, true, 2),
    (r_id, c_barn, 'Köttbullar', 'Med potatismos', 129, true, 3),
    (r_id, c_barn, 'Pasta bolognese', NULL, 119, true, 4);

  raise notice 'Import done';
end $$;

-- Verify
select c.name as category, count(i.id) as items
  from menu_categories c
  left join menu_items i on i.category_id = c.id
 where c.restaurant_id = (select id from restaurants where name ilike 'Cafe Bella' limit 1)
 group by c.name, c.sort_order order by c.sort_order;
