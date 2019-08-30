"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathReporter_1 = require("io-ts/lib/PathReporter");
var CLIArguments_1 = require("../models/CLIArguments");
var Either_1 = require("fp-ts/lib/Either");
var TaskEither_1 = require("fp-ts/lib/TaskEither");
var decodeArguments = function (cliArguments) {
    return TaskEither_1.fromEither(Either_1.either.mapLeft(CLIArguments_1.CLIArguments.decode(cliArguments), function (errors) { return new Error(PathReporter_1.failure(errors).join('\n')); }));
};
//# sourceMappingURL=stop.js.map