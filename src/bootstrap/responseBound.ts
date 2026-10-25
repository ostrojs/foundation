import HttpResponse from '@ostro/http/response';
import CoreHttpResponse from '../http/response';
import http from 'node:http';
const ServerResponse: any = http.ServerResponse;

/**
 * Class ResponseBound.
 */
class ResponseBound {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        ServerResponse.prototype['app'] = $app;

        Object.assign(ServerResponse.prototype, HttpResponse.prototype, CoreHttpResponse.prototype);
    }
}

export default ResponseBound;