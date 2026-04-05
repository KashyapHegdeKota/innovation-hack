"""
Base service class for GreenLedger services.

Provides common functionality like database access, logging, and health checks.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging
from ..database import get_supabase_client


class BaseService(ABC):
    """Base class for all GreenLedger services."""
    
    def __init__(self):
        self.db = get_supabase_client()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Initialized {self.__class__.__name__}")
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Service-specific health check implementation."""
        pass
    
    def log_operation(self, operation: str, data: Dict[str, Any], level: str = "info"):
        """Standardized operation logging."""
        log_func = getattr(self.logger, level.lower(), self.logger.info)
        log_func(f"{operation}: {data}")
    
    async def execute_db_query(self, table: str, operation: str, data: Dict[str, Any] = None):
        """Execute database operations with error handling."""
        try:
            if not self.db:
                raise Exception("Database connection not available")
            
            table_ref = self.db.table(table)
            
            if operation == "select":
                return table_ref.select("*").execute()
            elif operation == "insert":
                return table_ref.insert(data).execute()
            elif operation == "update":
                return table_ref.update(data).execute()
            elif operation == "delete":
                return table_ref.delete().execute()
            else:
                raise ValueError(f"Unknown operation: {operation}")
                
        except Exception as e:
            self.log_operation(
                f"Database {operation} failed", 
                {"table": table, "error": str(e)}, 
                level="error"
            )
            raise