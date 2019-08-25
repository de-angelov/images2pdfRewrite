import { Do } from 'fp-ts-contrib/lib/Do'

export function main(cliArguments: unknown): TE.TaskEither<Error, void> {
    const doc = new PDFDocument({
        autoFirstPage: false,
    })

    return Do(TE.TaskEither).bind('args', decodeArguments(cliArguments))
}

export function main(cliArguments: unknown): TE.TaskEither<Error, void> {
    const doc = new PDFDocument({ autoFirstPage: false })
    return Do(TE.taskEither)
        .bind('args', decodeArguments(cliArguments))
        .sequenceSL(({ args }) => ({
            imagesDir: TE.right(Path.resolve(args.imagesDirectory)),
            outputSize: TE.right(
                identity<Size>({ width: args.width, height: args.height }),
            ),
            outputStream: initOutput(args.output, doc),
            docSpinner: createSpinner(),
            cpuCount: TE.rightIO(cpuCountIO),
        }))
        .doL(({ outputStream, docSpinner }) =>
            TE.right(
                outputStream.on('close', () =>
                    (docSpinner.isSpinning
                        ? sequenceTIo(ora.succeed(docSpinner, 'Done!'), exit)
                        : exit)(),
                ),
            ),
        )
        .bindL('imagesPaths', ({ imagesDir }) => getImagePaths(imagesDir))
        .bindL('progressBarInstance', ({ imagesPaths }) =>
            createProgressBar(imagesPaths.length),
        )
        .doL(
            ({
                imagesPaths,
                outputSize,
                cpuCount,
                progressBarInstance,
                docSpinner,
            }) =>
                pipe(
                    prepareImages(
                        imagesPaths,
                        outputSize,
                        cpuCount,
                        progressBarInstance,
                    ),
                    TE.chain(writeImagesToDocument(doc, docSpinner)),
                    TE.fold(stopSpinnerWithFailure(docSpinner), () =>
                        TE.right(undefined),
                    ),
                ),
        )
        .return(constVoid)
}
