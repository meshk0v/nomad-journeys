// Сборка каталога: читает data/*.json и data/tours/*.json, проверяет связи и создаёт
//   assets/data.js        — данные для сайта (глобальный объект NJ)
//   db/schema.sql         — схема PostgreSQL
//   db/seed.sql           — данные для импорта в PostgreSQL
//   export/catalog.json   — плоский каталог для AI-агента (по одному объекту на тур)
// Запуск: node scripts/build.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), D = p => path.join(root, 'data', p);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const meta = read(D('meta.json')), categories = read(D('categories.json')), countries = read(D('countries.json')),
  guides = read(D('guides.json')), company = read(D('company.json')), images = read(D('images.json')),
  departures = read(D('departures.json'));
const tours = fs.readdirSync(D('tours')).filter(f => f.endsWith('.json')).sort().map(f => read(D('tours/' + f)));

// ---- валидация связей ----
const errors = [], ids = (a, n) => { const s = new Set(); a.forEach(x => { if (s.has(x.id)) errors.push(`${n}: дубль id ${x.id}`); s.add(x.id); }); return s; };
const catIds = ids(categories, 'categories'), couIds = ids(countries, 'countries'), guideIds = ids(guides, 'guides'), tourIds = ids(tours, 'tours'); ids(departures, 'departures');
const imgKeys = new Set([...Object.keys(images.unsplash), ...Object.keys(images.commons)]);
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const REQ = ['title', 'country', 'region', 'category', 'days', 'price_from', 'season', 'group', 'difficulty', 'short', 'description', 'highlights', 'itinerary', 'accommodation', 'transport', 'meals', 'included', 'excluded', 'requirements', 'equipment', 'restrictions', 'suitable_for', 'not_suitable_for', 'advantages', 'faq', 'alternatives', 'guide', 'images'];
tours.forEach(t => {
  REQ.forEach(k => need(t[k] !== undefined && t[k] !== null && t[k] !== '', `${t.id}: нет поля ${k}`));
  need(couIds.has(t.country), `${t.id}: неизвестная страна ${t.country}`); need(catIds.has(t.category), `${t.id}: неизвестная категория ${t.category}`);
  need(guideIds.has(t.guide), `${t.id}: неизвестный гид ${t.guide}`); need(t.itinerary.length === t.days, `${t.id}: дней ${t.days}, в программе ${t.itinerary.length}`);
  need(t.nights === t.days - 1 || t.nights === t.days, `${t.id}: ночей ${t.nights}`);
  t.alternatives.forEach(a => need(tourIds.has(a.tour) && a.tour !== t.id, `${t.id}: неверная альтернатива ${a.tour}`));
  [t.images.hero, ...t.images.gallery].forEach(k => need(imgKeys.has(k), `${t.id}: нет изображения ${k}`));
  t.itinerary.forEach(d => need(d.title && d.summary && d.places && d.places.length, `${t.id}: день ${d.day} неполный`));
});
guides.forEach(g => { need(couIds.has(g.country), `гид ${g.id}: страна`); g.regions.forEach(r => need(couIds.has(r), `гид ${g.id}: регион ${r}`)); });
departures.forEach(d => need(tourIds.has(d.tour_id), `выезд ${d.id}: нет тура`));
tours.forEach(t => need(departures.some(d => d.tour_id === t.id), `${t.id}: нет выездов`));
if (errors.length) { console.error('ОШИБКИ:\n' + errors.join('\n')); process.exit(1); }

// ---- вычисляемые поля ----
const seasons = { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11] };
tours.forEach(t => {
  t.seasons = Object.keys(seasons).filter(s => t.season.months.some(m => seasons[s].includes(m)));
  t.is_demo = true; t.data_status = meta.demo.tour_flags;
});
const NJ = { meta, categories, countries, guides, tours, departures, company, images };
fs.writeFileSync(path.join(root, 'assets', 'data.js'), '/* Автогенерация: node scripts/build.js. Не редактировать вручную, правьте data/*.json */\nconst NJ = ' + JSON.stringify(NJ) + ';\n');

// ---- экспорт для AI-агента ----
const cou = Object.fromEntries(countries.map(c => [c.id, c])), cat = Object.fromEntries(categories.map(c => [c.id, c])), gd = Object.fromEntries(guides.map(g => [g.id, g]));
const LV = { 1: 'лёгкий', 2: 'средний', 3: 'сложный' }, MN = ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const catalog = tours.map(t => ({
  id: t.id, title: t.title, country: cou[t.country].name, region: t.region, continent: cou[t.country].continent, category: cat[t.category].name, category_id: t.category,
  format: t.format, private_available: t.private_available, days: t.days, price_from: t.price_from, currency: t.currency, single_supplement: t.single_supplement,
  season_months: t.season.months, season_names: t.season.months.map(m => MN[m]), seasons: t.seasons, season_best: t.season.best, season_note: t.season.note,
  group_min: t.group.min, group_max: t.group.max, difficulty: t.difficulty, difficulty_label: LV[t.difficulty], difficulty_note: t.difficulty_note,
  short: t.short, description: t.description, highlights: t.highlights,
  itinerary: t.itinerary.map(d => ({ day: d.day, title: d.title, places: d.places, summary: d.summary, activities: d.activities || [], free_time: d.free_time || null, unique_experience: d.unique_experience || null })),
  accommodation: t.accommodation, transport: t.transport, meals: t.meals, included: t.included, excluded: t.excluded, requirements: t.requirements, equipment: t.equipment,
  restrictions: t.restrictions, docs_note: t.docs_note, suitable_for: t.suitable_for, not_suitable_for: t.not_suitable_for, advantages: t.advantages, faq: t.faq,
  alternatives: t.alternatives.map(a => ({ tour_id: a.tour, title: tours.find(x => x.id === a.tour).title, reason: a.reason })),
  guide: { id: t.guide, name: gd[t.guide].name, role: gd[t.guide].role, languages: gd[t.guide].languages, style: gd[t.guide].style },
  departures: departures.filter(d => d.tour_id === t.id).map(d => ({ start_date: d.start_date, end_date: d.end_date, status: d.status, seats_available: d.seats_available, price: d.price_override || t.price_from, is_demo: d.is_demo })),
  booking: { prepayment_percent: company.payment.prepayment_percent, final_payment_days_before: company.payment.final_payment_days_before, cancellation_policy: company.cancellation.policy_id },
  data_status: { is_demo: true, ...meta.demo.tour_flags }, tags: t.tags
}));
fs.mkdirSync(path.join(root, 'export'), { recursive: true });
fs.writeFileSync(path.join(root, 'export', 'catalog.json'), JSON.stringify({ generated_for: 'NOMAD AI Sales Agent', data_version: meta.data_version, is_demo: true, notice: meta.demo.notice, tours: catalog }, null, 1));

// ---- PostgreSQL ----
const q = v => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : "'" + String(v).replace(/'/g, "''") + "'";
const arr = (a, t = 'text') => !a || !a.length ? `ARRAY[]::${t}[]` : `ARRAY[${a.map(q).join(',')}]::${t}[]`;
const j = v => q(JSON.stringify(v)) + '::jsonb';
const ins = (table, cols, rows) => rows.length ? `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${rows.map(r => '  (' + r.join(', ') + ')').join(',\n')};\n` : '';
let sql = '-- Автогенерация: node scripts/build.js\n-- Все данные демонстрационные (is_demo = TRUE). Заменить подтверждёнными данными перед запуском.\nBEGIN;\n';
sql += ins('categories', ['id', 'name', 'icon', 'description'], categories.map(c => [q(c.id), q(c.name), q(c.icon), q(c.description)]));
sql += ins('countries', ['id', 'name', 'continent', 'languages', 'currency_local'], countries.map(c => [q(c.id), q(c.name), q(c.continent), arr(c.languages), q(c.currency_local)]));
sql += ins('guides', ['id', 'name', 'role', 'city', 'country_id', 'languages', 'experience_years', 'specialties', 'bio', 'style', 'photo_url', 'credentials', 'is_demo_profile'],
  guides.map(g => [q(g.id), q(g.name), q(g.role), q(g.city), q(g.country), arr(g.languages), g.experience_years, arr(g.specialties), q(g.bio), q(g.style), q(g.photo), j(g.credentials), q(g.is_demo_profile)]));
sql += ins('guide_countries', ['guide_id', 'country_id'], guides.flatMap(g => g.regions.map(r => [q(g.id), q(r)])));
sql += ins('cancellation_policies', ['id', 'name', 'disclaimer', 'is_demo', 'tiers'], [[q(company.cancellation.policy_id), q(company.cancellation.name), q(company.cancellation.disclaimer), q(true), j(company.cancellation.tiers)]]);
sql += ins('tours', ['id', 'title', 'country_id', 'region', 'category_id', 'format', 'private_available', 'days', 'nights', 'start_point', 'end_point', 'price_from', 'currency', 'single_supplement', 'season_months', 'season_best', 'season_note', 'group_min', 'group_max', 'difficulty', 'difficulty_note', 'fitness_requirements', 'short_description', 'description', 'highlights', 'accommodation', 'transport', 'meals', 'included', 'excluded', 'requirements', 'equipment', 'restrictions', 'docs_note', 'suitable_for', 'not_suitable_for', 'advantages', 'guide_id', 'cancellation_policy_id', 'hero_image', 'gallery_images', 'tags', 'is_demo', 'data_status'],
  tours.map(t => [q(t.id), q(t.title), q(t.country), q(t.region), q(t.category), q(t.format), q(t.private_available), t.days, t.nights, q(t.start_point), q(t.end_point), t.price_from, q(t.currency), t.single_supplement, arr(t.season.months, 'smallint'), q(t.season.best), q(t.season.note), t.group.min, t.group.max, t.difficulty, q(t.difficulty_note), q(t.fitness_requirements), q(t.short), q(t.description), arr(t.highlights), q(t.accommodation), q(t.transport), q(t.meals), arr(t.included), arr(t.excluded), arr(t.requirements), arr(t.equipment), arr(t.restrictions), q(t.docs_note), arr(t.suitable_for), arr(t.not_suitable_for), arr(t.advantages), q(t.guide), q(t.cancellation_policy), q(t.images.hero), arr(t.images.gallery), arr(t.tags), q(true), j(t.data_status)]));
sql += ins('tour_days', ['tour_id', 'day_no', 'title', 'places', 'summary', 'activities', 'free_time', 'unique_experience'],
  tours.flatMap(t => t.itinerary.map(d => [q(t.id), d.day, q(d.title), arr(d.places), q(d.summary), arr(d.activities), q(d.free_time || null), q(d.unique_experience || null)])));
sql += ins('tour_faq', ['tour_id', 'position', 'question', 'answer'], tours.flatMap(t => t.faq.map((f, i) => [q(t.id), i + 1, q(f.q), q(f.a)])));
sql += ins('tour_alternatives', ['tour_id', 'alt_tour_id', 'reason'], tours.flatMap(t => t.alternatives.map(a => [q(t.id), q(a.tour), q(a.reason)])));
sql += ins('departures', ['id', 'tour_id', 'start_date', 'end_date', 'status', 'seats_total', 'seats_available', 'price_override', 'is_demo', 'note'],
  departures.map(d => [q(d.id), q(d.tour_id), q(d.start_date), q(d.end_date), q(d.status), d.seats_total, q(d.seats_available), q(d.price_override), q(d.is_demo), q(d.note)]));
const imgRows = [...Object.entries(images.unsplash).map(([k, v]) => [q(k), q('unsplash'), q(v), q(null), q('Unsplash License'), q(null)]), ...Object.entries(images.commons).map(([k, v]) => [q(k), q('commons'), q(v.file), q(v.author), q(v.license), q(v.page)])];
sql += ins('images', ['key', 'source', 'ref', 'author', 'license', 'page_url'], imgRows);
sql += ins('company_faq', ['position', 'category', 'question', 'answer'], company.faq.map((f, i) => [i + 1, q(f.category), q(f.q), q(f.a)]));
sql += 'COMMIT;\n';
fs.mkdirSync(path.join(root, 'db'), { recursive: true });
fs.writeFileSync(path.join(root, 'db', 'seed.sql'), sql);
console.log(`OK: ${tours.length} туров, ${guides.length} гидов, ${countries.length} стран, ${departures.length} выездов, ${imgRows.length} изображений`);
