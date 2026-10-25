import Repository from '@ostro/config/repository';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Class LoadConfiguration.
 */
class LoadConfiguration {
    public $app: any;

    /**
     * Create a new instance.
     * @param $app - Application instance
     */
    constructor($app: any) {
        this.$app = $app;
    }

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        const $items: any = {};
        const config = new Repository($items);
        $app.instance('config', config);
        this.loadConfigurationFiles($app, config);
        this.setTimezone(config['app']['timezone']);
    }

    /**
     * loadConfigurationFiles method.
     * @param $app - Application instance
     * @param $repository - Config repository instance
     */
    public loadConfigurationFiles($app: any, $repository: any): void {
        const configPath: string = $app.configPath();
        const files: string[] = this.getConfigurationFiles(configPath);

        if (files.indexOf('app') < 0) {
            throw new Error('Unable to load the "app" configuration file.');
        }

        for (const key of files) {
            const conf: any = require(path.normalize(path.join(configPath, key)));
            $repository.set(key, (conf && conf.__esModule && conf.default) ? conf.default : conf);
        }
    }

    /**
     * getConfigurationFiles method.
     * @param configPath - Configuration path
     * @returns Array of configuration file names
     */
    public getConfigurationFiles(configPath: string): string[] {
        const files: string[] = [];

        const configFiles = fs.readdirSync(configPath);
        for (const dir of configFiles) {
            const fileName = dir.substring(0, dir.indexOf('.') !== -1 ? dir.indexOf('.') : dir.length);
            if ((configFiles as any)[fileName]) {
                if (typeof (configFiles as any)[fileName] === 'object') {
                    files.push((configFiles as any)[fileName]);
                }
            } else if (fileName) {
                files.push(fileName);
            }
        }

        return files;
    }

    /**
     * setTimezone method.
     * @param tz - Timezone string
     */
    public setTimezone(tz: string): void {
        process.env.TZ = tz;
    }
}

export default LoadConfiguration;