const kHttp = Symbol('http')
const kApp = Symbol('app')

class Helpers {
    constructor(app, http) {
        Object.defineProperty(this, kHttp, {
            value: http,
            enumerable: false,
            configurable: false,
            writable: false
        })
        Object.defineProperty(this, kApp, {
            value: app,
            enumerable: false,
            configurable: false,
            writable: false
        })

    }

    secure_asset($name) {
        let domain = this[kApp].config.get('app.asset_url') || ('https://' + this[kHttp].request.get('host'))
        return new URL(path.join(...arguments), domain).href
    }

    asset() {
        let domain = this[kApp].config.get('app.asset_url') || (this[kHttp].request.protocol() + '://' + this[kHttp].request.get('host'))
        return new URL(path.join(...arguments), domain).href
    }

    session(key) {
        return this[kHttp].request.session.get(key)
    }

    get auth() {
        return this[kHttp].request.auth
    }

    old(key, defaultValue) {
        return this[kHttp].request.old(key, defaultValue)
    }

    csrfToken() {
        return this[kHttp].csrfToken()
    }

    csrf_token() {
        return this.csrfToken()
    }

    get error() {
        return this[kHttp].request.error()
    }

    route() {
        return this[kApp]['router'].route(...arguments)
    }

    mix(path) {
        return this[kApp].mix.path(path)
    }

    absolutePath() {
        return this[kApp].config.get('app.url', '') + this[kHttp].request.path()
    }

}

module.exports = Helpers