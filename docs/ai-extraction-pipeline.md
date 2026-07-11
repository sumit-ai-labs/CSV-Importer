# ADR-002: AI Extraction Pipeline

**Status:** Accepted

**Date:** 2026-07-07

## Context

The primary objective of this project is to transform arbitrary CSV exports into a standardized GrowEasy CRM format.

Unlike conventional CSV importers, uploaded datasets cannot be expected to share consistent column names, ordering, or structure.

Examples include:

- Facebook Lead Ads exports
- Google Ads exports
- Excel spreadsheets
- Real estate CRM exports
- Sales reports
- Marketing agency reports
- Manually maintained CSV files

Because of this variability, deterministic header mapping is insufficient. A semantic understanding of the data is required.

A Large Language Model (LLM) is therefore used as a semantic field-mapping engine.

---

# Decision

The AI is responsible only for semantic interpretation.

The backend remains responsible for parsing, batching, validation, retries, and final record acceptance.

The AI is never treated as the source of truth.

---

# Processing Pipeline

```text
CSV Upload
      │
      ▼
Backend CSV Parser
      │
      ▼
JavaScript Objects
      │
      ▼
Batch Generator
      │
      ▼
Prompt Builder
      │
      ▼
OpenAI Structured Output
      │
      ▼
Zod Validation
      │
      ▼
Normalization
      │
      ▼
Import Summary
```

Every stage has a single responsibility.

---

# Stage 1 — CSV Parsing

The backend parses the uploaded CSV using a deterministic parser.

Responsibilities:

- Read headers
- Parse rows
- Preserve original values
- Skip malformed CSV rows

No semantic mapping occurs at this stage.

---

# Stage 2 — Batch Generation

Rows are grouped into fixed-size batches before invoking the AI model.

Default batch size:

- 15 records

Reasons:

- Lower API latency
- Reduced token usage
- Easier retries
- Better rate-limit management

Batch size should remain configurable through application configuration.

---

# Stage 3 — Prompt Construction

Each batch is converted into a structured prompt containing:

- Mapping instructions
- CRM field definitions
- Business rules
- Allowed enum values
- Original headers
- Batch rows

The prompt must remain deterministic.

Application logic must never be embedded inside the prompt.

---

# Stage 4 — AI Extraction

The AI receives a batch of parsed rows.

Its responsibility is limited to:

- Identifying field meanings
- Normalizing values
- Producing the target CRM schema

The AI must not invent information.

Unknown fields remain empty.

---

# Stage 5 — Structured Output

Structured Outputs (JSON Schema) are used to constrain responses.

Benefits include:

- Deterministic structure
- Reduced parsing failures
- Easier validation
- Lower repair cost

Free-form responses are not accepted.

---

# Stage 6 — Validation

Every AI response is validated using Zod.

Validation includes:

- Required object shape
- Enum validation
- Date format
- String normalization
- Record completeness

Invalid objects are rejected.

The application never assumes AI responses are correct.

---

# Stage 7 — Normalization

Validated records are normalized before inclusion.

Normalization includes:

- Trimming whitespace
- Normalizing phone numbers
- Extracting country codes
- Standardizing email casing
- Appending secondary emails to crm_note
- Appending secondary phone numbers to crm_note

Normalization is deterministic and independent of the AI.

---

# Retry Strategy

Failures may occur due to:

- Rate limiting
- Temporary API failures
- Network interruptions

The system retries failed batches using exponential backoff.

Maximum retries:

- 3

Only failed batches are retried.

Successful batches are never repeated.

---

# Error Isolation

Each batch is processed independently.

Failure of one batch does not terminate the entire import.

Instead:

- Successful batches are returned.
- Failed batches are reported separately.

This improves resilience for large imports.

---

# Validation Rules

The backend enforces the following rules regardless of AI output.

## CRM Status

Allowed values:

- GOOD_LEAD_FOLLOW_UP
- DID_NOT_CONNECT
- BAD_LEAD
- SALE_DONE

Any other value is rejected.

---

## Data Source

Allowed values:

- leads_on_demand
- meridian_tower
- eden_park
- varah_swamy
- sarjapur_plots

Unknown values are replaced with an empty string.

---

## Email Handling

If multiple email addresses exist:

- The first becomes the primary email.
- Remaining addresses are appended to `crm_note`.

---

## Mobile Handling

If multiple mobile numbers exist:

- The first becomes the primary mobile number.
- Remaining numbers are appended to `crm_note`.

---

## Invalid Records

A record is skipped if neither of the following exists:

- email
- mobile number

The skipped record is returned with a reason.

---

# Prompt Versioning

Prompt templates are version-controlled.

Any future prompt improvements can be released independently without changing application logic.

The prompt is treated as a versioned artifact.

---

# AI Design Principles

The AI is used for:

- Semantic understanding
- Intelligent field mapping
- Value normalization

The AI is not used for:

- CSV parsing
- Validation
- Retry logic
- Business rule enforcement
- Error handling

These responsibilities remain deterministic backend logic.

---

# Security

The backend never exposes the OpenAI API key.

All AI requests originate exclusively from the backend.

Only validated records are returned to the client.

---

# Observability

Every AI request logs:

- Request ID
- Batch number
- Batch size
- Model used
- Processing duration
- Retry count
- Success or failure

This enables debugging and performance monitoring.

---

# Consequences

Benefits:

- Consistent AI responses
- Lower operational costs
- Better resilience
- Predictable validation
- Easier debugging
- Independent retries
- Production-ready scalability

Trade-offs:

- Additional validation logic increases implementation complexity.

This complexity is accepted because deterministic validation significantly improves reliability and prevents malformed AI responses from entering the CRM.

---

# Summary

The AI pipeline is intentionally designed so that the language model performs only semantic interpretation while deterministic backend services remain responsible for parsing, validation, retries, normalization, and business rule enforcement.

This separation minimizes AI-related failures, improves maintainability, and ensures the system behaves predictably even when processing inconsistent or messy datasets.
