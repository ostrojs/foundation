import Crypto from 'crypto';
import Command from '@ostro/console/command';

/**
 * Class KeyGenerateCommand.
 */
class KeyGenerateCommand extends Command {
    [key: string]: any;

    public declare $app: any;
    public $file: any;

    public get $signature(): string {
        return 'key:generate';
    }

    public get $description(): string {
        return 'Set the application key';
    }

    public get $options(): any[] {
        return [
        this.createOption('--show [command] ', 'Display the key instead of modifying files'),
        this.createOption('--force [command] ', 'Force the operation to run when in production'),
    ];
    }

    /**
     * Create a new instance.
     * @param file - File service instance
     */
    constructor(file: any) {
        super();
        this.$file = file;
    }

    /**
     * handle method.
     * @returns Promise resolving when done
     */
    public async handle(): Promise<any> {
        let key: string = this.generateRandomKey();

        if (this.option('show')) {
            return this.line('<comment>' + key + '</comment>');
        }

        if (!await this.setKeyInEnvironmentFile(key)) {
            return;
        }

        this.$app['config']['app.key'] = key;

        this.info('Application key set successfully.');
    }

    /**
     * generateRandomKey method.
     * @returns The generated base64 random key
     */
    public generateRandomKey(): string {
        let cipher: string = this.$app['config']['app.cipher'];
        let length: number = cipher === 'AES-128-CBC' ? 16 : (cipher === 'AES-192-CBC' ? 24 : 32);
        return 'base64:' + Crypto.randomBytes(length).toString('base64');
    }

    /**
     * setKeyInEnvironmentFile method.
     * @param key - The key string
     * @returns Boolean indicating whether key was set
     */
    public async setKeyInEnvironmentFile(key: string): Promise<boolean> {
        let currentKey: string = this.$app['config']['app.key'] || '';

        if (currentKey.length !== 0 && (!await this.confirmToProceed())) {
            return false;
        }

        await this.writeNewEnvironmentFileWith(key);

        return true;
    }

    /**
     * writeNewEnvironmentFileWith method.
     * @param key - The key string
     * @returns Promise resolving when file updated
     */
    public writeNewEnvironmentFileWith(key: string): Promise<any> {
        return this.$file.get(this.$app.environmentFilePath()).then((res: string) => {
            return this.$file.put(this.$app.environmentFilePath(), res.replace(this.keyReplacementPattern(), 'APP_KEY=' + key));
        });
    }

    /**
     * keyReplacementPattern method.
     * @returns The pattern string
     */
    public keyReplacementPattern(): string {
        return 'APP_KEY=' + (this.$app['config']['app.key'] || '');
    }
}

export default KeyGenerateCommand;