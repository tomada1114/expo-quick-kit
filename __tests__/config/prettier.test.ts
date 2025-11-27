import * as fs from 'fs';
import * as path from 'path';

describe('Prettier Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const prettierrcPath = path.join(projectRoot, '.prettierrc');
  const prettierIgnorePath = path.join(projectRoot, '.prettierignore');

  describe('.prettierrc', () => {
    it('should exist', () => {
      expect(fs.existsSync(prettierrcPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = fs.readFileSync(prettierrcPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have required formatting rules', () => {
      const content = fs.readFileSync(prettierrcPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config).toHaveProperty('semi');
      expect(config).toHaveProperty('singleQuote');
      expect(config).toHaveProperty('tabWidth');
      expect(config).toHaveProperty('trailingComma');
    });
  });

  describe('.prettierignore', () => {
    it('should exist', () => {
      expect(fs.existsSync(prettierIgnorePath)).toBe(true);
    });

    it('should ignore build artifacts and node_modules', () => {
      const content = fs.readFileSync(prettierIgnorePath, 'utf-8');

      expect(content).toContain('node_modules');
      expect(content).toMatch(/build|dist/);
    });
  });
});
