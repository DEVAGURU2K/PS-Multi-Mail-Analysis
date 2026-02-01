import request from 'supertest';
import express from 'express';
import propertyRoutes from '../routes/propertyRoutes';
import Property from '../models/Property';

const app = express();
app.use(express.json());
app.use('/api', propertyRoutes);

describe('Property API', () => {
    it('should fetch all properties', async () => {
        const res = await request(app).get('/api/properties');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should return health status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
    });

    it('should fail to scan without URL', async () => {
        const res = await request(app).post('/api/properties/scan').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('URL is required');
    });
});
