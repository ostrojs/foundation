const Facade = require('@ostro/support/facades/facade')
const AliasLoader = require('@ostro/foundation/aliasLoader')
class RegisterFacades {

    bootstrap($app) {
        Facade.setFacadeApplication($app);
        let aliasLoader = new AliasLoader($app.make('config').get('app.aliases', []))
        aliasLoader.registerGlobal()
    }
}
module.exports = RegisterFacades