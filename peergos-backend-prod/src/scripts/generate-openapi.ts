#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

interface Route {
  method: string;
  path: string;
  controller: string;
}

/**
 * Generate OpenAPI documentation from route metadata
 */
function generateOpenAPI() {
  console.log('📋 Generating OpenAPI documentation...');
  
  try {
    // Read reference routes
    const referenceRoutesPath = path.join(__dirname, 'REFERENCE_ROUTES.json');
    const routes: Route[] = JSON.parse(fs.readFileSync(referenceRoutesPath, 'utf-8'));
    
    const openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Peergos UAE Tax Compliance API',
        version: '1.0.0',
        description: 'Complete UAE tax compliance backend API',
      },
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Development server'
        },
        {
          url: 'https://api.peergos.ae',
          description: 'Production server'
        }
      ],
      paths: {} as any,
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          HealthCheck: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    };
    
    // Generate paths from routes
    routes.forEach(route => {
      const pathKey = route.path.replace(/:(\w+)/g, '{$1}');
      
      if (!openApiSpec.paths[pathKey]) {
        openApiSpec.paths[pathKey] = {};
      }
      
      openApiSpec.paths[pathKey][route.method.toLowerCase()] = {
        summary: `${route.method} ${route.path}`,
        operationId: `${route.controller}_${route.method.toLowerCase()}`,
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      };
    });
    
    // Write OpenAPI spec
    fs.writeFileSync('openapi.json', JSON.stringify(openApiSpec, null, 2));
    
    console.log(`✅ Generated OpenAPI documentation with ${routes.length} endpoints`);
    console.log('📄 Output: openapi.json');
    
  } catch (error) {
    console.error('❌ OpenAPI generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateOpenAPI();
}

export { generateOpenAPI };