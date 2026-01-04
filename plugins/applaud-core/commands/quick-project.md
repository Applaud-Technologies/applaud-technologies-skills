# Quick Project Setup Command

You are a rapid project scaffolding agent that creates projects with sensible defaults and minimal questions.

## Purpose

For when you want a project set up quickly without going through all the configuration options. Uses the standard tech stack with common defaults.

## Defaults Applied

- **Database**: SQL Server
- **Project Type**: Full-Stack (API + React)
- **Features**: SignalR, Background Jobs (TickerQ), Docker
- **Integrations**: Email adapter (interface only)
- **Testing**: Full test project setup

## Single Question

Ask only:

"What's the project name and a one-sentence description?
Example: 'TaskManager - A task management application for teams'"

## Immediate Execution

After getting the project name:

1. Parse the name (use PascalCase for project, handle spaces)
2. Create the full project structure
3. Generate all standard files
4. Run `dotnet restore`
5. Run `npm install` in the client folder
6. Provide summary and next steps

## Quick Reference - Files to Generate

### Solution Structure
```
{ProjectName}/
├── src/
│   ├── client/                         # React Frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── server/                         # ASP.NET Core Backend
│       ├── {ProjectName}.Domain/
│       ├── {ProjectName}.Application/
│       ├── {ProjectName}.Infrastructure/
│       └── {ProjectName}.Api/
│
├── tests/
│   ├── server/
│   │   ├── {ProjectName}.Domain.Tests/
│   │   ├── {ProjectName}.Application.Tests/
│   │   ├── {ProjectName}.Infrastructure.Tests/
│   │   └── {ProjectName}.Api.Tests/
│   └── client/
│       └── vitest tests
│
├── docker/
├── {ProjectName}.sln
├── Directory.Build.props
├── Directory.Packages.props
├── .gitignore
├── .editorconfig
├── README.md
└── CLAUDE.md
```

### Key Files Content

#### Directory.Build.props
```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

#### Directory.Packages.props
```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <!-- Core -->
    <PackageVersion Include="MediatR" Version="12.*" />
    <PackageVersion Include="FluentValidation" Version="11.*" />
    <PackageVersion Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
    
    <!-- EF Core -->
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="8.*" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.*" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Design" Version="8.*" />
    
    <!-- API -->
    <PackageVersion Include="Swashbuckle.AspNetCore" Version="6.*" />
    <PackageVersion Include="Microsoft.AspNetCore.SignalR.Common" Version="8.*" />
    
    <!-- Background Jobs -->
    <PackageVersion Include="TickerQ" Version="*" />
    
    <!-- Testing -->
    <PackageVersion Include="xunit" Version="3.*" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="3.*" />
    <PackageVersion Include="Shouldly" Version="4.*" />
    <PackageVersion Include="NSubstitute" Version="5.*" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.*" />
  </ItemGroup>
</Project>
```

#### Domain - BaseEntity.cs
```csharp
namespace {ProjectName}.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }
    
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

#### Domain - IRepository.cs
```csharp
namespace {ProjectName}.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    // Single entity retrieval
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IQueryable<T>>? include = null,
        CancellationToken ct = default);
    
    // List retrieval
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
}
```

#### Application - ValidationBehavior.cs
```csharp
namespace {ProjectName}.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));
        
        var errors = failures
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (errors.Any())
            throw new ValidationException(errors);

        return await next();
    }
}
```

#### Infrastructure - Repository.cs
```csharp
namespace {ProjectName}.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    
    public Repository(AppDbContext context) => _context = context;
    
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
        await _context.SaveChangesAsync(ct);
        return entity;
    }
    
    public virtual async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
    {
        await _context.Set<T>().AddRangeAsync(entities, ct);
        await _context.SaveChangesAsync(ct);
    }
    
    public virtual async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _context.Set<T>().Update(entity);
        await _context.SaveChangesAsync(ct);
    }
    
    public virtual async Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _context.Set<T>().Remove(entity);
        await _context.SaveChangesAsync(ct);
    }
    
    public virtual async Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
    {
        _context.Set<T>().RemoveRange(entities);
        await _context.SaveChangesAsync(ct);
    }
}
```

#### Api - Program.cs
```csharp
using {ProjectName}.Application;
using {ProjectName}.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// CORS for React dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
```

#### Client - package.json
```json
{
  "name": "{project-name}-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-router": "^7.0.0",
    "@microsoft/signalr": "^8.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=db;Database={ProjectName};User=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=true
    depends_on:
      - db

  client:
    build:
      context: ./src/client
      dockerfile: ../../docker/Dockerfile.client
    ports:
      - "3000:80"
    depends_on:
      - api

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong!Passw0rd
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql

volumes:
  sqlserver_data:
```

## Output Summary

After generation, provide:

```
✅ Project '{ProjectName}' created successfully!

📁 Structure:
   - src/server: 4 .NET projects (Domain, Application, Infrastructure, Api)
   - src/client: React 19 + Vite frontend
   - tests/server: 4 test projects
   - tests/client: Vitest tests
   - Docker configuration

🚀 Next steps:
   1. cd {ProjectName}
   2. Update connection string in src/server/{ProjectName}.Api/appsettings.json
   3. Run: dotnet ef migrations add Initial -p src/server/{ProjectName}.Infrastructure -s src/server/{ProjectName}.Api
   4. Run: dotnet ef database update -p src/server/{ProjectName}.Infrastructure -s src/server/{ProjectName}.Api
   5. Start API: dotnet run --project src/server/{ProjectName}.Api
   6. Start Client: cd src/client && npm run dev

📖 See CLAUDE.md for project conventions and architecture details.
```

---

**Ask for the project name and description, then immediately generate everything.**
