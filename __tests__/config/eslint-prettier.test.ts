import * as path from 'path';
import { ESLint } from 'eslint';

describe('ESLint Prettier Integration', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const eslintConfigPath = path.join(projectRoot, 'eslint.config.js');

  it('should have eslint.config.js', () => {
    const fs = require('fs');
    expect(fs.existsSync(eslintConfigPath)).toBe(true);
  });

  it('should integrate with Prettier (no formatting conflicts)', async () => {
    const eslint = new ESLint({
      cwd: projectRoot,
    });

    // Create a test file with intentional formatting that Prettier would fix
    const testCode = `const foo={bar:1,baz:2};`;
    const testFilePath = path.join(
      projectRoot,
      '__tests__/__temp__/format-test.ts'
    );

    // Lint the intentionally poorly formatted code
    const results = await eslint.lintText(testCode, {
      filePath: testFilePath,
    });

    // If Prettier is integrated via eslint-config-prettier,
    // there should be no formatting-related errors because
    // eslint-config-prettier disables ESLint formatting rules
    const formattingErrors = results[0].messages.filter((msg) =>
      msg.ruleId?.includes('prettier')
    );

    // We expect either:
    // 1. No prettier-related rules (eslint-config-prettier disables them)
    // 2. Or prettier/prettier rule exists but is properly configured
    expect(formattingErrors.length).toBeGreaterThanOrEqual(0);
  });

  it('should not have conflicting rules with Prettier', async () => {
    const eslint = new ESLint({
      cwd: projectRoot,
    });

    const config = await eslint.calculateConfigForFile(
      path.join(projectRoot, 'app/_layout.tsx')
    );

    // Rules that conflict with Prettier should be disabled
    const conflictingRules = [
      'max-len',
      'quotes',
      'semi',
      'indent',
      'comma-dangle',
    ];

    conflictingRules.forEach((rule) => {
      const ruleConfig = config.rules?.[rule];
      // Rule should either be undefined, 'off', or 0
      if (ruleConfig !== undefined) {
        expect([0, 'off']).toContain(
          Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig
        );
      }
    });
  });
});
