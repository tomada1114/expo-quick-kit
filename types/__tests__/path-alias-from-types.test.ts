/**
 * Path Alias Test from types/ directory
 * Validates @/ imports resolve correctly from types/ subdirectory
 */

import { Colors } from '@/constants/theme';

describe('Path alias from types/ directory', () => {
  it('should resolve @/constants/theme from types/', () => {
    expect(Colors).toBeDefined();
    expect(Colors.light.text).toBeDefined();
    expect(Colors.dark.text).toBeDefined();
  });

  it('should support TypeScript type inference', () => {
    // New Colors structure: text is now an object with primary/secondary/tertiary/inverse
    const lightTextPrimary: string = Colors.light.text.primary;
    const darkTextPrimary: string = Colors.dark.text.primary;
    expect(typeof lightTextPrimary).toBe('string');
    expect(typeof darkTextPrimary).toBe('string');
  });
});
