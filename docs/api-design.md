# ADR-003: API Design

**Status:** Accepted

**Date:** 2026-07-07

## Context

The frontend and backend must communicate through a stable, versionable API contract.

The frontend is responsible for the user experience, while the backend is responsible for parsing CSV files, AI-powered CRM extraction, validation, and returning normalized results.

The API should remain simple, deterministic, and easy to extend.

---

# Decision

The application will expose a versioned REST API.

Base URL:

```text
/api/v1
```

All endpoints return the same response envelope.

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

This provides a consistent developer experience across all endpoints.

---

# Endpoint Overview

| Method | Endpoint       | Purpose                                                |
| ------ | -------------- | ------------------------------------------------------ |
| POST   | /api/v1/import | Upload CSV, parse, process with AI, return CRM records |
| GET    | /api/v1/health | Health check                                           |

No additional upload endpoint is required because the assignment workflow allows local preview before confirmation.

---

# POST /api/v1/import

## Purpose

Accept the original CSV file after the user confirms the import.

The backend performs:

1. CSV parsing
2. Batch generation
3. AI extraction
4. Validation
5. Normalization
6. Result generation

---

## Request

Content-Type

```text
multipart/form-data
```

Body

| Field | Type     | Required |
| ----- | -------- | -------- |
| file  | CSV File | Yes      |

Example

```http
POST /api/v1/import

Content-Type: multipart/form-data

file=<uploaded csv>
```

---

# Successful Response

HTTP Status

```text
200 OK
```

Response

```json
{
  "success": true,
  "message": "Import completed successfully",
  "data": {
    "summary": {
      "totalRecords": 120,
      "importedRecords": 113,
      "skippedRecords": 7
    },
    "records": [],
    "skipped": []
  }
}
```

---

# Summary Object

```ts
interface ImportSummary {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
}
```

---

# CRM Record

```ts
interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}
```

---

# Skipped Record

```ts
interface SkippedRecord {
  row: number;
  reason: string;
  original: Record<string, string>;
}
```

The original row is returned for debugging and transparency.

---

# Error Responses

All errors follow the same structure.

Example

```json
{
  "success": false,
  "message": "Invalid CSV file.",
  "data": null
}
```

---

# HTTP Status Codes

| Status | Meaning                          |
| ------ | -------------------------------- |
| 200    | Success                          |
| 400    | Invalid request                  |
| 401    | Unauthorized (future use)        |
| 413    | File too large                   |
| 415    | Unsupported file type            |
| 422    | CSV parsing or validation failed |
| 429    | AI provider rate limit           |
| 500    | Internal server error            |
| 503    | AI provider unavailable          |

---

# Health Endpoint

GET

```text
/api/v1/health
```

Response

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "version": "1.0.0",
    "timestamp": "2026-07-07T10:00:00Z"
  }
}
```

This endpoint is intended for deployment platforms, monitoring, and uptime checks.

---

# Validation

The backend validates:

- Uploaded file exists.
- MIME type is supported.
- File size is within limits.
- CSV structure is readable.
- AI response matches the expected schema.
- Business rules are satisfied.

Invalid requests never reach the AI layer.

---

# API Design Principles

The API follows these principles:

- Stateless
- Versioned
- Predictable
- Consistent response envelope
- Explicit HTTP status codes
- No business logic in controllers

---

# Future Extensions

The API can be extended with additional endpoints without breaking compatibility.

Examples:

- GET /api/v1/imports
- GET /api/v1/imports/:id
- DELETE /api/v1/imports/:id
- POST /api/v1/export

Versioning ensures future changes remain backward compatible.

---

# Summary

The API exposes a minimal surface area focused on the assignment requirements while providing a stable, scalable contract suitable for production use. By keeping the API stateless, versioned, and consistent, the frontend and backend can evolve independently without breaking integrations.
