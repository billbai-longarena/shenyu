# Testing Guide

This project uses Vitest as the testing framework, providing comprehensive unit test coverage for both frontend and backend code.

## Backend Testing

Backend tests are primarily located in the `packages/backend/src/services/__tests__` directory, including the following major tests:

### ModelService Tests

ModelService tests are located in `packages/backend/src/services/__tests__/model-service.test.ts`, covering the following functionalities:

- Singleton pattern implementation
- Configuration management
- Model management
- Temperature management
- Headers generation
- Token calculation

## Frontend Testing

Frontend tests are primarily located in `packages/frontend/src/composables/__tests__` directory, including the following major tests:

### useModelConfig Tests

useModelConfig tests are located in `packages/frontend/src/composables/__tests__/useModelConfig.test.ts`, covering the following functionalities:

- Configuration loading
- Error handling
- Caching mechanism
- Default value handling
- Environment URL handling

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
