/**
 * Path Alias Test from store/ directory
 * Validates @/ imports resolve correctly from store/ subdirectory
 */

import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

describe('Path alias from store/ directory', () => {
  it('should resolve @/constants/theme from store/', () => {
    expect(Colors).toBeDefined();
    expect(Colors.light.tint).toBeDefined();
    expect(Colors.dark.tint).toBeDefined();
  });

  it('should resolve @/hooks/use-theme-color from store/', () => {
    expect(useThemeColor).toBeDefined();
    expect(typeof useThemeColor).toBe('function');
  });
});
