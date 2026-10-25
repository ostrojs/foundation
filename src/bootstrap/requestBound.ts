import HttpRequest from '@ostro/http/request';
import CoreHttpRequest from '../http/request';
import http from 'node:http';
const ServerRequest: any = http.IncomingMessage;

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
        for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(HttpRequest.prototype))) {
            if (key !== 'constructor') {
                Object.defineProperty(ServerRequest.prototype, key, desc);
            }
        }
        for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(CoreHttpRequest.prototype))) {
            if (key !== 'constructor') {
                Object.defineProperty(ServerRequest.prototype, key, desc);
            }
        }
    }
}

export default RequestBound;