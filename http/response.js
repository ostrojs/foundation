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

    with(obj = {}) {
        this.req.session.flash(obj)
        return this;
    }

    withInput(data = true) {
        if (data) {
            this.req.session.flash('__inputs', this.req.except('_token'))
        }
        return this;
    }

    withErrors(errors = {}) {
        this.req.session.flash('__errors', errors)
        return this
    }

}
module.exports = HttpResponse