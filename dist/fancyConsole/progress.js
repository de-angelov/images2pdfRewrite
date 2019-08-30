"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProgressBar = require("progress");
exports.create = function (message, options) { return function () {
    return new ProgressBar(message, options);
}; };
exports.tick = function (progressBar) { return function () { return progressBar.tick(); }; };
//# sourceMappingURL=progress.js.map