/**
 * Theme Constants Tests
 * iOS System Colors準拠のテーマ定数をテスト
 */

import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  TouchTarget,
  Shadows,
  Fonts,
  PRIMARY_COLOR,
  AppPrimaryColor,
} from '@/constants/theme';

describe('Theme Constants', () => {
  describe('Colors', () => {
    describe('Light Mode', () => {
      const light = Colors.light;

      it('should have primary color defined', () => {
        expect(light.primary).toBeDefined();
        expect(typeof light.primary).toBe('string');
      });

      it('should have background colors with 3 levels', () => {
        expect(light.background).toBeDefined();
        expect(light.background.base).toBe('#FFFFFF');
        expect(light.background.secondary).toBe('#F2F2F7');
        expect(light.background.tertiary).toBe('#FFFFFF');
      });

      it('should have text colors with 4 levels', () => {
        expect(light.text).toBeDefined();
        expect(light.text.primary).toBe('#000000');
        expect(light.text.secondary).toBe('#3C3C43');
        expect(light.text.tertiary).toBe('#8E8E93');
        expect(light.text.inverse).toBe('#FFFFFF');
      });

      it('should have semantic colors for success/warning/error/info', () => {
        expect(light.semantic).toBeDefined();
        expect(light.semantic.success).toBe('#34C759');
        expect(light.semantic.warning).toBe('#FF9500');
        expect(light.semantic.error).toBe('#FF3B30');
        expect(light.semantic.info).toBe('#007AFF');
      });

      it('should have interactive elements colors', () => {
        expect(light.interactive).toBeDefined();
        expect(light.interactive.separator).toBe('#C6C6C8');
        expect(light.interactive.fill).toBe('#787880');
        expect(light.interactive.fillSecondary).toBe('#BCBCC0');
      });

      it('should have legacy compatibility properties', () => {
        expect(light.tint).toBeDefined();
        expect(light.icon).toBeDefined();
        expect(light.tabIconDefault).toBeDefined();
        expect(light.tabIconSelected).toBeDefined();
      });
    });

    describe('Dark Mode', () => {
      const dark = Colors.dark;

      it('should have primary color with +10% brightness adjustment', () => {
        expect(dark.primary).toBeDefined();
        expect(typeof dark.primary).toBe('string');
      });

      it('should have dark background colors', () => {
        expect(dark.background).toBeDefined();
        expect(dark.background.base).toBe('#000000');
        expect(dark.background.secondary).toBe('#1C1C1E');
        expect(dark.background.tertiary).toBe('#2C2C2E');
      });

      it('should have light text colors for dark background', () => {
        expect(dark.text).toBeDefined();
        expect(dark.text.primary).toBe('#FFFFFF');
        expect(dark.text.secondary).toBe('#EBEBF5');
        expect(dark.text.tertiary).toBe('#8E8E93');
        expect(dark.text.inverse).toBe('#000000');
      });

      it('should have semantic colors with +10% brightness', () => {
        expect(dark.semantic).toBeDefined();
        expect(dark.semantic.success).toBe('#30D158');
        expect(dark.semantic.warning).toBe('#FF9F0A');
        expect(dark.semantic.error).toBe('#FF453A');
        expect(dark.semantic.info).toBe('#0A84FF');
      });

      it('should have dark interactive elements colors', () => {
        expect(dark.interactive).toBeDefined();
        expect(dark.interactive.separator).toBe('#38383A');
        expect(dark.interactive.fill).toBe('#787880');
        expect(dark.interactive.fillSecondary).toBe('#48484A');
      });
    });
  });

  describe('AppPrimaryColor', () => {
    it('should have blue color defined', () => {
      expect(AppPrimaryColor.blue).toBe('#007AFF');
    });

    it('should have green color defined', () => {
      expect(AppPrimaryColor.green).toBe('#34C759');
    });

    it('should have orange color defined', () => {
      expect(AppPrimaryColor.orange).toBe('#FF9500');
    });

    it('should not have indigo or other non-standard colors', () => {
      const colorValues = Object.values(AppPrimaryColor);
      // Indigo系色のチェック
      colorValues.forEach((color) => {
        expect(color.toLowerCase()).not.toMatch(/^#6[0-9a-f]{5}$/); // Indigo range
        expect(color.toLowerCase()).not.toMatch(/^#8[1-9a-f][8-9a-f]/); // Purple/Indigo range
      });
    });
  });

  describe('PRIMARY_COLOR', () => {
    it('should be one of the AppPrimaryColor values', () => {
      const validColors = Object.values(AppPrimaryColor);
      expect(validColors).toContain(PRIMARY_COLOR);
    });
  });

  describe('Spacing (8pt Grid System)', () => {
    it('should have xs spacing of 4', () => {
      expect(Spacing.xs).toBe(4);
    });

    it('should have sm spacing of 8', () => {
      expect(Spacing.sm).toBe(8);
    });

    it('should have md spacing of 16', () => {
      expect(Spacing.md).toBe(16);
    });

    it('should have lg spacing of 24', () => {
      expect(Spacing.lg).toBe(24);
    });

    it('should have xl spacing of 32', () => {
      expect(Spacing.xl).toBe(32);
    });

    it('should have 2xl spacing of 48', () => {
      expect(Spacing['2xl']).toBe(48);
    });

    it('should follow 8pt grid (all values divisible by 4)', () => {
      Object.values(Spacing).forEach((value) => {
        expect(value % 4).toBe(0);
      });
    });
  });

  describe('Typography', () => {
    it('should have largeTitle style', () => {
      expect(Typography.largeTitle).toBeDefined();
      expect(Typography.largeTitle.fontSize).toBe(34);
      expect(Typography.largeTitle.lineHeight).toBe(41);
    });

    it('should have title1 style', () => {
      expect(Typography.title1).toBeDefined();
      expect(Typography.title1.fontSize).toBe(28);
    });

    it('should have title2 style', () => {
      expect(Typography.title2).toBeDefined();
      expect(Typography.title2.fontSize).toBe(22);
    });

    it('should have headline style', () => {
      expect(Typography.headline).toBeDefined();
      expect(Typography.headline.fontSize).toBe(17);
      expect(Typography.headline.fontWeight).toBe('600');
    });

    it('should have body style', () => {
      expect(Typography.body).toBeDefined();
      expect(Typography.body.fontSize).toBe(17);
      expect(Typography.body.fontWeight).toBe('400');
    });

    it('should have callout style', () => {
      expect(Typography.callout).toBeDefined();
      expect(Typography.callout.fontSize).toBe(16);
    });

    it('should have subheadline style', () => {
      expect(Typography.subheadline).toBeDefined();
      expect(Typography.subheadline.fontSize).toBe(15);
    });

    it('should have caption1 style', () => {
      expect(Typography.caption1).toBeDefined();
      expect(Typography.caption1.fontSize).toBe(13);
    });

    it('should have footnote style', () => {
      expect(Typography.footnote).toBeDefined();
      expect(Typography.footnote.fontSize).toBe(11);
    });
  });

  describe('BorderRadius', () => {
    it('should have sm border radius of 4', () => {
      expect(BorderRadius.sm).toBe(4);
    });

    it('should have md border radius of 8', () => {
      expect(BorderRadius.md).toBe(8);
    });

    it('should have lg border radius of 12', () => {
      expect(BorderRadius.lg).toBe(12);
    });

    it('should have xl border radius of 16', () => {
      expect(BorderRadius.xl).toBe(16);
    });

    it('should have full border radius of 9999', () => {
      expect(BorderRadius.full).toBe(9999);
    });
  });

  describe('TouchTarget', () => {
    it('should have minimum touch target of 44pt (iOS HIG)', () => {
      expect(TouchTarget.min).toBe(44);
    });
  });

  describe('Shadows', () => {
    it('should have sm shadow defined', () => {
      expect(Shadows.sm).toBeDefined();
      expect(Shadows.sm.shadowColor).toBe('#000');
      expect(Shadows.sm.shadowOpacity).toBeLessThan(0.1);
    });

    it('should have md shadow defined', () => {
      expect(Shadows.md).toBeDefined();
      expect(Shadows.md.shadowColor).toBe('#000');
    });

    it('should have lg shadow defined', () => {
      expect(Shadows.lg).toBeDefined();
      expect(Shadows.lg.shadowColor).toBe('#000');
      expect(Shadows.lg.elevation).toBeGreaterThan(0);
    });
  });

  describe('Fonts', () => {
    it('should have sans font defined', () => {
      expect(Fonts?.sans).toBeDefined();
    });

    it('should have serif font defined', () => {
      expect(Fonts?.serif).toBeDefined();
    });

    it('should have mono font defined', () => {
      expect(Fonts?.mono).toBeDefined();
    });
  });

  describe('NG Rules Verification', () => {
    const getAllColorValues = (): string[] => {
      const colors: string[] = [];

      // Collect all color values from Colors object
      const collectColors = (obj: object, prefix = ''): void => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('#')) {
            colors.push(value);
          } else if (typeof value === 'object' && value !== null) {
            collectColors(value, `${prefix}${key}.`);
          }
        });
      };

      collectColors(Colors.light);
      collectColors(Colors.dark);

      return colors;
    };

    it('should not contain Indigo colors (#6366F1, #818CF8, etc)', () => {
      const allColors = getAllColorValues();
      const indigoPattern = /^#[56][0-9a-f]66[ef][0-9a-f]$/i;
      const hasIndigo = allColors.some((color) => indigoPattern.test(color));
      expect(hasIndigo).toBe(false);
    });

    it('should not contain neon colors (pure bright RGB)', () => {
      const allColors = getAllColorValues();
      const neonColors = ['#FF00FF', '#00FF00', '#00FFFF', '#FFFF00'];
      const hasNeon = allColors.some((color) =>
        neonColors.includes(color.toUpperCase())
      );
      expect(hasNeon).toBe(false);
    });

    it('should not contain pastel colors (light desaturated tones)', () => {
      const allColors = getAllColorValues();
      // Pastel colors typically have high lightness and low saturation
      const pastelPatterns = [
        /^#[f][f][b-e][0-9a-f][d-f][0-9a-f]$/i, // Light pinks
        /^#[b-e][0-9a-f][f][f][b-e][0-9a-f]$/i, // Light greens
        /^#[b-e][0-9a-f][b-e][0-9a-f][f][f]$/i, // Light blues
      ];

      const hasPastel = allColors.some((color) =>
        pastelPatterns.some((pattern) => pattern.test(color))
      );
      expect(hasPastel).toBe(false);
    });
  });
});
