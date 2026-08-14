# FIRE54 Data Architecture

This document defines the canonical data ownership and flow for FIRE54 so that dashboard intelligence and reporting remain consistent and avoid duplicate or conflicting sources of truth.

## 1. Portfolio Domain

Source of truth:
- `athena-portfolio` storage
- `getPortfolio()`
- `lib/investments/investment-engine.ts`

Owns:
- Asset current values
- Liability values
- Net worth calculation
- Asset allocation
- Current portfolio composition

Does NOT own:
- Monthly cash flow
- Monthly investment decisions
- Monthly income/expense activity
- Historical month-by-month review entries

The Portfolio domain represents the current snapshot of assets and liabilities. It is the canonical source for current net worth, asset allocation, current holdings, and financial position displayed in the dashboard.

## 2. Monthly Financial Statement Domain

Source of truth:
- `fire54_monthly_reviews`
- Monthly Entry system

Owns:
- Salary
- Other income
- Monthly expenses
- Monthly investments
- Cash allocation
- Monthly behaviour tracking
- Historical statement data for month-over-month analysis

This domain captures the month-by-month cash-flow and behavioural record. It is not the canonical source for the current portfolio balance, but it is the source for recent monthly decisions, spending habits, and cash-flow performance.

## 3. Financial Profile Domain

Source of truth:
- `fire54-financial-profile`

Owns:
- Age
- Retirement age
- Salary assumptions
- Pension
- Inflation assumptions
- Return assumptions
- Baseline personal financial inputs

This domain defines the long-lived baseline assumptions used to initialize and evaluate the broader financial plan. It is not the same as the current portfolio balance and should not be treated as the current asset/liability record.

## 4. Goals Domain

Source of truth:
- Goals engine

Owns:
- Retirement target
- Emergency fund target
- Investment goals
- Other financial goals
- Goal-specific progress, status, and target amounts

The goals domain provides target framing for planning and dashboard progress. It is not the canonical store for current portfolio balances or monthly cash flow.

## 5. Retirement Engine Flow

The retirement calculation flow is:

Profile
    ↓
Retirement Adapter
    ↓
Retirement Engine
    ↓
Projection
    ↓
Dashboard Intelligence

Detailed flow:
- Financial Profile provides personal and assumption data
- `profile-retirement-adapter.ts` translates profile + portfolio + goal data into retirement assumptions
- `lib/retirement/retirement-engine.ts` invokes the retirement calculation logic
- Projection computes required corpus, target monthly income, years to retirement, and likely funding gap/surplus
- Dashboard intelligence components consume the retirement projection rather than reconstructing values independently

## 6. Rules

- Do not duplicate financial values across domains.
- The current Portfolio is the canonical source for current assets and liabilities.
- Monthly Financial Statement captures month-by-month behaviour and cash flow, not current asset values.
- Financial Profile owns assumptions and personal baseline data, not the live investment balance.
- Goals own targets and progress against those targets, not the real-time portfolio composition.
- UI components should consume existing engines instead of creating separate local data mirrors.
- No new localStorage keys without explicit approval.
- Dashboard intelligence must read from the appropriate domain source and stay aligned with the single source of truth.

## Summary

FIRE54 is designed around a clean separation of concerns:

- Portfolio = current financial position
- Monthly Statement = monthly cash-flow and behavioural history
- Financial Profile = personal and assumption inputs
- Goals = target framing and progress
- Retirement Engine = projection from profile + portfolio + goal inputs

This separation prevents conflicting dashboard values and ensures the system remains consistent as data changes over time.
