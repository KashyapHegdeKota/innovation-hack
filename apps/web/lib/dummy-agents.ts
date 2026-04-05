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
  },
];

// The live agent comes from the real API — this is just a placeholder entry for the selector
export const LIVE_AGENT_STUB = {
  agent_id: "cli-user",
  display_name: "CLI User",
};
