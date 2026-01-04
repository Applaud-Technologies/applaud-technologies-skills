# SMS Integration Guide

## Overview

Add SMS/text messaging capabilities with support for multiple providers.

**Interface**: `ISmsSender`
**Providers**: Twilio (recommended), AWS SNS

## Requirements Gathering

### Question 1: Provider Selection
"Which SMS provider(s) do you want to implement?
1. **twilio** - Full-featured SMS API (recommended)
2. **sns** - AWS Simple Notification Service

You can select multiple for fallback. Example: 'twilio, sns'"

### Question 2: Features Needed
"Which features do you need?
- **basic** - Single SMS sending (default)
- **bulk** - Batch SMS sending
- **mms** - MMS with media attachments (Twilio only)
- **lookup** - Phone number validation/lookup (Twilio only)
- **status** - Delivery status callbacks

Example: 'basic, status' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── ISmsSender.cs
        └── Sms/
            ├── SmsMessage.cs
            └── SmsDeliveryStatus.cs

src/{Project}.Infrastructure/
└── Services/
    └── Sms/
        ├── SmsOptions.cs
        ├── TwilioSmsSender.cs
        ├── SnsSmsSender.cs
        └── DependencyInjection.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/ISmsSender.cs
namespace {Project}.Application.Common.Interfaces;

public interface ISmsSender
{
    /// <summary>
    /// Send a single SMS message.
    /// </summary>
    Task<SmsSendResult> SendAsync(SmsMessage message, CancellationToken ct = default);
    
    /// <summary>
    /// Send multiple SMS messages in batch.
    /// </summary>
    Task<IReadOnlyList<SmsSendResult>> SendBulkAsync(
        IEnumerable<SmsMessage> messages, 
        CancellationToken ct = default);
}

public record SmsMessage
{
    /// <summary>
    /// Recipient phone number in E.164 format (+1234567890)
    /// </summary>
    public required string To { get; init; }
    
    /// <summary>
    /// Message body (160 chars for single SMS, longer will be segmented)
    /// </summary>
    public required string Body { get; init; }
    
    /// <summary>
    /// Override the default sender/from number
    /// </summary>
    public string? From { get; init; }
    
    /// <summary>
    /// Media URLs for MMS (provider-dependent)
    /// </summary>
    public IReadOnlyList<string>? MediaUrls { get; init; }
    
    /// <summary>
    /// Webhook URL for delivery status callbacks
    /// </summary>
    public string? StatusCallbackUrl { get; init; }
    
    /// <summary>
    /// Custom metadata/tags for tracking
    /// </summary>
    public Dictionary<string, string>? Metadata { get; init; }
}

public record SmsSendResult
{
    public bool Success { get; init; }
    public string? MessageId { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public decimal? Price { get; init; }
    public string? PriceUnit { get; init; }
    public int? SegmentCount { get; init; }
}
```

## Options Configuration

```csharp
// Infrastructure/Services/Sms/SmsOptions.cs
namespace {Project}.Infrastructure.Services.Sms;

public class SmsOptions
{
    public const string SectionName = "Sms";
    
    /// <summary>
    /// Active provider: "Twilio" or "Sns"
    /// </summary>
    public string Provider { get; set; } = "Twilio";
    
    /// <summary>
    /// Default sender phone number (E.164 format)
    /// </summary>
    public string DefaultFrom { get; set; } = "";
    
    /// <summary>
    /// Enable SMS sending (false for dev/testing)
    /// </summary>
    public bool Enabled { get; set; } = true;
    
    /// <summary>
    /// Redirect all SMS to this number (for testing)
    /// </summary>
    public string? RedirectAllTo { get; set; }
    
    public TwilioOptions Twilio { get; set; } = new();
    public SnsOptions Sns { get; set; } = new();
}

public class TwilioOptions
{
    public string AccountSid { get; set; } = "";
    public string AuthToken { get; set; } = "";
    public string? MessagingServiceSid { get; set; }
    public string? StatusCallbackUrl { get; set; }
}

public class SnsOptions
{
    public string Region { get; set; } = "us-east-1";
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string? DefaultSenderId { get; set; }
    public string SmsType { get; set; } = "Transactional"; // or "Promotional"
}
```

## Twilio Implementation

```csharp
// Infrastructure/Services/Sms/TwilioSmsSender.cs
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace {Project}.Infrastructure.Services.Sms;

public class TwilioSmsSender : ISmsSender
{
    private readonly SmsOptions _options;
    private readonly ILogger<TwilioSmsSender> _logger;

    public TwilioSmsSender(
        IOptions<SmsOptions> options,
        ILogger<TwilioSmsSender> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        if (string.IsNullOrEmpty(_options.Twilio.AccountSid) || 
            string.IsNullOrEmpty(_options.Twilio.AuthToken))
        {
            throw new InvalidOperationException("Twilio credentials are not configured");
        }
        
        TwilioClient.Init(_options.Twilio.AccountSid, _options.Twilio.AuthToken);
    }

    public async Task<SmsSendResult> SendAsync(SmsMessage message, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation(
                "SMS sending disabled. Would have sent to {To}: {Body}", 
                message.To, TruncateForLog(message.Body));
            return new SmsSendResult { Success = true, MessageId = "disabled" };
        }

        var to = !string.IsNullOrEmpty(_options.RedirectAllTo) 
            ? _options.RedirectAllTo 
            : message.To;

        try
        {
            var createOptions = new CreateMessageOptions(new PhoneNumber(to))
            {
                Body = message.Body,
                StatusCallback = message.StatusCallbackUrl != null 
                    ? new Uri(message.StatusCallbackUrl) 
                    : (_options.Twilio.StatusCallbackUrl != null 
                        ? new Uri(_options.Twilio.StatusCallbackUrl) 
                        : null)
            };

            // Use Messaging Service or From number
            if (!string.IsNullOrEmpty(_options.Twilio.MessagingServiceSid))
            {
                createOptions.MessagingServiceSid = _options.Twilio.MessagingServiceSid;
            }
            else
            {
                createOptions.From = new PhoneNumber(message.From ?? _options.DefaultFrom);
            }

            // Add media URLs for MMS
            if (message.MediaUrls?.Any() == true)
            {
                createOptions.MediaUrl = message.MediaUrls.Select(u => new Uri(u)).ToList();
            }

            var result = await MessageResource.CreateAsync(createOptions);

            _logger.LogInformation(
                "SMS sent to {To} via Twilio. SID: {Sid}, Status: {Status}", 
                message.To, result.Sid, result.Status);

            return new SmsSendResult
            {
                Success = true,
                MessageId = result.Sid,
                Price = result.Price != null ? decimal.Parse(result.Price) : null,
                PriceUnit = result.PriceUnit,
                SegmentCount = result.NumSegments != null ? int.Parse(result.NumSegments) : null
            };
        }
        catch (Twilio.Exceptions.ApiException ex)
        {
            _logger.LogError(ex, "Twilio error sending SMS to {To}: {Code} - {Message}", 
                message.To, ex.Code, ex.Message);
            
            return new SmsSendResult
            {
                Success = false,
                ErrorCode = ex.Code.ToString(),
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<IReadOnlyList<SmsSendResult>> SendBulkAsync(
        IEnumerable<SmsMessage> messages, 
        CancellationToken ct = default)
    {
        // Twilio recommends max 100 concurrent requests
        var semaphore = new SemaphoreSlim(50);
        var results = new List<SmsSendResult>();

        var tasks = messages.Select(async message =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                return await SendAsync(message, ct);
            }
            finally
            {
                semaphore.Release();
            }
        });

        var allResults = await Task.WhenAll(tasks);
        return allResults.ToList();
    }

    private static string TruncateForLog(string body) =>
        body.Length > 50 ? body[..50] + "..." : body;
}
```

## AWS SNS Implementation

```csharp
// Infrastructure/Services/Sms/SnsSmsSender.cs
using Amazon;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;

namespace {Project}.Infrastructure.Services.Sms;

public class SnsSmsSender : ISmsSender
{
    private readonly IAmazonSimpleNotificationService _client;
    private readonly SmsOptions _options;
    private readonly ILogger<SnsSmsSender> _logger;

    public SnsSmsSender(
        IOptions<SmsOptions> options,
        ILogger<SnsSmsSender> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        var config = new AmazonSimpleNotificationServiceConfig
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_options.Sns.Region)
        };

        _client = string.IsNullOrEmpty(_options.Sns.AccessKeyId)
            ? new AmazonSimpleNotificationServiceClient(config)
            : new AmazonSimpleNotificationServiceClient(
                _options.Sns.AccessKeyId,
                _options.Sns.SecretAccessKey,
                config);
    }

    public async Task<SmsSendResult> SendAsync(SmsMessage message, CancellationToken ct = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation(
                "SMS sending disabled. Would have sent to {To}", message.To);
            return new SmsSendResult { Success = true, MessageId = "disabled" };
        }

        var to = !string.IsNullOrEmpty(_options.RedirectAllTo) 
            ? _options.RedirectAllTo 
            : message.To;

        try
        {
            var request = new PublishRequest
            {
                PhoneNumber = to,
                Message = message.Body,
                MessageAttributes = new Dictionary<string, MessageAttributeValue>
                {
                    ["AWS.SNS.SMS.SMSType"] = new MessageAttributeValue
                    {
                        StringValue = _options.Sns.SmsType,
                        DataType = "String"
                    }
                }
            };

            // Add sender ID if configured
            if (!string.IsNullOrEmpty(_options.Sns.DefaultSenderId))
            {
                request.MessageAttributes["AWS.SNS.SMS.SenderID"] = new MessageAttributeValue
                {
                    StringValue = _options.Sns.DefaultSenderId,
                    DataType = "String"
                };
            }

            var response = await _client.PublishAsync(request, ct);

            _logger.LogInformation(
                "SMS sent to {To} via SNS. MessageId: {MessageId}", 
                message.To, response.MessageId);

            return new SmsSendResult
            {
                Success = true,
                MessageId = response.MessageId
            };
        }
        catch (AmazonSimpleNotificationServiceException ex)
        {
            _logger.LogError(ex, "SNS error sending SMS to {To}: {Code} - {Message}", 
                message.To, ex.ErrorCode, ex.Message);
            
            return new SmsSendResult
            {
                Success = false,
                ErrorCode = ex.ErrorCode,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<IReadOnlyList<SmsSendResult>> SendBulkAsync(
        IEnumerable<SmsMessage> messages, 
        CancellationToken ct = default)
    {
        // SNS rate limit is ~20 SMS/second by default
        var semaphore = new SemaphoreSlim(10);
        
        var tasks = messages.Select(async message =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                return await SendAsync(message, ct);
            }
            finally
            {
                semaphore.Release();
            }
        });

        var allResults = await Task.WhenAll(tasks);
        return allResults.ToList();
    }
}
```

## Dependency Injection Registration

```csharp
// Infrastructure/Services/Sms/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Sms;

public static class SmsServiceExtensions
{
    public static IServiceCollection AddSmsServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<SmsOptions>(
            configuration.GetSection(SmsOptions.SectionName));
        
        services.AddScoped<TwilioSmsSender>();
        services.AddScoped<SnsSmsSender>();
        
        services.AddScoped<ISmsSender>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<SmsOptions>>().Value;
            
            return options.Provider?.ToLowerInvariant() switch
            {
                "twilio" => sp.GetRequiredService<TwilioSmsSender>(),
                "sns" => sp.GetRequiredService<SnsSmsSender>(),
                _ => sp.GetRequiredService<TwilioSmsSender>()
            };
        });
        
        return services;
    }
}
```

## appsettings.json Configuration

```json
{
  "Sms": {
    "Provider": "Twilio",
    "DefaultFrom": "+15551234567",
    "Enabled": true,
    "RedirectAllTo": null,
    
    "Twilio": {
      "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "AuthToken": "your-auth-token",
      "MessagingServiceSid": null,
      "StatusCallbackUrl": "https://yourdomain.com/api/webhooks/twilio/status"
    },
    
    "Sns": {
      "Region": "us-east-1",
      "AccessKeyId": null,
      "SecretAccessKey": null,
      "DefaultSenderId": "MyApp",
      "SmsType": "Transactional"
    }
  }
}
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| Twilio | `Twilio` | `dotnet add package Twilio` |
| AWS SNS | `AWSSDK.SimpleNotificationService` | `dotnet add package AWSSDK.SimpleNotificationService` |

## Twilio Webhook Controller (Status Callbacks)

```csharp
// Api/Controllers/WebhooksController.cs
[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly ILogger<WebhooksController> _logger;
    
    public WebhooksController(ILogger<WebhooksController> logger)
    {
        _logger = logger;
    }
    
    [HttpPost("twilio/status")]
    public IActionResult TwilioStatusCallback(
        [FromForm] string MessageSid,
        [FromForm] string MessageStatus,
        [FromForm] string? ErrorCode,
        [FromForm] string? ErrorMessage)
    {
        _logger.LogInformation(
            "Twilio status update: {Sid} -> {Status}", 
            MessageSid, MessageStatus);
        
        if (!string.IsNullOrEmpty(ErrorCode))
        {
            _logger.LogWarning(
                "Twilio delivery error for {Sid}: {Code} - {Message}",
                MessageSid, ErrorCode, ErrorMessage);
        }
        
        // Process status update (update database, etc.)
        
        return Ok();
    }
}
```

## Usage Examples

```csharp
public class SendVerificationCodeHandler : IRequestHandler<SendVerificationCodeCommand>
{
    private readonly ISmsSender _smsSender;
    
    public SendVerificationCodeHandler(ISmsSender smsSender)
    {
        _smsSender = smsSender;
    }
    
    public async Task Handle(SendVerificationCodeCommand request, CancellationToken ct)
    {
        var result = await _smsSender.SendAsync(new SmsMessage
        {
            To = request.PhoneNumber,
            Body = $"Your verification code is: {request.Code}. Valid for 10 minutes."
        }, ct);
        
        if (!result.Success)
        {
            throw new SmsSendException(
                $"Failed to send verification code: {result.ErrorMessage}");
        }
    }
}
```

---

**After generating, remind user to:**
1. Add the appropriate NuGet package(s)
2. Configure appsettings.json with provider credentials
3. Use user-secrets for auth tokens in development
4. Register services: `builder.Services.AddSmsServices(builder.Configuration);`
5. (Twilio) Verify phone numbers are in E.164 format (+1234567890)
6. (Twilio) Set up status callback URL if tracking delivery
