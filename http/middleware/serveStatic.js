const serveStatic = require('serve-static');
class ServeStatic {
    constructor() {
        this.$publicPath = $app['path.public']
    }
    get $defaultOptions() {
        return {
            'maxAge': '180d'
        }
    }

    get $options(){
    	return {}
    }

    handle({ request, response }, next) {
        serveStatic(this.$publicPath, { ...this.$defaultOptions, ...this.$options })(request, response, next)
    }
}

module.exports = ServeStatic