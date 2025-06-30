# API Documentation Configuration

## Environment Variables
Create a `.env` file with the following variables for documentation:

```env
# API Documentation
API_BASE_URL=http://localhost:3000
API_TITLE=Uvision API Documentation
API_VERSION=1.0.0
API_DESCRIPTION=Comprehensive REST API documentation for Uvision Backend

# Documentation Settings
DOCS_ENABLED=true
DOCS_PATH=/api-docs
REDOC_PATH=/redoc
```

## Documentation URLs

### Development
- **Swagger UI**: http://localhost:3000/api-docs
- **ReDoc**: http://localhost:3000/redoc
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

### Production
- **Swagger UI**: https://api.uvision.com/api-docs
- **ReDoc**: https://api.uvision.com/redoc
- **OpenAPI JSON**: https://api.uvision.com/api-docs.json

## Authentication for Testing

### Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Header
```
x-access-token: your-jwt-token-here
```

## Available NPM Scripts

- `npm run docs:generate` - Generate static documentation files
- `npm run docs:serve` - Show documentation URLs
- `npm run docs:build` - Build and validate documentation
- `npm run docs:validate` - Validate OpenAPI specification
