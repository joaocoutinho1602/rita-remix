import dayjs from 'dayjs';

import type { Calendar } from '@prisma/client';

import type { calendar_v3 } from 'googleapis';

import type { GaxiosResponse } from 'googleapis-common';

/**
 *
 * @param requestUrl The URL for the loader, e.g. /office, office?selection=2023-02-08T16:51:45.622Z
 * @returns A timeMin and a timeMax slice to be sued when querying the Google API for events
 *
 *? Daylight Savings Time requires 1 hour to be added

 *? Thils will eventually have to be revised and standardised for all countries in all timezones and accounting for DST
 */
export const getEventsTimeSlice = (requestUrl: string) => {
    const url = new URL(requestUrl);
    const selection =
        url.searchParams.get('selection') || dayjs().toISOString();

    return [
        dayjs(selection)
            .subtract(0, 'month')
            .startOf('month')
            .add(1, 'hour')
            .toISOString(),
        dayjs(selection).add(0, 'month').endOf('month').toISOString(),
    ];
};

export type GoogleCalendarEventWithColor = {
    color: string;
} & calendar_v3.Schema$Event;
/**
 *
 * @param userCalendars An array with the user's calendar IDs as stored in the DB
 * @param allCalendars An array with all the calendars queried from the Google API
 * @param allCalendarsEvents An array with arrays of events for each Google calendar
 * @param allColors An array with the colors the user defines for their calendars
 * @returns
 */
export const mapEventsWithColor = (
    userCalendars: Calendar[],
    allCalendars: GaxiosResponse<calendar_v3.Schema$CalendarList>,
    allCalendarsEvents: GaxiosResponse<calendar_v3.Schema$Events>[],
    allColors: GaxiosResponse<calendar_v3.Schema$Colors>
): GoogleCalendarEventWithColor[] =>
    userCalendars.flatMap(({ googleCalendarId }, index) =>
        (allCalendarsEvents[index].data.items || []).map((event) =>
            Object.assign(
                {},
                {
                    color:
                        event.colorId &&
                        allColors.data.event?.[event.colorId].background?.length
                            ? (allColors.data.event[event.colorId]
                                  .background as string)
                            : allCalendars.data.items?.find(
                                  (calendar) => calendar.id === googleCalendarId
                              )?.backgroundColor || '',
                },
                event
            )
        )
    );

export type LoaderEvents = {
    [key: string]: GoogleCalendarEventWithColor[];
};
/**
 *
 * @param events An array of Google Calendar events extended with their respective color
 * @returns An object that maps every day with events to its events, e.g. { '2022-12-13': [event1, event2] }
 */
export const eventsByDay = (
    events: GoogleCalendarEventWithColor[]
): LoaderEvents =>
    events.reduce<LoaderEvents>((acc, event) => {
        const eventDay =
            event.start?.date ||
            dayjs(event.start?.dateTime).toISOString().split('T')[0];

        /**
         *? We need to take all the events already assigned to a given day, push the new event into it, and create a new object with the new event assigned to this day
         */

        const dayEvents: GoogleCalendarEventWithColor[] = acc[eventDay] || [];
        dayEvents.push(event);
        dayEvents.sort((a, b) =>
            dayjs(a.start?.dateTime || a.start?.date).isBefore(
                b.start?.dateTime || b.start?.date
            )
                ? -1
                : 1
        );

        const res = Object.assign({}, acc, { [eventDay]: dayEvents });

        return res;
    }, {});
