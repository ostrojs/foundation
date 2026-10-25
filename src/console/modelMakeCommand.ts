import path from 'node:path';
import GeneratorCommand from '@ostro/console/generatorCommand';
import { plural, camelCase, snakeCase } from '@ostro/support/string';

// Framework global registered by OstroJS at boot time
declare function app_path(path?: string): string;

/**
 * Class ModelMakeCommand.
 */
class ModelMakeCommand extends GeneratorCommand {
    [key: string]: any;

    public declare $app: any;
    public declare $file: any;

    public get $signature(): string {
        return 'make:model';
    }

    public get $description(): string {
        return 'Create a new Eloquent model class';
    }

    public get $options(): any[] {
        return [
        this.createOption('-a, --all', 'Generate a migration, seeder, factory, and resource controller for the model'),
        this.createOption('-c, --controller', 'Create a new controller for the model'),
        this.createOption('-f, --factory', 'Create a new factory for the model'),
        this.createOption('--force', 'Create the class even if the model already exists'),
        this.createOption('-m, --migration', 'Create a new migration file for the model'),
        this.createOption('-s, --seed', 'Create a new seeder file for the model'),
        this.createOption('-p, --pivot', 'Indicates if the generated model should be a custom intermediate table model'),
        this.createOption('-r, --resource', 'Indicates if the generated controller should be a resource controller'),
        this.createOption('--api', 'Indicates if the generated controller should be an API controller'),
    ];
    }

    public $type: string = 'Model';

    public override get $dirname(): string {
        return __dirname;
    }

    /**
     * handle method.
     * @returns Promise resolving to boolean or void
     */
    public async handle(): Promise<any> {

        if (await super.handle() === false && !this.option('force')) {
            return false;
        }

        if (this.option('all')) {
            this.input.setOption('factory', true);
            this.input.setOption('seed', true);
            this.input.setOption('migration', true);
            this.input.setOption('controller', true);
            this.input.setOption('resource', true);
        }

        if (this.option('factory')) {
            await this.createFactory();
        }

        if (this.option('migration')) {
            await this.createMigration();
        }

        if (this.option('seed')) {
            await this.createSeeder();
        }

        if (this.option('controller') || this.option('resource') || this.option('api')) {
            await this.createController();
        }
    }

    /**
     * createFactory method.
     * @returns Command execution result
     */
    public createFactory(): any {
        let factory: string = this.argument('name');
        return this.callCommand('make:factory', {
            'name': `${factory}Factory`,
            '--model': this.qualifyClass(this.getNameInput()),
        });
    }

    /**
     * createMigration method.
     * @returns Command execution result
     */
    public createMigration(): any {
        let table: any = snakeCase(camelCase(plural(this.getFileName(this.argument('name')))));

        return this.callCommand('make:migration', {
            'name': `create_${table}_table`,
            '--create': table,
            '--relativepath': this.getNamespace(this.argument('name')),
        });
    }

    /**
     * createSeeder method.
     * @returns Command execution result
     */
    public createSeeder(): any {
        let seeder: string = this.argument('name');

        return this.callCommand('make:seeder', {
            'name': `${seeder}Seeder`,
        });
    }

    /**
     * createController method.
     * @returns Command execution result
     */
    public createController(): any {
        let controller: string = this.argument('name');

        let modelName: string = this.qualifyClass(this.getNameInput());

        return this.callCommand('make:controller', Object.filter({
            'name': `${controller}Controller`,
            '--model': this.option('resource') ? modelName : null,
        }));
    }

    /**
     * getStub method.
     * @returns Promise resolving to stub path
     */
    public getStub(): Promise<string> {
        let isPivot: boolean = Boolean(this.input && this.hasOption('pivot') && this.option('pivot'));
        return this.resolveStubPath(isPivot ? 'stubs/model.pivot.stub' : 'stubs/model.stub');
    }

    /**
     * getDefaultNamespace method.
     * @param rootNamespace - Root namespace
     * @returns The default namespace path
     */
    public getDefaultNamespace(rootNamespace: string): string {
        return rootNamespace.includes('.js') ? rootNamespace : path.resolve(rootNamespace, app_path('models'));
    }

}

export default ModelMakeCommand;