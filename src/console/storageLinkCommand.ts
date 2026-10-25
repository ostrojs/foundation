declare var base_path: any, is_null: any, isSymbolicLink: any, public_path: any, storage_path: any;
import Command from '@ostro/console/command';
import { isSymbolicLink as defaultIsSymbolicLink } from '@ostro/support/function';
const checkSymbolicLink = (p: string) => typeof isSymbolicLink === 'function' ? isSymbolicLink(p) : defaultIsSymbolicLink(p);
/**
 * Class StorageLinkCommand.
 */
class StorageLinkCommand extends Command {
    [key: string]: any;

    public get $signature(): string {
        return 'storage:link';
    }

    public get $description(): string {
        return 'Create the symbolic links configured for the application';
    }

    public get $options(): any[] {
        return [
        this.createOption('--relative', 'The host address to serve the application on'),
        this.createOption('--force', 'The port to serve the application on')
    ];
    }
    
    /**
     * Create a new instance.
     * @param {*} $file
     */
    constructor($file: any) {
        super()
        this.$file = $file
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        let $relative = this.option('relative');
        let links = this.links()
        for (let $link in links) {
            let $target = links[$link]
            if (await this.$file.exists($link) && !await this.isRemovableSymlink($link, this.option('force'))) {
                this.error(`The [${$link}] link already exists.`);
                continue;
            }

            if (await checkSymbolicLink($link)) {
                await this.$file.delete($link);
            }

            if ($relative) {
                await this.$file.relativeLink($target, $link);
            } else {
                await this.$file.link($target, $link);
            }

            this.info(`The [${$link}] link has been connected to [${$target}].`);
        }

        this.info('The links have been created.');
    }

    /**
     * links method.
     * @returns {any}
     */
    public links() {
        return this.$app['config']['filesystems.links'] || {
            [public_path('storage')]: storage_path('app/public')
        };
    }

    /**
     * isRemovableSymlink method.
     * @async
     * @param {*} $link
     * @param {*} $force
     * @returns {any}
     */
    public async isRemovableSymlink($link: any, $force: boolean) {
        return (await checkSymbolicLink($link)) && $force;
    }
}

export default StorageLinkCommand;