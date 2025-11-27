/**
 * Path Alias Test from database/ directory
 * Validates @/ imports resolve correctly from database/ subdirectory
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

describe('Path alias from database/ directory', () => {
  it('should resolve @/constants/theme from database/', () => {
    expect(Colors).toBeDefined();
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
  });

  it('should resolve @/hooks/use-color-scheme from database/', () => {
    expect(useColorScheme).toBeDefined();
    expect(typeof useColorScheme).toBe('function');
  });
});
