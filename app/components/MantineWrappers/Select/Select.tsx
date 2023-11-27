import React, { forwardRef } from 'react';

import { Group, Avatar, Select, Text } from '@mantine/core';

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
    image?: string;
    label: string;
    description?: string;
}

// eslint-disable-next-line react/display-name
const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ image, label, description, ...others }: ItemProps, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                {image && image.length > 0 ? <Avatar src={image} /> : null}
                <div>
                    <Text size="sm">{label}</Text>
                    <Text size="xs" style={{ opacity: 0.7 }}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    )
);

type SelectData = {
    image?: string;
    label: string;
    value: string;
    description?: string;
}[];

type WrappedSelectProps = {
    label: string;
    placeholder?: string;
    data: SelectData;
    searchable?: boolean;
    value: string | null;
    onChange: React.Dispatch<React.SetStateAction<string | null>>;
};

export function WrappedSelect({
    label,
    placeholder = '',
    data,
    searchable = false,
    value,
    onChange,
}: WrappedSelectProps) {
    return (
        <Select
            value={value}
            onChange={onChange}
            label={label}
            placeholder={placeholder}
            itemComponent={SelectItem}
            data={data}
            searchable={searchable}
            maxDropdownHeight={400}
            nothingFound="Vazio"
            filter={(value, item) =>
                (item.label || '')
                    .toLowerCase()
                    .includes(value.toLowerCase().trim()) ||
                item.description
                    .toLowerCase()
                    .includes(value.toLowerCase().trim())
            }
        />
    );
}
