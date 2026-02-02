import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    token: string | null;
    user: any | null;
    loading: boolean;
}

const initialState: AuthState = {
    token: null,
    user: null,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setUser: (state, action: PayloadAction<any | null>) => {
            state.user = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
        }
    },
});

export const { setToken, setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
