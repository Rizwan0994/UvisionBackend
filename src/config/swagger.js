const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Uvision API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Uvision Backend',
      contact: {
        name: 'API Support',
        email: 'support@uvision.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.uvision.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme.'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-access-token',
          description: 'API key for accessing protected endpoints'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 0
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'object'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 1
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            profilePicture: {
              type: 'string',
              example: 'https://example.com/profile.jpg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'Project Discussion'
            },
            description: {
              type: 'string',
              example: 'Discussion about project requirements'
            },
            createdBy: {
              type: 'integer',
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            content: {
              type: 'string',
              example: 'Hello, world!'
            },
            senderId: {
              type: 'integer',
              example: 1
            },
            chatId: {
              type: 'integer',
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 0,
                message: 'Unauthorized access'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 0,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error in request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 0,
                message: 'Validation failed',
                error: {
                  field: 'Field validation error message'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        ApiKeyAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Chat',
        description: 'Chat and messaging operations'
      },
      {
        name: 'Messages',
        description: 'Message management operations'
      },
      {
        name: 'Profile',
        description: 'User profile management'
      },
      {
        name: 'Notifications',
        description: 'Push notification operations'
      },
      {
        name: 'Logs',
        description: 'System logging operations'
      },
      {
        name: 'Version',
        description: 'Application version management'
      },
      {
        name: 'Health',
        description: 'Health check and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .scheme-container { background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .swagger-ui .info { margin: 30px 0; }
  .swagger-ui .info .title { color: #1f2937; font-size: 36px; }
  .swagger-ui .info .description { color: #6b7280; font-size: 16px; line-height: 1.6; }
  .swagger-ui .opblock.opblock-post { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
  .swagger-ui .opblock.opblock-get { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
  .swagger-ui .opblock.opblock-put { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
  .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: 'Uvision API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
