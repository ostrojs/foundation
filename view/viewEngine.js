const ViewException = require('./viewException')

const ViewHelpers = require('./helpers')
const { ProxyHandler } = require('@ostro/support/macro')
class View {
    constructor(app, http, next) {
        let context = {};
        Object.assign(context, (app['locals'] || {}));
        Object.assign(context, global)
        context.request = http.request;
        context.session = http.session;
        context.helpers = new ViewHelpers(app, http);
        const fn = function(file, data = {}, status = 200) {

            fn.render(...arguments)
            return http.response
        }
        fn.engine = function(engine) {
            Object.defineProperty(http.response, '__viewEngine', {
                value: engine,
                configurable: false,
                writable: false,
                enumerable: false
            })
            return this

        }

        fn.render = function(file, data = {}, status = 200) {
            Object.assign(data, context)

            app.view.engine(http.response.__viewEngine).renderFile(file, data, async (data) => {
                data = await data
                if (typeof data == 'object' && data instanceof Promise == false) {
                    return next(new ViewException(data))
                }
                try {
                    http.response.send(data, status)
                } catch (e) {
                    next(e)
                }

            })
            return http.response

        }
        return fn
    }
}

module.exports = View