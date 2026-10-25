import { Macroable } from '@ostro/support/macro';
import { ucfirst } from '@ostro/support/string';
import InvalidArgumentException from '@ostro/support/exceptions/invalidArgumentException';
import WhoopsHandler from './handlers/whoops';
import ProductionHandler from './handlers/production';
import JsonHandler from './handlers/json';

/**
 * Class ExceptionManager.
 */
class ExceptionManager extends Macroable {
    public declare $app: any;
    #handlerAdapter: any;
    #handlers: Record<string, any> = Object.create(null);
    #customHandlers: Record<string, any> = Object.create(null);

    /**
     * Create a new instance.
     * @param handler - Handler adapter constructor
     */
    constructor(handler: Function) {
        super();
        this.#handlerAdapter = handler;
    }

    /**
     * handler method.
     * @param name - Handler name
     * @returns Resolved handler
     */
    public handler(name: string = 'whoops'): any {
        name = (this.getConfig('app.debug') === false) ? 'production' : name;

        return this.#handlers[name] = this.get(name);
    }

    /**
     * get method.
     * @param name - Handler name
     * @returns Handler instance
     */
    public get(name: string): any {
        return this.#handlers[name] || this.resolve(name);
    }

    /**
     * resolve method.
     * @param name - Handler name
     * @returns Resolved handler
     */
    public resolve(name: string): any {
        const driverMethod = 'create' + ucfirst(name) + 'Handler';
        if (this.#customHandlers[name]) {
            return this.callCustomHandler(name);
        } else if (typeof (ExceptionManager.prototype as Record<string, unknown>)[driverMethod] === 'function') {
            return ((this as Record<string, () => unknown>)[driverMethod])();
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
        const driver = this.#customHandlers[name]();
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
        if (typeof this.#handlerAdapter !== 'function') {
            throw new InvalidArgumentException('Invalid handler class on exception');
        }
        return new this.#handlerAdapter(handler);
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
        this.#handlerAdapter = handler;
    }

    /**
     * extend method.
     * @param $driver - Driver name
     * @param $callback - Creator callback
     * @returns this
     */
    public extend($driver: string, $callback: Function): this {
        this.#customHandlers[$driver] = $callback.bind(this, this);
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