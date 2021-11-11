const HttpRequest = require('@ostro/http/request')
const CoreHttpRequest = require('../http/request')
const ServerRequest = require('@ostro/server/request')

class RequestBound {

    bootstrap($app) {
        ServerRequest.prototype['app'] = $app
        for (let a of Object.getOwnPropertyNames(HttpRequest.prototype)) {
            ServerRequest.prototype[a] = HttpRequest.prototype[a];
        }
        for (let a of Object.getOwnPropertyNames(CoreHttpRequest.prototype)) {
            ServerRequest.prototype[a] = CoreHttpRequest.prototype[a];
        }

    }
}

module.exports = RequestBound