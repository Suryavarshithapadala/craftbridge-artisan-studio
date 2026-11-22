
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  craft text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'english' CHECK (preferred_language IN ('english','telugu')),
  bio text NOT NULL DEFAULT '',
  years_experience integer,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisan profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Artisans create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artisans update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  lang text := lower(COALESCE(meta->>'preferred_language', 'english'));
BEGIN
  IF lang NOT IN ('english','telugu') THEN lang := 'english'; END IF;
  INSERT INTO public.profiles (user_id, full_name, craft, village, state, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(meta->>'full_name',''), NULLIF(meta->>'name',''), split_part(COALESCE(NEW.email,''), '@', 1)),
    COALESCE(meta->>'craft', ''),
    COALESCE(meta->>'village', ''),
    COALESCE(meta->>'state', ''),
    lang
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_te text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  description_te text NOT NULL DEFAULT '',
  craft_story text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Home Decor',
  materials text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  image_url text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  pricing jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_artisan_idx ON public.products(artisan_id);
CREATE INDEX products_status_idx ON public.products(status);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_profile(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _profile_id AND user_id = auth.uid())
$$;

CREATE POLICY "Approved products are public" ON public.products FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Artisans view own products" ON public.products FOR SELECT TO authenticated USING (public.owns_profile(artisan_id));
CREATE POLICY "Artisans add own products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.owns_profile(artisan_id));
CREATE POLICY "Artisans edit own products" ON public.products FOR UPDATE TO authenticated USING (public.owns_profile(artisan_id)) WITH CHECK (public.owns_profile(artisan_id));
CREATE POLICY "Artisans delete own products" ON public.products FOR DELETE TO authenticated USING (public.owns_profile(artisan_id));

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage: artisans manage photos in their own folder
CREATE POLICY "Artisans upload own product photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Artisans read own product photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Artisans update own product photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Artisans delete own product photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Sample artisans
INSERT INTO public.profiles (id, full_name, craft, village, state, preferred_language, bio, years_experience) VALUES
('11111111-0000-4000-8000-000000000001','Lakshmi Devi Gajam','Ikat Weaving','Pochampally','Telangana','telugu','Third-generation ikat weaver who ties and dyes every thread by hand before it ever touches the loom.',22),
('11111111-0000-4000-8000-000000000002','Venkata Ramana','Kondapalli Wooden Toys','Kondapalli','Andhra Pradesh','telugu','Carves soft tella poniki wood into gods, villagers and animals, painted with natural colours.',30),
('11111111-0000-4000-8000-000000000003','Srinivas Nakash','Cheriyal Scroll Painting','Cheriyal','Telangana','telugu','Keeps the Nakashi storytelling tradition alive with bold red scrolls of village life and epics.',18),
('11111111-0000-4000-8000-000000000004','Mohammed Rafiq','Bidriware','Bidar','Karnataka','english','Inlays pure silver into zinc-copper alloy, then darkens it with soil from the Bidar fort.',25),
('11111111-0000-4000-8000-000000000005','Sunita Kumari','Madhubani Painting','Madhubani','Bihar','english','Paints Mithila stories with twigs, nib pens and natural pigments on handmade paper.',15),
('11111111-0000-4000-8000-000000000006','Gopal Prajapati','Blue Pottery & Terracotta','Jaipur','Rajasthan','english','Works with quartz-based blue pottery and local red clay in a family studio near Amer.',28),
('11111111-0000-4000-8000-000000000007','Ratna Bai Kashyap','Dhokra Metal Casting','Kondagaon','Chhattisgarh','english','Casts brass using the 4,000-year-old lost-wax method passed down in her Bastar community.',20),
('11111111-0000-4000-8000-000000000008','Padmavathi Reddy','Kalamkari','Srikalahasti','Andhra Pradesh','telugu','Draws freehand with a bamboo kalam and dyes cotton using myrobalan, madder and indigo.',16),
('11111111-0000-4000-8000-000000000009','Chinna Rao','Etikoppaka Lacquer Toys','Etikoppaka','Andhra Pradesh','telugu','Turns ankudu wood on a lathe and colours it with lacquer made from seeds, bark and turmeric.',24),
('11111111-0000-4000-8000-000000000010','Bijoy Das','Bamboo & Cane Craft','Majuli','Assam','english','Weaves bamboo from the river island of Majuli into baskets that last for generations.',12);

-- Sample products
INSERT INTO public.products (artisan_id, title, title_te, description, description_te, craft_story, category, materials, keywords, image_url, price, pricing, status) VALUES
('11111111-0000-4000-8000-000000000001','Pochampally Ikat Silk Saree – Temple Diamond','పోచంపల్లి ఇక్కత్ పట్టు చీర – ఆలయ వజ్ర డిజైన్','A handwoven mulberry silk saree in maroon, mustard and indigo with the signature Pochampally diamond motif and a zari border. Each thread is tie-dyed before weaving, so the pattern appears on both sides.','మెరూన్, ఆవాల పసుపు, నీలి రంగుల్లో పోచంపల్లి వజ్ర నమూనాతో చేతితో నేసిన పట్టు చీర. నేతకు ముందే ప్రతి దారానికి రంగు కట్టడం వల్ల డిజైన్ రెండు వైపులా కనిపిస్తుంది.','In Pochampally, Lakshmi Devi begins each saree weeks before the loom moves – measuring, tying and dyeing bundles of silk so the diamonds meet perfectly. She learned from her mother and now trains young women in her village.','Textiles','Mulberry silk, zari, natural and azo-free dyes',ARRAY['ikat','pochampally','silk saree','handloom','telangana','GI tag'],'/images/products/pochampally-ikat-saree.jpg',12500,'{"materials":6200,"labourHours":60,"labourRate":60,"packaging":250,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000002','Kondapalli Dasavatharam Wooden Toy Set','కొండపల్లి దశావతారం చెక్క బొమ్మల సెట్','A festive set of hand-carved Kondapalli figures – deities, village folk, bullocks and a peacock – shaped from light tella poniki wood and painted by hand. Perfect for Sankranti bommala koluvu displays.','తేలికైన తెల్ల పొనికి చెక్కతో చెక్కి, చేతితో రంగులు వేసిన కొండపల్లి బొమ్మలు – దేవతలు, గ్రామీణులు, ఎద్దులు, నెమలి. సంక్రాంతి బొమ్మల కొలువుకు చక్కగా సరిపోతాయి.','Venkata Ramana sources fallen tella poniki wood from the Kondapalli hills. Every limb is carved separately and joined with tamarind-seed paste, a method his grandfather taught him.','Woodcraft','Tella poniki wood, tamarind paste, natural colours',ARRAY['kondapalli','wooden toys','bommala koluvu','andhra pradesh','festive decor'],'/images/products/kondapalli-toys.jpg',3200,'{"materials":700,"labourHours":24,"labourRate":70,"packaging":180,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000003','Cheriyal Scroll Painting – Village Harvest','చేర్యాల పట చిత్రం – గ్రామ పంట పండుగ','A narrative Cheriyal scroll showing farmers harvesting paddy under a red sky, painted on khadi cloth primed with rice starch, tamarind seed paste and white mud.','ఎర్రటి నేపథ్యంలో వరి కోస్తున్న రైతుల కథను చిత్రించిన చేర్యాల పట చిత్రం. బియ్యం గంజి, చింతగింజల ముద్ద, తెల్ల మట్టితో సిద్ధం చేసిన ఖద్దరు బట్టపై గీయబడింది.','The Nakash family once travelled with storytellers who unrolled these scrolls in village squares. Srinivas paints the same way today, so each scene can be read like a page of a story.','Paintings','Khadi cloth, natural pigments, rice starch, tamarind seed',ARRAY['cheriyal','scroll painting','nakashi','telangana art','folk art'],'/images/products/cheriyal-scroll.jpg',6800,'{"materials":900,"labourHours":45,"labourRate":80,"packaging":200,"margin":30}','approved'),
('11111111-0000-4000-8000-000000000004','Bidriware Silver-Inlay Surahi Vase','బిద్రీ వెండి పొదిగిన సురాహీ కుండీ','A tall surahi-style vase cast in zinc-copper alloy with delicate silver floral inlay, blackened with oxidising Bidar soil for a deep matte finish.','జింక్-రాగి మిశ్రమంతో తయారై, సున్నితమైన వెండి పూల నమూనాతో పొదిగిన సురాహీ కుండీ. బీదర్ మట్టితో నల్లగా మెరుగు పెట్టబడింది.','Rafiq’s workshop sits in the shadow of the Bidar fort, whose soil gives Bidri its famous black. He engraves the pattern freehand and hammers in silver wire, one petal at a time.','Metalcraft','Zinc-copper alloy, pure silver, Bidar soil',ARRAY['bidriware','silver inlay','bidar','metal vase','home decor'],'/images/products/bidri-vase.jpg',4500,'{"materials":1600,"labourHours":20,"labourRate":75,"packaging":220,"margin":25}','approved'),
('11111111-0000-4000-8000-000000000005','Madhubani Painting – Tree of Life','మధుబని చిత్రం – జీవన వృక్షం','A framed Madhubani artwork of the Tree of Life with twin peacocks and fish – symbols of love and prosperity – painted with natural pigments on handmade paper.','జంట నెమళ్ళు, చేపలతో జీవన వృక్షాన్ని చిత్రించిన మధుబని కళాఖండం – ప్రేమ, శ్రేయస్సుకు ప్రతీకలు. చేతితో చేసిన కాగితంపై సహజ రంగులతో గీయబడింది.','Sunita learned Mithila painting on the mud walls of her home during weddings. Today her paintings carry those blessings onto paper, using colours she grinds from flowers, turmeric and soot.','Paintings','Handmade paper, natural pigments, wooden frame',ARRAY['madhubani','mithila art','tree of life','bihar','wall art'],'/images/products/madhubani-tree.jpg',3800,'{"materials":600,"labourHours":28,"labourRate":65,"packaging":300,"margin":25}','approved'),
('11111111-0000-4000-8000-000000000006','Jaipur Blue Pottery Floral Platter','జైపూర్ నీలి మట్టి పూల పళ్ళెం','A 12-inch decorative platter in cobalt and turquoise florals, made from quartz paste rather than clay and fired at low temperature for its glassy finish.','కోబాల్ట్, టర్కాయిస్ పూల నమూనాలతో 12 అంగుళాల అలంకార పళ్ళెం. మట్టికి బదులు క్వార్ట్జ్ ముద్దతో తయారై, గాజు వంటి మెరుపు కోసం తక్కువ వేడిలో కాల్చబడింది.','Blue pottery came to Jaipur along the Silk Route. Gopal’s family has painted these Persian-inspired florals for four generations, mixing their own cobalt glaze.','Pottery','Quartz powder, glass, multani mitti, cobalt oxide',ARRAY['blue pottery','jaipur','platter','rajasthan','ceramic decor'],'/images/products/blue-pottery-plate.jpg',1850,'{"materials":350,"labourHours":12,"labourRate":70,"packaging":150,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000006','Hand-thrown Terracotta Matka Water Pot','చేతితో చేసిన మట్టి కుండ (మట్కా)','A traditional 5-litre matka thrown on the wheel from river clay. Its porous walls keep drinking water naturally cool and sweet – no electricity needed.','నది మట్టితో చక్రంపై చేసిన 5 లీటర్ల సంప్రదాయ మట్కా. రంధ్రాల గోడలు నీటిని సహజంగా చల్లగా, తియ్యగా ఉంచుతాయి.','Before refrigerators, every Indian home had a matka. Gopal still digs his clay from the same riverbank his father used and fires the pots in a wood kiln.','Pottery','River clay, natural sand',ARRAY['terracotta','matka','water pot','eco-friendly','clay'],'/images/products/terracotta-matka.jpg',950,'{"materials":120,"labourHours":6,"labourRate":70,"packaging":120,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000007','Dhokra Brass Tribal Dancer Figurine','ఢోక్రా ఇత్తడి గిరిజన నర్తకి బొమ్మ','A 10-inch Dhokra figurine of a tribal woman carrying a pot, cast in brass through the lost-wax method with fine hand-rolled wire detailing.','కుండ మోస్తున్న గిరిజన మహిళ రూపంలో 10 అంగుళాల ఢోక్రా బొమ్మ. మైనపు పోత పద్ధతిలో ఇత్తడితో, సన్నని తీగ పనితనంతో తయారైంది.','Every Dhokra piece is one of a kind: the wax model is destroyed when the metal is poured. Ratna Bai shapes each figure from beeswax and clay, inspired by the women of her village.','Metalcraft','Recycled brass, beeswax, clay',ARRAY['dhokra','bastar','brass','lost wax','tribal art'],'/images/products/dhokra-figurine.jpg',2600,'{"materials":800,"labourHours":14,"labourRate":70,"packaging":180,"margin":25}','approved'),
('11111111-0000-4000-8000-000000000008','Srikalahasti Kalamkari Cotton Dupatta','శ్రీకాళహస్తి కలంకారీ నూలు దుపట్టా','A soft cotton dupatta hand-drawn with a bamboo kalam, depicting scenes from the Ramayana with floral borders in madder red, indigo and ochre.','వెదురు కలంతో చేతితో గీసిన మెత్తని నూలు దుపట్టా. రామాయణ దృశ్యాలు, పూల అంచులతో మంజిష్ఠ ఎరుపు, నీలి, కావి రంగులలో ఉంది.','Padmavathi follows the 17-step Srikalahasti process – soaking cloth in buffalo milk and myrobalan, drawing outlines by hand, and washing in the Swarnamukhi river between each colour.','Textiles','Cotton, myrobalan, madder, indigo, jaggery-iron black',ARRAY['kalamkari','srikalahasti','dupatta','hand painted','natural dye'],'/images/products/kalamkari-dupatta.jpg',1650,'{"materials":350,"labourHours":14,"labourRate":60,"packaging":100,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000009','Etikoppaka Lacquer Spinning Tops & Rattle Set','ఏటికొప్పాక లక్క బొంగరాలు & గిలక్కాయ సెట్','Child-safe spinning tops and a baby rattle turned from ankudu wood and coloured with natural lacquer – no toxic paints, just seeds, bark and turmeric.','అంకుడు చెక్కతో చేసిన బొంగరాలు, పాపాయి గిలక్కాయ. విషపూరిత రంగులు లేకుండా గింజలు, బెరడు, పసుపుతో చేసిన సహజ లక్కతో రంగులు వేయబడ్డాయి.','On the banks of the Varaha river, Chinna Rao’s lathe hums all day. He makes his colours by hand, so every toy is safe enough for a baby to hold.','Woodcraft','Ankudu wood, natural lac, vegetable dyes',ARRAY['etikoppaka','lacquer toys','spinning top','andhra pradesh','eco toys'],'/images/products/etikoppaka-toys.jpg',850,'{"materials":150,"labourHours":6,"labourRate":65,"packaging":100,"margin":20}','approved'),
('11111111-0000-4000-8000-000000000010','Majuli Handwoven Bamboo Storage Basket','మజులి చేనేత వెదురు నిల్వ బుట్ట','A sturdy lidded basket woven from split bamboo in a tight herringbone pattern. Ideal for storing grains, yarn or toys – and beautiful on any shelf.','చీల్చిన వెదురుతో గట్టిగా అల్లిన మూత ఉన్న బుట్ట. ధాన్యాలు, దారాలు, బొమ్మలు నిల్వ చేయడానికి అనుకూలం.','Bijoy grows his bamboo on Majuli, the world’s largest river island. Floods reshape the island each year, but the weaving tradition has stayed steady for centuries.','Home Decor','Bamboo, cane',ARRAY['bamboo','basket','majuli','assam','storage','sustainable'],'/images/products/bamboo-basket.jpg',1200,'{"materials":180,"labourHours":10,"labourRate":65,"packaging":120,"margin":25}','approved');
