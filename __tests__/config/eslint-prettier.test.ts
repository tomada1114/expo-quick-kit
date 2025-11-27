import * as path from 'path';
import * as fs from 'fs';

describe('ESLint Prettier Integration', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const eslintConfigPath = path.join(projectRoot, 'eslint.config.js');
  const prettierConfigPath = path.join(projectRoot, '.prettierrc');

  it('should have eslint.config.js', () => {
    expect(fs.existsSync(eslintConfigPath)).toBe(true);
  });

  it('should have .prettierrc', () => {
    expect(fs.existsSync(prettierConfigPath)).toBe(true);
  });

  it('eslint.config.js should reference eslint-config-prettier', () => {
    const configContent = fs.readFileSync(eslintConfigPath, 'utf-8');
    // eslint-config-prettier should be imported or referenced
    expect(configContent).toContain('eslint-config-prettier');
  });

  it('package.json should have both eslint and prettier dependencies', () => {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.devDependencies).toHaveProperty('eslint');
    expect(packageJson.devDependencies).toHaveProperty('prettier');
    expect(packageJson.devDependencies).toHaveProperty(
      'eslint-config-prettier'
    );
  });
});
