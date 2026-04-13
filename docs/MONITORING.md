# Monitoring & Operations Guide

## Health Check

The backend exposes a health endpoint:

```
GET /health
```

Response when healthy:
```json
{
  "status": "healthy",
  "timestamp": "2025-03-01T12:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

Response when unhealthy (503):
```json
{
  "status": "unhealthy",
  "timestamp": "2025-03-01T12:00:00.000Z",
  "database": "disconnected"
}
```

Configure Azure Container Apps or load balancer to poll this endpoint every 30 seconds.

## Structured Logging

The backend uses Winston for structured JSON logging in production:

```json
{
  "level": "info",
  "message": "Lesson created",
  "service": "state-lessons-api",
  "timestamp": "2025-03-01T12:00:00.000Z",
  "lessonId": "LL-2025-401-003",
  "user": "jmartin@stateconstruction.com"
}
```

### Log Levels
- `error`: Unhandled exceptions, database failures, auth failures
- `warn`: Rate limiting, validation failures, deprecated usage
- `info`: Lesson CRUD, approvals, login/logout, health checks
- `debug`: SQL queries, request details (dev only)

### Azure Integration
Forward container logs to **Azure Log Analytics** via diagnostic settings.

Query example (KQL):
```kql
ContainerAppConsoleLogs_CL
| where Log_s contains "error"
| project TimeGenerated, Log_s
| order by TimeGenerated desc
```

## Error Handling Strategy

1. **Validation errors** (400): Zod schema validation with field-level details
2. **Auth errors** (401): Invalid/expired tokens, inactive users
3. **Permission errors** (403): Role-based access violations
4. **Not found** (404): Invalid lesson IDs
5. **Rate limiting** (429): Configurable per-IP rate limits
6. **Server errors** (500): Caught by global error handler, logged with stack trace

All errors return consistent JSON:
```json
{
  "error": "Human-readable message",
  "details": { ... }
}
```

## Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| API response time p95 | > 2s | Scale backend replicas |
| Error rate | > 1% | Check logs for patterns |
| Database connections | > 80% pool | Increase pool size |
| Disk usage | > 80% | Clean logs, expand storage |
| Memory usage | > 85% | Scale up or add replicas |
| Failed auth attempts | > 50/hour | Investigate security |

## Backup Strategy

- **Database**: Enable Azure automated backups (7-35 day retention)
- **Point-in-time restore**: Available through Azure portal
- **Manual backup**: `pg_dump` via scheduled Azure Function

## Regression Checklist

Before each deployment:

1. Run backend tests: `cd backend && npm test`
2. Run frontend build: `cd frontend && npm run build`
3. Verify login flow works
4. Create a new lesson and confirm it appears in register
5. Test PM approval on a pending lesson
6. Test PMO approval on a pending lesson
7. Test Department approval to trigger final approval
8. Verify dashboard KPIs update after approvals
9. Verify audit trail records all changes
10. Test that Executive user cannot submit or approve
11. Test that Contributor cannot access dashboard
12. Check health endpoint returns 200
