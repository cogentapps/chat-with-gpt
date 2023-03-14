import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import messageReducer from './message';
import parametersReducer from './parameters';
import apiKeysReducer from './api-keys';
import voiceReducer from './voices';
import settingsUIReducer from './settings-ui';
import uiReducer from './ui';
import sidebarReducer from './sidebar';

const persistConfig = {
  key: 'root',
  storage,
}

const persistSidebarConfig = {
  key: 'sidebar',
  storage,
}

const store = configureStore({
  reducer: {
    // auth: authReducer,
    apiKeys: persistReducer(persistConfig, apiKeysReducer),
    settingsUI: settingsUIReducer,
    voices: persistReducer(persistConfig, voiceReducer),
    parameters: persistReducer(persistConfig, parametersReducer),
    message: messageReducer,
    ui: uiReducer,
    sidebar: persistReducer(persistSidebarConfig, sidebarReducer),
  },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const persistor = persistStore(store);

export default store;