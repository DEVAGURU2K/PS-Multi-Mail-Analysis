import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PropertyState {
    items: any[];
    mailboxes: any[];
    stats: any | null;
    loading: boolean;
}

const initialState: PropertyState = {
    items: [],
    mailboxes: [],
    stats: null,
    loading: false,
};

const propertySlice = createSlice({
    name: 'properties',
    initialState,
    reducers: {
        setProperties: (state, action: PayloadAction<any[]>) => {
            state.items = action.payload;
        },
        setMailboxes: (state, action: PayloadAction<any[]>) => {
            state.mailboxes = action.payload;
        },
        setStats: (state, action: PayloadAction<any>) => {
            state.stats = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setProperties, setStats, setLoading } = propertySlice.actions;
export default propertySlice.reducer;
