/* API Routes Test Suite
   Tests the main API endpoints for the cost management application.
   Uses Jest and Supertest for integration testing.
   Mocks database and logging services to avoid side effects. */

const request = require('supertest');
const app = require('../app');
const documentService = require('../Services/documentService');
const userValidationService = require('../Services/userValidationService');

// Mock the documentService to avoid actual DB calls during tests
jest.mock('../Services/documentService');
// Mock the userValidationService to avoid external API calls during tests
jest.mock('../Services/userValidationService');
// Mock the loggerServices to avoid side effects (DB writes for logs)
jest.mock('../Services/loggerServices', () => ({
    createLogByType: jest.fn(),
    createLog: jest.fn(),
    createInfoLog: jest.fn(),
    logger: { info: jest.fn(), error: jest.fn() }
}));

describe('API Routes', () => {
    // Clear all mocks before each test to ensure isolation
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/about', () => {
        it('should return team members', async () => {
            // Mock environment variable for team members
            process.env.TEAM_MEMBERS = 'Member1, Member2';
            
            // Make a GET request to the /api/about endpoint
            const res = await request(app).get('/api/about');

            // Verify the status code is 200 (OK)
            expect(res.statusCode).toEqual(200);

            // Verify the response body matches the mocked team members
            expect(res.body).toEqual(['Member1', 'Member2']);
        });
    });

    describe('GET /api/report', () => {
        it('should return 400 for invalid month', async () => {
            // Send a request with an invalid month (13)
            const res = await request(app).get('/api/report?id=123&year=2023&month=13');

            // Expect a 400 Bad Request status code
            expect(res.statusCode).toEqual(400);

            // Check if the response contains the expected error properties
            expect(res.body).toHaveProperty('id', 'INVALID_MONTH');
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid month parameter');
        });

        it('should return monthly report for valid parameters', async () => {
            // Define mock data for costs
            const mockCosts = [
                { category: 'food', sum: 100, description: 'lunch', date: new Date('2023-01-15') },
                { category: 'food', sum: 50, description: 'dinner', date: new Date('2023-01-16') }
            ];

            // Setup the mock to return the defined costs
            documentService.getMonthlyReport.mockResolvedValue(mockCosts);

            // Make the request with valid parameters
            const res = await request(app).get('/api/report?id=123&year=2023&month=1');
            
            // Verify response status is 200
            expect(res.statusCode).toEqual(200);

            // Verify the returned data structure matches expected keys
            expect(res.body).toHaveProperty('userId', 123);
            expect(res.body).toHaveProperty('year', 2023);
            expect(res.body).toHaveProperty('month', 1);

            // Ensure the costs property is an array
            expect(res.body.costs).toBeInstanceOf(Array);
        });
    });

    describe('GET /api/users', () => {
        it('should return all users', async () => {
            // Mock data representing a list of users
            const mockUsers = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];

            // Mock the getAllUsers service method
            documentService.getAllUsers.mockResolvedValue(mockUsers);

            // Execute GET request to fetches users
            const res = await request(app).get('/api/users');
            
            // Expect a successful 200 OK response
            expect(res.statusCode).toEqual(200);

            // Verify the response body matches the mock data
            expect(res.body).toEqual(mockUsers);
        });

        it('should handle errors', async () => {
            // Simulate a database error in the service
            documentService.getAllUsers.mockRejectedValue(new Error('Database error'));

            // Make the request which should fail
            const res = await request(app).get('/api/users');

            // Expect a 500 Internal Server Error status
            expect(res.statusCode).toEqual(500);
        });
    });

    describe('GET /api/users/:userId', () => {
        it('should return a specific user', async () => {
            // Mock data for a single user
            const mockUser = { id: 123, name: 'John' };

            // Mock the getUserById service method
            documentService.getUserById.mockResolvedValue(mockUser);

            // Request a specific user by ID
            const res = await request(app).get('/api/users/123');
            
            // Verify success status
            expect(res.statusCode).toEqual(200);

            // Verify the correct user data is returned
            expect(res.body).toEqual(mockUser);
        });
    });

    describe('POST /api/add', () => {
        it('should create a new cost item when user exists', async () => {
             // Set supported categories in environment variables
             process.env.SUPPORTED_CATEGORIES = 'food,travel';

             // Define the new cost item to be added
             const newCost = { userid: 123, category: 'food', sum: 200, description: 'groceries' };

             // Mock user validation to return true (user exists)
             userValidationService.verifyUserExists.mockResolvedValue(true);

             // Mock the createCost service to return the input
             documentService.createCost.mockResolvedValue(newCost);

             // Send POST request with the new cost data
             const res = await request(app)
                 .post('/api/add')
                 .send(newCost);

             // Expect 200 OK status
             expect(res.statusCode).toEqual(200);

             // Verify the response matches the created cost
             expect(res.body).toEqual(newCost);

             // Verify that user validation was called
             expect(userValidationService.verifyUserExists).toHaveBeenCalledWith(123);
        });

        it('should return 404 when user does not exist', async () => {
            // Set supported categories in environment variables
            process.env.SUPPORTED_CATEGORIES = 'food,travel';

            // Mock user validation to return false (user doesn't exist)
            userValidationService.verifyUserExists.mockResolvedValue(false);

            // Send POST request with a cost for non-existent user
            const res = await request(app)
                .post('/api/add')
                .send({ userid: 999, category: 'food', sum: 100, description: 'test' });

            // Expect 404 Not Found status
            expect(res.statusCode).toEqual(404);

            // Verify error properties
            expect(res.body).toHaveProperty('id', 'USER_NOT_FOUND');
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('does not exist');

            // Verify that createCost was never called
            expect(documentService.createCost).not.toHaveBeenCalled();
        });

        it('should return 400 when userid is missing', async () => {
            // Set supported categories in environment variables
            process.env.SUPPORTED_CATEGORIES = 'food,travel';

            // Send POST request without userid
            const res = await request(app)
                .post('/api/add')
                .send({ category: 'food', sum: 100, description: 'test' });

            // Expect 400 Bad Request status
            expect(res.statusCode).toEqual(400);

            // Verify error properties
            expect(res.body).toHaveProperty('id', 'MISSING_USERID');
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('userid is required');
        });

        it('should return 503 when user validation service fails', async () => {
            // Set supported categories in environment variables
            process.env.SUPPORTED_CATEGORIES = 'food,travel';

            // Mock user validation to throw an error
            userValidationService.verifyUserExists.mockRejectedValue(new Error('Service unavailable'));

            // Send POST request
            const res = await request(app)
                .post('/api/add')
                .send({ userid: 123, category: 'food', sum: 100, description: 'test' });

            // Expect 503 Service Unavailable status
            expect(res.statusCode).toEqual(503);

            // Verify error properties
            expect(res.body).toHaveProperty('id', 'USER_SERVICE_ERROR');
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Unable to verify user');
        });

        it('should return 400 for invalid category', async () => {
            // Define supported categories
            process.env.SUPPORTED_CATEGORIES = 'food,travel';

            // Mock user validation to return true
            userValidationService.verifyUserExists.mockResolvedValue(true);

            // Send POST request with an unsupported category
            const res = await request(app)
                .post('/api/add')
                .send({ userid: 123, category: 'invalid', sum: 100 });

            // Expect 400 Bad Request status
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/adduser', () => {
        it('should create a new user', async () => {
            // Define a new user object
            const newUser = { id: 123, first_name: 'John', last_name: 'Doe' };

            // Mock the createUser service method
            documentService.createUser.mockResolvedValue(newUser);

            // Send POST request to create the user
            const res = await request(app)
                .post('/api/adduser')
                .send(newUser);
            
            // Verify success status
            expect(res.statusCode).toEqual(200);

            // Check that response body matches the new user
            expect(res.body).toEqual(newUser);
        });
    });
});
