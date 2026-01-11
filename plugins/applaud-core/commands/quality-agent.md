---
description: Review code quality and assess test coverage for Ardalis Clean Architecture projects
---

# Quality Agent Command

This command performs comprehensive code review and coverage analysis for projects built with the Ardalis Clean Architecture template.

## What Gets Reviewed

**Core Layer (Domain):**
- Entity design with Guard.Against validation
- Aggregate folder structure
- Interface definitions

**UseCases Layer (Application):**
- Command/Query handler patterns
- Result<T> return types
- DTO design
- Expression-based repository usage

**Web Layer (API):**
- FastEndpoint structure
- HTTP status code handling
- Request validation

**Infrastructure Layer:**
- Repository implementation
- Service adapters

**Frontend:**
- React component patterns
- React Query hooks
- TypeScript typing
- State management (server vs local state)
- Error handling (API errors, network errors, HTTP status codes)
- Accessibility & UX (loading states, feedback, focus management)

## Test Projects

Reviews tests across all three backend test projects:

| Project | Purpose |
|---------|---------|
| `{Project}.UnitTests` | Handler unit tests with mocks |
| `{Project}.FunctionalTests` | FastEndpoint API tests |
| `{Project}.IntegrationTests` | Repository/DB tests |

## Automated Quality Workflow

When test coverage is below 85%, quality-agent automatically:
1. Identifies specific files lacking tests
2. Invokes the `generate-tests` skill
3. Creates comprehensive tests in appropriate test projects
4. Re-audits coverage
5. Reports final metrics

## Usage

**Explicit invocation:**
```
/quality-agent
```

**Proactive activation:**
Claude will automatically suggest running quality-agent after:
- Adding new features
- Creating integrations
- Making significant code changes

You can also trigger it by saying "review my code" or "check test coverage".

---

*This command delegates to the `quality-agent` skill for implementation. See the skill documentation for full Ardalis Clean Architecture quality checklists.*
