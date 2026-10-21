import ViewException from './viewException';
import ViewHelpers from './helpers';

/**
 * Class View.
 */
class View {
    /**
     * Create a new instance.
     * @param app - Application instance
     * @param http - Http context
     * @param next - Next middleware callback
     */
    constructor(app: any, http: any, next: Function) {
        const context: Record<string, any> = {};
        Object.assign(context, (app['locals'] || {}));
        Object.assign(context, global);
        context.request = http.request;
        context.session = http.session;
        context.helpers = new ViewHelpers(app, http);

        const fn: any = function (file: string, data: any = {}, status: number = 200) {
            fn.render(...arguments);
            return http.response;
        };

        fn.engine = function (engine: string) {
            Object.defineProperty(http.response, '__viewEngine', {
                value: engine,
                configurable: false,
                writable: false,
                enumerable: false
            });
            return this;
        };

        fn.render = function (file: string, data: any = {}, status: number = 200) {
            Object.assign(data, context);

            const renderPromise = new Promise((resolve, reject) => {
                app.view.engine(http.response.__viewEngine).renderFile(file, data, (err: any, content?: any) => {
                    const result = content !== undefined ? content : err;
                    if (content === undefined && err && typeof err === 'object' && !(err instanceof Promise) && (err instanceof Error || err?.message)) {
                        const viewErr = new ViewException(err);
                        next(viewErr);
                        return reject(viewErr);
                    }
                    Promise.resolve(result)
                        .then(res => {
                            const sendResult = http.response.send(res, status);
                            resolve(sendResult);
                        })
                        .catch(e => {
                            next(e);
                            reject(e);
                        });
                });
            });
            renderPromise.catch(() => {});
            http.response.__viewPromise = renderPromise;
            return http.response;
        };

        return fn;
    }
}

export default View;