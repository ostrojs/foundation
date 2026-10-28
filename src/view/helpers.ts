import path from 'node:path';

/**
 * Class Helpers.
 */
class Helpers {
    #http: any;
    #app: any;

    /**
     * Create a new instance.
     * @param app - Application instance
     * @param http - Http context
     */
    constructor(app: any, http: any) {
        this.#http = http;
        this.#app = app;
    }

    /**
     * secure_asset method.
     * @param $name - Asset name
     * @returns Full secure URL
     */
    public secure_asset($name: string, ...rest: string[]): string {
        const domain = this.#app.config.get('app.asset_url') || ('https://' + this.#http.request.get('host'));
        return new URL(path.join(...arguments), domain).href;
    }

    /**
     * asset method.
     * @returns Full URL
     */
    public asset(...args: string[]): string {
        const domain = this.#app.config.get('app.asset_url') || (this.#http.request.protocol() + '://' + this.#http.request.get('host'));
        return new URL(path.join(...arguments), domain).href;
    }

    /**
     * session method.
     * @param key - Session key
     * @returns Session value
     */
    public session(key: string): any {
        return this.#http.request.session.get(key);
    }

    /**
     * Get auth.
     * @returns Auth object
     */
    public get auth(): any {
        return this.#http.request.auth;
    }

    /**
     * old method.
     * @param key - Input key
     * @param defaultValue - Fallback value
     * @returns Old input value
     */
    public old(key: string, defaultValue?: any): any {
        return this.#http.request.old(key, defaultValue);
    }

    /**
     * csrfToken method.
     * @returns CSRF token
     */
    public csrfToken(): string {
        return this.#http.csrfToken();
    }

    /**
     * csrf_token method.
     * @returns CSRF token
     */
    public csrf_token(): string {
        return this.csrfToken();
    }

    /**
     * Get error.
     * @returns Error bag
     */
    public get error(): any {
        return this.#http.request.error();
    }

    /**
     * route method.
     * @returns Route URL
     */
    public route(...args: any[]): any {
        return this.#app['router'].route(...arguments);
    }

    /**
     * mix method.
     * @param filePath - File path
     * @returns Mix resolved path
     */
    public mix(filePath: string): string {
        return this.#app.mix.path(filePath);
    }

    /**
     * vite method.
     * @param entries - Entry path or array of paths
     * @param buildDirectory - Build directory inside public (defaults to 'build')
     * @returns Rendered HTML script/link tags
     */
    public vite(entries: string | string[], buildDirectory: string = 'build'): string {
        return this.#app.vite.tags(entries, buildDirectory);
    }

    /**
     * viteAsset method.
     * @param entry - Entry path
     * @param buildDirectory - Build directory inside public (defaults to 'build')
     * @returns Resolved asset URL
     */
    public viteAsset(entry: string, buildDirectory: string = 'build'): string {
        return this.#app.vite.asset(entry, buildDirectory);
    }

    /**
     * absolutePath method.
     * @returns Absolute path
     */
    public absolutePath(): string {
        return this.#app.config.get('app.url', '') + this.#http.request.path();
    }
}

export default Helpers;