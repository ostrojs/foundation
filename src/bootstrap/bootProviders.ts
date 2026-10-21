/**
 * Class BootProviders.
 */
class BootProviders {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        $app.boot();
    }
}

export default BootProviders;