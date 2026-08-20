-- Relationship Equity + Money Graph

ALTER TABLE public.atlas_relationships
  ADD COLUMN IF NOT EXISTS economic_currency text,
  ADD COLUMN IF NOT EXISTS economic_basis text,
  ADD COLUMN IF NOT EXISTS last_signal_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_confidence numeric DEFAULT 0.5 CHECK (source_confidence >= 0 AND source_confidence <= 1);

ALTER TABLE public.atlas_opportunities
  ADD COLUMN IF NOT EXISTS relationship_id uuid REFERENCES public.atlas_relationships(id),
  ADD COLUMN IF NOT EXISTS close_probability numeric DEFAULT 0 CHECK (close_probability >= 0 AND close_probability <= 1),
  ADD COLUMN IF NOT EXISTS estimated_value_currency text,
  ADD COLUMN IF NOT EXISTS expected_value numeric GENERATED ALWAYS AS (coalesce(estimated_value,0) * close_probability) STORED,
  ADD COLUMN IF NOT EXISTS economic_priority numeric GENERATED ALWAYS AS ((coalesce(estimated_value,0) * close_probability) / greatest(estimated_human_minutes,1)) STORED;

CREATE INDEX IF NOT EXISTS atlas_opportunities_relationship_id_idx ON public.atlas_opportunities(relationship_id);
CREATE INDEX IF NOT EXISTS atlas_relationships_next_touch_idx ON public.atlas_relationships(user_key,next_touch_at) WHERE status='active';

ALTER TABLE public.atlas_opportunity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_attention_outcomes ENABLE ROW LEVEL SECURITY;
