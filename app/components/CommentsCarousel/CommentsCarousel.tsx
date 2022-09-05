import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { Carousel } from '@mantine/carousel';
import { Card, Space } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { IconStar } from '@tabler/icons';

import { comments } from '~/utils/data';

type CommentsCarouselProps = {
    mobile?: boolean;
};

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
            sx={styles.carousel}
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
                    <Carousel.Slide key={id} sx={styles.slide}>
                        <Card withBorder shadow="sm" radius="md">
                            <div>
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                                <IconStar fill="#ffec99" strokeWidth={1.5} />
                            </div>
                            <div style={styles.commentText}>{text}</div>
                            <div style={styles.commentContainer}>
                                <div style={styles.commentType}>{type}</div>
                                <Space w="md" />
                                <div style={styles.commentDateLocation}>
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

const styles = {
    carousel: { maxWidth: '100vw', maxHeight: '100%' },
    slide: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentContainer: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'gray',
        marginTop: '0.5rem',
    },
    commentText: {
        textAlign: 'center' as const,
        fontSize: 'calc(1em + 0.25vw)',
    },
    commentType: {
        textAlign: 'left' as const,
    },
    commentDateLocation: {
        textAlign: 'right' as const,
    },
};
