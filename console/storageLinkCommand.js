const Command = require('@ostro/console/command')
class StorageLinkCommand extends Command {

    $signature = 'storage:link';

    $description = 'Create the symbolic links configured for the application';

    $options = [
        this.createOption('--relative', 'The host address to serve the application on'),
        this.createOption('--force', 'The port to serve the application on')
    ];
    
    constructor($file) {
        super()
        this.$file = $file
    }

    async handle() {
        let $relative = this.option('relative');
        let links = this.links()
        for (let $link in links) {
            let $target = links[$link]
            if (await this.$file.exists($link) && !await this.isRemovableSymlink($link, this.option('force'))) {
                this.error(`The [${$link}] link already exists.`);
                continue;
            }

            if (await isSymbolicLink($link)) {
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

    links() {
        return this.$app['config']['filesystems.links'] || {
            [public_path('storage')]: storage_path('app/public')
        };
    }

    isRemovableSymlink($link, $force) {
        return isSymbolicLink($link) && $force;
    }
}

module.exports = StorageLinkCommand