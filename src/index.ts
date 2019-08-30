import { Do } from 'fp-ts-contrib/lib/Do'
import { pipe } from 'fp-ts/lib/pipeable'
import {
    decodeArguments,
    cpuCountIO,
    exit,
    getImagePaths,
    createProgressBar,
    prepareImages,
    writeImagesToDocument,
    sequenceTIO,
    stopSpinnerWithFailure,
} from './Operations'
import { taskEither, right, rightIO, TaskEither } from 'fp-ts/lib/TaskEither'
import { identity, constVoid, flow } from 'fp-ts/lib/function'
import { Size, initOutput, createSpinner } from './Operations'
import * as Path from 'path'
import * as PDFDocument from 'pdfkit'
import Ora = require('ora')
import * as ora from './fancyConsole/ora'
import { chain, fold } from 'fp-ts/lib/Either'

export function main(cliArguments: unknown): TaskEither<Error, void> {
    const doc = new PDFDocument({
        autoFirstPage: false,
    })

    const s1 = Do(taskEither)
    const s2 = s1.bind('args', decodeArguments(cliArguments))
    const s3 = s2.sequenceSL(({ args }) => ({
        imagesDir: right(Path.resolve(args.imagesDirectory)),
        outputSize: right(
            identity<Size>({ width: args.width, height: args.height }),
        ),
        outputStream: initOutput(args.output, doc),
        docSpinner: createSpinner(),
        cpuCount: rightIO(cpuCountIO),
    }))
    const s4 = s3.doL(({ outputStream, docSpinner }) => {
        const cb = () =>
            docSpinner.isSpinning
                ? sequenceTIO(ora.succeed(docSpinner, 'Done!'))
                : exit

        return right(outputStream.on('close', cb))
    })

    const s5 = s4.bindL('imagePaths', ({ imagesDir }) =>
        getImagePaths(imagesDir),
    )
    const s6 = s5.bindL('progressBarInstance', ({ imagePaths }) =>
        createProgressBar(imagePaths.length),
    )
    const s7 = s6.doL((props) => {
        const {
            imagePaths: paths,
            outputSize: size,
            cpuCount: cpus,
            progressBarInstance: bar,
            docSpinner,
        } = props

        const cb3 = prepareImages(paths, size, cpus, bar)

        const cb1 = fold(stopSpinnerWithFailure(docSpinner), () =>
            right(undefined),
        )

        const arg1 = writeImagesToDocument(doc, docSpinner)
        const cb2 = chain(arg1 as any)

        return pipe(
            cb3,
            cb2 as any,
            cb1,
        )
    })

    return s7.return(constVoid)
}
