const AggregateServiceProvider = require('@ostro/support/aggregateServiceProvider')
const Http = require('@ostro/http/httpContext')
const Request = require('@ostro/http/request')
const FileRequest = require('@ostro/http/file')

class FoundationServiceProvider extends AggregateServiceProvider {

    register() {
        super.register();

        this.registerRequestValidation();
    }

    boot() {
        super.boot()
        this.requestFilesystem()
    }

    registerRequestValidation() {
        let $app = this.$app

        Request.macro('validate', function($rules = {}, $message = {}) {
            return $app['validation'].validate(this.all(), $rules, $message)
        })
    }

    requestFilesystem() {
        this.$app.whenHas('filesystem', function(filesystem) {
            filesystem.registerToRequest(FileRequest)
        })
    }

}

module.exports = FoundationServiceProvider