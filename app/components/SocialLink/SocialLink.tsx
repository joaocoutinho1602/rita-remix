import React from 'react';

import type { TablerIcon } from '@tabler/icons';
import { useViewportSize } from '@mantine/hooks';

import styles from './styles.css';

type SocialLinkProps = {
    url?: string;
    icon: TablerIcon;
    text: string;
    desktop?: boolean;
};

function openSocial(url: string) {
    window.open(url);
}

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export function SocialLink({
    url,
    icon: Icon,
    text,
    desktop,
}: SocialLinkProps) {
    const { width } = useViewportSize();

    return (
        <div
            className={
                desktop
                    ? 'desktopSocialLinksContainer'
                    : 'mobileSocialLinksContainer'
            }
            onClick={url ? () => openSocial(url) : undefined}
        >
            <Icon
                size={desktop ? 50 : Math.min(0.1 * width, 50)}
                strokeWidth={1}
            />
            <div
                className={
                    desktop ? 'desktopSocialLinksText' : 'mobileSocialLinksText'
                }
            >
                {text}
            </div>
        </div>
    );
}
