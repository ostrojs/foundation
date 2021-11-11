const HttpResponse = require('@ostro/http/response')
const CoreHttpResponse = require('@ostro/foundation/http/response')
const ServerResponse = require('@ostro/server/response')

class ResponseBound {

    bootstrap($app) {

        ServerResponse.prototype['app'] = $app

        for (var a of Object.getOwnPropertyNames(HttpResponse.prototype)) {
            ServerResponse.prototype[a] = HttpResponse.prototype[a];
        }
        for (var a of Object.getOwnPropertyNames(CoreHttpResponse.prototype)) {
            ServerResponse.prototype[a] = CoreHttpResponse.prototype[a];
        }
    }
}

module.exports = ResponseBound