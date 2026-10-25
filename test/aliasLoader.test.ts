import { describe, test, expect, afterEach } from "@jest/globals";
import AliasLoader from '../src/aliasLoader';
import path from 'node:path';

describe('AliasLoader', () => {
    afterEach(() => {
        delete (global as any).CustomAlias1;
        delete (global as any).CustomAlias2;
        delete (global as any).CustomRelative;
    });

    test('registers aliases directly and by path', () => {
        const dummyObj = { test: true };
        const loader = new AliasLoader({
            CustomAlias1: dummyObj,
            CustomAlias2: 'path'
        });
        loader.registerGlobal();

        expect((global as any).CustomAlias1).toBe(dummyObj);
        expect((global as any).CustomAlias2).toBe(path);
    });

    test('registers relative path alias', () => {
        const loader = new AliasLoader({
            CustomRelative: './src/aliasLoader.ts'
        });
        loader.registerGlobal();

        expect((global as any).CustomRelative).toBeDefined();
        expect((global as any).CustomRelative.name).toBe('AliasLoader');
    });

    test('registers root tilde path alias (~/)', () => {
        const loader = new AliasLoader({
            CustomTilde: '~/src/aliasLoader.ts'
        });
        loader.registerGlobal();

        expect((global as any).CustomTilde).toBeDefined();
        expect((global as any).CustomTilde.name).toBe('AliasLoader');
        delete (global as any).CustomTilde;
    });

    test('default empty constructor', () => {
        const loader = new AliasLoader();
        expect(loader._aliases).toEqual([]);
        expect(() => loader.registerGlobal()).not.toThrow();
    });
});
