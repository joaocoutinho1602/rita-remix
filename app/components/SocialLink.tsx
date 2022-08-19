import React from 'react';

import type { TablerIcon } from '@tabler/icons';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';

type SocialLinkProps = {
    url?: string;
    icon: TablerIcon;
    text: string;
    containerStyles: { [key: string]: string | number }
    textStyles: { [key: string]: string | number }
};

function openSocial(url: string) {
    window.open(url);
}

export function SocialLink({
    url,
    icon: Icon,
    text,
    containerStyles,
    textStyles,
}: SocialLinkProps) {
    const isDesktop = useMediaQuery('(min-width: 1224px)', false);
    const { width } = useViewportSize();

    return (
        <div
            style={containerStyles}
            onClick={url ? () => openSocial(url) : undefined}
        >
                <Icon size={isDesktop ? 50 : Math.min(0.1 * width, 50)} strokeWidth={1} />
            <div style={textStyles}>{text}</div>
        </div>
    );
}
