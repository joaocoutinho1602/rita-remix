import dayjs from 'dayjs';

export const makeLast = (
    array: { [key: string]: any }[],
    key: string,
    value: any
) => {
    let extractedValue;
    let manipulatableArray: { [key: string]: any }[] = [];
    Array.prototype.push.apply(manipulatableArray, array);

    for (let i = 0; i < manipulatableArray.length; i++) {
        if (manipulatableArray[i][key] === value) {
            extractedValue = manipulatableArray[i];
            manipulatableArray.splice(i, 1);
            break;
        }
    }

    const result = manipulatableArray.concat([extractedValue]);

    return result;
};

export const prettyJSON = (
    object: { [key: string]: any } | any[] | undefined | null
) => JSON.stringify(object || {}, null, 4);

export function sanitisePrismaObject(data: any) {
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const keys = Object.keys(data[i]);
            keys.forEach((key) => {
                if (data[i][key] instanceof Date) {
                    data[i][key] = dayjs(data[i][key]).toISOString();
                } else if (typeof data[i][key] === 'object') {
                    sanitisePrismaObject(data[i][key]);
                }
            });
        }
    } else {
        const keys = Object.keys(data);
        keys.forEach((key) => {
            if (data[key] instanceof Date) {
                data[key] = dayjs(data[key]).toISOString();
            } else if (typeof data[key] === typeof Object) {
                sanitisePrismaObject(data[key]);
            }
        });
    }
}

export function mySanitise(data: any) {
    if (Array.isArray(data)) {
        return data.reduce((acc, curVal) => {
            const keys = Object.keys(curVal);
            keys.forEach((key) => {
                if (curVal[key] instanceof Date) {
                    acc[key] = dayjs(curVal[key]).toISOString();
                } else if (typeof curVal[key] === 'object') {
                    acc[key] = mySanitise(curVal[key]);
                }
            });
            return acc;
        }, []);
    } else {
        const result: { [key: string]: any } = {};
        const keys = Object.keys(data);
        keys.forEach((key) => {
            if (data[key] instanceof Date) {
                result[key] = dayjs(data[key]).toISOString();
            } else if (typeof data[key] === 'object') {
                result[key] = mySanitise(data[key]);
            }
        });
        return result;
    }
}
