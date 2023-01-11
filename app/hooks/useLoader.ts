import { useLocation, useNavigate } from '@remix-run/react';

export const useLoader = (destination?: string) => {
    const location = useLocation();

    const navigate = useNavigate();

    return () => {
        navigate(destination ?? location);
    };
};
