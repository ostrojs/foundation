const ServiceProvider = require('@ostro/support/serviceProvider');

class AssistantServiceProvider extends ServiceProvider {
    $commands = {
        'DbQuery': 'command.db.query',
        'KeyGenerate': 'command.key.generate',
        'Seed': 'command.seed',
        'StorageLink': 'command.storage.link',
        'CacheClear': 'command.cache.clear',
        'CacheForget': 'command.cache.forget',
        'DbWipe': 'command.db.wipe',
    };

    $devCommands = {
        'CacheTable': 'command.cache.table',
        'ConsoleMake': 'command.console.make',
        'ControllerMake': 'command.controller.make',
        'FactoryMake': 'command.factory.make',
        'MiddlewareMake': 'command.middleware.make',
        'ModelMake': 'command.model.make',
        'ResourceMake': 'command.resource.make',
        'SeederMake': 'command.seeder.make',
        'SessionTable': 'command.session.table',
    };

    register() {
        this.registerCommands(Object.assign(
            this.$commands, this.$devCommands
        ));
    }

    registerCommands($commands = {}) {
        for (let $command of Object.keys($commands)) {
            if (typeof this[`register${$command}Command`] != 'function') {
                throw new Error(`register${$command}Command not available.`)
            }
            this[`register${$command}Command`]();
        }

        this.commands(Object.values($commands));
    }

    registerDbQueryCommand() {
        this.$app.singleton('command.db.query', function($app) {
            let $table = $app['config']['database.table'];
            return new(require('@ostro/database/console/databaseQuery'))($app['db'], $table);
        });
    }

    registerSeederMakeCommand() {
        this.$app.singleton('command.seeder.make', function($app) {
            return new(require('@ostro/database/console/seeds/seederMakeCommand'))($app['files']);
        });
    }

    registerSeedCommand() {
        this.$app.singleton('command.seed', function($app) {
            return new(require('@ostro/database/console/seeds/seedCommand'))($app['db']);
        });
    }

    registerCacheClearCommand() {
        this.$app.singleton('command.cache.clear', function($app) {
            return new(require('@ostro/cache/console/clearCommand'))($app['cache'], $app['files']);
        });
    }

    registerCacheForgetCommand() {
        this.$app.singleton('command.cache.forget', function($app) {
            return new(require('@ostro/cache/console/forgetCommand'))($app['cache']);
        });
    }

    registerCacheTableCommand() {
        this.$app.singleton('command.cache.table', function($app) {
            return new(require('@ostro/cache/console/cacheTableCommand'))($app['files']);
        });
    }

    registerConsoleMakeCommand() {
        this.$app.singleton('command.console.make', function($app) {
            return new(require('@ostro/foundation/console/consoleMakeCommand'))($app['files']);
        });
    }

    registerControllerMakeCommand() {
        this.$app.singleton('command.controller.make', function($app) {
            return new(require('@ostro/router/console/controllerMakeCommand'))($app['files']);
        });
    }

    registerFactoryMakeCommand() {
        this.$app.singleton('command.factory.make', function($app) {
            return new(require('@ostro/database/console/factories/factoryMakeCommand'))($app['files']);
        });
    }

    registerKeyGenerateCommand() {
        this.$app.singleton('command.key.generate', function($app) {
            return new(require('@ostro/foundation/console/keyGenerateCommand'))($app['files']);
        });
    }

    registerMiddlewareMakeCommand() {
        this.$app.singleton('command.middleware.make', function($app) {
            return new(require('@ostro/router/console/middlewareMakeCommand'))($app['files']);
        });
    }

    registerModelMakeCommand() {
        this.$app.singleton('command.model.make', function($app) {
            return new(require('@ostro/foundation/console/modelMakeCommand'))($app['files']);
        });
    }

    registerResourceMakeCommand() {
        this.$app.singleton('command.resource.make', function($app) {
            return new(require('@ostro/foundation/console/resourceMakeCommand'))($app['files']);
        });
    }

    registerSessionTableCommand() {
        this.$app.singleton('command.session.table', function($app) {
            return new(require('@ostro/session/console/sessionTableCommand'))($app['files']);
        });
    }

    registerStorageLinkCommand() {
        this.$app.singleton('command.storage.link', function($app) {
            return new(require('@ostro/foundation/console/storageLinkCommand'))($app['files']);
        });
    }

    registerDbWipeCommand() {
        this.$app.singleton('command.db.wipe', function() {
            return new(require('@ostro/database/console/wipeCommand'));
        });
    }

    provides() {
        return Object.values(this.$commands);
    }

}

module.exports = AssistantServiceProvider