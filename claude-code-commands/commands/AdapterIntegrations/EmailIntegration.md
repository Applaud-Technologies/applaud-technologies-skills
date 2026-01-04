# Email Integration Guide

## Overview

Add email sending capabilities with support for multiple providers. The adapter pattern allows easy switching between providers.

**Interface**: `IEmailSender`
**Providers**: SendGrid (recommended), SMTP, AWS SES

## Requirements Gathering

### Question 1: Provider Selection
"Which email provider(s) do you want to implement?
1. **sendgrid** - Cloud email API (recommended for production)
2. **smtp** - Standard SMTP (good for dev/simple needs)
3. **ses** - AWS Simple Email Service

You can select multiple for fallback. Example: 'sendgrid, smtp'"

### Question 2: Features Needed
"Which features do you need?
- **basic** - Single email sending (default)
- **bulk** - Batch/bulk email sending
- **templates** - Template-based emails (provider templates)
- **attachments** - File attachments
- **tracking** - Open/click tracking (provider-dependent)

Example: 'basic, templates, attachments' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── IEmailSender.cs
        └── Email/
            ├── EmailMessage.cs
            ├── EmailAttachment.cs
            └── TemplatedEmail.cs

src/{Project}.Infrastructure/
└── Services/
    └── Email/
        ├── EmailOptions.cs
        ├── SendGridEmailSender.cs      # If SendGrid selected
        ├── SmtpEmailSender.cs          # If SMTP selected
        ├── SesEmailSender.cs           # If SES selected
        └── DependencyInjection.cs

tests/{Project}.Infrastructure.Tests/
└── Services/
    └── Email/
        ├── SendGridEmailSenderTests.cs
        ├── SmtpEmailSenderTests.cs
        └── SesEmailSenderTests.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/IEmailSender.cs
namespace {Project}.Application.Common.Interfaces;

public interface IEmailSender
{
    /// <summary>
    /// Send a single email message.
    /// </summary>
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
    
    /// <summary>
    /// Send multiple emails in batch (optimized for bulk sending).
    /// </summary>
    Task SendBulkAsync(IEnumerable<EmailMessage> messages, CancellationToken ct = default);
    
    /// <summary>
    /// Send an email using a provider template.
    /// </summary>
    Task SendTemplateAsync(TemplatedEmail email, CancellationToken ct = default);
}
```

```csharp
// Application/Common/Interfaces/Email/EmailMessage.cs
namespace {Project}.Application.Common.Interfaces.Email;

public record EmailMessage
{
    public required string To { get; init; }
    public required string Subject { get; init; }
    public required string Body { get; init; }
    public bool IsHtml { get; init; } = true;
    public string? From { get; init; }
    public string? FromName { get; init; }
    public string? ReplyTo { get; init; }
    public IReadOnlyList<string>? Cc { get; init; }
    public IReadOnlyList<string>? Bcc { get; init; }
    public IReadOnlyList<EmailAttachment>? Attachments { get; init; }
    public Dictionary<string, string>? Headers { get; init; }
    public string? Tag { get; init; } // For tracking/categorization
}

public record EmailAttachment(
    string FileName,
    byte[] Content,
    string ContentType,
    string? ContentId = null // For inline images
);

public record TemplatedEmail
{
    public required string To { get; init; }
    public required string TemplateId { get; init; }
    public Dictionary<string, object> TemplateData { get; init; } = new();
    public string? From { get; init; }
    public string? FromName { get; init; }
    public IReadOnlyList<string>? Cc { get; init; }
    public IReadOnlyList<string>? Bcc { get; init; }
}
```

## Options Configuration

```csharp
// Infrastructure/Services/Email/EmailOptions.cs
namespace {Project}.Infrastructure.Services.Email;

public class EmailOptions
{
    public const string SectionName = "Email";
    
    /// <summary>
    /// Active provider: "SendGrid", "Smtp", or "Ses"
    /// </summary>
    public string Provider { get; set; } = "SendGrid";
    
    /// <summary>
    /// Default sender email address
    /// </summary>
    public string DefaultFrom { get; set; } = "";
    
    /// <summary>
    /// Default sender display name
    /// </summary>
    public string DefaultFromName { get; set; } = "";
    
    /// <summary>
    /// Enable email sending (false for dev/testing)
    /// </summary>
    public bool Enabled { get; set; } = true;
    
    /// <summary>
    /// Redirect all emails to this address (for testing)
    /// </summary>
    public string? RedirectAllTo { get; set; }
    
    public SendGridOptions SendGrid { get; set; } = new();
    public SmtpOptions Smtp { get; set; } = new();
    public SesOptions Ses { get; set; } = new();
}

public class SendGridOptions
{
    public string ApiKey { get; set; } = "";
    public bool SandboxMode { get; set; } = false;
}

public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool UseSsl { get; set; } = true;
    public bool UseStartTls { get; set; } = true;
}

public class SesOptions
{
    public string Region { get; set; } = "us-east-1";
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string? ConfigurationSetName { get; set; }
}
```

## SendGrid Implementation

```csharp
// Infrastructure/Services/Email/SendGridEmailSender.cs
using SendGrid;
using SendGrid.Helpers.Mail;

namespace {Project}.Infrastructure.Services.Email;

public class SendGridEmailSender : IEmailSender
{
    private readonly ISendGridClient _client;
    private readonly EmailOptions _options;
    private readonly ILogger<SendGridEmailSender> _logger;

    public SendGridEmailSender(
        IOptions<EmailOptions> options,
        ILogger<SendGridEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        if (string.IsNullOrEmpty(_options.SendGrid.ApiKey))
            throw new InvalidOperationException("SendGrid API key is not configured");
            
        _client = new SendGridClient(_options.SendGrid.ApiKey);
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email sending disabled. Would have sent to {To}", message.To);
            return;
        }

        var msg = CreateSendGridMessage(message);
        
        if (_options.SendGrid.SandboxMode)
            msg.SetSandBoxMode(true);

        var response = await _client.SendEmailAsync(msg, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync(ct);
            _logger.LogError(
                "SendGrid error sending to {To}: {StatusCode} - {Body}", 
                message.To, response.StatusCode, body);
            throw new EmailSendException($"Failed to send email: {response.StatusCode}");
        }
        
        _logger.LogInformation(
            "Email sent to {To} via SendGrid. Subject: {Subject}", 
            message.To, message.Subject);
    }

    public async Task SendBulkAsync(
        IEnumerable<EmailMessage> messages, 
        CancellationToken ct = default)
    {
        // SendGrid supports up to 1000 personalizations per request
        const int batchSize = 1000;
        var messageList = messages.ToList();
        
        for (int i = 0; i < messageList.Count; i += batchSize)
        {
            var batch = messageList.Skip(i).Take(batchSize);
            var tasks = batch.Select(m => SendAsync(m, ct));
            await Task.WhenAll(tasks);
        }
    }

    public async Task SendTemplateAsync(TemplatedEmail email, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation(
                "Email sending disabled. Would have sent template {TemplateId} to {To}", 
                email.TemplateId, email.To);
            return;
        }

        var to = GetRecipient(email.To);
        var from = new EmailAddress(
            email.From ?? _options.DefaultFrom,
            email.FromName ?? _options.DefaultFromName);

        var msg = new SendGridMessage
        {
            From = from,
            TemplateId = email.TemplateId
        };
        
        msg.AddTo(to);
        msg.SetTemplateData(email.TemplateData);

        if (email.Cc?.Any() == true)
            msg.AddCcs(email.Cc.Select(c => new EmailAddress(c)).ToList());
            
        if (email.Bcc?.Any() == true)
            msg.AddBccs(email.Bcc.Select(b => new EmailAddress(b)).ToList());

        var response = await _client.SendEmailAsync(msg, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync(ct);
            throw new EmailSendException($"Failed to send template email: {response.StatusCode}");
        }
        
        _logger.LogInformation(
            "Template email {TemplateId} sent to {To} via SendGrid", 
            email.TemplateId, email.To);
    }

    private SendGridMessage CreateSendGridMessage(EmailMessage message)
    {
        var to = GetRecipient(message.To);
        var from = new EmailAddress(
            message.From ?? _options.DefaultFrom,
            message.FromName ?? _options.DefaultFromName);

        var msg = new SendGridMessage
        {
            From = from,
            Subject = message.Subject
        };
        
        msg.AddTo(to);

        if (message.IsHtml)
            msg.HtmlContent = message.Body;
        else
            msg.PlainTextContent = message.Body;

        if (!string.IsNullOrEmpty(message.ReplyTo))
            msg.ReplyTo = new EmailAddress(message.ReplyTo);

        if (message.Cc?.Any() == true)
            msg.AddCcs(message.Cc.Select(c => new EmailAddress(c)).ToList());
            
        if (message.Bcc?.Any() == true)
            msg.AddBccs(message.Bcc.Select(b => new EmailAddress(b)).ToList());

        if (message.Attachments?.Any() == true)
        {
            foreach (var attachment in message.Attachments)
            {
                msg.AddAttachment(
                    attachment.FileName,
                    Convert.ToBase64String(attachment.Content),
                    attachment.ContentType,
                    attachment.ContentId != null ? "inline" : "attachment",
                    attachment.ContentId);
            }
        }

        if (message.Headers?.Any() == true)
        {
            foreach (var header in message.Headers)
                msg.AddHeader(header.Key, header.Value);
        }

        if (!string.IsNullOrEmpty(message.Tag))
            msg.AddCategory(message.Tag);

        return msg;
    }

    private EmailAddress GetRecipient(string email)
    {
        // Support redirect for testing
        if (!string.IsNullOrEmpty(_options.RedirectAllTo))
        {
            _logger.LogWarning(
                "Redirecting email from {Original} to {Redirect}", 
                email, _options.RedirectAllTo);
            return new EmailAddress(_options.RedirectAllTo);
        }
        return new EmailAddress(email);
    }
}

public class EmailSendException : Exception
{
    public EmailSendException(string message) : base(message) { }
    public EmailSendException(string message, Exception inner) : base(message, inner) { }
}
```

## SMTP Implementation

```csharp
// Infrastructure/Services/Email/SmtpEmailSender.cs
using System.Net;
using System.Net.Mail;

namespace {Project}.Infrastructure.Services.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IOptions<EmailOptions> options,
        ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email sending disabled. Would have sent to {To}", message.To);
            return;
        }

        using var client = CreateSmtpClient();
        using var mailMessage = CreateMailMessage(message);
        
        try
        {
            await client.SendMailAsync(mailMessage, ct);
            _logger.LogInformation(
                "Email sent to {To} via SMTP. Subject: {Subject}", 
                message.To, message.Subject);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP error sending to {To}", message.To);
            throw new EmailSendException($"Failed to send email via SMTP: {ex.Message}", ex);
        }
    }

    public async Task SendBulkAsync(
        IEnumerable<EmailMessage> messages, 
        CancellationToken ct = default)
    {
        // SMTP doesn't support true bulk - send sequentially with connection reuse
        using var client = CreateSmtpClient();
        
        foreach (var message in messages)
        {
            ct.ThrowIfCancellationRequested();
            
            using var mailMessage = CreateMailMessage(message);
            await client.SendMailAsync(mailMessage, ct);
            
            _logger.LogInformation("Email sent to {To} via SMTP", message.To);
        }
    }

    public Task SendTemplateAsync(TemplatedEmail email, CancellationToken ct = default)
    {
        // SMTP doesn't support server-side templates
        // You would need to implement local template rendering
        throw new NotSupportedException(
            "SMTP provider does not support server-side templates. " +
            "Use a local template engine like Razor or Scriban.");
    }

    private SmtpClient CreateSmtpClient()
    {
        var client = new SmtpClient(_options.Smtp.Host, _options.Smtp.Port)
        {
            EnableSsl = _options.Smtp.UseSsl
        };

        if (!string.IsNullOrEmpty(_options.Smtp.Username))
        {
            client.Credentials = new NetworkCredential(
                _options.Smtp.Username, 
                _options.Smtp.Password);
        }

        return client;
    }

    private MailMessage CreateMailMessage(EmailMessage message)
    {
        var to = !string.IsNullOrEmpty(_options.RedirectAllTo) 
            ? _options.RedirectAllTo 
            : message.To;

        var from = new MailAddress(
            message.From ?? _options.DefaultFrom,
            message.FromName ?? _options.DefaultFromName);

        var mailMessage = new MailMessage
        {
            From = from,
            Subject = message.Subject,
            Body = message.Body,
            IsBodyHtml = message.IsHtml
        };
        
        mailMessage.To.Add(to);

        if (!string.IsNullOrEmpty(message.ReplyTo))
            mailMessage.ReplyToList.Add(message.ReplyTo);

        if (message.Cc != null)
            foreach (var cc in message.Cc)
                mailMessage.CC.Add(cc);

        if (message.Bcc != null)
            foreach (var bcc in message.Bcc)
                mailMessage.Bcc.Add(bcc);

        if (message.Attachments != null)
        {
            foreach (var attachment in message.Attachments)
            {
                var stream = new MemoryStream(attachment.Content);
                var mailAttachment = new Attachment(stream, attachment.FileName, attachment.ContentType);
                
                if (!string.IsNullOrEmpty(attachment.ContentId))
                {
                    mailAttachment.ContentId = attachment.ContentId;
                    mailAttachment.ContentDisposition!.Inline = true;
                }
                
                mailMessage.Attachments.Add(mailAttachment);
            }
        }

        if (message.Headers != null)
            foreach (var header in message.Headers)
                mailMessage.Headers.Add(header.Key, header.Value);

        return mailMessage;
    }
}
```

## AWS SES Implementation

```csharp
// Infrastructure/Services/Email/SesEmailSender.cs
using Amazon;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;

namespace {Project}.Infrastructure.Services.Email;

public class SesEmailSender : IEmailSender
{
    private readonly IAmazonSimpleEmailService _client;
    private readonly EmailOptions _options;
    private readonly ILogger<SesEmailSender> _logger;

    public SesEmailSender(
        IOptions<EmailOptions> options,
        ILogger<SesEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        var config = new AmazonSimpleEmailServiceConfig
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_options.Ses.Region)
        };

        _client = string.IsNullOrEmpty(_options.Ses.AccessKeyId)
            ? new AmazonSimpleEmailServiceClient(config) // Use IAM role
            : new AmazonSimpleEmailServiceClient(
                _options.Ses.AccessKeyId, 
                _options.Ses.SecretAccessKey, 
                config);
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email sending disabled. Would have sent to {To}", message.To);
            return;
        }

        var to = !string.IsNullOrEmpty(_options.RedirectAllTo) 
            ? _options.RedirectAllTo 
            : message.To;

        var request = new SendEmailRequest
        {
            Source = $"{message.FromName ?? _options.DefaultFromName} <{message.From ?? _options.DefaultFrom}>",
            Destination = new Destination
            {
                ToAddresses = new List<string> { to },
                CcAddresses = message.Cc?.ToList() ?? new List<string>(),
                BccAddresses = message.Bcc?.ToList() ?? new List<string>()
            },
            Message = new Message
            {
                Subject = new Content(message.Subject),
                Body = new Body
                {
                    Html = message.IsHtml ? new Content(message.Body) : null,
                    Text = !message.IsHtml ? new Content(message.Body) : null
                }
            }
        };

        if (!string.IsNullOrEmpty(message.ReplyTo))
            request.ReplyToAddresses = new List<string> { message.ReplyTo };

        if (!string.IsNullOrEmpty(_options.Ses.ConfigurationSetName))
            request.ConfigurationSetName = _options.Ses.ConfigurationSetName;

        try
        {
            var response = await _client.SendEmailAsync(request, ct);
            _logger.LogInformation(
                "Email sent to {To} via SES. MessageId: {MessageId}", 
                message.To, response.MessageId);
        }
        catch (AmazonSimpleEmailServiceException ex)
        {
            _logger.LogError(ex, "SES error sending to {To}", message.To);
            throw new EmailSendException($"Failed to send email via SES: {ex.Message}", ex);
        }
    }

    public async Task SendBulkAsync(
        IEnumerable<EmailMessage> messages, 
        CancellationToken ct = default)
    {
        // SES has SendBulkTemplatedEmail but requires templates
        // For non-templated, send in parallel with rate limiting
        var semaphore = new SemaphoreSlim(10); // SES default rate limit
        
        var tasks = messages.Select(async message =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                await SendAsync(message, ct);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    public async Task SendTemplateAsync(TemplatedEmail email, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation(
                "Email sending disabled. Would have sent template {TemplateId} to {To}", 
                email.TemplateId, email.To);
            return;
        }

        var to = !string.IsNullOrEmpty(_options.RedirectAllTo) 
            ? _options.RedirectAllTo 
            : email.To;

        var request = new SendTemplatedEmailRequest
        {
            Source = $"{email.FromName ?? _options.DefaultFromName} <{email.From ?? _options.DefaultFrom}>",
            Destination = new Destination
            {
                ToAddresses = new List<string> { to }
            },
            Template = email.TemplateId,
            TemplateData = System.Text.Json.JsonSerializer.Serialize(email.TemplateData)
        };

        if (!string.IsNullOrEmpty(_options.Ses.ConfigurationSetName))
            request.ConfigurationSetName = _options.Ses.ConfigurationSetName;

        var response = await _client.SendTemplatedEmailAsync(request, ct);
        _logger.LogInformation(
            "Template email {TemplateId} sent to {To} via SES. MessageId: {MessageId}", 
            email.TemplateId, email.To, response.MessageId);
    }
}
```

## Dependency Injection Registration

```csharp
// Infrastructure/Services/Email/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Email;

public static class EmailServiceExtensions
{
    public static IServiceCollection AddEmailServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EmailOptions>(
            configuration.GetSection(EmailOptions.SectionName));
        
        // Register all implementations
        services.AddScoped<SendGridEmailSender>();
        services.AddScoped<SmtpEmailSender>();
        services.AddScoped<SesEmailSender>();
        
        // Register factory that selects based on configuration
        services.AddScoped<IEmailSender>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<EmailOptions>>().Value;
            
            return options.Provider?.ToLowerInvariant() switch
            {
                "sendgrid" => sp.GetRequiredService<SendGridEmailSender>(),
                "smtp" => sp.GetRequiredService<SmtpEmailSender>(),
                "ses" => sp.GetRequiredService<SesEmailSender>(),
                _ => sp.GetRequiredService<SendGridEmailSender>()
            };
        });
        
        return services;
    }
}
```

## appsettings.json Configuration

```json
{
  "Email": {
    "Provider": "SendGrid",
    "DefaultFrom": "noreply@example.com",
    "DefaultFromName": "My Application",
    "Enabled": true,
    "RedirectAllTo": null,
    
    "SendGrid": {
      "ApiKey": "SG.xxxxxxxxxxxxxxxxxxxx",
      "SandboxMode": false
    },
    
    "Smtp": {
      "Host": "smtp.gmail.com",
      "Port": 587,
      "Username": "user@gmail.com",
      "Password": "app-specific-password",
      "UseSsl": true,
      "UseStartTls": true
    },
    
    "Ses": {
      "Region": "us-east-1",
      "AccessKeyId": null,
      "SecretAccessKey": null,
      "ConfigurationSetName": null
    }
  }
}
```

## User Secrets (Development)

```bash
# SendGrid
dotnet user-secrets set "Email:SendGrid:ApiKey" "SG.your-api-key"

# SMTP
dotnet user-secrets set "Email:Smtp:Password" "your-password"

# AWS SES
dotnet user-secrets set "Email:Ses:AccessKeyId" "AKIA..."
dotnet user-secrets set "Email:Ses:SecretAccessKey" "your-secret"
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| SendGrid | `SendGrid` | `dotnet add package SendGrid` |
| SMTP | (built-in) | N/A |
| AWS SES | `AWSSDK.SimpleEmail` | `dotnet add package AWSSDK.SimpleEmail` |

## Unit Tests

```csharp
// Tests/Infrastructure.Tests/Services/Email/SendGridEmailSenderTests.cs
namespace {Project}.Infrastructure.Tests.Services.Email;

public class SendGridEmailSenderTests
{
    private readonly EmailOptions _options;
    private readonly ILogger<SendGridEmailSender> _logger;

    public SendGridEmailSenderTests()
    {
        _options = new EmailOptions
        {
            Provider = "SendGrid",
            DefaultFrom = "test@example.com",
            DefaultFromName = "Test App",
            Enabled = true,
            SendGrid = new SendGridOptions { ApiKey = "SG.test-key" }
        };
        _logger = Substitute.For<ILogger<SendGridEmailSender>>();
    }

    [Fact]
    public void Constructor_MissingApiKey_ThrowsException()
    {
        // Arrange
        _options.SendGrid.ApiKey = "";
        var options = Options.Create(_options);

        // Act & Assert
        var act = () => new SendGridEmailSender(options, _logger);
        act.ShouldThrow<InvalidOperationException>();
    }

    [Fact]
    public async Task SendAsync_EmailDisabled_LogsAndReturns()
    {
        // Arrange
        _options.Enabled = false;
        var options = Options.Create(_options);
        var sender = new SendGridEmailSender(options, _logger);
        var message = new EmailMessage
        {
            To = "recipient@example.com",
            Subject = "Test",
            Body = "Test body"
        };

        // Act
        await sender.SendAsync(message);

        // Assert - verify no exception and logging occurred
        _logger.Received().LogInformation(
            Arg.Any<string>(),
            Arg.Is<object[]>(args => args.Contains("recipient@example.com")));
    }

    [Fact]
    public async Task SendAsync_RedirectEnabled_SendsToRedirectAddress()
    {
        // Arrange
        _options.RedirectAllTo = "redirect@example.com";
        // Would need to mock ISendGridClient to fully test
    }
}
```

## Usage Examples

```csharp
// In a command handler or service
public class SendWelcomeEmailHandler : IRequestHandler<SendWelcomeEmailCommand>
{
    private readonly IEmailSender _emailSender;
    
    public SendWelcomeEmailHandler(IEmailSender emailSender)
    {
        _emailSender = emailSender;
    }
    
    public async Task Handle(SendWelcomeEmailCommand request, CancellationToken ct)
    {
        // Simple email
        await _emailSender.SendAsync(new EmailMessage
        {
            To = request.UserEmail,
            Subject = "Welcome to Our App!",
            Body = $"<h1>Welcome, {request.UserName}!</h1><p>Thanks for signing up.</p>"
        }, ct);
        
        // Or using templates (SendGrid/SES)
        await _emailSender.SendTemplateAsync(new TemplatedEmail
        {
            To = request.UserEmail,
            TemplateId = "d-xxxxx", // SendGrid template ID
            TemplateData = new Dictionary<string, object>
            {
                ["userName"] = request.UserName,
                ["activationLink"] = request.ActivationLink
            }
        }, ct);
    }
}
```

---

**After generating, remind user to:**
1. Add the appropriate NuGet package(s)
2. Configure appsettings.json with provider credentials
3. Use user-secrets for API keys in development
4. Register services in Program.cs: `builder.Services.AddEmailServices(builder.Configuration);`
