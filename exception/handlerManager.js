const {
    Macroable
} = require('@ostro/support/macro')
const kApp = Symbol('app')
const kHandlers = Symbol('handlers')
const kCustomHandlers = Symbol('customHandlers')
const kHandlerAdapter = Symbol('handlerAdapter')
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException')
class ExceptionManager extends Macroable {
    constructor(handler) {
        super()
        Object.defineProperties(this, {
            [kHandlerAdapter]: {
                value: handler,
                writable: true,
            },
            [kHandlers]: {
                value: Object.create(null),
                writable: true,
            },
            [kCustomHandlers]: {
                value: Object.create(null),
                writable: true,
            },
        })
    }

    handler(name = 'whoops') {
        name = (this.getConfig('app.debug') == false) ? 'production' : name

        return this[kHandlers][name] = this.get(name);
    }

    get(name) {
        return this[kHandlers][name] || this.resolve(name);
    }

    resolve(name) {
        let driverMethod = 'create' + (name.ucfirst()) + 'Handler';
        if ((this[kCustomHandlers][name])) {
            return this.callCustomHandler();
        } else if (this[driverMethod]) {
            return this[driverMethod]();
        } else {
            throw new Error(`Handler [{${name}}] do not supported.`);
        }
    }

    callCustomHandler(name) {
        var driver = this[kCustomHandlers][name]();
        return this.adapt($driver);
    }

    createWhoopsHandler($config) {
        return this.adapt(new(require('./handlers/whoops')));
    }

    createProductionHandler() {
        return this.adapt(new(require('./handlers/production')));
    }

    createJsonHandler() {
        return this.adapt(new(require('./handlers/json')));
    }

    adapt(handler) {
        if (typeof this[kHandlerAdapter] != 'function') {
            throw new InvalidArgumentException('Invalid handler class on exception')
        }
        return new this[kHandlerAdapter](handler)
    }

    getConfig(key) {
        return this.$app['config'][key]
    }

    setHandlerAdapter(handler) {
        this[kHandlerAdapter] = handler
    }

    extends($driver, $callback) {
        if (!config) {
            throw new InvalidArgumentException(`Config not found for  [{${$driver}}] driver.`);
        }
        this[kCustomCreators][$driver] = $callback.call(this, this);
        return this;
    }
    __call(target, method, args) {
        return target.handler()[method](...args)
    }
}
module.exports = ExceptionManager