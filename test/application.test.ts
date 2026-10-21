import '@ostro/support/helpers';
import Application from '../src/application';
import ServiceProvider from '@ostro/support/serviceProvider';
import fs = require('fs');
import path = require('path');

describe('Application class', () => {
    let app;
    let originalCwd;
    const testBasePath = path.join(__dirname, 'tmp_app');

    beforeAll(() => {
        originalCwd = process.cwd();
    });

    afterAll(() => {
        process.chdir(originalCwd);
    });

    beforeEach(() => {
        fs.mkdirSync(testBasePath, { recursive: true });
        app = new Application(testBasePath);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        fs.rmSync(testBasePath, { recursive: true, force: true });
    });

    test('version and basic properties', () => {
        expect(app.version()).toBe('1.1.5');
        expect(app.VERSION).toBe('1.1.5');
        expect(global.app).toBeDefined();
    });

    test('paths and custom path setters', () => {
        expect(app.basePath()).toBe(path.resolve(testBasePath));
        expect(app.basePath('sub')).toBe(path.resolve(testBasePath, 'sub'));
        expect(app.path()).toBe(path.resolve(testBasePath, 'app'));
        expect(app.path('/models')).toBe(path.resolve(testBasePath, 'app/models'));
        expect(app.bootstrapPath()).toBe(path.resolve(testBasePath, 'bootstrap'));
        expect(app.configPath()).toBe(path.resolve(testBasePath, 'config'));
        expect(app.databasePath()).toBe(path.resolve(testBasePath, 'database'));
        expect(app.resourcePath()).toBe(path.resolve(testBasePath, 'resources'));
        expect(app.publicPath()).toBe(path.resolve(testBasePath, 'public'));
        expect(app.storagePath()).toBe(path.resolve(testBasePath, 'storage'));

        // Custom paths
        app.useAppPath(path.join(testBasePath, 'custom_app'));
        expect(app.path()).toBe(path.join(testBasePath, 'custom_app'));

        app.useDatabasePath(path.join(testBasePath, 'custom_db'));
        expect(app.databasePath()).toBe(path.join(testBasePath, 'custom_db'));

        app.useStoragePath(path.join(testBasePath, 'custom_storage'));
        expect(app.storagePath()).toBe(path.join(testBasePath, 'custom_storage'));

        // Lang path
        expect(app.langPath()).toBe(path.resolve(testBasePath, 'lang'));
        // If resourcePath() + '/lang' has extension:
        app.resourcePath = () => path.join(testBasePath, 'resources');
        // Let's test when path.join(resourcePath(), 'lang') has an extension
        const originalResourcePath = app.resourcePath;
        app.resourcePath = () => path.join(testBasePath, 'resources/custom');
        // If dir has extension, e.g. custom.lang
        app.resourcePath = () => path.join(testBasePath, 'lang_folder.dir');
        // path.extname(path.join(app.resourcePath(), 'lang')) -> extname('.../lang') is ''
        // But if resourcePath is '.../res' and ext is on dir:
        // Let's mock path.extname or test both branches
        const origExtname = path.extname;
        path.extname = jest.fn().mockReturnValueOnce('.json').mockImplementation(origExtname);
        expect(app.langPath()).toBe(path.resolve(testBasePath, 'lang_folder.dir/lang'));
        path.extname = origExtname;

        app.useLangPath(path.join(testBasePath, 'custom_lang'));
        expect(app.langPath()).toBe(path.join(testBasePath, 'custom_lang'));

        // View path
        expect(app.viewPath()).toBe(path.resolve(testBasePath, 'resources/view'));
        app.instance('config', {
            get: (k, def) => (k === 'view.paths' ? ['/custom/views'] : def)
        });
        expect(app.viewPath('home.html')).toBe(path.resolve('/custom/views/home.html'));

        // Environment paths
        expect(app.environmentPath()).toBe(path.resolve(testBasePath));
        app.useEnvironmentPath('/custom/env');
        expect(app.environmentPath()).toBe('/custom/env');
        expect(app.environmentFile()).toBe('.env');
        app.loadEnvironmentFrom('.env.testing');
        expect(app.environmentFile()).toBe('.env.testing');
        expect(app.environmentFilePath()).toBe(path.resolve('/custom/env/.env.testing'));
    });

    test('environment helpers isLocal, isProduction', () => {
        app.instance('env', 'local');
        expect(app.isLocal()).toBe(true);
        expect(app.isProduction()).toBe(false);

        app.instance('env', 'production');
        expect(app.isLocal()).toBe(false);
        expect(app.isProduction()).toBe(true);
    });

    test('isDownForMaintenance', () => {
        expect(app.isDownForMaintenance()).toBe(false);
        const downFile = path.join(app.storagePath(), 'framework/down');
        fs.mkdirSync(path.dirname(downFile), { recursive: true });
        fs.writeFileSync(downFile, 'down');
        expect(app.isDownForMaintenance()).toBe(true);
    });

    test('locales getLocale, currentLocale, setLocale, setFallbackLocale, isLocale', () => {
        const configData = {
            'app.locale': 'en',
            'app.fallback_locale': 'en'
        };
        const translatorMock = {
            setLocale: jest.fn(),
            setFallback: jest.fn()
        };
        const eventsMock = {
            dispatch: jest.fn()
        };

        app.instance('config', {
            get: (k) => configData[k],
            set: (k, v) => { configData[k] = v; }
        });
        app.instance('translator', translatorMock);
        app.instance('events', eventsMock);

        expect(app.getLocale()).toBe('en');
        expect(app.currentLocale()).toBe('en');
        expect(app.getFallbackLocale()).toBe('en');
        expect(app.isLocale('en')).toBe(true);
        expect(app.isLocale('fr')).toBe(false);

        app.setLocale('fr');
        expect(app.getLocale()).toBe('fr');
        expect(translatorMock.setLocale).toHaveBeenCalledWith('fr');
        expect(eventsMock.dispatch).toHaveBeenCalled();

        app.setFallbackLocale('es');
        expect(app.getFallbackLocale()).toBe('es');
        expect(translatorMock.setFallback).toHaveBeenCalledWith('es');
    });

    test('cached paths and cache checks', () => {
        const filesMock = {
            exists: jest.fn().mockReturnValue(true)
        };
        app.instance('files', filesMock);

        expect(app.getCachedServicesPath()).toBe(path.resolve(testBasePath, 'bootstrap/cache/services.json'));
        expect(app.getCachedPackagesPath()).toBe(path.resolve(testBasePath, 'bootstrap/cache/packages.json'));
        expect(app.getCachedConfigPath()).toBe(path.resolve(testBasePath, 'bootstrap/cache/config.json'));
        expect(app.configurationIsCached()).toBe(false);

        expect(app.routesAreCached()).toBe(true);
        expect(app.eventsAreCached()).toBe(true);
        expect(app.getCachedRoutesPath()).toBe(path.resolve(testBasePath, 'bootstrap/cache/routes-v7.json'));
        expect(app.getCachedEventsPath()).toBe(path.resolve(testBasePath, 'bootstrap/cache/events.json'));

        // normalizeCachePath with env var set
        process.env.APP_SERVICES_CACHE = 'custom/services.json';
        expect(app.getCachedServicesPath()).toBe(path.resolve(testBasePath, 'custom/services.json'));
        delete process.env.APP_SERVICES_CACHE;
    });

    test('deferred services get/set/add/is', () => {
        expect(app.getDeferredServices()).toEqual([]);
        app.setDeferredServices(['service1']);
        expect(app.getDeferredServices()).toEqual(['service1']);
        app.addDeferredServices(['service2']);
        expect(app.isDeferredService('service2')).toBe(true);
        expect(app.isDeferredService('service3')).toBe(false);
    });

    test('booting and service provider registration', () => {
        let bootedProvider = false;
        class TestServiceProvider extends ServiceProvider {
            register() {
                this.registered = true;
            }
            boot() {
                bootedProvider = true;
            }
        }

        const configMock = {
            get: (k) => {
                if (k === 'app') return { timezone: 'UTC', env: 'testing' };
                return null;
            }
        };
        app.instance('config', configMock);

        const p = app.register(TestServiceProvider);
        expect(p.registered).toBe(true);
        expect(app.getProvider(TestServiceProvider)).toBe(p);
        // registering again without force returns existing
        expect(app.register(TestServiceProvider)).toBe(p);

        // boot app
        expect(app.isBooted()).toBe(false);
        app.boot();
        expect(app.isBooted()).toBe(true);
        expect(bootedProvider).toBe(true);
        expect(process.env.TZ).toBe('UTC');
        expect(process.env.NODE_ENV).toBe('testing');

        // register after boot immediately boots provider
        let bootImmediate = false;
        class AnotherProvider extends ServiceProvider {
            boot() { bootImmediate = true; }
        }
        app.register(AnotherProvider);
        expect(bootImmediate).toBe(true);

        // loadDeferredProviders
        app.setDeferredServices([TestServiceProvider]);
        app.loadDeferredProviders();
        expect(app.getDeferredServices()).toEqual([]);

        // loadDeferredProvider when not deferred
        app.loadDeferredProvider('non_deferred');
    });

    test('bootstrapWith runs bootstrappers', () => {
        let bootstrapped = false;
        class DummyBootstrapper {
            bootstrap(application) {
                bootstrapped = true;
            }
        }
        app.instance('DummyBootstrapper', new DummyBootstrapper());
        app.bootstrapWith(['DummyBootstrapper']);
        expect(app.hasBeenBootstrapped()).toBe(true);
        expect(bootstrapped).toBe(true);
    });

    test('registerConfiguredProviders loads configured providers', () => {
        app.config = {
            'app.providers': []
        };
        app.registerConfiguredProviders();
    });

    test('register provider as file string', () => {
        const dummyProviderFile = path.join(testBasePath, 'dummyProvider.js');
        fs.writeFileSync(dummyProviderFile, `
            const _SP = require('@ostro/support/serviceProvider');
            const ServiceProvider = _SP.default || _SP;
            module.exports = class FileProvider extends ServiceProvider {};
        `);

        const p = app.register(dummyProviderFile);
        expect(p).toBeDefined();
    });

    test('resolves mix singleton and deferred provider before boot', () => {
        const mix = app.make('mix');
        expect(mix).toBeDefined();

        // registerDeferredProvider when unbooted
        let bootedCallbackCalled = false;
        class DeferredUnbootedProvider extends ServiceProvider {
            boot() { bootedCallbackCalled = true; }
        }
        app.registerDeferredProvider(DeferredUnbootedProvider);
        app.instance('config', {
            get: () => ({ timezone: 'UTC', env: 'testing' })
        });
        app.boot();
        expect(bootedCallbackCalled).toBe(true);

        // normalizeCachePath with absoluteCachePathPrefixes
        app.absoluteCachePathPrefixes = '/abs';
        process.env.APP_SERVICES_CACHE = '/abs/cache/services.json';
        expect(app.getCachedServicesPath()).toBe('/abs/cache/services.json');
        delete process.env.APP_SERVICES_CACHE;

        // isMainThread false in worker_threads
        const workerThreads = require('worker_threads');
        const origMain = workerThreads.isMainThread;
        Object.defineProperty(workerThreads, 'isMainThread', { value: false, configurable: true });
        app.setBasePath('/worker/base');
        expect(globalThis.APP_BASE_PATH).toBe(path.resolve('/worker/base'));
        Object.defineProperty(workerThreads, 'isMainThread', { value: origMain, configurable: true });
        app.setBasePath(testBasePath);

        // Constructor with null basePath
        const nullApp = new Application();
        expect(nullApp.hasBeenBootstrapped()).toBe(false);

        // Provider registered with './' relative path and without boot method
        const relProviderFile = path.join(testBasePath, 'relProvider.js');
        fs.writeFileSync(relProviderFile, `
            const _SP = require('@ostro/support/serviceProvider');
            const ServiceProvider = _SP.default || _SP;
            module.exports = class RelProvider extends ServiceProvider {
                register() {}
            };
        `);
        const origCwd = process.cwd();
        process.chdir(testBasePath);
        const relP = app.register('./relProvider.js', true);
        expect(relP).toBeDefined();
        relP.boot = 'not-a-function';
        app.bootProvider(relP);

        // Provider registered with '~/' relative path
        const tildeP = app.register('~/relProvider.js', true);
        expect(tildeP).toBeDefined();
        process.chdir(origCwd);
    });
});
