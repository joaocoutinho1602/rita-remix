import { useState } from 'react';

import { json } from '@remix-run/node';
import type { LoaderArgs } from '@remix-run/node';
// import { useLoaderData } from '@remix-run/react';

import { Affix, Switch, Transition } from '@mantine/core';
import {
    useMediaQuery,
    useViewportSize,
    useWindowScroll,
} from '@mantine/hooks';

import { IconArrowUpCircle } from '@tabler/icons';
import { Portrait, PortraitSmall } from 'public/images';
import { cv, services, socials } from 'public/utils/data';

import { ContactModal, CustomMap, List, SocialLink } from '~/components';

export async function loader(args: LoaderArgs) {
    return json({ defaultWidth: 1234 });
}

export default function Index() {
    // const data = useLoaderData<typeof loader>();
    const [toggle, setToggle] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 1224px)', false);

    const { width } = useViewportSize();

    const [scroll, scrollTo] = useWindowScroll();

    function doToggle(value: boolean | undefined = undefined): void {
        setToggle(value === undefined ? !toggle : value);
    }

    return (
        <div>
            {isDesktop ? (
                <div style={classes.desktop.container}>
                    <div style={classes.desktop.headerNameContainer}>
                        <div style={classes.desktop.headerName}>Rita</div>
                        <div style={classes.desktop.headerName}>Meira</div>
                    </div>
                    <div style={classes.desktop.headerPhotoCVContainer}>
                        <img
                            style={classes.desktop.headerPhoto}
                            height={400}
                            width={400}
                            src={Portrait}
                            alt="Rita Meira"
                        />
                        <div style={classes.desktop.headerCVButtonContainer}>
                            <div style={classes.desktop.headerTextBold}>
                                Consultas Presenciais ou Online
                                <div style={classes.desktop.locationContainer}>
                                    <img
                                        alt="pin"
                                        src="/images/svg/location.svg"
                                        height={30}
                                        width={30}
                                    />
                                    Viana do Castelo / Braga
                                </div>
                                Tratamento Psicológico com Jovens e Adultos
                                <br />
                                Acompanhamento Individual e de Casal
                            </div>
                            <div style={classes.desktop.headerCVList}>
                                <List data={cv} />
                            </div>
                            <div style={classes.desktop.contactButtonContainer}>
                                <ContactModal
                                    buttonStyles={
                                        classes.desktop.contactModalButton
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div style={classes.desktop.servicesContainer}>
                        <div style={classes.desktop.servicesHeader}>
                            Serviços
                        </div>
                        {services.map(
                            ({ title, image, descriptions }, index) => (
                                <div
                                    key={index}
                                    style={
                                        classes.desktop
                                            .servicesListItemContainer
                                    }
                                >
                                    {index % 2 === 0 ? (
                                        <div
                                            style={
                                                classes.desktop
                                                    .servicesImageContainerLeft
                                            }
                                        >
                                            <img
                                                style={
                                                    classes.desktop
                                                        .servicesImage
                                                }
                                                alt={`service_${index}`}
                                                src={image}
                                                width={512}
                                                height={288}
                                            />
                                        </div>
                                    ) : null}
                                    <div
                                        style={classes.desktop.servicesListItem}
                                    >
                                        <div
                                            style={
                                                classes.desktop
                                                    .servicesListItemTitle
                                            }
                                        >
                                            {title}
                                        </div>
                                        <div
                                            style={classes.desktop.servicesList}
                                        >
                                            <List data={descriptions} />
                                        </div>
                                    </div>
                                    {index % 2 === 1 ? (
                                        <div
                                            style={
                                                classes.desktop
                                                    .servicesImageContainerRight
                                            }
                                        >
                                            <img
                                                style={
                                                    classes.desktop
                                                        .servicesImage
                                                }
                                                alt={`service_${index}`}
                                                src={image}
                                                width={512}
                                                height={288}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            )
                        )}
                    </div>
                    <div style={classes.desktop.contactsContainer}>
                        <div style={classes.desktop.contactsHeader}>
                            Contactos
                        </div>
                        <div style={classes.desktop.contactsMapHeaderContainer}>
                            <div
                                style={classes.desktop.contactsMapHeaderText}
                                onClick={() => doToggle(false)}
                            >
                                Braga
                            </div>
                            <Switch
                                color="offWhite"
                                size="md"
                                checked={toggle}
                                onChange={() => doToggle()}
                                sx={{
                                    marginLeft: '0.5rem',
                                    marginRight: '0.5rem',
                                }}
                            />
                            <div
                                style={classes.desktop.contactsMapHeaderText}
                                onClick={() => doToggle(true)}
                            >
                                Viana do Castelo
                            </div>
                        </div>
                        <div style={classes.desktop.contactsBodyContainer}>
                            <div style={classes.desktop.contactsMapContainer}>
                                <CustomMap mobile={false} toggle={toggle} />
                            </div>
                            <div
                                style={classes.desktop.contactsSocialsContainer}
                            >
                                {socials.map(({ image, url, text }) => (
                                    <SocialLink
                                        key={text}
                                        icon={image}
                                        url={url}
                                        text={text}
                                        containerStyles={
                                            classes.desktop
                                                .socialContainerStyles
                                        }
                                        textStyles={
                                            classes.desktop.socialTextStyles
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={classes.mobile.container}>
                    <div style={classes.mobile.headerNameContainer}>
                        <div style={classes.mobile.headerName}>Rita</div>
                        <div style={classes.mobile.headerName}>Meira</div>
                    </div>
                    <img
                        /**
                         * 1rem = 16px, thus height and width = 20rem * 16
                         */
                        height={Math.min(320, width * 0.67)}
                        width={Math.min(320, width * 0.67)}
                        style={classes.mobile.headerPhoto}
                        src={PortraitSmall}
                        alt="Rita Meira"
                    />
                    <div style={classes.mobile.personalText}>
                        Consultas Presenciais ou Online
                        <br />
                        <img
                            alt="pin"
                            src="/images/svg/location.svg"
                            height={30}
                            width={30}
                        />
                        Viana do Castelo / Braga
                    </div>
                    <ContactModal
                        buttonStyles={classes.mobile.contactModalButton}
                    />
                    <div style={classes.mobile.personalText}>
                        Tratamento Psicológico com Jovens e Adultos
                        <br />
                        Acompanhamento Individual e de Casal
                    </div>
                    <List
                        data={cv}
                        textStyles={classes.mobile.personalCVListItem}
                    />
                    <div style={classes.mobile.servicesHeader}>Serviços</div>
                    {services.map(({ title, image, descriptions }, index) => (
                        <div
                            key={index + title}
                            style={classes.mobile.serviceContainer}
                        >
                            <div style={classes.mobile.servicesImageContainer}>
                                <img
                                    style={classes.mobile.servicesImage}
                                    src={image}
                                    alt={`service_${index}`}
                                    width={Math.min(
                                        512,
                                        (512 / 288 - 1) * width
                                    )}
                                    height={Math.min(
                                        288,
                                        (1 - 288 / 512) * width
                                    )}
                                />
                            </div>
                            <div style={classes.mobile.serviceTextTitle}>
                                {title}
                            </div>
                            <List
                                data={descriptions}
                                textStyles={classes.mobile.serviceTextListItem}
                            />
                        </div>
                    ))}
                    <div style={classes.mobile.contactsHeader}>Contactos</div>
                    {socials.map(({ image, url, text }) => (
                        <SocialLink
                            key={text}
                            icon={image}
                            url={url}
                            text={text}
                            containerStyles={
                                classes.mobile.socialContainerStyles
                            }
                            textStyles={classes.mobile.socialTextStyles}
                        />
                    ))}
                    <div style={classes.mobile.contactsMapHeader}>
                        <div
                            style={classes.mobile.contactsMapHeaderText}
                            onClick={() => doToggle(false)}
                        >
                            Braga
                        </div>
                        <Switch
                            color="offWhite"
                            size="md"
                            checked={toggle}
                            onChange={() => doToggle()}
                            style={{
                                marginLeft: 10,
                                marginRight: 10,
                            }}
                        />
                        <div
                            style={classes.mobile.contactsMapHeaderText}
                            onClick={() => doToggle(true)}
                        >
                            Viana do Castelo
                        </div>
                    </div>
                    <div style={classes.mobile.contactsMapBody}>
                        <CustomMap mobile toggle={toggle} />
                    </div>
                </div>
            )}
            <Affix position={{ bottom: '3vh', right: '3vw' }}>
                <Transition transition="fade" mounted={scroll.y > 50}>
                    {(transitionStyles) => (
                        <IconArrowUpCircle
                            style={transitionStyles}
                            size={isDesktop ? 40 : 0.1 * width}
                            onClick={() => scrollTo({ y: 0 })}
                        />
                    )}
                </Transition>
            </Affix>
        </div>
    );
}

const classes = {
    desktop: {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center' as const,
        },
        headerNameContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            justifyContent: 'center',
            marginBottom: '-8rem',
            fontFamily: 'var(--font-signature)',
            fontSize: 300,
            marginTop: '-6rem',
        },
        headerName: {
            marginRight: 48,
        },
        headerPhotoCVContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            marginTop: 16,
        },
        headerPhoto: {
            marginRight: 36,
            borderRadius: 50000,
        },
        headerCVButtonContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            justifyItems: 'center',
            alignItems: 'left',
            fontSize: 20,
            textAlign: 'left' as const,
        },
        headerTextBold: {
            display: 'flex',
            flexDirection: 'column' as const,
            justifyItems: 'flex-start',
            fontWeight: 'bold',
            marginLeft: '0rem',
        },
        locationContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
        },
        headerCVList: {
            marginBottom: '1rem',
            marginTop: '1rem',
            fontSize: 'calc(1em + 0.2vw)',
        },
        contactButtonContainer: {
            display: 'flex',
            alignSelf: 'center',
        },
        contactModalButton: {
            height: '4rem',
            fontSize: 'calc(1em + 1vw)',
        },
        servicesContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginTop: 36,
        },
        servicesHeader: {
            fontSize: 42,
            fontWeight: 'bold',
            marginBottom: 24,
        },
        servicesListContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyItems: 'center',
        },
        servicesListItemContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 48,
        },
        servicesImageContainerLeft: { marginRight: 16 },
        servicesImage: {
            borderRadius: 16,
        },
        servicesListItem: {
            display: 'flex',
            flexDirection: 'column' as const,
            fontSize: 20,
        },
        servicesListItemTitle: {
            fontSize: 26,
            fontWeight: 'bold',
        },
        servicesList: {
            marginLeft: 16,
            textAlign: 'left' as const,
        },
        servicesImageContainerRight: { marginLeft: 16 },
        contactsContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            paddingBottom: 48,
        },
        contactsHeader: {
            fontSize: 42,
            fontWeight: 'bold',
        },
        socialContainerStyles: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            justifyItems: 'center',
            padding: '1rem',
            fontSize: 24,
            cursor: 'pointer',
        },
        socialTextStyles: {
            paddingLeft: '0.5rem',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
        },
        contactsMapHeaderContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            marginTop: 16,
            marginBottom: 16,
        },
        contactsMapHeaderText: { fontSize: 20 },
        contactsBodyContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
        },
        contactsMapContainer: {
            marginRight: 16,
            cursor: 'pointer',
        },
        contactsSocialsContainer: {
            textAlign: 'left' as const,
            fontSize: 26,
        },
    },
    mobile: {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            marginLeft: '1rem',
            marginRight: '1rem',
        },
        headerContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
        },
        headerNameContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            marginTop: '-3rem', // -3rem
            marginBottom: '-4rem', // -5rem
            fontFamily: 'var(--font-signature)',
            fontSize: 'calc(5em + 15vw)',
        },
        headerName: {
            marginLeft: '1rem',
        },
        headerPhoto: {
            borderRadius: 50000,
            objectFit: 'cover' as const,
        },
        contactModalButton: {
            height: '3rem',
            fontSize: 'calc(1em + 1vw)',
        },
        personalText: {
            fontWeight: 'bold',
            fontSize: 'calc(1em + 1vw)',
        },
        personalContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyItems: 'center',
            marginLeft: '1rem',
            marginRight: '1rem',
            marginBottom: '1rem',
            textAlign: 'center' as const,
        },
        personalCVListItem: {
            fontSize: 'calc(1em + 1vw)',
            textAlign: 'center' as const,
        },
        servicesContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginBottom: '1rem',
        },
        servicesHeader: {
            fontSize: 'calc(2em + 1vw)',
            fontWeight: 'bold',
            marginTop: '1rem',
            marginBottom: '1rem',
        },
        servicesListContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyItems: 'center',
        },
        serviceContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: '1rem',
            marginRight: '1rem',
            marginBottom: 20,
        },
        servicesImageContainer: {
            width: '80vw',
            height: '45vw',
            maxWidth: '32rem',
            maxHeight: '18rem',
            marginBottom: 10,
        },
        servicesImage: {
            borderRadius: 16,
        },
        serviceTextTitle: {
            fontSize: 'calc(1.1em + 1vw)',
            fontWeight: 'bold',
            textAlign: 'center' as const,
        },
        serviceTextListItem: {
            fontSize: 'calc(0.8em + 1vw)',
            textAlign: 'left' as const,
        },
        contactsContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            paddingBottom: 48,
        },
        contactsHeader: {
            fontSize: 'calc(2em + 1vw)',
            fontWeight: 'bold',
            marginTop: '1rem',
            marginBottom: '0.5rem',
        },
        contactsBodyContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            textAlign: 'left' as const,
            fontSize: 'calc(1em + 1vw)',
        },
        socialContainerStyles: {
            display: 'flex',
            displayDirection: 'row',
            alignItems: 'center',
            justifyItems: 'center',
            padding: '0.5rem',
            fontSize: 'calc(0.6em + 1vw)',
            cursor: 'pointer',
        },
        socialTextStyles: {
            paddingLeft: '0.5rem',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            fontSize: 'calc(0.75em + 1.5vw)',
        },
        contactsMapContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignContent: 'center',
            justifyContent: 'center',
        },
        contactsMapHeader: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10,
            marginBottom: 10,
        },
        contactsMapHeaderText: {
            fontSize: 'calc(0.5em + 3vw)',
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
        },
        contactsMapBody: {
            cursor: 'pointer',
            display: 'flex',
            alignContent: 'center',
            justifyContent: 'center',
            marginBottom: '3rem',
        },
        switch: {
            marginLeft: 10,
            marginRight: 10,
            color: '#e9ecef',
        },
    },
};
