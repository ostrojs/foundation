class ValidatesRequests {

    validate($request, $rules, $messages = [], $customAttributes = []) {
        return this.getValidationFactory().validate(
            $request.all(), $rules, $messages, $customAttributes
        )
    }

    validateWithBag($errorBag, $request, $rules,
        $messages = [], $customAttributes = []) {
        return this.validate($request, $rules, $messages, $customAttributes).catch($e => {
            $e.errorBag = $errorBag;
            Promise.reject($e)
        })

    }

    getValidationFactory() {
        return app('validation');
    }
}

module.exports = ValidatesRequests