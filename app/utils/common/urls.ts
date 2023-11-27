import type { Location } from '@remix-run/react';

import { flatten } from 'lodash';

/**
 * Takes a URL search string and returns a single array with all the query params and their values in it
 * @param location The search string in a URL, i.e. '?selection=2023-02-28T18:35:41.110Z&a=1&b=2'
 * @returns Array of all query params, i.e. ['selection=2023-02-28T18:35:41.110Z', 'a=1', 'b=2']
 */
const getQueryParams = (search: string = '') =>
    flatten(search.split('?')[1]?.split('&'));

/**
 *
 * @param search The search string in a URL, i.e. '?selection=2023-02-28T18:35:41.110Z'
 * @param param The query param we want, i.e. 'selection
 * @returns The value for that query param, i.e.'2023-02-28T18:35:41.110Z'
 */
const getQueryParamValue = (search: string, param: string) =>
    getQueryParams(search)
        ?.find((term) => term.includes(param))
        ?.split('=')[1] || '';

/**
 * Takes a Location object and returns the date selection value for the calendar pages
 * @param location Location object
 * @returns Date selection value
 */
export const getSelectionDate = (location: Location | undefined) =>
    typeof location !== 'undefined'
        ? getQueryParamValue(location.search, 'selection')
        : '';
