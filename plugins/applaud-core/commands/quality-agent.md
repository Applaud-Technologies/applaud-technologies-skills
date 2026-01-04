---
description: Review code quality and assess test coverage
---

# Quality Agent Command

This command performs comprehensive code review and coverage analysis:
- Identifies what was added or changed
- Reviews code quality against established patterns
- Audits test coverage gaps
- Automatically generates missing tests (if coverage < 85%)
- Provides actionable feedback report

## What Gets Reviewed

**Backend Code:**
- Entity design and encapsulation
- Command/Query handler patterns
- Controller structure
- Service implementations
- Repository usage

**Frontend Code:**
- React component patterns
- Hook implementations
- TypeScript typing
- State management
- Error handling

## Automated Quality Workflow

When test coverage is below 85%, quality-agent automatically:
1. Identifies specific files lacking tests
2. Invokes the `generate-tests` skill
3. Creates comprehensive tests
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

*This command delegates to the `quality-agent` skill for implementation. See the skill documentation for full quality checklists and test generation logic.*
