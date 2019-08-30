"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskEither_1 = require("fp-ts/lib/TaskEither");
var fs = require("fs");
exports.createWriteStream = function (p) { return fs.createWriteStream(p); };
exports.readFile = TaskEither_1.taskify(fs.readFile);
exports.addEventHandler = function (e, event, handler) { return function () { return e.on(event, handler); }; };
//# sourceMappingURL=fs.js.map