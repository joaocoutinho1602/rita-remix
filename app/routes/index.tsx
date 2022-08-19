import { useState } from 'react';

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

export default function Index() {
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
                <div>
                    <div style={classes.desktop.headerNameContainer}>
                        <div style={classes.desktop.headerName}>Rita</div>
                        <div style={classes.desktop.headerName}>Meira</div>
                    </div>
                    <div style={classes.desktop.headerPhotoCVContainer}>
                        <div style={classes.desktop.headerPhotoContainer}>
                            <img
                                style={classes.desktop.headerPhoto}
                                height={25 * 16}
                                width={25 * 16}
                                src={Portrait}
                                alt="Rita Meira"
                            />
                        </div>
                        <div
                            style={
                                classes.desktop.headerPersonalCVButtonContainer
                            }
                        >
                            <div
                                style={
                                    classes.desktop.headerPersonalCVContainer
                                }
                            >
                                <div
                                    style={
                                        classes.desktop.headerPersonalTextBold
                                    }
                                >
                                    Consultas Presenciais ou Online
                                </div>
                                <div
                                    style={
                                        classes.desktop.headerPersonalTextBold
                                    }
                                >
                                    <img
                                        alt="pin"
                                        src="/images/svg/location.svg"
                                        height={30}
                                        width={30}
                                    />
                                    Viana do Castelo / Braga
                                </div>
                                <div
                                    style={
                                        classes.desktop.headerPersonalTextBold
                                    }
                                >
                                    Tratamento Psicológico com Jovens e Adultos
                                </div>
                                <div
                                    style={
                                        classes.desktop.headerPersonalTextBold
                                    }
                                >
                                    Acompanhamento Individual e de Casal
                                </div>
                                <br />
                                <div style={classes.desktop.headerCVList}>
                                    <List
                                        data={cv}
                                        textStyles={
                                            classes.desktop.headerCVText
                                        }
                                    />
                                </div>
                            </div>
                            <ContactModal />
                        </div>
                    </div>
                    <div style={classes.desktop.servicesContainer}>
                        <div style={classes.desktop.servicesHeader}>
                            Serviços
                        </div>
                        <div style={classes.desktop.servicesListContainer}>
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
                                            style={
                                                classes.desktop.servicesListItem
                                            }
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
                                                style={
                                                    classes.desktop.servicesList
                                                }
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
                <div>
                    <div style={classes.mobile.headerContainer}>
                        <div style={classes.mobile.headerNameContainer}>
                            <div style={classes.mobile.headerName}>Rita</div>
                            <div style={classes.mobile.headerName}>Meira</div>
                        </div>
                        <div style={classes.mobile.headerPhotoContainer}>
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
                        </div>
                    </div>
                    <div style={classes.mobile.personalContainer}>
                        <div style={classes.mobile.personalText}>
                            Consultas Presenciais ou Online
                        </div>
                        <div style={classes.mobile.personalText}>
                            <img
                                alt="pin"
                                src="/images/svg/location.svg"
                                height={30}
                                width={30}
                            />
                            Viana do Castelo / Braga
                        </div>
                        <div style={classes.mobile.modalButtonContainer}>
                            <ContactModal />
                        </div>
                        <div style={classes.mobile.personalText}>
                            Tratamento Psicológico com Jovens e Adultos
                        </div>
                        <div style={classes.mobile.personalText}>
                            Acompanhamento Individual e de Casal
                        </div>
                        <List
                            data={cv}
                            textStyles={classes.mobile.personalCVListItem}
                        />
                    </div>
                    <div style={classes.mobile.servicesContainer}>
                        <div style={classes.mobile.servicesHeader}>
                            Serviços
                        </div>
                        <div style={classes.mobile.servicesListContainer}>
                            {services.map(
                                ({ title, image, descriptions }, index) => (
                                    <div
                                        key={index + title}
                                        style={classes.mobile.serviceContainer}
                                    >
                                        <div
                                            style={
                                                classes.mobile
                                                    .servicesImageContainer
                                            }
                                        >
                                            <img
                                                style={
                                                    classes.mobile.servicesImage
                                                }
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
                                        <div
                                            style={
                                                classes.mobile
                                                    .serviceTextContainer
                                            }
                                        >
                                            <div
                                                style={
                                                    classes.mobile
                                                        .serviceTextTitle
                                                }
                                            >
                                                {title}
                                            </div>
                                            <List
                                                data={descriptions}
                                                textStyles={
                                                    classes.mobile
                                                        .serviceTextListItem
                                                }
                                            />
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <div style={classes.mobile.contactsContainer}>
                        <div style={classes.mobile.contactsHeader}>
                            Contactos
                        </div>
                        <div style={classes.mobile.contactsBodyContainer}>
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
                        </div>
                        <div style={classes.mobile.contactsMapContainer}>
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
        headerNameContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            justifyContent: 'center',
            marginBottom: '-9rem',
            marginTop: '-7rem',
        },
        headerName: {
            fontSize: 300,
            marginRight: 48,
        },
        headerCVList: { marginBottom: 16 },
        headerPersonalTextBold: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: 20,
        },
        headerCVText: { fontSize: 20 },
        headerPhotoCVContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
        },
        headerPhotoContainer: { marginRight: 36 },
        headerPhoto: {
            borderRadius: 50000,
        },
        headerPersonalCVButtonContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
        },
        headerPersonalCVContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
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
        headerContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
        },
        headerNameContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            marginTop: '-0rem', // -3rem
            marginBottom: '-0rem', // -5rem
        },
        headerName: {
            fontFamily: 'Signature',
            fontSize: 'calc(15vw)',
            marginRight: '1rem',
            marginLeft: '1rem',
        },
        headerPhotoContainer: {
            paddingLeft: '1rem',
            paddingRight: '1rem',
        },
        headerPhoto: {
            borderRadius: 50000,
            objectFit: 'cover' as const,
        },
        personalText: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignText: 'center',
            fontWeight: 'bold',
            fontSize: 'calc(1em + 1vw)',
        },
        modalButtonContainer: {
            margin: 10,
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
            marginBottom: 10,
            '&:not(:lastOfType)': {
                marginBottom: '1rem',
            },
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
        serviceTextContainer: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            flexDirection: 'column' as const,
            justifyContent: 'center',
            fontSize: 22,
        },
        serviceTextTitle: {
            fontSize: 'calc(1em + 1vw)',
            fontWeight: 'bold',
            textAlign: 'center' as const,
        },
        serviceTextListItem: {
            fontSize: 'calc(0.7em + 1vw)',
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
            padding: '1rem',
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
        },
        switch: {
            marginLeft: 10,
            marginRight: 10,
            color: '#e9ecef',
        },
    },
};
