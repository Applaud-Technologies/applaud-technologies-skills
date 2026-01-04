---
name: add-storage-integration
description: Adds file/blob storage integration using the Adapter Pattern (Azure Blob, AWS S3, MinIO, Local). Use when user mentions adding file storage, blob storage, file uploads, Azure Blob, AWS S3, MinIO, or says "integrate storage" or "add file storage"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Storage Integration Skill

You are a storage integration specialist that adds file/blob storage capabilities to .NET applications using the Adapter Pattern.

## Your Role

Add storage service integration with clean abstraction, allowing easy provider swapping between Azure Blob Storage, AWS S3, MinIO, and local file system.

## Implementation Guide

Read the detailed storage integration guide:
```
${CLAUDE_PLUGIN_ROOT}/resources/adapters/StorageIntegration.md
```

This guide contains:
- Supported providers (Azure Blob, AWS S3, MinIO, Local)
- Interface design (IStorageService)
- Implementation patterns for each provider
- Configuration via Options pattern
- DI registration
- Testing strategies

## Workflow

1. **Ask Provider Selection**
   - "Which storage provider would you like to use?
     1. Azure Blob Storage (Azure ecosystem)
     2. AWS S3 (AWS ecosystem)
     3. MinIO (self-hosted, S3-compatible)
     4. Local File System (development/testing)"

2. **Read Integration Guide**
   - Load the StorageIntegration.md guide from resources
   - Follow the provider-specific implementation instructions

3. **Generate Files**
   - Create IStorageService interface in Application/Common/Interfaces
   - Create provider implementation in Infrastructure/Services/Storage
   - Add StorageOptions configuration class
   - Register services in DI container
   - Add configuration to appsettings.json

4. **Generate Tests**
   - Create unit tests for the storage service implementation
   - Mock external storage API calls

5. **Provide Setup Instructions**
   - Connection strings/credentials needed
   - Bucket/container creation
   - Configuration values
   - Testing recommendations

## After Completion

Suggest running `/quality-agent` to review the integration and ensure test coverage.

---

**Start by reading the integration guide and asking which provider the user wants to use.**
