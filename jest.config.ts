import { execSync } from "child_process";
import path from "path";
import fs from "fs";

let tsJestPath = "ts-jest";
try {
    tsJestPath = require.resolve("ts-jest");
} catch {
    try {
        const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
        const candidate = path.join(globalRoot, "ts-jest");
        if (fs.existsSync(candidate)) {
            tsJestPath = candidate;
        }
    } catch {}
}

export default {
    "testEnvironment": "node",
    "testMatch": [
        "**/test/**/*.test.ts",
        "**/test/**/*.test.js"
    ],
    "transform": {
        "^.+\\.ts$": [
            tsJestPath,
            {
                "tsconfig": "<rootDir>/tsconfig.json"
            }
        ]
    },
    "moduleNameMapper": {
        "^@ostro/support/(.*)$": "<rootDir>/../support/src/$1",
        "^@ostro/support$": "<rootDir>/../support/src",
        "^@ostro/contracts/(.*)$": "<rootDir>/../contracts/src/$1",
        "^@ostro/contracts$": "<rootDir>/../contracts/src",
        "^@ostro/container/(.*)$": "<rootDir>/../container/src/$1",
        "^@ostro/container$": "<rootDir>/../container/src/application",
        "^@ostro/filesystem/(.*)$": "<rootDir>/../filesystem/src/$1",
        "^@ostro/filesystem$": "<rootDir>/../filesystem/src/filesystemManager",
        "^@ostro/database/(.*)$": "<rootDir>/../database/src/$1",
        "^@ostro/database$": "<rootDir>/../database/src",
        "^@ostro/router/(.*)$": "<rootDir>/../router/src/$1",
        "^@ostro/router$": "<rootDir>/../router/src",
        "^@ostro/foundation/(.*)$": "<rootDir>/src/$1",
        "^@ostro/foundation$": "<rootDir>/src/application",
        "^@ostro/console/(.*)$": "<rootDir>/../console/src/$1",
        "^@ostro/console$": "<rootDir>/../console/src/application",
        "^@ostro/cache/(.*)$": "<rootDir>/../cache/src/$1",
        "^@ostro/cache$": "<rootDir>/../cache/src",
        "^@ostro/session/(.*)$": "<rootDir>/../session/src/$1",
        "^@ostro/session$": "<rootDir>/../session/src",
        "^@ostro/logger/(.*)$": "<rootDir>/../logger/src/$1",
        "^@ostro/logger$": "<rootDir>/../logger/src/logManager",
        "^@ostro/http/(.*)$": "<rootDir>/../http/src/$1",
        "^@ostro/http$": "<rootDir>/../http/src",
        "^@ostro/event/eventServiceProvider$": "<rootDir>/test/mocks/eventServiceProvider.js",
        "^@ostro/server/request$": "<rootDir>/test/mocks/serverRequest.js",
        "^@ostro/server/response$": "<rootDir>/test/mocks/serverResponse.js"
    },
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "coverageReporters": [
        "text",
        "lcov",
        "clover"
    ],
    "collectCoverageFrom": [
        "<rootDir>/src/**/*.ts"
    ]
};
