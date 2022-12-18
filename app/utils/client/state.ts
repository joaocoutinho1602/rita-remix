import create from 'zustand';

type State = {
    navigating: boolean;
};

const initialState: State = {
    navigating: false,
};

type Actions = {
    setNavigating: (navigating: boolean) => void;
};

type Store = State & Actions;

const useStore = create<Store>((set) => ({
    ...initialState,
    setNavigating: (navigating) => {
        set({ navigating });
    },
}));

export { useStore };

export type { Store };
