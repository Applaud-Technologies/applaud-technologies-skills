---
description: Generate comprehensive unit, functional, and integration tests for Ardalis Clean Architecture projects
---

# Generate Tests Command

This command creates thorough tests for projects built with the Ardalis Clean Architecture template.

## Test Types

- **Unit Tests** - Handler tests with mocked dependencies (`{Project}.UnitTests`)
- **Functional Tests** - FastEndpoint API tests (`{Project}.FunctionalTests`)
- **Integration Tests** - Repository tests with real database (`{Project}.IntegrationTests`)
- **Frontend Tests** - React component and hook tests

## Testing Stack

**Backend (C#)**
- xUnit 3.0 test framework
- Shouldly for assertions
- NSubstitute for mocking
- Microsoft.AspNetCore.Mvc.Testing for API tests

**Frontend (TypeScript/React)**
- Vitest test framework
- @testing-library/react for DOM testing
- MSW (Mock Service Worker) for API mocking

## Test Project Structure

```
tests/
├── {Project}.UnitTests/           # Mocked handler tests
│   └── UseCases/{Feature}/
├── {Project}.FunctionalTests/     # FastEndpoint API tests
│   └── {Feature}/
└── {Project}.IntegrationTests/    # Repository/DB tests
    └── Data/
```

## Usage

**Explicit invocation:**
```
/generate-tests
```

**Proactive activation:**
Say "write tests for the CreateProduct handler" or "add test coverage for the products feature" and Claude will suggest this skill.

The skill is also automatically invoked by `quality-agent` when test coverage falls below 85%.

---

*This command delegates to the `generate-tests` skill for implementation. See the skill documentation for full test templates and patterns.*
