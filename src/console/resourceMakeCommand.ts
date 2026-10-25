import path from 'node:path';
import GeneratorCommand from '@ostro/console/generatorCommand';
import { endsWith } from '@ostro/support/string';

/**
 * Class ResourceMakeCommand.
 */
class ResourceMakeCommand extends GeneratorCommand {
    [key: string]: any;

    public declare $app: any;
    public declare $file: any;

    public get $signature(): string {
        return 'make:resource';
    }

    public get $description(): string {
        return 'Create a new resource';
    }

    public $type: string = 'Resource';

    public override get $dirname(): string {
        return __dirname;
    }

    public get $options(): any[] {
        return [
        this.createOption('-c, --collection', 'Create a resource collection'),
    ];
    }

    /**
     * handle method.
     * @returns Promise resolving when done
     */
    public override async handle(): Promise<any> {
        if (this.collection()) {
            this.$type = 'Resource collection';
        }

        await super.handle();
    }

    /**
     * getStub method.
     * @returns Stub path
     */
    public getStub(): Promise<string> {
        return this.collection() ?
            this.resolveStubPath('stubs/resource-collection.stub') :
            this.resolveStubPath('stubs/resource.stub');
    }

    /**
     * collection method.
     * @returns Whether this is a resource collection
     */
    public collection(): boolean {
        return Boolean(this.option('collection') ||
            endsWith(this.argument('name'), 'Collection'));
    }

    /**
     * getDefaultNamespace method.
     * @param rootNamespace - Root namespace
     * @returns The default namespace path
     */
    public getDefaultNamespace(rootNamespace: string): string {
        return path.join(rootNamespace, 'app', 'http', 'resources');
    }

}

export default ResourceMakeCommand;