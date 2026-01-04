---
description: Add a new feature following CQRS and Clean Architecture patterns
---

# Add Feature Command

This command scaffolds features with:
- Domain entities with proper encapsulation
- Application layer (Commands/Queries via MediatR)
- API controllers with RESTful endpoints
- Repository implementations
- FluentValidation rules
- React frontend components and hooks
- Comprehensive tests

## Architecture Patterns

- **CQRS**: Commands for writes, Queries for reads
- **Repository Pattern**: Abstract data access with expression-based filtering
- **MediatR**: Request/response pattern with handlers
- **Clean Architecture**: Proper separation of concerns across layers

## Usage

**Explicit invocation:**
```
/add-feature
```

**Proactive activation:**
Simply say "add a Product feature" or "create User management" and Claude will suggest this skill.

---

*This command delegates to the `add-feature` skill for implementation. See the skill documentation for full details on the scaffolding workflow.*
