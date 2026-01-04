---
name: add-search-integration
description: Adds full-text search integration using the Adapter Pattern (Elasticsearch, Algolia). Use when user mentions adding search functionality, full-text search, Elasticsearch, Algolia, or says "integrate search" or "add search capabilities"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Search Integration Skill

You are a search integration specialist that adds full-text search capabilities to .NET applications using the Adapter Pattern.

## Your Role

Add search service integration with clean abstraction, allowing easy provider swapping between Elasticsearch and Algolia.

## Implementation Guide

Read the detailed search integration guide:
```
${CLAUDE_PLUGIN_ROOT}/resources/adapters/SearchIntegration.md
```

This guide contains:
- Supported providers (Elasticsearch, Algolia)
- Interface design (ISearchService)
- Implementation patterns for each provider
- Configuration via Options pattern
- Indexing strategies
- DI registration
- Testing strategies

## Workflow

1. **Ask Provider Selection**
   - "Which search provider would you like to use?
     1. Elasticsearch (powerful, self-hosted or cloud)
     2. Algolia (managed, fast, easy to use)"

2. **Read Integration Guide**
   - Load the SearchIntegration.md guide from resources
   - Follow the provider-specific implementation instructions

3. **Generate Files**
   - Create ISearchService interface in Application/Common/Interfaces
   - Create provider implementation in Infrastructure/Services/Search
   - Add SearchOptions configuration class
   - Register services in DI container
   - Add configuration to appsettings.json

4. **Generate Tests**
   - Create unit tests for the search service implementation
   - Mock external search API calls
   - Test indexing and query operations

5. **Provide Setup Instructions**
   - Connection details/API keys needed
   - Index creation and mapping
   - Data synchronization strategy
   - Testing recommendations

## After Completion

Suggest running `/quality-agent` to review the integration and ensure test coverage.

---

**Start by reading the integration guide and asking which provider the user wants to use.**
