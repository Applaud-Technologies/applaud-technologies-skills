---
description: Add a new feature following CQRS and Ardalis Clean Architecture patterns
---

# Add Feature Command

This command scaffolds features for projects built with the Ardalis Clean Architecture template (`dotnet new clean-arch`).

## What It Generates

- **Core layer** - Domain entities with aggregate folder structure
- **UseCases layer** - Commands, queries, handlers, and DTOs (via MediatR)
- **Infrastructure layer** - EF Core configurations
- **Web layer** - FastEndpoints (not controllers)
- **Frontend** - React components and TanStack Query hooks
- **Tests** - Unit and functional tests

## Architecture Patterns

- **CQRS**: Commands for writes, Queries for reads
- **Repository Pattern**: Expression-based filtering for flexible data access
- **FastEndpoints**: Modern minimal API endpoints
- **MediatR**: Request/response pattern with handlers
- **Ardalis Clean Architecture**: Core, UseCases, Infrastructure, Web layers

## Layer Mapping

| Ardalis Template | Traditional Name |
|------------------|------------------|
| `{Project}.Core` | Domain layer |
| `{Project}.UseCases` | Application layer |
| `{Project}.Infrastructure` | Infrastructure layer |
| `{Project}.Web` | API layer |

## Usage

**Explicit invocation:**
```
/add-feature
```

**Proactive activation:**
Simply say "add a Product feature" or "create User management" and Claude will suggest this skill.

---

*This command delegates to the `add-feature` skill for implementation. See the skill documentation for full details on the scaffolding workflow.*
