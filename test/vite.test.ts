import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import Vite, { ViteException } from '../src/vite';
import fs from 'node:fs';
import path from 'node:path';

describe('Vite asset resolution', () => {
    const tmpDir = path.join(__dirname, 'tmp_vite_test_' + Date.now());
    const publicDir = path.join(tmpDir, 'public');
    const buildDir = path.join(publicDir, 'build');

    beforeEach(() => {
        fs.mkdirSync(buildDir, { recursive: true });
        (global as any).public_path = (sub: string = '') => path.join(publicDir, sub.replace(/^\/+/, ''));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete (global as any).public_path;
    });

    test('isHot detects presence of public/hot file', () => {
        const vite = new Vite({});
        expect(vite.isHot()).toBe(false);

        fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173\n');
        expect(vite.isHot()).toBe(true);
        expect(vite.hotUrl()).toBe('http://localhost:5173');
    });

    test('hotUrl returns empty string if hot file does not exist', () => {
        const vite = new Vite({});
        expect(vite.hotUrl()).toBe('');
    });

    test('asset() returns dev server URL when hot is active', () => {
        fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173');
        const vite = new Vite({});
        expect(vite.asset('resources/assets/js/app.ts')).toBe('http://localhost:5173/resources/assets/js/app.ts');
        expect(vite.asset('/resources/assets/js/app.ts')).toBe('http://localhost:5173/resources/assets/js/app.ts');
    });

    test('tags() returns dev server client and entry scripts when hot is active', () => {
        fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173');
        const vite = new Vite({});
        const tags = vite.tags(['resources/assets/js/app.ts', 'resources/assets/css/app.css']);
        expect(tags).toContain('<script type="module" src="http://localhost:5173/@vite/client"></script>');
        expect(tags).toContain('<script type="module" src="http://localhost:5173/resources/assets/js/app.ts"></script>');
        expect(tags).toContain('<script type="module" src="http://localhost:5173/resources/assets/css/app.css"></script>');
    });

    test('tags() accepts a single string entry', () => {
        fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173');
        const vite = new Vite({});
        const tags = vite.tags('resources/assets/js/app.ts');
        expect(tags).toContain('<script type="module" src="http://localhost:5173/@vite/client"></script>');
        expect(tags).toContain('<script type="module" src="http://localhost:5173/resources/assets/js/app.ts"></script>');
    });

    test('asset() resolves hashed file from manifest in build mode', () => {
        const manifest = {
            'resources/assets/js/app.ts': {
                file: 'assets/app-123456.js',
                name: 'app',
                src: 'resources/assets/js/app.ts',
                isEntry: true
            },
            'resources/assets/css/app.css': {
                file: 'assets/app-789012.css',
                src: 'resources/assets/css/app.css'
            }
        };
        fs.writeFileSync(path.join(buildDir, 'manifest.json'), JSON.stringify(manifest));

        const appMock: any = {
            config: {
                get: (k: string) => (k === 'app.asset_url' ? 'https://cdn.example.com' : null)
            }
        };

        const vite = new Vite(appMock);
        expect(vite.asset('resources/assets/js/app.ts')).toBe('https://cdn.example.com/build/assets/app-123456.js');
        // By suffix match
        expect(vite.asset('app.ts')).toBe('https://cdn.example.com/build/assets/app-123456.js');
    });

    test('tags() resolves script, link tags and nested CSS from manifest', () => {
        const manifest = {
            'resources/assets/js/app.ts': {
                file: 'assets/app-123456.js',
                css: ['assets/imported-chunk.css'],
                isEntry: true
            },
            'resources/assets/css/app.css': {
                file: 'assets/app-789012.css',
                isEntry: true
            }
        };
        fs.writeFileSync(path.join(buildDir, 'manifest.json'), JSON.stringify(manifest));

        const appMock: any = {
            config: {
                get: (k: string) => ''
            }
        };

        const vite = new Vite(appMock);
        const tags = vite.tags(['resources/assets/js/app.ts', 'resources/assets/css/app.css']);
        expect(tags).toContain('<script type="module" src="/build/assets/app-123456.js"></script>');
        expect(tags).toContain('<link rel="stylesheet" href="/build/assets/imported-chunk.css">');
        expect(tags).toContain('<link rel="stylesheet" href="/build/assets/app-789012.css">');
    });

    test('throws ViteException if manifest does not exist in build mode', () => {
        const vite = new Vite({});
        expect(() => vite.asset('resources/assets/js/app.ts')).toThrow(ViteException);
    });

    test('throws ViteException if entry is missing from manifest and app.debug is true', () => {
        fs.writeFileSync(path.join(buildDir, 'manifest.json'), JSON.stringify({}));
        const appMock: any = {
            config: {
                get: (k: string) => (k === 'app.debug' ? true : null)
            },
            instance: (name: string) => ({
                get: (k: string) => (k === 'app.debug' ? true : null)
            })
        };
        const vite = new Vite(appMock);
        expect(() => vite.asset('missing.js')).toThrow(ViteException);
        expect(() => vite.tags('missing.js')).toThrow(ViteException);
    });

    test('reports exception and returns fallback if app.debug is false', () => {
        fs.writeFileSync(path.join(buildDir, 'manifest.json'), JSON.stringify({}));
        const reportMock = jest.fn();
        const appMock: any = {
            config: {
                get: (k: string) => (k === 'app.debug' ? false : null)
            },
            instance: (name: string) => ({
                get: (k: string) => (k === 'app.debug' ? false : null)
            }),
            logger: {
                report: reportMock
            }
        };
        const vite = new Vite(appMock);
        expect(vite.asset('missing.js')).toBe('missing.js');
        expect(reportMock).toHaveBeenCalled();
        expect(vite.tags('missing.js')).toBe('');
    });
});
