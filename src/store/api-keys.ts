import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

const initialState: {
    openAIApiKey?: string | null | undefined;
    elevenLabsApiKey?: string | null | undefined;
} = {
    openAIApiKey: localStorage.getItem('openai-api-key'),
    elevenLabsApiKey: localStorage.getItem('elevenlabs-api-key'),
};

export const apiKeysSlice = createSlice({
    name: 'apiKeys',
    initialState,
    reducers: {
        setOpenAIApiKey: (state, action: PayloadAction<string>) => {
            state.openAIApiKey = action.payload;
        },
        setElevenLabsApiKey: (state, action: PayloadAction<string>) => {
            state.elevenLabsApiKey = action.payload;
        }
    },
})

export const { setOpenAIApiKey, setElevenLabsApiKey } = apiKeysSlice.actions;

export const setOpenAIApiKeyFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => apiKeysSlice.actions.setOpenAIApiKey(event.target.value);
export const setElevenLabsApiKeyFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => apiKeysSlice.actions.setElevenLabsApiKey(event.target.value);

export const selectOpenAIApiKey = (state: RootState) => state.apiKeys.openAIApiKey;
export const selectElevenLabsApiKey = (state: RootState) => state.apiKeys.elevenLabsApiKey;

export default apiKeysSlice.reducer;