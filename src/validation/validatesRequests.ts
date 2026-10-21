declare var app: any;
// Framework global: app

/**
 * Class ValidatesRequests.
 */
class ValidatesRequests {

    /**
     * validate method.
     * @param $request - Request instance
     * @param $rules - Validation rules
     * @param $messages - Custom error messages
     * @param $customAttributes - Custom attribute names
     * @returns Validated data promise
     */
    public validate($request: any, $rules: any, $messages: any[] = [], $customAttributes: any[] = []): Promise<any> {
        return this.getValidationFactory().validate(
            $request.all(), $rules, $messages, $customAttributes
        );
    }

    /**
     * validateWithBag method.
     * @param $errorBag - Error bag name
     * @param $request - Request instance
     * @param $rules - Validation rules
     * @param $messages - Custom error messages
     * @param $customAttributes - Custom attribute names
     * @returns Validated data promise
     */
    public validateWithBag($errorBag: string, $request: any, $rules: any, $messages: any[] = [], $customAttributes: any[] = []): Promise<any> {
        return this.validate($request, $rules, $messages, $customAttributes).catch(($e: any) => {
            $e.errorBag = $errorBag;
            return Promise.reject($e);
        });
    }

    /**
     * getValidationFactory method.
     * @returns Validation factory instance
     */
    public getValidationFactory(): any {
        return app('validation');
    }
}

export default ValidatesRequests;