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
        Object.assign(ServerRequest.prototype, HttpRequest.prototype, CoreHttpRequest.prototype);
    }
}

export default RequestBound;