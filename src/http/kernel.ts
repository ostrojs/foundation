import KernelContract from '@ostro/contracts/http/kernel';
import HttpContext from './httpContext';
import ExceptionHandlerMiddleware from '../exception/middleware/exceptionHandler';
import BindViewOnResponse from '../view/middleware/BindViewOnResponse';

const kCachedMiddleware: unique symbol = Symbol('cachedMiddleware');

/**
 * Class Kernel.
 */
class Kernel extends KernelContract {
    public declare $app: any;
    public $router: any;
    public $routeMiddleware: any;

    public $bootstrappers: string[] = [
        '@ostro/foundation/bootstrap/loadEnvironmentVariables',
        '@ostro/foundation/bootstrap/loadConfiguration',
        '@ostro/foundation/bootstrap/registerFacades',
        '@ostro/foundation/bootstrap/registerProviders',
        '@ostro/foundation/bootstrap/bootProviders',
        '@ostro/foundation/bootstrap/handleSystemError',
    ];

    public $defaultMiddlewares: any[] = [];
    public $middlewareGroups: Record<string, any[]> = {};
    public $namedMiddlewares: Record<string, any> = {};

    public $middlewarePriority: any[] = [
        ExceptionHandlerMiddleware,
        BindViewOnResponse,
    ];

    /**
     * Create a new instance.
     */
    constructor() {
        super();
        this.bootstrap();
        this.$router = this.$app['router'];
    }

    /**
     * handle method.
     * @returns Handled router result
     */
    public override handle(): any {
        this.syncMiddlewareToRouter();
        this.PrepareRouter();
        return this.$router.handle();
    }

    /**
     * syncMiddlewareToRouter method.
     */
    public syncMiddlewareToRouter(): void {
        this.$router.defaultMiddlewares(this.$middlewarePriority.concat(this.$defaultMiddlewares));
        const allNamedMiddlewares: Record<string, any> = {
            ...this.resolveNamedMiddleware(),
            ...this.resolveMiddlewareGroups()
        };
        for (const key in allNamedMiddlewares) {
            const middlewares = Array.isArray(allNamedMiddlewares[key]) ? allNamedMiddlewares[key] : [allNamedMiddlewares[key]];
            this.$router.namedMiddleware(key, middlewares);
        }
    }

    /**
     * resolveNamedMiddleware method.
     * @returns Map of resolved named middlewares
     */
    public resolveNamedMiddleware(): Record<string, any> {
        const middlewares: Record<string, any> = {};
        for (const key in this.$namedMiddlewares) {
            middlewares[key] = this.resolveMiddleware(this.$namedMiddlewares[key]);
        }
        return middlewares;
    }

    /**
     * resolveMiddlewareGroups method.
     * @returns Map of resolved middleware groups
     */
    public resolveMiddlewareGroups(): Record<string, any> {
        const middlewares: Record<string, any> = {};
        for (const key in this.$middlewareGroups) {
            middlewares[key] = this.$middlewareGroups[key].map((middleware: any) => {
                if (typeof middleware === 'string') {
                    if (!this.$namedMiddlewares[middleware]) {
                        throw new Error(`${middleware} was not available on namedMiddlewares`);
                    }
                    middleware = this.$namedMiddlewares[middleware];
                }
                return this.resolveMiddleware(middleware);
            });
        }
        return middlewares;
    }

    /**
     * resolveMiddleware method.
     * @param middleware - Middleware to resolve
     * @returns Resolved middleware
     */
    public resolveMiddleware(middleware: any): any {
        return middleware;
    }

    /**
     * PrepareRouter method.
     */
    public PrepareRouter(): void {
        (HttpContext.prototype as any).$app = this.$app;
        this.$router.httpContextHandler(HttpContext);
    }

    /**
     * bootstrap method.
     */
    public override bootstrap(): void {
        if (!this.$app.hasBeenBootstrapped()) {
            this.$app.bootstrapWith(this.getBootstrappers());
        }
    }

    /**
     * getBootstrappers method.
     * @returns Array of bootstrapper class paths
     */
    public getBootstrappers(): string[] {
        return this.$bootstrappers;
    }

    /**
     * getMiddlewarePriority method.
     * @returns Array of priority middlewares
     */
    public getMiddlewarePriority(): any[] {
        return this.$middlewarePriority;
    }

    /**
     * getMiddlewareGroups method.
     * @returns Map of middleware groups
     */
    public getMiddlewareGroups(): Record<string, any[]> {
        return this.$middlewareGroups;
    }

    /**
     * getRouteMiddleware method.
     * @returns Route middleware map
     */
    public getRouteMiddleware(): any {
        return this.$routeMiddleware;
    }

    /**
     * getApplication method.
     * @returns Application instance
     */
    public override getApplication(): any {
        return this.$app;
    }

    /**
     * setApplication method.
     * @param $app - Application instance
     * @returns this
     */
    public setApplication($app: any): this {
        this.$app = $app;
        return this;
    }
}

export default Kernel;