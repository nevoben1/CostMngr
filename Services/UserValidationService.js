/*
   User Validation Service

   Handles validation of users by calling the external user service
  */

const https = require('https');
const { createLogByType } = require('./LoggerServices');
const logLevel = require('./LogLevel');

// External user service base URL
const USER_SERVICE_BASE_URL = 'costmngr-users-ha0g.onrender.com';

/*
   Verifies if a user exists by calling the external user service

   @param {number|string} userId - User ID to verify
   @returns {Promise<boolean>} True if user exists, false otherwise
   @throws {Error} If there's a network error or unexpected response from the service
  */
async function verifyUserExists(userId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: USER_SERVICE_BASE_URL,
            path: `/api/users/${userId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        createLogByType(`Verifying user ${userId} with external service`, logLevel.INFO);

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const user = JSON.parse(data);
                        // Check if user data is returned (array should have at least one element)
                        const userExists = Array.isArray(user) && user.length > 0;
                        createLogByType(`User ${userId} verification result: ${userExists}`, logLevel.INFO);
                        resolve(userExists);
                    } catch (error) {
                        createLogByType(`Error parsing user service response: ${error}`, logLevel.ERROR);
                        reject(new Error('Invalid response from user service'));
                    }
                } else if (res.statusCode === 404) {
                    createLogByType(`User ${userId} not found (404)`, logLevel.INFO);
                    resolve(false);
                } else {
                    createLogByType(`Unexpected status code from user service: ${res.statusCode}`, logLevel.WARN);
                    reject(new Error(`User service returned status ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            createLogByType(`Error calling user service: ${error}`, logLevel.ERROR);
            reject(new Error(`Failed to verify user: ${error.message}`));
        });

        req.end();
    });
}

module.exports = { verifyUserExists };
