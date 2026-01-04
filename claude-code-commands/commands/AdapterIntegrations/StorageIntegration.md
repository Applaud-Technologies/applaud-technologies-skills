# File Storage Integration Guide

## Overview

Add file/blob storage capabilities with support for multiple cloud providers and local development.

**Interface**: `IFileStorage`
**Providers**: Azure Blob Storage, AWS S3, Local File System, MinIO

## Requirements Gathering

### Question 1: Provider Selection
"Which storage provider(s) do you want to implement?
1. **azure** - Azure Blob Storage
2. **s3** - AWS S3
3. **local** - Local file system (good for development)
4. **minio** - MinIO (S3-compatible, self-hosted)

You can select multiple. Example: 'azure, local' or 's3, minio'"

### Question 2: Features Needed
"Which features do you need?
- **basic** - Upload, download, delete (default)
- **presigned** - Pre-signed URLs for direct client access
- **streaming** - Stream large files without loading into memory
- **metadata** - Custom metadata on files
- **listing** - List files/directories

Example: 'basic, presigned, listing' or 'all'"

## Generated Files

```
src/{Project}.Application/
└── Common/
    └── Interfaces/
        ├── IFileStorage.cs
        └── Storage/
            ├── StoredFile.cs
            ├── FileUploadRequest.cs
            └── FileListResult.cs

src/{Project}.Infrastructure/
└── Services/
    └── Storage/
        ├── StorageOptions.cs
        ├── AzureBlobStorage.cs
        ├── S3FileStorage.cs
        ├── LocalFileStorage.cs
        └── DependencyInjection.cs
```

## Interface Definition

```csharp
// Application/Common/Interfaces/IFileStorage.cs
namespace {Project}.Application.Common.Interfaces;

public interface IFileStorage
{
    /// <summary>
    /// Upload a file from a stream.
    /// </summary>
    Task<StoredFile> UploadAsync(
        FileUploadRequest request, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Download a file as a stream.
    /// </summary>
    Task<Stream> DownloadAsync(
        string path, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Download file content as bytes.
    /// </summary>
    Task<byte[]> DownloadBytesAsync(
        string path, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Delete a file.
    /// </summary>
    Task DeleteAsync(
        string path, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Check if a file exists.
    /// </summary>
    Task<bool> ExistsAsync(
        string path, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Get file metadata without downloading content.
    /// </summary>
    Task<StoredFile?> GetMetadataAsync(
        string path, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Generate a pre-signed URL for direct access.
    /// </summary>
    Task<string> GetPresignedUrlAsync(
        string path,
        TimeSpan expiry,
        bool forUpload = false,
        CancellationToken ct = default);
    
    /// <summary>
    /// List files in a directory/prefix.
    /// </summary>
    Task<FileListResult> ListAsync(
        string? prefix = null,
        int maxResults = 100,
        string? continuationToken = null,
        CancellationToken ct = default);
    
    /// <summary>
    /// Copy a file to a new location.
    /// </summary>
    Task<StoredFile> CopyAsync(
        string sourcePath,
        string destinationPath,
        CancellationToken ct = default);
}
```

```csharp
// Application/Common/Interfaces/Storage/StoredFile.cs
namespace {Project}.Application.Common.Interfaces.Storage;

public record StoredFile
{
    public required string Path { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long Size { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ModifiedAt { get; init; }
    public string? ETag { get; init; }
    public Dictionary<string, string> Metadata { get; init; } = new();
    public string? PublicUrl { get; init; }
}

public record FileUploadRequest
{
    public required Stream Content { get; init; }
    public required string FileName { get; init; }
    public string? ContentType { get; init; }
    public string? Directory { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public bool GenerateUniqueName { get; init; } = true;
    public string? CacheControl { get; init; }
    public bool IsPublic { get; init; } = false;
}

public record FileListResult
{
    public IReadOnlyList<StoredFile> Files { get; init; } = Array.Empty<StoredFile>();
    public IReadOnlyList<string> Directories { get; init; } = Array.Empty<string>();
    public string? ContinuationToken { get; init; }
    public bool HasMore { get; init; }
}
```

## Options Configuration

```csharp
// Infrastructure/Services/Storage/StorageOptions.cs
namespace {Project}.Infrastructure.Services.Storage;

public class StorageOptions
{
    public const string SectionName = "Storage";
    
    public string Provider { get; set; } = "Local";
    public string? BaseUrl { get; set; }
    
    public AzureBlobOptions Azure { get; set; } = new();
    public S3Options S3 { get; set; } = new();
    public LocalStorageOptions Local { get; set; } = new();
}

public class AzureBlobOptions
{
    public string ConnectionString { get; set; } = "";
    public string ContainerName { get; set; } = "uploads";
    public bool CreateContainerIfNotExists { get; set; } = true;
}

public class S3Options
{
    public string Region { get; set; } = "us-east-1";
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string BucketName { get; set; } = "uploads";
    public string? ServiceUrl { get; set; } // For MinIO/custom endpoints
    public bool ForcePathStyle { get; set; } = false; // Required for MinIO
}

public class LocalStorageOptions
{
    public string BasePath { get; set; } = "uploads";
    public string? BaseUrl { get; set; } = "/files";
    public long MaxFileSizeBytes { get; set; } = 100 * 1024 * 1024; // 100MB
}
```

## Azure Blob Storage Implementation

```csharp
// Infrastructure/Services/Storage/AzureBlobStorage.cs
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace {Project}.Infrastructure.Services.Storage;

public class AzureBlobStorage : IFileStorage
{
    private readonly BlobContainerClient _container;
    private readonly StorageOptions _options;
    private readonly ILogger<AzureBlobStorage> _logger;

    public AzureBlobStorage(
        IOptions<StorageOptions> options,
        ILogger<AzureBlobStorage> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        var blobServiceClient = new BlobServiceClient(_options.Azure.ConnectionString);
        _container = blobServiceClient.GetBlobContainerClient(_options.Azure.ContainerName);
        
        if (_options.Azure.CreateContainerIfNotExists)
        {
            _container.CreateIfNotExists();
        }
    }

    public async Task<StoredFile> UploadAsync(
        FileUploadRequest request, 
        CancellationToken ct = default)
    {
        var path = GeneratePath(request);
        var blob = _container.GetBlobClient(path);
        
        var headers = new BlobHttpHeaders
        {
            ContentType = request.ContentType ?? GetContentType(request.FileName),
            CacheControl = request.CacheControl
        };

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = headers,
            Metadata = request.Metadata
        };

        if (request.IsPublic)
        {
            // Set public access at blob level if needed
        }

        await blob.UploadAsync(request.Content, uploadOptions, ct);
        
        var properties = await blob.GetPropertiesAsync(cancellationToken: ct);
        
        _logger.LogInformation("File uploaded to Azure Blob: {Path}", path);

        return new StoredFile
        {
            Path = path,
            FileName = request.FileName,
            ContentType = headers.ContentType,
            Size = properties.Value.ContentLength,
            CreatedAt = properties.Value.CreatedOn.DateTime,
            ModifiedAt = properties.Value.LastModified.DateTime,
            ETag = properties.Value.ETag.ToString(),
            Metadata = properties.Value.Metadata.ToDictionary(x => x.Key, x => x.Value),
            PublicUrl = request.IsPublic ? blob.Uri.ToString() : null
        };
    }

    public async Task<Stream> DownloadAsync(string path, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        var response = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return response.Value.Content;
    }

    public async Task<byte[]> DownloadBytesAsync(string path, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        var response = await blob.DownloadContentAsync(cancellationToken: ct);
        return response.Value.Content.ToArray();
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        await blob.DeleteIfExistsAsync(cancellationToken: ct);
        _logger.LogInformation("File deleted from Azure Blob: {Path}", path);
    }

    public async Task<bool> ExistsAsync(string path, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        return await blob.ExistsAsync(ct);
    }

    public async Task<StoredFile?> GetMetadataAsync(string path, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        
        if (!await blob.ExistsAsync(ct))
            return null;
            
        var properties = await blob.GetPropertiesAsync(cancellationToken: ct);
        
        return new StoredFile
        {
            Path = path,
            FileName = Path.GetFileName(path),
            ContentType = properties.Value.ContentType,
            Size = properties.Value.ContentLength,
            CreatedAt = properties.Value.CreatedOn.DateTime,
            ModifiedAt = properties.Value.LastModified.DateTime,
            ETag = properties.Value.ETag.ToString(),
            Metadata = properties.Value.Metadata.ToDictionary(x => x.Key, x => x.Value)
        };
    }

    public Task<string> GetPresignedUrlAsync(
        string path,
        TimeSpan expiry,
        bool forUpload = false,
        CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(path);
        
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _container.Name,
            BlobName = path,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
        };

        sasBuilder.SetPermissions(forUpload 
            ? BlobSasPermissions.Write | BlobSasPermissions.Create
            : BlobSasPermissions.Read);

        var uri = blob.GenerateSasUri(sasBuilder);
        return Task.FromResult(uri.ToString());
    }

    public async Task<FileListResult> ListAsync(
        string? prefix = null,
        int maxResults = 100,
        string? continuationToken = null,
        CancellationToken ct = default)
    {
        var files = new List<StoredFile>();
        var directories = new HashSet<string>();
        
        await foreach (var item in _container.GetBlobsByHierarchyAsync(
            prefix: prefix,
            delimiter: "/",
            cancellationToken: ct))
        {
            if (item.IsPrefix)
            {
                directories.Add(item.Prefix);
            }
            else if (item.IsBlob)
            {
                files.Add(new StoredFile
                {
                    Path = item.Blob.Name,
                    FileName = Path.GetFileName(item.Blob.Name),
                    ContentType = item.Blob.Properties.ContentType ?? "application/octet-stream",
                    Size = item.Blob.Properties.ContentLength ?? 0,
                    CreatedAt = item.Blob.Properties.CreatedOn?.DateTime ?? DateTime.MinValue,
                    ModifiedAt = item.Blob.Properties.LastModified?.DateTime
                });
            }
            
            if (files.Count >= maxResults)
                break;
        }

        return new FileListResult
        {
            Files = files,
            Directories = directories.ToList(),
            HasMore = files.Count >= maxResults
        };
    }

    public async Task<StoredFile> CopyAsync(
        string sourcePath,
        string destinationPath,
        CancellationToken ct = default)
    {
        var sourceBlob = _container.GetBlobClient(sourcePath);
        var destBlob = _container.GetBlobClient(destinationPath);
        
        await destBlob.StartCopyFromUriAsync(sourceBlob.Uri, cancellationToken: ct);
        
        return (await GetMetadataAsync(destinationPath, ct))!;
    }

    private string GeneratePath(FileUploadRequest request)
    {
        var fileName = request.GenerateUniqueName
            ? $"{Guid.NewGuid()}{Path.GetExtension(request.FileName)}"
            : request.FileName;
            
        return string.IsNullOrEmpty(request.Directory)
            ? fileName
            : $"{request.Directory.TrimEnd('/')}/{fileName}";
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".pdf" => "application/pdf",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".txt" => "text/plain",
            ".html" => "text/html",
            ".css" => "text/css",
            ".js" => "application/javascript",
            _ => "application/octet-stream"
        };
    }
}
```

## AWS S3 Implementation

```csharp
// Infrastructure/Services/Storage/S3FileStorage.cs
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;

namespace {Project}.Infrastructure.Services.Storage;

public class S3FileStorage : IFileStorage
{
    private readonly IAmazonS3 _client;
    private readonly StorageOptions _options;
    private readonly ILogger<S3FileStorage> _logger;

    public S3FileStorage(
        IOptions<StorageOptions> options,
        ILogger<S3FileStorage> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        var config = new AmazonS3Config
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_options.S3.Region)
        };

        // Support MinIO and custom endpoints
        if (!string.IsNullOrEmpty(_options.S3.ServiceUrl))
        {
            config.ServiceURL = _options.S3.ServiceUrl;
            config.ForcePathStyle = _options.S3.ForcePathStyle;
        }

        _client = string.IsNullOrEmpty(_options.S3.AccessKeyId)
            ? new AmazonS3Client(config)
            : new AmazonS3Client(
                _options.S3.AccessKeyId,
                _options.S3.SecretAccessKey,
                config);
    }

    public async Task<StoredFile> UploadAsync(
        FileUploadRequest request, 
        CancellationToken ct = default)
    {
        var path = GeneratePath(request);
        
        var putRequest = new PutObjectRequest
        {
            BucketName = _options.S3.BucketName,
            Key = path,
            InputStream = request.Content,
            ContentType = request.ContentType ?? GetContentType(request.FileName)
        };

        if (request.Metadata != null)
        {
            foreach (var (key, value) in request.Metadata)
            {
                putRequest.Metadata.Add(key, value);
            }
        }

        if (!string.IsNullOrEmpty(request.CacheControl))
        {
            putRequest.Headers.CacheControl = request.CacheControl;
        }

        if (request.IsPublic)
        {
            putRequest.CannedACL = S3CannedACL.PublicRead;
        }

        await _client.PutObjectAsync(putRequest, ct);
        
        _logger.LogInformation("File uploaded to S3: {Path}", path);

        var metadata = await GetMetadataAsync(path, ct);
        return metadata!;
    }

    public async Task<Stream> DownloadAsync(string path, CancellationToken ct = default)
    {
        var response = await _client.GetObjectAsync(
            _options.S3.BucketName, 
            path, 
            ct);
        return response.ResponseStream;
    }

    public async Task<byte[]> DownloadBytesAsync(string path, CancellationToken ct = default)
    {
        using var stream = await DownloadAsync(path, ct);
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, ct);
        return memoryStream.ToArray();
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        await _client.DeleteObjectAsync(_options.S3.BucketName, path, ct);
        _logger.LogInformation("File deleted from S3: {Path}", path);
    }

    public async Task<bool> ExistsAsync(string path, CancellationToken ct = default)
    {
        try
        {
            await _client.GetObjectMetadataAsync(_options.S3.BucketName, path, ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<StoredFile?> GetMetadataAsync(string path, CancellationToken ct = default)
    {
        try
        {
            var response = await _client.GetObjectMetadataAsync(
                _options.S3.BucketName, 
                path, 
                ct);

            return new StoredFile
            {
                Path = path,
                FileName = Path.GetFileName(path),
                ContentType = response.Headers.ContentType,
                Size = response.ContentLength,
                CreatedAt = response.LastModified,
                ModifiedAt = response.LastModified,
                ETag = response.ETag,
                Metadata = response.Metadata.Keys
                    .ToDictionary(k => k, k => response.Metadata[k])
            };
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public Task<string> GetPresignedUrlAsync(
        string path,
        TimeSpan expiry,
        bool forUpload = false,
        CancellationToken ct = default)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.S3.BucketName,
            Key = path,
            Expires = DateTime.UtcNow.Add(expiry),
            Verb = forUpload ? HttpVerb.PUT : HttpVerb.GET
        };

        var url = _client.GetPreSignedURL(request);
        return Task.FromResult(url);
    }

    public async Task<FileListResult> ListAsync(
        string? prefix = null,
        int maxResults = 100,
        string? continuationToken = null,
        CancellationToken ct = default)
    {
        var request = new ListObjectsV2Request
        {
            BucketName = _options.S3.BucketName,
            Prefix = prefix,
            Delimiter = "/",
            MaxKeys = maxResults,
            ContinuationToken = continuationToken
        };

        var response = await _client.ListObjectsV2Async(request, ct);

        var files = response.S3Objects.Select(obj => new StoredFile
        {
            Path = obj.Key,
            FileName = Path.GetFileName(obj.Key),
            ContentType = "application/octet-stream",
            Size = obj.Size,
            CreatedAt = obj.LastModified,
            ModifiedAt = obj.LastModified,
            ETag = obj.ETag
        }).ToList();

        var directories = response.CommonPrefixes;

        return new FileListResult
        {
            Files = files,
            Directories = directories,
            ContinuationToken = response.NextContinuationToken,
            HasMore = response.IsTruncated
        };
    }

    public async Task<StoredFile> CopyAsync(
        string sourcePath,
        string destinationPath,
        CancellationToken ct = default)
    {
        await _client.CopyObjectAsync(
            _options.S3.BucketName,
            sourcePath,
            _options.S3.BucketName,
            destinationPath,
            ct);

        return (await GetMetadataAsync(destinationPath, ct))!;
    }

    private string GeneratePath(FileUploadRequest request)
    {
        var fileName = request.GenerateUniqueName
            ? $"{Guid.NewGuid()}{Path.GetExtension(request.FileName)}"
            : request.FileName;
            
        return string.IsNullOrEmpty(request.Directory)
            ? fileName
            : $"{request.Directory.TrimEnd('/')}/{fileName}";
    }

    private static string GetContentType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
}
```

## Local File Storage Implementation

```csharp
// Infrastructure/Services/Storage/LocalFileStorage.cs
namespace {Project}.Infrastructure.Services.Storage;

public class LocalFileStorage : IFileStorage
{
    private readonly StorageOptions _options;
    private readonly ILogger<LocalFileStorage> _logger;
    private readonly string _basePath;

    public LocalFileStorage(
        IOptions<StorageOptions> options,
        IWebHostEnvironment environment,
        ILogger<LocalFileStorage> logger)
    {
        _options = options.Value;
        _logger = logger;
        
        _basePath = Path.IsPathRooted(_options.Local.BasePath)
            ? _options.Local.BasePath
            : Path.Combine(environment.ContentRootPath, _options.Local.BasePath);
            
        Directory.CreateDirectory(_basePath);
    }

    public async Task<StoredFile> UploadAsync(
        FileUploadRequest request, 
        CancellationToken ct = default)
    {
        var path = GeneratePath(request);
        var fullPath = GetFullPath(path);
        
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        
        await using var fileStream = File.Create(fullPath);
        await request.Content.CopyToAsync(fileStream, ct);
        
        var fileInfo = new FileInfo(fullPath);
        
        _logger.LogInformation("File uploaded to local storage: {Path}", path);

        return new StoredFile
        {
            Path = path,
            FileName = request.FileName,
            ContentType = request.ContentType ?? GetContentType(request.FileName),
            Size = fileInfo.Length,
            CreatedAt = fileInfo.CreationTimeUtc,
            ModifiedAt = fileInfo.LastWriteTimeUtc,
            PublicUrl = $"{_options.Local.BaseUrl}/{path}"
        };
    }

    public Task<Stream> DownloadAsync(string path, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(path);
        
        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"File not found: {path}");
            
        return Task.FromResult<Stream>(File.OpenRead(fullPath));
    }

    public async Task<byte[]> DownloadBytesAsync(string path, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(path);
        return await File.ReadAllBytesAsync(fullPath, ct);
    }

    public Task DeleteAsync(string path, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(path);
        
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("File deleted from local storage: {Path}", path);
        }
        
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string path, CancellationToken ct = default)
    {
        return Task.FromResult(File.Exists(GetFullPath(path)));
    }

    public Task<StoredFile?> GetMetadataAsync(string path, CancellationToken ct = default)
    {
        var fullPath = GetFullPath(path);
        
        if (!File.Exists(fullPath))
            return Task.FromResult<StoredFile?>(null);
            
        var fileInfo = new FileInfo(fullPath);
        
        return Task.FromResult<StoredFile?>(new StoredFile
        {
            Path = path,
            FileName = fileInfo.Name,
            ContentType = GetContentType(fileInfo.Name),
            Size = fileInfo.Length,
            CreatedAt = fileInfo.CreationTimeUtc,
            ModifiedAt = fileInfo.LastWriteTimeUtc,
            PublicUrl = $"{_options.Local.BaseUrl}/{path}"
        });
    }

    public Task<string> GetPresignedUrlAsync(
        string path,
        TimeSpan expiry,
        bool forUpload = false,
        CancellationToken ct = default)
    {
        // Local storage doesn't support pre-signed URLs
        // Return the direct URL
        return Task.FromResult($"{_options.Local.BaseUrl}/{path}");
    }

    public Task<FileListResult> ListAsync(
        string? prefix = null,
        int maxResults = 100,
        string? continuationToken = null,
        CancellationToken ct = default)
    {
        var searchPath = string.IsNullOrEmpty(prefix)
            ? _basePath
            : Path.Combine(_basePath, prefix);
            
        if (!Directory.Exists(searchPath))
        {
            return Task.FromResult(new FileListResult());
        }

        var files = Directory.GetFiles(searchPath)
            .Take(maxResults)
            .Select(f =>
            {
                var info = new FileInfo(f);
                var relativePath = Path.GetRelativePath(_basePath, f).Replace('\\', '/');
                return new StoredFile
                {
                    Path = relativePath,
                    FileName = info.Name,
                    ContentType = GetContentType(info.Name),
                    Size = info.Length,
                    CreatedAt = info.CreationTimeUtc,
                    ModifiedAt = info.LastWriteTimeUtc
                };
            })
            .ToList();

        var directories = Directory.GetDirectories(searchPath)
            .Select(d => Path.GetRelativePath(_basePath, d).Replace('\\', '/') + "/")
            .ToList();

        return Task.FromResult(new FileListResult
        {
            Files = files,
            Directories = directories,
            HasMore = false
        });
    }

    public async Task<StoredFile> CopyAsync(
        string sourcePath,
        string destinationPath,
        CancellationToken ct = default)
    {
        var sourceFullPath = GetFullPath(sourcePath);
        var destFullPath = GetFullPath(destinationPath);
        
        Directory.CreateDirectory(Path.GetDirectoryName(destFullPath)!);
        File.Copy(sourceFullPath, destFullPath, overwrite: true);
        
        return (await GetMetadataAsync(destinationPath, ct))!;
    }

    private string GetFullPath(string path) =>
        Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));

    private string GeneratePath(FileUploadRequest request)
    {
        var fileName = request.GenerateUniqueName
            ? $"{Guid.NewGuid()}{Path.GetExtension(request.FileName)}"
            : request.FileName;
            
        return string.IsNullOrEmpty(request.Directory)
            ? fileName
            : $"{request.Directory.TrimEnd('/')}/{fileName}";
    }

    private static string GetContentType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
}
```

## Dependency Injection

```csharp
// Infrastructure/Services/Storage/DependencyInjection.cs
namespace {Project}.Infrastructure.Services.Storage;

public static class StorageServiceExtensions
{
    public static IServiceCollection AddStorageServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<StorageOptions>(
            configuration.GetSection(StorageOptions.SectionName));
        
        services.AddScoped<AzureBlobStorage>();
        services.AddScoped<S3FileStorage>();
        services.AddScoped<LocalFileStorage>();
        
        services.AddScoped<IFileStorage>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<StorageOptions>>().Value;
            
            return options.Provider?.ToLowerInvariant() switch
            {
                "azure" => sp.GetRequiredService<AzureBlobStorage>(),
                "s3" or "minio" => sp.GetRequiredService<S3FileStorage>(),
                "local" => sp.GetRequiredService<LocalFileStorage>(),
                _ => sp.GetRequiredService<LocalFileStorage>()
            };
        });
        
        return services;
    }
}
```

## appsettings.json

```json
{
  "Storage": {
    "Provider": "Local",
    
    "Azure": {
      "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx",
      "ContainerName": "uploads",
      "CreateContainerIfNotExists": true
    },
    
    "S3": {
      "Region": "us-east-1",
      "AccessKeyId": null,
      "SecretAccessKey": null,
      "BucketName": "my-app-uploads",
      "ServiceUrl": null,
      "ForcePathStyle": false
    },
    
    "Local": {
      "BasePath": "uploads",
      "BaseUrl": "/files",
      "MaxFileSizeBytes": 104857600
    }
  }
}
```

## Required NuGet Packages

| Provider | Package | Command |
|----------|---------|---------|
| Azure Blob | `Azure.Storage.Blobs` | `dotnet add package Azure.Storage.Blobs` |
| AWS S3 | `AWSSDK.S3` | `dotnet add package AWSSDK.S3` |
| Local | (built-in) | N/A |

---

**After generating, remind user to:**
1. Add appropriate NuGet packages
2. Configure connection strings/credentials
3. Register services: `builder.Services.AddStorageServices(builder.Configuration);`
4. (Local) Configure static file serving if needed
5. (Azure/S3) Set up CORS if using pre-signed URLs for browser uploads
