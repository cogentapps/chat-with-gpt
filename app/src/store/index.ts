import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from 'redux-persist/lib/storage';
import messageReducer from './message';
import settingsUIReducer from './settings-ui';
import sidebarReducer from './sidebar';
import uiReducer from './ui';

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
    message: persistReducer<ReturnType<typeof messageReducer>>(persistMessageConfig, messageReducer),
    ui: uiReducer,
    settingsUI: settingsUIReducer,
    sidebar: persistReducer<ReturnType<typeof sidebarReducer>>(persistSidebarConfig, sidebarReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const persistor = persistStore(store);

export default store;