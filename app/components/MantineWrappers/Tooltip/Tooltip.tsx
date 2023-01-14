import { forwardRef } from 'react';

import { Tooltip } from '@mantine/core';

import type { TablerIcon } from '@tabler/icons';

export function WrappedTooltip({
    label,
    Icon,
}: {
    label: string;
    Icon: TablerIcon;
}) {
    const CustomComponent = ForwardReffedComponent(Icon);

    return (
        <Tooltip
            events={{ hover: true, focus: true, touch: true }}
            label={label}
            multiline
            width={220}
            withArrow
            transition="fade"
            transitionDuration={200}
        >
            <CustomComponent />
        </Tooltip>
    );
}

const ForwardReffedComponent = (Icon: TablerIcon) =>
    // eslint-disable-next-line react/display-name
    forwardRef<HTMLDivElement>((props, ref) => (
        <div ref={ref} {...props}>
            <Icon size={20} style={{ marginLeft: '0.5rem' }} />
        </div>
    ));
