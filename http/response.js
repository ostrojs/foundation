const Response = require('@ostro/http/response')
const Model = require('@ostro/contracts/database/eloquent/model')
const Collection = require('@ostro/contracts/collection/collect')
const GenericUser = require('@ostro/contracts/auth/genericUser')
class HttpResponse extends Response {
    send(body, status = 200) {
        if (body instanceof Model) {
            body = body.serialize()
        } else if (body instanceof Collection) {
            body = body.toArray()
        } else if (body instanceof Collection) {
            body = body.toJSON()
        }
        super.send(body, status)
    }

    with(key, value) {
        let obj = typeof key == 'string' ? {
            [key]: value
        } : key;
        obj = obj || {}
        this.request.session.flash(obj)
        return this;
    }

    withInput(key, value) {
        key = typeof key == 'string' ? { key: value } : key;
        if (key) {
            key = key === true ? this.request.except('_token') : key
            this.request.session.flash('__inputs', key)
        }
        return this;
    }

    withErrors(errors = {}) {
        this.request.session.flash('__errors', errors)
        return this
    }

}
module.exports = HttpResponse
