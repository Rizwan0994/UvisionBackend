# API Documentation Guide

## Overview

This document provides guidelines for maintaining and updating the Uvision API documentation.

## Documentation Stack

- **OpenAPI 3.1** - API specification standard
- **Swagger UI** - Interactive API documentation
- **ReDoc** - Alternative beautiful documentation
- **Postman Collection** - Ready-to-use API collection
- **GitHub Actions** - Automated documentation generation

## Accessing Documentation

### Development Environment
- **Swagger UI**: http://localhost:3000/api-docs
- **ReDoc**: http://localhost:3000/redoc
- **JSON Spec**: http://localhost:3000/api-docs.json

### Production Environment
- **Live Documentation**: https://your-domain.com/api-docs
- **GitHub Pages**: https://your-username.github.io/repo-name/api-docs/

## Available Scripts

```bash
# Generate all documentation formats
npm run docs:generate

# Validate OpenAPI specification
npm run docs:validate

# Build documentation for deployment
npm run docs:build

# Show documentation URLs
npm run docs:serve
```

## Adding Documentation to Routes

### Basic Route Documentation

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Tag Name]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseSchema'
 */
```

### Request Body Documentation

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *               - field2
 *             properties:
 *               field1:
 *                 type: string
 *                 example: "example value"
 *               field2:
 *                 type: integer
 *                 example: 123
 */
```

## Schema Definitions

Reusable schemas are defined in `/src/config/swagger.js`:

- `User` - User object structure
- `Chat` - Chat object structure
- `Message` - Message object structure
- `Error` - Standard error response
- `Success` - Standard success response

## Authentication Documentation

The API supports two authentication methods:

1. **Bearer Token**: `Authorization: Bearer <token>`
2. **API Key**: `x-access-token: <token>`

## Response Standards

All API responses follow this structure:

```json
{
  "status": 1,
  "message": "Success message",
  "data": {}
}
```

Error responses:

```json
{
  "status": 0,
  "message": "Error message",
  "error": {}
}
```

## Best Practices

1. **Always document new endpoints** immediately after creation
2. **Include examples** for all request/response schemas
3. **Use consistent naming** for parameters and schemas
4. **Add proper HTTP status codes** for all possible responses
5. **Group related endpoints** using tags
6. **Include security requirements** for protected endpoints

## Automated Updates

Documentation is automatically:
- Generated on code changes to routes
- Validated in CI/CD pipeline
- Deployed to GitHub Pages on main branch
- Posted as PR comments for review

## Troubleshooting

### Common Issues

1. **Missing documentation**: Add JSDoc comments to route files
2. **Invalid OpenAPI spec**: Run `npm run docs:validate`
3. **Outdated docs**: Run `npm run docs:generate`
4. **CI/CD failures**: Check GitHub Actions logs

### Manual Regeneration

```bash
# Clean and regenerate
rm -rf docs/
npm run docs:generate
```

## Contributing

When adding new API endpoints:

1. Add proper JSDoc documentation
2. Include all possible responses
3. Add examples for request/response bodies
4. Test documentation locally
5. Ensure CI/CD passes

## Support

For documentation issues:
- Check this guide first
- Review existing examples in `/src/routes/`
- Consult OpenAPI 3.1 specification
- Create issue if problems persist
