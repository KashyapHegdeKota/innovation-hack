-- Seed model benchmarks from published research:
-- - Jegham et al. "How Hungry is AI?" (2025) — eco-efficiency DEA scores
-- - Hugging Face AI Energy Score — Wh per 1000 queries on H100
-- - Provider disclosures (Google, OpenAI)
-- - Muxup per-query energy analysis (2026 Q1)

INSERT INTO model_benchmarks (model_id, provider, quality_tier, energy_per_1k_tokens_wh, energy_per_query_wh_avg, reasoning_score, coding_score, math_score, eco_efficiency_score, parameter_count_b, available_regions) VALUES

-- NANO tier
('gpt-4.1-nano', 'openai', 'nano',
    0.02, 0.15, 0.45, 0.40, 0.35, NULL, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','ap-northeast-1']),

-- LIGHT tier
('claude-haiku-4-5', 'anthropic', 'light',
    0.03, 0.20, 0.55, 0.50, 0.45, NULL, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-northeast-1']),

('gpt-4.1-mini', 'openai', 'light',
    0.04, 0.25, 0.60, 0.55, 0.50, NULL, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','ap-northeast-1']),

('gemini-2.0-flash', 'google', 'light',
    0.03, 0.22, 0.58, 0.52, 0.48, NULL, NULL,
    ARRAY['us-central1','us-east4','europe-west1','asia-northeast1']),

-- STANDARD tier
('claude-sonnet-4-6', 'anthropic', 'standard',
    0.05, 0.24, 0.82, 0.78, 0.75, 0.825, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','eu-central-1','ap-northeast-1']),

('gpt-4o', 'openai', 'standard',
    0.06, 0.34, 0.78, 0.74, 0.70, 0.789, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','ap-northeast-1']),

('gemini-2.5-pro', 'google', 'standard',
    0.05, 0.28, 0.80, 0.76, 0.73, NULL, NULL,
    ARRAY['us-central1','us-east4','europe-west1','asia-northeast1']),

-- HEAVY tier
('claude-opus-4-6', 'anthropic', 'heavy',
    0.15, 1.00, 0.92, 0.90, 0.88, NULL, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1']),

('gpt-4.1', 'openai', 'heavy',
    0.10, 0.50, 0.88, 0.85, 0.82, NULL, NULL,
    ARRAY['us-east-1','us-west-2','eu-west-1','ap-northeast-1']),

-- REASONING tier
('o3-mini', 'openai', 'reasoning',
    0.50, 3.00, 0.90, 0.88, 0.92, 0.884, NULL,
    ARRAY['us-east-1','us-west-2']),

('o3', 'openai', 'reasoning',
    5.00, 33.00, 0.95, 0.93, 0.96, 0.758, NULL,
    ARRAY['us-east-1','us-west-2']),

('deepseek-r1', 'deepseek', 'reasoning',
    2.50, 16.00, 0.91, 0.87, 0.93, 0.067, NULL,
    ARRAY['us-east-1'])

ON CONFLICT (model_id) DO UPDATE SET
    energy_per_1k_tokens_wh = EXCLUDED.energy_per_1k_tokens_wh,
    energy_per_query_wh_avg = EXCLUDED.energy_per_query_wh_avg,
    reasoning_score = EXCLUDED.reasoning_score,
    coding_score = EXCLUDED.coding_score,
    math_score = EXCLUDED.math_score,
    eco_efficiency_score = EXCLUDED.eco_efficiency_score,
    available_regions = EXCLUDED.available_regions,
    last_updated = NOW();


-- Seed region ↔ electricity zone mappings

INSERT INTO region_zone_mapping (cloud_region, provider, electricity_zone, display_name, latitude, longitude) VALUES
-- AWS
('us-east-1',      'aws',   'US-MIDA-PJM',  'Virginia',    38.95, -77.45),
('us-west-2',      'aws',   'US-NW-PACW',    'Oregon',      45.84, -119.70),
('eu-west-1',      'aws',   'IE',            'Ireland',     53.35, -6.26),
('eu-central-1',   'aws',   'DE',            'Frankfurt',   50.11, 8.68),
('eu-north-1',     'aws',   'SE-SE3',        'Stockholm',   59.33, 18.07),
('ap-northeast-1', 'aws',   'JP-TK',         'Tokyo',       35.68, 139.77),
('ca-central-1',   'aws',   'CA-QC',         'Montreal',    45.50, -73.57),

-- GCP
('us-central1',    'gcp',   'US-MIDW-MISO',  'Iowa',        41.88, -93.10),
('us-east4',       'gcp',   'US-MIDA-PJM',   'Virginia',    38.95, -77.45),
('europe-west1',   'gcp',   'BE',            'Belgium',     50.85, 4.35),
('europe-north1',  'gcp',   'FI',            'Finland',     60.17, 24.94),
('asia-northeast1','gcp',   'JP-TK',         'Tokyo',       35.68, 139.77),
('northamerica-northeast1', 'gcp', 'CA-QC',  'Montreal',    45.50, -73.57),

-- Azure
('eastus',         'azure', 'US-MIDA-PJM',   'Virginia',    38.95, -77.45),
('westus2',        'azure', 'US-NW-PACW',    'Oregon',      45.84, -119.70),
('northeurope',    'azure', 'IE',            'Ireland',     53.35, -6.26),
('swedencentral',  'azure', 'SE-SE3',        'Stockholm',   59.33, 18.07),
('canadacentral',  'azure', 'CA-QC',         'Montreal',    45.50, -73.57)

ON CONFLICT (cloud_region) DO UPDATE SET
    electricity_zone = EXCLUDED.electricity_zone,
    display_name = EXCLUDED.display_name;
