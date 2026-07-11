# ADR-001: Overall Project Architecture

**Status:** Accepted

**Date:** 2026-07-07

## Context

GrowEasy requires an AI-powered CSV Importer capable of importing CRM lead information from arbitrary CSV formats.

Unlike traditional CSV importers, this system cannot rely on predefined column names because uploaded datasets may originate from Facebook Lead Ads, Google Ads, Excel spreadsheets, real estate CRMs, sales reports, marketing agencies, or manually created files.

The primary engineering challenge is intelligent semantic mapping rather than CSV parsing.

The system must provide a responsive user experience while ensuring the backend remains the authoritative source for all imported data.

---

# Decision

The application will be implemented as a monorepo consisting of two independent applications.

```text
Frontend (Next.js)

↓

Local CSV Preview

↓

User Confirmation

↓

Backend (Express)

↓

CSV Parsing

↓

Batch AI Processing

↓

Validation

↓

Import Results
```

The frontend and backend will have clearly separated responsibilities.

## Frontend Responsibilities

- Allow CSV upload through drag-and-drop or file picker.
- Parse the selected CSV locally using PapaParse.
- Display a preview without invoking AI.
- Upload the original CSV file only after user confirmation.
- Display import progress and final results.

The frontend is responsible only for user experience and never acts as the source of truth.

## Backend Responsibilities

The backend owns the import process.

Responsibilities include:

- Receiving uploaded CSV files.
- Parsing CSV contents.
- Splitting records into batches.
- Sending batches to the AI model.
- Validating AI responses.
- Producing normalized CRM records.
- Returning import summaries.

The backend never trusts data produced by the client.

---

# Architectural Principles

The project follows the following principles.

## Single Responsibility Principle

Each module has one responsibility.

Examples include:

- CSV Parser
- Batch Generator
- OpenAI Service
- Prompt Builder
- Validator
- Import Orchestrator

Business logic is isolated from HTTP controllers.

---

## Separation of Concerns

The frontend handles presentation.

The backend handles business logic.

The AI service handles semantic extraction.

Validation is independent of AI.

---

## Backend as Source of Truth

Although the frontend parses the CSV to provide an immediate preview, the backend reparses the uploaded CSV during import.

This intentionally duplicates parsing but guarantees that the backend processes the original uploaded file rather than trusting client-side transformations.

This approach improves reliability, security, and consistency.

---

## AI as a Mapping Engine

Artificial Intelligence is responsible only for semantic field mapping.

It is not responsible for:

- Parsing CSV files
- Validating JSON
- Enforcing CRM rules
- Managing batches
- Handling retries

Those concerns remain deterministic backend responsibilities.

---

## Deterministic Validation

All AI responses are validated before becoming CRM records.

Validation includes:

- Required structure
- Allowed CRM status values
- Allowed data source values
- Date normalization
- Record completeness

Invalid records are rejected or repaired before inclusion.

The system never assumes AI output is correct.

---

## Batch Processing

CSV records are processed in batches.

Reasons include:

- Lower latency
- Reduced token usage
- Better rate-limit handling
- Partial retry capability
- Improved scalability

Failed batches can be retried independently without repeating successful work.

---

## Error Handling

Operational errors are handled centrally.

Examples include:

- Invalid CSV files
- Upload failures
- AI timeouts
- Invalid AI responses
- Validation failures

Errors are converted into consistent API responses without exposing internal implementation details.

---

## Observability

Every request receives a unique request identifier.

Structured logging captures:

- Request ID
- HTTP method
- Route
- Duration
- Status code
- Error information

This enables debugging, tracing, and future monitoring.

---

# Alternatives Considered

## Parsing only on the frontend

Rejected.

Although this would reduce backend work, it would require trusting client-generated data and would not satisfy the assignment requirement for backend CSV parsing.

## AI parsing raw CSV directly

Rejected.

Large prompts increase token usage, reduce reliability, and make validation difficult.

Parsing remains deterministic backend logic.

## One AI request per row

Rejected.

This dramatically increases latency and API costs.

Batch processing provides better throughput while maintaining accuracy.

---

# Consequences

Benefits:

- Clear separation of responsibilities.
- Easier testing.
- Production-ready architecture.
- Better scalability.
- Reliable validation.
- Reduced AI cost through batching.
- Maintainable codebase.

Trade-offs:

- CSV parsing occurs twice.

This duplication is intentional because it provides immediate client-side feedback while ensuring the backend remains the authoritative source of imported data.

---

# Summary

The chosen architecture prioritizes correctness, maintainability, observability, and production readiness over minimizing implementation complexity.

The backend remains the authoritative processing layer, while the AI is treated as a specialized semantic extraction service rather than a replacement for deterministic application logic.
