# applaud-integrations

Third-party service integration adapters using the Adapter Pattern for .NET applications.

## Installation

```bash
# Requires applaud-core
/plugin install applaud-integrations@applaud-technologies-skills
```

## Peer Dependency

This plugin requires `applaud-core@applaud-technologies-skills ^1.0.0`

## Commands

### /add-integration

Interactive integration orchestrator with guided menu.

**Usage:**
```
/add-integration
```

Presents a menu of available integrations:
1. Email
2. SMS
3. Storage
4. Payment
5. Push Notifications
6. Document Generation
7. Search

Select by number or name, then follow provider-specific prompts.

## Proactive Skills

These skills activate automatically when you mention specific integrations:

| Skill | Providers | Triggers |
|-------|-----------|----------|
| `add-email-integration` | SendGrid, SMTP, AWS SES | "add email", "integrate email", "SendGrid" |
| `add-sms-integration` | Twilio, AWS SNS | "add SMS", "text messaging", "Twilio" |
| `add-storage-integration` | Azure Blob, AWS S3, MinIO, Local | "file storage", "blob storage", "S3" |
| `add-payment-integration` | Stripe, PayPal | "payment processing", "Stripe", "checkout" |
| `add-push-integration` | Firebase, OneSignal | "push notifications", "FCM", "OneSignal" |
| `add-document-integration` | QuestPDF, DinkToPdf | "PDF generation", "document creation", "QuestPDF" |
| `add-search-integration` | Elasticsearch, Algolia | "full-text search", "Elasticsearch", "Algolia" |

## Available Integrations

### Email Service

**Providers:**
- **SendGrid** - Recommended for production (cloud-based, reliable)
- **SMTP** - Flexible, works with any SMTP server
- **AWS SES** - AWS ecosystem integration

**What you get:**
```csharp
// Interface
public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}

// Multiple implementations
Infrastructure/Services/Email/
├── SendGridEmailService.cs
├── SmtpEmailService.cs
├── AwsSesEmailService.cs
└── EmailOptions.cs
```

**Example usage:**
```
Add email integration with SendGrid
```

### SMS Service

**Providers:**
- **Twilio** - Recommended (feature-rich, reliable)
- **AWS SNS** - AWS ecosystem integration

**What you get:**
```csharp
public interface ISmsService
{
    Task SendAsync(SmsMessage message, CancellationToken ct);
}
```

**Example usage:**
```
Integrate SMS with Twilio
```

### File Storage

**Providers:**
- **Azure Blob Storage** - Azure ecosystem
- **AWS S3** - AWS ecosystem, industry standard
- **MinIO** - Self-hosted, S3-compatible
- **Local File System** - Development/testing

**What you get:**
```csharp
public interface IStorageService
{
    Task<string> UploadAsync(Stream stream, string fileName, CancellationToken ct);
    Task<Stream> DownloadAsync(string fileKey, CancellationToken ct);
    Task DeleteAsync(string fileKey, CancellationToken ct);
}
```

**Example usage:**
```
Add file storage with AWS S3
```

### Payment Processing

**Providers:**
- **Stripe** - Recommended (modern API, extensive features)
- **PayPal** - Widely recognized, established

**What you get:**
```csharp
public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken ct);
    Task<RefundResult> RefundAsync(string transactionId, decimal amount, CancellationToken ct);
}
```

**Example usage:**
```
Add payment integration with Stripe
```

### Push Notifications

**Providers:**
- **Firebase Cloud Messaging (FCM)** - Google ecosystem, free
- **OneSignal** - Feature-rich, multi-platform

**What you get:**
```csharp
public interface IPushNotificationService
{
    Task SendToDeviceAsync(string deviceToken, PushMessage message, CancellationToken ct);
    Task SendToTopicAsync(string topic, PushMessage message, CancellationToken ct);
}
```

**Example usage:**
```
Add push notifications with Firebase
```

### Document Generation

**Providers:**
- **QuestPDF** - Recommended (modern, fluent API, .NET native)
- **DinkToPdf** - HTML to PDF conversion

**What you get:**
```csharp
public interface IDocumentService
{
    Task<byte[]> GeneratePdfAsync(DocumentModel model, CancellationToken ct);
}
```

**Example usage:**
```
Add PDF generation with QuestPDF
```

### Search Engine

**Providers:**
- **Elasticsearch** - Powerful, self-hosted or cloud
- **Algolia** - Managed, fast, easy to use

**What you get:**
```csharp
public interface ISearchService
{
    Task IndexAsync<T>(T document, CancellationToken ct);
    Task<SearchResults<T>> SearchAsync<T>(SearchQuery query, CancellationToken ct);
}
```

**Example usage:**
```
Add search with Elasticsearch
```

## Adapter Pattern

All integrations follow the same pattern:

### 1. Interface in Application Layer

```
src/{Project}.Application/Common/Interfaces/
└── I{Service}.cs
```

Defines the contract. No external dependencies.

### 2. Implementation in Infrastructure Layer

```
src/{Project}.Infrastructure/Services/{Category}/
├── {Provider}{Service}.cs        # e.g., SendGridEmailService
├── {Alternative Provider}{Service}.cs
└── {Service}Options.cs            # Configuration
```

Concrete implementations. External SDK dependencies allowed.

### 3. Configuration via Options Pattern

```json
{
  "Email": {
    "Provider": "SendGrid",
    "SendGrid": {
      "ApiKey": "your-key-here"
    }
  }
}
```

Provider can be swapped by changing configuration.

### 4. DI Registration

```csharp
services.AddEmailServices(configuration);
```

Factory pattern selects provider based on configuration.

## Usage Examples

### Interactive Menu

```bash
/add-integration
```

```
Which integration do you want to add?
1. Email - Email sending (SendGrid, SMTP, AWS SES)
2. SMS - Text messaging (Twilio, AWS SNS)
3. Storage - File/blob storage (Azure Blob, AWS S3, MinIO, Local)
4. Payment - Payment processing (Stripe, PayPal)
5. Push - Push notifications (Firebase, OneSignal)
6. Document - PDF generation (QuestPDF, DinkToPdf)
7. Search - Full-text search (Elasticsearch, Algolia)

Enter the name or number: 1
```

### Proactive Direct

```
I need to add email sending to my project using SendGrid
```

Claude's `add-email-integration` skill activates automatically:

1. Confirms provider (SendGrid)
2. Reads integration guide
3. Generates IEmailService interface
4. Generates SendGridEmailService implementation
5. Adds configuration
6. Registers in DI
7. Creates tests
8. Provides setup instructions (API key, etc.)

### Swap Providers Later

To switch from SendGrid to SMTP:

1. Update configuration:
```json
{
  "Email": {
    "Provider": "SMTP",
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "...",
      "Password": "..."
    }
  }
}
```

2. Generate SMTP implementation:
```
Add SMTP email provider implementation
```

3. Update DI registration to include both providers

No changes to consuming code needed!

## Integration Resources

Each integration has a detailed implementation guide:

```
resources/adapters/
├── EmailIntegration.md
├── SmsIntegration.md
├── StorageIntegration.md
├── PaymentIntegration.md
├── PushNotificationIntegration.md
├── DocumentIntegration.md
└── SearchIntegration.md
```

These guides contain:
- Provider comparison matrix
- Complete interface design
- Implementation templates for each provider
- Configuration examples
- DI registration patterns
- Testing strategies
- Best practices

## After Adding Integration

Always run:
```
/quality-agent
```

This will:
- Review the integration code
- Check test coverage
- Auto-generate missing tests if needed

## Provider Comparison Matrix

### Email

| Feature | SendGrid | SMTP | AWS SES |
|---------|----------|------|---------|
| Ease of Setup | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Reliability | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Cost | Freemium | Varies | Pay-as-you-go |
| Templates | ✅ | ❌ | ✅ |
| Analytics | ✅ | ❌ | ✅ |

### Storage

| Feature | Azure Blob | AWS S3 | MinIO | Local |
|---------|-----------|--------|-------|-------|
| Scalability | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Cost | Pay-as-you-go | Pay-as-you-go | Self-hosted | Free |
| CDN Integration | ✅ | ✅ | ❌ | ❌ |
| Development | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## Version

Current version: **1.0.0**

See [CHANGELOG.md](../../CHANGELOG.md) for version history.

## License

MIT - See [LICENSE](../../LICENSE)

---

[← Back to Marketplace](../../README.md)
