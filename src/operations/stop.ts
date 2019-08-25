type decodeArguments = (x: unknown) => : TE.TaskEither<Error, CLIArguments>
const decodeArguments: decodeArguments = (
    cliArguments,
) =>
    TE.fromEither(
        either.mapLeft(
            CLIArguments.decode(cliArguments),
            (errors) => new Error(failure(errors).join('\n')),
        ),
    )
