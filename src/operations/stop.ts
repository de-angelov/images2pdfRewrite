import { failure } from 'io-ts/lib/PathReporter'
import { CLIArguments } from '../models/CLIArguments'
import { either } from 'fp-ts/lib/Either'
import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither'

type decodeArguments = (x: unknown) => TaskEither<Error, CLIArguments>
const decodeArguments: decodeArguments = (cliArguments) =>
    fromEither(
        either.mapLeft(
            CLIArguments.decode(cliArguments),
            (errors) => new Error(failure(errors).join('\n')),
        ),
    )
