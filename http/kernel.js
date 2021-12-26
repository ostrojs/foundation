const KernelContract = require('@ostro/contracts/http/kernel')
const HttpContext = require('./httpContext')
const kCachedMiddleware = Symbol('cachedMiddleware')
class Kernel extends KernelContract {

    $bootstrappers = [
        '@ostro/foundation/bootstrap/loadEnvironmentVariables',
        '@ostro/foundation/bootstrap/loadConfiguration',
        '@ostro/foundation/bootstrap/registerFacades',
        '@ostro/foundation/bootstrap/registerProviders',
        '@ostro/foundation/bootstrap/bootProviders',
        '@ostro/foundation/bootstrap/handleSystemError',
    ];

    $defaultMiddlewares = [];

    $middlewareGroups = {};

    $namedMiddlewares = {};

    $middlewarePriority = [
        require('@ostro/foundation/exception/middleware/exceptionHandler'),
        require('@ostro/foundation/view/middleware/BindViewOnResponse'),
    ];

    constructor() {
        super()
        this.bootstrap()
        this.$router = this.$app['router']

    }

    handle() {
        this.syncMiddlewareToRouter();
        this.PrepareRouter()
        return this.$router.handle()
    }

    syncMiddlewareToRouter() {
        this.$router.defaultMiddlewares(this.$middlewarePriority.concat(this.$defaultMiddlewares))
        let allNamedMiddlewares = {
            ...this.resolveNamedMiddleware(),
            ...this.resolveMiddlewareGroups()
        }
        for (let key in allNamedMiddlewares) {
            let middlewares = Array.isArray(allNamedMiddlewares[key]) ? allNamedMiddlewares[key] : [allNamedMiddlewares[key]]
            this.$router.namedMiddleware(key, middlewares);
        }

    }
    resolveNamedMiddleware() {
        let middlewares = {}
        for (let key in this.$namedMiddlewares) {
            middlewares[key] = this.resolveMiddleware(this.$namedMiddlewares[key])
        }
        return middlewares
    }
    resolveMiddlewareGroups() {
        let middlewares = {}
        for (let key in this.$middlewareGroups) {
            middlewares[key] = this.$middlewareGroups[key].map((middleware) => {
                if (typeof middleware == 'string') {
                    if (!this.$namedMiddlewares[middleware]) {
                        throw new Error(`${middleware} was not available on namedMiddlewares`)
                    }
                    middleware = this.$namedMiddlewares[middleware]
                }
                return this.resolveMiddleware(middleware)
            })
        }
        return middlewares
    }
    resolveMiddleware(middleware) {
        return middleware
    }

    PrepareRouter() {
        HttpContext.prototype.$app = this.$app
        this.$router.httpContextHandler(HttpContext)
    }

    bootstrap() {
        if (!this.$app.hasBeenBootstrapped()) {
            this.$app.bootstrapWith(this.getBootstrappers());
        }
    }

    getBootstrappers() {
        return this.$bootstrappers;
    }

    getMiddlewarePriority() {
        return this.$middlewarePriority;
    }

    getMiddlewareGroups() {
        return this.$middlewareGroups;
    }

    getRouteMiddleware() {
        return this.$routeMiddleware;
    }

    getApplication() {
        return this.$app;
    }

    setApplication($app) {
        this.$app = $app;

        return this;
    }
}

module.exports = Kernel