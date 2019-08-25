import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as sharp from 'sharp'

import { Size } from './Operations'

type calculateOutputImageSize = (
    imageSize: sharp.OutputInfo,
    viewportSize: { width: number; height: number },
) => Size
export const calculateOutputImageSize: calculateOutputImageSize = (
    imageSize,
    viewportSize,
) => {
    const outputRatio = viewportSize.width / viewportSize.height
    const imageRatio = imageSize.width / imageSize.height

    // Determs if the image orientation will be portrait or landscape.
    // If landscape, fit the image by viewport's height.
    const outputImageRatio =
        imageRatio < outputRatio
            ? viewportSize.width / viewportSize.height
            : (viewportSize.width * 2) / viewportSize.height

    return imageRatio > outputImageRatio
        ? {
              width: viewportSize.width,
              height: Math.round(viewportSize.width / imageRatio),
          }
        : {
              width: Math.round(viewportSize.height * imageRatio),
              height: viewportSize.height,
          }
}

type trimImage = (
    buffer: Buffer,
) => TE.TaskEither<Error, { buffer: Buffer; info: sharp.OutputInfo }>
export const trimImage: trimImage = (buffer) => () =>
    new Promise((resolve) =>
        sharp(buffer)
            .trim()
            .toBuffer((err, resizedBuffer, info) =>
                err
                    ? resolve(E.left(err))
                    : resolve(E.right({ buffer: resizedBuffer, info })),
            ),
    )

type sharpResize = (size: Size, buffer: Buffer) => E.Either<Error, sharp.Sharp>
const sharpResize: sharpResize = ({ width, height }, buffer) =>
    E.tryCatch(() => sharp(buffer).resize(width, height), E.toError)

type resizeImage = (size: Size, buffer: Buffer) => TE.TaskEither<Error, Buffer>
export const resizeImage: resizeImage = (size, buffer) => () =>
    pipe(
        sharpResize(size, buffer),
        E.map((sharpInstance) => sharpInstance.png().toBuffer()),
        E.fold(
            (err) => Promise.resolve(E.left(err)),
            (p) => p.then(E.right).catch((err) => E.left(err)),
        ),
    )
