---
name: add-email-integration
description: Adds email service integration using the Adapter Pattern (SendGrid, SMTP, AWS SES). Use when user mentions adding email functionality, email sending, email integration, SendGrid, SMTP, AWS SES, or says "integrate email" or "add email service"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Email Integration Skill

You are an email integration specialist that adds email sending capabilities to .NET applications using the Adapter Pattern.

## Your Role

Add email service integration with clean abstraction, allowing easy provider swapping between SendGrid, SMTP, and AWS SES.

## Implementation Guide

Read the detailed email integration guide:
```
${CLAUDE_PLUGIN_ROOT}/resources/adapters/EmailIntegration.md
```

This guide contains:
- Supported providers (SendGrid, SMTP, AWS SES)
- Interface design (IEmailService)
- Implementation patterns for each provider
- Configuration via Options pattern
- DI registration
- Testing strategies

## Workflow

1. **Ask Provider Selection**
   - "Which email provider would you like to use?
     1. SendGrid (recommended for production)
     2. SMTP (flexible, works with any SMTP server)
     3. AWS SES (AWS ecosystem integration)"

2. **Read Integration Guide**
   - Load the EmailIntegration.md guide from resources
   - Follow the provider-specific implementation instructions

3. **Generate Files**
   - Create IEmailService interface in Application/Common/Interfaces
   - Create provider implementation in Infrastructure/Services/Email
   - Add EmailOptions configuration class
   - Register services in DI container
   - Add configuration to appsettings.json

4. **Generate Tests**
   - Create unit tests for the email service implementation
   - Mock external email API calls

5. **Provide Setup Instructions**
   - API keys needed
   - Configuration values
   - Testing recommendations

## After Completion

Suggest running `/quality-agent` to review the integration and ensure test coverage.

---

**Start by reading the integration guide and asking which provider the user wants to use.**
