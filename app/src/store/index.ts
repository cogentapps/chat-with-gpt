import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import messageReducer from './message';
import uiReducer from './ui';
import settingsUIReducer from './settings-ui';
import sidebarReducer from './sidebar';

const persistConfig = {
  key: 'root',
  storage,
}

const persistSidebarConfig = {
  key: 'sidebar',
  storage,
}

const persistMessageConfig = {
  key: 'message',
  storage,
}



const store = configureStore({
  reducer: {
    message: persistReducer(persistMessageConfig, messageReducer),
    ui: uiReducer,
    settingsUI: settingsUIReducer,
    sidebar: persistReducer(persistSidebarConfig, sidebarReducer),
  },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const persistor = persistStore(store);

export default store;