import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

const initialState: {
    openAIApiKey?: string | null | undefined;
    useOpenAIWhisper: boolean;
    elevenLabsApiKey?: string | null | undefined;

} = {
    openAIApiKey: localStorage.getItem('openai-api-key'),
    useOpenAIWhisper: false,
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
        },
        setUseOpenAIWhisper: (state, action: PayloadAction<boolean>) => {
            state.useOpenAIWhisper = action.payload;
        }

    },
})

export const { setOpenAIApiKey, setElevenLabsApiKey } = apiKeysSlice.actions;

export const setOpenAIApiKeyFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => apiKeysSlice.actions.setOpenAIApiKey(event.target.value);
export const setElevenLabsApiKeyFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => apiKeysSlice.actions.setElevenLabsApiKey(event.target.value);
export const setUseOpenAIWhisperFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => apiKeysSlice.actions.setUseOpenAIWhisper(event.target.checked);

export const selectOpenAIApiKey = (state: RootState) => state.apiKeys.openAIApiKey;
export const selectElevenLabsApiKey = (state: RootState) => state.apiKeys.elevenLabsApiKey;
export const selectUseOpenAIWhisper = (state: RootState) => state.apiKeys.useOpenAIWhisper;

export default apiKeysSlice.reducer;