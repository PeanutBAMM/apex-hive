# Testing Documentation

Comprehensive testing documentation for Apex Hive components.

## Test Structure

### [Unified Cache Tests](./unified-cache/)
Testing documentation for the unified cache module:
- **Unit Tests** - Core functionality testing
- **Integration Tests** - System integration scenarios

## Testing Stack

- **Framework**: Jest
- **Coverage**: NYC/Istanbul
- **Assertions**: Jest built-in matchers
- **Test Doubles**: Jest mocks

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test unified-cache.test.js

# Run in watch mode
npm run test:watch
```

## Test Categories

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies
- Focus on single responsibility
- Fast execution (<100ms per test)

### Integration Tests
- Test module interactions
- Use real file system operations
- Verify end-to-end workflows
- May take longer to execute

## Best Practices

1. **Test Organization**
   - Group related tests in describe blocks
   - Use clear, descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Coverage**
   - Aim for >80% code coverage
   - Test edge cases and error paths
   - Don't just test happy paths

3. **Test Performance**
   - Keep unit tests fast
   - Use beforeEach/afterEach for setup/teardown
   - Clean up resources properly

## See Also

- [Development Guide](../development/)
- [Quality Standards](../guides/quality.md)
- [CI/CD Pipeline](../guides/ci-cd.md)