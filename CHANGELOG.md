# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-04

### Added

#### applaud-core v1.0.0

**Commands:**
- `/new-project` - Full-stack .NET + React project scaffolding with interactive prompts
- `/quick-project` - Streamlined project scaffolding variant
- `/add-feature` - CQRS feature scaffolding following Clean Architecture
- `/generate-tests` - Comprehensive test generation for .NET and React code
- `/quality-agent` - Code quality review and coverage analysis

**Proactive Skills:**
- `add-feature` - Auto-activates on phrases like "add a Product feature"
- `generate-tests` - Auto-activates when test coverage mentioned or invoked by quality-agent
- `quality-agent` - Auto-activates after significant code changes

**Templates:**
- CLAUDE.md.template - Project documentation template

**Features:**
- Clean Architecture project structure
- CQRS pattern with MediatR
- Repository pattern with expression-based filtering
- Entity Framework Core configuration
- React 19 + TanStack Query frontend
- xUnit + Shouldly + NSubstitute test setup
- Vitest + React Testing Library for frontend tests
- Automated quality workflow (quality-agent → generate-tests when coverage < 85%)

**Tech Stack:**
- .NET 8+
- React 19
- Entity Framework Core 8+
- xUnit 3.0
- React Router v7

#### applaud-integrations v1.0.0

**Command:**
- `/add-integration` - Interactive integration orchestrator with menu

**Proactive Skills:**
- `add-email-integration` - Email services (SendGrid, SMTP, AWS SES)
- `add-sms-integration` - SMS services (Twilio, AWS SNS)
- `add-storage-integration` - File storage (Azure Blob, AWS S3, MinIO, Local)
- `add-payment-integration` - Payment processing (Stripe, PayPal)
- `add-push-integration` - Push notifications (Firebase, OneSignal)
- `add-document-integration` - PDF generation (QuestPDF, DinkToPdf)
- `add-search-integration` - Search engines (Elasticsearch, Algolia)

**Integration Resources:**
- 7 detailed implementation guides for each integration type
- Adapter Pattern implementation templates
- Configuration via Options pattern
- DI registration patterns
- Testing strategies

**Dependencies:**
- Peer dependency on applaud-core ^1.0.0

#### Marketplace

- Monorepo structure with 2 independent plugins
- Cross-platform support (Windows, macOS, Linux)
- MIT License
- Comprehensive documentation

### Technical Details

**Plugin Architecture:**
- Hybrid invocation model (explicit commands + proactive skills)
- Resource access via `${CLAUDE_PLUGIN_ROOT}` variable
- Dual-purpose skills (command aliases + proactive activation)
- Automated quality workflow with test generation

**Error Handling:**
- Interactive recovery options (Retry/Skip/Modify/Abort)
- Prerequisite validation
- Clear error messages with remediation steps

**Testing:**
- Manual testing checklist
- Dog-fooding validation

### Known Limitations

- No automated integration tests (planned for v2.0)
- Manual coverage calculation (no automatic tooling integration)
- English-only documentation

## [Unreleased]

### Planned Features

- Configuration file for user preferences
- Additional integration adapters (analytics, logging, etc.)
- Background job scaffolding
- Monorepo/workspace support
- Automated integration tests

---

[1.0.0]: https://github.com/applaud-technologies/applaud-technologies-skills/releases/tag/v1.0.0
