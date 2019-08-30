import { IO } from 'fp-ts/lib/IO'
import ora, { Ora } from 'ora'

type create = (x: string) => IO<Ora>
export const create: create = (message) => () => ora(message)

type start = (x: Ora) => IO<Ora>
export const start: start = (oraInstance) => () => oraInstance.start()

export const succeed = (oraInstance: Ora, message: string): IO<Ora> => () =>
    oraInstance.succeed(message)

type fail = (oraInstance: Ora, message: string) => IO<Ora>
export const fail: fail = (oraInstance, message) => () =>
    oraInstance.fail(message)
