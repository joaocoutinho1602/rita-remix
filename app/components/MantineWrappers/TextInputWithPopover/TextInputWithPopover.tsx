import { useNavigate } from '@remix-run/react';

import { Popover, Space, TextInput } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons';

type TextInputWithPopoverProps = {
    name: string;
    label: string;
    placeholder: string;
    type: React.HTMLInputTypeAttribute;
    opened: boolean;
    redirectTo: string;
    popOverText: string[];
};

export function TextInputWithPopover({
    name,
    label,
    placeholder,
    type,
    opened,
    redirectTo,
    popOverText,
    ...rest
}: TextInputWithPopoverProps) {
    const navigate = useNavigate();

    return (
        <Popover
            opened={opened}
            withArrow
            transition={'fade'}
            transitionDuration={200}
            position="right"
        >
            <Popover.Target>
                <TextInput
                    name={name}
                    label={label}
                    placeholder={placeholder}
                    type={type}
                    sx={(theme) => ({
                        marginBottom: theme.spacing.md,
                    })}
                    {...rest}
                />
            </Popover.Target>
            <Popover.Dropdown>
                <div
                    className="popoverDropdown"
                    onClick={() => navigate(redirectTo)}
                >
                    <IconAlertCircle color="#ff6b6b" />
                    <Space w="xs" />
                    <div className="popoverText">
                        {popOverText.map((text, index, array) => (
                            <div key={text}>
                                {index - 1 === array.length ? <br /> : null}
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </Popover.Dropdown>
        </Popover>
    );
}
