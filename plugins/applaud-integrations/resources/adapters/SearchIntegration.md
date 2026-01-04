# Search Integration Guide

## Overview

Add full-text search capabilities for fast, relevant search across your data.

**Interface**: `ISearchService<T>`
**Providers**: Elasticsearch (recommended for self-hosted), Algolia (managed service)

## Requirements Gathering

### Question 1: Provider Selection
"Which search provider do you want to implement?
1. **elasticsearch** - Self-hosted or Elastic Cloud
2. **algolia** - Managed search service

Example: 'elasticsearch'"

### Question 2: Features Needed
"Which search features do you need?
- **basic** - Index, search, delete (default)
- **facets** - Faceted/filtered search
- **suggest** - Autocomplete/suggestions
- **highlight** - Search result highlighting
- **geo** - Geospatial search

Example: 'basic, facets, suggest' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── ISearchService.cs
        └── Search/
            ├── SearchQuery.cs
            ├── SearchResult.cs
            └── SearchDocument.cs

src/{Project}.Infrastructure/
└── Services/
    └── Search/
        ├── SearchOptions.cs
        ├── ElasticsearchService.cs
        ├── AlgoliaSearchService.cs
        └── DependencyInjection.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/ISearchService.cs
namespace {Project}.Application.Common.Interfaces;

public interface ISearchService<TDocument> where TDocument : class, ISearchDocument
{
    /// <summary>
    /// Index a single document.
    /// </summary>
    Task IndexAsync(TDocument document, CancellationToken ct = default);
    
    /// <summary>
    /// Index multiple documents in batch.
    /// </summary>
    Task IndexManyAsync(IEnumerable<TDocument> documents, CancellationToken ct = default);
    
    /// <summary>
    /// Search for documents.
    /// </summary>
    Task<SearchResult<TDocument>> SearchAsync(
        SearchQuery query, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Get autocomplete suggestions.
    /// </summary>
    Task<IReadOnlyList<string>> SuggestAsync(
        string prefix,
        string field,
        int maxSuggestions = 10,
        CancellationToken ct = default);
    
    /// <summary>
    /// Delete a document by ID.
    /// </summary>
    Task DeleteAsync(string id, CancellationToken ct = default);
    
    /// <summary>
    /// Delete multiple documents.
    /// </summary>
    Task DeleteManyAsync(IEnumerable<string> ids, CancellationToken ct = default);
    
    /// <summary>
    /// Check if a document exists.
    /// </summary>
    Task<bool> ExistsAsync(string id, CancellationToken ct = default);
}

public interface ISearchDocument
{
    string Id { get; }
}
```

```csharp
// Application/Common/Interfaces/Search/SearchQuery.cs
namespace {Project}.Application.Common.Interfaces.Search;

public record SearchQuery
{
    /// <summary>
    /// Search text query.
    /// </summary>
    public string? Text { get; init; }
    
    /// <summary>
    /// Fields to search in (null = all fields).
    /// </summary>
    public IReadOnlyList<string>? SearchFields { get; init; }
    
    /// <summary>
    /// Filter conditions.
    /// </summary>
    public IReadOnlyList<SearchFilter>? Filters { get; init; }
    
    /// <summary>
    /// Facets to compute.
    /// </summary>
    public IReadOnlyList<string>? Facets { get; init; }
    
    /// <summary>
    /// Sort order.
    /// </summary>
    public IReadOnlyList<SearchSort>? Sort { get; init; }
    
    /// <summary>
    /// Number of results to skip (for pagination).
    /// </summary>
    public int Skip { get; init; } = 0;
    
    /// <summary>
    /// Number of results to return.
    /// </summary>
    public int Take { get; init; } = 20;
    
    /// <summary>
    /// Enable highlighting in results.
    /// </summary>
    public bool Highlight { get; init; } = false;
    
    /// <summary>
    /// Fields to highlight.
    /// </summary>
    public IReadOnlyList<string>? HighlightFields { get; init; }
}

public record SearchFilter(
    string Field,
    SearchFilterOperator Operator,
    object Value
);

public enum SearchFilterOperator
{
    Equals,
    NotEquals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Contains,
    In,
    Range
}

public record SearchSort(
    string Field,
    bool Descending = false
);
```

```csharp
// Application/Common/Interfaces/Search/SearchResult.cs
namespace {Project}.Application.Common.Interfaces.Search;

public record SearchResult<TDocument>
{
    public IReadOnlyList<SearchHit<TDocument>> Hits { get; init; } = Array.Empty<SearchHit<TDocument>>();
    public long TotalCount { get; init; }
    public IReadOnlyDictionary<string, IReadOnlyList<FacetValue>> Facets { get; init; } 
        = new Dictionary<string, IReadOnlyList<FacetValue>>();
    public TimeSpan Took { get; init; }
}

public record SearchHit<TDocument>
{
    public required TDocument Document { get; init; }
    public double Score { get; init; }
    public IReadOnlyDictionary<string, IReadOnlyList<string>> Highlights { get; init; } 
        = new Dictionary<string, IReadOnlyList<string>>();
}

public record FacetValue(string Value, long Count);
```

## Elasticsearch Implementation

```csharp
// Infrastructure/Services/Search/ElasticsearchService.cs
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace {Project}.Infrastructure.Services.Search;

public class ElasticsearchService<TDocument> : ISearchService<TDocument> 
    where TDocument : class, ISearchDocument
{
    private readonly ElasticsearchClient _client;
    private readonly string _indexName;
    private readonly ILogger<ElasticsearchService<TDocument>> _logger;

    public ElasticsearchService(
        IOptions<SearchOptions> options,
        ILogger<ElasticsearchService<TDocument>> logger)
    {
        _logger = logger;
        _indexName = GetIndexName();
        
        var settings = new ElasticsearchClientSettings(new Uri(options.Value.Elasticsearch.Url));
        
        if (!string.IsNullOrEmpty(options.Value.Elasticsearch.ApiKey))
        {
            settings.Authentication(new ApiKey(options.Value.Elasticsearch.ApiKey));
        }
        else if (!string.IsNullOrEmpty(options.Value.Elasticsearch.Username))
        {
            settings.Authentication(new BasicAuthentication(
                options.Value.Elasticsearch.Username,
                options.Value.Elasticsearch.Password));
        }
        
        _client = new ElasticsearchClient(settings);
    }

    public async Task IndexAsync(TDocument document, CancellationToken ct = default)
    {
        var response = await _client.IndexAsync(document, idx => idx
            .Index(_indexName)
            .Id(document.Id), ct);

        if (!response.IsValidResponse)
        {
            _logger.LogError("Failed to index document {Id}: {Error}", 
                document.Id, response.DebugInformation);
            throw new SearchException($"Failed to index document: {response.DebugInformation}");
        }

        _logger.LogDebug("Indexed document {Id} to {Index}", document.Id, _indexName);
    }

    public async Task IndexManyAsync(IEnumerable<TDocument> documents, CancellationToken ct = default)
    {
        var response = await _client.BulkAsync(b => b
            .Index(_indexName)
            .IndexMany(documents), ct);

        if (response.Errors)
        {
            var errorCount = response.ItemsWithErrors.Count();
            _logger.LogError("Bulk indexing had {ErrorCount} errors", errorCount);
        }

        _logger.LogInformation("Bulk indexed {Count} documents to {Index}", 
            documents.Count(), _indexName);
    }

    public async Task<SearchResult<TDocument>> SearchAsync(
        SearchQuery query, 
        CancellationToken ct = default)
    {
        var searchRequest = new SearchRequest(_indexName)
        {
            From = query.Skip,
            Size = query.Take,
            Query = BuildQuery(query),
            Sort = BuildSort(query.Sort),
            Highlight = query.Highlight ? BuildHighlight(query.HighlightFields) : null,
            Aggregations = BuildAggregations(query.Facets)
        };

        var response = await _client.SearchAsync<TDocument>(searchRequest, ct);

        if (!response.IsValidResponse)
        {
            _logger.LogError("Search failed: {Error}", response.DebugInformation);
            throw new SearchException($"Search failed: {response.DebugInformation}");
        }

        return new SearchResult<TDocument>
        {
            Hits = response.Hits.Select(h => new SearchHit<TDocument>
            {
                Document = h.Source!,
                Score = h.Score ?? 0,
                Highlights = h.Highlight?.ToDictionary(
                    kvp => kvp.Key,
                    kvp => (IReadOnlyList<string>)kvp.Value.ToList()
                ) ?? new Dictionary<string, IReadOnlyList<string>>()
            }).ToList(),
            TotalCount = response.Total,
            Facets = ExtractFacets(response.Aggregations),
            Took = TimeSpan.FromMilliseconds(response.Took)
        };
    }

    public async Task<IReadOnlyList<string>> SuggestAsync(
        string prefix,
        string field,
        int maxSuggestions = 10,
        CancellationToken ct = default)
    {
        var response = await _client.SearchAsync<TDocument>(s => s
            .Index(_indexName)
            .Size(0)
            .Suggest(su => su
                .Suggesters(sug => sug
                    .Add("suggestions", sg => sg
                        .Prefix(prefix)
                        .Completion(c => c
                            .Field(field)
                            .Size(maxSuggestions)
                            .SkipDuplicates(true))))), ct);

        if (!response.IsValidResponse)
            return Array.Empty<string>();

        return response.Suggest?["suggestions"]
            .SelectMany(s => s.Options.Select(o => o.Text))
            .ToList() ?? new List<string>();
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await _client.DeleteAsync(_indexName, id, ct);
        _logger.LogDebug("Deleted document {Id} from {Index}", id, _indexName);
    }

    public async Task DeleteManyAsync(IEnumerable<string> ids, CancellationToken ct = default)
    {
        await _client.BulkAsync(b => b
            .Index(_indexName)
            .DeleteMany<TDocument>(ids.Select(id => new TDocument { Id = id })), ct);
    }

    public async Task<bool> ExistsAsync(string id, CancellationToken ct = default)
    {
        var response = await _client.ExistsAsync(_indexName, id, ct);
        return response.Exists;
    }

    private Query BuildQuery(SearchQuery query)
    {
        var queries = new List<Query>();

        // Text search
        if (!string.IsNullOrWhiteSpace(query.Text))
        {
            if (query.SearchFields?.Any() == true)
            {
                queries.Add(new MultiMatchQuery
                {
                    Query = query.Text,
                    Fields = query.SearchFields.Select(f => (Field)f).ToArray(),
                    Type = TextQueryType.BestFields,
                    Fuzziness = new Fuzziness("AUTO")
                });
            }
            else
            {
                queries.Add(new QueryStringQuery
                {
                    Query = query.Text,
                    DefaultOperator = Operator.And
                });
            }
        }

        // Filters
        if (query.Filters?.Any() == true)
        {
            foreach (var filter in query.Filters)
            {
                queries.Add(BuildFilterQuery(filter));
            }
        }

        if (!queries.Any())
            return new MatchAllQuery();

        return new BoolQuery { Must = queries };
    }

    private Query BuildFilterQuery(SearchFilter filter)
    {
        return filter.Operator switch
        {
            SearchFilterOperator.Equals => new TermQuery(filter.Field) { Value = filter.Value?.ToString() },
            SearchFilterOperator.In => new TermsQuery
            {
                Field = filter.Field,
                Terms = new TermsQueryField((filter.Value as IEnumerable<object>)?.Select(v => FieldValue.String(v.ToString()!)))
            },
            SearchFilterOperator.GreaterThan => new RangeQuery(filter.Field) { Gt = filter.Value },
            SearchFilterOperator.GreaterThanOrEqual => new RangeQuery(filter.Field) { Gte = filter.Value },
            SearchFilterOperator.LessThan => new RangeQuery(filter.Field) { Lt = filter.Value },
            SearchFilterOperator.LessThanOrEqual => new RangeQuery(filter.Field) { Lte = filter.Value },
            SearchFilterOperator.Contains => new WildcardQuery(filter.Field) { Value = $"*{filter.Value}*" },
            _ => new MatchAllQuery()
        };
    }

    private IList<SortOptions>? BuildSort(IReadOnlyList<SearchSort>? sorts)
    {
        if (sorts == null || !sorts.Any())
            return null;

        return sorts.Select(s => SortOptions.Field(s.Field, new FieldSort
        {
            Order = s.Descending ? SortOrder.Desc : SortOrder.Asc
        })).ToList();
    }

    private Highlight? BuildHighlight(IReadOnlyList<string>? fields)
    {
        return new Highlight
        {
            Fields = (fields ?? new[] { "*" }).ToDictionary(
                f => (Field)f, 
                _ => new HighlightField())
        };
    }

    private IDictionary<string, Aggregation>? BuildAggregations(IReadOnlyList<string>? facets)
    {
        if (facets == null || !facets.Any())
            return null;

        return facets.ToDictionary(
            f => f,
            f => (Aggregation)new TermsAggregation(f) { Field = f, Size = 50 });
    }

    private IReadOnlyDictionary<string, IReadOnlyList<FacetValue>> ExtractFacets(
        AggregateDictionary? aggregations)
    {
        if (aggregations == null)
            return new Dictionary<string, IReadOnlyList<FacetValue>>();

        var facets = new Dictionary<string, IReadOnlyList<FacetValue>>();

        foreach (var (key, agg) in aggregations)
        {
            if (agg is StringTermsAggregate termsAgg)
            {
                facets[key] = termsAgg.Buckets
                    .Select(b => new FacetValue(b.Key.ToString()!, b.DocCount))
                    .ToList();
            }
        }

        return facets;
    }

    private static string GetIndexName() =>
        typeof(TDocument).Name.ToLowerInvariant() + "s";
}

public class SearchException : Exception
{
    public SearchException(string message) : base(message) { }
}
```

## Algolia Implementation

```csharp
// Infrastructure/Services/Search/AlgoliaSearchService.cs
using Algolia.Search.Clients;
using Algolia.Search.Models.Search;

namespace {Project}.Infrastructure.Services.Search;

public class AlgoliaSearchService<TDocument> : ISearchService<TDocument>
    where TDocument : class, ISearchDocument
{
    private readonly ISearchIndex _index;
    private readonly ILogger<AlgoliaSearchService<TDocument>> _logger;

    public AlgoliaSearchService(
        IOptions<SearchOptions> options,
        ILogger<AlgoliaSearchService<TDocument>> logger)
    {
        _logger = logger;
        
        var client = new SearchClient(
            options.Value.Algolia.ApplicationId,
            options.Value.Algolia.AdminApiKey);
            
        _index = client.InitIndex(GetIndexName());
    }

    public async Task IndexAsync(TDocument document, CancellationToken ct = default)
    {
        await _index.SaveObjectAsync(document, ct: ct);
        _logger.LogDebug("Indexed document {Id}", document.Id);
    }

    public async Task IndexManyAsync(IEnumerable<TDocument> documents, CancellationToken ct = default)
    {
        var docList = documents.ToList();
        await _index.SaveObjectsAsync(docList, ct: ct);
        _logger.LogInformation("Bulk indexed {Count} documents", docList.Count);
    }

    public async Task<SearchResult<TDocument>> SearchAsync(
        SearchQuery query, 
        CancellationToken ct = default)
    {
        var searchParams = new Query(query.Text ?? "")
        {
            HitsPerPage = query.Take,
            Page = query.Skip / query.Take,
            AttributesToHighlight = query.Highlight 
                ? query.HighlightFields?.ToList() ?? new List<string> { "*" }
                : new List<string>(),
            Facets = query.Facets?.ToList()
        };

        // Apply filters
        if (query.Filters?.Any() == true)
        {
            searchParams.Filters = string.Join(" AND ", 
                query.Filters.Select(BuildAlgoliaFilter));
        }

        var response = await _index.SearchAsync<TDocument>(searchParams, ct: ct);

        return new SearchResult<TDocument>
        {
            Hits = response.Hits.Select(h => new SearchHit<TDocument>
            {
                Document = h,
                Highlights = h.HighlightResult?.ToDictionary(
                    kvp => kvp.Key,
                    kvp => (IReadOnlyList<string>)new[] { kvp.Value.Value }
                ) ?? new Dictionary<string, IReadOnlyList<string>>()
            }).ToList(),
            TotalCount = response.NbHits,
            Facets = response.Facets?.ToDictionary(
                kvp => kvp.Key,
                kvp => (IReadOnlyList<FacetValue>)kvp.Value
                    .Select(f => new FacetValue(f.Key, f.Value))
                    .ToList()
            ) ?? new Dictionary<string, IReadOnlyList<FacetValue>>(),
            Took = TimeSpan.FromMilliseconds(response.ProcessingTimeMS)
        };
    }

    public async Task<IReadOnlyList<string>> SuggestAsync(
        string prefix,
        string field,
        int maxSuggestions = 10,
        CancellationToken ct = default)
    {
        var response = await _index.SearchAsync<TDocument>(new Query(prefix)
        {
            HitsPerPage = maxSuggestions,
            AttributesToRetrieve = new List<string> { field }
        }, ct: ct);

        return response.Hits
            .Select(h => h.GetType().GetProperty(field)?.GetValue(h)?.ToString())
            .Where(v => v != null)
            .Distinct()
            .ToList()!;
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await _index.DeleteObjectAsync(id, ct: ct);
        _logger.LogDebug("Deleted document {Id}", id);
    }

    public async Task DeleteManyAsync(IEnumerable<string> ids, CancellationToken ct = default)
    {
        await _index.DeleteObjectsAsync(ids.ToList(), ct: ct);
    }

    public async Task<bool> ExistsAsync(string id, CancellationToken ct = default)
    {
        try
        {
            await _index.GetObjectAsync<TDocument>(id, ct: ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private string BuildAlgoliaFilter(SearchFilter filter)
    {
        return filter.Operator switch
        {
            SearchFilterOperator.Equals => $"{filter.Field}:{filter.Value}",
            SearchFilterOperator.NotEquals => $"NOT {filter.Field}:{filter.Value}",
            SearchFilterOperator.GreaterThan => $"{filter.Field} > {filter.Value}",
            SearchFilterOperator.GreaterThanOrEqual => $"{filter.Field} >= {filter.Value}",
            SearchFilterOperator.LessThan => $"{filter.Field} < {filter.Value}",
            SearchFilterOperator.LessThanOrEqual => $"{filter.Field} <= {filter.Value}",
            SearchFilterOperator.In => $"({string.Join(" OR ", 
                (filter.Value as IEnumerable<object>)?.Select(v => $"{filter.Field}:{v}") ?? Array.Empty<string>())})",
            _ => ""
        };
    }

    private static string GetIndexName() =>
        typeof(TDocument).Name.ToLowerInvariant() + "s";
}
```

## Dependency Injection

```csharp
// Infrastructure/Services/Search/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Search;

public static class SearchServiceExtensions
{
    public static IServiceCollection AddSearchServices<TDocument>(
        this IServiceCollection services,
        IConfiguration configuration)
        where TDocument : class, ISearchDocument
    {
        services.Configure<SearchOptions>(
            configuration.GetSection(SearchOptions.SectionName));
        
        var options = configuration
            .GetSection(SearchOptions.SectionName)
            .Get<SearchOptions>();

        if (options?.Provider?.ToLowerInvariant() == "algolia")
        {
            services.AddScoped<ISearchService<TDocument>, AlgoliaSearchService<TDocument>>();
        }
        else
        {
            services.AddScoped<ISearchService<TDocument>, ElasticsearchService<TDocument>>();
        }
        
        return services;
    }
}

public class SearchOptions
{
    public const string SectionName = "Search";
    
    public string Provider { get; set; } = "Elasticsearch";
    public ElasticsearchOptions Elasticsearch { get; set; } = new();
    public AlgoliaOptions Algolia { get; set; } = new();
}

public class ElasticsearchOptions
{
    public string Url { get; set; } = "http://localhost:9200";
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? ApiKey { get; set; }
}

public class AlgoliaOptions
{
    public string ApplicationId { get; set; } = "";
    public string AdminApiKey { get; set; } = "";
    public string SearchApiKey { get; set; } = ""; // For frontend
}
```

## appsettings.json

```json
{
  "Search": {
    "Provider": "Elasticsearch",
    
    "Elasticsearch": {
      "Url": "http://localhost:9200",
      "Username": null,
      "Password": null,
      "ApiKey": null
    },
    
    "Algolia": {
      "ApplicationId": "YOUR_APP_ID",
      "AdminApiKey": "YOUR_ADMIN_KEY",
      "SearchApiKey": "YOUR_SEARCH_KEY"
    }
  }
}
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| Elasticsearch | `Elastic.Clients.Elasticsearch` | `dotnet add package Elastic.Clients.Elasticsearch` |
| Algolia | `Algolia.Search` | `dotnet add package Algolia.Search` |

## Example Search Document

```csharp
public class ProductSearchDocument : ISearchDocument
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Price { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; }
}
```

## Usage Example

```csharp
public class SearchProductsHandler : IRequestHandler<SearchProductsQuery, SearchResult<ProductSearchDocument>>
{
    private readonly ISearchService<ProductSearchDocument> _searchService;
    
    public async Task<SearchResult<ProductSearchDocument>> Handle(
        SearchProductsQuery request, 
        CancellationToken ct)
    {
        return await _searchService.SearchAsync(new SearchQuery
        {
            Text = request.SearchTerm,
            Filters = new[]
            {
                new SearchFilter("Category", SearchFilterOperator.Equals, request.Category)
            },
            Facets = new[] { "Category", "Tags" },
            Sort = new[] { new SearchSort("Price", request.SortDescending) },
            Skip = (request.Page - 1) * request.PageSize,
            Take = request.PageSize,
            Highlight = true
        }, ct);
    }
}

// Index on entity changes
public class ProductCreatedHandler : INotificationHandler<ProductCreatedEvent>
{
    private readonly ISearchService<ProductSearchDocument> _searchService;
    
    public async Task Handle(ProductCreatedEvent notification, CancellationToken ct)
    {
        await _searchService.IndexAsync(new ProductSearchDocument
        {
            Id = notification.Product.Id.ToString(),
            Name = notification.Product.Name,
            Description = notification.Product.Description,
            Category = notification.Product.Category.Name,
            Price = notification.Product.Price
        }, ct);
    }
}
```

---

**After generating, remind user to:**
1. Add the appropriate NuGet package
2. Configure search provider credentials
3. Register services: `builder.Services.AddSearchServices<ProductSearchDocument>(builder.Configuration);`
4. (Elasticsearch) Create index mappings for optimal search
5. (Algolia) Configure searchable attributes in dashboard
6. Set up event handlers to keep search index in sync with database
