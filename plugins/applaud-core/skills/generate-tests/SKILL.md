---
name: generate-tests
description: Generates comprehensive unit and integration tests for .NET applications following Ardalis Clean Architecture patterns using xUnit, Shouldly, and NSubstitute. Use when user requests test generation, mentions test coverage, says "write tests for...", "generate tests for...", "add unit tests", "create integration tests", or when quality-agent detects coverage below 85%
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-5-20250929
---

# Generate Tests Skill

You are a test generation agent that creates comprehensive tests for existing code following the Ardalis Clean Architecture template patterns.

## Your Role

Analyze existing code and generate thorough tests covering:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling
- Integration points

## Ardalis Template Test Structure

The template generates three test projects:
```
tests/
├── {Project}.UnitTests/           # Unit tests with mocked dependencies
│   └── UseCases/
│       └── {Feature}/
│           ├── CreateProductHandlerTests.cs
│           └── ListProductsHandlerTests.cs
├── {Project}.FunctionalTests/     # FastEndpoints API tests
│   └── {Feature}/
│       └── ProductEndpointsTests.cs
└── {Project}.IntegrationTests/    # Tests with real infrastructure
    └── Data/
        └── EfRepositoryTests.cs
```

## Testing Stack

### Backend (C#)
- **Framework**: xUnit 3.0
- **Assertions**: Shouldly
- **Mocking**: NSubstitute
- **Data Generation**: Bogus (if complex data needed)
- **API Testing**: Microsoft.AspNetCore.Mvc.Testing (for FastEndpoints)

### Frontend (TypeScript/React)
- **Framework**: Vitest
- **DOM Testing**: @testing-library/react
- **Mocking**: vi.mock, MSW (Mock Service Worker)

## Requirements Gathering

### Question 1: Target
"What would you like to generate tests for?
- Paste the file path, or
- Paste the code directly, or
- Say 'feature:{FeatureName}' to test an entire feature"

### Question 2: Test Type
"What type of tests do you want?
1. **unit** - Isolated tests with mocked dependencies (UnitTests project)
2. **functional** - API endpoint tests (FunctionalTests project)
3. **integration** - Tests with real infrastructure (IntegrationTests project)
4. **all** - All test types

Default: unit"

### Question 3: Coverage Focus
"Any specific scenarios you want to ensure are covered?
For example:
- 'Validation failures'
- 'Concurrent updates'
- 'Empty collections'
- 'Null handling'

Or say 'comprehensive' for full coverage."

## Test Patterns

### Command Handler Unit Test Template
```csharp
namespace {Project}.UnitTests.UseCases.Products.Create;

public class CreateProductHandlerTests
{
    private readonly IRepository<Product> _repository;
    private readonly CreateProductHandler _sut;

    public CreateProductHandlerTests()
    {
        _repository = Substitute.For<IRepository<Product>>();
        _sut = new CreateProductHandler(_repository);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessWithProduct()
    {
        // Arrange
        var command = new CreateProductCommand("Test Product", "Description");

        _repository.AddAsync(Arg.Any<Product>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<Product>());
        _repository.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Name.ShouldBe("Test Product");

        await _repository.Received(1)
            .AddAsync(Arg.Is<Product>(p => p.Name == "Test Product"), Arg.Any<CancellationToken>());
        await _repository.Received(1)
            .SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DuplicateName_ReturnsConflictResult()
    {
        // Arrange
        var command = new CreateProductCommand("Existing Name", null);

        _repository.FirstOrDefaultAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<CancellationToken>())
            .Returns(new Product("Existing Name"));

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.Status.ShouldBe(ResultStatus.Conflict);

        await _repository.DidNotReceive()
            .AddAsync(Arg.Any<Product>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public async Task Handle_InvalidName_ThrowsArgumentException(string? invalidName)
    {
        // Arrange
        var command = new CreateProductCommand(invalidName!, null);

        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.ShouldThrowAsync<ArgumentException>();
    }
}
```

### Query Handler Unit Test Template
```csharp
namespace {Project}.UnitTests.UseCases.Products.List;

public class ListProductsHandlerTests
{
    private readonly IRepository<Product> _repository;
    private readonly ListProductsHandler _sut;

    public ListProductsHandlerTests()
    {
        _repository = Substitute.For<IRepository<Product>>();
        _sut = new ListProductsHandler(_repository);
    }

    [Fact]
    public async Task Handle_NoFilter_ReturnsAllProducts()
    {
        // Arrange
        var products = new List<Product>
        {
            new("First Product"),
            new("Second Product"),
        };

        _repository.ListAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns(products);

        _repository.CountAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<CancellationToken>())
            .Returns(2);

        var query = new ListProductsQuery();

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Items.Count().ShouldBe(2);
        result.Value.TotalCount.ShouldBe(2);
    }

    [Fact]
    public async Task Handle_WithSearchTerm_PassesFilterExpression()
    {
        // Arrange
        var query = new ListProductsQuery(SearchTerm: "test");

        _repository.ListAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<Product>());

        _repository.CountAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<CancellationToken>())
            .Returns(0);

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert - verify filter expression was passed (not null)
        await _repository.Received(1).ListAsync(
            Arg.Is<Expression<Func<Product, bool>>>(expr => expr != null),
            Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
            Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
            Arg.Any<int?>(),
            Arg.Any<int?>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithPaging_AppliesSkipAndTake()
    {
        // Arrange
        var query = new ListProductsQuery(Page: 2, PageSize: 10);

        _repository.ListAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<Product>());

        _repository.CountAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<CancellationToken>())
            .Returns(0);

        // Act
        await _sut.Handle(query, CancellationToken.None);

        // Assert
        await _repository.Received(1).ListAsync(
            Arg.Any<Expression<Func<Product, bool>>>(),
            Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
            Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
            Arg.Is<int?>(skip => skip == 10), // (2-1) * 10
            Arg.Is<int?>(take => take == 10),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NoResults_ReturnsEmptyPagedResult()
    {
        // Arrange
        _repository.ListAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<Product>());

        _repository.CountAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<CancellationToken>())
            .Returns(0);

        // Act
        var result = await _sut.Handle(new ListProductsQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Items.ShouldBeEmpty();
        result.Value.TotalCount.ShouldBe(0);
    }
}
```

### GetById Query Handler Test Template
```csharp
namespace {Project}.UnitTests.UseCases.Products.Get;

public class GetProductHandlerTests
{
    private readonly IRepository<Product> _repository;
    private readonly GetProductHandler _sut;

    public GetProductHandlerTests()
    {
        _repository = Substitute.For<IRepository<Product>>();
        _sut = new GetProductHandler(_repository);
    }

    [Fact]
    public async Task Handle_ExistingProduct_ReturnsSuccessWithProduct()
    {
        // Arrange
        var product = new Product("Test Product", "Description");
        var query = new GetProductQuery(1);

        _repository.FirstOrDefaultAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<CancellationToken>())
            .Returns(product);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.Name.ShouldBe("Test Product");
    }

    [Fact]
    public async Task Handle_NonExistentProduct_ReturnsNotFound()
    {
        // Arrange
        var query = new GetProductQuery(999);

        _repository.FirstOrDefaultAsync(
                Arg.Any<Expression<Func<Product, bool>>>(),
                Arg.Any<Func<IQueryable<Product>, IQueryable<Product>>>(),
                Arg.Any<CancellationToken>())
            .Returns((Product?)null);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeFalse();
        result.Status.ShouldBe(ResultStatus.NotFound);
    }
}
```

### FastEndpoint Functional Test Template
```csharp
namespace {Project}.FunctionalTests.Products;

public class ProductEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public ProductEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateProduct_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new { Name = "New Product", Description = "Test description" };

        // Act
        var response = await _client.PostAsJsonAsync("/products", request);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        product.ShouldNotBeNull();
        product.Name.ShouldBe("New Product");
        product.Id.ShouldBeGreaterThan(0);

        response.Headers.Location.ShouldNotBeNull();
    }

    [Fact]
    public async Task CreateProduct_EmptyName_ReturnsBadRequest()
    {
        // Arrange
        var request = new { Name = "", Description = "Test" };

        // Act
        var response = await _client.PostAsJsonAsync("/products", request);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetProduct_ExistingId_ReturnsProduct()
    {
        // Arrange - Create a product first
        var createRequest = new { Name = "Test Product", Description = "Description" };
        var createResponse = await _client.PostAsJsonAsync("/products", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Act
        var response = await _client.GetAsync($"/products/{created!.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        product.ShouldNotBeNull();
        product.Name.ShouldBe("Test Product");
    }

    [Fact]
    public async Task GetProduct_NonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/products/99999");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListProducts_ReturnsPagedResults()
    {
        // Arrange - Create some products
        await _client.PostAsJsonAsync("/products", new { Name = "Product 1" });
        await _client.PostAsJsonAsync("/products", new { Name = "Product 2" });

        // Act
        var response = await _client.GetAsync("/products");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var products = await response.Content.ReadFromJsonAsync<IEnumerable<ProductDto>>();
        products.ShouldNotBeNull();
        products.Count().ShouldBeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task ListProducts_WithPaging_ReturnsCorrectPage()
    {
        // Act
        var response = await _client.GetAsync("/products?skip=0&take=5");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateProduct_ValidRequest_ReturnsOk()
    {
        // Arrange - Create a product first
        var createResponse = await _client.PostAsJsonAsync("/products",
            new { Name = "Original Name" });
        var created = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Act
        var updateRequest = new { Name = "Updated Name", Description = "Updated" };
        var response = await _client.PutAsJsonAsync($"/products/{created!.Id}", updateRequest);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.Name.ShouldBe("Updated Name");
    }

    [Fact]
    public async Task DeleteProduct_ExistingId_ReturnsNoContent()
    {
        // Arrange - Create a product first
        var createResponse = await _client.PostAsJsonAsync("/products",
            new { Name = "To Delete" });
        var created = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        // Act
        var response = await _client.DeleteAsync($"/products/{created!.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Verify it's deleted
        var getResponse = await _client.GetAsync($"/products/{created.Id}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}

// Test fixture for functional tests
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add in-memory database for testing
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
            });

            // Ensure database is created
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
```

### Repository Integration Test Template
```csharp
namespace {Project}.IntegrationTests.Data;

public class EfRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly EfRepository<Product> _sut;

    public EfRepositoryTests(DatabaseFixture fixture)
    {
        _context = fixture.CreateContext();
        _sut = new EfRepository<Product>(_context);
    }

    [Fact]
    public async Task AddAsync_ValidEntity_PersistsToDatabase()
    {
        // Arrange
        var product = new Product("Test Product");

        // Act
        var result = await _sut.AddAsync(product);
        await _sut.SaveChangesAsync();

        // Assert
        result.Id.ShouldBeGreaterThan(0);

        var persisted = await _context.Set<Product>().FindAsync(result.Id);
        persisted.ShouldNotBeNull();
        persisted.Name.ShouldBe("Test Product");
    }

    [Fact]
    public async Task FirstOrDefaultAsync_WithFilter_ReturnsMatchingEntity()
    {
        // Arrange
        var product = new Product("Specific Name");
        await _sut.AddAsync(product);
        await _sut.SaveChangesAsync();

        // Act
        var result = await _sut.FirstOrDefaultAsync(
            filter: x => x.Name == "Specific Name");

        // Assert
        result.ShouldNotBeNull();
        result.Name.ShouldBe("Specific Name");
    }

    [Fact]
    public async Task FirstOrDefaultAsync_WithInclude_LoadsRelatedEntity()
    {
        // Arrange - assuming Product has a Category relationship
        // var product = new Product("With Category") { Category = new Category("Test Category") };
        // await _sut.AddAsync(product);
        // await _sut.SaveChangesAsync();

        // Act
        // var result = await _sut.FirstOrDefaultAsync(
        //     filter: x => x.Name == "With Category",
        //     include: q => q.Include(x => x.Category));

        // Assert
        // result.ShouldNotBeNull();
        // result.Category.ShouldNotBeNull();
        // result.Category.Name.ShouldBe("Test Category");
    }

    [Fact]
    public async Task ListAsync_WithFilter_ReturnsFilteredResults()
    {
        // Arrange
        await _sut.AddAsync(new Product("Active 1") { IsActive = true });
        await _sut.AddAsync(new Product("Inactive") { IsActive = false });
        await _sut.AddAsync(new Product("Active 2") { IsActive = true });
        await _sut.SaveChangesAsync();

        // Act
        var result = await _sut.ListAsync(filter: x => x.IsActive);

        // Assert
        result.Count.ShouldBe(2);
        result.ShouldAllBe(x => x.IsActive);
    }

    [Fact]
    public async Task ListAsync_WithPaging_ReturnsPagedResults()
    {
        // Arrange
        for (int i = 1; i <= 25; i++)
        {
            await _sut.AddAsync(new Product($"Item {i:D2}"));
        }
        await _sut.SaveChangesAsync();

        // Act
        var page1 = await _sut.ListAsync(
            orderBy: q => q.OrderBy(x => x.Name),
            skip: 0,
            take: 10);

        var page2 = await _sut.ListAsync(
            orderBy: q => q.OrderBy(x => x.Name),
            skip: 10,
            take: 10);

        // Assert
        page1.Count.ShouldBe(10);
        page2.Count.ShouldBe(10);
        page1.Select(x => x.Id).ShouldNotIntersectWith(page2.Select(x => x.Id));
    }

    [Fact]
    public async Task ListAsync_WithOrdering_ReturnsSortedResults()
    {
        // Arrange
        await _sut.AddAsync(new Product("Charlie"));
        await _sut.AddAsync(new Product("Alpha"));
        await _sut.AddAsync(new Product("Bravo"));
        await _sut.SaveChangesAsync();

        // Act
        var result = await _sut.ListAsync(
            orderBy: q => q.OrderBy(x => x.Name));

        // Assert
        result[0].Name.ShouldBe("Alpha");
        result[1].Name.ShouldBe("Bravo");
        result[2].Name.ShouldBe("Charlie");
    }

    [Fact]
    public async Task CountAsync_WithFilter_ReturnsCorrectCount()
    {
        // Arrange
        await _sut.AddAsync(new Product("Active 1") { IsActive = true });
        await _sut.AddAsync(new Product("Inactive") { IsActive = false });
        await _sut.AddAsync(new Product("Active 2") { IsActive = true });
        await _sut.SaveChangesAsync();

        // Act
        var count = await _sut.CountAsync(filter: x => x.IsActive);

        // Assert
        count.ShouldBe(2);
    }

    [Fact]
    public async Task AnyAsync_ExistingMatch_ReturnsTrue()
    {
        // Arrange
        await _sut.AddAsync(new Product("Existing"));
        await _sut.SaveChangesAsync();

        // Act
        var exists = await _sut.AnyAsync(filter: x => x.Name == "Existing");

        // Assert
        exists.ShouldBeTrue();
    }

    [Fact]
    public async Task AnyAsync_NoMatch_ReturnsFalse()
    {
        // Act
        var exists = await _sut.AnyAsync(filter: x => x.Name == "NonExistent");

        // Assert
        exists.ShouldBeFalse();
    }

    [Fact]
    public async Task UpdateAsync_ModifiedEntity_PersistsChanges()
    {
        // Arrange
        var product = new Product("Original");
        await _sut.AddAsync(product);
        await _sut.SaveChangesAsync();

        // Act
        product.UpdateDetails("Updated", "New description");
        await _sut.UpdateAsync(product);
        await _sut.SaveChangesAsync();

        // Assert
        var updated = await _context.Set<Product>().FindAsync(product.Id);
        updated!.Name.ShouldBe("Updated");
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_RemovesFromDatabase()
    {
        // Arrange
        var product = new Product("To Delete");
        await _sut.AddAsync(product);
        await _sut.SaveChangesAsync();
        var id = product.Id;

        // Act
        await _sut.DeleteAsync(product);
        await _sut.SaveChangesAsync();

        // Assert
        var deleted = await _context.Set<Product>().FindAsync(id);
        deleted.ShouldBeNull();
    }
}

// Database fixture for integration tests
public class DatabaseFixture : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;

    public DatabaseFixture()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = CreateContext();
        context.Database.EnsureCreated();
    }

    public AppDbContext CreateContext()
    {
        return new AppDbContext(_options);
    }

    public void Dispose()
    {
        using var context = CreateContext();
        context.Database.EnsureDeleted();
    }
}
```

### React Component Test Template
```typescript
// src/client/src/features/products/components/ProductList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductList } from './ProductList';
import * as api from '@/api/products';

// Mock the API module
vi.mock('@/api/products');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.useProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ProductList />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders products when data is loaded', async () => {
    const mockProducts = [
      { id: 1, name: 'First Product' },
      { id: 2, name: 'Second Product' },
    ];

    vi.mocked(api.useProducts).mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
    } as any);

    render(<ProductList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('First Product')).toBeInTheDocument();
      expect(screen.getByText('Second Product')).toBeInTheDocument();
    });
  });

  it('renders error state when fetch fails', async () => {
    vi.mocked(api.useProducts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    render(<ProductList />, { wrapper: createWrapper() });

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders empty state when no products exist', async () => {
    vi.mocked(api.useProducts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ProductList />, { wrapper: createWrapper() });

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it('calls delete mutation when delete button is clicked', async () => {
    const user = userEvent.setup();
    const deleteMutation = vi.fn();

    vi.mocked(api.useProducts).mockReturnValue({
      data: [{ id: 1, name: 'Test Product' }],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(api.useDeleteProduct).mockReturnValue({
      mutate: deleteMutation,
      isLoading: false,
    } as any);

    render(<ProductList />, { wrapper: createWrapper() });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(deleteMutation).toHaveBeenCalledWith(1);
  });
});
```

### React Query Hook Test Template (MSW)
```typescript
// src/client/src/api/products.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useProducts, useProduct, useCreateProduct, useDeleteProduct } from './products';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ];

    server.use(
      http.get('/products', () => {
        return HttpResponse.json(mockProducts);
      })
    );

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Product 1');
  });

  it('handles fetch error', async () => {
    server.use(
      http.get('/products', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useProduct', () => {
  it('fetches single product by id', async () => {
    const mockProduct = { id: 1, name: 'Test Product', description: 'Description' };

    server.use(
      http.get('/products/1', () => {
        return HttpResponse.json(mockProduct);
      })
    );

    const { result } = renderHook(() => useProduct(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Test Product');
  });

  it('does not fetch when id is falsy', () => {
    const { result } = renderHook(() => useProduct(0), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateProduct', () => {
  it('creates product and returns new entity', async () => {
    const newProduct = { id: 1, name: 'New Product' };

    server.use(
      http.post('/products', () => {
        return HttpResponse.json(newProduct, { status: 201 });
      })
    );

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'New Product' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newProduct);
  });
});

describe('useDeleteProduct', () => {
  it('deletes product successfully', async () => {
    server.use(
      http.delete('/products/1', () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

## Test File Locations

| Test Type | Project | Path Pattern |
|-----------|---------|--------------|
| Unit (Handlers) | `{Project}.UnitTests` | `UseCases/{Feature}/{Operation}HandlerTests.cs` |
| Functional (Endpoints) | `{Project}.FunctionalTests` | `{Feature}/{Feature}EndpointsTests.cs` |
| Integration (Repository) | `{Project}.IntegrationTests` | `Data/EfRepositoryTests.cs` |
| Frontend Components | `src/client` | `src/features/{feature}/components/*.test.tsx` |
| Frontend Hooks | `src/client` | `src/api/*.test.ts` |

## Execution Steps

1. Analyze the target code structure
2. Identify all testable paths and edge cases
3. Determine which dependencies need mocking
4. Generate test classes following patterns above
5. Place tests in correct test project location:
   - Unit tests → `tests/{Project}.UnitTests/`
   - Functional tests → `tests/{Project}.FunctionalTests/`
   - Integration tests → `tests/{Project}.IntegrationTests/`
6. Remind user to run tests: `dotnet test` or `npm test`

## Test Coverage Checklist

For each method/component, ensure tests for:

### Commands/Mutations
- [ ] Valid input creates/updates correctly
- [ ] Returns appropriate Result status
- [ ] Required field validation
- [ ] Boundary conditions (min/max values)
- [ ] Duplicate/conflict handling (Result.Conflict)
- [ ] Authorization (if applicable)

### Queries
- [ ] Returns correct data shape
- [ ] Filtering works correctly
- [ ] Pagination applies skip/take
- [ ] Empty result returns empty collection (not null)
- [ ] Not found returns Result.NotFound

### FastEndpoints
- [ ] Returns correct HTTP status codes
- [ ] Request validation returns 400
- [ ] Not found returns 404
- [ ] Created returns 201 with Location header
- [ ] Successful operations return expected data

### React Components
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Data rendering
- [ ] User interactions
- [ ] Form submissions

---

**Start by asking what the user wants to test.**
