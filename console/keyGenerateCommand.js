const Command = require('@ostro/console/command')
const Crypto = require('crypto')
class KeyGenerateCommand extends Command {

    get $signature() {
        return 'key:generate';
    }

    get $description() {
        return 'Set the application key'
    };

    get $options() {
        return [
            this.createOption('--show [command] ', 'Display the key instead of modifying files'),
            this.createOption('--force [command] ', 'Force the operation to run when in production'),
        ]
    }

    constructor(file) {
        super()
        this.$file = file
    }

    async handle() {
        let $key = this.generateRandomKey();

        if (this.option('show')) {
            return this.line('<comment>' + $key + '</comment>');
        }

        if (!await this.setKeyInEnvironmentFile($key)) {
            return;
        }

        this.$app['config']['app.key'] = $key;

        this.info('Application key set successfully.');
    }

    generateRandomKey() {
        let $cipher = this.$app['config']['app.cipher']
        let $length = $cipher == 'AES-128-CBC' ? 16 : ($cipher == 'AES-192-CBC' ? 24 : 32)
        return 'base64:' + Crypto.randomBytes($length).toString('base64');
    }

    async setKeyInEnvironmentFile($key) {
        let $currentKey = this.$app['config']['app.key'];

        if ($currentKey.length !== 0 && (!await this.confirmToProceed())) {
            return false;
        }

        await this.writeNewEnvironmentFileWith($key);

        return true;
    }

    writeNewEnvironmentFileWith($key) {
        return this.$file.get(this.$app.environmentFilePath()).then(res => {
            return this.$file.put(this.$app.environmentFilePath(), res.replace(this.keyReplacementPattern(), 'APP_KEY=' + $key))
        })
    }

    keyReplacementPattern() {

        return 'APP_KEY=' + this.$app['config']['app.key'];
    }
}

module.exports = KeyGenerateCommand