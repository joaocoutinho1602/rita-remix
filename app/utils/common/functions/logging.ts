type LogErrorArgs = {
    filePath: string;
    message: string;
    error: any;
};

export function logError({ filePath, message, error }: LogErrorArgs) {
    console.log(`⛔️ ~ file: ${filePath}\nmessage: ${message}\n\n`, error);
}
