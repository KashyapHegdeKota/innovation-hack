"""
Receipt routes.
Owner: Person C

Endpoints:
  GET  /v1/receipts/{receipt_id}     — single receipt
  GET  /v1/receipts                  — list receipts with filters
  GET  /v1/receipts/export           — export as CSV/JSON
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime
from ..auth import get_current_user
from ..models.schemas import ReceiptResponse, ReceiptExportFormat, PaginatedResponse

router = APIRouter()


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(receipt_id: str, current_user=Depends(get_current_user)):
    # TODO: Person C implements
    raise HTTPException(501, "Not implemented yet")


@router.get("/receipts")
async def list_receipts(
    agent_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user=Depends(get_current_user),
):
    # TODO: Person C implements
    # 1. Look up org from current_user
    # 2. Query receipts table with filters
    # 3. Return PaginatedResponse
    raise HTTPException(501, "Not implemented yet")


@router.get("/receipts/export")
async def export_receipts(
    format: ReceiptExportFormat = ReceiptExportFormat.CSV,
    agent_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    current_user=Depends(get_current_user),
):
    # TODO: Person C implements
    # Return CSV or JSON file download
    raise HTTPException(501, "Not implemented yet")
