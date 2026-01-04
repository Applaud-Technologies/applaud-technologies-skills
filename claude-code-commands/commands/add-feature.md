# Add Feature Command

You are a feature scaffolding agent that adds new features to existing projects following established patterns.

## Your Role

Add new vertical slice features to an existing project that follows the Repository + Specification + MediatR architecture.

## Before Starting

1. **Verify Project Structure**: Check that the project follows the expected monorepo structure with `src/server` containing the Clean Architecture layers (Domain, Application, Infrastructure, Api) and `src/client` containing the React frontend.
2. **Identify Existing Patterns**: Look at existing features to match the established patterns exactly.
3. **Ask Clarifying Questions**: Gather requirements before generating code.

## Requirements Gathering

Ask these questions:

### Question 1: Feature Name
"What is the name of the feature you want to add? (e.g., 'Products', 'Orders', 'Users')

This will be used for:
- Entity name: `{Feature}` (singular)
- Folder name: `{Features}` (plural)
- Controller: `{Features}Controller`"

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

### Question 4: Real-time Updates
"Should changes to {Feature} broadcast real-time updates via SignalR? (yes/no)

If yes, I'll create:
- Domain events for Create/Update/Delete
- SignalR hub method for broadcasting
- React Query cache invalidation hooks"

### Question 5: Additional Requirements
"Any additional requirements?
- Validation rules?
- Related entities to include?
- Specific business logic?
- Background job processing?"

## Files to Generate

For a feature named `Product` (plural: `Products`):

### Domain Layer
```
src/server/{Project}.Domain/
├── Entities/
│   └── Product.cs                    # Entity with properties
└── Events/
    ├── ProductCreatedEvent.cs        # Domain events (if SignalR)
    ├── ProductUpdatedEvent.cs
    └── ProductDeletedEvent.cs
```

### Application Layer
```
src/server/{Project}.Application/Features/Products/
├── DTOs/
│   ├── ProductDto.cs                 # Response DTO
│   ├── CreateProductDto.cs           # Create request
│   └── UpdateProductDto.cs           # Update request
├── Commands/
│   ├── CreateProduct/
│   │   ├── CreateProductCommand.cs
│   │   ├── CreateProductCommandHandler.cs
│   │   └── CreateProductCommandValidator.cs
│   ├── UpdateProduct/
│   │   └── ...
│   └── DeleteProduct/
│       └── ...
├── Queries/
│   ├── GetProductById/
│   │   ├── GetProductByIdQuery.cs
│   │   └── GetProductByIdQueryHandler.cs
│   └── GetProductsList/
│       ├── GetProductsListQuery.cs
│       └── GetProductsListQueryHandler.cs
└── Mappings/
    └── ProductMappingProfile.cs      # If using AutoMapper
```

### Infrastructure Layer
```
src/server/{Project}.Infrastructure/
├── Persistence/
│   ├── Configurations/
│   │   └── ProductConfiguration.cs   # EF Core config
│   └── Repositories/
│       └── ProductRepository.cs      # If entity-specific repo needed
```

### API Layer
```
src/server/{Project}.Api/
└── Controllers/
    └── ProductsController.cs         # REST endpoints
```

### Frontend (if exists)
```
src/client/src/
├── api/
│   └── products.ts                   # API client & React Query hooks
├── features/products/
│   ├── components/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductCard.tsx
│   └── pages/
│       ├── ProductsPage.tsx
│       └── ProductDetailPage.tsx
└── types/
    └── product.ts                    # TypeScript interfaces
```

### Tests
```
tests/
├── server/{Project}.Application.Tests/Features/Products/
│   ├── Commands/
│   │   └── CreateProductCommandHandlerTests.cs
│   └── Queries/
│       └── GetProductsListQueryHandlerTests.cs
└── client/features/products/
    └── ProductList.test.tsx
```

## Code Templates

### Entity Template
```csharp
namespace {Project}.Domain.Entities;

public class {Feature} : BaseEntity
{
    // Generated properties based on user input
    
    // Private constructor for EF Core
    private {Feature}() { }
    
    // Factory method for creating new instances
    public static {Feature} Create(/* params */)
    {
        var entity = new {Feature}
        {
            // Set properties
        };
        
        entity.AddDomainEvent(new {Feature}CreatedEvent(entity));
        
        return entity;
    }
    
    // Methods for updating (encapsulate business logic)
    public void Update(/* params */)
    {
        // Update properties
        AddDomainEvent(new {Feature}UpdatedEvent(this));
    }
}
```

### Command Template
```csharp
namespace {Project}.Application.Features.{Features}.Commands.Create{Feature};

public record Create{Feature}Command(/* properties */) : IRequest<{Feature}Dto>;

public class Create{Feature}CommandHandler : IRequestHandler<Create{Feature}Command, {Feature}Dto>
{
    private readonly IRepository<{Feature}> _repository;
    
    public Create{Feature}CommandHandler(IRepository<{Feature}> repository)
    {
        _repository = repository;
    }
    
    public async Task<{Feature}Dto> Handle(Create{Feature}Command request, CancellationToken ct)
    {
        // Check for duplicates using Expression filter
        var existing = await _repository.FirstOrDefaultAsync(
            filter: x => x.Name == request.Name,
            ct: ct);
            
        if (existing is not null)
            throw new ConflictException($"{Feature} with name '{request.Name}' already exists");
        
        var entity = {Feature}.Create(/* map from request */);
        
        await _repository.AddAsync(entity, ct);
        
        return entity.ToDto(); // Or use AutoMapper
    }
}

public class Create{Feature}CommandValidator : AbstractValidator<Create{Feature}Command>
{
    public Create{Feature}CommandValidator()
    {
        // Validation rules based on user requirements
    }
}
```

### Query Template
```csharp
namespace {Project}.Application.Features.{Features}.Queries.Get{Feature}sList;

public record Get{Feature}sListQuery(
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 10
) : IRequest<PagedResult<{Feature}Dto>>;

public class Get{Feature}sListQueryHandler : IRequestHandler<Get{Feature}sListQuery, PagedResult<{Feature}Dto>>
{
    private readonly IRepository<{Feature}> _repository;
    
    public Get{Feature}sListQueryHandler(IRepository<{Feature}> repository)
    {
        _repository = repository;
    }
    
    public async Task<PagedResult<{Feature}Dto>> Handle(Get{Feature}sListQuery request, CancellationToken ct)
    {
        // Build filter expression
        Expression<Func<{Feature}, bool>>? filter = null;
        
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            filter = x => x.Name.Contains(request.SearchTerm) || 
                          x.Description.Contains(request.SearchTerm);
        }
        
        var totalCount = await _repository.CountAsync(filter, ct);
        
        var items = await _repository.ListAsync(
            filter: filter,
            orderBy: q => q.OrderBy(x => x.Name),
            skip: (request.Page - 1) * request.PageSize,
            take: request.PageSize,
            ct: ct);
        
        return new PagedResult<{Feature}Dto>(
            Items: items.Select(x => x.ToDto()).ToList(),
            TotalCount: totalCount,
            Page: request.Page,
            PageSize: request.PageSize
        );
    }
}
```

### Controller Template
```csharp
namespace {Project}.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class {Features}Controller : ControllerBase
{
    private readonly IMediator _mediator;
    
    public {Features}Controller(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet]
    public async Task<ActionResult<PagedResult<{Feature}Dto>>> GetList(
        [FromQuery] GetProductsListQuery query,
        CancellationToken ct)
    {
        return Ok(await _mediator.Send(query, ct));
    }
    
    [HttpGet("{id:int}")]
    public async Task<ActionResult<{Feature}Dto>> GetById(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new Get{Feature}ByIdQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<{Feature}Dto>> Create(
        Create{Feature}Command command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    
    // PUT, DELETE endpoints...
}
```

### React Query Hooks Template
```typescript
// api/products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/product';

const QUERY_KEY = ['products'];

export const useProducts = (params?: ProductsListParams) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => apiClient.get<PagedResult<Product>>('/api/products', { params }),
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => apiClient.get<Product>(`/api/products/${id}`),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProductDto) => 
      apiClient.post<Product>('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

// Update, Delete mutations...
```

## Execution Steps

1. Analyze the existing project structure
2. Gather all requirements through questions
3. Show a summary of what will be created and ask for confirmation
4. Generate all files following existing patterns
5. Update any registration files (DI containers, etc.)
6. Remind user to:
   - Add EF Core migration if entity was created
   - Register new services if needed
   - Add routes in frontend if applicable
7. **Suggest running the quality agent**: `/user:quality-agent` to review code and generate tests

---

**Start by asking for the feature name.**
