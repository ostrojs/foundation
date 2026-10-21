/**
 * Class RegisterProviders.
 */
class RegisterProviders {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        $app.registerConfiguredProviders();
    }
}

export default RegisterProviders;