import Response from '@ostro/http/response';
import Model, { type IModel } from '@ostro/contracts/database/eloquent/model';
import Collection, { type ICollection } from '@ostro/contracts/collection/collect';
/**
 * Class HttpResponse.
 */
class HttpResponse extends Response {

    /**
     * send method.
     * @param body - Response body
     * @param status - HTTP status code
     */
    public override send(body: any, status?: number): any {
        if (body instanceof Model) {
            const model = body as IModel;
            body = model.serialize ? model.serialize() : body;
        } else if (body instanceof Collection) {
            const col = body as ICollection;
            if (typeof col.isArray === 'function' && col.isArray()) {
                body = col.toArray();
            } else if (typeof col.isJson === 'function' && col.isJson()) {
                body = col.toJSON();
            }
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
