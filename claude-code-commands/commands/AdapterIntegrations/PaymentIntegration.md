# Payment Integration Guide

## Overview

Add payment processing capabilities with support for charges, subscriptions, and webhooks.

**Interface**: `IPaymentProcessor`
**Providers**: Stripe (recommended), PayPal

## Requirements Gathering

### Question 1: Provider Selection
"Which payment provider do you want to implement?
1. **stripe** - Full-featured payment API (recommended)
2. **paypal** - PayPal payments

Example: 'stripe'"

### Question 2: Features Needed
"Which payment features do you need?
- **charges** - One-time payments (default)
- **subscriptions** - Recurring billing
- **customers** - Customer management
- **refunds** - Refund processing
- **webhooks** - Payment event webhooks

Example: 'charges, customers, webhooks' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── IPaymentProcessor.cs
        └── Payments/
            ├── PaymentIntent.cs
            ├── Customer.cs
            ├── Subscription.cs
            └── PaymentWebhookEvent.cs

src/{Project}.Infrastructure/
└── Services/
    └── Payments/
        ├── PaymentOptions.cs
        ├── StripePaymentProcessor.cs
        └── DependencyInjection.cs

src/{Project}.Api/
└── Controllers/
    └── WebhooksController.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/IPaymentProcessor.cs
namespace {Project}.Application.Common.Interfaces;

public interface IPaymentProcessor
{
    // Payment Intents (One-time payments)
    Task<PaymentIntentResult> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request,
        CancellationToken ct = default);
    
    Task<PaymentIntentResult> ConfirmPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default);
    
    Task<PaymentIntentResult> CancelPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default);
    
    // Customers
    Task<PaymentCustomer> CreateCustomerAsync(
        CreateCustomerRequest request,
        CancellationToken ct = default);
    
    Task<PaymentCustomer?> GetCustomerAsync(
        string customerId,
        CancellationToken ct = default);
    
    Task<PaymentCustomer> UpdateCustomerAsync(
        string customerId,
        UpdateCustomerRequest request,
        CancellationToken ct = default);
    
    // Payment Methods
    Task<PaymentMethod> AttachPaymentMethodAsync(
        string customerId,
        string paymentMethodId,
        CancellationToken ct = default);
    
    Task DetachPaymentMethodAsync(
        string paymentMethodId,
        CancellationToken ct = default);
    
    // Subscriptions
    Task<SubscriptionResult> CreateSubscriptionAsync(
        CreateSubscriptionRequest request,
        CancellationToken ct = default);
    
    Task<SubscriptionResult> CancelSubscriptionAsync(
        string subscriptionId,
        bool cancelImmediately = false,
        CancellationToken ct = default);
    
    Task<SubscriptionResult?> GetSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default);
    
    // Refunds
    Task<RefundResult> CreateRefundAsync(
        CreateRefundRequest request,
        CancellationToken ct = default);
    
    // Webhooks
    PaymentWebhookEvent? ParseWebhookEvent(
        string payload,
        string signature);
}
```

```csharp
// Application/Common/Interfaces/Payments/PaymentIntent.cs
namespace {Project}.Application.Common.Interfaces.Payments;

public record CreatePaymentIntentRequest
{
    public required long Amount { get; init; } // In cents
    public required string Currency { get; init; } // "usd", "eur", etc.
    public string? CustomerId { get; init; }
    public string? PaymentMethodId { get; init; }
    public bool AutoConfirm { get; init; } = false;
    public string? Description { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public string? ReceiptEmail { get; init; }
    public string? StatementDescriptor { get; init; }
}

public record PaymentIntentResult
{
    public required string Id { get; init; }
    public required string Status { get; init; } // requires_payment_method, requires_confirmation, succeeded, etc.
    public required long Amount { get; init; }
    public required string Currency { get; init; }
    public string? ClientSecret { get; init; } // For frontend confirmation
    public string? CustomerId { get; init; }
    public string? PaymentMethodId { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PaymentCustomer
{
    public required string Id { get; init; }
    public string? Email { get; init; }
    public string? Name { get; init; }
    public string? Phone { get; init; }
    public Dictionary<string, string> Metadata { get; init; } = new();
    public string? DefaultPaymentMethodId { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateCustomerRequest
{
    public string? Email { get; init; }
    public string? Name { get; init; }
    public string? Phone { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public string? PaymentMethodId { get; init; }
}

public record UpdateCustomerRequest
{
    public string? Email { get; init; }
    public string? Name { get; init; }
    public string? Phone { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public string? DefaultPaymentMethodId { get; init; }
}

public record PaymentMethod
{
    public required string Id { get; init; }
    public required string Type { get; init; } // card, bank_account, etc.
    public string? CustomerId { get; init; }
    public CardDetails? Card { get; init; }
}

public record CardDetails
{
    public string? Brand { get; init; } // visa, mastercard, etc.
    public string? Last4 { get; init; }
    public int? ExpMonth { get; init; }
    public int? ExpYear { get; init; }
}
```

```csharp
// Application/Common/Interfaces/Payments/Subscription.cs
namespace {Project}.Application.Common.Interfaces.Payments;

public record CreateSubscriptionRequest
{
    public required string CustomerId { get; init; }
    public required string PriceId { get; init; } // Stripe Price ID
    public string? PaymentMethodId { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public int? TrialPeriodDays { get; init; }
    public bool CancelAtPeriodEnd { get; init; } = false;
}

public record SubscriptionResult
{
    public required string Id { get; init; }
    public required string Status { get; init; } // active, past_due, canceled, etc.
    public required string CustomerId { get; init; }
    public required string PriceId { get; init; }
    public long? CurrentPeriodStart { get; init; }
    public long? CurrentPeriodEnd { get; init; }
    public bool CancelAtPeriodEnd { get; init; }
    public DateTime? CanceledAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateRefundRequest
{
    public required string PaymentIntentId { get; init; }
    public long? Amount { get; init; } // Partial refund amount in cents (null = full refund)
    public string? Reason { get; init; } // duplicate, fraudulent, requested_by_customer
    public Dictionary<string, string>? Metadata { get; init; }
}

public record RefundResult
{
    public required string Id { get; init; }
    public required string Status { get; init; } // succeeded, pending, failed
    public required long Amount { get; init; }
    public required string Currency { get; init; }
    public string? PaymentIntentId { get; init; }
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PaymentWebhookEvent
{
    public required string Id { get; init; }
    public required string Type { get; init; } // payment_intent.succeeded, customer.subscription.created, etc.
    public required object Data { get; init; }
    public DateTime CreatedAt { get; init; }
}
```

## Options Configuration

```csharp
// Infrastructure/Services/Payments/PaymentOptions.cs
namespace {Project}.Infrastructure.Services.Payments;

public class PaymentOptions
{
    public const string SectionName = "Payment";
    
    public string Provider { get; set; } = "Stripe";
    
    public StripeOptions Stripe { get; set; } = new();
}

public class StripeOptions
{
    public string SecretKey { get; set; } = "";
    public string PublishableKey { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
    public string? DefaultCurrency { get; set; } = "usd";
}
```

## Stripe Implementation

```csharp
// Infrastructure/Services/Payments/StripePaymentProcessor.cs
using Stripe;

namespace {Project}.Infrastructure.Services.Payments;

public class StripePaymentProcessor : IPaymentProcessor
{
    private readonly PaymentOptions _options;
    private readonly ILogger<StripePaymentProcessor> _logger;

    public StripePaymentProcessor(
        IOptions<PaymentOptions> options,
        ILogger<StripePaymentProcessor> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        StripeConfiguration.ApiKey = _options.Stripe.SecretKey;
    }

    #region Payment Intents
    
    public async Task<PaymentIntentResult> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request,
        CancellationToken ct = default)
    {
        var service = new PaymentIntentService();
        
        var options = new PaymentIntentCreateOptions
        {
            Amount = request.Amount,
            Currency = request.Currency,
            Customer = request.CustomerId,
            PaymentMethod = request.PaymentMethodId,
            Description = request.Description,
            ReceiptEmail = request.ReceiptEmail,
            StatementDescriptor = request.StatementDescriptor,
            Metadata = request.Metadata,
            Confirm = request.AutoConfirm
        };

        if (request.AutoConfirm && !string.IsNullOrEmpty(request.PaymentMethodId))
        {
            options.ReturnUrl = "https://yourapp.com/payment/complete"; // Configure as needed
        }

        try
        {
            var intent = await service.CreateAsync(options, cancellationToken: ct);
            
            _logger.LogInformation(
                "Payment intent created: {Id}, Amount: {Amount} {Currency}", 
                intent.Id, intent.Amount, intent.Currency);

            return MapToPaymentIntentResult(intent);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create payment intent");
            return new PaymentIntentResult
            {
                Id = "",
                Status = "failed",
                Amount = request.Amount,
                Currency = request.Currency,
                ErrorCode = ex.StripeError?.Code,
                ErrorMessage = ex.StripeError?.Message ?? ex.Message
            };
        }
    }

    public async Task<PaymentIntentResult> ConfirmPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default)
    {
        var service = new PaymentIntentService();
        var intent = await service.ConfirmAsync(paymentIntentId, cancellationToken: ct);
        return MapToPaymentIntentResult(intent);
    }

    public async Task<PaymentIntentResult> CancelPaymentIntentAsync(
        string paymentIntentId,
        CancellationToken ct = default)
    {
        var service = new PaymentIntentService();
        var intent = await service.CancelAsync(paymentIntentId, cancellationToken: ct);
        return MapToPaymentIntentResult(intent);
    }

    #endregion

    #region Customers

    public async Task<PaymentCustomer> CreateCustomerAsync(
        CreateCustomerRequest request,
        CancellationToken ct = default)
    {
        var service = new CustomerService();
        
        var options = new CustomerCreateOptions
        {
            Email = request.Email,
            Name = request.Name,
            Phone = request.Phone,
            Metadata = request.Metadata,
            PaymentMethod = request.PaymentMethodId
        };

        if (!string.IsNullOrEmpty(request.PaymentMethodId))
        {
            options.InvoiceSettings = new CustomerInvoiceSettingsOptions
            {
                DefaultPaymentMethod = request.PaymentMethodId
            };
        }

        var customer = await service.CreateAsync(options, cancellationToken: ct);
        
        _logger.LogInformation("Customer created: {Id}", customer.Id);
        
        return MapToPaymentCustomer(customer);
    }

    public async Task<PaymentCustomer?> GetCustomerAsync(
        string customerId,
        CancellationToken ct = default)
    {
        var service = new CustomerService();
        
        try
        {
            var customer = await service.GetAsync(customerId, cancellationToken: ct);
            return MapToPaymentCustomer(customer);
        }
        catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing")
        {
            return null;
        }
    }

    public async Task<PaymentCustomer> UpdateCustomerAsync(
        string customerId,
        UpdateCustomerRequest request,
        CancellationToken ct = default)
    {
        var service = new CustomerService();
        
        var options = new CustomerUpdateOptions
        {
            Email = request.Email,
            Name = request.Name,
            Phone = request.Phone,
            Metadata = request.Metadata
        };

        if (!string.IsNullOrEmpty(request.DefaultPaymentMethodId))
        {
            options.InvoiceSettings = new CustomerInvoiceSettingsOptions
            {
                DefaultPaymentMethod = request.DefaultPaymentMethodId
            };
        }

        var customer = await service.UpdateAsync(customerId, options, cancellationToken: ct);
        return MapToPaymentCustomer(customer);
    }

    #endregion

    #region Payment Methods

    public async Task<Interfaces.Payments.PaymentMethod> AttachPaymentMethodAsync(
        string customerId,
        string paymentMethodId,
        CancellationToken ct = default)
    {
        var service = new PaymentMethodService();
        
        var options = new PaymentMethodAttachOptions
        {
            Customer = customerId
        };

        var paymentMethod = await service.AttachAsync(
            paymentMethodId, 
            options, 
            cancellationToken: ct);
        
        return MapToPaymentMethod(paymentMethod);
    }

    public async Task DetachPaymentMethodAsync(
        string paymentMethodId,
        CancellationToken ct = default)
    {
        var service = new PaymentMethodService();
        await service.DetachAsync(paymentMethodId, cancellationToken: ct);
    }

    #endregion

    #region Subscriptions

    public async Task<SubscriptionResult> CreateSubscriptionAsync(
        CreateSubscriptionRequest request,
        CancellationToken ct = default)
    {
        var service = new SubscriptionService();
        
        var options = new SubscriptionCreateOptions
        {
            Customer = request.CustomerId,
            Items = new List<SubscriptionItemOptions>
            {
                new() { Price = request.PriceId }
            },
            DefaultPaymentMethod = request.PaymentMethodId,
            Metadata = request.Metadata,
            TrialPeriodDays = request.TrialPeriodDays,
            CancelAtPeriodEnd = request.CancelAtPeriodEnd,
            PaymentBehavior = "default_incomplete",
            PaymentSettings = new SubscriptionPaymentSettingsOptions
            {
                SaveDefaultPaymentMethod = "on_subscription"
            },
            Expand = new List<string> { "latest_invoice.payment_intent" }
        };

        var subscription = await service.CreateAsync(options, cancellationToken: ct);
        
        _logger.LogInformation(
            "Subscription created: {Id} for customer {CustomerId}", 
            subscription.Id, subscription.CustomerId);
        
        return MapToSubscriptionResult(subscription);
    }

    public async Task<SubscriptionResult> CancelSubscriptionAsync(
        string subscriptionId,
        bool cancelImmediately = false,
        CancellationToken ct = default)
    {
        var service = new SubscriptionService();

        if (cancelImmediately)
        {
            var subscription = await service.CancelAsync(subscriptionId, cancellationToken: ct);
            return MapToSubscriptionResult(subscription);
        }
        else
        {
            var options = new SubscriptionUpdateOptions
            {
                CancelAtPeriodEnd = true
            };
            var subscription = await service.UpdateAsync(subscriptionId, options, cancellationToken: ct);
            return MapToSubscriptionResult(subscription);
        }
    }

    public async Task<SubscriptionResult?> GetSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default)
    {
        var service = new SubscriptionService();
        
        try
        {
            var subscription = await service.GetAsync(subscriptionId, cancellationToken: ct);
            return MapToSubscriptionResult(subscription);
        }
        catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing")
        {
            return null;
        }
    }

    #endregion

    #region Refunds

    public async Task<RefundResult> CreateRefundAsync(
        CreateRefundRequest request,
        CancellationToken ct = default)
    {
        var service = new RefundService();
        
        var options = new RefundCreateOptions
        {
            PaymentIntent = request.PaymentIntentId,
            Amount = request.Amount,
            Reason = request.Reason,
            Metadata = request.Metadata
        };

        var refund = await service.CreateAsync(options, cancellationToken: ct);
        
        _logger.LogInformation(
            "Refund created: {Id} for payment intent {PaymentIntentId}", 
            refund.Id, request.PaymentIntentId);

        return new RefundResult
        {
            Id = refund.Id,
            Status = refund.Status,
            Amount = refund.Amount,
            Currency = refund.Currency,
            PaymentIntentId = refund.PaymentIntentId,
            Reason = refund.Reason,
            CreatedAt = refund.Created
        };
    }

    #endregion

    #region Webhooks

    public PaymentWebhookEvent? ParseWebhookEvent(string payload, string signature)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                payload,
                signature,
                _options.Stripe.WebhookSecret);

            return new PaymentWebhookEvent
            {
                Id = stripeEvent.Id,
                Type = stripeEvent.Type,
                Data = stripeEvent.Data.Object,
                CreatedAt = stripeEvent.Created
            };
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Failed to parse webhook event");
            return null;
        }
    }

    #endregion

    #region Mapping Helpers

    private static PaymentIntentResult MapToPaymentIntentResult(PaymentIntent intent) =>
        new()
        {
            Id = intent.Id,
            Status = intent.Status,
            Amount = intent.Amount,
            Currency = intent.Currency,
            ClientSecret = intent.ClientSecret,
            CustomerId = intent.CustomerId,
            PaymentMethodId = intent.PaymentMethodId,
            CreatedAt = intent.Created
        };

    private static PaymentCustomer MapToPaymentCustomer(Customer customer) =>
        new()
        {
            Id = customer.Id,
            Email = customer.Email,
            Name = customer.Name,
            Phone = customer.Phone,
            Metadata = customer.Metadata?.ToDictionary(x => x.Key, x => x.Value) ?? new(),
            DefaultPaymentMethodId = customer.InvoiceSettings?.DefaultPaymentMethodId,
            CreatedAt = customer.Created
        };

    private static Interfaces.Payments.PaymentMethod MapToPaymentMethod(Stripe.PaymentMethod pm) =>
        new()
        {
            Id = pm.Id,
            Type = pm.Type,
            CustomerId = pm.CustomerId,
            Card = pm.Card != null ? new CardDetails
            {
                Brand = pm.Card.Brand,
                Last4 = pm.Card.Last4,
                ExpMonth = (int)pm.Card.ExpMonth,
                ExpYear = (int)pm.Card.ExpYear
            } : null
        };

    private static SubscriptionResult MapToSubscriptionResult(Subscription sub) =>
        new()
        {
            Id = sub.Id,
            Status = sub.Status,
            CustomerId = sub.CustomerId,
            PriceId = sub.Items.Data.FirstOrDefault()?.Price?.Id ?? "",
            CurrentPeriodStart = sub.CurrentPeriodStart?.ToUnixTimeSeconds(),
            CurrentPeriodEnd = sub.CurrentPeriodEnd?.ToUnixTimeSeconds(),
            CancelAtPeriodEnd = sub.CancelAtPeriodEnd,
            CanceledAt = sub.CanceledAt,
            CreatedAt = sub.Created
        };

    #endregion
}
```

## Webhook Controller

```csharp
// Api/Controllers/WebhooksController.cs
[ApiController]
[Route("api/webhooks")]
public class PaymentWebhooksController : ControllerBase
{
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentWebhooksController> _logger;

    public PaymentWebhooksController(
        IPaymentProcessor paymentProcessor,
        IMediator mediator,
        ILogger<PaymentWebhooksController> logger)
    {
        _paymentProcessor = paymentProcessor;
        _mediator = mediator;
        _logger = logger;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripeWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        if (string.IsNullOrEmpty(signature))
            return BadRequest("Missing Stripe-Signature header");

        var webhookEvent = _paymentProcessor.ParseWebhookEvent(json, signature);
        
        if (webhookEvent == null)
            return BadRequest("Invalid webhook signature");

        _logger.LogInformation(
            "Received Stripe webhook: {Type} ({Id})", 
            webhookEvent.Type, webhookEvent.Id);

        // Handle different event types
        switch (webhookEvent.Type)
        {
            case "payment_intent.succeeded":
                await _mediator.Send(new PaymentSucceededCommand(webhookEvent));
                break;
                
            case "payment_intent.payment_failed":
                await _mediator.Send(new PaymentFailedCommand(webhookEvent));
                break;
                
            case "customer.subscription.created":
            case "customer.subscription.updated":
                await _mediator.Send(new SubscriptionUpdatedCommand(webhookEvent));
                break;
                
            case "customer.subscription.deleted":
                await _mediator.Send(new SubscriptionCanceledCommand(webhookEvent));
                break;
                
            case "invoice.payment_succeeded":
                await _mediator.Send(new InvoicePaidCommand(webhookEvent));
                break;
                
            case "invoice.payment_failed":
                await _mediator.Send(new InvoicePaymentFailedCommand(webhookEvent));
                break;
                
            default:
                _logger.LogDebug("Unhandled webhook type: {Type}", webhookEvent.Type);
                break;
        }

        return Ok();
    }
}
```

## Dependency Injection

```csharp
// Infrastructure/Services/Payments/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Payments;

public static class PaymentServiceExtensions
{
    public static IServiceCollection AddPaymentServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<PaymentOptions>(
            configuration.GetSection(PaymentOptions.SectionName));
        
        services.AddScoped<IPaymentProcessor, StripePaymentProcessor>();
        
        return services;
    }
}
```

## appsettings.json

```json
{
  "Payment": {
    "Provider": "Stripe",
    
    "Stripe": {
      "SecretKey": "sk_test_xxxx",
      "PublishableKey": "pk_test_xxxx",
      "WebhookSecret": "whsec_xxxx",
      "DefaultCurrency": "usd"
    }
  }
}
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| Stripe | `Stripe.net` | `dotnet add package Stripe.net` |

## Frontend Integration (React)

```typescript
// api/payments.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { amount: number; currency: string }) => {
      const response = await apiClient.post<{ clientSecret: string }>(
        '/api/payments/create-intent',
        data
      );
      return response.data;
    }
  });
};

// components/CheckoutForm.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/complete`,
      },
    });
    
    if (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}
```

## Usage Examples

```csharp
// One-time payment
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IPaymentProcessor _payments;
    
    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // Create payment intent
        var paymentIntent = await _payments.CreatePaymentIntentAsync(new CreatePaymentIntentRequest
        {
            Amount = request.TotalCents,
            Currency = "usd",
            CustomerId = request.StripeCustomerId,
            Metadata = new Dictionary<string, string>
            {
                ["orderId"] = request.OrderId.ToString()
            }
        }, ct);
        
        // Return client secret to frontend for payment confirmation
        return new OrderDto
        {
            OrderId = request.OrderId,
            ClientSecret = paymentIntent.ClientSecret
        };
    }
}

// Subscription
public class CreateSubscriptionHandler : IRequestHandler<CreateSubscriptionCommand>
{
    private readonly IPaymentProcessor _payments;
    
    public async Task Handle(CreateSubscriptionCommand request, CancellationToken ct)
    {
        var subscription = await _payments.CreateSubscriptionAsync(new CreateSubscriptionRequest
        {
            CustomerId = request.StripeCustomerId,
            PriceId = "price_xxxxx", // Your Stripe price ID
            TrialPeriodDays = 14
        }, ct);
        
        // Store subscription ID in your database
    }
}
```

---

**After generating, remind user to:**
1. Add `Stripe.net` NuGet package
2. Configure Stripe keys in appsettings (use user-secrets for development)
3. Register services: `builder.Services.AddPaymentServices(builder.Configuration);`
4. Set up Stripe webhook endpoint in Stripe Dashboard
5. Add `@stripe/stripe-js` and `@stripe/react-stripe-js` to frontend
6. Configure webhook endpoint URL in Stripe Dashboard
