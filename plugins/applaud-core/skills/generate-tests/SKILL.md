---
name: generate-tests
description: Generates comprehensive unit and integration tests for .NET applications using xUnit, Shouldly, and NSubstitute. Use when user requests test generation, mentions test coverage, says "write tests for...", "generate tests for...", "add unit tests", "create integration tests", or when quality-agent detects coverage below 85%
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: claude-sonnet-4-5-20250929
---

# Generate Tests Skill

You are a test generation agent that creates comprehensive tests for existing code following xUnit, Shouldly, and NSubstitute patterns.

## Your Role

Analyze existing code and generate thorough tests covering:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling
- Integration points

## Testing Stack

### Backend (C#)
- **Framework**: xUnit 3.0
- **Assertions**: Shouldly
- **Mocking**: NSubstitute
- **Data Generation**: Bogus (if complex data needed)

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
1. **unit** - Isolated tests with mocked dependencies
2. **integration** - Tests with real infrastructure (in-memory DB)
3. **both** - Unit tests + integration tests

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

### Command Handler Test Template
```csharp
namespace {Project}.Application.Tests.Features.{Feature}.Commands;

public class Create{Feature}CommandHandlerTests
{
    private readonly IRepository<{Feature}> _repository;
    private readonly Create{Feature}CommandHandler _sut;
    
    public Create{Feature}CommandHandlerTests()
    {
        _repository = Substitute.For<IRepository<{Feature}>>();
        _sut = new Create{Feature}CommandHandler(_repository);
    }
    
    [Fact]
    public async Task Handle_ValidCommand_Creates{Feature}()
    {
        // Arrange
        var command = new Create{Feature}Command(/* valid params */);
        _repository.AddAsync(Arg.Any<{Feature}>(), Arg.Any<CancellationToken>())
            .Returns(x => x.Arg<{Feature}>());
        
        // Act
        var result = await _sut.Handle(command, CancellationToken.None);
        
        // Assert
        result.ShouldNotBeNull();
        result.Name.ShouldBe(command.Name);
        
        await _repository.Received(1)
            .AddAsync(Arg.Is<{Feature}>(x => x.Name == command.Name), Arg.Any<CancellationToken>());
    }
    
    [Fact]
    public async Task Handle_DuplicateName_ThrowsConflictException()
    {
        // Arrange
        var command = new Create{Feature}Command("Existing Name");
        _repository.FirstOrDefaultAsync(
                Arg.Any<Expression<Func<{Feature}, bool>>>(), 
                Arg.Any<Func<IQueryable<{Feature}>, IQueryable<{Feature}>>>(),
                Arg.Any<CancellationToken>())
            .Returns(new {Feature} { Name = "Existing Name" });
        
        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);
        
        // Assert
        await act.ShouldThrowAsync<ConflictException>();
    }
    
    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public async Task Handle_InvalidName_ThrowsArgumentException(string? invalidName)
    {
        // Arrange
        var command = new Create{Feature}Command(invalidName!);
        
        // Act
        var act = () => _sut.Handle(command, CancellationToken.None);
        
        // Assert
        await act.ShouldThrowAsync<ArgumentException>();
    }
}
```

### Query Handler Test Template
```csharp
namespace {Project}.Application.Tests.Features.{Feature}.Queries;

public class Get{Feature}sListQueryHandlerTests
{
    private readonly IRepository<{Feature}> _repository;
    private readonly Get{Feature}sListQueryHandler _sut;
    
    public Get{Feature}sListQueryHandlerTests()
    {
        _repository = Substitute.For<IRepository<{Feature}>>();
        _sut = new Get{Feature}sListQueryHandler(_repository);
    }
    
    [Fact]
    public async Task Handle_NoFilter_ReturnsAll{Feature}s()
    {
        // Arrange
        var {feature}s = new List<{Feature}>
        {
            new() { Id = 1, Name = "First" },
            new() { Id = 2, Name = "Second" },
        };
        
        _repository.ListAsync(
                Arg.Any<Expression<Func<{Feature}, bool>>>(),
                Arg.Any<Func<IQueryable<{Feature}>, IOrderedQueryable<{Feature}>>>(),
                Arg.Any<Func<IQueryable<{Feature}>, IQueryable<{Feature}>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns({feature}s);
            
        _repository.CountAsync(
                Arg.Any<Expression<Func<{Feature}, bool>>>(), 
                Arg.Any<CancellationToken>())
            .Returns(2);
        
        var query = new Get{Feature}sListQuery();
        
        // Act
        var result = await _sut.Handle(query, CancellationToken.None);
        
        // Assert
        result.ShouldNotBeNull();
        result.Items.Count.ShouldBe(2);
        result.TotalCount.ShouldBe(2);
    }
    
    [Fact]
    public async Task Handle_WithSearchTerm_FiltersResults()
    {
        // Arrange
        var query = new Get{Feature}sListQuery(SearchTerm: "test");
        
        // Act
        await _sut.Handle(query, CancellationToken.None);
        
        // Assert - verify filter expression was passed
        await _repository.Received(1).ListAsync(
            Arg.Is<Expression<Func<{Feature}, bool>>>(expr => expr != null),
            Arg.Any<Func<IQueryable<{Feature}>, IOrderedQueryable<{Feature}>>>(),
            Arg.Any<Func<IQueryable<{Feature}>, IQueryable<{Feature}>>>(),
            Arg.Any<int?>(),
            Arg.Any<int?>(),
            Arg.Any<CancellationToken>());
    }
    
    [Fact]
    public async Task Handle_WithPaging_AppliesSkipAndTake()
    {
        // Arrange
        var query = new Get{Feature}sListQuery(Page: 2, PageSize: 10);
        
        // Act
        await _sut.Handle(query, CancellationToken.None);
        
        // Assert
        await _repository.Received(1).ListAsync(
            Arg.Any<Expression<Func<{Feature}, bool>>>(),
            Arg.Any<Func<IQueryable<{Feature}>, IOrderedQueryable<{Feature}>>>(),
            Arg.Any<Func<IQueryable<{Feature}>, IQueryable<{Feature}>>>(),
            Arg.Is<int?>(skip => skip == 10), // (2-1) * 10
            Arg.Is<int?>(take => take == 10),
            Arg.Any<CancellationToken>());
    }
    
    [Fact]
    public async Task Handle_NoResults_ReturnsEmptyList()
    {
        // Arrange
        _repository.ListAsync(
                Arg.Any<Expression<Func<{Feature}, bool>>>(),
                Arg.Any<Func<IQueryable<{Feature}>, IOrderedQueryable<{Feature}>>>(),
                Arg.Any<Func<IQueryable<{Feature}>, IQueryable<{Feature}>>>(),
                Arg.Any<int?>(),
                Arg.Any<int?>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<{Feature}>());
        
        // Act
        var result = await _sut.Handle(new Get{Feature}sListQuery(), CancellationToken.None);
        
        // Assert
        result.ShouldNotBeNull();
        result.Items.ShouldBeEmpty();
    }
}
```

### Validator Test Template
```csharp
namespace {Project}.Application.Tests.Features.{Feature}.Commands;

public class Create{Feature}CommandValidatorTests
{
    private readonly Create{Feature}CommandValidator _sut;
    
    public Create{Feature}CommandValidatorTests()
    {
        _sut = new Create{Feature}CommandValidator();
    }
    
    [Fact]
    public async Task Validate_ValidCommand_ReturnsNoErrors()
    {
        // Arrange
        var command = new Create{Feature}Command(
            Name: "Valid Name",
            Description: "Valid description");
        
        // Act
        var result = await _sut.ValidateAsync(command);
        
        // Assert
        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }
    
    [Fact]
    public async Task Validate_EmptyName_ReturnsValidationError()
    {
        // Arrange
        var command = new Create{Feature}Command(Name: "");
        
        // Act
        var result = await _sut.ValidateAsync(command);
        
        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => 
            e.PropertyName == nameof(command.Name));
    }
    
    [Fact]
    public async Task Validate_NameTooLong_ReturnsValidationError()
    {
        // Arrange
        var command = new Create{Feature}Command(
            Name: new string('a', 201)); // Assuming 200 char limit
        
        // Act
        var result = await _sut.ValidateAsync(command);
        
        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => 
            e.PropertyName == nameof(command.Name) && 
            e.ErrorMessage.Contains("200"));
    }
}
```

### Repository/Integration Test Template
```csharp
namespace {Project}.Infrastructure.Tests.Persistence;

public class {Feature}RepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly Repository<{Feature}> _sut;
    
    public {Feature}RepositoryTests(DatabaseFixture fixture)
    {
        _context = fixture.CreateContext();
        _sut = new Repository<{Feature}>(_context);
    }
    
    [Fact]
    public async Task AddAsync_ValidEntity_PersistsToDatabase()
    {
        // Arrange
        var {feature} = {Feature}.Create("Test Name");
        
        // Act
        var result = await _sut.AddAsync({feature});
        
        // Assert
        result.Id.ShouldBeGreaterThan(0);
        
        var persisted = await _context.{Feature}s.FindAsync(result.Id);
        persisted.ShouldNotBeNull();
        persisted.Name.ShouldBe("Test Name");
    }
    
    [Fact]
    public async Task FirstOrDefaultAsync_WithFilter_ReturnsMatchingEntity()
    {
        // Arrange
        var {feature} = {Feature}.Create("Specific Name");
        await _sut.AddAsync({feature});
        
        // Act
        var result = await _sut.FirstOrDefaultAsync(
            filter: x => x.Name == "Specific Name");
        
        // Assert
        result.ShouldNotBeNull();
        result.Name.ShouldBe("Specific Name");
    }
    
    [Fact]
    public async Task ListAsync_WithFilter_ReturnsFilteredResults()
    {
        // Arrange
        await _sut.AddAsync({Feature}.Create("Active Item", isActive: true));
        await _sut.AddAsync({Feature}.Create("Inactive Item", isActive: false));
        await _sut.AddAsync({Feature}.Create("Another Active", isActive: true));
        
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
            await _sut.AddAsync({Feature}.Create($"Item {i}"));
        }
        
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
        page1.ShouldNotContain(x => page2.Contains(x));
    }
    
    [Fact]
    public async Task CountAsync_WithFilter_ReturnsCorrectCount()
    {
        // Arrange
        await _sut.AddAsync({Feature}.Create("Active 1", isActive: true));
        await _sut.AddAsync({Feature}.Create("Inactive", isActive: false));
        await _sut.AddAsync({Feature}.Create("Active 2", isActive: true));
        
        // Act
        var count = await _sut.CountAsync(filter: x => x.IsActive);
        
        // Assert
        count.ShouldBe(2);
    }
    
    [Fact]
    public async Task AnyAsync_ExistingMatch_ReturnsTrue()
    {
        // Arrange
        await _sut.AddAsync({Feature}.Create("Existing"));
        
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
}

// Database fixture for integration tests
public class DatabaseFixture : IDisposable
{
    private readonly string _connectionString;
    
    public DatabaseFixture()
    {
        _connectionString = $"Server=(localdb)\\mssqllocaldb;Database=TestDb_{Guid.NewGuid()};Trusted_Connection=true";
        
        using var context = CreateContext();
        context.Database.EnsureCreated();
    }
    
    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_connectionString)
            .Options;
            
        return new AppDbContext(options);
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
// features/{feature}/components/{Feature}List.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Feature}List } from './{Feature}List';
import * as api from '@/api/{feature}s';

// Mock the API module
vi.mock('@/api/{feature}s');

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

describe('{Feature}List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders loading state initially', () => {
    vi.mocked(api.use{Feature}s).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    
    render(<{Feature}List />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('renders {feature}s when data is loaded', async () => {
    const mock{Feature}s = [
      { id: 1, name: 'First {Feature}' },
      { id: 2, name: 'Second {Feature}' },
    ];
    
    vi.mocked(api.use{Feature}s).mockReturnValue({
      data: { items: mock{Feature}s, total: 2 },
      isLoading: false,
      error: null,
    } as any);
    
    render(<{Feature}List />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('First {Feature}')).toBeInTheDocument();
      expect(screen.getByText('Second {Feature}')).toBeInTheDocument();
    });
  });
  
  it('renders error state when fetch fails', async () => {
    vi.mocked(api.use{Feature}s).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);
    
    render(<{Feature}List />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
  
  it('renders empty state when no {feature}s exist', async () => {
    vi.mocked(api.use{Feature}s).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    } as any);
    
    render(<{Feature}List />, { wrapper: createWrapper() });
    
    expect(screen.getByText(/no {feature}s found/i)).toBeInTheDocument();
  });
});
```

### React Query Hook Test Template
```typescript
// api/{feature}s.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { use{Feature}s, useCreate{Feature} } from './{feature}s';

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

describe('use{Feature}s', () => {
  it('fetches {feature}s successfully', async () => {
    const mock{Feature}s = [{ id: 1, name: 'Test' }];
    
    server.use(
      http.get('/api/{feature}s', () => {
        return HttpResponse.json({ items: mock{Feature}s, total: 1 });
      })
    );
    
    const { result } = renderHook(() => use{Feature}s(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].name).toBe('Test');
  });
});

describe('useCreate{Feature}', () => {
  it('creates {feature} and invalidates cache', async () => {
    const new{Feature} = { id: 1, name: 'New {Feature}' };
    
    server.use(
      http.post('/api/{feature}s', () => {
        return HttpResponse.json(new{Feature}, { status: 201 });
      })
    );
    
    const { result } = renderHook(() => useCreate{Feature}(), {
      wrapper: createWrapper(),
    });
    
    result.current.mutate({ name: 'New {Feature}' });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(new{Feature});
  });
});
```

## Execution Steps

1. Analyze the target code structure
2. Identify all testable paths and edge cases
3. Determine which dependencies need mocking
4. Generate test classes following patterns above
5. Place tests in correct test project location
6. Remind user to run tests: `dotnet test` or `npm test`

## Test Coverage Checklist

For each method/component, ensure tests for:

### Commands/Mutations
- [ ] Valid input creates/updates correctly
- [ ] Required field validation
- [ ] Boundary conditions (min/max values)
- [ ] Duplicate/conflict handling
- [ ] Authorization (if applicable)
- [ ] Concurrency handling

### Queries
- [ ] Returns correct data shape
- [ ] Filtering works correctly
- [ ] Pagination works correctly
- [ ] Empty result handling
- [ ] Not found handling

### React Components
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Data rendering
- [ ] User interactions
- [ ] Form submissions

---

**Start by asking what the user wants to test.**
