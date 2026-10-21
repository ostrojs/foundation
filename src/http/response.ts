import Response from '@ostro/http/response';
import Model from '@ostro/contracts/database/eloquent/model';
import Collection from '@ostro/contracts/collection/collect';
import GenericUser from '@ostro/contracts/auth/genericUser';

/**
 * Class HttpResponse.
 */
class HttpResponse extends Response {

    /**
     * send method.
     * @param body - Response body
     * @param status - HTTP status code
     */
    public override send(body: any, status: number = 200): any {
        if (body instanceof Model) {
            body = (body as any).serialize();
        } else if (body instanceof Collection && (body as any).isArray()) {
            body = (body as any).toArray();
        } else if (body instanceof Collection && (body as any).isJson()) {
            body = (body as any).toJSON();
        }
        super.send(body, status);
    }

    /**
     * with method.
     * @param key - Flash key or object
     * @param value - Flash value
     * @returns this
     */
    public with(key: string | Record<string, any>, value?: any): this {
        let obj = typeof key === 'string' ? {
            [key]: value
        } : key;
        obj = obj || {};
        this.request.session.flash(obj);
        return this;
    }

    /**
     * withInput method.
     * @param key - Input key, object, or boolean
     * @param value - Input value
     * @returns this
     */
    public withInput(key?: string | Record<string, any> | boolean | null, value?: any): this {
        let normalizedKey = typeof key === 'string' ? { key: value } : key;
        if (normalizedKey) {
            normalizedKey = normalizedKey === true ? this.request.except('_token') : normalizedKey;
            this.request.session.flash('__inputs', normalizedKey);
        }
        return this;
    }

    /**
     * withErrors method.
     * @param errors - Errors bag or object
     * @returns this
     */
    public withErrors(errors: Record<string, any> = {}): this {
        this.request.session.flash('__errors', errors);
        return this;
    }
}

export default HttpResponse;
