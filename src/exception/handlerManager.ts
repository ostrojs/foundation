import { Macroable } from '@ostro/support/macro';
import { ucfirst } from '@ostro/support/string';
import InvalidArgumentException from '@ostro/support/exceptions/invalidArgumentException';
import WhoopsHandler from './handlers/whoops';
import ProductionHandler from './handlers/production';
import JsonHandler from './handlers/json';

const kApp: unique symbol = Symbol('app');
const kHandlers: unique symbol = Symbol('handlers');
const kCustomHandlers: unique symbol = Symbol('customHandlers');
const kHandlerAdapter: unique symbol = Symbol('handlerAdapter');

/**
 * Class ExceptionManager.
 */
class ExceptionManager extends Macroable {
    public declare $app: any;
    public [kHandlerAdapter]: any;
    public [kHandlers]: Record<string, any>;
    public [kCustomHandlers]: Record<string, any>;

    /**
     * Create a new instance.
     * @param handler - Handler adapter constructor
     */
    constructor(handler: Function) {
        super();
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
        });
    }

    /**
     * handler method.
     * @param name - Handler name
     * @returns Resolved handler
     */
    public handler(name: string = 'whoops'): any {
        name = (this.getConfig('app.debug') === false) ? 'production' : name;

        return this[kHandlers][name] = this.get(name);
    }

    /**
     * get method.
     * @param name - Handler name
     * @returns Handler instance
     */
    public get(name: string): any {
        return this[kHandlers][name] || this.resolve(name);
    }

    /**
     * resolve method.
     * @param name - Handler name
     * @returns Resolved handler
     */
    public resolve(name: string): any {
        const driverMethod = 'create' + ucfirst(name) + 'Handler';
        if (this[kCustomHandlers][name]) {
            return this.callCustomHandler(name);
        } else if (typeof (ExceptionManager.prototype as any)[driverMethod] === 'function') {
            return (this as any)[driverMethod]();
        } else {
            throw new Error(`Handler [{${name}}] do not supported.`);
        }
    }

    /**
     * callCustomHandler method.
     * @param name - Custom handler name
     * @returns Adapted handler
     */
    public callCustomHandler(name: string): any {
        const driver = this[kCustomHandlers][name]();
        return this.adapt(driver);
    }

    /**
     * createWhoopsHandler method.
     * @param $config - Config options
     * @returns Whoops handler adapter
     */
    public createWhoopsHandler($config?: Record<string, any>): any {
        return this.adapt(new WhoopsHandler());
    }

    /**
     * createProductionHandler method.
     * @returns Production handler adapter
     */
    public createProductionHandler(): any {
        return this.adapt(new ProductionHandler());
    }

    /**
     * createJsonHandler method.
     * @returns Json handler adapter
     */
    public createJsonHandler(): any {
        return this.adapt(new JsonHandler());
    }

    /**
     * adapt method.
     * @param handler - Handler driver instance
     * @returns Adapted handler
     */
    public adapt(handler: any): any {
        if (typeof this[kHandlerAdapter] !== 'function') {
            throw new InvalidArgumentException('Invalid handler class on exception');
        }
        return new this[kHandlerAdapter](handler);
    }

    /**
     * getConfig method.
     * @param key - Config key
     * @returns Config value
     */
    public getConfig(key: string): any {
        return this.$app['config'][key];
    }

    /**
     * setHandlerAdapter method.
     * @param handler - Handler adapter constructor
     */
    public setHandlerAdapter(handler: Function): void {
        this[kHandlerAdapter] = handler;
    }

    /**
     * extend method.
     * @param $driver - Driver name
     * @param $callback - Creator callback
     * @returns this
     */
    public extend($driver: string, $callback: Function): this {
        this[kCustomHandlers][$driver] = $callback.bind(this, this);
        return this;
    }

    /**
     * extends method.
     * @param $driver - Driver name
     * @param $callback - Creator callback
     * @returns this
     */
    public extends($driver: string, $callback: Function): this {
        return this.extend($driver, $callback);
    }

    /**
     * __call method.
     * @param target - Target object
     * @param method - Method name
     * @param args - Arguments array
     * @returns Delegated call result
     */
    public __call(target: Record<string, any>, method: string, args: any[]): any {
        return target.handler()[method](...args);
    }
}

export default ExceptionManager;