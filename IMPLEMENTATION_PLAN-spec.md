# Applaud Technologies Skills Marketplace - Technical Specification

## Overview

This specification defines the complete architecture and implementation details for converting the existing Claude Code commands (from `claude-code-commands.zip`) into a professional Claude Code marketplace named **applaud-technologies-skills**.

**Repository:** `applaud-technologies/applaud-technologies-skills`
**Visibility:** Public
**Initial Version:** 1.0.0
**License:** MIT

## Background

The existing command set provides sophisticated .NET + React development workflows including project scaffolding, feature development, integration management, and code quality assurance. These commands follow opinionated architecture patterns (Clean Architecture, CQRS, Repository Pattern, Adapter Pattern) and use a modern tech stack (.NET 8+, React 19, EF Core, MediatR, TanStack Query).

Converting to a marketplace format will:
- Enable easy installation and updates via Claude Code plugin system
- Provide both explicit command invocation and proactive skill activation
- Support modular installation (core vs integrations)
- Ensure version control and dependency management
- Allow community contribution and extension

## Requirements

### Functional Requirements

#### Plugin Structure
- [ ] Two independently versioned plugins within a single marketplace
- [ ] applaud-core: Core scaffolding, feature development, and quality tools
- [ ] applaud-integrations: Third-party service integration adapters (peer depends on core)
- [ ] Monorepo structure with marketplace.json at root
- [ ] Cross-platform compatibility (Windows, macOS, Linux)

#### Hybrid Invocation Model
- [ ] **Explicit Commands** (user types `/command-name`):
  - `/new-project` - Full project scaffolding with interactive prompts
  - `/quick-project` - Streamlined project scaffolding
  - `/add-integration` - Integration orchestrator with provider selection
- [ ] **Proactive Skills** (Claude auto-activates based on context):
  - `add-feature` - Triggered by "add feature", "create CRUD", "implement {entity}"
  - `generate-tests` - Triggered by "write tests", "add test coverage", or by quality-agent
  - `quality-agent` - Triggered after significant code changes or by user request
- [ ] **Dual-Purpose** - Proactive skills also invokable as explicit commands

#### Integration Adapter Skills
- [ ] 7 individual integration skills (hybrid approach):
  - `add-email-integration` - Email services (SendGrid, SMTP, AWS SES)
  - `add-sms-integration` - SMS services (Twilio, AWS SNS)
  - `add-storage-integration` - File storage (Azure Blob, AWS S3, MinIO, Local)
  - `add-payment-integration` - Payment processing (Stripe, PayPal)
  - `add-push-integration` - Push notifications (Firebase, OneSignal)
  - `add-document-integration` - Document generation (QuestPDF, DinkToPdf)
  - `add-search-integration` - Search engines (Elasticsearch, Algolia)
- [ ] Each skill guides provider selection internally
- [ ] `/add-integration` orchestrator command provides guided menu
- [ ] Skills proactively trigger when user mentions integration type

#### Automated Quality Workflow
- [ ] `quality-agent` automatically runs after significant code changes
- [ ] Quality agent checks test coverage
- [ ] If coverage < 85%, quality-agent automatically invokes `generate-tests` skill
- [ ] Workflow chain: Code written → quality-agent (auto) → [if coverage < 85%] → generate-tests (auto)
- [ ] Implementation: Skill descriptions + quality-agent internal logic

#### Resource Management
- [ ] Templates accessed via direct file reads with `${CLAUDE_PLUGIN_ROOT}`
- [ ] CLAUDE.md.template in applaud-core for project documentation
- [ ] 7 integration adapter guides as standalone .md files in applaud-integrations
- [ ] Skills instruct Claude to read appropriate resource files dynamically

### Non-Functional Requirements

#### Version Management
- [ ] Independent versioning for applaud-core and applaud-integrations
- [ ] Semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Peer dependency: applaud-integrations requires applaud-core ^1.0.0
- [ ] Breaking changes in project structure trigger major version bumps for both plugins

#### Technology Constraints
- [ ] Minimum versions specified in plugin metadata:
  - .NET SDK 8.0+
  - Node.js 20+
  - React 19
  - Entity Framework Core 8+
  - xUnit 3.0
  - React Router v7
- [ ] All generated code targets these versions
- [ ] Fail gracefully with clear messages if prerequisites missing

#### Error Handling
- [ ] Interactive recovery for all commands (Option C from interview)
- [ ] On error, present options: Retry / Skip / Abort
- [ ] Prerequisite validation before scaffolding
- [ ] Clear error messages with remediation steps
- [ ] Graceful degradation where possible

#### Platform Compatibility
- [ ] Cross-platform from day 1 (Windows, macOS, Linux)
- [ ] All paths use forward slashes (works on all platforms)
- [ ] Shell commands use cross-platform syntax
- [ ] .gitattributes in generated projects ensures consistent line endings
- [ ] Docker/WSL compatibility

#### Customization
- [ ] Interactive prompts with sensible defaults
- [ ] Always prompt for:
  - Project name
  - Database provider (SQL Server / PostgreSQL)
  - Organization name (default: "MyCompany")
  - Include authentication (Y/n)
- [ ] Defaults for:
  - License: MIT
  - Logging: Serilog
  - Namespace pattern: `{Organization}.{ProjectName}.*`

## Technical Design

### Architecture

#### Repository Structure

```
applaud-technologies-skills/                    # GitHub repo root
├── .claude-plugin/
│   └── marketplace.json                        # Marketplace manifest
├── plugins/
│   ├── applaud-core/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json                     # Core plugin manifest
│   │   ├── commands/
│   │   │   ├── new-project.md                  # Explicit command
│   │   │   ├── quick-project.md                # Explicit command
│   │   │   └── README.md                       # Core commands documentation
│   │   ├── skills/
│   │   │   ├── add-feature/
│   │   │   │   └── SKILL.md                    # Proactive skill
│   │   │   ├── generate-tests/
│   │   │   │   └── SKILL.md                    # Proactive skill
│   │   │   └── quality-agent/
│   │   │       └── SKILL.md                    # Proactive skill
│   │   ├── templates/
│   │   │   └── CLAUDE.md.template              # Project documentation template
│   │   └── README.md                           # Core plugin documentation
│   └── applaud-integrations/
│       ├── .claude-plugin/
│       │   └── plugin.json                     # Integrations plugin manifest
│       ├── commands/
│       │   ├── add-integration.md              # Orchestrator command
│       │   └── README.md                       # Integration commands documentation
│       ├── skills/
│       │   ├── add-email-integration/
│       │   │   └── SKILL.md
│       │   ├── add-sms-integration/
│       │   │   └── SKILL.md
│       │   ├── add-storage-integration/
│       │   │   └── SKILL.md
│       │   ├── add-payment-integration/
│       │   │   └── SKILL.md
│       │   ├── add-push-integration/
│       │   │   └── SKILL.md
│       │   ├── add-document-integration/
│       │   │   └── SKILL.md
│       │   └── add-search-integration/
│       │       └── SKILL.md
│       ├── resources/
│       │   └── adapters/
│       │       ├── EmailIntegration.md         # Detailed implementation guide
│       │       ├── SmsIntegration.md
│       │       ├── StorageIntegration.md
│       │       ├── PaymentIntegration.md
│       │       ├── PushNotificationIntegration.md
│       │       ├── DocumentIntegration.md
│       │       └── SearchIntegration.md
│       └── README.md                           # Integrations plugin documentation
├── .gitignore
├── README.md                                   # Marketplace documentation
├── LICENSE                                     # MIT License
└── CHANGELOG.md                                # Version history
```

### Data Model

#### Marketplace Manifest (.claude-plugin/marketplace.json)

```json
{
  "name": "applaud-technologies-skills",
  "owner": {
    "name": "Applaud Technologies",
    "email": "skills@applaud-technologies.com"
  },
  "metadata": {
    "description": "Professional .NET and React project scaffolding and development tools",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "applaud-core",
      "source": "./plugins/applaud-core",
      "description": "Core project scaffolding, feature development, and quality assurance tools",
      "version": "1.0.0",
      "author": {
        "name": "Applaud Technologies",
        "url": "https://github.com/applaud-technologies"
      },
      "homepage": "https://github.com/applaud-technologies/applaud-technologies-skills",
      "repository": "https://github.com/applaud-technologies/applaud-technologies-skills",
      "license": "MIT",
      "keywords": [".NET", "React", "scaffolding", "CQRS", "Clean Architecture", "fullstack"],
      "category": "productivity",
      "tags": ["development", "project-setup", "dotnet", "react"]
    },
    {
      "name": "applaud-integrations",
      "source": "./plugins/applaud-integrations",
      "description": "Third-party service integration adapters (email, SMS, storage, payments, etc.)",
      "version": "1.0.0",
      "author": {
        "name": "Applaud Technologies",
        "url": "https://github.com/applaud-technologies"
      },
      "homepage": "https://github.com/applaud-technologies/applaud-technologies-skills",
      "repository": "https://github.com/applaud-technologies/applaud-technologies-skills",
      "license": "MIT",
      "keywords": ["integration", "adapter", "email", "sms", "storage", "payment", "third-party"],
      "category": "integration",
      "tags": ["services", "adapters", "integrations"]
    }
  ]
}
```

#### Plugin Manifest - applaud-core (plugins/applaud-core/.claude-plugin/plugin.json)

```json
{
  "name": "applaud-core",
  "version": "1.0.0",
  "description": "Core project scaffolding, feature development, and quality assurance tools for .NET + React applications",
  "author": {
    "name": "Applaud Technologies",
    "url": "https://github.com/applaud-technologies"
  },
  "homepage": "https://github.com/applaud-technologies/applaud-technologies-skills",
  "repository": "https://github.com/applaud-technologies/applaud-technologies-skills",
  "license": "MIT",
  "keywords": [".NET", "React", "scaffolding", "CQRS", "Clean Architecture", "TDD", "quality"],
  "commands": "./commands/",
  "skills": "./skills/"
}
```

**Requirements:**
- Minimum .NET SDK 8.0
- Minimum Node.js 20
- Git installed and configured

#### Plugin Manifest - applaud-integrations (plugins/applaud-integrations/.claude-plugin/plugin.json)

```json
{
  "name": "applaud-integrations",
  "version": "1.0.0",
  "description": "Third-party service integration adapters for email, SMS, storage, payments, push notifications, documents, and search",
  "author": {
    "name": "Applaud Technologies",
    "url": "https://github.com/applaud-technologies"
  },
  "homepage": "https://github.com/applaud-technologies/applaud-technologies-skills",
  "repository": "https://github.com/applaud-technologies/applaud-technologies-skills",
  "license": "MIT",
  "keywords": ["integration", "adapter", "email", "sms", "storage", "payment", "sendgrid", "stripe", "s3"],
  "peerDependencies": {
    "applaud-core@applaud-technologies-skills": "^1.0.0"
  },
  "commands": "./commands/",
  "skills": "./skills/"
}
```

### API/Interface Design

#### Skill Activation Triggers

**add-feature Skill (SKILL.md frontmatter)**

```yaml
---
name: add-feature
description: Scaffolds new features following CQRS and Clean Architecture patterns. Use when user wants to add a feature, create CRUD operations, implement entity management, or says phrases like "add a Product feature", "create User management", "implement CRUD for Orders", "add {entity} management", or "scaffold a new feature"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-5-20250929
---
```

**generate-tests Skill**

```yaml
---
name: generate-tests
description: Generates comprehensive unit and integration tests for .NET applications using xUnit, Shouldly, and NSubstitute. Use when user requests test generation, mentions test coverage, says "write tests for...", "generate tests for...", "add unit tests", "create integration tests", or when quality-agent detects coverage below 85%
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-5-20250929
---
```

**quality-agent Skill**

```yaml
---
name: quality-agent
description: Performs code quality review and test coverage analysis. Proactively activate after Claude writes significant code changes (new features, refactoring, integration additions). Also activates when user says "review code", "check quality", "audit coverage", "what tests are missing". If test coverage is below 85%, automatically invoke generate-tests skill
allowed-tools: Read, Grep, Glob, Bash, LSP
model: claude-sonnet-4-5-20250929
---
```

**add-email-integration Skill (example integration skill)**

```yaml
---
name: add-email-integration
description: Adds email service integration using the Adapter Pattern (SendGrid, SMTP, AWS SES). Use when user mentions adding email functionality, email sending, email integration, SendGrid, SMTP, or AWS SES
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---
```

#### Quality Agent Workflow Logic

Within `quality-agent` SKILL.md:

```markdown
## Phase 3: Test Coverage Analysis

### Coverage Thresholds

- **Acceptable**: 85%+ total coverage
- **Warning**: 70-84% coverage
- **Critical**: <70% coverage

### Automated Test Generation Trigger

After coverage analysis:

1. Calculate total test coverage percentage
2. If coverage < 85%:
   - Report coverage gaps with specific files/classes lacking tests
   - **Automatically invoke the `generate-tests` skill** to fill gaps
   - Provide list of uncovered components to generate-tests
   - Wait for test generation to complete
   - Re-run coverage analysis
   - Report final coverage metrics

3. If coverage >= 85%:
   - Report coverage success
   - Provide summary of test quality
   - Suggest any edge cases that might need additional tests
```

#### Resource Access Patterns

**Template Access (in new-project.md and quick-project.md)**

```markdown
## Step 5: Generate Project Documentation

Read the project documentation template:

```bash
Read the file at: ${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.template
```

Then populate it with project-specific values and write to the project root.
```

**Adapter Guide Access (in add-email-integration SKILL.md)**

```markdown
## Implementation

Read the detailed Email integration guide:

```bash
Read: ${CLAUDE_PLUGIN_ROOT}/../applaud-integrations/resources/adapters/EmailIntegration.md
```

**Note:** This cross-plugin reference works because both plugins are in the same marketplace monorepo.

Follow the guide to:
1. Create IEmailService interface in Application layer
2. Generate provider implementations (SendGrid, SMTP, AWS SES)
3. Add DI registration
4. Configure appsettings
```

### Key Implementation Details

#### Command to Skill Dual Invocation

To support both `/add-feature` (explicit command) AND proactive skill activation:

1. **Skill Definition**: Create `skills/add-feature/SKILL.md` with trigger keywords in description
2. **Command Alias**: Create `commands/add-feature.md` that simply includes the skill content:

```markdown
---
description: Add a new feature following CQRS and Clean Architecture patterns
---

This command scaffolds features with:
- Domain entities
- Application layer (Commands/Queries via MediatR)
- API controllers
- Repository implementations
- Validation
- Tests

See the `add-feature` skill for full implementation details.

**Usage:**
- Type `/add-feature` explicitly
- Or simply say "add a Product feature" and Claude will suggest this skill

---

*This command delegates to the `add-feature` skill for implementation.*
```

This approach:
- Keeps implementation in SKILL.md (single source of truth)
- Allows explicit `/add-feature` invocation
- Enables proactive skill activation
- Provides command help/documentation

#### Integration Orchestrator Pattern

`add-integration.md` serves as a menu-driven orchestrator:

```markdown
# Add Integration Command

## Workflow

### Step 1: Present Integration Menu

Ask the user: "Which integration do you want to add?

1. **Email** - Email sending (SendGrid, SMTP, AWS SES)
2. **SMS** - Text messaging (Twilio, AWS SNS)
3. **Storage** - File/blob storage (Azure Blob, AWS S3, MinIO, Local)
4. **Payment** - Payment processing (Stripe, PayPal)
5. **Push** - Push notifications (Firebase, OneSignal)
6. **Document** - PDF generation (QuestPDF, DinkToPdf)
7. **Search** - Full-text search (Elasticsearch, Algolia)

Enter the name or number."

### Step 2: Delegate to Skill

Based on user selection, invoke the appropriate integration skill:

- Email → Invoke `add-email-integration` skill
- SMS → Invoke `add-sms-integration` skill
- Storage → Invoke `add-storage-integration` skill
- Payment → Invoke `add-payment-integration` skill
- Push → Invoke `add-push-integration` skill
- Document → Invoke `add-document-integration` skill
- Search → Invoke `add-search-integration` skill

### Step 3: Post-Integration Quality Check

After integration is added, suggest:
"Integration added successfully. Would you like me to run quality-agent to review the code?"
```

This pattern:
- Provides guided discovery (users learn what's available)
- Delegates to specialized skills for implementation
- Allows direct skill invocation (skip menu)
- Maintains single responsibility (orchestration vs implementation)

#### Error Handling Pattern

All commands/skills implement interactive recovery:

```markdown
## Error Recovery

If any step fails:

1. **Explain the Error**
   - Clear description of what went wrong
   - Relevant error output (if any)

2. **Provide Context**
   - What step was being attempted
   - Why it matters for the overall workflow

3. **Offer Options**
   Ask the user: "How would you like to proceed?

   1. **Retry** - Attempt the same step again
   2. **Skip** - Continue without this step (explain consequences)
   3. **Modify** - Adjust parameters and retry
   4. **Abort** - Stop the process and clean up"

4. **Execute Choice**
   - Retry: Run the same command again
   - Skip: Continue to next step, note skipped component
   - Modify: Prompt for new values, retry with updates
   - Abort: Clean up partial changes, exit gracefully

## Common Errors

### Prerequisites Missing

**Error:** `.NET SDK not found`

**Options:**
1. Install .NET SDK 8.0+ from https://dot.net
2. Abort scaffolding (can retry after installation)

### Directory Conflicts

**Error:** `Directory {ProjectName} already exists`

**Options:**
1. Choose different project name
2. Delete existing directory (confirm first)
3. Abort

### Network Failures

**Error:** `Failed to restore NuGet packages`

**Options:**
1. Retry (might be temporary network issue)
2. Continue with warning (packages can be restored manually later)
3. Abort
```

## Edge Cases & Error Handling

### Cross-Plugin References

**Edge Case:** User installs `applaud-integrations` but not `applaud-core`

**Handling:**
- Peer dependency warning shown during installation
- `add-integration` command checks for required project structure
- If structure missing, suggest: "This integration requires a project created with applaud-core. Run `/new-project` first or install applaud-core plugin."

### Version Mismatches

**Edge Case:** User has applaud-core v1.0.0 but applaud-integrations v2.0.0 (peer dep `^2.0.0`)

**Handling:**
- Peer dependency check fails
- Claude Code shows warning: "applaud-integrations v2.0.0 requires applaud-core ^2.0.0 (you have v1.0.0)"
- Suggest upgrade path

### Template File Missing

**Edge Case:** CLAUDE.md.template deleted or corrupted

**Handling:**
- `new-project` checks if template exists: `Test-Path ${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.template`
- If missing, offer to: 1) Continue without template, 2) Create minimal template inline, 3) Abort
- Log issue for user to report

### Platform-Specific Issues

**Edge Case:** Windows path separators in generated code

**Prevention:**
- All generated paths use forward slashes: `src/server/Api`
- Node.js and .NET accept forward slashes on all platforms
- .gitattributes normalizes line endings

### Concurrent Skill Activation

**Edge Case:** User adds a feature, quality-agent triggers, then manually runs `/add-feature` again

**Handling:**
- Skills check for ongoing operations
- If conflict detected, ask: "I'm currently running quality-agent. Would you like to: 1) Wait for completion, 2) Cancel current and start new operation?"

### Insufficient Permissions

**Edge Case:** User lacks write permissions in target directory

**Handling:**
- Detect permission error during file write
- Explain: "Permission denied writing to {path}"
- Options: 1) Choose different directory, 2) Fix permissions (show commands), 3) Abort

### Partial Scaffolding Failures

**Edge Case:** Project scaffolded but npm install fails

**Handling:**
- Mark successful steps: ✅ .NET solution created, ✅ React app scaffolded
- Mark failed step: ❌ npm install failed
- Offer: "I can continue without node_modules (you can run `npm install` manually), or abort and clean up partial project"
- If user chooses to continue, create README.md with manual setup steps

### Test Coverage False Positives

**Edge Case:** quality-agent reports low coverage but tests are actually sufficient

**Handling:**
- Provide coverage report details (which files lack tests)
- Ask: "I detected 72% coverage. Would you like me to: 1) Generate missing tests, 2) Review coverage report together, 3) Skip (coverage is acceptable)"
- Allow override of 85% threshold

## Testing Strategy

### Manual Testing Checklist

Before each release (v1.0.0, v1.1.0, etc.), execute this checklist:

#### Scaffolding Tests

**Test: /new-project**
- [ ] Run `/new-project TestApp` with defaults
- [ ] Verify directory structure created
- [ ] Run `dotnet restore` - should succeed
- [ ] Run `dotnet build` - should compile without errors
- [ ] Run `cd src/client && npm install` - should install dependencies
- [ ] Run `npm run dev` - React app should start
- [ ] Open browser, verify app loads
- [ ] Verify CLAUDE.md created in project root
- [ ] Check .gitignore includes standard excludes

**Test: /quick-project**
- [ ] Run `/quick-project QuickApp`
- [ ] Verify streamlined prompts (fewer questions than new-project)
- [ ] Same verification as new-project

#### Skill Activation Tests

**Test: add-feature Proactive Activation**
- [ ] In a scaffolded project, say "add a Product feature"
- [ ] Verify `add-feature` skill activates (check Claude's response)
- [ ] Verify feature scaffolded with:
  - [ ] Entity in Domain layer
  - [ ] Commands/Queries in Application layer
  - [ ] Controller in API layer
  - [ ] Repository registration
  - [ ] Tests generated

**Test: add-feature Explicit Command**
- [ ] Run `/add-feature`
- [ ] Verify same behavior as proactive activation

**Test: quality-agent Auto-Trigger**
- [ ] Add a new feature manually (write code without tests)
- [ ] Verify quality-agent activates after significant changes
- [ ] Check coverage report generated
- [ ] If coverage < 85%, verify generate-tests auto-invokes

**Test: generate-tests**
- [ ] Create application code without tests
- [ ] Run `/generate-tests` or trigger via quality-agent
- [ ] Verify tests generated for:
  - [ ] Command handlers
  - [ ] Query handlers
  - [ ] Validators
  - [ ] Controllers
- [ ] Run `dotnet test` - tests should pass

#### Integration Tests

**Test: add-email-integration**
- [ ] In a project, say "add email integration"
- [ ] Verify skill activates
- [ ] Select SendGrid as provider
- [ ] Verify generated:
  - [ ] IEmailService interface in Application/Common/Interfaces
  - [ ] SendGridEmailService in Infrastructure/Services/Email
  - [ ] DI registration in Infrastructure/DependencyInjection.cs
  - [ ] Configuration in appsettings.json
  - [ ] Tests in tests/

**Test: /add-integration Orchestrator**
- [ ] Run `/add-integration`
- [ ] Verify menu presented with all 7 integration types
- [ ] Select "3" (Storage)
- [ ] Verify `add-storage-integration` skill invoked
- [ ] Verify storage integration scaffolded

#### Cross-Plugin Tests

**Test: Peer Dependency Warning**
- [ ] Uninstall applaud-core (if installed)
- [ ] Install applaud-integrations only
- [ ] Verify warning shown about missing peer dependency

**Test: Resource Access**
- [ ] Run `/new-project` and verify CLAUDE.md.template accessed
- [ ] Run `/add-integration` → Email and verify EmailIntegration.md guide read
- [ ] Check no path resolution errors

#### Error Handling Tests

**Test: Missing Prerequisites**
- [ ] Temporarily rename `dotnet` executable
- [ ] Run `/new-project`
- [ ] Verify clear error: ".NET SDK not found"
- [ ] Verify recovery options presented

**Test: Directory Conflict**
- [ ] Create directory `ConflictTest/`
- [ ] Run `/new-project ConflictTest`
- [ ] Verify error about existing directory
- [ ] Verify options: rename, delete, abort

**Test: Network Failure**
- [ ] Disable network
- [ ] Run `/new-project`
- [ ] When NuGet restore fails, verify interactive recovery

#### Platform Tests

- [ ] Run full checklist on Windows
- [ ] Run full checklist on macOS (if available)
- [ ] Run full checklist on Linux (WSL or VM)
- [ ] Verify generated paths use forward slashes
- [ ] Verify line endings consistent (LF)

### Dog-Fooding

- [ ] Use marketplace to create real internal projects
- [ ] Track issues encountered during normal usage
- [ ] Gather feedback from team members
- [ ] Document common pain points for v1.1 improvements

### Issue Tracking

Create GitHub Issues for:
- Bugs found during testing
- Feature requests from dog-fooding
- Documentation gaps
- Performance concerns

Label appropriately:
- `bug` - Something broken
- `enhancement` - Improvement to existing feature
- `documentation` - Docs need update
- `good first issue` - Easy for contributors

## Open Questions

None - all questions resolved during interview phase.

## Out of Scope

### Explicitly Excluded from v1.0.0

1. **Automated Integration Tests**
   - Reasoning: Overhead not justified for initial release
   - Future: Consider for v2.0 if widely adopted

2. **Example Projects Repository**
   - Reasoning: Documentation snippets sufficient
   - Future: Could add if community requests

3. **Backward Compatibility with ZIP Commands**
   - Reasoning: Clean break simplifies architecture
   - Migration: Document in README how to transition from ZIP to marketplace

4. **Hooks for Auto-Triggering**
   - Reasoning: Rely on skill descriptions and Claude's judgment for v1.0
   - Future: If hook-based triggers become supported, could enhance automation

5. **Configuration File (applaud-settings.json)**
   - Reasoning: Interactive prompts with defaults sufficient for v1.0
   - Future: v1.1 could add persistent settings

6. **GUI/TUI for Command Selection**
   - Reasoning: Text-based menus work well in CLI
   - Out of scope: Not needed for Claude Code environment

7. **Multi-Framework Support**
   - Reasoning: Focused on .NET + React for v1.0
   - Future: Could add .NET + Vue, .NET + Angular as separate plugins

8. **Cloud Deployment Integration**
   - Reasoning: Scaffolding focused on local development
   - Future: Could add Azure/AWS deployment skills in v2.0

9. **Database Migrations Management**
   - Reasoning: EF Core migrations are sufficient
   - Out of scope: Advanced migration tooling (FluentMigrator, DbUp)

10. **Monorepo/Multi-Project Scaffolding**
    - Reasoning: Single project focus for v1.0
    - Future: Could add workspace/monorepo support

## Implementation Checklist

### Phase 1: Repository Setup
- [ ] Create GitHub repository: `applaud-technologies/applaud-technologies-skills`
- [ ] Initialize with README.md (stub)
- [ ] Add MIT LICENSE file
- [ ] Create .gitignore (exclude .DS_Store, node_modules, bin, obj, etc.)
- [ ] Create directory structure as defined in Architecture section

### Phase 2: Marketplace Configuration
- [ ] Create `.claude-plugin/marketplace.json` with plugin definitions
- [ ] Create `plugins/applaud-core/.claude-plugin/plugin.json`
- [ ] Create `plugins/applaud-integrations/.claude-plugin/plugin.json`
- [ ] Validate JSON files (no syntax errors)

### Phase 3: Core Plugin Implementation
- [ ] Move `new-project.md` → `plugins/applaud-core/commands/`
- [ ] Move `quick-project.md` → `plugins/applaud-core/commands/`
- [ ] Move `CLAUDE.md.template` → `plugins/applaud-core/templates/`
- [ ] Update template path references to use `${CLAUDE_PLUGIN_ROOT}`
- [ ] Convert `add-feature.md` to skill: `plugins/applaud-core/skills/add-feature/SKILL.md`
- [ ] Add frontmatter with trigger keywords
- [ ] Create command alias: `plugins/applaud-core/commands/add-feature.md`
- [ ] Convert `generate-tests.md` to skill: `plugins/applaud-core/skills/generate-tests/SKILL.md`
- [ ] Add frontmatter with trigger keywords
- [ ] Create command alias: `plugins/applaud-core/commands/generate-tests.md`
- [ ] Convert `quality-agent.md` to skill: `plugins/applaud-core/skills/quality-agent/SKILL.md`
- [ ] Add frontmatter with proactive trigger logic
- [ ] Add coverage check → generate-tests invocation logic
- [ ] Create command alias: `plugins/applaud-core/commands/quality-agent.md`

### Phase 4: Integrations Plugin Implementation
- [ ] Move `add-integration.md` → `plugins/applaud-integrations/commands/`
- [ ] Update to orchestrator pattern (menu → skill delegation)
- [ ] Create `plugins/applaud-integrations/resources/adapters/` directory
- [ ] Move 7 integration .md files → `resources/adapters/`:
  - [ ] EmailIntegration.md
  - [ ] SmsIntegration.md
  - [ ] StorageIntegration.md
  - [ ] PaymentIntegration.md
  - [ ] PushNotificationIntegration.md
  - [ ] DocumentIntegration.md
  - [ ] SearchIntegration.md
- [ ] Create 7 integration skills in `plugins/applaud-integrations/skills/`:
  - [ ] add-email-integration/SKILL.md (reads EmailIntegration.md)
  - [ ] add-sms-integration/SKILL.md
  - [ ] add-storage-integration/SKILL.md
  - [ ] add-payment-integration/SKILL.md
  - [ ] add-push-integration/SKILL.md
  - [ ] add-document-integration/SKILL.md
  - [ ] add-search-integration/SKILL.md
- [ ] Add frontmatter with trigger keywords to each skill
- [ ] Update resource paths to use `${CLAUDE_PLUGIN_ROOT}/resources/adapters/`

### Phase 5: Documentation
- [ ] Write main `README.md`:
  - [ ] Overview and purpose
  - [ ] Installation instructions
  - [ ] Plugin descriptions (core vs integrations)
  - [ ] Command/skill reference table
  - [ ] Tech stack and requirements
  - [ ] Usage examples (structure snippets, not full code)
  - [ ] Contributing guidelines
  - [ ] License reference
- [ ] Write `plugins/applaud-core/README.md`:
  - [ ] Core plugin features
  - [ ] Commands and skills list
  - [ ] Requirements (.NET 8+, Node 20+)
  - [ ] Usage examples
- [ ] Write `plugins/applaud-integrations/README.md`:
  - [ ] Available integrations table
  - [ ] Provider matrix (what's supported per integration)
  - [ ] Peer dependency note (requires applaud-core)
  - [ ] Usage examples
- [ ] Create `CHANGELOG.md`:
  - [ ] v1.0.0 initial release notes

### Phase 6: Validation
- [ ] Validate all JSON files syntax
- [ ] Test all relative paths resolve correctly
- [ ] Verify `${CLAUDE_PLUGIN_ROOT}` used in all resource references
- [ ] Check commands can access templates and guides
- [ ] Confirm skill frontmatter follows Claude Code spec
- [ ] Run manual testing checklist (Phase 1: Scaffolding Tests)
- [ ] Fix any issues found

### Phase 7: Release Preparation
- [ ] Tag v1.0.0 in git
- [ ] Push to GitHub
- [ ] Create GitHub Release with changelog
- [ ] Test installation:
  ```bash
  /plugin marketplace add applaud-technologies/applaud-technologies-skills
  /plugin install applaud-core@applaud-technologies-skills
  /plugin install applaud-integrations@applaud-technologies-skills
  ```
- [ ] Verify plugins load correctly
- [ ] Run full manual testing checklist
- [ ] Fix critical issues, tag v1.0.1 if needed

### Phase 8: Dog-Fooding & Iteration
- [ ] Use marketplace to create real project
- [ ] Gather team feedback
- [ ] Track issues in GitHub
- [ ] Plan v1.1.0 improvements based on usage

## Version Strategy

### v1.0.0 (Initial Release)
- applaud-core: 1.0.0
- applaud-integrations: 1.0.0
- All core functionality implemented
- Manual testing complete
- Documentation published

### Future Versions (Examples)

**v1.1.0 - Minor Update**
- Add new integration adapter (e.g., add-analytics-integration)
- Update: applaud-integrations to 1.1.0
- Keep: applaud-core at 1.0.0
- Peer dependency remains: `^1.0.0`

**v1.2.0 - Core Enhancement**
- Add new feature type scaffolding (e.g., background jobs)
- Update: applaud-core to 1.2.0
- Keep: applaud-integrations at 1.1.0
- Peer dependency remains: `^1.0.0`

**v2.0.0 - Breaking Change**
- Change project structure (e.g., switch to vertical slice architecture)
- Update: applaud-core to 2.0.0
- Update: applaud-integrations to 2.0.0 (adapters need new structure)
- Peer dependency becomes: `^2.0.0`
- CHANGELOG documents migration path from v1.x

## Success Criteria

### v1.0.0 is successful when:

1. **Functional**
   - [ ] All commands/skills work on Windows, macOS, Linux
   - [ ] Generated projects compile and run
   - [ ] Tests generate and pass
   - [ ] Integrations scaffold correctly

2. **Usable**
   - [ ] Clear installation instructions
   - [ ] Helpful error messages
   - [ ] Interactive recovery from failures
   - [ ] Documentation answers common questions

3. **Maintainable**
   - [ ] Code is well-organized
   - [ ] Plugins are independently versionable
   - [ ] Changes can be tested manually
   - [ ] Community can contribute via PRs

4. **Adopted**
   - [ ] Used internally for at least 3 projects
   - [ ] Feedback collected and acted upon
   - [ ] Issues tracked and resolved
   - [ ] v1.1.0 roadmap defined based on usage

---

## Appendix: Key Design Decisions

### Decision: 2 Plugins (Core + Integrations)
**Rationale:** Balances cohesion (core workflows together) with modularity (integrations optional). Peer dependency ensures compatibility without forcing installation.

### Decision: Hybrid Invocation (Commands + Skills)
**Rationale:** Explicit commands give users control. Proactive skills provide intelligent assistance. Dual-purpose maximizes utility.

### Decision: Interactive Error Recovery
**Rationale:** CLI environments need clear feedback. Interactive recovery prevents frustration and maintains user agency.

### Decision: Independent Versioning
**Rationale:** Honest change tracking. Core and integrations evolve at different rates. Semantic versioning communicates compatibility clearly.

### Decision: Cross-Platform from Day 1
**Rationale:** .NET and React are already cross-platform. Small effort (forward slashes, cross-platform commands) unlocks broad adoption.

### Decision: Strict Version Requirements
**Rationale:** Opinionated tooling works best with modern stack. Simplifies testing. Users wanting older versions can fork/modify.

### Decision: Automated Quality Workflow
**Rationale:** Builds quality into the development loop. Coverage threshold (85%) ensures tests aren't forgotten. Auto-invocation reduces friction.

### Decision: Clean Break from ZIP Distribution
**Rationale:** Marketplace provides better installation, versioning, and updates. Migration guide sufficient for existing users (if any).

---

**End of Technical Specification**

When complete, output <promise>DONE</promise>