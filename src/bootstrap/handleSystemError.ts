/**
 * Class HandleSystemError.
 */
class HandleSystemError {

    /**
     * bootstrap method.
     * @param $app - Application instance
     */
    public bootstrap($app: any): void {
        const logger = $app['logger'];
        process
            .on('unhandledRejection', (reason: any, p: any) => {
                if (!logger.getConfig('ignore_exceptions')) {
                    if (reason instanceof Error) {
                        reason = reason.stack;
                    } else if (typeof reason === 'object') {
                        reason = JSON.stringify(reason, undefined, 2);
                    }
                    reason = reason.toString();
                    logger.error('[unhandledRejection] :- ' + reason);
                    logger.channel('console').error('[unhandledRejection] :- ' + reason);
                }
            })
            .on('uncaughtException', (err: any) => {
                if (!logger.getConfig('ignore_exceptions')) {
                    if (err instanceof Error) {
                        err = err.stack;
                    } else if (typeof err === 'object') {
                        err = JSON.stringify(err, undefined, 2);
                    }
                    err = err.toString();
                    logger.error('[uncaughtException] :- ' + err);
                    logger.channel('console').error('[uncaughtException] :- ' + err);
                }
            });
    }
}

export default HandleSystemError;