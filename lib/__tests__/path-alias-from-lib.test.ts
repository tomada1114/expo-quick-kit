/**
 * Path Alias Test from lib/ directory
 * Validates @/ imports resolve correctly from lib/ subdirectory
 */

import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

describe('Path alias from lib/ directory', () => {
  it('should resolve @/constants/theme from lib/', () => {
    expect(Fonts).toBeDefined();
  });

  it('should resolve @/hooks/use-color-scheme from lib/', () => {
    expect(useColorScheme).toBeDefined();
    expect(typeof useColorScheme).toBe('function');
  });
});
