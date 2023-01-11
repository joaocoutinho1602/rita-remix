import React, { useEffect, useState } from 'react';

import type { LinksFunction } from '@remix-run/node';

import dayjs from 'dayjs';

import { Carousel } from '@mantine/carousel';
import { Card, Space } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { IconStar } from '@tabler/icons';

import styles from './styles.css';
import { comments } from '~/utils/client/data';

type CommentsCarouselProps = {
    mobile?: boolean;
};

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }];

export function CommentsCarousel({ mobile }: CommentsCarouselProps) {
    const [, setSlideWidth] = useState(mobile ? 310 : 600);

    const { width } = useViewportSize();

    useEffect(() => {
        /**
         * when useViewPortSize runs for the first time it doesn't get the correct width
         */
        const actualWidth = window.screen.width;

        setSlideWidth(Math.min(0.8 * actualWidth, 600));
    }, [width]);

    return (
        <Carousel
            sx={classes.carousel}
            align="center"
            slideSize="80%"
            slideGap="md"
            mx="auto"
            withControls={!mobile}
            withIndicators={!mobile}
            loop
            styles={{
                slide: { maxWidth: 400 },
            }}
        >
            {comments.map(({ id, created_at, location, text, type }) => {
                const date = dayjs(created_at).format('DD/MM/YYYY');

                return (
                    <Carousel.Slide key={id} sx={classes.slide}>
                        <Card withBorder shadow="sm" radius="md">
                            <div>
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                            </div>
                            <div className="commentText">{text}</div>
                            <div className="commentContainer">
                                <div className="commentType">{type}</div>
                                <Space w="md" />
                                <div className="commentDateLocation">
                                    {`${date}, ${location}`}
                                </div>
                            </div>
                        </Card>
                    </Carousel.Slide>
                );
            })}
        </Carousel>
    );
}

const classes = {
    carousel: { maxWidth: '100vw', maxHeight: '100%' },
    slide: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
    },
};
