import Facade from '@ostro/support/facades/facade';
import AliasLoader from '../aliasLoader';

/**
 * Class RegisterFacades.
 */
class RegisterFacades {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        Facade.setFacadeApplication($app);
        const aliasLoader = new AliasLoader($app.make('config').get('app.aliases', []));
        aliasLoader.registerGlobal();
    }
}

export default RegisterFacades;