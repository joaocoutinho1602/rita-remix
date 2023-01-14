export enum GenericErrors {
    GOOGLE_ERROR = 'GOOGLE_ERROR',
    PRISMA_ERROR = 'PRISMA_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum LoginErrors {
    EMAIL_NOT_REGISTERED = 'EMAIL_NOT_REGISTERED',
    WRONG_HASH = 'WRONG_HASH',
    WRONG_PASSWORD = 'WRONG_PASSWORD',
}

export enum SignupErrors {
    EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
    ERROR_CREATING_USER = 'ERROR_CREATING_USER',
    ERROR_CREATING_DOCTOR = 'ERROR_CREATING_DOCTOR',
}

export enum GoogleErrors {
    NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN',
    ERROR_FETCHING_EVENTS = 'ERROR_FETCHING_EVENTS',
}

export enum AddClientErrors {
    IS_ALREADY_PATIENT = 'IS_ALREADY_PATIENT',
}

export enum SettingsMessages {
    ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}

export enum SuccessCodes {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    FOUND = 302,
}

export enum ErrorCodes {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503,
    CUSTOM_ERROR = 777,
}

/**
 * This enum MUST map 1 to 1 to what is in the DoctorSpeciality database table
 */
export enum DoctorSpecialty {
    PSYCHOLOGY = 'Psicologia',
}
