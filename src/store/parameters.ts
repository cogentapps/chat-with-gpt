import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.';
import { defaultSystemPrompt } from '../openai';
import { defaultParameters } from '../parameters';
import { Parameters } from '../types';

const initialState: Parameters = defaultParameters;

export const parametersSlice = createSlice({
    name: 'parameters',
    initialState,
    reducers: {
        setSystemPrompt: (state, action: PayloadAction<string>) => {
            state.initialSystemPrompt = action.payload;
        },
        resetSystemPrompt: (state) => {
            state.initialSystemPrompt = defaultSystemPrompt;
        },
        setTemperature: (state, action: PayloadAction<number>) => {
            state.temperature = action.payload;
        },
    },
})

export const { setSystemPrompt, setTemperature, resetSystemPrompt } = parametersSlice.actions;

export const selectSystemPrompt = (state: RootState) => state.parameters.initialSystemPrompt;
export const selectTemperature = (state: RootState) => state.parameters.temperature;

export default parametersSlice.reducer;