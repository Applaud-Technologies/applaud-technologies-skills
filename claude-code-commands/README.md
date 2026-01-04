# Claude Code Project Scaffolding Commands

A collection of Claude Code commands for scaffolding full-stack .NET + React projects with best practices baked in.

## Installation

Copy the `commands/` folder (including `AdapterIntegrations/`) to your user-level Claude Code configuration:

```bash
# macOS/Linux
mkdir -p ~/.claude/commands/AdapterIntegrations
cp commands/*.md ~/.claude/commands/
cp commands/AdapterIntegrations/*.md ~/.claude/commands/AdapterIntegrations/

# Windows
mkdir %USERPROFILE%\.claude\commands\AdapterIntegrations 2>nul
copy commands\*.md %USERPROFILE%\.claude\commands\
copy commands\AdapterIntegrations\*.md %USERPROFILE%\.claude\commands\AdapterIntegrations\
```

Or, for project-level commands, copy to your project:

```bash
mkdir -p .claude/commands/AdapterIntegrations
cp commands/*.md .claude/commands/
cp commands/AdapterIntegrations/*.md .claude/commands/AdapterIntegrations/
```

## Folder Structure

```
commands/
├── new-project.md              # Full interactive scaffolding
├── quick-project.md            # Quick scaffolding with defaults
├── add-feature.md              # Add features to existing projects
├── add-integration.md          # Integration orchestrator
├── generate-tests.md           # Test generation
├── quality-agent.md            # Code quality & coverage agent
└── AdapterIntegrations/        # Detailed integration guides
    ├── EmailIntegration.md
    ├── SmsIntegration.md
    ├── StorageIntegration.md
    ├── PaymentIntegration.md
    ├── PushNotificationIntegration.md
    ├── DocumentIntegration.md
    └── SearchIntegration.md
```

## Available Commands

### `/user:new-project` (or `/project:new-project`)

Creates a complete full-stack project with:
- ASP.NET Core 8 Web API
- React 19 + Vite frontend
- Clean Architecture layers
- Repository pattern with Expression-based filtering
- MediatR for CQRS
- xUnit + Shouldly + NSubstitute tests
- Optional: SignalR, TickerQ, Docker, CI/CD

**Usage:**
```
/user:new-project
```

The command will ask you questions about:
1. Project name and description
2. Database choice (SQL Server/PostgreSQL)
3. Project type (Full-Stack/API Only/Monolith)
4. Additional features (SignalR, background jobs, auth, Docker, CI)
5. Third-party integrations (email, SMS, storage, payments)

### `/user:add-feature`

Adds a new vertical slice feature to an existing project:
- Domain entity
- Commands & Queries (MediatR)
- DTOs
- API Controller
- React components and hooks
- Tests

**Usage:**
```
/user:add-feature
```

### `/user:add-integration`

Adds third-party service integration using the Adapter pattern. Routes to detailed guides in `AdapterIntegrations/`:

| Integration | Guide | Providers |
|-------------|-------|-----------|
| Email | `EmailIntegration.md` | SendGrid, SMTP, AWS SES |
| SMS | `SmsIntegration.md` | Twilio, AWS SNS |
| Storage | `StorageIntegration.md` | Azure Blob, AWS S3, Local, MinIO |
| Payments | `PaymentIntegration.md` | Stripe |
| Push | `PushNotificationIntegration.md` | Firebase, OneSignal |
| Documents | `DocumentIntegration.md` | QuestPDF |
| Search | `SearchIntegration.md` | Elasticsearch, Algolia |

**Usage:**
```
/user:add-integration
```

### `/user:quality-agent`

A specialized agent that reviews code quality and test coverage for new or updated code. Run this after adding features or integrations.

**What it does:**
- Analyzes uncommitted changes, last commit, or specific features
- Reviews code against quality checklists (entities, handlers, controllers, React components)
- Audits test coverage and identifies missing tests
- Generates missing unit tests using project templates
- Produces a quality report with actionable items

**Usage:**
```
/user:quality-agent
```

**When to run:**
- After `/user:add-feature`
- After `/user:add-integration`
- Before committing new code
- During code review

### `/user:generate-tests`

Generates comprehensive tests for existing code:
- xUnit tests for handlers
- Validator tests
- Repository integration tests
- React component tests
- React Query hook tests

**Usage:**
```
/user:generate-tests
```

## Tech Stack Reference

### Backend
| Technology | Purpose |
|------------|---------|
| ASP.NET Core 8 | Web API framework |
| Entity Framework Core | ORM |
| MediatR | CQRS/Mediator pattern |
| FluentValidation | Request validation |
| TickerQ | Background job processing |
| SignalR | Real-time communication |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite | Build tool |
| TanStack Query | Data fetching/caching |
| React Router v7 | Routing |
| TypeScript | Type safety |

### Testing
| Technology | Purpose |
|------------|---------|
| xUnit 3.0 | Test framework |
| Shouldly | Fluent assertions |
| NSubstitute | Mocking |
| Vitest | Frontend tests |
| React Testing Library | Component tests |

## Project Structure Generated

```
{ProjectName}/
├── src/
│   ├── client/                         # React Frontend
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── server/                         # ASP.NET Core Backend
│       ├── {ProjectName}.Domain/       # Entities, interfaces
│       ├── {ProjectName}.Application/  # Use cases, CQRS
│       ├── {ProjectName}.Infrastructure/ # EF Core, external services
│       └── {ProjectName}.Api/          # Web API, controllers
│
├── tests/
│   ├── server/
│   │   ├── {ProjectName}.Domain.Tests/
│   │   ├── {ProjectName}.Application.Tests/
│   │   ├── {ProjectName}.Infrastructure.Tests/
│   │   └── {ProjectName}.Api.Tests/
│   └── client/                         # Vitest tests
│
├── docker/                             # Docker configs
├── .github/workflows/                  # CI/CD
├── {ProjectName}.sln
├── CLAUDE.md                           # Project context for Claude
└── README.md
```

## Architecture Patterns

### Repository Pattern
```csharp
public interface IRepository<T> where T : class, IEntity
{
    // Single entity retrieval
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        CancellationToken ct = default);
    
    // List retrieval with filtering, ordering, paging
    Task<IReadOnlyList<T>> ListAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        int? skip = null,
        int? take = null,
        CancellationToken ct = default);
    
    // Aggregates
    Task<int> CountAsync(Expression<Func<T, bool>>? filter = null, CancellationToken ct = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>>? filter = null, CancellationToken ct = default);
    
    // Mutations
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
}
```

### Expression-Based Filtering
Uses `Expression<Func<T, bool>>` lambdas for flexible, composable queries without the overhead of specification classes.

### MediatR CQRS
- **Commands**: Write operations (`CreateProductCommand`)
- **Queries**: Read operations (`GetProductsListQuery`)
- **Handlers**: Business logic (`CreateProductCommandHandler`)
- **Behaviors**: Cross-cutting concerns (validation, logging)

### Adapter Pattern
Abstract third-party services behind interfaces for testability and flexibility.

## Customization

### Modifying Templates

Edit the command files to customize:
- Default NuGet package versions
- npm package versions
- Code templates
- Project structure
- Patterns and conventions

### Adding New Integrations

1. Create a new file in `commands/AdapterIntegrations/` (e.g., `MyIntegration.md`)
2. Add the integration to the table in `add-integration.md`
3. Follow the existing pattern:
   - Interface definition
   - Implementation template
   - Options configuration
   - DI registration
   - appsettings template
   - NuGet packages

## Tips

1. **Run commands from the parent folder** where you want the project created
2. **Answer questions thoughtfully** - the commands use your answers to generate appropriate code
3. **Review generated code** - it's a starting point, not production-ready
4. **Use CLAUDE.md** - the generated CLAUDE.md helps Claude understand your project in future sessions

## Troubleshooting

### Command not found
- Ensure commands are in `~/.claude/commands/` or `.claude/commands/`
- Check file permissions

### Generated code has errors
- Review the tech stack versions in your environment
- Update package references as needed

### Feature doesn't match existing code
- Run `/user:add-feature` and let it analyze existing patterns first
- Provide examples of existing features when asked

## Contributing

To add new commands or improve existing ones:
1. Create/edit `.md` files in the `commands/` folder
2. Follow the existing pattern of:
   - Clear role definition
   - Requirements gathering questions
   - Code templates
   - Execution steps

## License

MIT - Use these commands however you like!
