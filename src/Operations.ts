import { Do } from 'fp-ts-contrib/lib/Do'
import { sequenceT } from 'fp-ts/lib/Apply'
import { array, chunksOf, flatten, last, sort } from 'fp-ts/lib/Array'
import { either } from 'fp-ts/lib/Either'
import { constVoid, flow, identity, flip } from 'fp-ts/lib/function'
import * as IO from 'fp-ts/lib/IO'
import * as O from 'fp-ts/lib/Option'
import { contramap, Ord, ordString } from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import { WriteStream } from 'fs'
import { failure } from 'io-ts/lib/PathReporter'
import isImage = require('is-image')
import { Ora } from 'ora'
import * as os from 'os'
import * as Path from 'path'
import * as PDFDocument from 'pdfkit'
import * as ProgressBar from 'progress'

import * as ora from './fancyConsole/ora'
import * as progressBar from './fancyConsole/progress'
import * as fs from './fs'
import * as img from './imageProcessing'
import { CLIArguments } from './models/CLIArguments'
import * as d from './pdfDocuments'
import { recursiveTE } from './recursiveReaddir'
import { string } from 'io-ts'

export interface Size {
    width: number
    height: number
}

export interface ResizedImageBag {
    name: string
    buffer: Buffer
    size: Size
}

export const ioParallel = array.sequence(IO.io)
export const teParallel = array.sequence(TE.taskEither)
export const teSeries = array.sequence(TE.taskEitherSeq)
export const sequenceTIO = sequenceT(IO.io)

export const cpuCountIO: IO.IO<number> = IO.io.map(
    () => os.cpus(),
    (_) => _.length,
)
export const exit: IO.IO<void> = () => process.exit()

export const getImagePaths: (x: string) => TE.TaskEither<Error, string[]> = (
    imagesDir,
) => TE.taskEither.map(recursiveTE(imagesDir), (files) => files.filter(isImage))

export const getParentDirName: (x: string) => O.Option<string> = (imagesPath) =>
    last(Path.dirname(imagesPath).split('/'))

export const ordImagesByName: Ord<ResizedImageBag> = contramap(
    (image: ResizedImageBag) => image.name.toLocaleLowerCase(),
)(ordString)

type initOutput = <L>(
    x: string,
    y: PDFKit.PDFDocument,
) => TE.TaskEither<L, WriteStream>

export const initOutput: initOutput = (outputFile, doc) =>
    TE.taskEither.fromIO(
        IO.io.chain(
            fs.createWriteStream(Path.resolve(outputFile)) as any,
            d.pipeDoc(doc),
        ),
    )

type createSpinner = <L>() => TE.TaskEither<L, Ora>

export const createSpinner: createSpinner = () =>
    TE.taskEither.fromIO(ora.create('Creating document...'))

type processImage = (
    x: ProgressBar,
) => (y: string, z: Size) => TE.TaskEither<Error, ResizedImageBag>

export const processImage: processImage = (progressBarInstance) => (
    imagePath,
    { width, height },
) => {
    const fileName = Path.parse(imagePath).name
    const fullName = pipe(
        getParentDirName(imagePath),
        O.fold(() => fileName, (dirName: string) => dirName + fileName),
    )

    return pipe(
        fs.readFile(imagePath),
        TE.chain(img.trimImage),
        TE.chain(({ buffer, info }) => {
            const outputSize = img.calculateOutputImageSize(info, {
                width,
                height,
            })

            const result = Do(TE.taskEither)
                .bind('resizedImageBuffer', img.resizeImage(outputSize, buffer))
                .do(TE.rightIO(progressBar.tick(progressBarInstance)))
                .return(({ resizedImageBuffer }) => ({
                    buffer: resizedImageBuffer,
                    name: fullName,
                    size: outputSize,
                }))

            return result
        }),
    )
}

type toSortedByName = (x: ResizedImageBag[][]) => ResizedImageBag[]
export const toSortedByName: toSortedByName = flow(
    flatten,
    sort(ordImagesByName),
)

type prepareImages = (
    x1: string[],
    x2: Size,
    x3: number,
    x4: ProgressBar,
) => TE.TaskEither<Error, ResizedImageBag[]>

export const prepareImages: prepareImages = (
    imagesPaths,
    outputSize,
    cpuCount,
    progressBarInstance,
) => {
    const processImg = ((size: Size) => (imagePath: string) =>
        processImage(progressBarInstance)(imagePath, size))(outputSize)

    const resizeImageChunksInParallel = (chunk: string[]) =>
        teParallel(chunk.map(processImg))

    const resizedImages = teSeries(
        chunksOf(cpuCount)(imagesPaths).map(resizeImageChunksInParallel),
    )

    return TE.taskEither.map(resizedImages, toSortedByName)
}

type writeImagesToDocument = (
    x1: PDFKit.PDFDocument,
    x2: Ora,
) => (x3: ResizedImageBag[]) => TE.TaskEither<Error, void>

export const writeImagesToDocument: writeImagesToDocument = (
    doc,
    docSpinner,
) => (images) => {
    const IOComposition: any = flow(
        () => ora.start(docSpinner),
        IO.chain(() => ioParallel(images.map(d.addImageToDoc(doc)))),
        IO.chain(() => d.closeDoc(doc)),
    )
    return TE.rightIO(IOComposition)
}

type createProgressBar = <L>(x1: number) => TE.TaskEither<L, ProgressBar>

export const createProgressBar: createProgressBar = (progressBarLength) =>
    TE.rightIO(
        progressBar.create('Processing images [:bar] :current/:total', {
            total: progressBarLength,
            width: 17,
        }),
    )

export const decodeArguments = (
    cliArguments: unknown,
): TE.TaskEither<Error, CLIArguments> =>
    TE.fromEither(
        either.mapLeft(
            CLIArguments.decode(cliArguments),
            (errors: any) => new Error(failure(errors).join('\n')),
        ),
    )

type stopSpinnerWithFailure = (
    x1: Ora,
) => (x2: Error) => TE.TaskEither<Error, void>

export const stopSpinnerWithFailure: stopSpinnerWithFailure = (docSpinner) => (
    err,
) => {
    const cb = TE.rightIO<Error, void>(
        IO.io.chain(ora.fail(docSpinner, err.message), () => constVoid),
    )

    return TE.taskEither.chain(cb, () => TE.left(err))
}
