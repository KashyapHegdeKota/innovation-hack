-- Migration 002: Add routing fields to receipts
-- Run this in Supabase SQL Editor

ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS requested_model TEXT,
  ADD COLUMN IF NOT EXISTS prompt_preview  TEXT;
