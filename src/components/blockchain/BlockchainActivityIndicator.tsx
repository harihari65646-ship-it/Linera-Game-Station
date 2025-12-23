/**
 * Blockchain Activity Indicator
 * 
 * Shows real-time proof of blockchain connectivity:
 * - Chain ID
 * - Query count
 * - Last query status
 * - GraphQL endpoint
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Link2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { lineraConfig } from '@/lib/linera/config';

interface QueryLog {
    timestamp: Date;
    query: string;
    success: boolean;
}

export function BlockchainActivityIndicator() {
    const [queryCount, setQueryCount] = useState(0);
    const [lastQueryStatus, setLastQueryStatus] = useState<'success' | 'error' | 'loading'>('loading');
    const [recentQueries, setRecentQueries] = useState<QueryLog[]>([]);
    const [chainCount, setChainCount] = useState(0);

    // Fetch chain list to prove connectivity
    useEffect(() => {
        const fetchChains = async () => {
            try {
                const response = await fetch(lineraConfig.serviceUrl || 'http://localhost:9002', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ chains { list } }' }),
                });
                const data = await response.json();
                if (data?.data?.chains?.list) {
                    setChainCount(data.data.chains.list.length);
                    setLastQueryStatus('success');
                    setQueryCount(prev => prev + 1);
                    setRecentQueries(prev => [...prev.slice(-4), {
                        timestamp: new Date(),
                        query: 'chains { list }',
                        success: true,
                    }]);
                }
            } catch {
                setLastQueryStatus('error');
            }
        };

        fetchChains();
        const interval = setInterval(fetchChains, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    // Periodically query active rooms to show live activity
    useEffect(() => {
        const fetchRooms = async () => {
            if (!lineraConfig.graphqlUrl) return;

            try {
                const response = await fetch(lineraConfig.graphqlUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '{ activeRooms { id gameType status } }' }),
                });
                const data = await response.json();
                if (data?.data) {
                    setQueryCount(prev => prev + 1);
                    setLastQueryStatus('success');
                    setRecentQueries(prev => [...prev.slice(-4), {
                        timestamp: new Date(),
                        query: 'activeRooms { id }',
                        success: true,
                    }]);
                }
            } catch {
                setLastQueryStatus('error');
            }
        };

        fetchRooms();
        const interval = setInterval(fetchRooms, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const shortChainId = lineraConfig.chainId
        ? `${lineraConfig.chainId.slice(0, 8)}...${lineraConfig.chainId.slice(-8)}`
        : 'Not configured';

    const shortAppId = lineraConfig.applicationId
        ? `${lineraConfig.applicationId.slice(0, 8)}...${lineraConfig.applicationId.slice(-8)}`
        : 'Not configured';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-lg border border-neon-cyan/30 rounded-lg p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)] max-w-sm"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <div className="relative">
                    <Activity className="w-5 h-5 text-neon-cyan" />
                    {lastQueryStatus === 'success' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-green rounded-full animate-ping" />
                    )}
                </div>
                <span className="font-pixel text-xs text-neon-cyan">LOCAL LINERA BLOCKCHAIN</span>
                {lastQueryStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                {lastQueryStatus === 'success' && <CheckCircle className="w-3 h-3 text-neon-green" />}
                {lastQueryStatus === 'error' && <XCircle className="w-3 h-3 text-destructive" />}
            </div>

            {/* Stats */}
            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Chains:</span>
                    <span className="text-neon-green font-mono">{chainCount}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Link2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span className="text-foreground font-mono text-[10px]">{shortChainId}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">App ID:</span>
                    <span className="text-foreground font-mono text-[10px]">{shortAppId}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">GraphQL Queries:</span>
                    <motion.span
                        key={queryCount}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="text-neon-yellow font-mono font-bold"
                    >
                        {queryCount}
                    </motion.span>
                </div>
            </div>

            {/* Recent Queries */}
            {recentQueries.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Recent Queries:</div>
                    <div className="space-y-1">
                        {recentQueries.slice(-3).map((log, i) => (
                            <div key={i} className="flex items-center gap-1 text-[9px] font-mono">
                                {log.success ? (
                                    <CheckCircle className="w-2 h-2 text-neon-green flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-2 h-2 text-destructive flex-shrink-0" />
                                )}
                                <span className="text-muted-foreground truncate">{log.query}</span>
                                <span className="text-muted-foreground/50 ml-auto">
                                    {log.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Endpoint */}
            <div className="mt-3 pt-2 border-t border-border/50 text-[9px] text-muted-foreground/70">
                <div className="truncate">{lineraConfig.serviceUrl || 'localhost:9002'}</div>
            </div>
        </motion.div>
    );
}
