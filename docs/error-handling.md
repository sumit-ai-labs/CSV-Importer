# ADR-004: Error Handling Strategy

**Status:** Accepted

**Date:** 2026-07-07

## Context

The AI CSV Importer integrates multiple failure-prone systems, including file uploads, CSV parsing, AI inference, network communication, and data validation.

Without a standardized error-handling strategy, failures become inconsistent, difficult to debug, and hard to present to users.

The application must provide:

- Consistent API responses
- Clear user-facing error messages
- Detailed server-side logs
- Safe production behavior
- Easy debugging

---

# Decision

The application will implement centralized error handling.

Business logic will never directly send error responses.

Instead:

```text
Request
    │
    ▼
Controller
    │
    ▼
Service
    │
 throws AppError
    │
    ▼
Global Error Middleware
    │
    ▼
Standard API Response
```

Every error passes through a single middleware before reaching the client.

---

# Error Categories

Errors are divided into two categories.

## Operational Errors

These are expected failures that can occur during normal application usage.

Examples:

- Invalid CSV
- Missing uploaded file
- Unsupported file type
- CSV parsing failure
- AI rate limiting
- Invalid AI response
- Validation failure

Operational errors return meaningful HTTP responses.

---

## Programmer Errors

Unexpected bugs.

Examples:

- Null reference
- Undefined access
- Logic bugs
- Incorrect assumptions
- Dependency failures

These are logged in full.

The client receives a generic message.

---

# AppError

Business logic throws a custom error type.

Properties:

- message
- statusCode
- code
- isOperational

Example error codes:

```text
INVALID_FILE

CSV_PARSE_ERROR

AI_REQUEST_FAILED

AI_RESPONSE_INVALID

VALIDATION_ERROR

RATE_LIMITED

INTERNAL_SERVER_ERROR
```

Using explicit error codes simplifies debugging and future localization.

---

# API Response Format

All error responses follow the same structure.

```json
{
  "success": false,
  "message": "CSV parsing failed.",
  "error": {
    "code": "CSV_PARSE_ERROR"
  },
  "data": null
}
```

The response format never changes based on the error source.

---

# HTTP Status Codes

The application uses standard HTTP semantics.

| Status | Purpose                           |
| ------ | --------------------------------- |
| 400    | Invalid request                   |
| 404    | Route not found                   |
| 413    | File too large                    |
| 415    | Unsupported media type            |
| 422    | Validation or CSV parsing failure |
| 429    | AI provider rate limit            |
| 500    | Internal server error             |
| 503    | AI provider unavailable           |

---

# Validation Errors

Validation occurs at multiple stages.

Stages include:

- Request validation
- File validation
- CSV parsing
- AI response validation
- CRM record validation

Validation failures return HTTP 422.

The AI layer is never invoked when request validation fails.

---

# AI Errors

Possible AI failures include:

- Timeout
- Rate limiting
- Invalid structured output
- Provider unavailable
- Network interruption

Behavior:

- Retry transient failures.
- Log retry attempts.
- Continue processing remaining batches when possible.
- Return partial success if applicable.

---

# Partial Success

Imports should not fail entirely because one batch fails.

Example:

```text
100 Records

↓

95 Imported

5 Failed
```

The API returns both imported and skipped records.

This improves resilience for large datasets.

---

# Logging Strategy

Every error log includes:

- Request ID
- Timestamp
- Route
- Error code
- Stack trace (development only)
- Processing duration

This allows failures to be traced across the application.

---

# Production Behavior

Development:

- Detailed stack traces
- Full error context
- Verbose logging

Production:

- No stack traces in API responses
- Sanitized error messages
- Full server-side logs only

Sensitive information is never exposed to clients.

---

# Controller Responsibilities

Controllers should never contain business logic.

Example flow:

```text
Controller

↓

Service

↓

throw AppError

↓

Global Error Middleware
```

Controllers only:

- Receive requests
- Call services
- Return successful responses
- Delegate failures

---

# Service Responsibilities

Services are responsible for:

- Detecting business failures
- Throwing appropriate AppError instances
- Never sending HTTP responses directly

This keeps services framework-agnostic and easier to test.

---

# Observability

Errors are correlated using a unique request identifier.

Each request can be traced through:

- HTTP request
- CSV parsing
- Batch generation
- AI requests
- Validation
- Final response

This simplifies production debugging.

---

# Future Extensions

The error architecture supports future integration with:

- Sentry
- Datadog
- OpenTelemetry
- Prometheus
- Grafana

No architectural changes are required for these integrations.

---

# Consequences

Benefits:

- Consistent API responses
- Centralized error management
- Easier debugging
- Better observability
- Improved maintainability
- Framework-independent business logic

Trade-offs:

- Additional boilerplate for custom errors and middleware.

This trade-off is accepted because it significantly improves code quality and production readiness.

---

# Summary

The application adopts a centralized error-handling strategy where services communicate failures through structured `AppError` instances, controllers remain thin, and a global middleware converts all failures into consistent API responses. This approach improves reliability, observability, and maintainability while preventing internal implementation details from leaking to clients.
