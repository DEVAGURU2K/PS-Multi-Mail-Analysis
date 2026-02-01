import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Real Estate Email Agent API',
            version: '1.0.0',
            description: 'API documentation for the Real Estate Email Automation Agent backend.',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local development server',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);
