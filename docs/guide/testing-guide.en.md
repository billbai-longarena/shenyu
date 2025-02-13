# Testing Guide

This project uses Vitest as the testing framework, providing comprehensive unit test coverage for both frontend and backend code. The test design follows these principles:

1. No Impact on Build Environment: Environment variable modifications during testing do not affect the actual build environment
2. Flexible API Configuration: Test cases do not depend on specific model API keys and can adapt to different development environments

## Backend Testing

Backend tests are primarily located in the `packages/backend/src/services/__tests__` directory, including the following major tests:

### ModelService Tests

ModelService tests are located in `packages/backend/src/services/__tests__/model-service.test.ts`, covering the following functionalities:

- Singleton pattern implementation
- Configuration management
  - Dynamic detection of available model configurations
  - Automatic skipping of tests for models without API keys
- Model management
  - Testing based on actually available models
  - Handling invalid model scenarios
- Temperature management
  - Validating temperature range
  - Adapting to different model temperature settings
- Headers generation
  - Supporting multiple authentication formats
  - Handling different API providers' token formats
- Token calculation
  - Generic token calculation logic
  - Adapting to different models' maximum token limits

Special notes:
- Tests save current environment variables before running
- Original environment variables are restored after tests
- Uses dynamic detection mechanism to run tests based on available API keys

## Frontend Testing

Frontend tests are primarily located in `packages/frontend/src/composables/__tests__` directory, including the following major tests:

### useModelConfig Tests

useModelConfig tests are located in `packages/frontend/src/composables/__tests__/useModelConfig.test.ts`, covering the following functionalities:

- Configuration loading
  - Using generic mock configurations
  - Not depending on specific model names
- Error handling
  - Handling configuration loading failures
  - Handling invalid model configurations
- Caching mechanism
  - Verifying configuration caching
  - Ensuring cache data consistency
- Default value handling
  - Providing reasonable default configurations
  - Handling missing configuration scenarios
- Environment URL handling
  - Supporting different environment API addresses
  - Handling development and production environment differences

## Running Tests

### Backend Tests

```bash
cd packages/backend
npm run test
```

### Frontend Tests

```bash
cd packages/frontend
npm run test
```

## Test Coverage

To generate test coverage reports, you can run:

### Backend Test Coverage

```bash
cd packages/backend
npm run test:coverage
```

### Frontend Test Coverage

```bash
cd packages/frontend
npm run test:coverage
```

## Writing New Tests

1. Test files should be placed in the `__tests__` directory under the same directory structure as the code being tested
2. Test files should end with `.test.ts`
3. Use `describe` blocks to organize related test cases
4. Use `it` or `test` to write specific test cases
5. Use `beforeEach` and `afterEach` to handle setup and cleanup before and after tests
6. Use `vi.mock()` for module mocking
7. Use `vi.spyOn()` to spy on function calls
8. Use `expect()` for assertions

## Best Practices

1. Each test case should test only one functionality
2. Test cases should be independent and not rely on the state of other test cases
3. Use meaningful test case names
4. Use meaningful variable names in test cases
5. Use mocks to isolate external dependencies
6. Test edge cases and error scenarios
7. Keep test code clean and readable
8. Run tests regularly and keep them passing

## Environment Variables Handling

1. Test Environment Variables
   - Save current environment variables before tests
   - Restore original environment variables after tests
   - Use temporary test-specific API keys

2. API Key Configuration
   - Don't hardcode specific API keys in tests
   - Use dynamic detection mechanism to adapt to different configurations
   - Gracefully handle missing API keys

3. Best Practices
   - Use .env.example to provide configuration examples
   - Document required environment variables
   - Provide guidance for obtaining API keys
