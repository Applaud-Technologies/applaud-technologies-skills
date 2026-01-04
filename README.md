# Applaud Technologies Skills Marketplace

Professional .NET and React project scaffolding and development tools for Claude Code.

## Overview

This marketplace provides two complementary plugins for accelerating full-stack .NET + React development:

- **applaud-core**: Project scaffolding, feature development, and automated quality assurance
- **applaud-integrations**: Third-party service integration adapters (email, SMS, storage, payments, etc.)

Built on opinionated architecture patterns including Clean Architecture, CQRS, Repository Pattern, and the Adapter Pattern.

## Installation

### Add Marketplace

```bash
/plugin marketplace add applaud-technologies/applaud-technologies-skills
```

### Install Plugins

```bash
# Install core plugin (required)
/plugin install applaud-core@applaud-technologies-skills

# Install integrations plugin (optional, requires core)
/plugin install applaud-integrations@applaud-technologies-skills
```

## Plugins

### applaud-core

Core project scaffolding, feature development, and quality assurance tools.

**Commands:**
- `/new-project` - Create full-stack .NET + React project with interactive prompts
- `/quick-project` - Streamlined project scaffolding
- `/add-feature` - Add CQRS feature with entity, commands, queries, controller
- `/generate-tests` - Generate comprehensive unit and integration tests
- `/quality-agent` - Review code quality and assess test coverage

**Proactive Skills:**
- `add-feature` - Auto-activates when you say "add a Product feature"
- `generate-tests` - Auto-activates when you mention test coverage
- `quality-agent` - Auto-activates after significant code changes

**Requirements:**
- .NET SDK 8.0+
- Node.js 20+
- Git

[View detailed documentation →](./plugins/applaud-core/README.md)

### applaud-integrations

Third-party service integration adapters using the Adapter Pattern.

**Command:**
- `/add-integration` - Interactive menu for selecting and adding integrations

**Proactive Skills:**
- `add-email-integration` - SendGrid, SMTP, AWS SES
- `add-sms-integration` - Twilio, AWS SNS
- `add-storage-integration` - Azure Blob, AWS S3, MinIO, Local
- `add-payment-integration` - Stripe, PayPal
- `add-push-integration` - Firebase, OneSignal
- `add-document-integration` - QuestPDF, DinkToPdf
- `add-search-integration` - Elasticsearch, Algolia

**Peer Dependency:**
Requires `applaud-core@applaud-technologies-skills ^1.0.0`

[View detailed documentation →](./plugins/applaud-integrations/README.md)

## Quick Start

### Create a New Project

```bash
/new-project
```

Claude will guide you through:
1. Project name
2. Database provider (SQL Server / PostgreSQL)
3. Organization name
4. Authentication preferences

Result: Fully scaffolded .NET 8 backend + React 19 frontend with:
- Clean Architecture structure
- CQRS with MediatR
- Repository pattern
- Entity Framework Core
- TanStack Query (React Query)
- Complete test setup

### Add a Feature

Simply say:
```
Add a Product feature with name, description, and price properties
```

Claude's `add-feature` skill automatically activates and creates:
- Domain entity
- CQRS commands and queries
- API controller
- React components and hooks
- Comprehensive tests

### Add an Integration

```bash
/add-integration
```

Select from the menu or say directly:
```
Add email integration with SendGrid
```

Claude scaffolds the complete adapter pattern implementation.

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8+ Web API
- **ORM**: Entity Framework Core 8+
- **Database**: SQL Server or PostgreSQL
- **Patterns**: CQRS (MediatR), Repository, Clean Architecture
- **Validation**: FluentValidation
- **Testing**: xUnit 3.0, Shouldly, NSubstitute

### Frontend
- **Framework**: React 19 with Vite
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v7
- **HTTP**: Axios or Fetch
- **Testing**: Vitest, React Testing Library

## Architecture

Projects follow Clean Architecture with clear separation:

```
src/
├── server/
│   ├── {Project}.Domain/           # Entities, domain events
│   ├── {Project}.Application/      # Commands, queries, DTOs
│   ├── {Project}.Infrastructure/   # Persistence, services
│   └── {Project}.Api/              # Controllers, startup
└── client/
    └── src/
        ├── api/                     # React Query hooks
        ├── features/                # Feature components
        └── types/                   # TypeScript types
```

## Automated Quality Workflow

The `quality-agent` skill automatically:
1. Reviews code quality after changes
2. Checks test coverage
3. **If coverage < 85%**: Auto-invokes `generate-tests` skill
4. Creates missing tests
5. Reports final coverage

## Usage Examples

### Project Structure After Scaffolding

```
MyProject/
├── src/
│   ├── server/
│   │   ├── MyProject.Domain/
│   │   ├── MyProject.Application/
│   │   ├── MyProject.Infrastructure/
│   │   └── MyProject.Api/
│   └── client/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── tests/
│   ├── MyProject.Application.Tests/
│   └── MyProject.Infrastructure.Tests/
├── CLAUDE.md                        # Project documentation
└── MyProject.sln
```

### Feature Files After add-feature

For a "Product" feature:

```
Application/Features/Products/
├── DTOs/
│   ├── ProductDto.cs
│   ├── CreateProductDto.cs
│   └── UpdateProductDto.cs
├── Commands/
│   ├── CreateProduct/
│   │   ├── CreateProductCommand.cs
│   │   ├── CreateProductCommandHandler.cs
│   │   └── CreateProductCommandValidator.cs
│   └── UpdateProduct/...
├── Queries/
│   ├── GetProductById/...
│   └── GetProductsList/...
```

### Integration Structure After add-email-integration

```
Application/Common/Interfaces/
└── IEmailService.cs

Infrastructure/Services/Email/
├── SendGridEmailService.cs
├── EmailOptions.cs
└── DependencyInjection.cs

appsettings.json
{
  "Email": {
    "Provider": "SendGrid",
    "SendGrid": {
      "ApiKey": "..."
    }
  }
}
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development

```bash
# Clone the repository
git clone https://github.com/applaud-technologies/applaud-technologies-skills.git

# Validate plugin manifests
cd applaud-technologies-skills
claude plugin validate .
```

## Versioning

This marketplace follows [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to command interfaces or project structure
- **Minor**: New commands/features, new integration adapters
- **Patch**: Bug fixes, documentation updates

Plugins (applaud-core and applaud-integrations) are versioned independently.

## License

[MIT License](./LICENSE)

## Support

- **Issues**: [GitHub Issues](https://github.com/applaud-technologies/applaud-technologies-skills/issues)
- **Discussions**: [GitHub Discussions](https://github.com/applaud-technologies/applaud-technologies-skills/discussions)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

Built with ❤️ by Applaud Technologies
