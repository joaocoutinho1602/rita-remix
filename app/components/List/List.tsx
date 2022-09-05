import React from 'react';

import styles from './styles.css';

type ListInterface = {
    data: string[];
    textStyles?: { [key: string]: number | string };
    withCheck?: boolean;
};

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export function List({ data, textStyles, withCheck }: ListInterface) {
    return (
        <ul className={withCheck ? 'customListWithCheck' : 'customList'}>
            {data.map((item, index) => (
                <li key={index + item} style={textStyles}>
                    {item}
                </li>
            ))}
        </ul>
    );
}
