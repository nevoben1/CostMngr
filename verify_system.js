/* System Verification Script
   Tests all microservices to ensure they are running and responding correctly.
   Makes HTTP requests to each service and validates responses. */

const http = require('http');

// Configuration for all microservices with their ports and names
const config = {
    admin: { port: 3001, name: 'Admin Service' },
    users: { port: 3002, name: 'Users Service' },
    costs: { port: 3003, name: 'Costs Service' },
    logs:  { port: 3004, name: 'Logs Service' }
};

/* Makes an HTTP request to a microservice and returns the response
   Parameters:
   - service: Service configuration object with port and name
   - path: API endpoint path to test
   - method: HTTP method (GET, POST, etc.)
   - body: Request body for POST requests
   Returns: Promise with service response data */
function checkService(service, path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: service.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ service: service.name, status: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => {
            resolve({ service: service.name, status: 'ERROR', error: e.message });
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/* Main verification function
   Tests each microservice in sequence to verify the system is working properly.
   Tests include:
   - Admin service: GET /api/about
   - Users service: GET /api/users and POST /api/adduser
   - Costs service: GET /api/report and POST /api/add
   - Logs service: GET /api/logs */
async function runVerification() {
    console.log('--- Verifying Services ---');

    // 1. Check Admin Service - retrieve team members
    const adminRes = await checkService(config.admin, '/api/about');
    console.log(`[${config.admin.name}] /api/about: ${adminRes.status}`);

    // 2. Check Users Service - retrieve all users
    const usersRes = await checkService(config.users, '/api/users');
    console.log(`[${config.users.name}] /api/users: ${usersRes.status}`);

    // 3. Add a new test user with random ID
    const randomId = Math.floor(Math.random() * 100000);
    const newUser = { id: randomId, first_name: 'Test', last_name: 'User', birthday: '1990-01-01' };
    const addUserRes = await checkService(config.users, '/api/adduser', 'POST', newUser);
    console.log(`[${config.users.name}] POST /api/adduser: ${addUserRes.status}`);

    // 4. Check Costs Service - retrieve monthly report
    const costRes = await checkService(config.costs, '/api/report?id=123123&year=2024&month=1');
    console.log(`[${config.costs.name}] /api/report: ${costRes.status}`);

    // 5. Add a test cost entry (no date to avoid past date validation error)
    const newCost = { description: 'Test Cost', category: 'food', userid: 123123, sum: 100 };
    const addCostRes = await checkService(config.costs, '/api/add', 'POST', newCost);
    console.log(`[${config.costs.name}] POST /api/add: ${addCostRes.status}`);

    // 6. Check Logs Service - should contain logs from above operations
    // Wait 2 seconds for database writes to complete
    await new Promise(r => setTimeout(r, 2000));
    const logsRes = await checkService(config.logs, '/api/logs');
    console.log(`[${config.logs.name}] /api/logs: ${logsRes.status}`);
    if (logsRes.status === 200) {
        const logs = JSON.parse(logsRes.data);
        console.log(`[${config.logs.name}] Total Logs Retrieved: ${logs.length}`);
    }

    console.log('--- Verification Complete ---');
}

// Run the verification process
runVerification();
