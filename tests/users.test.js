const request = require('supertest');
const app = require('../app');

// Test suite for the Users route
describe('Users Route', () => {
    
    it('GET /users should respond with a resource', async () => {
        // Send a GET request to the /users endpoint
        const res = await request(app).get('/users');

        // Expect the status code to be 200 OK
        expect(res.statusCode).toEqual(200);

        // Expect the response text to match the default message
        expect(res.text).toEqual('respond with a resource');
    });
});
