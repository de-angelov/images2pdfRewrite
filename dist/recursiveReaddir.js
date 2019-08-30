"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskEither_1 = require("fp-ts/lib/TaskEither");
var recursive = require("recursive-readdir");
exports.recursiveTE = TaskEither_1.taskify(recursive);
//# sourceMappingURL=recursiveReaddir.js.map