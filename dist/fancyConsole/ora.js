"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ora_1 = require("ora");
exports.create = function (message) { return function () { return ora_1.default(message); }; };
exports.start = function (oraInstance) { return function () { return oraInstance.start(); }; };
exports.succeed = function (oraInstance, message) { return function () {
    return oraInstance.succeed(message);
}; };
exports.fail = function (oraInstance, message) { return function () {
    return oraInstance.fail(message);
}; };
//# sourceMappingURL=ora.js.map