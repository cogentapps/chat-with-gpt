import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from ".";

interface UpdateState {
    updateAvailable: boolean;
}

const initialState: UpdateState = {
    updateAvailable: false,
};

export const updateSlice = createSlice({
    name: "pwa",
    initialState,
    reducers: {
        setUpdateAvailable: (state) => {
            state.updateAvailable = true;
        },
        resetUpdate: (state) => {
            state.updateAvailable = false;
        },
    },
});

export const { setUpdateAvailable, resetUpdate } = updateSlice.actions;

export const selectUpdateAvailable = (state: RootState) =>
    state.pwa.updateAvailable;

export default updateSlice.reducer;
