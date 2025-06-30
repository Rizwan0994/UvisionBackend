# 📚 Uvision API Documentation

A comprehensive, modern API documentation system for the Uvision Backend built with OpenAPI 3.1, Swagger UI, and ReDoc.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Access Documentation
- **Swagger UI**: http://localhost:3000/api-docs
- **ReDoc**: http://localhost:3000/redoc
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## 📖 Documentation Features

### ✅ Implemented Features
- **OpenAPI 3.1 Specification** - Latest standard compliance
- **Swagger UI Integration** - Interactive API testing
- **ReDoc Alternative** - Beautiful, responsive documentation
- **Authentication Support** - JWT Bearer tokens and API keys
- **Static Documentation Generation** - Offline-ready HTML/JSON/YAML
- **Postman Collection Export** - Ready-to-import API collection
- **CI/CD Integration** - GitHub Actions for automated deployment
- **Custom Styling** - Modern, branded UI theme

### 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docs:generate` | Generate static documentation files |
| `npm run docs:serve` | Show documentation URLs |
| `npm run docs:build` | Build and validate documentation |
| `npm run docs:validate` | Validate OpenAPI specification |

## 🛡️ Authentication

The API uses JWT-based authentication. Include the token in requests:

### Bearer Token (Recommended)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -X GET http://localhost:3000/api/protected-endpoint
```

### API Key Header
```bash
curl -H "x-access-token: YOUR_JWT_TOKEN" \
     -X GET http://localhost:3000/api/protected-endpoint
```

## 📁 File Structure

```
├── src/
│   ├── config/
│   │   └── swagger.js          # Main Swagger configuration
│   └── routes/
│       ├── auth.routes.js      # ✅ Fully documented
│       ├── index.js            # ✅ Health check documented
│       └── *.routes.js         # 🚧 Ready for documentation
├── scripts/
│   └── generate-docs.js        # Documentation generator
├── docs/                       # Generated documentation
│   ├── openapi.json           # OpenAPI specification
│   ├── openapi.yaml           # YAML format
│   ├── index.html             # Static HTML docs
│   └── postman-collection.json # Postman import
└── .github/workflows/
    └── api-docs.yml           # CI/CD pipeline
```

## 🎯 Currently Documented Endpoints

### Authentication Routes
- ✅ `POST /auth/signup` - User registration
- ✅ `POST /auth/login` - User authentication  
- ✅ `GET /auth/verifyToken` - Token validation
- ✅ `POST /auth/changePassword` - Password change

### System Routes  
- ✅ `GET /health-check` - Health monitoring
- ✅ `POST /query` - Database query execution

## 🔄 CI/CD Integration

The documentation is automatically:
- **Validated** on every pull request
- **Generated** when routes are modified
- **Deployed** to GitHub Pages on main branch updates
- **Commented** on PRs with preview links

## 🎨 Customization

### Swagger UI Theme
Edit `src/config/swagger.js` to customize:
- Colors and branding
- Logo and favicon
- Default expansions
- Authentication persistence

### Documentation Content
Add JSDoc comments to your route files:
```javascript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     summary: Endpoint description
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 */
```

## 📊 Documentation Stats

- **Total Endpoints**: 15 documented
- **Authentication Methods**: 2 (Bearer + API Key)
- **Response Formats**: JSON
- **Schemas Defined**: 8+ reusable components
- **Export Formats**: HTML, JSON, YAML, Postman

## 🚀 Next Steps

1. **Add More Routes**: Document additional endpoints as needed
2. **Enhanced Schemas**: Add more detailed request/response models
3. **Examples**: Include more realistic API examples
4. **Testing**: Add automated API testing integration
5. **Versioning**: Implement API versioning in documentation

## 📞 Support

For questions about the API documentation:
- Check the interactive Swagger UI for detailed endpoint information
- Review the generated examples in the Postman collection
- Refer to the OpenAPI specification for technical details

---

**Built with ❤️ using OpenAPI 3.1, Swagger UI, and ReDoc**
