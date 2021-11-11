const path = require('path')
class AliasLoader {

    constructor(aliases = []) {
        this._aliases = aliases
    }
    registerGlobal() {
        let aliases = this._aliases
        for (let aliasKey in aliases) {
            global[aliasKey] = typeof aliases[aliasKey] == 'string' ? require((aliases[aliasKey].startsWith('./')) ? path.resolve(aliases[aliasKey]) : aliases[aliasKey]) : aliases[aliasKey]
        }
    }
}
module.exports = AliasLoader