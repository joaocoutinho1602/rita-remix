import { GenericErrors } from '~/utils/common';

type LogErrorArgs = {
    filePath: string;
    message?: string;
    error?: any;
};

export function logError({ filePath, message, error }: LogErrorArgs) {
    console.log(
        `⛔️ ~ file: ${filePath}\n${
            message?.length && message?.length > 0
                ? ` message: ${message}\n`
                : ''
        }\n`,
        error
    );
}

export const googleErrorThrow = (path: string) => (error: any) => {
    logError({ filePath: path, message: GenericErrors.GOOGLE_ERROR, error });

    throw GenericErrors.GOOGLE_ERROR;
};

export const prismaErrorThrow = (path: string) => (error: any) => {
    logError({ filePath: path, message: GenericErrors.PRISMA_ERROR, error });

    throw GenericErrors.PRISMA_ERROR;
};
