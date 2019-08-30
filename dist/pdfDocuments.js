"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeDoc = function (doc) { return function (stream) { return function () { return doc.pipe(stream); }; }; };
exports.addImageToDoc = function (doc) { return function (img) { return function () {
    var size = [img.size.width, img.size.height];
    doc.addPage({ size: size });
    doc.image(img.buffer, 0, 0, { fit: size });
}; }; };
exports.closeDoc = function (doc) { return function () { return doc.end(); }; };
//# sourceMappingURL=pdfDocuments.js.map