# Push Notification Integration Guide

## Overview

Add push notification capabilities for web and mobile applications.

**Interface**: `IPushNotificationSender`
**Providers**: Firebase Cloud Messaging (recommended), OneSignal

## Requirements Gathering

### Question 1: Provider Selection
"Which push notification provider do you want to implement?
1. **firebase** - Firebase Cloud Messaging (recommended)
2. **onesignal** - OneSignal

Example: 'firebase'"

### Question 2: Platforms
"Which platforms do you need to support?
- **web** - Web push notifications
- **android** - Android devices
- **ios** - iOS devices

Example: 'web, android, ios' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── IPushNotificationSender.cs
        └── PushNotifications/
            └── PushNotification.cs

src/{Project}.Infrastructure/
└── Services/
    └── PushNotifications/
        ├── PushNotificationOptions.cs
        ├── FirebasePushSender.cs
        └── DependencyInjection.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/IPushNotificationSender.cs
namespace {Project}.Application.Common.Interfaces;

public interface IPushNotificationSender
{
    /// <summary>
    /// Send notification to a specific device token.
    /// </summary>
    Task<PushSendResult> SendToDeviceAsync(
        string deviceToken,
        PushNotification notification,
        CancellationToken ct = default);
    
    /// <summary>
    /// Send notification to multiple device tokens.
    /// </summary>
    Task<PushBatchResult> SendToDevicesAsync(
        IEnumerable<string> deviceTokens,
        PushNotification notification,
        CancellationToken ct = default);
    
    /// <summary>
    /// Send notification to a topic (all subscribed devices).
    /// </summary>
    Task<PushSendResult> SendToTopicAsync(
        string topic,
        PushNotification notification,
        CancellationToken ct = default);
    
    /// <summary>
    /// Subscribe device to a topic.
    /// </summary>
    Task SubscribeToTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken ct = default);
    
    /// <summary>
    /// Unsubscribe device from a topic.
    /// </summary>
    Task UnsubscribeFromTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken ct = default);
}

public record PushNotification
{
    public required string Title { get; init; }
    public required string Body { get; init; }
    public string? ImageUrl { get; init; }
    public string? ClickAction { get; init; } // URL or deep link
    public string? Icon { get; init; }
    public string? Sound { get; init; }
    public string? Tag { get; init; } // For notification grouping
    public int? Badge { get; init; } // iOS badge count
    public Dictionary<string, string> Data { get; init; } = new(); // Custom payload
    public PushPriority Priority { get; init; } = PushPriority.High;
    public TimeSpan? TimeToLive { get; init; }
}

public enum PushPriority
{
    Normal,
    High
}

public record PushSendResult
{
    public bool Success { get; init; }
    public string? MessageId { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
}

public record PushBatchResult
{
    public int SuccessCount { get; init; }
    public int FailureCount { get; init; }
    public IReadOnlyList<PushSendResult> Results { get; init; } = Array.Empty<PushSendResult>();
    public IReadOnlyList<string> InvalidTokens { get; init; } = Array.Empty<string>();
}
```

## Firebase Implementation

```csharp
// Infrastructure/Services/PushNotifications/FirebasePushSender.cs
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace {Project}.Infrastructure.Services.PushNotifications;

public class FirebasePushSender : IPushNotificationSender
{
    private readonly FirebaseMessaging _messaging;
    private readonly ILogger<FirebasePushSender> _logger;

    public FirebasePushSender(
        IOptions<PushNotificationOptions> options,
        ILogger<FirebasePushSender> logger)
    {
        _logger = logger;
        
        var opts = options.Value;
        
        if (FirebaseApp.DefaultInstance == null)
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(opts.Firebase.ServiceAccountKeyPath)
            });
        }
        
        _messaging = FirebaseMessaging.DefaultInstance;
    }

    public async Task<PushSendResult> SendToDeviceAsync(
        string deviceToken,
        PushNotification notification,
        CancellationToken ct = default)
    {
        var message = CreateMessage(notification);
        message.Token = deviceToken;

        try
        {
            var messageId = await _messaging.SendAsync(message, ct);
            
            _logger.LogInformation(
                "Push notification sent to device. MessageId: {MessageId}", 
                messageId);

            return new PushSendResult
            {
                Success = true,
                MessageId = messageId
            };
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogError(ex, 
                "Failed to send push notification to device: {Error}", 
                ex.MessagingErrorCode);

            return new PushSendResult
            {
                Success = false,
                ErrorCode = ex.MessagingErrorCode?.ToString(),
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<PushBatchResult> SendToDevicesAsync(
        IEnumerable<string> deviceTokens,
        PushNotification notification,
        CancellationToken ct = default)
    {
        var tokens = deviceTokens.ToList();
        var message = CreateMulticastMessage(notification, tokens);

        try
        {
            var response = await _messaging.SendEachForMulticastAsync(message, ct);
            
            var invalidTokens = new List<string>();
            var results = new List<PushSendResult>();
            
            for (int i = 0; i < response.Responses.Count; i++)
            {
                var sendResponse = response.Responses[i];
                
                if (sendResponse.IsSuccess)
                {
                    results.Add(new PushSendResult
                    {
                        Success = true,
                        MessageId = sendResponse.MessageId
                    });
                }
                else
                {
                    var exception = sendResponse.Exception as FirebaseMessagingException;
                    
                    // Track invalid tokens for cleanup
                    if (exception?.MessagingErrorCode == MessagingErrorCode.Unregistered)
                    {
                        invalidTokens.Add(tokens[i]);
                    }
                    
                    results.Add(new PushSendResult
                    {
                        Success = false,
                        ErrorCode = exception?.MessagingErrorCode?.ToString(),
                        ErrorMessage = sendResponse.Exception?.Message
                    });
                }
            }

            _logger.LogInformation(
                "Push batch sent: {Success} succeeded, {Failure} failed, {Invalid} invalid tokens",
                response.SuccessCount, response.FailureCount, invalidTokens.Count);

            return new PushBatchResult
            {
                SuccessCount = response.SuccessCount,
                FailureCount = response.FailureCount,
                Results = results,
                InvalidTokens = invalidTokens
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send batch push notification");
            throw;
        }
    }

    public async Task<PushSendResult> SendToTopicAsync(
        string topic,
        PushNotification notification,
        CancellationToken ct = default)
    {
        var message = CreateMessage(notification);
        message.Topic = topic;

        try
        {
            var messageId = await _messaging.SendAsync(message, ct);
            
            _logger.LogInformation(
                "Push notification sent to topic {Topic}. MessageId: {MessageId}", 
                topic, messageId);

            return new PushSendResult
            {
                Success = true,
                MessageId = messageId
            };
        }
        catch (FirebaseMessagingException ex)
        {
            _logger.LogError(ex, "Failed to send push notification to topic {Topic}", topic);

            return new PushSendResult
            {
                Success = false,
                ErrorCode = ex.MessagingErrorCode?.ToString(),
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task SubscribeToTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken ct = default)
    {
        await _messaging.SubscribeToTopicAsync(new[] { deviceToken }, topic);
        _logger.LogInformation("Device subscribed to topic {Topic}", topic);
    }

    public async Task UnsubscribeFromTopicAsync(
        string deviceToken,
        string topic,
        CancellationToken ct = default)
    {
        await _messaging.UnsubscribeFromTopicAsync(new[] { deviceToken }, topic);
        _logger.LogInformation("Device unsubscribed from topic {Topic}", topic);
    }

    private static Message CreateMessage(PushNotification notification) =>
        new()
        {
            Notification = new Notification
            {
                Title = notification.Title,
                Body = notification.Body,
                ImageUrl = notification.ImageUrl
            },
            Data = notification.Data,
            Android = new AndroidConfig
            {
                Priority = notification.Priority == PushPriority.High 
                    ? Priority.High 
                    : Priority.Normal,
                Notification = new AndroidNotification
                {
                    Icon = notification.Icon,
                    Sound = notification.Sound ?? "default",
                    Tag = notification.Tag,
                    ClickAction = notification.ClickAction
                },
                TimeToLive = notification.TimeToLive
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Badge = notification.Badge,
                    Sound = notification.Sound ?? "default"
                }
            },
            Webpush = new WebpushConfig
            {
                Notification = new WebpushNotification
                {
                    Title = notification.Title,
                    Body = notification.Body,
                    Icon = notification.Icon,
                    Tag = notification.Tag
                },
                FcmOptions = new WebpushFcmOptions
                {
                    Link = notification.ClickAction
                }
            }
        };

    private static MulticastMessage CreateMulticastMessage(
        PushNotification notification,
        List<string> tokens) =>
        new()
        {
            Tokens = tokens,
            Notification = new Notification
            {
                Title = notification.Title,
                Body = notification.Body,
                ImageUrl = notification.ImageUrl
            },
            Data = notification.Data,
            Android = new AndroidConfig
            {
                Priority = notification.Priority == PushPriority.High 
                    ? Priority.High 
                    : Priority.Normal
            }
        };
}
```

## Dependency Injection

```csharp
// Infrastructure/Services/PushNotifications/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.PushNotifications;

public static class PushNotificationExtensions
{
    public static IServiceCollection AddPushNotificationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<PushNotificationOptions>(
            configuration.GetSection(PushNotificationOptions.SectionName));
        
        services.AddSingleton<IPushNotificationSender, FirebasePushSender>();
        
        return services;
    }
}

public class PushNotificationOptions
{
    public const string SectionName = "PushNotifications";
    
    public string Provider { get; set; } = "Firebase";
    public FirebaseOptions Firebase { get; set; } = new();
}

public class FirebaseOptions
{
    public string ServiceAccountKeyPath { get; set; } = "firebase-service-account.json";
}
```

## appsettings.json

```json
{
  "PushNotifications": {
    "Provider": "Firebase",
    "Firebase": {
      "ServiceAccountKeyPath": "firebase-service-account.json"
    }
  }
}
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| Firebase | `FirebaseAdmin` | `dotnet add package FirebaseAdmin` |

## Usage Example

```csharp
public class NotifyUserHandler : INotificationHandler<OrderCompletedEvent>
{
    private readonly IPushNotificationSender _pushSender;
    private readonly IUserRepository _users;
    
    public async Task Handle(OrderCompletedEvent notification, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(notification.UserId, ct);
        
        if (user?.DeviceToken == null) return;
        
        await _pushSender.SendToDeviceAsync(user.DeviceToken, new PushNotification
        {
            Title = "Order Complete!",
            Body = $"Your order #{notification.OrderNumber} has been completed.",
            Data = new Dictionary<string, string>
            {
                ["orderId"] = notification.OrderId.ToString(),
                ["type"] = "order_complete"
            },
            ClickAction = $"/orders/{notification.OrderId}"
        }, ct);
    }
}
```

---

**After generating, remind user to:**
1. Add `FirebaseAdmin` NuGet package
2. Download Firebase service account key from Firebase Console
3. Configure service account key path in appsettings
4. Register services: `builder.Services.AddPushNotificationServices(builder.Configuration);`
5. Set up Firebase in your web/mobile apps
