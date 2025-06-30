const fs = require('fs');
const path = require('path');
const yaml = require('yamljs');
const { specs } = require('../src/config/swagger');

/**
 * Generate OpenAPI specification files for different environments
 */
class DocumentationGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, '../docs');
        this.ensureOutputDirectory();
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate JSON specification file
     */
    generateJson() {
        const jsonPath = path.join(this.outputDir, 'openapi.json');
        fs.writeFileSync(jsonPath, JSON.stringify(specs, null, 2));
        console.log(`✅ OpenAPI JSON specification generated: ${jsonPath}`);
        return jsonPath;
    }

    /**
     * Generate YAML specification file
     */
    generateYaml() {
        const yamlPath = path.join(this.outputDir, 'openapi.yaml');
        const yamlContent = yaml.stringify(specs, 4);
        fs.writeFileSync(yamlPath, yamlContent);
        console.log(`✅ OpenAPI YAML specification generated: ${yamlPath}`);
        return yamlPath;
    }

    /**
     * Generate static HTML documentation using ReDoc
     */
    generateHtml() {
        const htmlPath = path.join(this.outputDir, 'index.html');
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Uvision API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Roboto', sans-serif;
        }
        .header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.8;
            font-size: 1.1em;
        }
        .docs-container {
            max-width: 1200px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Uvision API Documentation</h1>
        <p>Comprehensive REST API documentation for developers</p>
    </div>
    <div class="docs-container">
        <redoc spec-url='./openapi.json' theme='{ "colors": { "primary": { "main": "#1f2937" } } }'></redoc>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js"></script>
</body>
</html>`;
        
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ Static HTML documentation generated: ${htmlPath}`);
        return htmlPath;
    }

    /**
     * Generate Postman collection
     */
    generatePostmanCollection() {
        const collection = {
            info: {
                name: "Uvision API",
                description: "Comprehensive API collection for Uvision Backend",
                version: "1.0.0",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            auth: {
                type: "bearer",
                bearer: [
                    {
                        key: "token",
                        value: "{{access_token}}",
                        type: "string"
                    }
                ]
            },
            variable: [
                {
                    key: "base_url",
                    value: "{{base_url}}",
                    type: "string"
                },
                {
                    key: "access_token",
                    value: "",
                    type: "string"
                }
            ],
            item: this.generatePostmanItems(specs)
        };

        const postmanPath = path.join(this.outputDir, 'postman-collection.json');
        fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2));
        console.log(`✅ Postman collection generated: ${postmanPath}`);
        return postmanPath;
    }

    generatePostmanItems(spec) {
        const items = [];
        
        if (!spec.paths) return items;

        Object.keys(spec.paths).forEach(path => {
            Object.keys(spec.paths[path]).forEach(method => {
                const operation = spec.paths[path][method];
                const item = {
                    name: operation.summary || `${method.toUpperCase()} ${path}`,
                    request: {
                        method: method.toUpperCase(),
                        header: [
                            {
                                key: "Content-Type",
                                value: "application/json",
                                type: "text"
                            }
                        ],
                        url: {
                            raw: `{{base_url}}${path}`,
                            host: ["{{base_url}}"],
                            path: path.split('/').filter(p => p)
                        }
                    }
                };

                // Add request body if present
                if (operation.requestBody) {
                    item.request.body = {
                        mode: "raw",
                        raw: JSON.stringify(this.generateExampleFromSchema(operation.requestBody), null, 2)
                    };
                }

                items.push(item);
            });
        });

        return items;
    }

    generateExampleFromSchema(requestBody) {
        // Simple example generation - can be enhanced
        if (requestBody.content && requestBody.content['application/json'] && 
            requestBody.content['application/json'].schema) {
            const schema = requestBody.content['application/json'].schema;
            return this.generateExample(schema);
        }
        return {};
    }

    generateExample(schema) {
        if (schema.example) return schema.example;
        if (schema.properties) {
            const example = {};
            Object.keys(schema.properties).forEach(prop => {
                const propSchema = schema.properties[prop];
                if (propSchema.example !== undefined) {
                    example[prop] = propSchema.example;
                } else if (propSchema.type === 'string') {
                    example[prop] = `example_${prop}`;
                } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
                    example[prop] = 1;
                } else if (propSchema.type === 'boolean') {
                    example[prop] = true;
                }
            });
            return example;
        }
        return {};
    }

    /**
     * Generate all documentation formats
     */
    generateAll() {
        console.log('🚀 Generating API documentation...\n');
        
        try {
            this.generateJson();
            this.generateYaml();
            this.generateHtml();
            this.generatePostmanCollection();
            
            console.log('\n✨ All documentation generated successfully!');
            console.log(`📁 Documentation available in: ${this.outputDir}`);
            console.log(`🌐 View HTML docs: file://${path.join(this.outputDir, 'index.html')}`);
        } catch (error) {
            console.error('❌ Error generating documentation:', error);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new DocumentationGenerator();
    generator.generateAll();
}

module.exports = DocumentationGenerator;
