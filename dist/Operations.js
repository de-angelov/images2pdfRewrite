"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Do_1 = require("fp-ts-contrib/lib/Do");
var Apply_1 = require("fp-ts/lib/Apply");
var Array_1 = require("fp-ts/lib/Array");
var Either_1 = require("fp-ts/lib/Either");
var function_1 = require("fp-ts/lib/function");
var IO = require("fp-ts/lib/IO");
var O = require("fp-ts/lib/Option");
var Ord_1 = require("fp-ts/lib/Ord");
var pipeable_1 = require("fp-ts/lib/pipeable");
var TE = require("fp-ts/lib/TaskEither");
var PathReporter_1 = require("io-ts/lib/PathReporter");
var isImage = require("is-image");
var os = require("os");
var Path = require("path");
var ora = require("./fancyConsole/ora");
var progressBar = require("./fancyConsole/progress");
var fs = require("./fs");
var img = require("./imageProcessing");
var CLIArguments_1 = require("./models/CLIArguments");
var d = require("./pdfDocuments");
var recursiveReaddir_1 = require("./recursiveReaddir");
exports.ioParallel = Array_1.array.sequence(IO.io);
exports.teParallel = Array_1.array.sequence(TE.taskEither);
exports.teSeries = Array_1.array.sequence(TE.taskEitherSeq);
exports.sequenceTIO = Apply_1.sequenceT(IO.io);
exports.cpuCountIO = IO.io.map(function () { return os.cpus(); }, function (_) { return _.length; });
exports.exit = function () { return process.exit(); };
exports.getImagePaths = function (imagesDir) { return TE.taskEither.map(recursiveReaddir_1.recursiveTE(imagesDir), function (files) { return files.filter(isImage); }); };
exports.getParentDirName = function (imagesPath) {
    return Array_1.last(Path.dirname(imagesPath).split('/'));
};
exports.ordImagesByName = Ord_1.contramap(function (image) { return image.name.toLocaleLowerCase(); })(Ord_1.ordString);
exports.initOutput = function (outputFile, doc) {
    return TE.taskEither.fromIO(IO.io.chain(fs.createWriteStream(Path.resolve(outputFile)), d.pipeDoc(doc)));
};
exports.createSpinner = function () {
    return TE.taskEither.fromIO(ora.create('Creating document...'));
};
exports.processImage = function (progressBarInstance) { return function (imagePath, _a) {
    var width = _a.width, height = _a.height;
    var fileName = Path.parse(imagePath).name;
    var fullName = pipeable_1.pipe(exports.getParentDirName(imagePath), O.fold(function () { return fileName; }, function (dirName) { return dirName + fileName; }));
    return pipeable_1.pipe(fs.readFile(imagePath), TE.chain(img.trimImage), TE.chain(function (_a) {
        var buffer = _a.buffer, info = _a.info;
        var outputSize = img.calculateOutputImageSize(info, {
            width: width,
            height: height,
        });
        var result = Do_1.Do(TE.taskEither)
            .bind('resizedImageBuffer', img.resizeImage(outputSize, buffer))
            .do(TE.rightIO(progressBar.tick(progressBarInstance)))
            .return(function (_a) {
            var resizedImageBuffer = _a.resizedImageBuffer;
            return ({
                buffer: resizedImageBuffer,
                name: fullName,
                size: outputSize,
            });
        });
        return result;
    }));
}; };
exports.toSortedByName = function_1.flow(Array_1.flatten, Array_1.sort(exports.ordImagesByName));
exports.prepareImages = function (imagesPaths, outputSize, cpuCount, progressBarInstance) {
    var processImg = (function (size) { return function (imagePath) {
        return exports.processImage(progressBarInstance)(imagePath, size);
    }; })(outputSize);
    var resizeImageChunksInParallel = function (chunk) {
        return exports.teParallel(chunk.map(processImg));
    };
    var resizedImages = exports.teSeries(Array_1.chunksOf(cpuCount)(imagesPaths).map(resizeImageChunksInParallel));
    return TE.taskEither.map(resizedImages, exports.toSortedByName);
};
exports.writeImagesToDocument = function (doc, docSpinner) { return function (images) {
    var IOComposition = function_1.flow(function () { return ora.start(docSpinner); }, IO.chain(function () { return exports.ioParallel(images.map(d.addImageToDoc(doc))); }), IO.chain(function () { return d.closeDoc(doc); }));
    return TE.rightIO(IOComposition);
}; };
exports.createProgressBar = function (progressBarLength) {
    return TE.rightIO(progressBar.create('Processing images [:bar] :current/:total', {
        total: progressBarLength,
        width: 17,
    }));
};
exports.decodeArguments = function (cliArguments) {
    return TE.fromEither(Either_1.either.mapLeft(CLIArguments_1.CLIArguments.decode(cliArguments), function (errors) { return new Error(PathReporter_1.failure(errors).join('\n')); }));
};
exports.stopSpinnerWithFailure = function (docSpinner) { return function (err) {
    var cb = TE.rightIO(IO.io.chain(ora.fail(docSpinner, err.message), function () { return function_1.constVoid; }));
    return TE.taskEither.chain(cb, function () { return TE.left(err); });
}; };
//# sourceMappingURL=Operations.js.map