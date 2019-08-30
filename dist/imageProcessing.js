"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var E = require("fp-ts/lib/Either");
var pipeable_1 = require("fp-ts/lib/pipeable");
var sharp = require("sharp");
exports.calculateOutputImageSize = function (imageSize, viewportSize) {
    var outputRatio = viewportSize.width / viewportSize.height;
    var imageRatio = imageSize.width / imageSize.height;
    // Determs if the image orientation will be portrait or landscape.
    // If landscape, fit the image by viewport's height.
    var outputImageRatio = imageRatio < outputRatio
        ? viewportSize.width / viewportSize.height
        : (viewportSize.width * 2) / viewportSize.height;
    return imageRatio > outputImageRatio
        ? {
            width: viewportSize.width,
            height: Math.round(viewportSize.width / imageRatio),
        }
        : {
            width: Math.round(viewportSize.height * imageRatio),
            height: viewportSize.height,
        };
};
exports.trimImage = function (buffer) { return function () {
    return new Promise(function (resolve) {
        return sharp(buffer)
            .trim()
            .toBuffer(function (err, resizedBuffer, info) {
            return err
                ? resolve(E.left(err))
                : resolve(E.right({ buffer: resizedBuffer, info: info }));
        });
    });
}; };
var sharpResize = function (_a, buffer) {
    var width = _a.width, height = _a.height;
    return E.tryCatch(function () { return sharp(buffer).resize(width, height); }, E.toError);
};
exports.resizeImage = function (size, buffer) { return function () {
    return pipeable_1.pipe(sharpResize(size, buffer), E.map(function (sharpInstance) { return sharpInstance.png().toBuffer(); }), E.fold(function (err) { return Promise.resolve(E.left(err)); }, function (p) { return p.then(E.right).catch(function (err) { return E.left(err); }); }));
}; };
//# sourceMappingURL=imageProcessing.js.map