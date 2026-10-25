import fs from 'node:fs';
import path from 'node:path';

/**
 * Class Production.
 */
class Production {

    /**
     * register method.
     */
    public register(): void {

    }

    /**
     * render method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Exception object
     */
    public render(request: any, response: any, $exception: Record<string, any> = {}): void {
        if (request.wantJson() || request.ajax()) {
            response.send({
                name: $exception.name || 'HttpException',
                errors: $exception.errors || {},
                message: $exception.message || 'Whoops look like somthing wrong'
            }, ($exception.statusCode || 500));
        } else {
            fs.readFile(path.join(__dirname, '../template/errors/500'), { encoding: 'utf8' }, function (error: any, data: any) {
                response.send(data, 500);
            });
        }
    }
}

export default Production;