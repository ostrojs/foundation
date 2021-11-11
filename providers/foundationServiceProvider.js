const AggregateServiceProvider = require('@ostro/support/aggregateServiceProvider')
const Http = require('@ostro/http/httpContext')
const Request = require('@ostro/http/request')
class FoundationServiceProvider extends AggregateServiceProvider {

    register() {
        super.register();

        this.registerRequestValidation();
    }

    registerRequestValidation() {
        let $app = this.$app


        Request.macro('validate', function($rules = {}, $message = {}) {
            return $app['validation'].validate(this.all(), $rules, $message)
        })
    }

}

module.exports = FoundationServiceProvider