/**
 * Path Alias Validation Tests (Root Level)
 *
 * Verifies that @/* path alias correctly resolves imports from project root.
 * Additional tests in each directory (__tests__/ subdirectories) validate
 * path alias resolution from nested locations:
 * - database/__tests__/path-alias-from-database.test.ts
 * - store/__tests__/path-alias-from-store.test.ts
 * - lib/__tests__/path-alias-from-lib.test.ts
 * - types/__tests__/path-alias-from-types.test.ts
 * - features/__tests__/path-alias-from-features.test.ts
 *
 * This test validates that TypeScript can resolve @/ imports without errors.
 * If these tests pass, path alias configuration is correct.
 *
 * Requirements: 3.1, 3.2, 3.3
 */

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

describe('Path Alias Resolution', () => {
  describe('tsconfig.json configuration', () => {
    it('should have @/* mapped to project root', () => {
      const tsconfig = require('../tsconfig.json');
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*']);
    });
  });

  describe('Static imports from test file', () => {
    it('should resolve @/constants/theme', () => {
      expect(Colors).toBeDefined();
      expect(Colors.light).toBeDefined();
      expect(Colors.dark).toBeDefined();
      expect(Fonts).toBeDefined();
    });

    it('should resolve @/hooks/use-color-scheme', () => {
      expect(useColorScheme).toBeDefined();
      expect(typeof useColorScheme).toBe('function');
    });

    it('should resolve @/hooks/use-theme-color', () => {
      expect(useThemeColor).toBeDefined();
      expect(typeof useThemeColor).toBe('function');
    });

    it('should resolve @/components/themed-text', () => {
      expect(ThemedText).toBeDefined();
    });

    it('should resolve @/components/themed-view', () => {
      expect(ThemedView).toBeDefined();
    });
  });

  describe('TypeScript type resolution', () => {
    it('should infer correct types from @/ imports', () => {
      // If TypeScript compiles this without errors, type resolution works
      const lightColors: typeof Colors.light = Colors.light;
      const darkColors: typeof Colors.dark = Colors.dark;

      expect(lightColors.text).toBeDefined();
      expect(darkColors.text).toBeDefined();
      expect(lightColors.background).toBeDefined();
      expect(darkColors.background).toBeDefined();
    });

    it('should support type inference for Fonts', () => {
      const fonts: typeof Fonts = Fonts;
      expect(fonts).toBeDefined();
    });
  });

  describe('Path alias from different directory depths', () => {
    it('should work from __tests__/ directory (1 level deep)', () => {
      // This test file itself uses @/ imports successfully
      expect(Colors).toBeDefined();
    });
  });
});
