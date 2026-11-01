-- Схема каталога NOMAD Journeys для PostgreSQL (12+).
-- Описания туров (tours, tour_days, tour_faq) хранятся отдельно от цен, дат и наличия мест (departures),
-- поэтому цены, даты и свободные места можно обновлять, не трогая тексты.
-- Все данные из seed.sql демонстрационные (is_demo = TRUE).

DROP TABLE IF EXISTS company_faq, images, departures, tour_alternatives, tour_faq, tour_days, tours,
  cancellation_policies, guide_countries, guides, countries, categories CASCADE;

CREATE TABLE categories (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  icon        text,
  description text NOT NULL
);

CREATE TABLE countries (
  id             char(2) PRIMARY KEY,           -- ISO 3166-1 alpha-2, строчные
  name           text NOT NULL,
  continent      text NOT NULL,
  languages      text[] NOT NULL DEFAULT '{}',
  currency_local char(3)
);

CREATE TABLE guides (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  role             text NOT NULL,
  city             text NOT NULL,
  country_id       char(2) NOT NULL REFERENCES countries(id),
  languages        text[] NOT NULL DEFAULT '{}',
  experience_years smallint,
  specialties      text[] NOT NULL DEFAULT '{}',
  bio              text NOT NULL,
  style            text NOT NULL,                 -- особенности проведения путешествий
  photo_url        text,
  credentials      jsonb NOT NULL DEFAULT '[]',   -- подтверждённые документы (пока пусто)
  is_demo_profile  boolean NOT NULL DEFAULT TRUE
);

CREATE TABLE guide_countries (                    -- направления работы гида
  guide_id   text NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  country_id char(2) NOT NULL REFERENCES countries(id),
  PRIMARY KEY (guide_id, country_id)
);

CREATE TABLE cancellation_policies (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  disclaimer text,
  is_demo    boolean NOT NULL DEFAULT TRUE,
  tiers      jsonb NOT NULL                       -- [{days_from, days_to, refund_percent, note}]
);

CREATE TABLE tours (
  id                     text PRIMARY KEY,
  title                  text NOT NULL,
  country_id             char(2) NOT NULL REFERENCES countries(id),
  region                 text NOT NULL,
  category_id            text NOT NULL REFERENCES categories(id),
  format                 text NOT NULL CHECK (format IN ('small_group', 'private')),
  private_available      boolean NOT NULL DEFAULT FALSE,
  days                   smallint NOT NULL CHECK (days > 0),
  nights                 smallint NOT NULL,
  start_point            text,
  end_point              text,
  price_from             numeric(12,2) NOT NULL CHECK (price_from >= 0),   -- базовая цена за человека
  currency               char(3) NOT NULL DEFAULT 'RUB',
  single_supplement      numeric(12,2),
  season_months          smallint[] NOT NULL,                              -- 1..12
  season_best            text,
  season_note            text,
  group_min              smallint NOT NULL,
  group_max              smallint NOT NULL,
  difficulty             smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  difficulty_note        text,
  fitness_requirements   text,
  short_description      text NOT NULL,
  description            text NOT NULL,
  highlights             text[] NOT NULL DEFAULT '{}',
  accommodation          text NOT NULL,
  transport              text NOT NULL,
  meals                  text NOT NULL,
  included               text[] NOT NULL DEFAULT '{}',
  excluded               text[] NOT NULL DEFAULT '{}',
  requirements           text[] NOT NULL DEFAULT '{}',
  equipment              text[] NOT NULL DEFAULT '{}',
  restrictions           text[] NOT NULL DEFAULT '{}',
  docs_note              text,                                             -- сведения о визах и документах (не подтверждены)
  suitable_for           text[] NOT NULL DEFAULT '{}',
  not_suitable_for       text[] NOT NULL DEFAULT '{}',
  advantages             text[] NOT NULL DEFAULT '{}',
  guide_id               text NOT NULL REFERENCES guides(id),
  cancellation_policy_id text NOT NULL REFERENCES cancellation_policies(id),
  hero_image             text,
  gallery_images         text[] NOT NULL DEFAULT '{}',
  tags                   text[] NOT NULL DEFAULT '{}',
  is_demo                boolean NOT NULL DEFAULT TRUE,
  data_status            jsonb NOT NULL DEFAULT '{}',                      -- что именно требует подтверждения
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tours_country_idx  ON tours (country_id);
CREATE INDEX tours_category_idx ON tours (category_id);
CREATE INDEX tours_season_idx   ON tours USING gin (season_months);
CREATE INDEX tours_tags_idx     ON tours USING gin (tags);

CREATE TABLE tour_days (
  tour_id           text NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  day_no            smallint NOT NULL,
  title             text NOT NULL,
  places            text[] NOT NULL DEFAULT '{}',
  summary           text NOT NULL,
  activities        text[] NOT NULL DEFAULT '{}',
  free_time         text,
  unique_experience text,
  PRIMARY KEY (tour_id, day_no)
);

CREATE TABLE tour_faq (
  tour_id  text NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  position smallint NOT NULL,
  question text NOT NULL,
  answer   text NOT NULL,
  PRIMARY KEY (tour_id, position)
);

CREATE TABLE tour_alternatives (
  tour_id     text NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  alt_tour_id text NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  PRIMARY KEY (tour_id, alt_tour_id),
  CHECK (tour_id <> alt_tour_id)
);

-- Оперативные данные: обновляются независимо от описаний туров.
CREATE TABLE departures (
  id              text PRIMARY KEY,
  tour_id         text NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  status          text NOT NULL CHECK (status IN ('open', 'last_places', 'full', 'on_request', 'cancelled')),
  seats_total     smallint NOT NULL,
  seats_available smallint,                   -- NULL, если место определяется по запросу (приватные туры)
  price_override  numeric(12,2),              -- NULL = используется tours.price_from
  is_demo         boolean NOT NULL DEFAULT TRUE,
  note            text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX departures_tour_idx  ON departures (tour_id, start_date);
CREATE INDEX departures_start_idx ON departures (start_date);

CREATE TABLE images (
  key      text PRIMARY KEY,
  source   text NOT NULL CHECK (source IN ('unsplash', 'commons')),
  ref      text NOT NULL,                     -- id фото Unsplash или имя файла на Wikimedia Commons
  author   text,
  license  text,
  page_url text
);

CREATE TABLE company_faq (
  position smallint PRIMARY KEY,
  category text NOT NULL,
  question text NOT NULL,
  answer   text NOT NULL
);

-- Цена выезда с учётом переопределения
CREATE VIEW v_departures AS
SELECT d.*, COALESCE(d.price_override, t.price_from) AS price, t.currency, t.title AS tour_title, t.country_id, t.category_id
FROM departures d JOIN tours t ON t.id = d.tour_id;
