const Repository = require('@ostro/config/repository')
const fs = require('fs')
const path = require('path')
class LoadConfiguration {
    constructor($app) {
        this.$app = $app
    }

    bootstrap($app) {
        let $items = [];
        let config = new Repository($items)
        $app.instance('config', config);
        this.loadConfigurationFiles($app, config);
        this.setTimezone(config['app']['timezone'])

    }

    loadConfigurationFiles($app, $repository) {
        let configPath = $app.configPath();
        let files = this.getConfigurationFiles(configPath);

        if (files.indexOf('app') < 0) {
            throw new Exception('Unable to load the "app" configuration file.');
        }

        for (let key of files) {
            $repository.set(key, require(path.normalize(path.join(configPath, key))));
        }
    }

    getConfigurationFiles(configPath) {
        let files = [];

        let configFiles = fs.readdirSync(configPath)
        for (let dir of configFiles) {
            let fileName = dir.substr(0, dir.indexOf('.'))
            if (configFiles[fileName]) {
                if (typeof configFiles[fileName] == 'object') {
                    files.push(configFiles[fileName])
                }
            } else {
                files.push(fileName)
            }
        }

        return files;
    }

    setTimezone(tz) {
        process.env.TZ = tz
    }

}
module.exports = LoadConfiguration