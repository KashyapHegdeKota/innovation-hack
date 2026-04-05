// Platform-wide aggregated data for the admin panel
// Represents ALL users of GreenLedger, not a single org

export const platformStats = {
  total_orgs: 47,
  total_agents: 312,
  total_inferences: 284_391,
  total_co2e_avoided_g: 18_742.6,
  total_energy_saved_wh: 48_291.3,
  total_water_saved_ml: 12_845.1,
  total_levy_collected_usd: 156.82,
  total_carbon_removed_g: 64_210.4,
  total_api_cost_saved_usd: 784.12,
  avg_sustainability_score: 74,
  downgrade_acceptance_rate_pct: 68.4,
  period: "2026-03-01 – 2026-03-31",
};

export const platformGrowth = [
  { week: "W1 Mar", orgs: 38, agents: 241, inferences: 52_100 },
  { week: "W2 Mar", orgs: 41, agents: 268, inferences: 64_800 },
  { week: "W3 Mar", orgs: 44, agents: 289, inferences: 78_200 },
  { week: "W4 Mar", orgs: 47, agents: 312, inferences: 89_291 },
];

export const platformEmissions = [
  { date: "Mar 1", co2e_avoided: 312.4, co2e_actual: 482.1, levy_usd: 2.84 },
  { date: "Mar 5", co2e_avoided: 548.2, co2e_actual: 621.8, levy_usd: 4.92 },
  { date: "Mar 9", co2e_avoided: 421.8, co2e_actual: 512.4, levy_usd: 3.81 },
  { date: "Mar 13", co2e_avoided: 682.1, co2e_actual: 748.3, levy_usd: 6.14 },
  { date: "Mar 17", co2e_avoided: 524.6, co2e_actual: 598.2, levy_usd: 4.72 },
  { date: "Mar 21", co2e_avoided: 618.4, co2e_actual: 681.5, levy_usd: 5.58 },
  { date: "Mar 25", co2e_avoided: 492.1, co2e_actual: 542.8, levy_usd: 4.43 },
  { date: "Mar 29", co2e_avoided: 384.2, co2e_actual: 468.1, levy_usd: 3.46 },
];

export const topOrgs = [
  { name: "NovaTech AI", agents: 24, inferences: 42_180, co2e_avoided_g: 2_841.2, score: 91, levy_usd: 18.42 },
  { name: "Vertex Labs", agents: 18, inferences: 31_420, co2e_avoided_g: 2_124.8, score: 86, levy_usd: 14.21 },
  { name: "CloudMind Inc", agents: 32, inferences: 28_940, co2e_avoided_g: 1_948.1, score: 82, levy_usd: 12.84 },
  { name: "GreenOps Co", agents: 12, inferences: 24_610, co2e_avoided_g: 1_712.4, score: 79, levy_usd: 11.02 },
  { name: "DataForge", agents: 21, inferences: 22_380, co2e_avoided_g: 1_524.6, score: 77, levy_usd: 9.84 },
  { name: "Synapse.dev", agents: 15, inferences: 19_840, co2e_avoided_g: 1_342.1, score: 75, levy_usd: 8.62 },
  { name: "Aether Systems", agents: 28, inferences: 18_210, co2e_avoided_g: 1_218.4, score: 73, levy_usd: 7.94 },
  { name: "PulseAI", agents: 9, inferences: 15_680, co2e_avoided_g: 1_084.2, score: 71, levy_usd: 6.81 },
];

export const modelEcosystem = [
  { model: "claude-haiku-4-5", provider: "anthropic", queries: 98_421, avg_co2e_g: 0.008, pct_of_total: 34.6 },
  { model: "gpt-4.1-nano", provider: "openai", queries: 62_184, avg_co2e_g: 0.004, pct_of_total: 21.9 },
  { model: "claude-sonnet-4-6", provider: "anthropic", queries: 48_912, avg_co2e_g: 0.096, pct_of_total: 17.2 },
  { model: "gemini-3.1-flash", provider: "google", queries: 32_841, avg_co2e_g: 0.007, pct_of_total: 11.5 },
  { model: "gpt-4.1-mini", provider: "openai", queries: 21_624, avg_co2e_g: 0.006, pct_of_total: 7.6 },
  { model: "claude-opus-4-6", provider: "anthropic", queries: 12_480, avg_co2e_g: 0.400, pct_of_total: 4.4 },
  { model: "o3-mini", provider: "openai", queries: 7_929, avg_co2e_g: 1.200, pct_of_total: 2.8 },
];

export const routingIntelligence = {
  total_routing_decisions: 284_391,
  downgrades_suggested: 196_428,
  downgrades_accepted: 134_357,
  acceptance_rate_pct: 68.4,
  top_downgrades: [
    { from: "claude-sonnet-4-6", to: "claude-haiku-4-5", count: 48_210, savings_usd: 241.05, co2e_avoided_g: 4_234.5 },
    { from: "gpt-5.2", to: "gpt-4.1-mini", count: 32_140, savings_usd: 160.70, co2e_avoided_g: 2_892.6 },
    { from: "claude-opus-4-6", to: "claude-sonnet-4-6", count: 18_420, savings_usd: 138.15, co2e_avoided_g: 5_526.0 },
    { from: "gemini-3.1-pro", to: "gemini-3.1-flash", count: 21_840, savings_usd: 65.52, co2e_avoided_g: 1_746.2 },
    { from: "o3", to: "o3-mini", count: 8_412, savings_usd: 126.18, co2e_avoided_g: 3_364.8 },
  ],
  rejection_reasons: [
    { reason: "Quality concern", pct: 42 },
    { reason: "User preference", pct: 28 },
    { reason: "Task complexity", pct: 18 },
    { reason: "Latency requirement", pct: 12 },
  ],
};

export const carbonRemoval = {
  total_levy_usd: 156.82,
  total_carbon_removed_g: 64_210.4,
  removal_partners: [
    { name: "Stripe Climate — Frontier", allocated_usd: 112.91, removed_g: 46_233.1, status: "confirmed" as const },
    { name: "Stripe Climate — Pooled", allocated_usd: 37.64, removed_g: 15_412.8, status: "pooled" as const },
    { name: "Pending Settlement", allocated_usd: 6.27, removed_g: 2_564.5, status: "pending" as const },
  ],
  monthly_trend: [
    { month: "Jan", levy_usd: 42.18, removed_g: 17_280 },
    { month: "Feb", levy_usd: 68.42, removed_g: 28_020 },
    { month: "Mar", levy_usd: 156.82, removed_g: 64_210 },
  ],
};

export const recentPlatformActivity = [
  { timestamp: "2026-03-31T14:32:00Z", org: "NovaTech AI", event: "New agent registered", detail: "research-bot-v3" },
  { timestamp: "2026-03-31T14:18:00Z", org: "Vertex Labs", event: "Wallet budget hit 90%", detail: "ml-pipeline-agent" },
  { timestamp: "2026-03-31T13:55:00Z", org: "CloudMind Inc", event: "New org onboarded", detail: "Enterprise plan" },
  { timestamp: "2026-03-31T13:42:00Z", org: "GreenOps Co", event: "Score milestone", detail: "Reached 79 sustainability score" },
  { timestamp: "2026-03-31T13:28:00Z", org: "DataForge", event: "Levy confirmed", detail: "$2.41 → Stripe Climate" },
  { timestamp: "2026-03-31T12:15:00Z", org: "NovaTech AI", event: "Downgrade accepted", detail: "opus → sonnet (batch job)" },
];
