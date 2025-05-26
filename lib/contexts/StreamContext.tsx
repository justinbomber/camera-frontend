'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';

interface StreamState {
  streams: {
    [key: string]: {
      status: 'connecting' | 'connected' | 'error' | 'disconnected';
      error?: string;
      lastConnected?: Date;
    };
  };
  globalStatus: {
    isReconnecting: boolean;
    reconnectAttempts: number;
  };
}

type StreamAction =
  | { type: 'STREAM_CONNECTING'; streamId: string }
  | { type: 'STREAM_CONNECTED'; streamId: string }
  | { type: 'STREAM_ERROR'; streamId: string; error: string }
  | { type: 'STREAM_DISCONNECTED'; streamId: string }
  | { type: 'SET_RECONNECTING'; isReconnecting: boolean }
  | { type: 'INCREMENT_RECONNECT_ATTEMPTS' }
  | { type: 'RESET_RECONNECT_ATTEMPTS' };

const initialState: StreamState = {
  streams: {},
  globalStatus: {
    isReconnecting: false,
    reconnectAttempts: 0,
  },
};

function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'STREAM_CONNECTING':
      return {
        ...state,
        streams: {
          ...state.streams,
          [action.streamId]: {
            ...state.streams[action.streamId],
            status: 'connecting',
          },
        },
      };
    case 'STREAM_CONNECTED':
      return {
        ...state,
        streams: {
          ...state.streams,
          [action.streamId]: {
            status: 'connected',
            lastConnected: new Date(),
          },
        },
      };
    case 'STREAM_ERROR':
      return {
        ...state,
        streams: {
          ...state.streams,
          [action.streamId]: {
            status: 'error',
            error: action.error,
          },
        },
      };
    case 'STREAM_DISCONNECTED':
      return {
        ...state,
        streams: {
          ...state.streams,
          [action.streamId]: {
            status: 'disconnected',
          },
        },
      };
    case 'SET_RECONNECTING':
      return {
        ...state,
        globalStatus: {
          ...state.globalStatus,
          isReconnecting: action.isReconnecting,
        },
      };
    case 'INCREMENT_RECONNECT_ATTEMPTS':
      return {
        ...state,
        globalStatus: {
          ...state.globalStatus,
          reconnectAttempts: state.globalStatus.reconnectAttempts + 1,
        },
      };
    case 'RESET_RECONNECT_ATTEMPTS':
      return {
        ...state,
        globalStatus: {
          ...state.globalStatus,
          reconnectAttempts: 0,
        },
      };
    default:
      return state;
  }
}

const StreamContext = createContext<{
  state: StreamState;
  dispatch: React.Dispatch<StreamAction>;
  connectStream: (streamId: string) => void;
  disconnectStream: (streamId: string) => void;
} | undefined>(undefined);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(streamReducer, initialState);

  const connectStream = useCallback((streamId: string) => {
    dispatch({ type: 'STREAM_CONNECTING', streamId });
    // 這裡可以添加實際的串流連接邏輯
  }, []);

  const disconnectStream = useCallback((streamId: string) => {
    dispatch({ type: 'STREAM_DISCONNECTED', streamId });
    // 這裡可以添加實際的串流斷開邏輯
  }, []);

  return (
    <StreamContext.Provider value={{ state, dispatch, connectStream, disconnectStream }}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}; 