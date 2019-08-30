"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Do_1 = require("fp-ts-contrib/lib/Do");
var pipeable_1 = require("fp-ts/lib/pipeable");
var Operations_1 = require("./Operations");
var TaskEither_1 = require("fp-ts/lib/TaskEither");
var function_1 = require("fp-ts/lib/function");
var Operations_2 = require("./Operations");
var Path = require("path");
var PDFDocument = require("pdfkit");
var ora = require("./fancyConsole/ora");
var Either_1 = require("fp-ts/lib/Either");
function main(cliArguments) {
    var doc = new PDFDocument({
        autoFirstPage: false,
    });
    var s1 = Do_1.Do(TaskEither_1.taskEither);
    var s2 = s1.bind('args', Operations_1.decodeArguments(cliArguments));
    var s3 = s2.sequenceSL(function (_a) {
        var args = _a.args;
        return ({
            imagesDir: TaskEither_1.right(Path.resolve(args.imagesDirectory)),
            outputSize: TaskEither_1.right(function_1.identity({ width: args.width, height: args.height })),
            outputStream: Operations_2.initOutput(args.output, doc),
            docSpinner: Operations_2.createSpinner(),
            cpuCount: TaskEither_1.rightIO(Operations_1.cpuCountIO),
        });
    });
    var s4 = s3.doL(function (_a) {
        var outputStream = _a.outputStream, docSpinner = _a.docSpinner;
        var cb = function () {
            return docSpinner.isSpinning
                ? Operations_1.sequenceTIO(ora.succeed(docSpinner, 'Done!'))
                : Operations_1.exit;
        };
        return TaskEither_1.right(outputStream.on('close', cb));
    });
    var s5 = s4.bindL('imagePaths', function (_a) {
        var imagesDir = _a.imagesDir;
        return Operations_1.getImagePaths(imagesDir);
    });
    var s6 = s5.bindL('progressBarInstance', function (_a) {
        var imagePaths = _a.imagePaths;
        return Operations_1.createProgressBar(imagePaths.length);
    });
    var s7 = s6.doL(function (props) {
        var paths = props.imagePaths, size = props.outputSize, cpus = props.cpuCount, bar = props.progressBarInstance, docSpinner = props.docSpinner;
        var cb3 = Operations_1.prepareImages(paths, size, cpus, bar);
        var cb1 = Either_1.fold(Operations_1.stopSpinnerWithFailure(docSpinner), function () {
            return TaskEither_1.right(undefined);
        });
        var arg1 = Operations_1.writeImagesToDocument(doc, docSpinner);
        var cb2 = Either_1.chain(arg1);
        return pipeable_1.pipe(cb3, cb2, cb1);
    });
    return s7.return(function_1.constVoid);
}
exports.main = main;
//# sourceMappingURL=index.js.map