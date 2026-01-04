# applaud-core

Core project scaffolding, feature development, and quality assurance tools for .NET + React applications.

## Installation

```bash
/plugin install applaud-core@applaud-technologies-skills
```

## Requirements

- .NET SDK 8.0 or higher
- Node.js 20 or higher
- Git installed and configured

## Commands

### /new-project

Create a full-stack .NET + React project with interactive setup.

**What you get:**
- ASP.NET Core 8 Web API backend
- React 19 frontend with Vite
- Clean Architecture structure (Domain, Application, Infrastructure, Api)
- CQRS pattern with MediatR
- Repository pattern with expression-based filtering
- Entity Framework Core
- TanStack Query (React Query)
- Complete test setup (xUnit, Vitest)
- Docker configuration
- CLAUDE.md project documentation

**Interactive prompts:**
- Project name
- Database provider (SQL Server / PostgreSQL)
- Organization name
- Include authentication (Yes/No)

### /quick-project

Streamlined project scaffolding with fewer prompts and sensible defaults.

### /add-feature

Add a new CQRS feature with complete vertical slice.

**Explicit invocation:**
```
/add-feature
```

**Proactive activation:**
Simply say "add a Product feature" and Claude automatically uses this skill.

**What gets created:**
- Domain entity with factory methods
- Commands (Create, Update, Delete) with handlers and validators
- Queries (GetById, GetList) with handlers
- DTOs for requests and responses
- API controller with REST endpoints
- React components and TanStack Query hooks
- Comprehensive tests

### /generate-tests

Generate comprehensive unit and integration tests.

**Explicit invocation:**
```
/generate-tests
```

**Proactive activation:**
- Say "write tests for CreateProductHandler"
- Automatically invoked by quality-agent when coverage < 85%

**Test types:**
- Unit tests with mocked dependencies (NSubstitute)
- Integration tests with in-memory database
- React component tests (Vitest + Testing Library)
- React Query hook tests (MSW for API mocking)

### /quality-agent

Review code quality and assess test coverage.

**Explicit invocation:**
```
/quality-agent
```

**Proactive activation:**
- Automatically runs after significant code changes
- Say "review my code" or "check test coverage"

**What it does:**
1. Identifies changed/added files
2. Reviews code against quality checklists
3. Audits test coverage
4. **If coverage < 85%**: Automatically generates missing tests
5. Provides actionable quality report

## Proactive Skills

These skills activate automatically based on context:

| Skill | Triggers | Example |
|-------|----------|---------|
| `add-feature` | "add feature", "create CRUD", "implement {entity}" | "Add a Product feature" |
| `generate-tests` | "write tests", "test coverage", or quality-agent <85% | "Generate tests for ProductHandler" |
| `quality-agent` | After code changes, "review code", "check quality" | Runs automatically after features added |

## Architecture Patterns

### Clean Architecture

```
src/server/{Project}/
├── Domain/                 # Entities, domain events, value objects
├── Application/            # Commands, queries, DTOs, interfaces
├── Infrastructure/         # Persistence, external services
└── Api/                    # Controllers, startup configuration
```

### CQRS with MediatR

- **Commands**: Write operations (Create, Update, Delete)
- **Queries**: Read operations (GetById, GetList)
- **Handlers**: One handler per command/query
- **Validators**: FluentValidation for each command

### Repository Pattern

Expression-based filtering instead of Specification classes:

```csharp
var products = await _repository.ListAsync(
    filter: p => p.IsActive && p.Price > 100,
    orderBy: q => q.OrderBy(p => p.Name),
    skip: 0,
    take: 10,
    ct: cancellationToken);
```

### Adapter Pattern

Integrations use clean interface abstraction (see applaud-integrations plugin).

## Tech Stack

### Backend
- ASP.NET Core 8+ Web API
- Entity Framework Core 8+
- MediatR for CQRS
- FluentValidation
- xUnit 3.0, Shouldly, NSubstitute

### Frontend
- React 19 with Vite
- TanStack Query (React Query)
- React Router v7
- TypeScript
- Vitest, React Testing Library

## Usage Examples

### Create New Project

```bash
/new-project
```

Follow the prompts. Result:

```
MyProject/
├── src/
│   ├── server/
│   │   ├── MyProject.Domain/
│   │   ├── MyProject.Application/
│   │   ├── MyProject.Infrastructure/
│   │   └── MyProject.Api/
│   └── client/
│       └── src/
├── tests/
├── CLAUDE.md
└── MyProject.sln
```

### Add Feature Proactively

```
Add a Product feature with these properties:
- Name (string, required)
- Description (string, optional)
- Price (decimal, required)
- IsActive (bool, default true)

I need CRUD operations and real-time updates via SignalR.
```

Claude's `add-feature` skill activates and scaffolds everything.

### Generate Tests

```
Generate tests for the CreateProductCommandHandler
```

Claude creates:
```
tests/MyProject.Application.Tests/Features/Products/Commands/
└── CreateProductCommandHandlerTests.cs
    ├── Handle_ValidCommand_CreatesProduct()
    ├── Handle_DuplicateName_ThrowsConflictException()
    ├── Handle_InvalidName_ThrowsArgumentException()
```

### Quality Review

After adding a feature:

```
Review the Product feature I just added
```

Quality-agent:
1. Scans Product-related files
2. Reviews code quality
3. Checks test coverage
4. Auto-generates missing tests if needed
5. Reports results

## Automated Quality Workflow

When quality-agent detects coverage < 85%:

```
Coverage analysis: 68%

Missing tests for:
- CreateProductCommandHandler
- UpdateProductCommandHandler
- ProductForm.tsx

Automatically invoking generate-tests...
```

Tests are generated, coverage re-calculated, final report provided.

## Best Practices

### Entity Design

- Use factory methods (`Create`, `Update`) instead of public constructors
- Encapsulate business logic in entity methods
- Raise domain events for significant state changes
- Private parameterless constructor for EF Core

### Command/Query Handlers

- Single responsibility per handler
- Use IRepository<T>, not DbContext directly
- Include CancellationToken parameter
- Return DTOs, not entities
- Handle not-found and conflict cases

### React Components

- Functional components with hooks
- TypeScript for type safety
- Use TanStack Query hooks for data fetching
- Handle loading, error, and empty states
- No direct API calls in components

## Error Handling

All commands/skills provide interactive recovery:

When an error occurs:
1. Clear explanation
2. Context about what step failed
3. Options: Retry / Skip / Modify / Abort
4. User selects how to proceed

## Version

Current version: **1.0.0**

See [CHANGELOG.md](../../CHANGELOG.md) for version history.

## License

MIT - See [LICENSE](../../LICENSE)

---

[← Back to Marketplace](../../README.md)
