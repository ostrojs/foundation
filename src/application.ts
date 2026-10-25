import Container from '@ostro/container';
import Filesystem from '@ostro/filesystem/filesystem';
import ProviderRepository from './providerRepository';
import Env from '@ostro/support/env';
import path from 'node:path';
import fs from 'node:fs';
import Mix from './mix';
import LocaleUpdated from './events/localeUpdated';
import worker_threads from 'node:worker_threads';
import type { IConfig } from '@ostro/contracts/config/repository';
/**
 * Class Application.
 */
class Application extends Container {

    /**
     * Get VERSION.
     * @returns {any}
     */
    public get VERSION() {
        return '1.1.5';
    }

    _basePath;

    _hasBeenBootstrapped = false;

    _booted = false;

    _serviceProviders = [];

    _deferredServices = [];

    _bootingCallbacks = [];

    /**
     * booting method.
     * @param {*} callback
     * @returns {any}
     */
    public booting(callback: Function) {
        this._bootingCallbacks.push(callback);
    }

    _loadedProviders = [];

    _appPath;

    _databasePath;

    _langPath;

    _storagePath;

    _environmentPath;

    _environmentFile;

    /**
     * Create a new instance.
     * @param {*} basePath
     */
    constructor(basePath: any = null) {
        super()

        if (basePath) {
            this.setBasePath(basePath);
        }

        this.registerBaseBindings();
        this.registerBaseServiceProviders();

        global.app = this.app.bind(this)
    }

    /**
     * version method.
     * @returns {any}
     */
    public version() {
        return this.VERSION;
    }

    /**
     * registerBaseBindings method.
     * @returns {any}
     */
    public registerBaseBindings() {
        this.instance('app', this);
        this.singleton('mix', function (app) {
            return new Mix(app)
        });

    }

    /**
     * bootstrapWith method.
     * @param {*} $bootstrappers
     * @returns {any}
     */
    public bootstrapWith($bootstrappers: any) {
        this._hasBeenBootstrapped = true;

        for (let $bootstrapper of $bootstrappers) {
            this.make($bootstrapper).bootstrap(this);
        }
    }

    /**
     * registerBaseServiceProviders method.
     * @returns {any}
     */
    public registerBaseServiceProviders() {
        this.register('@ostro/logger/logServiceProvider');

    }

    /**
     * registerConfiguredProviders method.
     * @returns {any}
     */
    public registerConfiguredProviders() {
        let $providers = this.config['app.providers'];
        (new ProviderRepository(this, new Filesystem))
            .load($providers);

    }

    /**
     * getDeferredServices method.
     * @returns {any}
     */
    public getDeferredServices() {
        return this._deferredServices;
    }

    /**
     * setDeferredServices method.
     * @param {*} $services
     * @returns {any}
     */
    public setDeferredServices($services: any) {
        this._deferredServices = $services;
    }

    /**
     * addDeferredServices method.
     * @param {*} $services
     * @returns {any}
     */
    public addDeferredServices($services: any) {
        this._deferredServices = this._deferredServices.concat($services);
    }

    /**
     * isDeferredService method.
     * @param {*} $service
     * @returns {any}
     */
    public isDeferredService($service: any) {
        return this._deferredServices.indexOf($service) > -1
    }

    /**
     * hasBeenBootstrapped method.
     * @returns {any}
     */
    public hasBeenBootstrapped() {
        return this._hasBeenBootstrapped;
    }

    /**
     * setBasePath method.
     * @param {*} basePath
     * @returns {any}
     */
    public setBasePath(basePath: any) {
        this._basePath = path.resolve(basePath);
        if (worker_threads.isMainThread) {
            process.chdir(this._basePath);
        } else {
            globalThis.APP_BASE_PATH = this._basePath;
        }

        this.bindPathsInContainer();

        return this;
    }

    /**
     * bindPathsInContainer method.
     * @returns {any}
     */
    public bindPathsInContainer() {
        this.instance('path', this.path());
        this.instance('path.base', this.basePath());
        this.instance('path.lang', this.langPath());
        this.instance('path.config', this.configPath());
        this.instance('path.public', this.publicPath());
        this.instance('path.storage', this.storagePath());
        this.instance('path.database', this.databasePath());
        this.instance('path.resources', this.resourcePath());
        this.instance('path.bootstrap', this.bootstrapPath());
    }

    /**
     * isBooted method.
     * @returns {any}
     */
    public isBooted() {
        return this._booted;
    }

    /**
     * boot method.
     * @returns {any}
     */
    public boot() {
        let app = this.make<IConfig>('config')?.get<Record<string, any>>('app') || {};
        process.env.TZ = app.timezone
        process.env.NODE_ENV = app.env
        this._bootingCallbacks.forEach(callback => callback(this));
        this._serviceProviders.map(($p) => {
            this.bootProvider($p);
        });
        this._booted = true;

    }

    /**
     * register method.
     * @param {*} $provider
     * @param {*} $force
     * @returns {any}
     */
    public register($provider: any, $force: boolean = false) {
        if (typeof $provider == 'string') {
            let providerPath = $provider;
            if (providerPath.startsWith('~/')) {
                providerPath = path.resolve(this.basePath(), providerPath.slice(2));
            } else if (providerPath.startsWith('./')) {
                providerPath = path.resolve(providerPath);
            }
            const mod = require(path.normalize(providerPath));
            $provider = (mod && Object.prototype.hasOwnProperty.call(mod, 'default')) ? mod.default : mod;
        }
        let $registered = this.getProvider($provider)
        if ($registered && !$force) {
            return $registered;
        }

        $provider = this.resolveProvider($provider);

        $provider.register();

        this.markAsRegistered($provider);

        if (this.isBooted()) {
            this.bootProvider($provider);
        }

        return $provider;
    }

    /**
     * markAsRegistered method.
     * @param {*} $provider
     * @returns {any}
     */
    public markAsRegistered($provider: any) {
        this._serviceProviders.push($provider);

    }

    /**
     * getProvider method.
     * @param {*} $provider
     * @returns {any}
     */
    public getProvider($provider: any) {
        return this.getProviders($provider)
    }

    /**
     * getProviders method.
     * @param {*} $provider
     * @returns {any}
     */
    public getProviders($provider: any) {

        return this._serviceProviders.find(function (value) {
            return value instanceof $provider
        })
    }

    /**
     * resolveProvider method.
     * @param {*} $provider
     * @returns {any}
     */
    public resolveProvider($provider: any) {
        if ($provider && Object.prototype.hasOwnProperty.call($provider, 'default')) {
            $provider = $provider.default;
        }
        return new $provider(this);
    }

    /**
     * bootProvider method.
     * @param {*} $provider
     * @returns {any}
     */
    public bootProvider($provider: any) {
        $provider.callBootingCallbacks();

        if (typeof $provider.boot == 'function') {
            $provider.boot(this)
        }

        $provider.callBootedCallbacks();
    }

    /**
     * loadDeferredProviders method.
     * @returns {any}
     */
    public loadDeferredProviders() {

        for (let $provider of this._deferredServices) {
            this.loadDeferredProvider($provider);
        }

        this._deferredServices = [];
    }

    /**
     * loadDeferredProvider method.
     * @param {*} $provider
     * @returns {any}
     */
    public loadDeferredProvider($provider: any) {
        if (!this.isDeferredService($provider)) {
            return;
        }

        this.registerDeferredProvider($provider);

    }

    /**
     * registerDeferredProvider method.
     * @param {*} $provider
     * @param {*} $service
     * @returns {any}
     */
    public registerDeferredProvider($provider: any, $service: any = null) {

        let instance = this.register($provider);

        if (!this.isBooted()) {
            this.booting(() => {
                this.bootProvider(instance);
            });
        }
    }

    /**
     * path method.
     * @param {*} dir
     * @returns {any}
     */
    public path(dir: string = '') {
        let appPath = this._appPath ? this._appPath : path.normalize(path.join(this._basePath, 'app'));

        return path.normalize(path.join(appPath + dir));
    }

    /**
     * useAppPath method.
     * @param {*} dir
     * @returns {any}
     */
    public useAppPath(dir: any) {
        this._appPath = dir;

        this.instance('path', dir);

        return this;
    }

    /**
     * basePath method.
     * @param {*} dir
     * @returns {any}
     */
    public basePath(dir: string = '') {
        return path.normalize(path.join(this._basePath, dir))
    }

    /**
     * bootstrapPath method.
     * @param {*} dir
     * @returns {any}
     */
    public bootstrapPath(dir: string = '') {
        const rootBoot = path.join(this._basePath, 'bootstrap');
        const distBoot = path.join(this._basePath, '.dist', 'bootstrap');
        const buildBoot = path.join(this._basePath, 'build', 'bootstrap');
        const srcBoot = path.join(this._basePath, 'src', 'bootstrap');
        let targetDir = rootBoot;
        if (!fs.existsSync(path.join(rootBoot, 'app.js'))) {
            if (fs.existsSync(path.join(distBoot, 'app.js'))) targetDir = distBoot;
            else if (fs.existsSync(path.join(buildBoot, 'app.js'))) targetDir = buildBoot;
            else if (fs.existsSync(rootBoot)) targetDir = rootBoot;
            else if (fs.existsSync(srcBoot)) targetDir = srcBoot;
        }
        return path.normalize(path.join(targetDir, dir));
    }

    /**
     * configPath method.
     * @param {*} dir
     * @returns {any}
     */
    public configPath(dir: string = '') {
        const rootConfig = path.join(this._basePath, 'config');
        const distConfig = path.join(this._basePath, '.dist', 'config');
        const buildConfig = path.join(this._basePath, 'build', 'config');
        const srcConfig = path.join(this._basePath, 'src', 'config');
        let targetDir = rootConfig;
        if (!fs.existsSync(path.join(rootConfig, 'app.js'))) {
            if (fs.existsSync(path.join(distConfig, 'app.js'))) targetDir = distConfig;
            else if (fs.existsSync(path.join(buildConfig, 'app.js'))) targetDir = buildConfig;
            else if (fs.existsSync(rootConfig)) targetDir = rootConfig;
            else if (fs.existsSync(srcConfig)) targetDir = srcConfig;
        }
        return path.normalize(path.join(targetDir, dir));
    }

    /**
     * databasePath method.
     * @param {*} dir
     * @returns {any}
     */
    public databasePath(dir: string = '') {
        return path.normalize(path.join((this._databasePath ? this._databasePath : path.join(this._basePath, 'database')), dir));
    }

    /**
     * useDatabasePath method.
     * @param {*} dir
     * @returns {any}
     */
    public useDatabasePath(dir: any) {
        this._databasePath = dir;

        this.instance('path.database', dir);

        return this;
    }

    /**
     * langPath method.
     * @returns {any}
     */
    public langPath() {
        if (this._langPath) {
            return this._langPath;
        }
        let dir = path.normalize(path.join(this.resourcePath(), 'lang'))
        if (!!path.extname(dir)) {
            return dir;
        }

        return path.normalize(path.join(this.basePath(), 'lang'));
    }

    /**
     * useLangPath method.
     * @param {*} dir
     * @returns {any}
     */
    public useLangPath(dir: any) {
        this._langPath = dir;

        this.instance('path.lang', dir);

        return this;
    }

    /**
     * publicPath method.
     * @returns {any}
     */
    public publicPath() {
        return path.normalize(path.join(this._basePath, 'public'));
    }

    /**
     * storagePath method.
     * @returns {any}
     */
    public storagePath() {
        return this._storagePath ? this._storagePath : path.normalize(path.join(this._basePath, 'storage'));
    }

    /**
     * useStoragePath method.
     * @param {*} dir
     * @returns {any}
     */
    public useStoragePath(dir: any) {
        this._storagePath = dir;

        this.instance('path.storage', dir);

        return this;
    }

    /**
     * resourcePath method.
     * @param {*} dir
     * @returns {any}
     */
    public resourcePath(dir: string = '') {
        return path.normalize(path.join(this._basePath, 'resources', dir));
    }

    /**
     * viewPath method.
     * @param {*} dir
     * @returns {any}
     */
    public viewPath(dir: string = '') {
        let basePath = this['config'] ? this['config'].get('view.paths', [])[0] : null;

        return path.normalize(path.join((basePath ? basePath : this._basePath + '/resources/view'), dir));
    }

    /**
     * environmentPath method.
     * @returns {any}
     */
    public environmentPath() {
        return this._environmentPath ? this._environmentPath : this._basePath;
    }

    /**
     * useEnvironmentPath method.
     * @param {*} dir
     * @returns {any}
     */
    public useEnvironmentPath(dir: any) {
        this._environmentPath = dir;

        return this;
    }

    /**
     * loadEnvironmentFrom method.
     * @param {*} file
     * @returns {any}
     */
    public loadEnvironmentFrom(file: any) {
        this._environmentFile = file;

        return this;
    }

    /**
     * environmentFile method.
     * @returns {any}
     */
    public environmentFile() {
        return this._environmentFile ? this._environmentFile : '.env';
    }

    /**
     * environmentFilePath method.
     * @returns {any}
     */
    public environmentFilePath() {
        return path.normalize(path.join(this.environmentPath(), this.environmentFile()));
    }

    /**
     * isLocal method.
     * @returns {any}
     */
    public isLocal() {
        return this['env'] === 'local';
    }

    /**
     * isProduction method.
     * @returns {any}
     */
    public isProduction() {
        return this['env'] === 'production';
    }

    /**
     * isDownForMaintenance method.
     * @returns {any}
     */
    public isDownForMaintenance() {
        return fs.existsSync(this.storagePath() + '/framework/down');
    }

    /**
     * getLocale method.
     * @returns {any}
     */
    public getLocale() {
        return this['config'].get('app.locale');
    }

    /**
     * currentLocale method.
     * @returns {any}
     */
    public currentLocale() {
        return this.getLocale();
    }

    /**
     * getFallbackLocale method.
     * @returns {any}
     */
    public getFallbackLocale() {
        return this['config'].get('app.fallback_locale');
    }

    /**
     * setLocale method.
     * @param {*} locale
     * @returns {any}
     */
    public setLocale(locale: any) {
        this['config'].set('app.locale', locale);

        this['translator'].setLocale(locale);

        this['events'].dispatch(new LocaleUpdated(locale));
    }

    /**
     * setFallbackLocale method.
     * @param {*} fallbackLocale
     * @returns {any}
     */
    public setFallbackLocale(fallbackLocale: any) {
        this['config'].set('app.fallback_locale', fallbackLocale);

        this['translator'].setFallback(fallbackLocale);
    }

    /**
     * isLocale method.
     * @param {*} locale
     * @returns {any}
     */
    public isLocale(locale: any) {
        return this.getLocale() == locale;
    }

    /**
     * getCachedServicesPath method.
     * @returns {any}
     */
    public getCachedServicesPath() {
        return this.normalizeCachePath('APP_SERVICES_CACHE', 'cache/services.json');
    }

    /**
     * getCachedPackagesPath method.
     * @returns {any}
     */
    public getCachedPackagesPath() {
        return this.normalizeCachePath('APP_PACKAGES_CACHE', 'cache/packages.json');
    }

    /**
     * configurationIsCached method.
     * @returns {any}
     */
    public configurationIsCached() {
        return fs.existsSync(this.getCachedConfigPath());
    }

    /**
     * getCachedConfigPath method.
     * @returns {any}
     */
    public getCachedConfigPath() {
        return this.normalizeCachePath('APP_CONFIG_CACHE', 'cache/config.json');
    }

    /**
     * routesAreCached method.
     * @returns {any}
     */
    public routesAreCached() {
        return this['files'].exists(this.getCachedRoutesPath());
    }

    /**
     * getCachedRoutesPath method.
     * @returns {any}
     */
    public getCachedRoutesPath() {
        return this.normalizeCachePath('APP_ROUTES_CACHE', 'cache/routes-v7.json');
    }

    /**
     * eventsAreCached method.
     * @returns {any}
     */
    public eventsAreCached() {
        return this['files'].exists(this.getCachedEventsPath());
    }

    /**
     * getCachedEventsPath method.
     * @returns {any}
     */
    public getCachedEventsPath() {
        return this.normalizeCachePath('APP_EVENTS_CACHE', 'cache/events.json');
    }

    /**
     * normalizeCachePath method.
     * @param {*} $key
     * @param {*} $default
     * @returns {any}
     */
    public normalizeCachePath($key: string, $default: any) {
        let $env = Env.get($key)
        if ($env == null) {
            return this.bootstrapPath($default);
        }

        return $env.startsWith(this.absoluteCachePathPrefixes) ?
            $env :
            this.basePath($env);
    }

}

export default Application;
