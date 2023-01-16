import { Button, Checkbox, ColorSwatch } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useFetcher } from '@remix-run/react';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons';
import { isEqual } from 'lodash';
import { useMemo, useState } from 'react';

import type {
    CalendarsObject,
    CheckboxesObject,
} from '~/routes/office/settings';

import type { CustomFormEvent } from '~/utils/client';
import { handleError } from '~/utils/client';

type SettingsCalendarProps = {
    googleAuthorizationUrl?: string;
    googleDataId?: string;
    calendars?: CalendarsObject;
    loaderCheckboxes?: CheckboxesObject;
};

export function SettingsCalendars({
    calendars,
    googleAuthorizationUrl,
    googleDataId,
    loaderCheckboxes = {},
}: SettingsCalendarProps) {
    const [errorCount, setErrorCount] = useState(0);
    const [startingCheckboxes, setStartingCheckboxes] = useState<{
        [key: string]: boolean;
    }>(loaderCheckboxes);
    const [checkboxes, setCheckboxes] = useState<{ [key: string]: boolean }>(
        loaderCheckboxes
    );
    const [savingCheckboxes, setSavingCheckboxes] = useState(false);

    const saveCheckboxesDisabled = useMemo(
        () => isEqual(startingCheckboxes || {}, checkboxes),
        [checkboxes, startingCheckboxes]
    );

    const settingsFetcher = useFetcher();

    async function submitCheckboxes(e: CustomFormEvent) {
        e.preventDefault();

        setSavingCheckboxes(true);

        await fetch('/api/doctor/showCalendars', {
            method: 'POST',
            body: JSON.stringify({
                checkboxes,
                googleDataId,
            }),
        })
            .then((response) => {
                handleError(response);

                showNotification({
                    message: 'Alterações submetidas com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });
            })
            .catch(() => {
                setErrorCount(errorCount + 1);

                if (errorCount < 3) {
                    showNotification({
                        title: 'Algo de errado aconteceu',
                        message:
                            'Por favor, volte a tentar submeter as alterações. Entretanto, já estamos em cima do assunto.',
                        color: 'yellow',
                        icon: <IconAlertTriangle size={18} />,
                        disallowClose: true,
                        styles: { root: { marginTop: '50px' } },
                    });
                } else {
                    showNotification({
                        title: 'Estamos com problemas',
                        message:
                            'Vamos tentar resolver tudo o mais rapidamente possível',
                        color: 'red',
                        icon: <IconX size={18} />,
                        autoClose: false,
                        styles: { root: { marginTop: '50px' } },
                    });
                }
            })
            .finally(() => {
                setStartingCheckboxes(checkboxes);
                setSavingCheckboxes(false);
            });
    }

    return (
        <div>
            <h2 onClick={async () => await fetch('/api/hitMe')}>Calendários</h2>
            <h4>
                Defina aqui quais os calendários que aparecem na sua página
                principal
            </h4>
            <form onSubmit={submitCheckboxes}>
                {googleAuthorizationUrl?.length ? (
                    <div className="googleAccountAssociationContainer">
                        Esta conta ainda não está sincronizada com nenhuma conta
                        Google.
                        <div
                            className="googleAuthorizationLink"
                            onClick={() =>
                                window.location.assign(googleAuthorizationUrl)
                            }
                        >
                            Clique aqui para associar a sua conta Google
                        </div>
                    </div>
                ) : (
                    <div className="calendar">
                        {Object.values(calendars || {})?.map(
                            ({
                                id,
                                summary,
                                description,
                                backgroundColor,
                                isMediciCalendar,
                            }) => (
                                <div key={id} className="row">
                                    <Checkbox
                                        checked={checkboxes[id]}
                                        disabled={isMediciCalendar}
                                        onChange={() =>
                                            setCheckboxes(
                                                Object.assign({}, checkboxes, {
                                                    [id]: !checkboxes[id],
                                                })
                                            )
                                        }
                                    />
                                    <ColorSwatch
                                        color={backgroundColor}
                                        size={18}
                                    />
                                    <div className="summary">{summary}</div>
                                </div>
                            )
                        )}
                    </div>
                )}
                <br />
                <Button
                    type="submit"
                    name="action"
                    value="googleDataId"
                    disabled={saveCheckboxesDisabled}
                    loading={
                        savingCheckboxes || settingsFetcher.state === 'loading'
                    }
                    onClick={submitCheckboxes}
                >
                    Salvar
                </Button>
            </form>
        </div>
    );
}
