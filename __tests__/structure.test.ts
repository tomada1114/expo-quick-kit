/**
 * Folder Structure Verification Tests
 * Task 2.1 - フォルダ構造の作成
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Project Folder Structure', () => {
  describe('Core Directories', () => {
    it('should have features/ directory', () => {
      const featuresDir = path.join(PROJECT_ROOT, 'features');
      expect(fs.existsSync(featuresDir)).toBe(true);
      expect(fs.statSync(featuresDir).isDirectory()).toBe(true);
    });

    it('should have components/ directory', () => {
      const componentsDir = path.join(PROJECT_ROOT, 'components');
      expect(fs.existsSync(componentsDir)).toBe(true);
      expect(fs.statSync(componentsDir).isDirectory()).toBe(true);
    });

    it('should have components/ui/ directory', () => {
      const uiDir = path.join(PROJECT_ROOT, 'components', 'ui');
      expect(fs.existsSync(uiDir)).toBe(true);
      expect(fs.statSync(uiDir).isDirectory()).toBe(true);
    });

    it('should have hooks/ directory', () => {
      const hooksDir = path.join(PROJECT_ROOT, 'hooks');
      expect(fs.existsSync(hooksDir)).toBe(true);
      expect(fs.statSync(hooksDir).isDirectory()).toBe(true);
    });

    it('should have store/ directory', () => {
      const storeDir = path.join(PROJECT_ROOT, 'store');
      expect(fs.existsSync(storeDir)).toBe(true);
      expect(fs.statSync(storeDir).isDirectory()).toBe(true);
    });

    it('should have store/slices/ directory', () => {
      const slicesDir = path.join(PROJECT_ROOT, 'store', 'slices');
      expect(fs.existsSync(slicesDir)).toBe(true);
      expect(fs.statSync(slicesDir).isDirectory()).toBe(true);
    });

    it('should have database/ directory', () => {
      const databaseDir = path.join(PROJECT_ROOT, 'database');
      expect(fs.existsSync(databaseDir)).toBe(true);
      expect(fs.statSync(databaseDir).isDirectory()).toBe(true);
    });

    it('should have lib/ directory', () => {
      const libDir = path.join(PROJECT_ROOT, 'lib');
      expect(fs.existsSync(libDir)).toBe(true);
      expect(fs.statSync(libDir).isDirectory()).toBe(true);
    });

    it('should have types/ directory', () => {
      const typesDir = path.join(PROJECT_ROOT, 'types');
      expect(fs.existsSync(typesDir)).toBe(true);
      expect(fs.statSync(typesDir).isDirectory()).toBe(true);
    });
  });

  describe('Directory Tracking Files', () => {
    const checkTrackingFile = (dir: string) => {
      const gitkeep = path.join(dir, '.gitkeep');
      const indexTs = path.join(dir, 'index.ts');
      return fs.existsSync(gitkeep) || fs.existsSync(indexTs);
    };

    it('features/ should have tracking file (.gitkeep or index.ts)', () => {
      const featuresDir = path.join(PROJECT_ROOT, 'features');
      expect(checkTrackingFile(featuresDir)).toBe(true);
    });

    it('components/ui/ should have tracking file (.gitkeep or index.ts)', () => {
      const uiDir = path.join(PROJECT_ROOT, 'components', 'ui');
      expect(checkTrackingFile(uiDir)).toBe(true);
    });

    it('store/slices/ should have tracking file (.gitkeep or index.ts)', () => {
      const slicesDir = path.join(PROJECT_ROOT, 'store', 'slices');
      expect(checkTrackingFile(slicesDir)).toBe(true);
    });

    it('database/ should have tracking file (.gitkeep or index.ts)', () => {
      const databaseDir = path.join(PROJECT_ROOT, 'database');
      expect(checkTrackingFile(databaseDir)).toBe(true);
    });

    it('lib/ should have tracking file (.gitkeep or index.ts)', () => {
      const libDir = path.join(PROJECT_ROOT, 'lib');
      expect(checkTrackingFile(libDir)).toBe(true);
    });

    it('types/ should have tracking file (.gitkeep or index.ts)', () => {
      const typesDir = path.join(PROJECT_ROOT, 'types');
      expect(checkTrackingFile(typesDir)).toBe(true);
    });
  });
});
