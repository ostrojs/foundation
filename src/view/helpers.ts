import path from 'path';

const kHttp: unique symbol = Symbol('http');
const kApp: unique symbol = Symbol('app');

/**
 * Class Helpers.
 */
class Helpers {
    [kHttp]: any;
    [kApp]: any;

    /**
     * Create a new instance.
     * @param app - Application instance
     * @param http - Http context
     */
    constructor(app: any, http: any) {
        Object.defineProperty(this, kHttp, {
            value: http,
            enumerable: false,
            configurable: false,
            writable: false
        });
        Object.defineProperty(this, kApp, {
            value: app,
            enumerable: false,
            configurable: false,
            writable: false
        });
    }

    /**
     * secure_asset method.
     * @param $name - Asset name
     * @returns Full secure URL
     */
    public secure_asset($name: string, ...rest: string[]): string {
        const domain = this[kApp].config.get('app.asset_url') || ('https://' + this[kHttp].request.get('host'));
        return new URL(path.join(...arguments), domain).href;
    }

    /**
     * asset method.
     * @returns Full URL
     */
    public asset(...args: string[]): string {
        const domain = this[kApp].config.get('app.asset_url') || (this[kHttp].request.protocol() + '://' + this[kHttp].request.get('host'));
        return new URL(path.join(...arguments), domain).href;
    }

    /**
     * session method.
     * @param key - Session key
     * @returns Session value
     */
    public session(key: string): any {
        return this[kHttp].request.session.get(key);
    }

    /**
     * Get auth.
     * @returns Auth object
     */
    public get auth(): any {
        return this[kHttp].request.auth;
    }

    /**
     * old method.
     * @param key - Input key
     * @param defaultValue - Fallback value
     * @returns Old input value
     */
    public old(key: string, defaultValue?: any): any {
        return this[kHttp].request.old(key, defaultValue);
    }

    /**
     * csrfToken method.
     * @returns CSRF token
     */
    public csrfToken(): string {
        return this[kHttp].csrfToken();
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
        return this[kHttp].request.error();
    }

    /**
     * route method.
     * @returns Route URL
     */
    public route(...args: any[]): any {
        return this[kApp]['router'].route(...arguments);
    }

    /**
     * mix method.
     * @param filePath - File path
     * @returns Mix resolved path
     */
    public mix(filePath: string): string {
        return this[kApp].mix.path(filePath);
    }

    /**
     * absolutePath method.
     * @returns Absolute path
     */
    public absolutePath(): string {
        return this[kApp].config.get('app.url', '') + this[kHttp].request.path();
    }
}

export default Helpers;