/**
 * LineraProvider - Simple Faucet-Based Integration
 *
 * Provides Linera blockchain connectivity using ephemeral faucet wallets.
 * Uses the lineraClient singleton for blockchain operations.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { lineraClient } from '@/lib/linera/client';

// =============================================================================
// TYPES
// =============================================================================

interface LineraContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  chainId: string | null;
  address: string | null;
  error: string | null;
  application: null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;

  // GraphQL operations
  query: <T>(graphqlQuery: string) => Promise<T | null>;
  mutate: <T>(graphqlMutation: string) => Promise<T | null>;
}

const LineraContext = createContext<LineraContextType | null>(null);

// =============================================================================
// LINERA PROVIDER COMPONENT
// =============================================================================

interface LineraProviderProps {
  children: ReactNode;
}

export function LineraProvider({ children }: LineraProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      setIsConnecting(true);
      try {
        const result = await lineraClient.connect();
        if (result.success) {
          setIsConnected(true);
          setChainId(result.address);
          setError(null);
          console.info('[LineraProvider] Auto-connected:', result.address);
        } else {
          setError(result.error || 'Connection failed');
          console.warn('[LineraProvider] Auto-connect failed:', result.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        setError(message);
        console.error('[LineraProvider] Auto-connect error:', err);
      } finally {
        setIsConnecting(false);
      }
    };

    autoConnect();
  }, []);

  /**
   * Connect to Linera network
   */
  const connect = useCallback(async () => {
    if (isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const result = await lineraClient.connect();
      if (result.success) {
        setIsConnected(true);
        setChainId(result.address);
        console.info('[LineraProvider] Connected:', result.address);
      } else {
        setError(result.error || 'Connection failed');
        console.error('[LineraProvider] Connection failed:', result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      console.error('[LineraProvider] Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected]);

  /**
   * Disconnect from Linera network
   */
  const disconnect = useCallback(() => {
    lineraClient.disconnect();
    setIsConnected(false);
    setChainId(null);
    setError(null);
    console.info('[LineraProvider] Disconnected');
  }, []);

  /**
   * Execute GraphQL query
   */
  const query = useCallback(async <T,>(graphqlQuery: string): Promise<T | null> => {
    try {
      const result = await lineraClient.query<T>(graphqlQuery);
      return result?.data || null;
    } catch (err) {
      console.error('[LineraProvider] Query error:', err);
      return null;
    }
  }, []);

  /**
   * Execute GraphQL mutation
   */
  const mutate = useCallback(async <T,>(graphqlMutation: string): Promise<T | null> => {
    return query<T>(graphqlMutation);
  }, [query]);

  const value: LineraContextType = {
    isConnected,
    isConnecting,
    chainId,
    address: chainId,
    error,
    application: null,
    connect,
    disconnect,
    query,
    mutate,
  };

  return (
    <LineraContext.Provider value={value}>
      {children}
    </LineraContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useLinera(): LineraContextType {
  const context = useContext(LineraContext);
  if (!context) {
    throw new Error('useLinera must be used within a LineraProvider');
  }
  return context;
}

export default LineraProvider;
