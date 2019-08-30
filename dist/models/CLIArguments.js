"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var t = require("io-ts");
exports.CLIArguments = t.type({
    imagesDirectory: t.string,
    width: t.Int,
    height: t.Int,
    output: t.string,
});
//# sourceMappingURL=CLIArguments.js.map