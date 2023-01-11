import { useState } from 'react';

import { Affix, Switch, Transition } from '@mantine/core';
import {
    useMediaQuery,
    useViewportSize,
    useWindowScroll,
} from '@mantine/hooks';

import { IconArrowUpCircle } from '@tabler/icons';
import { Portrait, PortraitSmall } from 'public/images';

import {
    CommentsCarousel,
    CommentsCarouselLinks,
    ContactModal,
    ContactModalLinks,
    CustomMap,
    SocialLink,
    SocialLinkLinks,
} from '~/components';

import { cv, services, socials } from '~/utils/client/data';

import styles from '../styles/root.css';
import { useLoader } from '~/hooks/useLoader';

export function links() {
    return [
        ...CommentsCarouselLinks(),
        ...ContactModalLinks(),
        ...SocialLinkLinks(),
        { rel: 'stylesheet', href: styles },
    ];
}

export default function Index() {
    const reload = useLoader();

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
                <div className="desktopContainer">
                    <div className="desktopHeaderNameContainer">
                        <div onClick={reload} className="desktopHeaderName">
                            Rita
                        </div>
                        <div className="desktopHeaderName">Meira</div>
                    </div>
                    <div className="desktopHeaderPhotoCVContainer">
                        <img
                            className="desktopHeaderPhoto"
                            height={400}
                            width={400}
                            src={Portrait}
                            alt="Rita Meira"
                        />
                        <div className="desktopHeaderCVButtonContainer">
                            <div className="desktopHeaderTextBold">
                                Consultas de Psicologia Presenciais ou Online
                                <div className="desktopLocationContainer">
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
                            <div className="desktopHeaderCVList">
                                <ul className="checkedList">
                                    {cv.map((item, index) => (
                                        <li key={index + item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="desktopContactButtonContainer">
                                <ContactModal desktop />
                            </div>
                        </div>
                    </div>
                    <div className="desktopCommentsContainer">
                        <div className="desktopCommentsHeader">
                            O que me dizem os meus clientes
                        </div>
                        <CommentsCarousel />
                    </div>
                    <div className="desktopServicesContainer">
                        <div className="desktopServicesHeader">Serviços</div>
                        {services.map(
                            ({ title, image, descriptions }, index) => (
                                <div
                                    key={index}
                                    className="desktopServicesListItemContainer"
                                >
                                    {index % 2 === 0 ? (
                                        <div className="desktopServicesImageContainerLeft">
                                            <img
                                                className="desktopServicesImage"
                                                alt={`service_${index}`}
                                                src={image}
                                                width={512}
                                                height={288}
                                            />
                                        </div>
                                    ) : null}
                                    <div className="desktopServicesListItem">
                                        <div className="desktopServicesListItemTitle">
                                            {title}
                                        </div>
                                        <div className="desktopServicesList">
                                            <ul className="checkedList">
                                                {descriptions.map(
                                                    (item, index) => (
                                                        <li key={index + item}>
                                                            {item}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                    {index % 2 === 1 ? (
                                        <div className="desktopServicesImageContainerRight">
                                            <img
                                                className="desktopServicesImage"
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
                    <div className="desktopContactsContainer">
                        <div className="desktopContactsHeader">Contactos</div>
                        <div className="desktopContactsMapHeaderContainer">
                            <div
                                className="desktopContactsMapHeaderText"
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
                                className="desktopContactsMapHeaderText"
                                onClick={() => doToggle(true)}
                            >
                                Viana do Castelo
                            </div>
                        </div>
                        <div className="desktopContactsBodyContainer">
                            <div className="desktopContactsMapContainer">
                                <CustomMap mobile={false} toggle={toggle} />
                            </div>
                            <div className="desktopContactsSocialsContainer">
                                {socials.map(({ image, url, text }) => (
                                    <SocialLink
                                        key={text}
                                        icon={image}
                                        url={url}
                                        text={text}
                                        desktop
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mobileContainer">
                    <div className="mobileHeaderNameContainer">
                        <div className="mobileHeaderName">Rita</div>
                        <div className="mobileHeaderName">Meira</div>
                    </div>
                    <img
                        /**
                         * 1rem = 16px, thus height and width = 20rem * 16
                         */
                        height={Math.min(320, width * 0.67)}
                        width={Math.min(320, width * 0.67)}
                        className="mobileHeaderPhoto"
                        src={PortraitSmall}
                        alt="Rita Meira"
                    />
                    <div className="mobilePersonalText">
                        Consultas de Psicologia
                        <br />
                        <img
                            alt="pin"
                            src="/images/svg/location.svg"
                            height={30}
                            width={30}
                        />
                        Viana do Castelo / Braga
                        <br />
                        Consultas online
                    </div>
                    <ContactModal />
                    <div className="mobilePersonalContainer">
                        <div className="mobilePersonalText">
                            Tratamento Psicológico com Jovens e Adultos
                            <br />
                            Acompanhamento Individual e de Casal
                        </div>
                        <ul className="checkedList">
                            {cv.map((item, index) => (
                                <li
                                    key={index + item}
                                    className="mobilePersonalListItem"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mobileCommentsContainer">
                        <div className="mobileCommentsHeader">
                            O que me dizem os meus clientes
                        </div>
                        <CommentsCarousel mobile />
                    </div>
                    <div className="mobileServicesHeader">Serviços</div>
                    {services.map(({ title, image, descriptions }, index) => (
                        <div
                            key={index + title}
                            className="mobileServiceContainer"
                        >
                            <div className="mobileServicesImageContainer">
                                <img
                                    className="mobileServicesImage"
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
                            <div className="mobileServiceTextTitle">
                                {title}
                            </div>
                            <ul className="checkedList">
                                {descriptions.map((item, index) => (
                                    <li
                                        key={item}
                                        className="mobileServiceTextBody"
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="mobileContactsHeader">Contactos</div>
                    {socials.map(({ image, url, text }) => (
                        <SocialLink
                            key={text}
                            icon={image}
                            url={url}
                            text={text}
                        />
                    ))}
                    <div className="mobileContactsMapHeader">
                        <div
                            className="mobileContactsMapHeaderText"
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
                            className="mobileContactsMapHeaderText"
                            onClick={() => doToggle(true)}
                        >
                            Viana do Castelo
                        </div>
                    </div>
                    <div className="mobileContactsMapBody">
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
