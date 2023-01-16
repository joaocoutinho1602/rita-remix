import { useState } from 'react';

import type { Location } from '@prisma/client';

import { Button, Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconTrash, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { handleError } from '~/utils/client';

type DeleteLocationModalProps = {
    locationId: string;
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
};

export function DeleteLocationModal({
    locationId,
    locations,
    setLocations,
}: DeleteLocationModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    async function submit(e: CustomFormEvent) {
        setSending(true);

        await fetch(`/api/doctor/deleteLocation?locationId=${locationId}`, {
            method: 'POST',
        })
            .then((response) => {
                handleError(response);

                const newLocations: Location[] = locations.filter(
                    ({ id }) => id !== locationId
                );
                setLocations(newLocations);
                toggle(false);

                showNotification({
                    message: 'Localização apagada com sucesso',
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
                setSending(false);
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
                title={<div className="title">Apagar localização</div>}
                centered
                zIndex={1000}
            >
                <div>Tem a certeza que quer apagar esta localização?</div>
                <br />
                {locations
                    .filter(({ id }) => id === locationId)
                    .map(({ alias, address }) => (
                        <div key={alias}>
                            <div className="alias">{alias}</div>
                            <div className="address">{address}</div>
                        </div>
                    ))}
                <br />
                <div className="uelele">
                    <Button
                        onClick={submit}
                        loading={sending}
                        radius="md"
                        size="md"
                        color="red"
                    >
                        Apagar
                    </Button>
                    <Button
                        onClick={submit}
                        loading={sending}
                        radius="md"
                        size="md"
                        color="gray"
                    >
                        Cancelar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
