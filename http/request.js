const kErrors = Symbol('errors')
const ErrorBag = require('@ostro/support/errorBag')
const ObjectGet = require('lodash.get')
const Request = require('@ostro/http/request')
class HttpRequest extends Request {
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

    flash() {
        return this.session.flash(...arguments)
    }

    flashOnly() {
        return this.session.flashOnly(...arguments)
    }

    flashExcept() {
        return this.session.flashExcept(...arguments)
    }

    routeIs(route) {
        let currentRoute = app('router').currentRoute(this)
        if (!currentRoute) {
            return false
        } else if (!currentRoute.$name) {
            return false
        } else if (currentRoute.$name == route) {
            return true
        } else {
            return Boolean(currentRoute.$name.match(new RegExp(route)))

        }
    }
}

module.exports = HttpRequest