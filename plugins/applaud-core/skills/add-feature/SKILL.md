---
name: add-feature
description: Scaffolds new features following CQRS and Ardalis Clean Architecture patterns. Use when user wants to add a feature, create CRUD operations, implement entity management, or says phrases like "add a Product feature", "create User management", "implement CRUD for Orders", "add {entity} management", or "scaffold a new feature"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-5-20250929
---

# Add Feature Skill

You are a feature scaffolding agent that adds new features to existing projects following the Ardalis Clean Architecture template patterns.

## Your Role

Add new vertical slice features to an existing project that was scaffolded with the Ardalis Clean Architecture template (`dotnet new clean-arch`).

## Before Starting

1. **Verify Project Structure**: Check that the project follows the Ardalis Clean Architecture structure with `src/` containing Core, UseCases, Infrastructure, and Web projects.
2. **Identify Existing Patterns**: Look at existing features to match the established patterns exactly.
3. **Ask Clarifying Questions**: Gather requirements before generating code.

## Ardalis Template Structure Reference

The Ardalis Clean Architecture template uses:
- **{Project}.Core** - Domain entities, interfaces, domain services (replaces traditional "Domain" layer)
- **{Project}.UseCases** - Commands, queries, handlers, DTOs (replaces traditional "Application" layer)
- **{Project}.Infrastructure** - EF Core, repositories, external services
- **{Project}.Web** - ASP.NET Core API using FastEndpoints (not controllers)

## Repository Pattern

Use an expression-based Repository Pattern for flexible data access without tight coupling to EF Core in the UseCases layer.

### Repository Interface (Core Layer)
```csharp
namespace {Project}.Core.Interfaces;

public interface IRepository<T> where T : EntityBase, IAggregateRoot
{
    // Single entity retrieval
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        CancellationToken ct = default);

    // List retrieval with expression-based filtering
    Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default);
    Task<IReadOnlyList<T>> ListAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        int? skip = null,
        int? take = null,
        CancellationToken ct = default);

    // Aggregates
    Task<int> CountAsync(Expression<Func<T, bool>>? filter = null, CancellationToken ct = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>>? filter = null, CancellationToken ct = default);

    // Mutations
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
    Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```

### Repository Implementation (Infrastructure Layer)
```csharp
namespace {Project}.Infrastructure.Data;

public class EfRepository<T> : IRepository<T> where T : EntityBase, IAggregateRoot
{
    protected readonly AppDbContext _context;

    public EfRepository(AppDbContext context) => _context = context;

    public virtual async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _context.Set<T>().FindAsync(new object[] { id }, ct);

    public virtual async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        CancellationToken ct = default)
    {
        IQueryable<T> query = _context.Set<T>();

        if (include is not null)
            query = include(query);

        if (filter is not null)
            query = query.Where(filter);

        return await query.FirstOrDefaultAsync(ct);
    }

    public virtual async Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default)
        => await _context.Set<T>().ToListAsync(ct);

    public virtual async Task<IReadOnlyList<T>> ListAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        int? skip = null,
        int? take = null,
        CancellationToken ct = default)
    {
        IQueryable<T> query = _context.Set<T>();

        if (include is not null)
            query = include(query);

        if (filter is not null)
            query = query.Where(filter);

        if (orderBy is not null)
            query = orderBy(query);

        if (skip.HasValue)
            query = query.Skip(skip.Value);

        if (take.HasValue)
            query = query.Take(take.Value);

        return await query.ToListAsync(ct);
    }

    public virtual async Task<int> CountAsync(
        Expression<Func<T, bool>>? filter = null,
        CancellationToken ct = default)
    {
        IQueryable<T> query = _context.Set<T>();

        if (filter is not null)
            query = query.Where(filter);

        return await query.CountAsync(ct);
    }

    public virtual async Task<bool> AnyAsync(
        Expression<Func<T, bool>>? filter = null,
        CancellationToken ct = default)
    {
        IQueryable<T> query = _context.Set<T>();

        if (filter is not null)
            return await query.AnyAsync(filter, ct);

        return await query.AnyAsync(ct);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _context.Set<T>().AddAsync(entity, ct);
        return entity;
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
    {
        await _context.Set<T>().AddRangeAsync(entities, ct);
    }

    public virtual Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _context.Set<T>().Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _context.Set<T>().Remove(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
    {
        _context.Set<T>().RemoveRange(entities);
        return Task.CompletedTask;
    }

    public virtual async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
```

## Requirements Gathering

Ask these questions:

### Question 1: Feature Name
"What is the name of the feature you want to add? (e.g., 'Products', 'Orders', 'Users')

This will be used for:
- Entity name: `{Feature}` (singular)
- Folder name: `{Features}` (plural)
- FastEndpoints: `Create{Feature}Endpoint`, `Get{Feature}Endpoint`, etc."

### Question 2: Entity Properties
"What properties should the `{Feature}` entity have?

Describe them in plain English or provide a list like:
- Name (string, required)
- Description (string, optional)
- Price (decimal)
- IsActive (bool, default true)
- CategoryId (int, foreign key to Category)"

### Question 3: Operations Needed
"Which operations do you need? (comma-separated or 'all')
- **create** - Create new {feature}
- **read** - Get by ID, List with filtering/paging
- **update** - Update existing {feature}
- **delete** - Soft or hard delete
- **search** - Full-text or advanced search

Example: 'create, read, update' or 'all'"

### Question 4: Additional Requirements
"Any additional requirements?
- Validation rules?
- Related entities to include?
- Specific business logic?
- Background job processing?"

## Files to Generate

For a feature named `Product` (plural: `Products`):

### Core Layer (Domain)
```
src/{Project}.Core/
├── ProductAggregate/
│   ├── Product.cs                       # Entity with properties
│   ├── Events/
│   │   ├── ProductCreatedEvent.cs       # Domain events
│   │   ├── ProductUpdatedEvent.cs
│   │   └── ProductDeletedEvent.cs
│   └── Specifications/                  # If using Ardalis.Specification
│       └── ProductByIdSpec.cs
└── Interfaces/
    └── IProductRepository.cs            # If entity-specific interface needed
```

### UseCases Layer (Application)
```
src/{Project}.UseCases/
└── Products/
    ├── ProductDto.cs                    # Response DTO
    ├── Create/
    │   ├── CreateProductCommand.cs
    │   └── CreateProductHandler.cs
    ├── Update/
    │   ├── UpdateProductCommand.cs
    │   └── UpdateProductHandler.cs
    ├── Delete/
    │   ├── DeleteProductCommand.cs
    │   └── DeleteProductHandler.cs
    ├── Get/
    │   ├── GetProductQuery.cs
    │   └── GetProductHandler.cs
    └── List/
        ├── ListProductsQuery.cs
        └── ListProductsHandler.cs
```

### Infrastructure Layer
```
src/{Project}.Infrastructure/
└── Data/
    └── Config/
        └── ProductConfiguration.cs      # EF Core configuration
```

### Web Layer (FastEndpoints)
```
src/{Project}.Web/
└── Products/
    ├── Create.cs                        # CreateProductEndpoint
    ├── Update.cs                        # UpdateProductEndpoint
    ├── Delete.cs                        # DeleteProductEndpoint
    ├── GetById.cs                       # GetProductEndpoint
    └── List.cs                          # ListProductsEndpoint
```

### Frontend (if exists)
```
src/client/src/
├── api/
│   └── products.ts                      # API client & React Query hooks
├── features/products/
│   ├── components/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductCard.tsx
│   └── pages/
│       ├── ProductsPage.tsx
│       └── ProductDetailPage.tsx
└── types/
    └── product.ts                       # TypeScript interfaces
```

### Tests
```
tests/
├── {Project}.UnitTests/
│   └── UseCases/Products/
│       ├── CreateProductHandlerTests.cs
│       └── ListProductsHandlerTests.cs
├── {Project}.FunctionalTests/
│   └── Products/
│       └── ProductEndpointsTests.cs
└── client/ (if frontend exists)
    └── features/products/
        └── ProductList.test.tsx
```

## Code Templates

### Entity Template (Core Layer)
```csharp
namespace {Project}.Core.ProductAggregate;

public class Product : EntityBase, IAggregateRoot
{
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    // Generated properties based on user input

    // Private constructor for EF Core
    private Product() { }

    // Factory method for creating new instances
    public Product(string name, string? description = null)
    {
        Name = Guard.Against.NullOrWhiteSpace(name);
        Description = description;
    }

    // Methods for updating (encapsulate business logic)
    public void UpdateDetails(string name, string? description)
    {
        Name = Guard.Against.NullOrWhiteSpace(name);
        Description = description;
    }
}
```

### Command Template (UseCases Layer)
```csharp
namespace {Project}.UseCases.Products.Create;

public record CreateProductCommand(string Name, string? Description) : ICommand<Result<ProductDto>>;

public class CreateProductHandler : ICommandHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IRepository<Product> _repository;

    public CreateProductHandler(IRepository<Product> repository)
    {
        _repository = repository;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken ct)
    {
        // Check for duplicates using expression-based filter
        var existing = await _repository.FirstOrDefaultAsync(
            filter: x => x.Name == request.Name,
            ct: ct);

        if (existing is not null)
            return Result.Conflict($"Product with name '{request.Name}' already exists");

        var product = new Product(request.Name, request.Description);

        await _repository.AddAsync(product, ct);
        await _repository.SaveChangesAsync(ct);

        return new ProductDto(product.Id, product.Name, product.Description);
    }
}
```

### Query Template with Filtering/Paging (UseCases Layer)
```csharp
namespace {Project}.UseCases.Products.List;

public record ListProductsQuery(
    string? SearchTerm = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 10
) : IQuery<Result<PagedResult<ProductDto>>>;

public class ListProductsHandler : IQueryHandler<ListProductsQuery, Result<PagedResult<ProductDto>>>
{
    private readonly IRepository<Product> _repository;

    public ListProductsHandler(IRepository<Product> repository)
    {
        _repository = repository;
    }

    public async Task<Result<PagedResult<ProductDto>>> Handle(ListProductsQuery request, CancellationToken ct)
    {
        // Build filter expression dynamically
        Expression<Func<Product, bool>>? filter = null;

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            filter = x => x.Name.ToLower().Contains(searchTerm) ||
                          (x.Description != null && x.Description.ToLower().Contains(searchTerm));
        }

        if (request.IsActive.HasValue)
        {
            var isActiveFilter = (Expression<Func<Product, bool>>)(x => x.IsActive == request.IsActive.Value);
            filter = filter is null ? isActiveFilter : filter.AndAlso(isActiveFilter);
        }

        // Get total count for pagination
        var totalCount = await _repository.CountAsync(filter, ct);

        // Get paginated results with ordering
        var products = await _repository.ListAsync(
            filter: filter,
            orderBy: q => q.OrderBy(x => x.Name),
            skip: (request.Page - 1) * request.PageSize,
            take: request.PageSize,
            ct: ct);

        var dtos = products.Select(p => new ProductDto(p.Id, p.Name, p.Description)).ToList();

        return new PagedResult<ProductDto>(
            Items: dtos,
            TotalCount: totalCount,
            Page: request.Page,
            PageSize: request.PageSize
        );
    }
}

// PagedResult helper record
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize
)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
```

### Query with Includes (Related Entities)
```csharp
namespace {Project}.UseCases.Products.Get;

public record GetProductQuery(int Id) : IQuery<Result<ProductDto>>;

public class GetProductHandler : IQueryHandler<GetProductQuery, Result<ProductDto>>
{
    private readonly IRepository<Product> _repository;

    public GetProductHandler(IRepository<Product> repository)
    {
        _repository = repository;
    }

    public async Task<Result<ProductDto>> Handle(GetProductQuery request, CancellationToken ct)
    {
        // Use FirstOrDefaultAsync with include for related entities
        var product = await _repository.FirstOrDefaultAsync(
            filter: x => x.Id == request.Id,
            include: q => q.Include(x => x.Category),  // Include related entity
            ct: ct);

        if (product is null)
            return Result.NotFound($"Product with ID {request.Id} not found");

        return new ProductDto(product.Id, product.Name, product.Description, product.Category?.Name);
    }
}
```

### FastEndpoint Template (Web Layer)
```csharp
namespace {Project}.Web.Products;

public class CreateProductRequest
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
}

public class CreateProductEndpoint : Endpoint<CreateProductRequest, ProductDto>
{
    private readonly IMediator _mediator;

    public CreateProductEndpoint(IMediator mediator)
    {
        _mediator = mediator;
    }

    public override void Configure()
    {
        Post("/products");
        AllowAnonymous(); // Or configure authorization
        Summary(s =>
        {
            s.Summary = "Create a new product";
            s.Description = "Creates a new product with the provided details";
        });
    }

    public override async Task HandleAsync(CreateProductRequest req, CancellationToken ct)
    {
        var command = new CreateProductCommand(req.Name, req.Description);
        var result = await _mediator.Send(command, ct);

        if (result.IsSuccess)
        {
            await SendCreatedAtAsync<GetProductEndpoint>(
                new { id = result.Value.Id },
                result.Value,
                cancellation: ct);
        }
        else
        {
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
```

### GetById FastEndpoint Template
```csharp
namespace {Project}.Web.Products;

public class GetProductRequest
{
    public int Id { get; set; }
}

public class GetProductEndpoint : Endpoint<GetProductRequest, ProductDto>
{
    private readonly IMediator _mediator;

    public GetProductEndpoint(IMediator mediator)
    {
        _mediator = mediator;
    }

    public override void Configure()
    {
        Get("/products/{Id}");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Get a product by ID";
        });
    }

    public override async Task HandleAsync(GetProductRequest req, CancellationToken ct)
    {
        var query = new GetProductQuery(req.Id);
        var result = await _mediator.Send(query, ct);

        if (result.IsSuccess)
        {
            await SendOkAsync(result.Value, ct);
        }
        else
        {
            await SendNotFoundAsync(ct);
        }
    }
}
```

### List FastEndpoint Template
```csharp
namespace {Project}.Web.Products;

public class ListProductsRequest
{
    public int? Skip { get; set; }
    public int? Take { get; set; }
}

public class ListProductsEndpoint : Endpoint<ListProductsRequest, IEnumerable<ProductDto>>
{
    private readonly IMediator _mediator;

    public ListProductsEndpoint(IMediator mediator)
    {
        _mediator = mediator;
    }

    public override void Configure()
    {
        Get("/products");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "List all products";
        });
    }

    public override async Task HandleAsync(ListProductsRequest req, CancellationToken ct)
    {
        var query = new ListProductsQuery(req.Skip, req.Take);
        var result = await _mediator.Send(query, ct);

        if (result.IsSuccess)
        {
            await SendOkAsync(result.Value, ct);
        }
        else
        {
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
```

### EF Core Configuration Template
```csharp
namespace {Project}.Infrastructure.Data.Config;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        // Add additional configuration based on properties
    }
}
```

### DTO Template
```csharp
namespace {Project}.UseCases.Products;

public record ProductDto(int Id, string Name, string? Description);
```

### React Query Hooks Template
```typescript
// api/products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/product';

const QUERY_KEY = ['products'];

export const useProducts = (params?: { skip?: number; take?: number }) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products', { params });
      return response.data;
    },
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = await apiClient.post<Product>('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductDto }) => {
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
```

### TypeScript Types Template
```typescript
// types/product.ts
export interface Product {
  id: number;
  name: string;
  description?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
}

export interface UpdateProductDto {
  name: string;
  description?: string;
}
```

## Execution Steps

1. Analyze the existing project structure to confirm Ardalis Clean Architecture
2. Gather all requirements through questions
3. Show a summary of what will be created and ask for confirmation
4. Generate all files following existing patterns:
   - Create entity in Core layer with aggregate folder structure
   - Create commands/queries in UseCases layer
   - Create EF Core configuration in Infrastructure layer
   - Create FastEndpoints in Web layer
   - Create React components and hooks if frontend exists
5. Register entity configuration in `AppDbContext.cs` if not auto-discovered
6. Remind user to:
   - Add EF Core migration: `dotnet ef migrations add Add{Feature} -p src/{Project}.Infrastructure -s src/{Project}.Web`
   - Apply migration: `dotnet ef database update -p src/{Project}.Infrastructure -s src/{Project}.Web`
   - Add routes in frontend if applicable
7. **Suggest running tests** to verify the new feature works correctly

## Key Differences from Traditional Clean Architecture

| Traditional | Ardalis Template |
|-------------|------------------|
| Domain layer | Core layer |
| Application layer | UseCases layer |
| Controllers | FastEndpoints |
| `{Project}.Domain` | `{Project}.Core` |
| `{Project}.Application` | `{Project}.UseCases` |
| `{Project}.Api` | `{Project}.Web` |
| `IRequest<T>` | `ICommand<T>` / `IQuery<T>` |

## Architecture Patterns Summary

- **Repository Pattern**: Expression-based filtering for flexible queries without tight EF Core coupling
- **CQRS**: Separate commands (writes) and queries (reads) via MediatR
- **FastEndpoints**: Modern minimal API endpoints with built-in validation
- **Clean Architecture**: Proper separation - Core (Domain), UseCases (Application), Infrastructure, Web

## Repository Usage Examples

```csharp
// Simple filter
await _repository.FirstOrDefaultAsync(filter: x => x.Name == name, ct: ct);

// Filter with includes
await _repository.FirstOrDefaultAsync(
    filter: x => x.Id == id,
    include: q => q.Include(x => x.Category).ThenInclude(c => c.SubCategories),
    ct: ct);

// Paginated list with filter and ordering
await _repository.ListAsync(
    filter: x => x.IsActive && x.Price > 100,
    orderBy: q => q.OrderByDescending(x => x.CreatedAt),
    skip: (page - 1) * pageSize,
    take: pageSize,
    ct: ct);

// Count with filter
await _repository.CountAsync(filter: x => x.CategoryId == categoryId, ct: ct);

// Check existence
await _repository.AnyAsync(filter: x => x.Email == email, ct: ct);
```

---

**Start by asking for the feature name.**
