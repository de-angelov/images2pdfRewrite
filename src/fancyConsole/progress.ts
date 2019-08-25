import { IO } from 'fp-ts/lib/IO'
import * as ProgressBar from 'progress'

type create = (
    message: string,
    options: ProgressBar.ProgressBarOptions,
) => IO<ProgressBar>

export const create: create = (message, options) => () =>
    new ProgressBar(message, options)

type tick = (progressBar: ProgressBar) => IO<void>
export const tick: tick = (progressBar) => () => progressBar.tick()
