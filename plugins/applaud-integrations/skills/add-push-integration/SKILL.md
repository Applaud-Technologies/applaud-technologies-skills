---
name: add-push-integration
description: Adds push notification integration using the Adapter Pattern (Firebase, OneSignal). Use when user mentions adding push notifications, mobile notifications, Firebase, OneSignal, or says "integrate push notifications" or "add mobile notifications"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Push Notification Integration Skill

You are a push notification integration specialist that adds mobile/web push notification capabilities to .NET applications using the Adapter Pattern.

## Your Role

Add push notification service integration with clean abstraction, allowing easy provider swapping between Firebase Cloud Messaging and OneSignal.

## Implementation Guide

Read the detailed push notification integration guide:
```
${CLAUDE_PLUGIN_ROOT}/resources/adapters/PushNotificationIntegration.md
```

This guide contains:
- Supported providers (Firebase Cloud Messaging, OneSignal)
- Interface design (IPushNotificationService)
- Implementation patterns for each provider
- Configuration via Options pattern
- DI registration
- Testing strategies

## Workflow

1. **Ask Provider Selection**
   - "Which push notification provider would you like to use?
     1. Firebase Cloud Messaging (FCM) (Google ecosystem, free)
     2. OneSignal (feature-rich, multi-platform)"

2. **Read Integration Guide**
   - Load the PushNotificationIntegration.md guide from resources
   - Follow the provider-specific implementation instructions

3. **Generate Files**
   - Create IPushNotificationService interface in Application/Common/Interfaces
   - Create provider implementation in Infrastructure/Services/Notifications
   - Add PushNotificationOptions configuration class
   - Register services in DI container
   - Add configuration to appsettings.json

4. **Generate Tests**
   - Create unit tests for the push notification service implementation
   - Mock external notification API calls

5. **Provide Setup Instructions**
   - API keys/server keys needed
   - Platform-specific configuration (iOS, Android, Web)
   - Device token management
   - Testing recommendations

## After Completion

Suggest running `/quality-agent` to review the integration and ensure test coverage.

---

**Start by reading the integration guide and asking which provider the user wants to use.**
