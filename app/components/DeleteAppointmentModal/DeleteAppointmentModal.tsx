import { useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import { Button, Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconTrash, IconX } from '@tabler/icons';

import { handleError } from '~/utils/client';
import { GenericErrors } from '~/utils/common';
import type { EnhancedEvent } from '~/utils/common/types';

export type DeleteAppointmentRequestBody = {
    googleCalendarId: string;
    googleEventId: string;
    mediciCalendarId: string;
    mediciEventId: string;
};

type DeleteAppointmentModalProps = {
    event: EnhancedEvent;
};

export function DeleteAppointmentModal({ event }: DeleteAppointmentModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    async function submit() {
        setSending(true);

        await fetch('/api/doctor/deleteAppointment', {
            method: 'POST',
            body: JSON.stringify({
                googleCalendarId: event.organizer?.email,
                googleEventId: event.id,
                mediciEventId: event.mediciEventId,
            }),
        })
            .then((response) => {
                setSending(false);
                handleError(response);
                revalidate();
                toggle(false);

                showNotification({
                    message: 'Consulta apagada com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });
            })
            .catch((error) => {
                switch (error) {
                    case GenericErrors.UNAUTHORIZED: {
                        navigate('/login');
                        break;
                    }
                    default: {
                        setErrorCount(errorCount + 1);

                        if (errorCount < 3) {
                            showNotification({
                                title: 'Algo de errado aconteceu',
                                message:
                                    'Por favor, volte a tentar apagar a consulta. Entretanto, já estamos em cima do assunto.',
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
                    }
                }
            });
    }

    return (
        <div>
            <IconTrash
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(true)}
            />
            <Modal
                opened={open}
                onClose={() => toggle(false)}
                closeOnClickOutside
                title={<div className="title">Apagar consulta</div>}
                centered
                zIndex={1000}
            >
                <div>Tem a certeza que quer apagar esta consulta?</div>
                <br />
                <div>
                    {event.attendees
                        ?.map((attendee) => attendee.displayName)
                        .join(', ')}
                </div>
                <div className="serviceDescription">
                    {event.start?.dateTime}
                </div>
                <br />
                <Button
                    onClick={submit}
                    loading={sending}
                    radius="md"
                    size="md"
                    color="red"
                >
                    Apagar
                </Button>
            </Modal>
        </div>
    );
}
