const request = require('supertest');
const app = require('../app');

// Test suite for the Index/Home route
describe('Index Route', () => {

    it('GET / should render index page', async () => {
        // Send a GET request to the root URL
        const res = await request(app).get('/');

        // Expect the status code to be 200 OK
        expect(res.statusCode).toEqual(200);

        // The response will be HTML executed from Pug
        // validating status code is sufficient for this basic test
    });
});
