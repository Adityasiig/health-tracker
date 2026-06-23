-- =====================================================================
-- Migration 0005: Food aliases + search_text + more Indian foods
-- =====================================================================
-- Adds:
--   * foods.aliases  TEXT[] — alternative names ("besan curry", "chickpea curry")
--   * foods.search_text — trigger-maintained column for ILIKE matching
--   * Indian-name aliases on existing seed rows
--   * 10 new Indian foods (Kadhi, Dhokla, Khichdi, etc.)
--
-- NOTE: We use a BEFORE INSERT/UPDATE trigger to keep search_text in sync
-- rather than a STORED generated column. Postgres requires generated-
-- column expressions to be strictly IMMUTABLE; even simple `text || text`
-- via `array_to_string` is rejected by some PG/Supabase configs with
-- "42P17 generation expression is not immutable". The trigger avoids the
-- immutability check entirely while giving us the same column shape.
-- =====================================================================

-- ── 1. New columns ────────────────────────────────────────────────────
ALTER TABLE foods ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE foods ADD COLUMN IF NOT EXISTS search_text TEXT;

-- ── 2. Trigger keeps search_text in sync with name + aliases ──────────
CREATE OR REPLACE FUNCTION foods_search_text_sync() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := NEW.name || ' ' || COALESCE(array_to_string(NEW.aliases, ' '), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS foods_search_text_trigger ON foods;
CREATE TRIGGER foods_search_text_trigger
  BEFORE INSERT OR UPDATE OF name, aliases ON foods
  FOR EACH ROW EXECUTE FUNCTION foods_search_text_sync();

-- Backfill the column for existing rows
UPDATE foods SET search_text = name || ' ' || COALESCE(array_to_string(aliases, ' '), '');

CREATE INDEX IF NOT EXISTS idx_foods_search_text ON foods (search_text);

-- ── 3. Aliases for existing Indian foods ──────────────────────────────
UPDATE foods SET aliases = ARRAY['chickpea curry','chole','chana','kabuli chana'] WHERE name = 'Chana Masala';
UPDATE foods SET aliases = ARRAY['kidney bean curry','red bean curry','rajma masala'] WHERE name = 'Rajma (kidney bean curry)';
UPDATE foods SET aliases = ARRAY['yellow lentil','toor dal','arhar dal','dal'] WHERE name = 'Dal Tadka';
UPDATE foods SET aliases = ARRAY['mung dal','green gram dal','yellow moong'] WHERE name = 'Yellow Moong Dal';
UPDATE foods SET aliases = ARRAY['split chickpea','bengal gram dal'] WHERE name = 'Chana Dal';
UPDATE foods SET aliases = ARRAY['lentil soup','sambhar','tamil sambar'] WHERE name = 'Sambar';
UPDATE foods SET aliases = ARRAY['paneer spinach','spinach cheese','palak'] WHERE name = 'Palak Paneer';
UPDATE foods SET aliases = ARRAY['cottage cheese curry','paneer makhani','pbm'] WHERE name = 'Paneer Butter Masala';
UPDATE foods SET aliases = ARRAY['okra masala','lady finger','ladies finger'] WHERE name = 'Bhindi (Okra) Masala';
UPDATE foods SET aliases = ARRAY['eggplant mash','aubergine','brinjal'] WHERE name = 'Baingan Bharta';
UPDATE foods SET aliases = ARRAY['cauliflower curry','phool gobi','phoolgobi'] WHERE name = 'Gobi Masala';
UPDATE foods SET aliases = ARRAY['potato curry','aloo','aloo bhujiya'] WHERE name = 'Aloo Sabzi';
UPDATE foods SET aliases = ARRAY['chapati','phulka','wheat flatbread'] WHERE name = 'Roti / Chapati (medium)';
UPDATE foods SET aliases = ARRAY['stuffed parantha','aloo parantha','aaloo'] WHERE name = 'Aloo paratha';
UPDATE foods SET aliases = ARRAY['indian flatbread','tandoori'] WHERE name = 'Naan';
UPDATE foods SET aliases = ARRAY['boiled egg','anda','egg','eggs'] WHERE name = 'Egg (boiled)';
UPDATE foods SET aliases = ARRAY['anda omelette','anda bhurji','scrambled eggs'] WHERE name = 'Omelette (2 eggs)';
UPDATE foods SET aliases = ARRAY['fried egg','sunny side up','egg fry'] WHERE name = 'Egg (fried, with oil)';
UPDATE foods SET aliases = ARRAY['anda curry','egg masala'] WHERE name = 'Egg Curry (1 egg + gravy)';
UPDATE foods SET aliases = ARRAY['murgh','chicken masala','butter chicken'] WHERE name = 'Chicken Curry (with bone)';
UPDATE foods SET aliases = ARRAY['mutton','goat curry','lamb curry','bakra'] WHERE name = 'Mutton Curry';
UPDATE foods SET aliases = ARRAY['machhi','fish masala','mach curry'] WHERE name = 'Fish Curry';
UPDATE foods SET aliases = ARRAY['shahi paneer','cottage cheese'] WHERE name = 'Paneer';
UPDATE foods SET aliases = ARRAY['dahi','homemade yogurt','plain curd'] WHERE name = 'Curd / Dahi';
UPDATE foods SET aliases = ARRAY['skimmed milk','low fat milk'] WHERE name = 'Milk Skim';
UPDATE foods SET aliases = ARRAY['full fat milk','whole milk','cream milk'] WHERE name = 'Milk Full Cream';
UPDATE foods SET aliases = ARRAY['indian tea','masala chai','milk tea'] WHERE name = 'Chai (with milk + sugar)';
UPDATE foods SET aliases = ARRAY['sweet yogurt drink','meethi lassi'] WHERE name = 'Lassi (sweet)';
UPDATE foods SET aliases = ARRAY['chaas','buttermilk drink','salty lassi'] WHERE name = 'Buttermilk (chaas)';
UPDATE foods SET aliases = ARRAY['fried snack','samosa pakwan'] WHERE name = 'Samosa';
UPDATE foods SET aliases = ARRAY['onion fritters','bhajia','onion bhaji'] WHERE name = 'Pakora (onion)';
UPDATE foods SET aliases = ARRAY['steam rice cake','idly','steamed rice cake'] WHERE name = 'Idli';
UPDATE foods SET aliases = ARRAY['lentil donut','medu vadai','urad dal vada'] WHERE name = 'Vada (medu)';
UPDATE foods SET aliases = ARRAY['rice crepe','south indian crepe','rice pancake'] WHERE name = 'Dosa (plain)';
UPDATE foods SET aliases = ARRAY['masala dosai','potato dosa'] WHERE name = 'Masala Dosa';
UPDATE foods SET aliases = ARRAY['flattened rice','beaten rice','poha breakfast'] WHERE name = 'Poha';
UPDATE foods SET aliases = ARRAY['semolina porridge','rava upma','suji upma'] WHERE name = 'Upma';
UPDATE foods SET aliases = ARRAY['potato cutlet','aloo patty'] WHERE name = 'Aloo Tikki';
UPDATE foods SET aliases = ARRAY['bread roll','bombay pav'] WHERE name = 'Pav';

-- Fruits with Indian common names
UPDATE foods SET aliases = ARRAY['kela','kele'] WHERE name = 'Banana (medium)';
UPDATE foods SET aliases = ARRAY['seb','seb fruit'] WHERE name = 'Apple (medium)';
UPDATE foods SET aliases = ARRAY['santra','santara','musambi'] WHERE name = 'Orange (medium)';
UPDATE foods SET aliases = ARRAY['aam','king of fruits','alphonso'] WHERE name = 'Mango (medium)';
UPDATE foods SET aliases = ARRAY['papita','pawpaw'] WHERE name = 'Papaya (cubes)';
UPDATE foods SET aliases = ARRAY['tarbooj','tarbuj'] WHERE name = 'Watermelon (cubes)';
UPDATE foods SET aliases = ARRAY['angoor','grapes fruit'] WHERE name = 'Grapes';
UPDATE foods SET aliases = ARRAY['anar','pomegranate seeds','dana'] WHERE name = 'Pomegranate (seeds)';
UPDATE foods SET aliases = ARRAY['badam'] WHERE name = 'Almond';
UPDATE foods SET aliases = ARRAY['kaju'] WHERE name = 'Cashew';
UPDATE foods SET aliases = ARRAY['akhrot'] WHERE name = 'Walnut';
UPDATE foods SET aliases = ARRAY['pista'] WHERE name = 'Pistachio';
UPDATE foods SET aliases = ARRAY['moongphali','peanuts roasted','singdana'] WHERE name = 'Peanuts (roasted)';
UPDATE foods SET aliases = ARRAY['khajur','dates fruit'] WHERE name = 'Dates';

-- Sweets
UPDATE foods SET aliases = ARRAY['gulab jaman','kala jamun'] WHERE name = 'Gulab Jamun';
UPDATE foods SET aliases = ARRAY['jilebi','jalebee'] WHERE name = 'Jalebi';
UPDATE foods SET aliases = ARRAY['rosogolla','rasagolla'] WHERE name = 'Rasgulla';
UPDATE foods SET aliases = ARRAY['kheer payasam','rice pudding','firni','phirni'] WHERE name = 'Kheer';

-- ── 4. New Indian foods that were missing ─────────────────────────────
INSERT INTO foods (name, category, unit, unit_grams, kcal, protein_g, carbs_g, fat_g, fiber_g, is_custom, aliases) VALUES
  ('Kadhi', 'dal', 'katori', 200, 180, 8, 16, 9, 1, 0,
    ARRAY['besan curry','yogurt curry','pakora curry','besan kadhi','dahi kadhi']),
  ('Khichdi', 'grain', 'katori', 200, 220, 8, 38, 4, 4, 0,
    ARRAY['rice and lentil porridge','dal khichdi','moong khichdi','one pot meal']),
  ('Dhokla', 'snack', 'piece', 35, 65, 2.5, 11, 1, 1, 0,
    ARRAY['steamed besan cake','khaman','gujarati snack']),
  ('Curd Rice', 'grain', 'katori', 200, 220, 6, 30, 8, 1, 0,
    ARRAY['dahi chawal','yogurt rice','tairu sadam','south indian','thayir sadam']),
  ('Besan Cheela', 'snack', 'piece', 60, 130, 5, 13, 6, 2, 0,
    ARRAY['besan chilla','chickpea pancake','gram flour pancake','besan ka chilla']),
  ('Pav Bhaji (with pav)', 'snack', 'piece', 350, 480, 11, 65, 18, 7, 0,
    ARRAY['pav bhaji full','pavbhaji','mumbai street food']),
  ('Roti / Chapati (small)', 'grain', 'piece', 25, 75, 2, 12, 2, 1.5, 0,
    ARRAY['chapati small','phulka small','thin roti']),
  ('Tandoori Roti', 'grain', 'piece', 60, 140, 4, 26, 1, 2, 0,
    ARRAY['tandoor roti','clay oven roti','wheat tandoori']),
  ('Bhindi Fry', 'veg', 'katori', 150, 130, 3, 12, 8, 4, 0,
    ARRAY['fried okra','bhindi sabzi','lady finger fry']),
  ('Aloo Gobi', 'veg', 'katori', 150, 145, 4, 15, 8, 4, 0,
    ARRAY['potato cauliflower','aloo phoolgobi','dry sabzi'])
ON CONFLICT (name) DO NOTHING;
