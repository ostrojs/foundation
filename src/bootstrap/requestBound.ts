import HttpRequest from '@ostro/http/request';
import CoreHttpRequest from '../http/request';
const ServerRequest: any = require("@ostro/server/request");

/**
 * Class RequestBound.
 */
class RequestBound {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        ServerRequest.prototype['app'] = $app;
        for (const a of Object.getOwnPropertyNames(HttpRequest.prototype)) {
            ServerRequest.prototype[a] = (HttpRequest.prototype as any)[a];
        }
        for (const a of Object.getOwnPropertyNames(CoreHttpRequest.prototype)) {
            ServerRequest.prototype[a] = (CoreHttpRequest.prototype as any)[a];
        }
    }
}

export default RequestBound;