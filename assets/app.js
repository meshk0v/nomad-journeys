/* NOMAD Journeys — логика сайта. Данные: assets/data.js (генерируется из data/*.json, см. scripts/build.js) */
const { tours: TOURS, guides: GUIDES, categories: CATS, countries: COUNTRIES, departures: DEPS, company: CO, images: IM, meta: META } = NJ;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BY = a => Object.fromEntries(a.map(x => [x.id, x]));
const CAT = BY(CATS), COU = BY(COUNTRIES), GD = BY(GUIDES), TR = BY(TOURS);
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const SEASONS = { winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' };
const LEVELS = ['', 'Лёгкий', 'Средний', 'Сложный'];
const STATUS = { open: 'Места есть', last_places: 'Последние места', on_request: 'По запросу', full: 'Мест нет', cancelled: 'Отменён' };
const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = d => new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const plural = (n, a) => n % 10 === 1 && n % 100 !== 11 ? a[0] : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? a[1] : a[2];
const days = n => n + ' ' + plural(n, ['день', 'дня', 'дней']);
const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`;
const img = (key, w = 800) => IM.unsplash[key] ? U(IM.unsplash[key], w) : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(IM.commons[key].file)}?width=${w}`;
const credit = key => IM.commons[key] ? `Фото: ${IM.commons[key].author}, ${IM.commons[key].license}` : 'Фото: Unsplash';
const depsOf = t => DEPS.filter(d => d.tour_id === t.id && d.status !== 'cancelled').sort((a, b) => a.start_date.localeCompare(b.start_date));
const priceOf = (t, d) => d && d.price_override ? d.price_override : t.price_from;
const list = a => a && a.length ? `<ul class="ul">${a.map(x => `<li>${x}</li>`).join('')}</ul>` : '';
const demoTag = '<span class="demo-tag" title="Демонстрационные данные: требуют подтверждения">демо</span>';

const favs = {
  get: () => JSON.parse(localStorage.getItem('nj-fav') || '[]'),
  toggle(id) { const f = this.get(), i = f.indexOf(id); i < 0 ? f.push(id) : f.splice(i, 1); localStorage.setItem('nj-fav', JSON.stringify(f)); $$('.fav b').forEach(b => b.textContent = f.length); return i < 0; }
};
function toast(msg) { let t = $('.toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toast' })); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------- шапка и подвал ---------- */
function layout() {
  const page = document.body.dataset.page;
  const nav = [['tours.html', 'Туры', 'tours'], ['match.html', 'Подбор тура', 'match'], ['destinations.html', 'Направления', 'dest'], ['guides.html', 'Гиды', 'guides'], ['about.html', 'О компании', 'about'], ['contacts.html', 'Контакты', 'contacts']];
  const logo = '<a class="logo" href="index.html"><img src="assets/logo.svg" alt="" width="34" height="34"><span><b>NOMAD</b> Journeys</span></a>';
  document.body.insertAdjacentHTML('afterbegin', `<header class="hd"><div class="wrap">${logo}<nav class="nav">${nav.map(n => `<a href="${n[0]}" class="${page === n[2] ? 'on' : ''}">${n[1]}</a>`).join('')}</nav>
  <a class="fav" href="favorites.html">♥ Избранное<b>${favs.get().length}</b></a><button class="burger" aria-label="Меню">☰</button></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `<footer class="ft-main"><div class="wrap"><div class="ftg">
  <div>${logo.replace('class="logo"', 'class="logo light"')}<p style="max-width:330px;font-size:15px;margin-top:12px">Авторские путешествия малыми группами. Подробные программы, понятные условия и гиды, которые знают регион.</p></div>
  <div><h4>Путешествия</h4><a href="tours.html">Все туры</a><a href="match.html">Подбор тура</a><a href="destinations.html">Направления</a><a href="guides.html">Гиды</a><a href="favorites.html">Избранное</a></div>
  <div><h4>Компания</h4><a href="about.html">О компании</a><a href="how-it-works.html">Как организуются поездки</a><a href="booking-payment.html">Бронирование и оплата</a><a href="safety.html">Безопасность</a><a href="become-guide.html">Стать гидом-партнёром</a></div>
  <div><h4>Связь</h4><a href="contacts.html">${CO.contacts.email}</a><a href="contacts.html">${CO.contacts.phone}</a><a href="faq.html">Частые вопросы</a><a href="data-status.html">Данные и фото</a></div></div>
  <div class="copy"><span>© 2026 NOMAD Journeys. Демонстрационный проект, не является публичной офертой.</span><span>Контакты и условия — шаблонные.</span></div></div></footer>`);
  $('.burger').onclick = () => $('.nav').classList.toggle('open');
}

/* ---------- карточка тура ---------- */
function card(t) {
  const on = favs.get().includes(t.id), d = depsOf(t)[0], g = GD[t.guide];
  return `<article class="card"><a class="ph" href="tour.html?id=${t.id}"><img loading="lazy" src="${img(t.images.hero, 700)}" alt="${t.title}"><span class="tag">${CAT[t.category].name}</span>${t.format === 'private' ? '<span class="tag hot">Приватный</span>' : t.private_available ? '<span class="tag hot" title="Можно организовать для своей компании">Можно приватно</span>' : ''}</a>
  <button class="heart ${on ? 'on' : ''}" data-fav="${t.id}" aria-label="В избранное">♥</button>
  <div class="bd"><div class="meta"><span>📍 ${COU[t.country].name}</span><span>🕒 ${days(t.days)}</span><span>👥 ${t.group.min}–${t.group.max}</span></div>
  <h3><a href="tour.html?id=${t.id}">${t.title}</a></h3>
  <p class="short">${t.short}</p>
  <div class="meta"><span class="lvl l${t.difficulty}">${LEVELS[t.difficulty]}</span><span>🧭 ${g.name}</span></div>
  <div class="ft"><div class="price"><small>от${demoTag}</small><b>${rub(t.price_from)}</b></div>${d ? `<span class="dt">📅 ${fmtShort(d.start_date)}</span>` : ''}</div></div></article>`;
}
function bindFavs(root = document) {
  $$('[data-fav]', root).forEach(b => b.onclick = e => { e.preventDefault(); const on = favs.toggle(b.dataset.fav); $$(`[data-fav="${b.dataset.fav}"]`).forEach(x => x.classList.toggle('on', on)); toast(on ? 'Добавлено в избранное' : 'Убрано из избранного'); if (document.body.dataset.page === 'favorites') renderFavs(); });
}
function renderCards(el, list) { el.innerHTML = list.map(card).join(''); bindFavs(el); $$('.card', el).forEach((c, i) => { c.classList.add('rv'); c.style.setProperty('--i', i % 6); }); fx(); }
function guideCard(g) {
  const n = TOURS.filter(t => t.guide === g.id).length;
  return `<a class="gd" href="guide.html?id=${g.id}"><div class="av" style="--h:${hue(g.id)}">${initials(g.name)}</div><div><h3>${g.name}</h3><div class="role">${g.role}</div></div><p>${g.bio}</p>
  <div class="chips"><span class="chip">${g.city}, ${COU[g.country].name}</span><span class="chip">${g.languages.join(', ')}</span><span class="chip">${g.experience_years} лет опыта</span></div>
  <span class="gd-link">${n} ${plural(n, ['тур', 'тура', 'туров'])} →</span></a>`;
}
const monthsOk = (t, m) => t.season.months.includes(+m);
const seasonOk = (t, s) => t.seasons.includes(s);

/* ---------- страницы ---------- */
const pages = {
  home() {
    const FEAT = ['dolomites-lakes', 'nepal-annapurna-base-camp', 'kyoto-tea', 'iceland-aurora', 'peru-salkantay', 'norway-lofoten', 'morocco-sahara-medina', 'georgia-wine-mountains', 'newzealand-south-island'];
    renderCards($('#hot'), FEAT.map(id => TR[id]));
    $('#prev').onclick = () => $('#hot').scrollBy({ left: -380, behavior: 'smooth' }); $('#next').onclick = () => $('#hot').scrollBy({ left: 380, behavior: 'smooth' });
    const nC = new Set(TOURS.map(t => t.country)).size;
    $('#stats').innerHTML = [[TOURS.length, 'маршрутов в каталоге'], [nC, 'стран'], [CATS.length, 'типов путешествий'], [GUIDES.length, 'профилей гидов']].map(s => `<div><b data-n="${s[0]}">0</b><span>${s[1]}</span></div>`).join('');
    const E = [['🏔️', 'Горы', 'Перевалы, приюты и рассветы выше облаков.', 'np-1', 'trek'], ['🌊', 'Океан и острова', 'Лагуны, снорклинг и дни без спешки.', 'aerial', 'beach'], ['🏜️', 'Пустыни и каньоны', 'Дюны, ущелья и ночёвки среди скал.', 'ma-1', 'adventure'], ['🐘', 'Экспедиции', 'Дальние маршруты: сафари, юрты и вулканы.', 'tz-1', 'expedition'], ['🌌', 'Север и фототуры', 'Сияние, лофотенские фьорды и свет Севера.', 'aurora', 'photo']];
    $('#elems').innerHTML = E.map((e, i) => `<div class="el ${i === 0 ? 'on' : ''}" data-href="tours.html?cat=${e[4]}" style="background-image:url('${img(e[3], 900)}')"><div><i>${e[0]}</i><h3>${e[1]}</h3><p>${e[2]}</p><a href="tours.html?cat=${e[4]}">Смотреть туры →</a></div></div>`).join('');
    $$('.el').forEach(el => { el.onclick = () => location.href = el.dataset.href; el.onmouseenter = () => $$('.el').forEach(x => x.classList.toggle('on', x === el)); });
    const DS = [['it', 'dolomites-lakes'], ['jp', 'kyoto-tea'], ['np', 'nepal-annapurna-base-camp'], ['is', 'iceland-aurora'], ['pe', 'peru-salkantay'], ['ma', 'morocco-sahara-medina']];
    $('#dests').innerHTML = DS.map(([c, tid]) => { const n = TOURS.filter(t => t.country === c).length; return `<a class="tile" href="tours.html?country=${c}"><img loading="lazy" src="${img(TR[tid].images.hero, 800)}" alt="${COU[c].name}"><div><h3>${COU[c].name}</h3><span>${n} ${plural(n, ['тур', 'тура', 'туров'])}</span></div></a>`; }).join('');
    $('#guides').innerHTML = ['anna', 'tashi', 'kenji', 'diego'].map(id => guideCard(GD[id])).join('');
    const m = $('#sMonth'); m.innerHTML = '<option value="">Любой</option>' + MONTHS.map((n, i) => `<option value="${i + 1}">${n}</option>`).join('');
    $('#sCat').innerHTML = '<option value="">Любой</option>' + CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    $('#search').onsubmit = e => { e.preventDefault(); const p = new URLSearchParams(); if ($('#sQ').value) p.set('q', $('#sQ').value); if (m.value) p.set('month', m.value); if ($('#sCat').value) p.set('cat', $('#sCat').value); location.href = 'tours.html?' + p; };
    $('#sQ').setAttribute('list', 'dl'); $('#dl').innerHTML = COUNTRIES.filter(c => TOURS.some(t => t.country === c.id)).map(c => `<option>${c.name}</option>`).join('');
    const S = [['np-1', 'Непал · Аннапурна', 'горы'], ['dolomites', 'Италия · Доломиты', 'озёра'], ['aurora', 'Исландия · северное сияние', 'сияние'], ['ma-1', 'Марокко · Сахара', 'пустыню'], ['nz-1', 'Новая Зеландия · Милфорд-Саунд', 'фьорды']];
    $('#slides').innerHTML = S.map(x => `<div class="slide" style="background-image:url('${img(x[0], 1800)}')"></div>`).join('');
    let k = 0; const sl = $$('.slide'), rot = $('#rot'), cap = $('#cap');
    const show = () => { sl.forEach((x, i) => x.classList.toggle('on', i === k)); rot.innerHTML = `<b>${S[k][2]}</b>`; cap.textContent = '📍 ' + S[k][1]; };
    show(); setInterval(() => { k = (k + 1) % S.length; show(); }, 6500);
    window.addEventListener('scroll', () => { const y = scrollY; if (y < innerHeight * 1.2) { $('.m1').style.transform = `translateY(${y * .12}px)`; $('.m2').style.transform = `translateY(${y * .06}px)`; $('.hero-in').style.transform = `translateY(${y * .25}px)`; $('.hero-in').style.opacity = Math.max(0, 1 - y / (innerHeight * .8)); } }, { passive: true });
  },

  tours() {
    const P = new URLSearchParams(location.search);
    const present = COUNTRIES.filter(c => TOURS.some(t => t.country === c.id));
    $('#fCountry').innerHTML = present.map(c => `<label><input type="checkbox" name="country" value="${c.id}" ${P.get('country') === c.id ? 'checked' : ''}>${c.name} <small>${TOURS.filter(t => t.country === c.id).length}</small></label>`).join('');
    $('#fCat').innerHTML = CATS.map(c => `<label><input type="checkbox" name="cat" value="${c.id}" ${P.get('cat') === c.id ? 'checked' : ''}>${c.name} <small>${TOURS.filter(t => t.category === c.id).length}</small></label>`).join('');
    $('#fSeason').innerHTML = Object.entries(SEASONS).map(([k, v]) => `<label><input type="checkbox" name="season" value="${k}" ${P.get('season') === k ? 'checked' : ''}>${v}</label>`).join('');
    $('#fMonth').innerHTML = '<option value="">Любой месяц</option>' + MONTHS.map((n, i) => `<option value="${i + 1}" ${P.get('month') == i + 1 ? 'selected' : ''}>${n}</option>`).join('');
    $('#fQ').value = P.get('q') || '';
    if (P.get('level')) { const r = $(`[name=lvl][value="${P.get('level')}"]`); if (r) r.checked = true; }
    const DUR = { s: [1, 6], m: [7, 9], l: [10, 12], xl: [13, 99] };
    const SORTS = { rec: (a, b) => a.title.localeCompare(b.title, 'ru'), cheap: (a, b) => a.price_from - b.price_from, exp: (a, b) => b.price_from - a.price_from, short: (a, b) => a.days - b.days, long: (a, b) => b.days - a.days, easy: (a, b) => a.difficulty - b.difficulty || a.price_from - b.price_from, date: (a, b) => (depsOf(a)[0] || { start_date: '9' }).start_date.localeCompare((depsOf(b)[0] || { start_date: '9' }).start_date) };
    const run = () => {
      const q = $('#fQ').value.trim().toLowerCase(), v = n => $$(`[name=${n}]:checked`).map(x => x.value), lvl = ($('[name=lvl]:checked') || {}).value || '';
      const co = v('country'), ca = v('cat'), se = v('season'), du = v('dur'), fm = v('format'), mo = $('#fMonth').value, pr = +$('#fPrice').value;
      $('#vPrice').textContent = pr >= 400000 ? 'любая' : 'до ' + rub(pr);
      const l = TOURS.filter(t => (!q || [t.title, COU[t.country].name, t.region, CAT[t.category].name, GD[t.guide].name, t.tags.join(' ')].join(' ').toLowerCase().includes(q))
        && (!co.length || co.includes(t.country)) && (!ca.length || ca.includes(t.category)) && (!lvl || t.difficulty == lvl) && (!se.length || se.some(s => seasonOk(t, s)))
        && (!mo || monthsOk(t, mo)) && (!du.length || du.some(k => t.days >= DUR[k][0] && t.days <= DUR[k][1])) && t.price_from <= pr
        && (!fm.length || fm.some(f => f === 'group' ? t.format === 'small_group' : t.private_available || t.format === 'private')));
      l.sort(SORTS[$('#sort').value]);
      $('#count').textContent = `${l.length} ${plural(l.length, ['тур', 'тура', 'туров'])} из ${TOURS.length}`;
      $('#list').innerHTML = l.length ? '' : `<div class="empty" style="grid-column:1/-1"><h3>Ничего не нашли</h3><p>Попробуйте убрать часть фильтров или воспользуйтесь <a href="match.html" style="color:var(--accent2);font-weight:600">подбором тура</a>: он предложит ближайшие варианты.</p></div>`;
      if (l.length) renderCards($('#list'), l);
      const chips = [...co.map(c => COU[c].name), ...ca.map(c => CAT[c].name), ...se.map(s => SEASONS[s]), ...(lvl ? [LEVELS[lvl]] : []), ...(mo ? [MONTHS[mo - 1]] : [])];
      $('#active').innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('');
    };
    $$('.filters input,.filters select,#sort').forEach(e => e.addEventListener('input', run));
    $('#reset').onclick = () => { $$('.filters input[type=checkbox],.filters input[type=radio]').forEach(c => c.checked = false); $('#fQ').value = ''; $('#fPrice').value = 400000; $('#fMonth').value = ''; run(); };
    $('.fbtn').onclick = () => $('.filters').classList.add('open'); $('#close').onclick = () => $('.filters').classList.remove('open');
    run();
  },

  tour() {
    const t = TR[new URLSearchParams(location.search).get('id')];
    if (!t) { $('main').innerHTML = '<div class="wrap s"><div class="empty"><h3>Тур не найден</h3><a class="btn" href="tours.html">В каталог</a></div></div>'; return; }
    const g = GD[t.guide], co = COU[t.country], deps = depsOf(t), on = favs.get().includes(t.id);
    document.title = `${t.title} — NOMAD Journeys`; $('meta[name=description]').content = t.short;
    const gal = [t.images.hero, ...t.images.gallery];
    $('#crumbs').innerHTML = `<a href="index.html">Главная</a> / <a href="tours.html">Туры</a> / <a href="tours.html?country=${t.country}">${co.name}</a>`;
    const tiers = CO.cancellation.tiers.map(r => `<tr><td>${r.days_to === null ? 'за ' + r.days_from + ' и более дней' : r.days_from === 0 ? 'менее чем за ' + (r.days_to + 1) + ' дней' : 'за ' + r.days_from + '–' + r.days_to + ' дней'}</td><td><b>${r.refund_percent}%</b></td><td>${r.note}</td></tr>`).join('');
    $('#tour').innerHTML = `<div class="gal n${Math.min(gal.length, 5)}">${gal.slice(0, 5).map((k, i) => `<img src="${img(k, i ? 700 : 1200)}" alt="${t.title} — фото ${i + 1}" title="${credit(k)}">`).join('')}</div>
    <p class="photo-credit">${credit(gal[0])}</p>
    <div class="det"><div class="det-main">
      <span class="eyebrow">${CAT[t.category].name} · ${co.name}</span><h1>${t.title}</h1>
      <p class="lead">${t.short}</p>
      <div class="facts"><div class="fact"><small>Длительность</small><b>${days(t.days)} / ${t.nights} ${plural(t.nights, ['ночь', 'ночи', 'ночей'])}</b></div><div class="fact"><small>Группа</small><b>${t.group.min}–${t.group.max} человек</b></div><div class="fact"><small>Сложность</small><b class="lvl l${t.difficulty}">${LEVELS[t.difficulty]}</b></div><div class="fact"><small>Лучшее время</small><b>${t.season.best}</b></div>
      <div class="fact"><small>Формат</small><b>${t.format === 'private' ? 'Приватная поездка' : t.private_available ? 'Малая группа, можно приватно' : 'Малая группа'}</b></div><div class="fact"><small>Старт → финиш</small><b>${t.start_point} → ${t.end_point}</b></div><div class="fact"><small>Гид</small><b><a href="guide.html?id=${g.id}">${g.name}</a></b></div><div class="fact"><small>Язык группы</small><b>Русский</b></div></div>
      <nav class="subnav"><a href="#overview">Обзор</a><a href="#program">Программа</a><a href="#logistics">Организация</a><a href="#included">Стоимость</a><a href="#prepare">Подготовка</a><a href="#booking">Бронирование</a><a href="#faq">Вопросы</a></nav>
      <section id="overview"><h2>О маршруте</h2><p>${t.description}</p><h3>Главное в туре</h3>${list(t.highlights)}
      <div class="two"><div class="box good"><h4>Кому подойдёт</h4>${list(t.suitable_for)}</div><div class="box bad"><h4>Кому может не подойти</h4>${list(t.not_suitable_for)}</div></div>
      <h3>Преимущества формата</h3><div class="chips">${t.advantages.map(a => `<span class="chip">${a}</span>`).join('')}</div>
      <h3>Нагрузка и сезон</h3><p><b>Сложность — ${LEVELS[t.difficulty].toLowerCase()}.</b> ${t.difficulty_note}</p><p><b>Сезон:</b> ${t.season.months.map(m => MONTHS[m - 1].toLowerCase()).join(', ')}. ${t.season.note}</p></section>
      <section id="program"><h2>Программа по дням</h2><div class="days">${t.itinerary.map(d => `<details class="dayx" ${d.day === 1 ? 'open' : ''}><summary><em>День ${d.day}</em><span>${d.title}</span></summary><div class="dbody"><p>${d.summary}</p>
        <div class="places">${d.places.map(p => `<span>📍 ${p}</span>`).join('')}</div>
        ${d.activities ? `<p class="dl"><b>Активности:</b> ${d.activities.join('; ')}.</p>` : ''}${d.free_time ? `<p class="dl"><b>Свободное время:</b> ${d.free_time}</p>` : ''}${d.unique_experience ? `<p class="dl wow">✨ ${d.unique_experience}</p>` : ''}</div></details>`).join('')}</div>
      <div class="note-demo">Программа — концепт маршрута. Перед запуском выезда оператор подтверждает логистику, расписания и доступность объектов.</div></section>
      <section id="logistics"><h2>Организация</h2><div class="rows"><div><h4>🏨 Размещение</h4><p>${t.accommodation}</p></div><div><h4>🚐 Транспорт</h4><p>${t.transport}</p></div><div><h4>🍽️ Питание</h4><p>${t.meals}</p></div></div>
      <h3>Ограничения и особенности</h3>${list(t.restrictions)}</section>
      <section id="included"><h2>Что входит в стоимость</h2><div class="two"><div class="box good"><h4>Включено</h4>${list(t.included)}</div><div class="box bad"><h4>Оплачивается отдельно</h4>${list(t.excluded)}</div></div>
      <p class="muted">Базовая цена — за человека при двухместном размещении. Доплата за одноместное размещение — ${rub(t.single_supplement)} ${demoTag}.</p></section>
      <section id="prepare"><h2>Подготовка</h2><div class="two"><div><h4>Требования к участникам</h4>${list(t.requirements)}${t.fitness_requirements ? `<p>${t.fitness_requirements}</p>` : ''}</div><div><h4>Что взять</h4>${list(t.equipment)}</div></div>
      <div class="box warn"><h4>Визы и документы</h4><p>${t.docs_note || CO.entry_requirements_policy.text}</p><p class="muted">${CO.entry_requirements_policy.text}</p></div></section>
      <section id="booking"><h2>Даты и условия бронирования</h2>
      <table class="tbl"><thead><tr><th>Выезд</th><th>Наличие</th><th>Цена</th></tr></thead><tbody>${deps.map(d => `<tr><td>${fmtDate(d.start_date)} — ${fmtDate(d.end_date)}</td><td>${STATUS[d.status]}${d.seats_available !== null ? `, свободно ${d.seats_available} из ${d.seats_total}` : ''} ${demoTag}</td><td>${rub(priceOf(t, d))} ${demoTag}</td></tr>`).join('')}</tbody></table>
      <p class="muted">Даты и количество мест демонстрационные. Окончательные данные подтверждает менеджер.</p>
      <h3>Оплата</h3><p>Предоплата ${CO.payment.prepayment_percent}% при подтверждении места, окончательная оплата — за ${CO.payment.final_payment_days_before} дней до выезда ${demoTag}. Сайт сейчас не принимает платежи. <a href="booking-payment.html">Подробнее</a></p>
      <h3>Условия отмены (шаблон) ${demoTag}</h3><table class="tbl"><thead><tr><th>Когда отменяете</th><th>Возврат</th><th>Примечание</th></tr></thead><tbody>${tiers}</tbody></table>
      <p class="muted">${CO.cancellation.disclaimer} ${CO.refund.minimum_group_note}</p></section>
      <section id="faq"><h2>Частые вопросы о туре</h2>${t.faq.map(f => `<details class="faqi"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}</section>
      <section><h2>Ваш гид</h2><a class="ag" href="guide.html?id=${g.id}"><div class="av" style="--h:${hue(g.id)}">${initials(g.name)}</div><div><h3>${g.name}</h3><div class="role">${g.role} · ${g.city}</div><p>${g.bio}</p><p class="muted">${g.style}</p></div></a></section>
      <section><h2>Альтернативы</h2><div class="alts">${t.alternatives.map(a => `<a class="altc" href="tour.html?id=${a.tour}"><img loading="lazy" src="${img(TR[a.tour].images.hero, 400)}" alt=""><div><b>${TR[a.tour].title}</b><span>${a.reason}</span></div></a>`).join('')}</div></section>
    </div>
    <aside class="book"><div class="pr"><small>от ${demoTag}</small> ${rub(t.price_from)}<small> / чел.</small></div>
      <div class="f"><label>Дата выезда ${demoTag}</label><select class="in" id="bDate">${deps.map(d => `<option value="${d.id}">${fmtShort(d.start_date)} ${d.start_date.slice(0, 4)} · ${STATUS[d.status]}</option>`).join('')}</select></div>
      <div class="f"><label>Путешественники</label><select class="in" id="bN">${Array.from({ length: t.group.max }, (_, i) => `<option value="${i + 1}">${i + 1} ${plural(i + 1, ['человек', 'человека', 'человек'])}</option>`).join('')}</select></div>
      <label class="chk"><input type="checkbox" id="bSingle"> Одноместное размещение (+${rub(t.single_supplement)})</label>
      <div class="tot"><span>Ориентировочно</span><span id="bTot"></span></div><p class="muted" id="bPre"></p>
      <button class="btn lg" style="width:100%" id="bGo">Оставить запрос</button>
      <button class="btn ghost sm" style="width:100%;margin-top:10px;color:var(--forest)" data-fav="${t.id}">${on ? '♥ В избранном' : '♡ В избранное'}</button>
      <div class="trust"><span>Это не бронирование: запрос не списывает деньги</span><span>Условия — шаблон, см. «Бронирование и оплата»</span></div></aside></div>`;
    const upd = () => { const d = DEPS.find(x => x.id === $('#bDate').value), n = +$('#bN').value, tot = priceOf(t, d) * n + ($('#bSingle').checked ? t.single_supplement : 0); $('#bTot').textContent = rub(tot); $('#bPre').textContent = `Предоплата по шаблону (${CO.payment.prepayment_percent}%): ${rub(tot * CO.payment.prepayment_percent / 100)}. Платежи сейчас не принимаются.`; };
    $$('#bDate,#bN,#bSingle').forEach(e => e.oninput = upd); upd();
    bindFavs($('#tour')); $('[data-fav]', $('.book')).addEventListener('click', e => e.currentTarget.textContent = favs.get().includes(t.id) ? '♥ В избранном' : '♡ В избранное');
    $('#mTitle').textContent = t.title;
    $('#bGo').onclick = () => { const d = DEPS.find(x => x.id === $('#bDate').value); $('#mSum').textContent = `${fmtDate(d.start_date)} · ${$('#bN').value} чел. · ${$('#bTot').textContent}`; $('#modal').style.display = 'grid'; };
    $('#mClose').onclick = () => $('#modal').style.display = 'none';
    $('#bForm').onsubmit = e => {
      e.preventDefault(); const d = DEPS.find(x => x.id === $('#bDate').value);
      const req = { type: 'tour_inquiry', tour_id: t.id, departure_id: d.id, travelers: +$('#bN').value, single_room: $('#bSingle').checked, estimated_total: +$('#bTot').textContent.replace(/\D/g, ''), currency: 'RUB', contact: { name: $('#bName').value, channel: $('#bContact').value }, comment: $('#bComment').value, is_demo: true };
      $('#bPreview').textContent = JSON.stringify(req, null, 2); e.target.style.display = 'none'; $('#bOk').style.display = 'block';
    };
  },

  dest() {
    const present = COUNTRIES.filter(c => TOURS.some(t => t.country === c.id)), conts = ['Все', ...new Set(present.map(c => c.continent))];
    const draw = c => $('#dgrid').innerHTML = present.filter(x => c === 'Все' || x.continent === c).map(x => { const ts = TOURS.filter(t => t.country === x.id); return `<a class="tile" href="tours.html?country=${x.id}"><img loading="lazy" src="${img(ts[0].images.hero, 700)}" alt="${x.name}"><div><h3>${x.name}</h3><span>${x.continent} · ${ts.length} ${plural(ts.length, ['тур', 'тура', 'туров'])}</span></div></a>`; }).join('');
    $('#dtabs').innerHTML = conts.map((c, i) => `<button class="btn sm ${i ? 'ghost' : 'dark'}">${c}</button>`).join('');
    $$('#dtabs button').forEach(b => b.onclick = () => { $$('#dtabs button').forEach(x => x.className = 'btn sm ghost'); b.className = 'btn sm dark'; draw(b.textContent); });
    draw('Все');
  },

  guides() {
    const cs = [...new Set(GUIDES.map(g => g.country))].map(c => COU[c]);
    $('#gtabs').innerHTML = [{ id: '', name: 'Все страны' }, ...cs].map((c, i) => `<button class="btn sm ${i ? 'ghost' : 'dark'}" data-c="${c.id}">${c.name}</button>`).join('');
    const draw = c => { const l = GUIDES.filter(g => !c || g.country === c || g.regions.includes(c)); $('#glist').innerHTML = l.map(guideCard).join(''); fx(); };
    $$('#gtabs button').forEach(b => b.onclick = () => { $$('#gtabs button').forEach(x => x.className = 'btn sm ghost'); b.className = 'btn sm dark'; draw(b.dataset.c); });
    draw('');
  },

  guide() {
    const g = GD[new URLSearchParams(location.search).get('id')];
    if (!g) { $('#gp').innerHTML = '<div class="empty"><h3>Профиль не найден</h3><a class="btn" href="guides.html">Все гиды</a></div>'; return; }
    document.title = `${g.name} — гид NOMAD Journeys`;
    const ts = TOURS.filter(t => t.guide === g.id);
    $('#gp').innerHTML = `<div class="gprof"><div class="av big" style="--h:${hue(g.id)}">${initials(g.name)}</div><div><span class="eyebrow">${g.role}</span><h1>${g.name}</h1>
      <div class="chips"><span class="chip">📍 ${g.city}, ${COU[g.country].name}</span><span class="chip">🗣 ${g.languages.join(', ')}</span><span class="chip">⏳ опыт ${g.experience_years} лет</span></div></div></div>
      <div class="det"><div><h2>О гиде</h2><p>${g.bio}</p><h3>Как проводит путешествия</h3><p>${g.style}</p><h3>Специализация</h3><div class="chips">${g.specialties.map(s => `<span class="chip">${s}</span>`).join('')}</div>
      <h3>Направления работы</h3><div class="chips">${g.regions.map(r => `<a class="chip" href="tours.html?country=${r}">${COU[r].name}</a>`).join('')}</div></div>
      <aside class="box warn"><h4>Демонстрационный профиль</h4><p>Это вымышленный персонаж для прототипа, а не реальный сотрудник. Фотография и подтверждённые квалификации появятся после подключения реального партнёра.</p></aside></div>
      <h2 style="margin:40px 0 18px">Туры гида (${ts.length})</h2><div class="grid g3" id="gtours"></div>`;
    renderCards($('#gtours'), ts);
  },

  favorites() { renderFavs(); },

  match() {
    $('#mMonth').innerHTML = '<option value="">Любой</option>' + MONTHS.map((n, i) => `<option value="${i + 1}">${n}</option>`).join('');
    $('#mCats').innerHTML = CATS.map(c => `<label class="pick"><input type="checkbox" name="mc" value="${c.id}"><span>${c.icon} ${c.name}</span></label>`).join('');
    $('#mForm').onsubmit = e => {
      e.preventDefault();
      const budget = +$('#mBudget').value, month = +$('#mMonth').value, dur = $('#mDur').value, fit = +$('#mFit').value, cats = $$('[name=mc]:checked').map(x => x.value), priv = $('#mPriv').checked;
      const DR = { '': [1, 99], s: [1, 7], m: [8, 10], l: [11, 99] };
      const res = TOURS.map(t => {
        let s = 0; const why = [], bad = [];
        if (cats.length) { if (cats.includes(t.category)) { s += 30; why.push('соответствует выбранному типу путешествия'); } else { s -= 15; bad.push('другой тип путешествия'); } }
        if (t.price_from <= budget) { s += 25; why.push(`укладывается в бюджет (${rub(t.price_from)})`); } else { s -= Math.min(40, Math.round((t.price_from - budget) / budget * 60)); bad.push(`дороже бюджета на ${rub(t.price_from - budget)}`); }
        if (month) { if (monthsOk(t, month)) { s += 20; why.push(`сезон подходит (${MONTHS[month - 1].toLowerCase()})`); } else { s -= 25; bad.push(`в ${MONTHS[month - 1].toLowerCase()} не лучший сезон`); } }
        const [a, b] = DR[dur]; if (dur) { if (t.days >= a && t.days <= b) { s += 15; why.push(`длительность ${days(t.days)}`); } else { s -= 10; bad.push(`длительность ${days(t.days)}`); } }
        if (t.difficulty <= fit) { s += 15; why.push(`нагрузка не выше вашей (${LEVELS[t.difficulty].toLowerCase()})`); } else { s -= 30 * (t.difficulty - fit); bad.push(`нагрузка выше заявленной (${LEVELS[t.difficulty].toLowerCase()})`); }
        if (priv) { if (t.private_available || t.format === 'private') { s += 10; why.push('можно организовать для своей компании'); } else { s -= 10; bad.push('приватный формат не предусмотрен'); } }
        return { t, s, why, bad };
      }).sort((x, y) => y.s - x.s);
      const top = res.slice(0, 5), strong = top.filter(r => !r.bad.length);
      $('#mRes').innerHTML = `<h2>${strong.length ? 'Подходящие варианты' : 'Точных совпадений нет, вот ближайшие варианты'}</h2>${strong.length ? '' : '<p class="muted">Ни один тур не подошёл по всем условиям. Ниже — те, что ближе всего, и указано, чем они отличаются от запроса. Попробуйте увеличить бюджет или выбрать другой месяц.</p>'}` +
        top.map(r => `<div class="mres">${card(r.t)}<div class="why"><b>Почему рассматриваем:</b>${list(r.why.length ? r.why : ['ближайший по совокупности параметров'])}${r.bad.length ? `<b>Что не совпадает:</b>${list(r.bad).replace('class="ul"', 'class="ul no"')}` : ''}</div></div>`).join('');
      bindFavs($('#mRes')); fx(); $('#mRes').scrollIntoView({ behavior: 'smooth' });
    };
  },

  faq() {
    const CT = { booking: 'Бронирование', groups: 'Группы', fitness: 'Подготовка', payment: 'Оплата и отмена', documents: 'Документы', travel: 'В поездке', ai: 'AI-консультант' };
    const draw = c => $('#faqList').innerHTML = CO.faq.filter(f => !c || f.category === c).map(f => `<details class="faqi"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
    $('#faqTabs').innerHTML = `<button class="btn sm dark" data-c="">Все</button>` + Object.entries(CT).map(([k, v]) => `<button class="btn sm ghost" data-c="${k}">${v}</button>`).join('');
    $$('#faqTabs button').forEach(b => b.onclick = () => { $$('#faqTabs button').forEach(x => x.className = 'btn sm ghost'); b.className = 'btn sm dark'; draw(b.dataset.c); });
    draw('');
  },

  form() { $$('form[data-demo]').forEach(f => f.onsubmit = e => { e.preventDefault(); f.style.display = 'none'; $('#ok').style.display = 'block'; scrollTo({ top: 0, behavior: 'smooth' }); }); }
};

/* ---------- блоки из данных компании (data-render) ---------- */
const R = {
  principles: () => CO.principles.map(p => `<div class="feat"><h3>${p.title}</h3><p>${p.text}</p></div>`).join(''),
  route: () => CO.route_creation.map(s => `<div class="step"><h3>${s.title}</h3><p>${s.text}</p></div>`).join(''),
  guides_sel: () => CO.guide_selection.map(p => `<div class="feat"><h3>${p.title}</h3><p>${p.text}</p></div>`).join(''),
  ops: () => CO.operations.map(p => `<div class="feat"><h3>${p.title}</h3><p>${p.text}</p></div>`).join(''),
  booking: () => CO.booking_steps.map(s => `<div class="step"><h3>${s.title}</h3><p>${s.text}</p></div>`).join(''),
  payment: () => `<p>Предоплата — <b>${CO.payment.prepayment_percent}%</b> от стоимости при подтверждении места. Окончательная оплата — не позднее чем за <b>${CO.payment.final_payment_days_before} дней</b> до выезда. ${CO.payment.methods_note}</p>`,
  cancel: () => `<table class="tbl"><thead><tr><th>Когда отменяете</th><th>Возврат</th><th>Что это значит</th></tr></thead><tbody>${CO.cancellation.tiers.map(r => `<tr><td>${r.days_to === null ? 'за ' + r.days_from + ' и более дней' : r.days_from === 0 ? 'менее чем за ' + (r.days_to + 1) + ' дней' : 'за ' + r.days_from + '–' + r.days_to + ' дней'}</td><td><b>${r.refund_percent}%</b></td><td>${r.note}</td></tr>`).join('')}</tbody></table><p class="muted">${CO.cancellation.disclaimer}</p>`,
  refund: () => `<p>${CO.refund.text}</p><p>${CO.refund.minimum_group_note}</p>`,
  safety: () => CO.safety.map(p => `<div class="feat"><h3>${p.title}</h3><p>${p.text}</p></div>`).join(''),
  entry: () => `<p>${CO.entry_requirements_policy.text}</p>`,
  contacts: () => `<p>📧 ${CO.contacts.email}</p><p>📞 ${CO.contacts.phone}</p><p>💬 ${CO.contacts.messenger}</p><p>🕒 ${CO.contacts.hours}</p><p class="muted">${CO.contacts.note}</p>`,
  flags: () => `<table class="tbl"><thead><tr><th>Данные</th><th>Статус</th></tr></thead><tbody>${[['Цены туров', 'демонстрационные, не являются предложением'], ['Даты выездов', 'демонстрационные'], ['Количество свободных мест', 'демонстрационное, не отражает реальное наличие'], ['Программы маршрутов', 'концепт: требует проверки оператором (расписания, доступность, разрешения)'], ['Визы и документы', 'не подтверждены, проверяются менеджером'], ['Профили гидов', 'вымышленные персонажи, без подтверждённых квалификаций и фотографий'], ['Условия оплаты и отмены', 'шаблон, требует утверждения юристом'], ['Контакты', 'вымышленные (домен .example)'], ['Отзывы', 'отсутствуют: публикуются только после реальных поездок']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`,
  credits: () => `<p class="muted">${IM.note}</p><ul class="credits">${Object.entries(IM.commons).map(([k, v]) => `<li><a href="${v.page}" target="_blank" rel="noopener">${v.file.replace(/_/g, ' ')}</a> — ${v.author}, ${v.license}</li>`).join('')}</ul>`
};
function renderBlocks() { $$('[data-render]').forEach(el => { el.innerHTML = R[el.dataset.render](); }); }

function renderFavs() {
  const l = favs.get().map(id => TR[id]).filter(Boolean);
  $('#flist').innerHTML = l.length ? '' : '<div class="empty" style="grid-column:1/-1"><h3>Пока пусто</h3><p>Нажмите ♥ на карточке тура, чтобы сохранить его здесь.</p><br><a class="btn" href="tours.html">Смотреть туры</a></div>';
  if (l.length) renderCards($('#flist'), l);
}

/* ---------- эффекты ---------- */
function fx() {
  if (!window._io) window._io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); window._io.unobserve(e.target); $$('[data-n]', e.target).forEach(c => { const to = +c.dataset.n, t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1600), v = to * (1 - Math.pow(1 - p, 3)); c.textContent = Math.round(v).toLocaleString('ru-RU'); p < 1 && requestAnimationFrame(f); }; requestAnimationFrame(f); }); } }), { threshold: .12 });
  $$('.rv:not(.seen)').forEach(el => { el.classList.add('seen'); window._io.observe(el); });
  $$('.card:not(.tl)').forEach(c => { c.classList.add('tl'); c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`; }); c.addEventListener('mouseleave', () => c.style.transform = ''); });
}

if (location.hash === '#shot') document.documentElement.classList.add('shot');
layout(); renderBlocks();
const pg = document.body.dataset.page; (pages[pg] || (() => { }))(); if (document.querySelector('form[data-demo]')) pages.form();
const hd = $('.hd'); const home = pg === 'home'; const onS = () => { hd.classList.toggle('solid', scrollY > 40); }; onS(); addEventListener('scroll', onS, { passive: true });
$$('.band').forEach(b => b.style.backgroundImage = `url('${img(b.dataset.parallax, 1800)}')`);
const PH = { tours: 'dolomites', dest: 'np-2', guides: 'hills', favorites: 'forest', about: 'bridge', how: 'valley', pay: 'lakeL', safety: 'peak', faq: 'kam-1', contacts: 'lakeL', become: 'peak', data: 'forest', match: 'ge-1', tour: 'valley' };
if (PH[pg] && $('.phead')) $('.phead').style.backgroundImage = `url('${img(PH[pg], 1800)}')`;
$$('.sh,.grid,.steps,.cta,.feat,.two,.faqi').forEach(e => { if (!e.classList.contains('rv') && !e.closest('.hero') && !e.closest('.filters') && !e.closest('#modal') && !e.closest('.card')) e.classList.add('rv'); });
fx();
