const kErrors = Symbol('errors')
const ErrorBag = require('@ostro/support/errorBag')
const ObjectGet = require('lodash.get')
const Request = require('@ostro/http/request')
class HttpRequest extends Request{
    old(key, defaultValue = null) {
        return ObjectGet(this.session.get('__inputs'), key, defaultValue);
    }

    error(key, defaultValue = null) {
        this[kErrors] = this[kErrors] || new ErrorBag((this.session ? this.session.get('__errors') : {}))
        if (key) {
            return this[kErrors].first('key')
        }
        return this[kErrors]
    }

    csrfToken() {
        return this.session.token() || ''
    }
}

module.exports = HttpRequest