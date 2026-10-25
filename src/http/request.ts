declare var app: any;
import ErrorBag from '@ostro/support/errorBag';
import ObjectGet from 'lodash.get';
import Request from '@ostro/http/request';

// Framework global: app

/**
 * Class HttpRequest.
 */
class HttpRequest extends Request {
    #errors: any = null;

    /**
     * old method.
     * @param key - Input key
     * @param defaultValue - Default fallback value
     * @returns Old input value
     */
    public old(key: string, defaultValue: any = null): any {
        return ObjectGet(this.session.get('__inputs'), key, defaultValue);
    }

    /**
     * error method.
     * @param key - Error key
     * @param defaultValue - Default fallback value
     * @returns Error bag or first error for key
     */
    public error(key?: string, defaultValue: any = null): any {
        this.#errors = this.#errors || new ErrorBag((this.session ? this.session.get('__errors') : {}));
        if (key) {
            return this.#errors.first(key);
        }
        return this.#errors;
    }

    /**
     * csrfToken method.
     * @returns CSRF token string
     */
    public csrfToken(): string {
        return this.session.token() || '';
    }

    /**
     * flash method.
     * @param args - Arguments to flash
     * @returns Flash result
     */
    public flash(...args: any[]): any {
        return this.session.flash(...arguments);
    }

    /**
     * flashOnly method.
     * @param args - Arguments to flashOnly
     * @returns FlashOnly result
     */
    public flashOnly(...args: any[]): any {
        return this.session.flashOnly(...arguments);
    }

    /**
     * flashExcept method.
     * @param args - Arguments to flashExcept
     * @returns FlashExcept result
     */
    public flashExcept(...args: any[]): any {
        return this.session.flashExcept(...arguments);
    }

    /**
     * routeIs method.
     * @param route - Route pattern to check
     * @returns True if route matches
     */
    public routeIs(route: string): boolean {
        const currentRoute = app('router').currentRoute(this);
        if (!currentRoute) {
            return false;
        } else if (!currentRoute.$name) {
            return false;
        } else if (currentRoute.$name === route) {
            return true;
        } else {
            return Boolean(currentRoute.$name.match(new RegExp(route)));
        }
    }
}

export default HttpRequest;