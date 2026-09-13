import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStateStorage } from '@/utils/safeStorage';
import { Web3AuthService } from '@/services/Web3AuthService';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useWalletStore } from './useWalletStore';
import { useTradingStore } from './useTradingStore';

export interface UserProfile {
  id?: string;
  walletAddress: string | null;
  username: string;
  avatar: string;
  xp: number;
  rankTier: string;
}

export interface AuthState {
  isGuest: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  username: string;
  avatar: string;
  xp: number;
  rankTier: string;
  error: string | null;
  isConnectModalOpen: boolean;

  // Actions
  openConnectModal: () => void;
  closeConnectModal: () => void;
  connectWallet: () => Promise<boolean>;
  playAsGuest: () => void;
  disconnectWallet: () => void;
  updateProfile: (username: string, avatar: string) => Promise<boolean>;
  syncCloudData: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isGuest: true,
      isConnected: false,
      isConnecting: false,
      walletAddress: null,
      username: 'Guest_Degen',
      avatar: 'pixel_face_1',
      xp: 0,
      rankTier: 'Novice Liquidator',
      error: null,
      isConnectModalOpen: false,

      openConnectModal: () => set({ isConnectModalOpen: true }),
      closeConnectModal: () => set({ isConnectModalOpen: false }),
      clearError: () => set({ error: null }),

      playAsGuest: () => {
        set({
          isGuest: true,
          isConnected: false,
          isConnecting: false,
          walletAddress: null,
          username: 'Guest_Degen',
          error: null,
        });
      },

      disconnectWallet: () => {
        set({
          isGuest: true,
          isConnected: false,
          isConnecting: false,
          walletAddress: null,
          username: 'Guest_Degen',
          avatar: 'pixel_face_1',
          xp: 0,
          rankTier: 'Novice Liquidator',
          error: null,
        });
      },

      connectWallet: async (): Promise<boolean> => {
        set({ isConnecting: true, error: null });
        try {
          const authResult = await Web3AuthService.requestWalletLogin();
          const cleanAddress = authResult.address.toLowerCase();

          // If Supabase is available, sync with database
          if (isSupabaseConfigured && supabase) {
            const currentWallet = useWalletStore.getState();
            const hadGuestProgress = currentWallet.totalTrades > 0 || currentWallet.equity !== 10.0;

            let profileData: any = null;
            let walletData: any = null;

            if (hadGuestProgress) {
              // Migrate local guest progress to on-chain wallet
              const { data: migrateData, error: migrateErr } = await supabase.rpc(
                'rpc_migrate_guest_to_wallet',
                {
                  p_wallet_address: cleanAddress,
                  p_equity: currentWallet.equity,
                  p_available_margin: currentWallet.availableMargin,
                  p_locked_margin: currentWallet.lockedMargin,
                  p_total_realized_pnl: currentWallet.realizedPnl,
                  p_win_count: currentWallet.winCount,
                  p_loss_count: currentWallet.lossCount,
                  p_total_trades: currentWallet.totalTrades,
                  p_daily_streak: currentWallet.currentStreakDay,
                }
              );

              if (migrateErr) {
                console.warn('[useAuthStore] Migration warning, falling back to init:', migrateErr.message);
              } else if (migrateData) {
                profileData = migrateData.profile;
                walletData = migrateData.wallet;
              }
            }

            if (!profileData) {
              // Standard init or fetch
              const { data: initData, error: initErr } = await supabase.rpc(
                'rpc_initialize_wallet_user',
                {
                  p_wallet_address: cleanAddress,
                  p_username: null,
                  p_avatar: 'pixel_face_1',
                }
              );

              if (initErr) {
                throw new Error(`Database initialization error: ${initErr.message}`);
              }
              profileData = initData.profile;
              walletData = initData.wallet;
            }

            if (walletData) {
              useWalletStore.setState({
                equity: Number(walletData.equity),
                availableMargin: Number(walletData.available_margin),
                lockedMargin: Number(walletData.locked_margin),
                realizedPnl: Number(walletData.total_realized_pnl),
                winCount: Number(walletData.win_count),
                lossCount: Number(walletData.loss_count),
                totalTrades: Number(walletData.total_trades),
                currentStreakDay: Number(walletData.daily_streak || 1),
                lastClaimTimestamp: walletData.last_daily_claim_at
                  ? new Date(walletData.last_daily_claim_at).getTime()
                  : 0,
              });
            }

            // Sync active cloud positions
            const { data: posData } = await supabase
              .from('positions')
              .select('*')
              .eq('user_id', profileData.id)
              .eq('status', 'OPEN');

            if (posData && Array.isArray(posData)) {
              const mappedPositions = posData.map((p: any) => ({
                id: p.id,
                pair: p.pair,
                direction: p.direction,
                marginMode: p.margin_mode,
                leverage: p.leverage,
                entryPrice: Number(p.entry_price),
                markPrice: Number(p.entry_price),
                quantity: Number(p.quantity),
                initialMargin: Number(p.initial_margin),
                liquidationPrice: Number(p.liquidation_price),
                unrealizedPnl: 0,
                roe: 0,
                createdAt: new Date(p.created_at).getTime(),
              }));
              useTradingStore.setState({ positions: mappedPositions });
            }

            set({
              isGuest: false,
              isConnected: true,
              isConnecting: false,
              walletAddress: cleanAddress,
              username: profileData?.username || `Degen_${cleanAddress.slice(0, 6)}..${cleanAddress.slice(-4)}`,
              avatar: profileData?.avatar || 'pixel_face_1',
              xp: Number(profileData?.xp || 0),
              rankTier: profileData?.rank_tier || 'Novice Liquidator',
              error: null,
            });

            return true;
          }

          // Fallback offline / local Web3 mode
          const truncatedHandle = `Degen_${cleanAddress.slice(0, 6)}..${cleanAddress.slice(-4)}`;
          set({
            isGuest: false,
            isConnected: true,
            isConnecting: false,
            walletAddress: cleanAddress,
            username: truncatedHandle,
            avatar: 'pixel_face_1',
            error: null,
          });

          return true;
        } catch (err: any) {
          console.error('[useAuthStore] Connection error:', err);
          set({
            isConnecting: false,
            error: err?.message || 'Failed to authenticate wallet',
          });
          return false;
        }
      },

      updateProfile: async (newUsername: string, newAvatar: string): Promise<boolean> => {
        const { walletAddress } = get();
        if (isSupabaseConfigured && supabase && walletAddress) {
          try {
            const { data, error } = await supabase.rpc('rpc_update_profile', {
              p_wallet_address: walletAddress,
              p_username: newUsername,
              p_avatar: newAvatar,
            });

            if (error) throw error;
            if (data?.profile) {
              set({
                username: data.profile.username,
                avatar: data.profile.avatar,
              });
              return true;
            }
          } catch (err: any) {
            console.error('[useAuthStore] Profile update failed:', err);
            set({ error: err.message });
            return false;
          }
        }

        // Local state update
        set({
          username: newUsername || get().username,
          avatar: newAvatar || get().avatar,
        });
        return true;
      },

      syncCloudData: async () => {
        const { walletAddress, isConnected } = get();
        if (!isSupabaseConfigured || !supabase || !isConnected || !walletAddress) {
          return;
        }

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, wallets(*)')
            .eq('wallet_address', walletAddress)
            .single();

          if (profile) {
            set({
              username: profile.username,
              avatar: profile.avatar,
              xp: Number(profile.xp),
              rankTier: profile.rank_tier,
            });

            const wallet = Array.isArray(profile.wallets) ? profile.wallets[0] : profile.wallets;
            if (wallet) {
              useWalletStore.setState({
                equity: Number(wallet.equity),
                availableMargin: Number(wallet.available_margin),
                lockedMargin: Number(wallet.locked_margin),
                realizedPnl: Number(wallet.total_realized_pnl),
                winCount: Number(wallet.win_count),
                lossCount: Number(wallet.loss_count),
                totalTrades: Number(wallet.total_trades),
                currentStreakDay: Number(wallet.daily_streak || 1),
                lastClaimTimestamp: wallet.last_daily_claim_at
                  ? new Date(wallet.last_daily_claim_at).getTime()
                  : 0,
              });
            }
          }
        } catch (err) {
          console.warn('[useAuthStore] Cloud sync error:', err);
        }
      },
    }),
    {
      name: 'cryptoos98-auth-storage',
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({
        isGuest: state.isGuest,
        isConnected: state.isConnected,
        walletAddress: state.walletAddress,
        username: state.username,
        avatar: state.avatar,
        xp: state.xp,
        rankTier: state.rankTier,
      }),
    }
  )
);
