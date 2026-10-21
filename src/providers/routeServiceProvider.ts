import ServiceProvider from '@ostro/router/routeServiceProvider';

/**
 * Class RouteServiceProvider.
 */
class RouteServiceProvider extends ServiceProvider {

    public $namespace: string = '';

    /**
     * register method.
     */
    public override register(): void {
        super.register();
    }

    /**
     * boot method.
     */
    public boot(): void {
        //
    }

    /**
     * routes method.
     */
    public routes(): void {
    }

    /**
     * setRootControllerNamespace method.
     */
    public setRootControllerNamespace(): void {
    }

    /**
     * routesAreCached method.
     */
    public routesAreCached(): boolean | void {
    }

    /**
     * loadCachedRoutes method.
     */
    public loadCachedRoutes(): void {
    }

    /**
     * loadRoutes method.
     */
    public loadRoutes(): void {
    }
}

export default RouteServiceProvider;