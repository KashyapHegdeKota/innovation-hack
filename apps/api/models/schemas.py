"""
GreenLedger — Shared Pydantic Schemas

This is the single source of truth for all data types in the system.
All 4 team members code against these schemas.

Person A (Core + Router): uses Org, Agent, ApiKey, ModelBenchmark, GridCarbonIntensity
Person B (Wallet + Levy): uses CarbonWallet, WalletTransaction, LevyTransaction
Person C (Receipts + Scoring): uses Receipt, SustainabilityScore, Recommendation
Person D (Frontend): consumes all response schemas via API client
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class QualityTier(str, Enum):
    NANO = "nano"
    LIGHT = "light"
    STANDARD = "standard"
    HEAVY = "heavy"
    REASONING = "reasoning"


class CarbonPriority(str, Enum):
    LOWEST = "lowest"
    LOW = "low"
    BALANCED = "balanced"
    NONE = "none"


class BudgetExceededPolicy(str, Enum):
    DOWNGRADE_MODEL = "downgrade_model"
    DEFER = "defer"
    OFFSET = "offset"
    BLOCK = "block"


class LevyStatus(str, Enum):
    PENDING = "pending"
    POOLED = "pooled"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class WalletTransactionType(str, Enum):
    DEDUCTION = "deduction"
    OFFSET_CREDIT = "offset_credit"
    BUDGET_RESET = "budget_reset"


class Provider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    DEEPSEEK = "deepseek"


class WalletTrend(str, Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    EXCEEDED = "exceeded"


class ScoreScope(str, Enum):
    AGENT = "agent"
    TEAM = "team"
    ORG = "org"


# ---------------------------------------------------------------------------
# Organization & Auth (Person A)
# ---------------------------------------------------------------------------

class OrgCreate(BaseModel):
    name: str
    contact_email: str


class OrgResponse(BaseModel):
    id: UUID
    name: str
    contact_email: str
    created_at: datetime


class ApiKeyCreate(BaseModel):
    org_id: UUID
    label: str = "default"


class ApiKeyResponse(BaseModel):
    id: UUID
    org_id: UUID
    key_prefix: str  # first 8 chars for display, e.g. "gl_abc123"
    label: str
    created_at: datetime


class ApiKeyCreated(ApiKeyResponse):
    """Only returned once at creation time — full key visible."""
    full_key: str


# ---------------------------------------------------------------------------
# Agent Registration (Person A)
# ---------------------------------------------------------------------------

class AgentCreate(BaseModel):
    agent_id: str  # developer-chosen identifier, e.g. "procurement-agent-1"
    display_name: Optional[str] = None
    team_id: Optional[str] = None


class AgentResponse(BaseModel):
    id: UUID
    org_id: UUID
    agent_id: str
    display_name: Optional[str]
    team_id: Optional[str]
    created_at: datetime


# ---------------------------------------------------------------------------
# Model Benchmarks — Green Router data (Person A seeds, Person B/C reads)
# ---------------------------------------------------------------------------

class ModelBenchmark(BaseModel):
    id: UUID
    model_id: str              # e.g. "claude-sonnet-4-6"
    provider: Provider
    quality_tier: QualityTier

    # Energy
    energy_per_1k_tokens_wh: Optional[float] = None
    energy_per_query_wh_avg: float  # average Wh for a typical query

    # Performance (normalized 0-1)
    reasoning_score: Optional[float] = None
    coding_score: Optional[float] = None
    math_score: Optional[float] = None

    # Eco-efficiency (Jegham DEA or our own)
    eco_efficiency_score: Optional[float] = None  # 0-1

    parameter_count_b: Optional[float] = None
    available_regions: list[str] = []
    last_updated: datetime


# ---------------------------------------------------------------------------
# Grid Carbon Intensity (Person A writes, Person B reads)
# ---------------------------------------------------------------------------

class GridCarbonIntensity(BaseModel):
    electricity_zone: str
    carbon_intensity_gco2e_kwh: float
    renewable_percentage: Optional[float] = None
    measured_at: datetime


class RegionZoneMapping(BaseModel):
    cloud_region: str          # e.g. "us-west-2"
    provider: str              # "aws" | "gcp" | "azure"
    electricity_zone: str      # Electricity Maps zone ID
    display_name: str


# ---------------------------------------------------------------------------
# Green Router — Request/Response (Person A)
# ---------------------------------------------------------------------------

class RouteRequest(BaseModel):
    quality: QualityTier = QualityTier.STANDARD
    carbon_priority: CarbonPriority = CarbonPriority.LOW
    max_latency_ms: Optional[int] = None
    provider_allowlist: Optional[list[Provider]] = None


class RouteResponse(BaseModel):
    model: str
    provider: Provider
    region: str
    grid_carbon_intensity_gco2e_kwh: float
    grid_renewable_pct: Optional[float]
    estimated_co2e_g: float
    estimated_energy_wh: float
    eco_score: float
    estimated_latency_ms: Optional[int] = None


class InferRequest(BaseModel):
    prompt: str
    quality: QualityTier = QualityTier.STANDARD
    carbon_priority: CarbonPriority = CarbonPriority.LOW
    max_latency_ms: Optional[int] = None
    max_tokens: int = 1024
    provider_allowlist: Optional[list[Provider]] = None
    agent_id: Optional[str] = None  # links to carbon wallet


class InferResponse(BaseModel):
    result: str                      # the AI output
    model: str
    provider: Provider
    region: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    routing: RouteResponse           # full routing decision
    receipt: ReceiptResponse         # environmental receipt
    wallet: Optional[WalletStatus] = None  # wallet status if agent_id provided


# ---------------------------------------------------------------------------
# Carbon Wallet (Person B)
# ---------------------------------------------------------------------------

class WalletCreate(BaseModel):
    agent_id: str
    monthly_budget_co2e_g: float
    on_exceeded: BudgetExceededPolicy = BudgetExceededPolicy.DOWNGRADE_MODEL


class WalletUpdate(BaseModel):
    monthly_budget_co2e_g: Optional[float] = None
    on_exceeded: Optional[BudgetExceededPolicy] = None


class WalletStatus(BaseModel):
    id: UUID
    org_id: UUID
    agent_id: str
    monthly_budget_co2e_g: float
    current_spend_co2e_g: float
    remaining_co2e_g: float
    on_exceeded: BudgetExceededPolicy
    period_start: datetime
    period_end: datetime
    trend: WalletTrend
    utilization_pct: float  # current_spend / budget * 100


class WalletTransactionRecord(BaseModel):
    id: UUID
    wallet_id: UUID
    amount_co2e_g: float
    type: WalletTransactionType
    receipt_id: Optional[UUID] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Levy (Person B)
# ---------------------------------------------------------------------------

class LevyConfig(BaseModel):
    carbon_price_per_ton_usd: float = 100.0  # default $100/ton
    levy_destination: str = "stripe_climate"   # or custom endpoint
    stripe_climate_api_key: Optional[str] = None


class LevyTransaction(BaseModel):
    id: UUID
    org_id: UUID
    receipt_id: UUID
    carbon_cost_g: float
    levy_amount_usd: float
    destination: str
    status: LevyStatus
    submitted_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime


class PayRequest(BaseModel):
    amount: float
    currency: str = "usd"
    to: str                              # recipient endpoint/address
    agent_id: str
    payment_protocol: str = "stripe_mpp"  # "stripe_mpp" | "x402" | "ap2"
    metadata: Optional[dict] = None


class PayResponse(BaseModel):
    payment_id: str
    amount: float
    currency: str
    carbon_levy_usd: float
    total_co2e_g: float
    receipt: ReceiptResponse
    levy_status: LevyStatus


# ---------------------------------------------------------------------------
# Receipts (Person C)
# ---------------------------------------------------------------------------

class EnvironmentalCost(BaseModel):
    co2e_g: float
    water_ml: Optional[float] = None
    energy_wh: float


class GridInfo(BaseModel):
    carbon_intensity_gco2e_kwh: float
    renewable_percentage: Optional[float] = None


class OffsetInfo(BaseModel):
    levy_usd: float
    destination: str
    status: LevyStatus


class NaiveComparison(BaseModel):
    naive_co2e_g: float
    savings_pct: float  # how much we saved vs naive routing


class ReceiptResponse(BaseModel):
    id: UUID
    org_id: UUID
    agent_id: Optional[str]
    timestamp: datetime

    # What happened
    action_type: str  # "inference" | "payment"
    model: Optional[str] = None
    provider: Optional[Provider] = None
    region: Optional[str] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None

    # Environmental cost
    environmental_cost: EnvironmentalCost
    grid: GridInfo
    offset: OffsetInfo

    # Wallet context
    wallet_budget_remaining_co2e_g: Optional[float] = None
    wallet_monthly_budget_co2e_g: Optional[float] = None

    # vs naive
    comparison: Optional[NaiveComparison] = None


class ReceiptListParams(BaseModel):
    agent_id: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    limit: int = Field(default=50, le=200)
    offset: int = 0


class ReceiptExportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"


# ---------------------------------------------------------------------------
# Sustainability Scores (Person C)
# ---------------------------------------------------------------------------

class ScoreComponents(BaseModel):
    carbon_efficiency: float      # 0-100: how green are model/region choices
    budget_adherence: float       # 0-100: staying within carbon budgets
    offset_coverage: float        # 0-100: % of emissions offset
    optimization_adoption: float  # 0-100: following optimization suggestions
    trend: float                  # 0-100: improving month over month


class SustainabilityScore(BaseModel):
    id: UUID
    org_id: UUID
    scope: ScoreScope
    scope_id: str  # agent_id, team_id, or org_id
    score: float   # 0-100 composite
    components: ScoreComponents
    period: datetime  # the date this score covers
    created_at: datetime


class Recommendation(BaseModel):
    id: UUID
    org_id: UUID
    scope: ScoreScope
    scope_id: str
    title: str          # e.g. "Switch to off-peak hours"
    description: str    # detailed explanation
    estimated_savings_co2e_g: float
    estimated_savings_pct: float
    priority: str       # "high" | "medium" | "low"
    created_at: datetime


class ScoreSummary(BaseModel):
    current_score: float
    previous_score: Optional[float]
    change: Optional[float]
    components: ScoreComponents
    recommendations: list[Recommendation]


# ---------------------------------------------------------------------------
# Dashboard aggregations (Person D consumes)
# ---------------------------------------------------------------------------

class DashboardSummary(BaseModel):
    org_id: UUID
    total_inferences: int
    total_co2e_g: float
    total_energy_wh: float
    total_water_ml: float
    total_levy_usd: float
    total_carbon_removed_g: float
    avg_savings_vs_naive_pct: float
    sustainability_score: float
    active_agents: int
    period_start: datetime
    period_end: datetime


class AgentSummary(BaseModel):
    agent_id: str
    display_name: Optional[str]
    total_inferences: int
    total_co2e_g: float
    total_energy_wh: float
    wallet_utilization_pct: Optional[float]
    sustainability_score: Optional[float]
    trend: Optional[WalletTrend]


class EmissionsDataPoint(BaseModel):
    timestamp: datetime
    co2e_g: float
    energy_wh: float
    inference_count: int


# ---------------------------------------------------------------------------
# Settings (Person B + Person D)
# ---------------------------------------------------------------------------

class OrgSettings(BaseModel):
    levy_config: LevyConfig
    default_carbon_priority: CarbonPriority = CarbonPriority.LOW
    default_quality: QualityTier = QualityTier.STANDARD
    default_budget_exceeded_policy: BudgetExceededPolicy = BudgetExceededPolicy.DOWNGRADE_MODEL


class OrgSettingsUpdate(BaseModel):
    levy_config: Optional[LevyConfig] = None
    default_carbon_priority: Optional[CarbonPriority] = None
    default_quality: Optional[QualityTier] = None
    default_budget_exceeded_policy: Optional[BudgetExceededPolicy] = None


# ---------------------------------------------------------------------------
# Shared pagination wrapper
# ---------------------------------------------------------------------------

class PaginatedResponse(BaseModel):
    data: list
    total: int
    limit: int
    offset: int
    has_more: bool
