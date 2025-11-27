/**
 * Path Alias Test from features/ directory
 * Validates @/ imports resolve correctly from features/ subdirectory
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

describe('Path alias from features/ directory', () => {
  it('should resolve @/constants/theme from features/', () => {
    expect(Colors).toBeDefined();
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
  });

  it('should resolve @/hooks/use-color-scheme from features/', () => {
    expect(useColorScheme).toBeDefined();
    expect(typeof useColorScheme).toBe('function');
  });

  it('should resolve @/components/themed-text from features/', () => {
    expect(ThemedText).toBeDefined();
  });
});
