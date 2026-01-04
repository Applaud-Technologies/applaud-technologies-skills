# Document Generation Integration Guide

## Overview

Add PDF document generation capabilities for reports, invoices, and other documents.

**Interface**: `IDocumentGenerator`
**Providers**: QuestPDF (recommended - free and modern)

## Requirements Gathering

### Question 1: Document Types
"What types of documents do you need to generate?
- **reports** - Data reports with tables and charts
- **invoices** - Invoice/receipt generation
- **letters** - Letter templates
- **generic** - Custom document generation

Example: 'invoices, reports' or 'generic'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        └── IDocumentGenerator.cs

src/{Project}.Infrastructure/
└── Services/
    └── Documents/
        ├── DocumentOptions.cs
        ├── QuestPdfDocumentGenerator.cs
        ├── Templates/
        │   ├── InvoiceTemplate.cs
        │   └── ReportTemplate.cs
        └── DependencyInjection.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/IDocumentGenerator.cs
namespace {Project}.Application.Common.Interfaces;

public interface IDocumentGenerator
{
    /// <summary>
    /// Generate a PDF document from a template.
    /// </summary>
    Task<byte[]> GeneratePdfAsync<TData>(
        string templateName,
        TData data,
        CancellationToken ct = default);
    
    /// <summary>
    /// Generate a PDF document and save to storage.
    /// </summary>
    Task<string> GenerateAndSaveAsync<TData>(
        string templateName,
        TData data,
        string fileName,
        CancellationToken ct = default);
}
```

## QuestPDF Implementation

```csharp
// Infrastructure/Services/Documents/QuestPdfDocumentGenerator.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace {Project}.Infrastructure.Services.Documents;

public class QuestPdfDocumentGenerator : IDocumentGenerator
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<QuestPdfDocumentGenerator> _logger;

    public QuestPdfDocumentGenerator(
        IServiceProvider serviceProvider,
        IFileStorage fileStorage,
        ILogger<QuestPdfDocumentGenerator> logger)
    {
        _serviceProvider = serviceProvider;
        _fileStorage = fileStorage;
        _logger = logger;
        
        // Required for QuestPDF Community License
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<byte[]> GeneratePdfAsync<TData>(
        string templateName,
        TData data,
        CancellationToken ct = default)
    {
        var template = GetTemplate<TData>(templateName);
        template.SetData(data);
        
        var document = Document.Create(template.Compose);
        var bytes = document.GeneratePdf();
        
        _logger.LogInformation(
            "Generated PDF document: {Template}, Size: {Size} bytes", 
            templateName, bytes.Length);
        
        return Task.FromResult(bytes);
    }

    public async Task<string> GenerateAndSaveAsync<TData>(
        string templateName,
        TData data,
        string fileName,
        CancellationToken ct = default)
    {
        var bytes = await GeneratePdfAsync(templateName, data, ct);
        
        using var stream = new MemoryStream(bytes);
        var result = await _fileStorage.UploadAsync(new FileUploadRequest
        {
            Content = stream,
            FileName = fileName,
            ContentType = "application/pdf",
            Directory = "documents"
        }, ct);
        
        return result.Path;
    }

    private IDocumentTemplate<TData> GetTemplate<TData>(string templateName)
    {
        var templateType = templateName.ToLowerInvariant() switch
        {
            "invoice" => typeof(InvoiceTemplate),
            "report" => typeof(ReportTemplate),
            _ => throw new ArgumentException($"Unknown template: {templateName}")
        };
        
        return (IDocumentTemplate<TData>)_serviceProvider.GetRequiredService(templateType);
    }
}

public interface IDocumentTemplate<TData>
{
    void SetData(TData data);
    void Compose(IDocumentContainer container);
}
```

## Invoice Template Example

```csharp
// Infrastructure/Services/Documents/Templates/InvoiceTemplate.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace {Project}.Infrastructure.Services.Documents.Templates;

public class InvoiceData
{
    public required string InvoiceNumber { get; init; }
    public required DateTime InvoiceDate { get; init; }
    public required DateTime DueDate { get; init; }
    public required string CustomerName { get; init; }
    public required string CustomerAddress { get; init; }
    public required IReadOnlyList<InvoiceLineItem> Items { get; init; }
    public decimal Subtotal { get; init; }
    public decimal Tax { get; init; }
    public decimal Total { get; init; }
    public string? Notes { get; init; }
}

public record InvoiceLineItem(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Total
);

public class InvoiceTemplate : IDocumentTemplate<InvoiceData>
{
    private InvoiceData _data = null!;
    
    public void SetData(InvoiceData data) => _data = data;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(50);
            page.DefaultTextStyle(x => x.FontSize(10));
            
            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item()
                    .Text("INVOICE")
                    .FontSize(24)
                    .Bold()
                    .FontColor(Colors.Blue.Medium);
                    
                column.Item().Text($"Invoice #: {_data.InvoiceNumber}");
                column.Item().Text($"Date: {_data.InvoiceDate:MMMM dd, yyyy}");
                column.Item().Text($"Due Date: {_data.DueDate:MMMM dd, yyyy}");
            });

            row.RelativeItem().Column(column =>
            {
                column.Item().AlignRight().Text("Bill To:").Bold();
                column.Item().AlignRight().Text(_data.CustomerName);
                column.Item().AlignRight().Text(_data.CustomerAddress);
            });
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            column.Item().Element(ComposeTable);
            column.Item().PaddingTop(20).Element(ComposeTotals);
            
            if (!string.IsNullOrEmpty(_data.Notes))
            {
                column.Item().PaddingTop(20).Element(ComposeNotes);
            }
        });
    }

    private void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3); // Description
                columns.RelativeColumn();  // Quantity
                columns.RelativeColumn();  // Unit Price
                columns.RelativeColumn();  // Total
            });

            table.Header(header =>
            {
                header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Description").Bold();
                header.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Qty").Bold();
                header.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Unit Price").Bold();
                header.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Total").Bold();
            });

            foreach (var item in _data.Items)
            {
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Description);
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text(item.Quantity.ToString());
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${item.UnitPrice:N2}");
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${item.Total:N2}");
            }
        });
    }

    private void ComposeTotals(IContainer container)
    {
        container.AlignRight().Width(200).Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Subtotal:");
                row.RelativeItem().AlignRight().Text($"${_data.Subtotal:N2}");
            });
            
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Tax:");
                row.RelativeItem().AlignRight().Text($"${_data.Tax:N2}");
            });
            
            column.Item().PaddingTop(5).BorderTop(1).Row(row =>
            {
                row.RelativeItem().Text("Total:").Bold();
                row.RelativeItem().AlignRight().Text($"${_data.Total:N2}").Bold();
            });
        });
    }

    private void ComposeNotes(IContainer container)
    {
        container.Background(Colors.Grey.Lighten4).Padding(10).Column(column =>
        {
            column.Item().Text("Notes:").Bold();
            column.Item().Text(_data.Notes);
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.Span("Thank you for your business!");
        });
    }
}
```

## Dependency Injection

```csharp
// Infrastructure/Services/Documents/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Documents;

public static class DocumentServiceExtensions
{
    public static IServiceCollection AddDocumentServices(
        this IServiceCollection services)
    {
        services.AddScoped<IDocumentGenerator, QuestPdfDocumentGenerator>();
        
        // Register templates
        services.AddScoped<InvoiceTemplate>();
        services.AddScoped<ReportTemplate>();
        
        return services;
    }
}
```

## Required NuGet Packages

| Package | Command |
|---------|---------|
| QuestPDF | `dotnet add package QuestPDF` |

## Usage Example

```csharp
public class GenerateInvoiceHandler : IRequestHandler<GenerateInvoiceCommand, byte[]>
{
    private readonly IDocumentGenerator _documentGenerator;
    
    public async Task<byte[]> Handle(GenerateInvoiceCommand request, CancellationToken ct)
    {
        var invoiceData = new InvoiceData
        {
            InvoiceNumber = request.InvoiceNumber,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            CustomerName = request.CustomerName,
            CustomerAddress = request.CustomerAddress,
            Items = request.Items.Select(i => new InvoiceLineItem(
                i.Description, i.Quantity, i.UnitPrice, i.Quantity * i.UnitPrice
            )).ToList(),
            Subtotal = request.Items.Sum(i => i.Quantity * i.UnitPrice),
            Tax = request.TaxAmount,
            Total = request.TotalAmount
        };
        
        return await _documentGenerator.GeneratePdfAsync("invoice", invoiceData, ct);
    }
}

// Return as file download
[HttpGet("{id}/pdf")]
public async Task<IActionResult> DownloadInvoice(int id, CancellationToken ct)
{
    var pdfBytes = await _mediator.Send(new GenerateInvoiceCommand(id), ct);
    return File(pdfBytes, "application/pdf", $"invoice-{id}.pdf");
}
```

---

**After generating, remind user to:**
1. Add `QuestPDF` NuGet package
2. Register services: `builder.Services.AddDocumentServices();`
3. QuestPDF Community license is free for revenue under $1M
4. Create custom templates for your document types
