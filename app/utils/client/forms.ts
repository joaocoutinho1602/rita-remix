import type { UseFormReturnType } from '@mantine/form';

import { GenericErrors } from '~/utils/common';

export type CustomFormEvent =
    | React.FormEvent<HTMLFormElement>
    | React.MouseEvent<HTMLButtonElement, MouseEvent>;

/**
 * Validates if a Mantine form has errors. Also prevents default
 * @param e event, either click or form submit by pressing Enter key
 * @param form Mantine form
 * @returns false if there are errors, true if there aren't
 */
export const errorsInForm = (e: CustomFormEvent, form: UseFormReturnType<any>) => {
    e.preventDefault();

    if (form.validate().hasErrors) {
        return true;
    }

    return false;
};

export const handleError = (response: Response) => {
    const message =
        response.statusText ||
        response.headers.get('statusText') ||
        GenericErrors.UNKNOWN_ERROR;

    if (response.status >= 400) {
        throw message;
    }
};
