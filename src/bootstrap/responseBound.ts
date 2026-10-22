import HttpResponse from '@ostro/http/response';
import CoreHttpResponse from '../http/response';
import http from 'http';
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

        for (const a of Object.getOwnPropertyNames(HttpResponse.prototype)) {
            ServerResponse.prototype[a] = (HttpResponse.prototype as any)[a];
        }
        for (const a of Object.getOwnPropertyNames(CoreHttpResponse.prototype)) {
            ServerResponse.prototype[a] = (CoreHttpResponse.prototype as any)[a];
        }
    }
}

export default ResponseBound;