// Генерирует ДЕМОНСТРАЦИОННЫЕ выезды по сезонам туров. После запуска файл data/departures.json
// редактируется вручную или заменяется данными из реальной системы. Все записи помечены is_demo: true.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'data');
const tours = fs.readdirSync(path.join(root, 'tours')).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(fs.readFileSync(path.join(root, 'tours', f), 'utf8')));
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const iso = d => d.toISOString().slice(0, 10);
const out = [];
for (const t of tours) {
  const h = hash(t.id), months = t.season.months.slice().sort((a, b) => a - b);
  // выбираем до 4 месяцев сезона, равномерно, в 2027 году
  const pick = months.length <= 4 ? months : [0, 1, 2, 3].map(i => months[Math.round(i * (months.length - 1) / 3)]);
  pick.forEach((m, i) => {
    const day = 3 + ((h >> (i * 3)) % 20), d = new Date(Date.UTC(2027, m - 1, day));
    const end = new Date(d.getTime() + (t.days - 1) * 86400000);
    const total = t.group.max, left = t.format === 'private' ? null : 1 + ((h >> (i + 2)) % (total - 1));
    out.push({ id: `${t.id}-${iso(d)}`, tour_id: t.id, start_date: iso(d), end_date: iso(end),
      status: t.format === 'private' ? 'on_request' : (left <= 2 ? 'last_places' : 'open'),
      seats_total: total, seats_available: left,
      price_override: (m === 7 || m === 8 || m === 12) ? Math.round(t.price_from * 1.08 / 1000) * 1000 : null,
      is_demo: true, note: 'Демонстрационная дата и количество мест. Требуют подтверждения оператором.' });
  });
}
fs.writeFileSync(path.join(root, 'departures.json'), JSON.stringify(out, null, 2));
console.log('departures:', out.length);
