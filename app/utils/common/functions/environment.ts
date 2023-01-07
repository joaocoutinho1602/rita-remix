export function getURL() {
    return process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://rita-remix.vercel.app';
}
