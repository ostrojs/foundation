const fs = require('fs')
class Production {

    register() {

    }
    render(request, response, $exception = {}) {
        if (request.wantJson() || request.ajax()) {
            response.send({
                name: $exception.name || 'HttpException',
                errors: $exception.errors || {},
                message: $exception.message || 'Whoops look like somthing wrong'
            }, ($exception.statusCode || 500))
        } else {
            return fs.readFile(path.join(__dirname, '../template/errors/500'), { encoding: 'utf8' }, function(error, data) {
                response.send(data, 500)
            })
        }
    }
}
module.exports = Production