const Env = require('dotenv')
const path = require('path')
class LoadEnvironmentVariables {

    bootstrap($app) {

        Env.config({
            path: path.normalize(path.join($app.environmentPath(), $app.environmentFile()))
        })

    }

}
module.exports = LoadEnvironmentVariables