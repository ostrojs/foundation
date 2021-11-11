const View = require('../viewEngine')
class BindView {

    handle(http, next) {
        http.response.view = new View(this.$app, http, next)
        next()

    }
}
module.exports = BindView