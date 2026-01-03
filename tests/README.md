# Unit Testing Documentation

This directory contains the unit tests for the CostMngr application. The tests are built using **Jest** and **Supertest** and are designed to be fully isolated from external dependencies.

## How to Run Tests
Run the following command from the root directory:
```bash
npm test
```
This will execute all test suites located in this folder.

## Testing Strategy
We strictly adhere to **Unit Testing** principles, meaning we test logic in isolation without connecting to real databases or external services.

### Mocks
To achieve isolation, we mock the following services in our test files (specifically `api.test.js`):
1.  **`documentService`**: Mocked to prevent actual MongoDB operations (find, save, etc.). We provide fake return values to test how the controllers handle success and error states.
2.  **`loggerServices`**: Mocked to prevent the application from crashing when it tries to write logs to the database during tests.

### Code Style
- **Comments**: Per requirements, every code block of ~7 lines includes a descriptive comment explaining the logic.
- **Isolation**: `beforeEach(jest.clearAllMocks)` is used to ensure tests do not interfere with each other.

## External Changes
To support this professional testing environment, the following changes were made to the main project files:

1.  **`app.js`**:
    - Wrapped the MongoDB connection logic in a condition: `if (process.env.NODE_ENV !== 'test')`.
    - **Why**: This prevents the application from trying to connect to a real database when running tests, which avoids connection leaks and crashes.

2.  **`routes/api.js`**:
    - Fixed the import path for the service layer: changed `require('../services/documentService')` to `require('../Services/documentService')`.
    - **Why**: Jest mocks are case-sensitive. The previous lowercase path worked in Windows runtime but caused Jest to miss the mock and load the real file, leading to timeouts.

3.  **`package.json`**:
    - Added `jest` and `supertest` to `devDependencies`.
    - Added `"test": "jest"` to the `scripts` section.
