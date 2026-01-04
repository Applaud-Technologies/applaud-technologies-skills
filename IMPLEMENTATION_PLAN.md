# Implementation Plan: Applaud Technologies Skills Marketplace

## Overview
Convert existing Claude Code commands from the ZIP archive into a proper Claude Code marketplace named "applaud-technologies-skills" following the official marketplace protocol.

## Current State
- **Location**: `E:\Clients\Personal\claudeSKills`
- **Existing asset**: `claude-code-commands.zip` containing 6 main commands + 7 integration adapters
- **Commands**: new-project, quick-project, add-feature, add-integration, generate-tests, quality-agent
- **Adapters**: Document, Email, Payment, PushNotification, Search, SMS, Storage integrations
- **Template**: CLAUDE.md.template for project documentation

## Target Structure

```
E:\Clients\Personal\claudeSKills\
├── .claude-plugin/
│   └── marketplace.json                    # Main marketplace manifest
├── plugins/
│   ├── project-scaffolding/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── commands/
│   │   │   ├── new-project.md
│   │   │   └── quick-project.md
│   │   └── templates/
│   │       └── CLAUDE.md.template
│   ├── feature-development/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── commands/
│   │       ├── add-feature.md
│   │       ├── generate-tests.md
│   │       └── quality-agent.md
│   └── integration-adapters/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── commands/
│           ├── add-integration.md
│           └── adapters/
│               ├── DocumentIntegration.md
│               ├── EmailIntegration.md
│               ├── PaymentIntegration.md
│               ├── PushNotificationIntegration.md
│               ├── SearchIntegration.md
│               ├── SmsIntegration.md
│               └── StorageIntegration.md
├── README.md
└── LICENSE
```

## Plugin Organization (3 Logical Plugins)

### 1. project-scaffolding
- **Purpose**: Initial project creation
- **Commands**: new-project, quick-project
- **Resources**: CLAUDE.md.template
- **Category**: Project Tools

### 2. feature-development
- **Purpose**: Feature development, testing, quality assurance
- **Commands**: add-feature, generate-tests, quality-agent
- **Category**: Development Tools

### 3. integration-adapters
- **Purpose**: Third-party service integrations
- **Commands**: add-integration (orchestrator)
- **Resources**: 7 integration adapter guides
- **Category**: Integration Tools

## Implementation Steps

### Step 1: Extract ZIP Archive
- Extract `claude-code-commands.zip` to access source files
- Verify all 6 commands + 7 adapters + template are present

### Step 2: Create Directory Structure
- Create `.claude-plugin/` at repository root
- Create `plugins/` directory with 3 plugin folders
- Create `.claude-plugin/` subdirectory in each plugin
- Create `commands/` subdirectory in each plugin
- Create `templates/` in project-scaffolding plugin
- Create `adapters/` in integration-adapters plugin

### Step 3: Organize Files into Plugins

**Project Scaffolding:**
- Move `new-project.md` → `plugins/project-scaffolding/commands/`
- Move `quick-project.md` → `plugins/project-scaffolding/commands/`
- Move `CLAUDE.md.template` → `plugins/project-scaffolding/templates/`

**Feature Development:**
- Move `add-feature.md` → `plugins/feature-development/commands/`
- Move `generate-tests.md` → `plugins/feature-development/commands/`
- Move `quality-agent.md` → `plugins/feature-development/commands/`

**Integration Adapters:**
- Move `add-integration.md` → `plugins/integration-adapters/commands/`
- Move all 7 integration .md files → `plugins/integration-adapters/commands/adapters/`

### Step 4: Create Marketplace Manifest
**File**: `.claude-plugin/marketplace.json`

```json
{
  "name": "applaud-technologies-skills",
  "owner": {
    "name": "Applaud Technologies"
  },
  "metadata": {
    "description": "Professional .NET + React scaffolding and development tools",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "project-scaffolding",
      "source": "./plugins/project-scaffolding",
      "description": "Create full-stack .NET + React projects",
      "version": "1.0.0"
    },
    {
      "name": "feature-development",
      "source": "./plugins/feature-development",
      "description": "Add features, tests, and quality checks",
      "version": "1.0.0"
    },
    {
      "name": "integration-adapters",
      "source": "./plugins/integration-adapters",
      "description": "Third-party service integrations",
      "version": "1.0.0"
    }
  ]
}
```

### Step 5: Create Plugin Manifests

**File**: `plugins/project-scaffolding/.claude-plugin/plugin.json`
- Define new-project and quick-project commands
- Include template as resource
- Set category: "productivity"
- Keywords: scaffolding, dotnet, react, fullstack

**File**: `plugins/feature-development/.claude-plugin/plugin.json`
- Define add-feature, generate-tests, quality-agent commands
- Set category: "development"
- Keywords: feature, testing, quality, cqrs, tdd

**File**: `plugins/integration-adapters/.claude-plugin/plugin.json`
- Define add-integration command
- Include all 7 adapter guides as resources
- Set category: "integration"
- Keywords: integration, adapter, email, sms, storage, payment

### Step 6: Update Internal Path References
- Review `add-integration.md` for any references to `AdapterIntegrations/` → update to `adapters/`
- Verify template path references in project commands
- Ensure all paths use forward slashes for cross-platform compatibility

### Step 7: Create Documentation
**File**: `README.md`
- Marketplace overview and purpose
- Installation instructions
- Plugin descriptions
- Usage examples
- Tech stack reference
- Contributing guidelines

**File**: `LICENSE`
- Add MIT license (as referenced in original README)

### Step 8: Cleanup
- Remove temporary extraction directory
- Optionally keep or remove `claude-code-commands.zip`

## Critical Files to Create/Modify

1. **`.claude-plugin/marketplace.json`** - Main marketplace manifest
2. **`plugins/project-scaffolding/.claude-plugin/plugin.json`** - Project scaffolding plugin
3. **`plugins/feature-development/.claude-plugin/plugin.json`** - Feature development plugin
4. **`plugins/integration-adapters/.claude-plugin/plugin.json`** - Integration adapters plugin
5. **`README.md`** - Marketplace documentation

## Validation Checklist

After implementation:
- [ ] All JSON files are valid (no syntax errors)
- [ ] All relative paths resolve correctly
- [ ] Commands can access their resources (templates, adapter guides)
- [ ] All 6 commands + 7 adapters are properly organized
- [ ] Manifest versions are consistent (1.0.0)
- [ ] README has complete installation instructions
- [ ] License file is present

## Post-Implementation Usage

Users can install from your marketplace:

```bash
# Add marketplace (after hosting on GitHub)
/plugin marketplace add owner/applaud-technologies-skills

# Install entire marketplace
/plugin install applaud-technologies-skills

# Install individual plugins
/plugin install project-scaffolding@applaud-technologies-skills
/plugin install feature-development@applaud-technologies-skills
/plugin install integration-adapters@applaud-technologies-skills
```

## Version Strategy

- **Initial release**: 1.0.0 for marketplace and all plugins
- **Semantic versioning**: MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes to command interfaces
  - MINOR: New commands/features
  - PATCH: Bug fixes, documentation updates

## Notes

- Template file should be accessible to both project commands via resource reference
- Integration adapters are resources, not commands (referenced by add-integration)
- Keep original command structure intact, just reorganize into marketplace format
- All commands use .md files (agent definitions, not executable scripts)
