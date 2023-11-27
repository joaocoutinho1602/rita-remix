import { useTransition } from '@remix-run/react';

import dayjs from 'dayjs';
import { getSelectionDate } from '../common';

/**
 * This logic controls whether we should show the user the Outlet is loading
 * It should be replicated everywhere there is a Loader
 */
export const useOutletTransitioning = () => {
    const transition = useTransition();

    /**
     * splitPathname[0] will always be ''
     */
    const splitPathname = transition.location?.pathname.split('/') || [];

    const isOfficeIndex =
        splitPathname.length === 2 && splitPathname[1] === 'office';

    if (isOfficeIndex) {
        /**
         * If we are in the /office index route, we must control wether we are navigating the calendar
         */
        const selectionDate = getSelectionDate(transition.location);

        if (selectionDate?.length && dayjs(selectionDate).isValid()) {
            return false;
        } else {
            return true;
        }
    }

    return transition.state === 'loading';
};
