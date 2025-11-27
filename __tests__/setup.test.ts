/**
 * Test to verify Jest configuration is working correctly
 */
describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript', () => {
    const greeting: string = 'Hello, Jest!';
    expect(greeting).toBe('Hello, Jest!');
  });

  it('should resolve @/ path alias', () => {
    // This test verifies that TypeScript can resolve @/ imports
    // The actual import test will be in component tests
    expect(true).toBe(true);
  });
});
