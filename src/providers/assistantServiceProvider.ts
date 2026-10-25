import ServiceProvider from '@ostro/support/serviceProvider';
import DatabaseQueryCommand from '@ostro/database/console/databaseQuery';
import SeederMakeCommand from '@ostro/database/console/seeds/seederMakeCommand';
import SeedCommand from '@ostro/database/console/seeds/seedCommand';
import CacheClearCommand from '@ostro/cache/console/clearCommand';
import CacheForgetCommand from '@ostro/cache/console/forgetCommand';
import CacheTableCommand from '@ostro/cache/console/cacheTableCommand';
import ConsoleMakeCommand from '../console/consoleMakeCommand';
import ControllerMakeCommand from '@ostro/router/console/controllerMakeCommand';
import FactoryMakeCommand from '@ostro/database/console/factories/factoryMakeCommand';
import KeyGenerateCommand from '../console/keyGenerateCommand';
import MiddlewareMakeCommand from '@ostro/router/console/middlewareMakeCommand';
import ModelMakeCommand from '../console/modelMakeCommand';
import ResourceMakeCommand from '../console/resourceMakeCommand';
import SessionTableCommand from '@ostro/session/console/sessionTableCommand';
import StorageLinkCommand from '../console/storageLinkCommand';
import ServerlessBootstrapCommand from '../console/serverlessBootstrapCommand';
import ServerBootstrapCommand from '../console/serverBootstrapCommand';
import WipeCommand from '@ostro/database/console/wipeCommand';

/**
 * Class AssistantServiceProvider.
 */
class AssistantServiceProvider extends ServiceProvider {
    [key: string]: any;
    public $commands: Record<string, string> = {
        'DbQuery': 'command.db.query',
        'KeyGenerate': 'command.key.generate',
        'Seed': 'command.seed',
        'StorageLink': 'command.storage.link',
        'CacheClear': 'command.cache.clear',
        'CacheForget': 'command.cache.forget',
        'DbWipe': 'command.db.wipe',
    };

    public $devCommands: Record<string, string> = {
        'CacheTable': 'command.cache.table',
        'ConsoleMake': 'command.console.make',
        'ControllerMake': 'command.controller.make',
        'FactoryMake': 'command.factory.make',
        'MiddlewareMake': 'command.middleware.make',
        'ModelMake': 'command.model.make',
        'ResourceMake': 'command.resource.make',
        'SeederMake': 'command.seeder.make',
        'SessionTable': 'command.session.table',
        'ServerlessBootstrap': 'command.serverless.bootstrap',
        'ServerBootstrap': 'command.server.bootstrap',
    };

    /**
     * register method.
     */
    public override register(): void {
        this.registerCommands(Object.assign(
            this.$commands, this.$devCommands
        ));
    }

    /**
     * registerCommands method.
     * @param $commands - Map of command names to binding names
     */
    public registerCommands($commands: Record<string, any> = {}): void {
        for (const $command of Object.keys($commands)) {
            const methodName = `register${$command}Command`;
            if (typeof this[methodName] !== 'function') {
                throw new Error(`register${$command}Command not available.`);
            }
            this[methodName]();
        }

        this.commands(Object.values($commands));
    }

    /**
     * registerDbQueryCommand method.
     */
    public registerDbQueryCommand(): void {
        this.$app.singleton('command.db.query', function ($app: any) {
            return new DatabaseQueryCommand($app['db']);
        });
    }

    /**
     * registerSeederMakeCommand method.
     */
    public registerSeederMakeCommand(): void {
        this.$app.singleton('command.seeder.make', function ($app: any) {
            return new SeederMakeCommand($app['files']);
        });
    }

    /**
     * registerSeedCommand method.
     */
    public registerSeedCommand(): void {
        this.$app.singleton('command.seed', function ($app: any) {
            return new SeedCommand($app['db']);
        });
    }

    /**
     * registerCacheClearCommand method.
     */
    public registerCacheClearCommand(): void {
        this.$app.singleton('command.cache.clear', function ($app: any) {
            return new CacheClearCommand($app['cache'], $app['files']);
        });
    }

    /**
     * registerCacheForgetCommand method.
     */
    public registerCacheForgetCommand(): void {
        this.$app.singleton('command.cache.forget', function ($app: any) {
            return new CacheForgetCommand($app['cache']);
        });
    }

    /**
     * registerCacheTableCommand method.
     */
    public registerCacheTableCommand(): void {
        this.$app.singleton('command.cache.table', function ($app: any) {
            return new CacheTableCommand($app['files']);
        });
    }

    /**
     * registerConsoleMakeCommand method.
     */
    public registerConsoleMakeCommand(): void {
        this.$app.singleton('command.console.make', function ($app: any) {
            return new ConsoleMakeCommand($app['files']);
        });
    }

    /**
     * registerControllerMakeCommand method.
     */
    public registerControllerMakeCommand(): void {
        this.$app.singleton('command.controller.make', function ($app: any) {
            return new ControllerMakeCommand($app['files']);
        });
    }

    /**
     * registerFactoryMakeCommand method.
     */
    public registerFactoryMakeCommand(): void {
        this.$app.singleton('command.factory.make', function ($app: any) {
            return new FactoryMakeCommand($app['files']);
        });
    }

    /**
     * registerKeyGenerateCommand method.
     */
    public registerKeyGenerateCommand(): void {
        this.$app.singleton('command.key.generate', function ($app: any) {
            return new KeyGenerateCommand($app['files']);
        });
    }

    /**
     * registerMiddlewareMakeCommand method.
     */
    public registerMiddlewareMakeCommand(): void {
        this.$app.singleton('command.middleware.make', function ($app: any) {
            return new MiddlewareMakeCommand($app['files']);
        });
    }

    /**
     * registerModelMakeCommand method.
     */
    public registerModelMakeCommand(): void {
        this.$app.singleton('command.model.make', function ($app: any) {
            return new ModelMakeCommand($app['files']);
        });
    }

    /**
     * registerResourceMakeCommand method.
     */
    public registerResourceMakeCommand(): void {
        this.$app.singleton('command.resource.make', function ($app: any) {
            return new ResourceMakeCommand($app['files']);
        });
    }

    /**
     * registerSessionTableCommand method.
     */
    public registerSessionTableCommand(): void {
        this.$app.singleton('command.session.table', function ($app: any) {
            return new SessionTableCommand($app['files']);
        });
    }

    /**
     * registerStorageLinkCommand method.
     */
    public registerStorageLinkCommand(): void {
        this.$app.singleton('command.storage.link', function ($app: any) {
            return new StorageLinkCommand($app['files']);
        });
    }

    /**
     * registerServerlessBootstrapCommand method.
     */
    public registerServerlessBootstrapCommand(): void {
        this.$app.singleton('command.serverless.bootstrap', function ($app: any) {
            return new ServerlessBootstrapCommand($app['files']);
        });
    }

    /**
     * registerServerBootstrapCommand method.
     */
    public registerServerBootstrapCommand(): void {
        this.$app.singleton('command.server.bootstrap', function ($app: any) {
            return new ServerBootstrapCommand($app['files']);
        });
    }

    /**
     * registerDbWipeCommand method.
     */
    public registerDbWipeCommand(): void {
        this.$app.singleton('command.db.wipe', function () {
            return new WipeCommand();
        });
    }

    /**
     * provides method.
     * @returns Array of command bindings provided
     */
    public override provides(): string[] {
        return Object.values(this.$commands);
    }

}

export default AssistantServiceProvider;