const http = require('http');

const config = {
    admin: { port: 3001, name: 'Admin Service' },
    users: { port: 3002, name: 'Users Service' },
    costs: { port: 3003, name: 'Costs Service' },
    logs:  { port: 3004, name: 'Logs Service' }
};

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

async function runVerification() {
    console.log('--- Verifying Services ---');


    // 1. Check Admin Service
    const adminRes = await checkService(config.admin, '/api/about');
    console.log(`[${config.admin.name}] /api/about: ${adminRes.status}`);

    // 2. Check Users Service
    const usersRes = await checkService(config.users, '/api/users');
    console.log(`[${config.users.name}] /api/users: ${usersRes.status}`);

    // 3. Add a User
    const randomId = Math.floor(Math.random() * 100000);
    const newUser = { id: randomId, first_name: 'Test', last_name: 'User', birthday: '1990-01-01' };
    const addUserRes = await checkService(config.users, '/api/adduser', 'POST', newUser);
    console.log(`[${config.users.name}] POST /api/adduser: ${addUserRes.status}`);

    // 4. Check Costs Service
    const costRes = await checkService(config.costs, '/api/report?id=123123&year=2024&month=1');
    console.log(`[${config.costs.name}] /api/report: ${costRes.status}`);

    // 5. Add Cost (No date provided to avoid 'past date' validation error)
    const newCost = { description: 'Test Cost', category: 'food', userid: 123123, sum: 100 };
    const addCostRes = await checkService(config.costs, '/api/add', 'POST', newCost);
    console.log(`[${config.costs.name}] POST /api/add: ${addCostRes.status}`);

    // 6. Check Logs Service (Should show logs from above)
    // Give DB a moment to write
    await new Promise(r => setTimeout(r, 2000));
    const logsRes = await checkService(config.logs, '/api/logs');
    console.log(`[${config.logs.name}] /api/logs: ${logsRes.status}`);
    if (logsRes.status === 200) {
        const logs = JSON.parse(logsRes.data);
        console.log(`[${config.logs.name}] Total Logs Retrieved: ${logs.length}`);
    }

    console.log('--- Verification Complete ---');
}

runVerification();
