import Env from 'dotenv';
import path from 'path';

/**
 * Class LoadEnvironmentVariables.
 */
class LoadEnvironmentVariables {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        Env.config({
            path: path.normalize(path.join($app.environmentPath(), $app.environmentFile()))
        });
    }
}

export default LoadEnvironmentVariables;