import Facade from '@ostro/support/facades/facade';
import AliasLoader from '../aliasLoader';
import type { IConfig } from '@ostro/contracts/config/repository';

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
        const configRepo = $app.make('config') as IConfig;
        const aliasLoader = new AliasLoader(configRepo.get('app.aliases', []));
        aliasLoader.registerGlobal();
    }
}

export default RegisterFacades;