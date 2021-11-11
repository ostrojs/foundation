class RegisterProviders {

    bootstrap($app) {
        $app.registerConfiguredProviders();
    }
}

module.exports = RegisterProviders