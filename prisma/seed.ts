import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function seed() {
    await Promise.all(
        getUsers().map((user) => {
            return db.user.create({ data: user });
        })
    );
}

seed();

function getUsers() {
    return [
        {
            id: 1,
            createdAt: '2022-09-13T22:29:43.053Z',
            updatedAt: '2022-09-13T22:29:43.053Z',
            email: 'testuser1@test.com',
            password: 'letmein',
            name: 'First Test User',
        },
        {
            id: 1,
            createdAt: '2022-09-14T22:29:43.053Z',
            updatedAt: '2022-09-14T22:29:43.053Z',
            email: 'testuser2@test.com',
            password: 'letmein',
            name: 'Second Test User',
        },
    ];
}
