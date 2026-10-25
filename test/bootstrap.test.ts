import { describe, test, expect, jest } from "@jest/globals";
import BootProviders from '../src/bootstrap/bootProviders';
import RegisterProviders from '../src/bootstrap/registerProviders';
import RegisterFacades from '../src/bootstrap/registerFacades';
import LoadEnvironmentVariables from '../src/bootstrap/loadEnvironmentVariables';
import HandleSystemError from '../src/bootstrap/handleSystemError';
import LoadConfiguration from '../src/bootstrap/loadConfiguration';
import RequestBound from '../src/bootstrap/requestBound';
import ResponseBound from '../src/bootstrap/responseBound';
import http from 'node:http';
const ServerRequest = http.IncomingMessage;
const ServerResponse = http.ServerResponse;
import fs from 'node:fs';
import path from 'node:path';
import Facade from '@ostro/support/facades/facade';

describe('Bootstrap classes', () => {
    test('BootProviders calls app.boot()', () => {
        const app: any = { boot: jest.fn() };
        const bootstrapper = new BootProviders();
        bootstrapper.bootstrap(app);
        expect(app.boot).toHaveBeenCalledTimes(1);
    });

    test('RegisterProviders calls app.registerConfiguredProviders()', () => {
        const app: any = { registerConfiguredProviders: jest.fn() };
        const bootstrapper = new RegisterProviders();
        bootstrapper.bootstrap(app);
        expect(app.registerConfiguredProviders).toHaveBeenCalledTimes(1);
    });

    test('RegisterFacades sets facade application and loads aliases', () => {
        const configMock = {
            get: jest.fn().mockReturnValue({ TestFacadeAlias: 'path' })
        };
        const app: any = {
            make: jest.fn().mockReturnValue(configMock)
        };
        const bootstrapper = new RegisterFacades();
        bootstrapper.bootstrap(app);
        expect(Facade.getFacadeApplication()).toBe(app);
        expect((global as unknown as Record<string, unknown>).TestFacadeAlias).toBe(path);
        delete (global as unknown as Record<string, unknown>).TestFacadeAlias;
    });

    test('LoadEnvironmentVariables loads dotenv config', () => {
        const tmpDir = path.join(__dirname, 'tmp_env');
        fs.mkdirSync(tmpDir, { recursive: true });
        const envFile = path.join(tmpDir, '.env.testing');
        fs.writeFileSync(envFile, 'FOO_TEST_VAR=bar_value\n');

        const app: any = {
            environmentPath: () => tmpDir,
            environmentFile: () => '.env.testing'
        };
        const bootstrapper = new LoadEnvironmentVariables();
        bootstrapper.bootstrap(app);
        expect(process.env.FOO_TEST_VAR).toBe('bar_value');

        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete process.env.FOO_TEST_VAR;
    });

    test('HandleSystemError registers unhandledRejection and uncaughtException handlers', () => {
        const errorsLogged: string[] = [];
        const loggerMock = {
            ignore: false,
            getConfig: jest.fn((k) => loggerMock.ignore),
            error: jest.fn((msg) => errorsLogged.push(msg)),
            channel: jest.fn(() => ({
                error: jest.fn((msg) => errorsLogged.push('channel:' + msg))
            }))
        };
        const app: any = { logger: loggerMock };
        const bootstrapper = new HandleSystemError();
        bootstrapper.bootstrap(app);

        // Find listeners
        const unhandledRejectionListeners = process.listeners('unhandledRejection');
        const uncaughtExceptionListeners = process.listeners('uncaughtException');
        const rejectionHandler: any = unhandledRejectionListeners[unhandledRejectionListeners.length - 1];
        const exceptionHandler: any = uncaughtExceptionListeners[uncaughtExceptionListeners.length - 1];

        // Trigger rejection with Error
        rejectionHandler(new Error('test rejection err'));
        expect(errorsLogged.some(m => m.includes('[unhandledRejection]'))).toBe(true);

        // Trigger rejection with Object
        errorsLogged.length = 0;
        rejectionHandler({ errCode: 123 });
        expect(errorsLogged.some(m => m.includes('errCode'))).toBe(true);

        // Trigger rejection with string
        errorsLogged.length = 0;
        rejectionHandler('raw string err');
        expect(errorsLogged.some(m => m.includes('raw string err'))).toBe(true);

        // Trigger when ignore_exceptions is true
        loggerMock.ignore = true;
        errorsLogged.length = 0;
        rejectionHandler(new Error('ignored error'));
        expect(errorsLogged.length).toBe(0);

        // Trigger exception with Error
        loggerMock.ignore = false;
        errorsLogged.length = 0;
        exceptionHandler(new Error('test uncaught err'));
        expect(errorsLogged.some(m => m.includes('[uncaughtException]'))).toBe(true);

        // Trigger exception with Object
        errorsLogged.length = 0;
        exceptionHandler({ uncaught: true });
        expect(errorsLogged.some(m => m.includes('uncaught'))).toBe(true);

        // Trigger exception with string
        errorsLogged.length = 0;
        exceptionHandler('uncaught string');
        expect(errorsLogged.some(m => m.includes('uncaught string'))).toBe(true);

        // Trigger exception when ignore_exceptions is true
        loggerMock.ignore = true;
        errorsLogged.length = 0;
        exceptionHandler(new Error('ignored exception'));
        expect(errorsLogged.length).toBe(0);

        // Clean up listeners
        process.removeListener('unhandledRejection', rejectionHandler);
        process.removeListener('uncaughtException', exceptionHandler);
    });

    test('LoadConfiguration bootstrap loads configs, sets timezone, throws if app missing', () => {
        const tmpConfigDir = path.join(__dirname, 'tmp_config');
        fs.rmSync(tmpConfigDir, { recursive: true, force: true });
        fs.mkdirSync(tmpConfigDir, { recursive: true });

        // Missing app config
        const appNoAppConfig: any = {
            configPath: () => tmpConfigDir,
            instance: jest.fn()
        };
        const loader1 = new LoadConfiguration(appNoAppConfig);
        expect(() => loader1.bootstrap(appNoAppConfig)).toThrow('Unable to load the "app" configuration file.');

        // Add app.js and other config
        fs.writeFileSync(path.join(tmpConfigDir, 'app.js'), 'module.exports = { timezone: "UTC", providers: [] };\n');
        fs.writeFileSync(path.join(tmpConfigDir, 'database.js'), 'module.exports = { default: "mysql" };\n');

        let boundRepository: any = null;
        const appWithConfig: any = {
            configPath: () => tmpConfigDir,
            instance: jest.fn((key, repo) => {
                boundRepository = repo;
            })
        };

        const loader2 = new LoadConfiguration(appWithConfig);
        loader2.bootstrap(appWithConfig);

        expect(boundRepository.get('app.timezone')).toBe('UTC');
        expect(boundRepository.get('database.default')).toBe('mysql');
        expect(process.env.TZ).toBe('UTC');

        // Test getConfigurationFiles branch where configFiles has property matching fileName
        const filesResult = loader2.getConfigurationFiles(tmpConfigDir);
        expect(filesResult).toContain('app');
        expect(filesResult).toContain('database');

        // Test branch when dir has fileName on array/object
        const origReaddir = fs.readdirSync;
        const mockFilesArr: any = ['app.js', 'other.js'];
        mockFilesArr['app'] = { name: 'appConfigObj' };
        mockFilesArr['other'] = 'not-an-object';
        fs.readdirSync = jest.fn().mockReturnValue(mockFilesArr);
        const objFilesResult = loader2.getConfigurationFiles(tmpConfigDir);
        expect(objFilesResult).toEqual([{ name: 'appConfigObj' }]);
        fs.readdirSync = origReaddir;

        fs.rmSync(tmpConfigDir, { recursive: true, force: true });
    });

    test('RequestBound binds app and copies prototype methods to ServerRequest', () => {
        const app: any = { name: 'ostro_app' };
        const reqBound = new RequestBound();
        reqBound.bootstrap(app);

        expect((ServerRequest.prototype as unknown as Record<string, unknown>).app).toBe(app);
        expect(typeof (ServerRequest.prototype as unknown as Record<string, unknown>).old).toBe('function');
    });

    test('ResponseBound binds app and copies prototype methods to ServerResponse', () => {
        const app: any = { name: 'ostro_app_res' };
        const resBound = new ResponseBound();
        resBound.bootstrap(app);

        expect((ServerResponse.prototype as unknown as Record<string, unknown>).app).toBe(app);
        expect(typeof (ServerResponse.prototype as unknown as Record<string, unknown>).with).toBe('function');
    });
});
