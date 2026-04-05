// Dummy agents for hackathon demo — realistic hardcoded data
// The real agent (cli-user) comes from the live API.

export interface DummyDecision {
  id: string;
  timestamp: string;
  assessment: "overkill" | "appropriate" | "underpowered";
  prompt_preview: string;
  user_selected: { model: string; co2e_g: number; energy_wh: number };
  recommended: { model: string; co2e_g: number; energy_wh: number };
  final_model: string;
  accepted_recommendation: boolean;
  savings_if_switched_pct: number;
  alternatives: { model: string; tier: string; energy_wh: number }[];
}

export interface DummyReceipt {
  id: string;
  timestamp: string;
  model: string;
  requested_model?: string;
  prompt_preview: string;
  environmental_cost: { co2e_g: number; energy_wh: number };
  comparison?: { savings_pct: number };
}

export interface DummyEmissionDay {
  date: string;
  co2e: number;
  energy: number;
}

export interface DummyRadar {
  metric: string;
  score: number;
}

export interface DummyAgent {
  agent_id: string;
  display_name: string;
  sustainability_score: number;
  total_inferences: number;
  total_co2e_g: number;
  total_energy_wh: number;
  wallet_utilization_pct: number;
  trend: "on_track" | "at_risk" | "exceeded";
  decisions: DummyDecision[];
  receipts: DummyReceipt[];
  emissions: DummyEmissionDay[];
  radar: DummyRadar[];
}

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const DUMMY_AGENTS: DummyAgent[] = [
  {
    agent_id: "sales-bot",
    display_name: "Sales Assistant",
    sustainability_score: 38,
    total_inferences: 412,
    total_co2e_g: 89.4,
    total_energy_wh: 347.2,
    wallet_utilization_pct: 91,
    trend: "exceeded",
    decisions: [
      {
        id: "sb-1", timestamp: hoursAgo(0.5),
        assessment: "overkill", prompt_preview: "Draft a follow-up email for the Q2 proposal",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-opus-4-6", accepted_recommendation: false, savings_if_switched_pct: 95,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "sb-2", timestamp: hoursAgo(1.2),
        assessment: "overkill", prompt_preview: "Summarize this meeting transcript into 3 bullet points",
        user_selected: { model: "gpt-4o", co2e_g: 1.08, energy_wh: 4.32 },
        recommended: { model: "gemini-1.5-flash", co2e_g: 0.04, energy_wh: 0.18 },
        final_model: "gpt-4o", accepted_recommendation: false, savings_if_switched_pct: 96,
        alternatives: [
          { model: "gemini-1.5-flash", tier: "nano", energy_wh: 0.18 },
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "gpt-4o", tier: "heavy", energy_wh: 4.32 },
        ],
      },
      {
        id: "sb-3", timestamp: hoursAgo(2.8),
        assessment: "overkill", prompt_preview: "What is the contact email for Acme Corp?",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-opus-4-6", accepted_recommendation: false, savings_if_switched_pct: 95,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "sb-4", timestamp: hoursAgo(5.1),
        assessment: "appropriate", prompt_preview: "Analyze competitor pricing strategy across 12 documents",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        final_model: "claude-opus-4-6", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "sb-5", timestamp: hoursAgo(8.3),
        assessment: "overkill", prompt_preview: "Translate 'Thank you for your business' to Spanish",
        user_selected: { model: "gpt-4o", co2e_g: 1.08, energy_wh: 4.32 },
        recommended: { model: "gemini-1.5-flash", co2e_g: 0.04, energy_wh: 0.18 },
        final_model: "gpt-4o", accepted_recommendation: false, savings_if_switched_pct: 96,
        alternatives: [
          { model: "gemini-1.5-flash", tier: "nano", energy_wh: 0.18 },
          { model: "gpt-4o-mini", tier: "light", energy_wh: 0.72 },
          { model: "gpt-4o", tier: "heavy", energy_wh: 4.32 },
        ],
      },
    ],
    receipts: [
      { id: "sb-r1", timestamp: hoursAgo(0.5), model: "claude-opus-4-6", requested_model: "claude-opus-4-6", prompt_preview: "Draft a follow-up email for the Q2 proposal", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "sb-r2", timestamp: hoursAgo(1.2), model: "gpt-4o", requested_model: "gpt-4o", prompt_preview: "Summarize this meeting transcript into 3 bullet points", environmental_cost: { co2e_g: 1.08, energy_wh: 4.32 } },
      { id: "sb-r3", timestamp: hoursAgo(2.8), model: "claude-opus-4-6", requested_model: "claude-opus-4-6", prompt_preview: "What is the contact email for Acme Corp?", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "sb-r4", timestamp: hoursAgo(5.1), model: "claude-opus-4-6", requested_model: "claude-opus-4-6", prompt_preview: "Analyze competitor pricing strategy across 12 documents", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "sb-r5", timestamp: hoursAgo(8.3), model: "gpt-4o", requested_model: "gpt-4o", prompt_preview: "Translate 'Thank you for your business' to Spanish", environmental_cost: { co2e_g: 1.08, energy_wh: 4.32 } },
      { id: "sb-r6", timestamp: hoursAgo(14.0), model: "claude-opus-4-6", requested_model: "claude-opus-4-6", prompt_preview: "Write introduction for company overview deck", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
    ],
    emissions: [
      { date: "Mar 30", co2e: 18.2, energy: 72.8 },
      { date: "Mar 31", co2e: 22.4, energy: 89.6 },
      { date: "Apr 1",  co2e: 15.6, energy: 62.4 },
      { date: "Apr 2",  co2e: 19.8, energy: 79.2 },
      { date: "Apr 3",  co2e: 24.1, energy: 96.4 },
      { date: "Apr 4",  co2e: 21.3, energy: 85.2 },
      { date: "Apr 5",  co2e: 13.6, energy: 54.4 },
    ],
    radar: [
      { metric: "Carbon Eff.", score: 28 },
      { metric: "Budget Adh.", score: 12 },
      { metric: "Offset Cov.", score: 45 },
      { metric: "Opt. Adopt.", score: 22 },
      { metric: "Trend",       score: 35 },
    ],
  },

  {
    agent_id: "code-reviewer",
    display_name: "Code Reviewer",
    sustainability_score: 81,
    total_inferences: 203,
    total_co2e_g: 12.7,
    total_energy_wh: 49.8,
    wallet_utilization_pct: 38,
    trend: "on_track",
    decisions: [
      {
        id: "cr-1", timestamp: hoursAgo(0.8),
        assessment: "appropriate", prompt_preview: "Review this TypeScript function for type safety issues",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "cr-2", timestamp: hoursAgo(2.1),
        assessment: "overkill", prompt_preview: "Does this variable name follow our naming convention?",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-haiku-4-5", accepted_recommendation: true, savings_if_switched_pct: 88,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "cr-3", timestamp: hoursAgo(4.4),
        assessment: "appropriate", prompt_preview: "Identify security vulnerabilities in this auth middleware",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        final_model: "claude-opus-4-6", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "cr-4", timestamp: hoursAgo(6.9),
        assessment: "appropriate", prompt_preview: "Explain why this React useEffect causes an infinite loop",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "cr-5", timestamp: hoursAgo(11.2),
        assessment: "underpowered", prompt_preview: "Refactor entire payment service to use clean architecture",
        user_selected: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        recommended: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        final_model: "claude-opus-4-6", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
    ],
    receipts: [
      { id: "cr-r1", timestamp: hoursAgo(0.8), model: "claude-3-5-sonnet", prompt_preview: "Review this TypeScript function for type safety issues", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cr-r2", timestamp: hoursAgo(2.1), model: "claude-haiku-4-5", requested_model: "claude-3-5-sonnet", prompt_preview: "Does this variable name follow our naming convention?", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 }, comparison: { savings_pct: 88 } },
      { id: "cr-r3", timestamp: hoursAgo(4.4), model: "claude-opus-4-6", prompt_preview: "Identify security vulnerabilities in this auth middleware", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "cr-r4", timestamp: hoursAgo(6.9), model: "claude-3-5-sonnet", prompt_preview: "Explain why this React useEffect causes an infinite loop", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cr-r5", timestamp: hoursAgo(11.2), model: "claude-opus-4-6", requested_model: "claude-haiku-4-5", prompt_preview: "Refactor entire payment service to use clean architecture", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "cr-r6", timestamp: hoursAgo(18.0), model: "claude-haiku-4-5", requested_model: "claude-3-5-sonnet", prompt_preview: "Is this import statement unused?", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 }, comparison: { savings_pct: 88 } },
    ],
    emissions: [
      { date: "Mar 30", co2e: 1.8, energy: 7.2 },
      { date: "Mar 31", co2e: 2.4, energy: 9.6 },
      { date: "Apr 1",  co2e: 1.2, energy: 4.8 },
      { date: "Apr 2",  co2e: 3.1, energy: 12.4 },
      { date: "Apr 3",  co2e: 2.6, energy: 10.4 },
      { date: "Apr 4",  co2e: 1.9, energy: 7.6 },
      { date: "Apr 5",  co2e: 0.8, energy: 3.2 },
    ],
    radar: [
      { metric: "Carbon Eff.", score: 84 },
      { metric: "Budget Adh.", score: 92 },
      { metric: "Offset Cov.", score: 71 },
      { metric: "Opt. Adopt.", score: 88 },
      { metric: "Trend",       score: 79 },
    ],
  },

  {
    agent_id: "data-analyst",
    display_name: "Data Analyst",
    sustainability_score: 91,
    total_inferences: 641,
    total_co2e_g: 8.3,
    total_energy_wh: 32.1,
    wallet_utilization_pct: 22,
    trend: "on_track",
    decisions: [
      {
        id: "da-1", timestamp: hoursAgo(0.3),
        assessment: "appropriate", prompt_preview: "Calculate month-over-month revenue growth from this CSV",
        user_selected: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-haiku-4-5", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "da-2", timestamp: hoursAgo(1.7),
        assessment: "appropriate", prompt_preview: "Detect anomalies in 90-day transaction dataset",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "da-3", timestamp: hoursAgo(3.5),
        assessment: "appropriate", prompt_preview: "Format these 200 rows as a markdown table",
        user_selected: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-haiku-4-5", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "da-4", timestamp: hoursAgo(7.2),
        assessment: "overkill", prompt_preview: "What is the sum of column B?",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-haiku-4-5", accepted_recommendation: true, savings_if_switched_pct: 88,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "da-5", timestamp: hoursAgo(14.8),
        assessment: "appropriate", prompt_preview: "Build a predictive model for Q3 churn based on usage data",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        final_model: "claude-opus-4-6", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
    ],
    receipts: [
      { id: "da-r1", timestamp: hoursAgo(0.3), model: "claude-haiku-4-5", prompt_preview: "Calculate month-over-month revenue growth from this CSV", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 } },
      { id: "da-r2", timestamp: hoursAgo(1.7), model: "claude-3-5-sonnet", prompt_preview: "Detect anomalies in 90-day transaction dataset", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "da-r3", timestamp: hoursAgo(3.5), model: "claude-haiku-4-5", prompt_preview: "Format these 200 rows as a markdown table", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 } },
      { id: "da-r4", timestamp: hoursAgo(7.2), model: "claude-haiku-4-5", requested_model: "claude-3-5-sonnet", prompt_preview: "What is the sum of column B?", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 }, comparison: { savings_pct: 88 } },
      { id: "da-r5", timestamp: hoursAgo(14.8), model: "claude-opus-4-6", prompt_preview: "Build a predictive model for Q3 churn based on usage data", environmental_cost: { co2e_g: 1.14, energy_wh: 4.56 } },
      { id: "da-r6", timestamp: hoursAgo(22.0), model: "claude-haiku-4-5", prompt_preview: "Count unique values in user_id column", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 } },
    ],
    emissions: [
      { date: "Mar 30", co2e: 1.1, energy: 4.4 },
      { date: "Mar 31", co2e: 0.9, energy: 3.6 },
      { date: "Apr 1",  co2e: 1.4, energy: 5.6 },
      { date: "Apr 2",  co2e: 1.2, energy: 4.8 },
      { date: "Apr 3",  co2e: 0.8, energy: 3.2 },
      { date: "Apr 4",  co2e: 1.6, energy: 6.4 },
      { date: "Apr 5",  co2e: 0.9, energy: 3.6 },
    ],
    radar: [
      { metric: "Carbon Eff.", score: 95 },
      { metric: "Budget Adh.", score: 97 },
      { metric: "Offset Cov.", score: 88 },
      { metric: "Opt. Adopt.", score: 94 },
      { metric: "Trend",       score: 91 },
    ],
  },

  {
    agent_id: "content-writer",
    display_name: "Content Writer",
    sustainability_score: 57,
    total_inferences: 178,
    total_co2e_g: 34.6,
    total_energy_wh: 138.4,
    wallet_utilization_pct: 64,
    trend: "at_risk",
    decisions: [
      {
        id: "cw-1", timestamp: hoursAgo(1.1),
        assessment: "overkill", prompt_preview: "Write a catchy subject line for our newsletter",
        user_selected: { model: "claude-opus-4-6", co2e_g: 1.14, energy_wh: 4.56 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-haiku-4-5", accepted_recommendation: true, savings_if_switched_pct: 95,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "cw-2", timestamp: hoursAgo(2.6),
        assessment: "appropriate", prompt_preview: "Write a 1500-word technical blog post on WebAssembly",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "cw-3", timestamp: hoursAgo(4.9),
        assessment: "overkill", prompt_preview: "Fix the typo in this sentence",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: false, savings_if_switched_pct: 88,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
      {
        id: "cw-4", timestamp: hoursAgo(9.3),
        assessment: "appropriate", prompt_preview: "Generate 10 social media post variations for product launch",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: true, savings_if_switched_pct: 0,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
          { model: "claude-opus-4-6", tier: "heavy", energy_wh: 4.56 },
        ],
      },
      {
        id: "cw-5", timestamp: hoursAgo(18.7),
        assessment: "overkill", prompt_preview: "Suggest a synonym for 'utilize'",
        user_selected: { model: "claude-3-5-sonnet", co2e_g: 0.48, energy_wh: 1.92 },
        recommended: { model: "claude-haiku-4-5", co2e_g: 0.06, energy_wh: 0.24 },
        final_model: "claude-3-5-sonnet", accepted_recommendation: false, savings_if_switched_pct: 88,
        alternatives: [
          { model: "claude-haiku-4-5", tier: "nano", energy_wh: 0.24 },
          { model: "claude-3-5-sonnet", tier: "standard", energy_wh: 1.92 },
        ],
      },
    ],
    receipts: [
      { id: "cw-r1", timestamp: hoursAgo(1.1), model: "claude-haiku-4-5", requested_model: "claude-opus-4-6", prompt_preview: "Write a catchy subject line for our newsletter", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 }, comparison: { savings_pct: 95 } },
      { id: "cw-r2", timestamp: hoursAgo(2.6), model: "claude-3-5-sonnet", prompt_preview: "Write a 1500-word technical blog post on WebAssembly", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cw-r3", timestamp: hoursAgo(4.9), model: "claude-3-5-sonnet", prompt_preview: "Fix the typo in this sentence", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cw-r4", timestamp: hoursAgo(9.3), model: "claude-3-5-sonnet", prompt_preview: "Generate 10 social media post variations for product launch", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cw-r5", timestamp: hoursAgo(18.7), model: "claude-3-5-sonnet", prompt_preview: "Suggest a synonym for 'utilize'", environmental_cost: { co2e_g: 0.48, energy_wh: 1.92 } },
      { id: "cw-r6", timestamp: hoursAgo(26.0), model: "claude-haiku-4-5", requested_model: "claude-opus-4-6", prompt_preview: "Add a comma after 'however' in paragraph 3", environmental_cost: { co2e_g: 0.06, energy_wh: 0.24 }, comparison: { savings_pct: 95 } },
    ],
    emissions: [
      { date: "Mar 30", co2e: 5.2, energy: 20.8 },
      { date: "Mar 31", co2e: 7.8, energy: 31.2 },
      { date: "Apr 1",  co2e: 4.1, energy: 16.4 },
      { date: "Apr 2",  co2e: 6.9, energy: 27.6 },
      { date: "Apr 3",  co2e: 8.4, energy: 33.6 },
      { date: "Apr 4",  co2e: 5.6, energy: 22.4 },
      { date: "Apr 5",  co2e: 3.2, energy: 12.8 },
    ],
    radar: [
      { metric: "Carbon Eff.", score: 52 },
      { metric: "Budget Adh.", score: 48 },
      { metric: "Offset Cov.", score: 61 },
      { metric: "Opt. Adopt.", score: 55 },
      { metric: "Trend",       score: 44 },
    ],
  },
];

// The live agent comes from the real API — this is just a placeholder entry for the selector
export const LIVE_AGENT_STUB = {
  agent_id: "cli-user",
  display_name: "CLI User",
};
