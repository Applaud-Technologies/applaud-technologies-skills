---
description: Generate comprehensive unit and integration tests for .NET and React code
---

# Generate Tests Command

This command creates thorough tests covering:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling
- Integration points

## Testing Stack

**Backend (C#)**
- xUnit 3.0 test framework
- Shouldly for assertions
- NSubstitute for mocking
- Bogus for test data generation

**Frontend (TypeScript/React)**
- Vitest test framework
- @testing-library/react for DOM testing
- MSW (Mock Service Worker) for API mocking

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
