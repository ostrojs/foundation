const Container = require('@ostro/container')
const LoadEnvironmentVariables = require('./bootstrap/loadConfiguration')
const Filesystem = require('@ostro/filesystem/filesystem')
const ProviderRepository = require('./providerRepository')
const Env = require('@ostro/support/env')
const path = require('path')
const Mix = require('./mix')
const kBasePath = Symbol('basePath')
const kHasBeenBootstrapped = Symbol('hasBeenBootstrapped')
const kBooted = Symbol('booted')
const kServiceProviders = Symbol('serviceProviders')
const kDeferredServices = Symbol('deferredServices')
const kLoadedProviders = Symbol('loadedProviders')
const kAppPath = Symbol('appPath')
const kDatabasePath = Symbol('databasePath')
const kLangPath = Symbol('langPath')
const kStoragePath = Symbol('storagePath')
const kEnvironmentPath = Symbol('environmentPath')
const kEnvironmentFile = Symbol('environmentFile')
class Application extends Container {

    get VERSION() {
        return '0.0.0-alpha.0';
    }

    _basePath;

    _hasBeenBootstrapped = false;

    _booted = false;

    _serviceProviders = [];

    _deferredServices = [];

    _loadedProviders = [];

    _appPath;

    _databasePath;

    _langPath;

    _storagePath;

    _environmentPath;

    _environmentFile;

    constructor(basePath = null) {
        super()

        if (basePath) {
            this.setBasePath(basePath);
        }

        this.registerBaseBindings();
        this.registerBaseServiceProviders();

        global.app = this.app.bind(this)
    }

    version() {
        return this.VERSION;
    }

    registerBaseBindings() {
        this.instance('app', this);
        this.singleton('mix', function(app) {
            return new Mix(app)
        });

    }

    bootstrapWith($bootstrappers) {
        this._hasBeenBootstrapped = true;

        for (let $bootstrapper of $bootstrappers) {
            this.make($bootstrapper).bootstrap(this);
        }
    }

    registerBaseServiceProviders() {
        this.register('@ostro/logger/logServiceProvider');

    }

    registerConfiguredProviders() {
        let $providers = this.config['app.providers'];
        (new ProviderRepository(this, new Filesystem, this.getCachedServicesPath()))
        .load($providers);

    }

    getDeferredServices() {
        return this._deferredServices;
    }

    setDeferredServices($services) {
        this._deferredServices = $services;
    }

    addDeferredServices($services) {
        this._deferredServices = this._deferredServices.concat($services);
    }

    isDeferredService($service) {
        return this._deferredServices.indexOf($service) > -1
    }

    hasBeenBootstrapped() {
        return this._hasBeenBootstrapped;
    }

    setBasePath(basePath) {
        this._basePath = path.resolve(basePath);
        process.chdir(this._basePath || process.cwd());
        this.bindPathsInContainer();

        return this;
    }

    bindPathsInContainer() {
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

    isBooted() {
        return this._booted;
    }

    boot() {
        let app = this.instance('config').get('app')
        process.env.TZ = app.timezone
        process.env.NODE_ENV = app.env
        this._serviceProviders.map(($p) => {
            this.bootProvider($p);
        });
        this._booted = true;

    }

    register($provider, $force = false) {
        if (typeof $provider == 'string') {
            $provider = require(path.normalize($provider.startsWith('./') ? path.resolve($provider) : $provider))
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

    markAsRegistered($provider) {
        this._serviceProviders.push($provider);

    }

    getProvider($provider) {
        return this.getProviders($provider)
    }

    getProviders($provider) {

        return this._serviceProviders.find(function(value) {
            return value instanceof $provider
        })
    }

    resolveProvider($provider) {

        return new $provider(this);
    }

    bootProvider($provider) {
        $provider.callBootingCallbacks();

        if (typeof $provider.boot == 'function') {
            $provider.boot(this)
        }

        $provider.callBootedCallbacks();
    }

    loadDeferredProviders() {

        for (let $provider of this._deferredServices) {
            this.loadDeferredProvider($provider);
        }

        this._deferredServices = [];
    }

    loadDeferredProvider($provider) {
        if (!this.isDeferredService($provider)) {
            return;
        }

        this.registerDeferredProvider($provider);

    }

    registerDeferredProvider($provider, $service = null) {

        this.register($provider);

        if (!this.isBooted()) {
            this.booting(function() {
                this.bootProvider($instance);
            });
        }
    }

    path(dir = '') {
        let appPath = this._appPath ? this._appPath : path.normalize(path.join(this._basePath, 'app'));

        return path.normalize(path.join(appPath + dir));
    }

    useAppPath(dir) {
        this._appPath = dir;

        this.instance('path', dir);

        return this;
    }

    basePath(dir = '') {
        return path.normalize(path.join(this._basePath, dir))
    }

    bootstrapPath(dir = '') {
        return path.normalize(path.join(this._basePath, 'bootstrap', dir));
    }

    configPath(dir = '') {
        return path.normalize(path.join(this._basePath, 'config', dir));
    }

    databasePath(dir = '') {
        return path.normalize(path.join((this._databasePath ? this._databasePath : path.join(this._basePath, 'database')), dir));
    }

    useDatabasePath(dir) {
        this._databasePath = dir;

        this.instance('path.database', dir);

        return this;
    }

    langPath() {
        if (this._langPath) {
            return this._langPath;
        }
        let dir = path.normalize(path.join(this.resourcePath(), 'lang'))
        if (!!path.extname(dir)) {
            return dir;
        }

        return path.normalize(path.join(this.basePath(), 'lang'));
    }

    useLangPath(dir) {
        this._langPath = dir;

        this.instance('path.lang', dir);

        return this;
    }

    publicPath() {
        return path.normalize(path.join(this._basePath, 'public'));
    }

    storagePath() {
        return this._storagePath ? this._storagePath : path.normalize(path.join(this._basePath, 'storage'));
    }

    useStoragePath(dir) {
        this._storagePath = dir;

        this.instance('path.storage', dir);

        return this;
    }

    resourcePath(dir = '') {
        return path.normalize(path.join(this._basePath, 'resources', dir));
    }

    viewPath(dir = '') {
        let basePath = this['config'].get('view.paths', [])[0];

        return path.normalize(path.join((basePath ? basePath : this._basePath + '/resources/view'), dir));
    }

    environmentPath() {
        return this._environmentPath ? this._environmentPath : this._basePath;
    }

    useEnvironmentPath(dir) {
        this._environmentPath = dir;

        return this;
    }

    loadEnvironmentFrom(file) {
        this._environmentFile = file;

        return this;
    }

    environmentFile() {
        return this._environmentFile ? this._environmentFile : '.env';
    }

    environmentFilePath() {
        return path.normalize(path.join(this.environmentPath(), this.environmentFile()));
    }

    isLocal() {
        return this['env'] === 'local';
    }

    isProduction() {
        return this['env'] === 'production';
    }

    isDownForMaintenance() {
        return file_exists(this.storagePath() + '/framework/down');
    }

    getLocale() {
        return this['config'].get('app.locale');
    }

    currentLocale() {
        return this.getLocale();
    }

    getFallbackLocale() {
        return this['config'].get('app.fallback_locale');
    }

    setLocale(locale) {
        this['config'].set('app.locale', locale);

        this['translator'].setLocale(locale);

        this['events'].dispatch(new LocaleUpdated(locale));
    }

    setFallbackLocale(fallbackLocale) {
        this['config'].set('app.fallback_locale', fallbackLocale);

        this['translator'].setFallback(fallbackLocale);
    }

    isLocale(locale) {
        return this.getLocale() == locale;
    }

    getCachedServicesPath() {
        return this.normalizeCachePath('APP_SERVICES_CACHE', 'cache/services.json');
    }

    getCachedPackagesPath() {
        return this.normalizeCachePath('APP_PACKAGES_CACHE', 'cache/packages.json');
    }

    configurationIsCached() {
        return is_file(this.getCachedConfigPath());
    }

    getCachedConfigPath() {
        return this.normalizeCachePath('APP_CONFIG_CACHE', 'cache/config.json');
    }

    routesAreCached() {
        return this['files'].exists(this.getCachedRoutesPath());
    }

    getCachedRoutesPath() {
        return this.normalizeCachePath('APP_ROUTES_CACHE', 'cache/routes-v7.json');
    }

    eventsAreCached() {
        return this['files'].exists(this.getCachedEventsPath());
    }

    getCachedEventsPath() {
        return this.normalizeCachePath('APP_EVENTS_CACHE', 'cache/events.json');
    }

    normalizeCachePath($key, $default) {
        let $env = Env.get($key)
        if ($env == null) {
            return this.bootstrapPath($default);
        }

        return $env.startsWith(this.absoluteCachePathPrefixes) ?
            $env :
            this.basePath($env);
    }

}

module.exports = Application