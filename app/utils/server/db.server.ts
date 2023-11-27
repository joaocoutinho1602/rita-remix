import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

import { prettyJSON } from '../common/functions';

const loggingMiddleware = (shouldLog: boolean) => async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
) => {
    try {
        const before = Date.now();

        const result = await next(params);

        const after = Date.now();

        if (shouldLog === true) {
            console.log(
                `🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀 Query ${params.model}.${params.action} took ${
                    after - before
                }ms`
            );
        }

        return result;
    } catch (error) {
        console.log('🚀 ~ file: db.server.ts:7 ~ params', prettyJSON(params));
    }
};

let db: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === 'production') {
    db = new PrismaClient();
} else {
    if (!global.__db) {
        global.__db = new PrismaClient();
    }
    db = global.__db;
}

const shouldLog = process.env.PERFORMANCE_LOGGING === 'true';

db.$use(loggingMiddleware(shouldLog));

export { db };
