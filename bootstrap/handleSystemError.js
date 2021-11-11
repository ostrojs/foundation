class HandleSystemError {

    bootstrap($app) {
        let logger = $app['logger']
        process
            .on('unhandledRejection', (reason, p) => {
                if (!logger.getConfig('ignore_exceptions')) {
                    if (reason instanceof Error) {
                        reason = reason.stack
                    } else if (typeof reason == 'object') {
                        reason = JSON.stringify(reason, undefined, 2)
                    }
                    reason = reason.toString()
                    logger.error('[unhandledRejection] :- ' + reason)
                    logger.channel('console').error('[unhandledRejection] :- ' + reason)
                }

            })
            .on('uncaughtException', (err) => {
                if (!logger.getConfig('ignore_exceptions')) {
                    if (err instanceof Error) {
                        err = err.stack
                    } else if (typeof err == 'object') {
                        err = JSON.stringify(err, undefined, 2)
                    }
                    err = err.toString()
                    logger.error('[uncaughtException] :- ' + err)
                    logger.channel('console').error('[uncaughtException] :- ' + err)

                }
            });

    }

}
module.exports = HandleSystemError