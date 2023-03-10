import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { defaultElevenLabsVoiceID } from '../tts/defaults';

const initialState = {
    voice: defaultElevenLabsVoiceID,
};

export const voicesSlice = createSlice({
    name: 'voices',
    initialState,
    reducers: {
        setVoice: (state, action: PayloadAction<string|null>) => {
            state.voice = action.payload || '';
        },
    },
})

export const { setVoice } = voicesSlice.actions;

export const selectVoice = (state: RootState) => state.voices.voice;

export default voicesSlice.reducer;