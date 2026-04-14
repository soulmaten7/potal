-- CW36-SYNC: Classification rules → Supabase
-- Sources: chapter_notes.json, section_notes.json, subheading_notes.json, jp_tariff_rules.md

-- 1. HS Chapter Rules (from chapter_decision_trees.json — 91 chapters, 87 rules)
CREATE TABLE IF NOT EXISTS hs_chapter_rules (
  id SERIAL PRIMARY KEY,
  chapter TEXT NOT NULL,
  description TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]',
  material_hints TEXT[] DEFAULT '{}',
  form_hints TEXT[] DEFAULT '{}',
  use_hints TEXT[] DEFAULT '{}',
  cross_ref_headings TEXT[] DEFAULT '{}',
  subheading_note TEXT,
  has_subheading_rules BOOLEAN DEFAULT FALSE,
  note_length INT DEFAULT 0,
  rule_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_chapter_rule UNIQUE (chapter)
);

CREATE INDEX idx_hcr_chapter ON hs_chapter_rules (chapter);

-- 2. HS Section Notes (21 sections)
CREATE TABLE IF NOT EXISTS hs_section_notes (
  id SERIAL PRIMARY KEY,
  section_number INT NOT NULL,
  section_roman TEXT,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_section_note UNIQUE (section_number)
);

-- 3. HS Subheading Notes (37 chapters with subheading-specific notes)
CREATE TABLE IF NOT EXISTS hs_subheading_notes (
  id SERIAL PRIMARY KEY,
  chapter_code TEXT NOT NULL,
  chapter_number INT NOT NULL,
  subheading_note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_subheading_note UNIQUE (chapter_code)
);

-- 4. JP Classification Rules (89 codes, 7 chapters)
CREATE TABLE IF NOT EXISTS jp_classification_rules (
  id SERIAL PRIMARY KEY,
  code9 TEXT NOT NULL,
  hs6 TEXT NOT NULL,
  heading TEXT NOT NULL,
  chapter TEXT NOT NULL,
  chapter_title TEXT,
  description TEXT NOT NULL,
  duty_rate TEXT,
  subdivision_logic TEXT,
  subdivision_axis TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_jp_code UNIQUE (code9)
);

CREATE INDEX idx_jcr_hs6 ON jp_classification_rules (hs6);
CREATE INDEX idx_jcr_chapter ON jp_classification_rules (chapter);
CREATE INDEX idx_jcr_heading ON jp_classification_rules (heading);

-- RLS: public read, service_role write
ALTER TABLE hs_chapter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_section_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hs_subheading_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jp_classification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON hs_chapter_rules FOR SELECT USING (true);
CREATE POLICY "Public read" ON hs_section_notes FOR SELECT USING (true);
CREATE POLICY "Public read" ON hs_subheading_notes FOR SELECT USING (true);
CREATE POLICY "Public read" ON jp_classification_rules FOR SELECT USING (true);

CREATE POLICY "Service write" ON hs_chapter_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write" ON hs_section_notes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write" ON hs_subheading_notes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write" ON jp_classification_rules FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE hs_chapter_rules IS 'CW36: Auto-extracted chapter-level include/exclude rules + material/form/use hints from WCO chapter notes. 91/96 chapters.';
COMMENT ON TABLE jp_classification_rules IS 'CW36: Japan 9-digit tariff classification rules. 89 codes, 7 chapters (01/02/22/27/62/84/87).';
