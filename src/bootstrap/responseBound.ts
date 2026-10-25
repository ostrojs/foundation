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

        for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(HttpResponse.prototype))) {
            if (key !== 'constructor') {
                Object.defineProperty(ServerResponse.prototype, key, desc);
            }
        }
        for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(CoreHttpResponse.prototype))) {
            if (key !== 'constructor') {
                Object.defineProperty(ServerResponse.prototype, key, desc);
            }
        }
    }
}

export default ResponseBound;