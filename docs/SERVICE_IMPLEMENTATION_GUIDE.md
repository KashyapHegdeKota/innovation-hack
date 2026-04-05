# GreenLedger Service Implementation Guide

This guide provides practical steps to implement and structure the GreenLedger service architecture.

## Service Implementation Checklist

### ✅ Already Implemented
- [x] API Gateway (FastAPI) - `apps/api/main.py`
- [x] Authentication (Firebase JWT) - `apps/api/auth.py`
- [x] Database client (Supabase) - `apps/api/database.py`
- [x] Basic route structure - `apps/api/routes/`
- [x] Core models/schemas - `apps/api/models/schemas.py`
- [x] Web dashboard - `apps/web/`
- [x] CLI interface - `cli/`

### 🚧 Partially Implemented
- [ ] Green Router Service - Basic structure exists, needs full implementation
- [ ] Carbon Wallet Service - Routes exist, needs service layer
- [ ] Receipt Engine - Basic receipt handling, needs full standardization
- [ ] Levy Engine - Basic payment handling, needs carbon levy calculation

### ❌ To Be Implemented
- [ ] Scoring Engine Service
- [ ] External API integrations (Electricity Maps, Stripe Climate)
- [ ] Background job processing
- [ ] Comprehensive caching layer

## Implementation Roadmap

### Phase 1: Core Service Layer (Week 1-2)

#### 1.1 Create Service Base Classes
Create a base service class for consistent patterns:

```python
# apps/api/services/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from ..database import get_supabase_client
import logging

class BaseService(ABC):
    def __init__(self):
        self.db = get_supabase_client()
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Service-specific health check"""
        pass
    
    def log_operation(self, operation: str, data: Dict[str, Any]):
        """Standardized operation logging"""
        self.logger.info(f"{operation}: {data}")
```

#### 1.2 Implement Green Router Service
```python
# apps/api/services/router.py
from .base import BaseService
from ..models.schemas import RouteRequest, RouteResponse
import aioredis
import httpx

class GreenRouterService(BaseService):
    def __init__(self):
        super().__init__()
        self.redis = aioredis.from_url("redis://localhost")
        self.http_client = httpx.AsyncClient()
    
    async def get_optimal_route(self, request: RouteRequest) -> RouteResponse:
        # 1. Fetch grid carbon intensity
        grid_data = await self._get_grid_intensity(request.regions)
        
        # 2. Get model benchmarks
        models = await self._get_model_benchmarks(request.quality)
        
        # 3. Apply filters and scoring
        candidates = self._score_options(models, grid_data, request)
        
        # 4. Return optimal choice
        return self._select_best(candidates)
    
    async def _get_grid_intensity(self, regions: list) -> Dict:
        # Check Redis cache first
        cached = await self.redis.get(f"grid:{region}")
        if cached:
            return json.loads(cached)
        
        # Fetch from Electricity Maps API
        # Cache for 5 minutes
        pass
```

#### 1.3 Implement Carbon Wallet Service
```python
# apps/api/services/wallet.py
from .base import BaseService
from ..models.schemas import WalletRequest, WalletResponse
from decimal import Decimal

class CarbonWalletService(BaseService):
    async def check_budget(self, agent_id: str, estimated_co2e: Decimal) -> Dict:
        wallet = await self._get_wallet(agent_id)
        
        if wallet.current_spend + estimated_co2e > wallet.monthly_budget:
            return await self._handle_budget_exceeded(wallet, estimated_co2e)
        
        return {"allowed": True, "wallet": wallet}
    
    async def deduct_carbon(self, agent_id: str, actual_co2e: Decimal, receipt_id: str):
        # Atomic transaction to deduct from wallet
        pass
    
    async def _handle_budget_exceeded(self, wallet, estimated_co2e):
        if wallet.on_exceeded == "downgrade_model":
            return {"allowed": False, "action": "downgrade", "wallet": wallet}
        # Handle other policies
        pass
```

### Phase 2: External Integrations (Week 3)

#### 2.1 Electricity Maps Integration
```python
# apps/api/integrations/electricity_maps.py
import httpx
import asyncio
from typing import Dict, List

class ElectricityMapsClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.electricitymap.org/v3"
        self.client = httpx.AsyncClient()
    
    async def get_carbon_intensity(self, zone: str) -> Dict:
        response = await self.client.get(
            f"{self.base_url}/carbon-intensity/latest",
            params={"zone": zone},
            headers={"auth-token": self.api_key}
        )
        return response.json()
    
    async def get_multiple_zones(self, zones: List[str]) -> Dict:
        tasks = [self.get_carbon_intensity(zone) for zone in zones]
        results = await asyncio.gather(*tasks)
        return dict(zip(zones, results))
```

#### 2.2 Stripe Climate Integration
```python
# apps/api/integrations/stripe_climate.py
import stripe
from decimal import Decimal

class StripeClimateClient:
    def __init__(self, api_key: str):
        stripe.api_key = api_key
    
    async def create_climate_order(self, metric_tons: Decimal) -> Dict:
        order = stripe.climate.Order.create(
            metric_tons=str(metric_tons),
            currency="usd"
        )
        return {
            "order_id": order.id,
            "amount": order.amount_total,
            "status": order.status
        }
    
    async def batch_create_order(self, total_metric_tons: Decimal, 
                               transaction_ids: List[str]) -> Dict:
        # Create single order for batched micro-levies
        order = await self.create_climate_order(total_metric_tons)
        # Log mapping of transaction IDs to this order
        return order
```

### Phase 3: Background Jobs (Week 4)

#### 3.1 Job Processing Framework
```python
# apps/api/jobs/base.py
from abc import ABC, abstractmethod
import asyncio
import logging

class BaseJob(ABC):
    def __init__(self, interval_seconds: int):
        self.interval = interval_seconds
        self.logger = logging.getLogger(self.__class__.__name__)
        self.running = False
    
    @abstractmethod
    async def execute(self):
        pass
    
    async def start(self):
        self.running = True
        while self.running:
            try:
                await self.execute()
                self.logger.info(f"Job completed successfully")
            except Exception as e:
                self.logger.error(f"Job failed: {str(e)}")
            
            await asyncio.sleep(self.interval)
    
    def stop(self):
        self.running = False
```

#### 3.2 Grid Data Refresh Job
```python
# apps/api/jobs/grid_refresh.py
from .base import BaseJob
from ..integrations.electricity_maps import ElectricityMapsClient
import aioredis

class GridRefreshJob(BaseJob):
    def __init__(self):
        super().__init__(interval_seconds=300)  # 5 minutes
        self.client = ElectricityMapsClient(os.getenv("ELECTRICITY_MAPS_KEY"))
        self.redis = aioredis.from_url("redis://localhost")
    
    async def execute(self):
        # Get list of active regions from database
        active_regions = await self._get_active_regions()
        
        # Fetch current intensities
        intensities = await self.client.get_multiple_zones(active_regions)
        
        # Cache in Redis with 5-minute TTL
        for zone, data in intensities.items():
            await self.redis.setex(
                f"grid:{zone}", 
                300,  # 5 minutes
                json.dumps(data)
            )
```

### Phase 4: Advanced Features (Week 5-6)

#### 4.1 Scoring Engine Service
```python
# apps/api/services/scoring.py
from .base import BaseService
from decimal import Decimal

class ScoringEngineService(BaseService):
    async def compute_agent_score(self, agent_id: str, period: str) -> Dict:
        # Get agent's data for the period
        receipts = await self._get_agent_receipts(agent_id, period)
        wallet = await self._get_agent_wallet(agent_id)
        
        # Compute component scores
        carbon_efficiency = self._compute_carbon_efficiency_score(receipts)
        budget_adherence = self._compute_budget_adherence_score(wallet)
        offset_coverage = self._compute_offset_coverage_score(receipts)
        optimization_adoption = self._compute_optimization_score(agent_id, period)
        trend = self._compute_trend_score(agent_id, period)
        
        # Weighted total
        total_score = (
            carbon_efficiency * 0.30 +
            budget_adherence * 0.20 +
            offset_coverage * 0.20 +
            optimization_adoption * 0.15 +
            trend * 0.15
        )
        
        return {
            "agent_id": agent_id,
            "period": period,
            "total_score": total_score,
            "components": {
                "carbon_efficiency": carbon_efficiency,
                "budget_adherence": budget_adherence,
                "offset_coverage": offset_coverage,
                "optimization_adoption": optimization_adoption,
                "trend": trend
            }
        }
```

## Directory Structure After Implementation

```
apps/api/
├── main.py                    # FastAPI app & route registration
├── auth.py                    # Authentication middleware
├── database.py                # Supabase client
├── services/                  # Core business logic
│   ├── base.py               # Base service class
│   ├── router.py             # Green Router Service
│   ├── wallet.py             # Carbon Wallet Service
│   ├── levy.py               # Levy Engine Service
│   ├── receipt.py            # Receipt Engine Service
│   └── scoring.py            # Scoring Engine Service
├── integrations/              # External API clients
│   ├── electricity_maps.py   # Grid carbon intensity
│   ├── stripe_climate.py     # Carbon removal payments
│   └── ai_providers.py       # Unified AI provider interface
├── jobs/                      # Background job processing
│   ├── base.py               # Base job class
│   ├── grid_refresh.py       # Grid data polling
│   ├── levy_batch.py         # Batch levy processing
│   └── score_compute.py      # Daily score computation
├── routes/                    # API endpoint definitions
│   ├── infer.py              # Inference & routing
│   ├── wallets.py            # Wallet management
│   ├── receipts.py           # Receipt queries
│   ├── scores.py             # Score queries
│   └── pay.py                # Payment processing
└── models/
    └── schemas.py            # Pydantic models
```

## Configuration Management

### Environment Variables
```bash
# Database
SUPABASE_URL=
SUPABASE_KEY=

# External APIs
ELECTRICITY_MAPS_API_KEY=
STRIPE_SECRET_KEY=
ANTHROPIC_API_KEY=  # Optional, for routing demos
OPENAI_API_KEY=     # Optional, for routing demos

# Cache
REDIS_URL=redis://localhost:6379

# Auth
FIREBASE_PROJECT_ID=
```

### Service Configuration
```python
# apps/api/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    electricity_maps_api_key: str
    stripe_secret_key: str
    redis_url: str = "redis://localhost:6379"
    
    # Service intervals (seconds)
    grid_refresh_interval: int = 300  # 5 minutes
    levy_batch_interval: int = 3600   # 1 hour
    score_compute_interval: int = 86400  # 24 hours
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Testing Strategy

### Service Tests
```python
# tests/api/services/test_router.py
import pytest
from apps.api.services.router import GreenRouterService

@pytest.mark.asyncio
async def test_optimal_route_selection():
    service = GreenRouterService()
    request = RouteRequest(
        quality="high",
        carbon_priority="low",
        max_latency_ms=3000
    )
    
    result = await service.get_optimal_route(request)
    
    assert result.model is not None
    assert result.estimated_co2e > 0
    assert result.region in ["us-west-1", "us-west-2", "eu-west-1"]
```

### Integration Tests
```python
# tests/api/integrations/test_electricity_maps.py
@pytest.mark.asyncio
async def test_electricity_maps_integration():
    client = ElectricityMapsClient(api_key="test-key")
    
    # Mock the HTTP response
    with httpx_mock.mock(transport=httpx.MockTransport()) as mock:
        mock.get("https://api.electricitymap.org/v3/carbon-intensity/latest").mock(
            return_value=httpx.Response(200, json={"carbonIntensity": 89})
        )
        
        result = await client.get_carbon_intensity("US-CAL-CISO")
        assert result["carbonIntensity"] == 89
```

## Monitoring & Observability

### Health Checks
```python
# apps/api/routes/health.py
from fastapi import APIRouter
from ..services.router import GreenRouterService
from ..services.wallet import CarbonWalletService

router = APIRouter()

@router.get("/health/services")
async def service_health():
    results = {}
    
    services = [
        ("router", GreenRouterService()),
        ("wallet", CarbonWalletService()),
    ]
    
    for name, service in services:
        try:
            health = await service.health_check()
            results[name] = {"status": "healthy", "details": health}
        except Exception as e:
            results[name] = {"status": "unhealthy", "error": str(e)}
    
    return results
```

This implementation guide provides a structured approach to building out your service architecture. Start with Phase 1 to establish the core service layer, then progressively add external integrations and advanced features.

Would you like me to help implement any specific service or create more detailed code for a particular component?