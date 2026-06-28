import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchLeaderboard,
    fetchMyRank,
    isSupabaseEnabled,
    subscribeLeaderboard,
} from '../lib/supabase.js';

export const useCloudLeaderboard = ({ deviceId, userXp }) => {
    const queryClient = useQueryClient();

    const {
        data: leaderboardData,
        isLoading: isLeaderboardLoading,
        refetch: loadLeaderboard,
    } = useQuery({
        queryKey: ['leaderboard', userXp],
        queryFn: async () => {
            if (!isSupabaseEnabled) return { leaderboard: [], myRank: null };
            let lb = [];
            const { data, error } = await fetchLeaderboard();
            if (data && !error) {
                lb = data.map((user, idx) => ({
                    ...user,
                    rank: idx + 1,
                    isMe: user.device_id === deviceId,
                }));
            }
            const { rank } = await fetchMyRank(userXp);
            return { leaderboard: lb, myRank: rank || null };
        },
        enabled: isSupabaseEnabled,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        if (!isSupabaseEnabled) return undefined;
        loadLeaderboard();
        const unsubscribe = subscribeLeaderboard(() => {
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        });
        return unsubscribe;
    }, [loadLeaderboard, queryClient]);

    return {
        isLeaderboardLoading,
        leaderboard: leaderboardData?.leaderboard || [],
        loadLeaderboard,
        myRank: leaderboardData?.myRank || null,
    };
};
