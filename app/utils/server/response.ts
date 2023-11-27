import { ErrorCodes, GenericErrors } from '~/utils/common';

/**
 * Builds a custom response (defaults to an error response using the custom error code)
 * It puts the status text in both the status text field and a custom status text header because in development we use HTTP 1.1 but in the live environment we are using HTTP 2.0 and HTTP 2.0 doesn't support the status text
 * @param param0
 * @returns
 */
export const customError = (
    statusText: string = GenericErrors.SERVER_ERROR,
    status: number = ErrorCodes.CUSTOM_ERROR
) =>
    new Response(undefined, {
        status,
        statusText,
        headers: { statusText },
    });
