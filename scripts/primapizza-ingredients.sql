-- Prima Pizza: ingredient groups (tap-to-remove) for Cafe Bella
-- Run AFTER the menu import + the options feature ALTER. Safe to re-run:
-- skips items that already have an ingredients group.
do $$
declare
  r_id uuid; i_id uuid; g_id uuid;
begin
  select id into r_id from restaurants where name ilike 'Cafe Bella' limit 1;
  if r_id is null then
    raise exception 'No restaurant named "Cafe Bella" found';
  end if;

  -- Maggan
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Maggan';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1);
  end if;

  -- Den Vanlige
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Den Vanlige';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2);
  end if;

  -- Sussie
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Sussie';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'salami', 0, 2);
  end if;

  -- Originalet
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Originalet';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'färska champinjoner', 0, 3);
  end if;

  -- Kall Såne
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kall Såne';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2);
  end if;

  -- Vickan
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Vickan';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'köttfärssås', 0, 3);
  end if;

  -- Friska Fläkten
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Friska Fläkten';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'ananas', 0, 3);
  end if;

  -- Gladiator
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Gladiator';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'bacon', 0, 2),
      (r_id, g_id, 'lök', 0, 3),
      (r_id, g_id, 'cayennepeppar', 0, 4);
  end if;

  -- Lollo
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Lollo';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'ananas', 0, 2),
      (r_id, g_id, 'banan', 0, 3),
      (r_id, g_id, 'curry', 0, 4);
  end if;

  -- Mammas
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Mammas';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'tonfisk', 0, 2),
      (r_id, g_id, 'handskalade räkor', 0, 3);
  end if;

  -- Norrmalm
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Norrmalm';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'marinerad fläskfilé', 0, 2),
      (r_id, g_id, 'lök', 0, 3),
      (r_id, g_id, 'vitlök', 0, 4);
  end if;

  -- Freddans favvo
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Freddans favvo';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'salami', 0, 2),
      (r_id, g_id, 'tonfisk', 0, 3),
      (r_id, g_id, 'paprika', 0, 4),
      (r_id, g_id, 'cayennepeppar', 0, 5),
      (r_id, g_id, 'jalapeño', 0, 6);
  end if;

  -- Mackan
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Mackan';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Tomat', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'fläskfilé', 0, 2),
      (r_id, g_id, 'färska champinjoner', 0, 3),
      (r_id, g_id, 'sparris', 0, 4),
      (r_id, g_id, 'grovmalen svartpeppar', 0, 5),
      (r_id, g_id, 'bearnaisesås', 0, 6);
  end if;

  -- Hem till gården
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Hem till gården';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'färska champinjoner', 0, 2),
      (r_id, g_id, 'inlagd paprika', 0, 3),
      (r_id, g_id, 'lök', 0, 4),
      (r_id, g_id, 'zucchini', 0, 5),
      (r_id, g_id, 'vitlöksmarinerad kronärtskocka', 0, 6);
  end if;

  -- Grannen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Grannen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'salami', 0, 3),
      (r_id, g_id, 'marinerad fläskfilé', 0, 4),
      (r_id, g_id, 'lök', 0, 5),
      (r_id, g_id, 'cayennepeppar', 0, 6);
  end if;

  -- Årstiderna
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Årstiderna';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'blåmusslor', 0, 3),
      (r_id, g_id, 'färska champinjoner', 0, 4),
      (r_id, g_id, 'handskalade räkor', 0, 5);
  end if;

  -- Presidenten
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Presidenten';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'bacon', 0, 3),
      (r_id, g_id, 'marinerad fläskfilé', 0, 4),
      (r_id, g_id, 'färska champinjoner', 0, 5),
      (r_id, g_id, 'lök', 0, 6),
      (r_id, g_id, 'cayennepeppar', 0, 7),
      (r_id, g_id, 'handskalade räkor', 0, 8);
  end if;

  -- Brorsan
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Brorsan';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'champinjoner', 0, 3),
      (r_id, g_id, 'lök', 0, 4),
      (r_id, g_id, 'kebab', 0, 5),
      (r_id, g_id, 'sås', 0, 6);
  end if;

  -- Kusinen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kusinen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'färska tomater', 0, 2),
      (r_id, g_id, 'kebab', 0, 3),
      (r_id, g_id, 'sås', 0, 4);
  end if;

  -- Farbrorn
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Farbrorn';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'ananas', 0, 2),
      (r_id, g_id, 'bacon', 0, 3),
      (r_id, g_id, 'salami', 0, 4),
      (r_id, g_id, 'färska tomater', 0, 5),
      (r_id, g_id, 'kebab', 0, 6),
      (r_id, g_id, 'sås', 0, 7);
  end if;

  -- Gudsonen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Gudsonen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'kycklingbröst', 0, 2),
      (r_id, g_id, 'rödlök', 0, 3),
      (r_id, g_id, 'picklad chili', 0, 4),
      (r_id, g_id, 'ruccola', 0, 5),
      (r_id, g_id, 'vitlökssås', 0, 6);
  end if;

  -- Västkusten
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Västkusten';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Crème fraîche', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'handskalade räkor', 0, 2),
      (r_id, g_id, 'stenbitsrom', 0, 3),
      (r_id, g_id, 'dill', 0, 4),
      (r_id, g_id, 'rödlök', 0, 5),
      (r_id, g_id, 'majonnäs', 0, 6);
  end if;

  -- Chevrén
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Chevrén';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Crème fraîche', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'chevre', 0, 2),
      (r_id, g_id, 'prosciutto', 0, 3),
      (r_id, g_id, 'gröna blad', 0, 4),
      (r_id, g_id, 'fikon alt. päron', 0, 5),
      (r_id, g_id, 'valnötter', 0, 6),
      (r_id, g_id, 'honung', 0, 7);
  end if;

  -- Jänkarn
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Jänkarn';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Barbecuesås', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'pulled pork', 0, 2),
      (r_id, g_id, 'picklad rödlök', 0, 3),
      (r_id, g_id, 'picklad chili', 0, 4),
      (r_id, g_id, 'jalapeño', 0, 5),
      (r_id, g_id, 'vitlökssås', 0, 6);
  end if;

  -- Några ostar
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Några ostar';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Crème fraîche', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'gorgonzola', 0, 2),
      (r_id, g_id, 'parmesan', 0, 3),
      (r_id, g_id, 'pecorino', 0, 4);
  end if;

  -- Kall Såne special
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kall Såne special';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'ost', 0, 1),
      (r_id, g_id, 'skinka', 0, 2),
      (r_id, g_id, 'prosciutto', 0, 3),
      (r_id, g_id, 'parmesan', 0, 4),
      (r_id, g_id, 'ruccola', 0, 5);
  end if;

  -- Lyxen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Lyxen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'ryggbiff', 0, 2),
      (r_id, g_id, 'cocktailtomater', 0, 3),
      (r_id, g_id, 'picklad rödlök', 0, 4),
      (r_id, g_id, 'jalapeño', 0, 5),
      (r_id, g_id, 'jalapeñomajjo', 0, 6),
      (r_id, g_id, 'ruccola', 0, 7);
  end if;

  -- Baronen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Baronen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Husets tomatsås', 0, 0),
      (r_id, g_id, 'mozzarella', 0, 1),
      (r_id, g_id, 'prosciutto', 0, 2),
      (r_id, g_id, 'soltorkade tomater', 0, 3),
      (r_id, g_id, 'ruccola', 0, 4),
      (r_id, g_id, 'olivolja', 0, 5),
      (r_id, g_id, 'hyvlad parmesan', 0, 6);
  end if;

  -- Greken
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Greken';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Rödlök', 0, 0),
      (r_id, g_id, 'paprika', 0, 1),
      (r_id, g_id, 'gurka', 0, 2),
      (r_id, g_id, 'oliver', 0, 3),
      (r_id, g_id, 'fetaost', 0, 4),
      (r_id, g_id, 'granatäppelsirap', 0, 5),
      (r_id, g_id, 'olivolja', 0, 6);
  end if;

  -- Amerikanarn
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Amerikanarn';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Ost', 0, 0),
      (r_id, g_id, 'skinka', 0, 1),
      (r_id, g_id, 'majs', 0, 2),
      (r_id, g_id, 'ananas', 0, 3),
      (r_id, g_id, 'paprika', 0, 4);
  end if;

  -- Kycklingen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kycklingen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Rödkål', 0, 0),
      (r_id, g_id, 'rödlök', 0, 1),
      (r_id, g_id, 'färska champinjoner', 0, 2),
      (r_id, g_id, 'marinerad broccoli', 0, 3),
      (r_id, g_id, 'bulgur', 0, 4),
      (r_id, g_id, 'fetaost', 0, 5);
  end if;

  -- Tonfisken
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Tonfisken';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Ägg', 0, 0),
      (r_id, g_id, 'avokado', 0, 1),
      (r_id, g_id, 'mozzarella', 0, 2),
      (r_id, g_id, 'oliver', 0, 3),
      (r_id, g_id, 'edamamebönor', 0, 4),
      (r_id, g_id, 'kapris', 0, 5),
      (r_id, g_id, 'citronklyfta', 0, 6);
  end if;

  -- Falafeln
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Falafeln';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Friterad blomkål', 0, 0),
      (r_id, g_id, 'halloumi', 0, 1),
      (r_id, g_id, 'rödkål', 0, 2),
      (r_id, g_id, 'rödlök', 0, 3),
      (r_id, g_id, 'hummus', 0, 4),
      (r_id, g_id, 'bulgur', 0, 5);
  end if;

  -- Kebaben
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kebaben';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Rödkål', 0, 0),
      (r_id, g_id, 'rödlök', 0, 1),
      (r_id, g_id, 'majs', 0, 2),
      (r_id, g_id, 'paprika', 0, 3),
      (r_id, g_id, 'gurka', 0, 4),
      (r_id, g_id, 'feferoni', 0, 5);
  end if;

  -- Italienarn
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Italienarn';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Pestopasta', 0, 0),
      (r_id, g_id, 'prosciutto', 0, 1),
      (r_id, g_id, 'soltorkade tomater', 0, 2),
      (r_id, g_id, 'burrata', 0, 3),
      (r_id, g_id, 'brödpinnar', 0, 4),
      (r_id, g_id, 'oliver', 0, 5),
      (r_id, g_id, 'ruccola', 0, 6);
  end if;

  -- Räkan
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Räkan';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Handskalade räkor', 0, 0),
      (r_id, g_id, 'rödkål', 0, 1),
      (r_id, g_id, 'avokado', 0, 2),
      (r_id, g_id, 'ägg', 0, 3),
      (r_id, g_id, 'edamamebönor', 0, 4),
      (r_id, g_id, 'rödlök', 0, 5),
      (r_id, g_id, 'oliver', 0, 6),
      (r_id, g_id, 'citronklyfta', 0, 7),
      (r_id, g_id, 'dill', 0, 8);
  end if;

  -- Chevren & fikon alt. päron
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Chevren & fikon alt. päron';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Chevre', 0, 0),
      (r_id, g_id, 'bulgur', 0, 1),
      (r_id, g_id, 'gröna blad', 0, 2),
      (r_id, g_id, 'rödkål', 0, 3),
      (r_id, g_id, 'fikon/päron', 0, 4),
      (r_id, g_id, 'valnötter', 0, 5),
      (r_id, g_id, 'prosciutto', 0, 6),
      (r_id, g_id, 'honung', 0, 7);
  end if;

  -- Ceasarn
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Ceasarn';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Kycklingbröst', 0, 0),
      (r_id, g_id, 'romansallad', 0, 1),
      (r_id, g_id, 'rödlök', 0, 2),
      (r_id, g_id, 'cocktailtomater', 0, 3),
      (r_id, g_id, 'bacon', 0, 4),
      (r_id, g_id, 'ceasardressing', 0, 5),
      (r_id, g_id, 'krutonger', 0, 6),
      (r_id, g_id, 'grana padano', 0, 7);
  end if;

  -- Plocksallad
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Plocksallad';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Sallad', 0, 0),
      (r_id, g_id, 'tomat', 0, 1),
      (r_id, g_id, 'gurka och fem valfria ingredienser', 0, 2),
      (r_id, g_id, 'valfri dressing', 0, 3);
  end if;

  -- Kebab Brödet
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kebab Brödet';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Sallad', 0, 0),
      (r_id, g_id, 'Tomat', 0, 1),
      (r_id, g_id, 'Lök', 0, 2),
      (r_id, g_id, 'Picklad rödkål', 0, 3),
      (r_id, g_id, 'Fefferoni', 0, 4);
  end if;

  -- Kebab Tallriken
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kebab Tallriken';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Sallad', 0, 0),
      (r_id, g_id, 'Tomat', 0, 1),
      (r_id, g_id, 'Lök', 0, 2),
      (r_id, g_id, 'Picklad rödkål', 0, 3),
      (r_id, g_id, 'Fefferoni', 0, 4);
  end if;

  -- Kebab Rullen
  select id into i_id from menu_items where restaurant_id = r_id and name = 'Kebab Rullen';
  if i_id is not null and not exists (select 1 from menu_item_options where item_id = i_id and type = 'ingredients') then
    insert into menu_item_options (restaurant_id, item_id, name, type, is_required, sort_order)
      values (r_id, i_id, 'Ingredients', 'ingredients', false, 0) returning id into g_id;
    insert into menu_item_option_choices (restaurant_id, option_id, label, price_delta, sort_order) values
      (r_id, g_id, 'Sallad', 0, 0),
      (r_id, g_id, 'Tomat', 0, 1),
      (r_id, g_id, 'Lök', 0, 2),
      (r_id, g_id, 'Picklad rödkål', 0, 3),
      (r_id, g_id, 'Fefferoni', 0, 4);
  end if;

  raise notice 'Ingredients pre-fill done';
end $$;

-- Verify
select mi.name as item, count(mioc.id) as ingredients
  from menu_items mi
  join menu_item_options mio on mio.item_id = mi.id and mio.type = 'ingredients'
  left join menu_item_option_choices mioc on mioc.option_id = mio.id
 where mi.restaurant_id = (select id from restaurants where name ilike 'Cafe Bella' limit 1)
 group by mi.name order by mi.name;
