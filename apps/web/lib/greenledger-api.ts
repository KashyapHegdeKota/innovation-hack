/**
 * GreenLedger API Client
 * Owner: Person D (frontend)
 *
 * All API method signatures matching the backend schemas.
 * Person D can build the full UI against these — use mock data until
 * the real endpoints return 200 instead of 501.
 */

import apiClient from "./api-client";

const API_V1 = "/v1";

// ---------------------------------------------------------------------------
// Types (mirrors Pydantic schemas — keep in sync with models/schemas.py)
// ---------------------------------------------------------------------------

export type QualityTier = "nano" | "light" | "standard" | "heavy" | "reasoning";
export type CarbonPriority = "lowest" | "low" | "balanced" | "none";
export type BudgetExceededPolicy = "downgrade_model" | "defer" | "offset" | "block";
export type LevyStatus = "pending" | "pooled" | "submitted" | "confirmed" | "failed";
export type Provider = "anthropic" | "openai" | "google" | "deepseek";
export type WalletTrend = "on_track" | "at_risk" | "exceeded";
export type ScoreScope = "agent" | "team" | "org";

export interface OrgResponse {
  id: string;
  name: string;
  contact_email: string;
  created_at: string;
}

export interface AgentResponse {
  id: string;
  org_id: string;
  agent_id: string;
  display_name: string | null;
  team_id: string | null;
  created_at: string;
}

export interface RouteResponse {
  model: string;
  provider: Provider;
  region: string;
  grid_carbon_intensity_gco2e_kwh: number;
  grid_renewable_pct: number | null;
  estimated_co2e_g: number;
  estimated_energy_wh: number;
  eco_score: number;
  estimated_latency_ms: number | null;
}

export interface EnvironmentalCost {
  co2e_g: number;
  water_ml: number | null;
  energy_wh: number;
}

export interface ReceiptSavings {
  original_model: string | null;
  original_api_cost_usd: number;
  routed_api_cost_usd: number;
  savings_usd: number;
  levy_from_savings_usd: number;
  co2e_avoided_g: number;
}

export interface LevySummary {
  total_queries: number;
  total_savings_usd: number;
  total_levy_usd: number;
  total_co2e_avoided_g: number;
  levy_breakdown: {
    model: string;
    original_model: string;
    savings_usd: number;
    levy_usd: number;
    co2e_avoided_g: number;
  }[];
}

export interface ReceiptResponse {
  id: string;
  org_id: string;
  agent_id: string | null;
  timestamp: string;
  action_type: string;
  model: string | null;
  provider: Provider | null;
  region: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  environmental_cost: EnvironmentalCost;
  grid: { carbon_intensity_gco2e_kwh: number; renewable_percentage: number | null };
  offset: { levy_usd: number; destination: string; status: LevyStatus };
  wallet_budget_remaining_co2e_g: number | null;
  wallet_monthly_budget_co2e_g: number | null;
  comparison: { naive_co2e_g: number; savings_pct: number } | null;
}

export interface WalletStatus {
  id: string;
  org_id: string;
  agent_id: string;
  monthly_budget_co2e_g: number;
  current_spend_co2e_g: number;
  remaining_co2e_g: number;
  on_exceeded: BudgetExceededPolicy;
  period_start: string;
  period_end: string;
  trend: WalletTrend;
  utilization_pct: number;
}

export interface InferResponse {
  result: string;
  model: string;
  provider: Provider;
  region: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  routing: RouteResponse;
  receipt: ReceiptResponse;
  wallet: WalletStatus | null;
}

export interface ScoreComponents {
  carbon_efficiency: number;
  budget_adherence: number;
  offset_coverage: number;
  optimization_adoption: number;
  trend: number;
}

export interface Recommendation {
  id: string;
  org_id: string;
  scope: ScoreScope;
  scope_id: string;
  title: string;
  description: string;
  estimated_savings_co2e_g: number;
  estimated_savings_pct: number;
  priority: string;
  created_at: string;
}

export interface ScoreSummary {
  current_score: number;
  previous_score: number | null;
  change: number | null;
  components: ScoreComponents;
  recommendations: Recommendation[];
}

export interface DashboardSummary {
  org_id: string;
  total_inferences: number;
  total_co2e_g: number;
  total_energy_wh: number;
  total_water_ml: number;
  total_levy_usd: number;
  total_carbon_removed_g: number;
  avg_savings_vs_naive_pct: number;
  sustainability_score: number;
  active_agents: number;
  period_start: string;
  period_end: string;
}

export interface AgentSummary {
  agent_id: string;
  display_name: string | null;
  total_inferences: number;
  total_co2e_g: number;
  total_energy_wh: number;
  wallet_utilization_pct: number | null;
  sustainability_score: number | null;
  trend: WalletTrend | null;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

// --- Orgs & Agents (Person A's endpoints) ---

export const createOrg = (name: string, contact_email: string) =>
  apiClient.post<OrgResponse>(`${API_V1}/orgs`, { name, contact_email });

export const getMyOrg = () =>
  apiClient.get<OrgResponse>(`${API_V1}/orgs/me`);

export const createAgent = (agent_id: string, display_name?: string, team_id?: string) =>
  apiClient.post<AgentResponse>(`${API_V1}/agents`, { agent_id, display_name, team_id });

export const listAgents = () =>
  apiClient.get<AgentResponse[]>(`${API_V1}/agents`);

export const getAgent = (agent_id: string) =>
  apiClient.get<AgentResponse>(`${API_V1}/agents/${agent_id}`);

// --- Green Router & Inference (Person A's endpoints) ---

export const getRoute = (params: {
  quality?: QualityTier;
  carbon_priority?: CarbonPriority;
  max_latency_ms?: number;
  provider_allowlist?: Provider[];
}) => apiClient.post<RouteResponse>(`${API_V1}/route`, params);

export const infer = (params: {
  prompt: string;
  quality?: QualityTier;
  carbon_priority?: CarbonPriority;
  max_tokens?: number;
  agent_id?: string;
}) => apiClient.post<InferResponse>(`${API_V1}/infer`, params);

// --- Carbon Wallets (Person B's endpoints) ---

export const createWallet = (
  agent_id: string,
  monthly_budget_co2e_g: number,
  on_exceeded?: BudgetExceededPolicy,
) => apiClient.post<WalletStatus>(`${API_V1}/wallets`, { agent_id, monthly_budget_co2e_g, on_exceeded });

export const getWallet = (agent_id: string) =>
  apiClient.get<WalletStatus>(`${API_V1}/wallets/${agent_id}`);

export const updateWallet = (agent_id: string, updates: {
  monthly_budget_co2e_g?: number;
  on_exceeded?: BudgetExceededPolicy;
}) => apiClient.patch<WalletStatus>(`${API_V1}/wallets/${agent_id}`, updates);

export const getWalletHistory = (agent_id: string) =>
  apiClient.get(`${API_V1}/wallets/${agent_id}/history`);

// --- Payments (Person B's endpoints) ---

export const pay = (params: {
  amount: number;
  currency?: string;
  to: string;
  agent_id: string;
  payment_protocol?: string;
}) => apiClient.post(`${API_V1}/pay`, params);

// --- Receipts (Person C's endpoints) ---

export const getReceipt = (receipt_id: string) =>
  apiClient.get<ReceiptResponse>(`${API_V1}/receipts/${receipt_id}`);

export const listReceipts = (params?: {
  agent_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}) => apiClient.get(`${API_V1}/receipts`, { params });

export const exportReceipts = (format: "csv" | "json", params?: {
  agent_id?: string;
  from_date?: string;
  to_date?: string;
}) => apiClient.get(`${API_V1}/receipts/export`, { params: { format, ...params } });

// --- Scores & Dashboard (Person C's endpoints) ---

export const getOrgScore = () =>
  apiClient.get<ScoreSummary>(`${API_V1}/scores`);

export const getAgentScores = () =>
  apiClient.get<AgentSummary[]>(`${API_V1}/scores/agents`);

export const getAgentScore = (agent_id: string) =>
  apiClient.get<ScoreSummary>(`${API_V1}/scores/agents/${agent_id}`);

export const getRecommendations = () =>
  apiClient.get<Recommendation[]>(`${API_V1}/scores/recommendations`);

export const getDashboardSummary = () =>
  apiClient.get<DashboardSummary>(`${API_V1}/scores/dashboard`);

// --- Levy Summary (real-time accumulated savings) ---

export const getLevySummary = () =>
  apiClient.get<LevySummary>(`${API_V1}/levy-summary`);
