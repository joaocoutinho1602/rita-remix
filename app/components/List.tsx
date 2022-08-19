import React from 'react';

type ListInterface = {
    data: string[];
    textStyles?: { [key: string]: number | string };
    bulletPoint?: string;
};

export function List({
    data,
    textStyles,
    bulletPoint = '/images/svg/check.svg',
}: ListInterface) {
    return (
        <ul
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: 'column',
                justifyContent: 'center',
                whiteSpace: 'normal',
                listStyleImage: `url("${bulletPoint}")`,
                listStylePosition: 'inside',
                /**
                 * These are set to zero due to Chrome's
                 * user agent stylesheets
                 */
                margin: 0,
                padding: 0,
            }}
        >
            {data.map((item, index) => (
                <li key={index + item} style={textStyles}>
                    {item}
                </li>
            ))}
        </ul>
    );
}
