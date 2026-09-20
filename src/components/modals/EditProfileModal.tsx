import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Web3AuthService } from '@/services/Web3AuthService';
import { soundFXService } from '@/services/SoundFXService';
import { PixelIcon } from '@/components/common/PixelIcon';
import { RETRO_AVATARS } from '@/constants/avatars';
export type { RetroAvatarOption } from '@/constants/avatars';
export { RETRO_AVATARS };

export const EditProfileModal: React.FC = () => {
  const isEditProfileOpen = useAuthStore((state) => state.isEditProfileOpen);
  const closeEditProfileModal = useAuthStore((state) => state.closeEditProfileModal);
  const username = useAuthStore((state) => state.username);
  const avatar = useAuthStore((state) => state.avatar);
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const isConnected = useAuthStore((state) => state.isConnected);
  const rankTier = useAuthStore((state) => state.rankTier);
  const xp = useAuthStore((state) => state.xp);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [inputUsername, setInputUsername] = useState(username);
  const [selectedAvatar, setSelectedAvatar] = useState(avatar);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'system'>('general');

  // Synchronize local input state whenever modal opens or global store changes
  useEffect(() => {
    if (isEditProfileOpen) {
      setInputUsername(username);
      setSelectedAvatar(avatar);
      setValidationError(null);
      setIsClosing(false);
    }
  }, [isEditProfileOpen, username, avatar]);

  if (!isEditProfileOpen) return null;

  const handleClose = () => {
    if (isClosing) return;
    soundFXService.playKeyClick();
    setIsClosing(true);
    setTimeout(() => {
      closeEditProfileModal();
      setIsClosing(false);
    }, 180);
  };

  const validate = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setValidationError('Username must be at least 2 characters.');
      return false;
    }
    if (trimmed.length > 24) {
      setValidationError('Username cannot exceed 24 characters.');
      return false;
    }
    // Allow alphanumeric, underscores, dots, and hyphens
    const regex = /^[a-zA-Z0-9_.\-\s]+$/;
    if (!regex.test(trimmed)) {
      setValidationError('Only alphanumeric characters, spaces, dots, and underscores allowed.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async (shouldClose = true) => {
    const trimmed = inputUsername.trim();
    if (!validate(trimmed)) {
      soundFXService.playLeverageWarning();
      return;
    }

    setIsSaving(true);
    try {
      const ok = await updateProfile(trimmed, selectedAvatar);
      if (ok) {
        soundFXService.playClaimReward();
        if (shouldClose) {
          handleClose();
        }
      } else {
        setValidationError('Failed to update profile. Please try again.');
        soundFXService.playLeverageWarning();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToWallet = () => {
    if (!walletAddress) return;
    soundFXService.playKeyClick();
    const cleanHandle = Web3AuthService.truncateAddress(walletAddress);
    setInputUsername(cleanHandle);
    setValidationError(null);
  };

  const currentPalette = walletAddress
    ? Web3AuthService.getAddressPalette(walletAddress)
    : { primary: '#000080', secondary: '#008531', accent: '#FFAA00' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none font-ui p-4">
      {/* Modal Outer Frame */}
      <div
        className={`w-[440px] max-w-full window-outer-frame bg-win-base shadow-2xl flex flex-col ${
          isClosing ? 'animate-win-close' : 'animate-win-open'
        }`}
      >
        {/* Title Bar */}
        <div className="h-6 bg-titlebar-navy text-white flex items-center justify-between px-1.5 py-0.5 select-none">
          <div className="flex items-center space-x-1.5 min-w-0">
            <PixelIcon name="user" size={14} className="text-white flex-shrink-0" />
            <span className="font-headline font-bold text-[12px] truncate">
              User Profile Properties
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleClose}
              className="win-btn px-1.5 h-4 flex items-center justify-center text-black font-bold text-[10px] bg-win-base leading-none hover:bg-error hover:text-white"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Windows 98 Tab Strip */}
        <div className="flex items-center space-x-1 pt-1 px-1.5 border-b border-[#808080] bg-win-base">
          <button
            onClick={() => {
              soundFXService.playKeyClick();
              setActiveTab('general');
            }}
            className={`px-3 py-1 text-[11px] font-bold ${
              activeTab === 'general'
                ? 'win-btn-pressed bg-win-pressed text-titlebar-navy border-t-2 border-l-2 border-r-2 border-b-0'
                : 'win-btn text-black'
            }`}
          >
            General
          </button>
          <button
            onClick={() => {
              soundFXService.playKeyClick();
              setActiveTab('system');
            }}
            className={`px-3 py-1 text-[11px] font-bold ${
              activeTab === 'system'
                ? 'win-btn-pressed bg-win-pressed text-titlebar-navy border-t-2 border-l-2 border-r-2 border-b-0'
                : 'win-btn text-black'
            }`}
          >
            System Info
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 flex flex-col gap-3">
          {activeTab === 'general' ? (
            <>
              {/* Profile Identity Live Preview Box */}
              <div className="win-inset bg-surface-high p-2 flex items-center space-x-3">
                <div className="w-14 h-14 win-inset-deep bg-[#1e293b] p-0.5 flex items-center justify-center flex-shrink-0">
                  {selectedAvatar === 'pixel_face_blockie' && walletAddress ? (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center border font-mono font-bold text-white text-[16px]"
                      style={{
                        backgroundColor: currentPalette.primary,
                        borderColor: currentPalette.accent,
                      }}
                    >
                      {walletAddress.substring(2, 4).toUpperCase()}
                    </div>
                  ) : (
                    <span className="text-[30px]">
                      {RETRO_AVATARS.find((a) => a.id === selectedAvatar)?.emoji || '😎'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-black truncate">
                    {inputUsername.trim() || 'Anonymous Trader'}
                  </span>
                  <div className="flex items-center space-x-1.5 font-mono text-[9.5px] text-[#555]">
                    <span>STATUS:</span>
                    {isConnected ? (
                      <span className="text-[#008531] font-bold">VERIFIED WALLET</span>
                    ) : (
                      <span className="text-[#A66000] font-bold">GUEST SANDBOX</span>
                    )}
                  </div>
                  <div className="font-mono text-[9px] text-[#666] truncate">
                    {isConnected && walletAddress
                      ? `ID: ${Web3AuthService.truncateAddress(walletAddress)}`
                      : 'STORAGE: LOCAL MEMORY'}
                  </div>
                </div>
              </div>

              {/* Username Input Field */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-black">
                  <label htmlFor="edit-username-input">Display Name / Username:</label>
                  <span className="font-mono text-[10px] text-[#666]">
                    {inputUsername.length}/24
                  </span>
                </div>
                <div className="win-inset-deep bg-white flex items-center px-2 py-1">
                  <input
                    id="edit-username-input"
                    type="text"
                    value={inputUsername}
                    maxLength={24}
                    onChange={(e) => {
                      setInputUsername(e.target.value);
                      if (validationError) validate(e.target.value);
                    }}
                    placeholder="Enter your nickname..."
                    className="w-full bg-transparent font-ui text-[12px] font-bold text-black border-none outline-none p-0"
                  />
                </div>

                {/* Helper and Quick Reset */}
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-[9.5px] text-[#555]">
                    Visible on Terminal, Leaderboard & Share Cards
                  </span>
                  {isConnected && walletAddress && (
                    <button
                      type="button"
                      onClick={handleResetToWallet}
                      className="win-btn text-[9px] font-bold px-1.5 py-0.5 text-titlebar-navy hover:bg-[#DDD]"
                      title="Reset name to clean wallet address"
                    >
                      Use Wallet Address
                    </button>
                  )}
                </div>

                {validationError && (
                  <div className="bg-[#FFE5E5] text-[#990000] text-[9.5px] font-bold p-1 border border-[#FF3333] mt-1">
                    ⚠ {validationError}
                  </div>
                )}
              </div>

              {/* Avatar Selection Grid */}
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-bold text-black">Choose Retro Avatar:</div>
                <div className="grid grid-cols-4 gap-1.5 win-inset bg-surface-low p-1.5">
                  {RETRO_AVATARS.map((av) => {
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          soundFXService.playKeyClick();
                          setSelectedAvatar(av.id);
                        }}
                        className={`p-1 flex flex-col items-center justify-center transition-transform ${
                          isSelected
                            ? 'win-btn-pressed bg-win-pressed border-2 border-titlebar-navy'
                            : 'win-btn bg-win-base hover:bg-surface-high'
                        }`}
                        title={av.label}
                      >
                        <span className="text-[20px] leading-none mb-0.5">{av.emoji}</span>
                        <span className="text-[8px] font-mono text-black font-semibold truncate w-full text-center">
                          {av.label}
                        </span>
                      </button>
                    );
                  })}

                  {/* On-Chain Blockie Palette option if wallet connected */}
                  {isConnected && walletAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFXService.playKeyClick();
                        setSelectedAvatar('pixel_face_blockie');
                      }}
                      className={`p-1 col-span-4 flex items-center justify-center space-x-2 transition-transform ${
                        selectedAvatar === 'pixel_face_blockie'
                          ? 'win-btn-pressed bg-win-pressed border-2 border-titlebar-navy'
                          : 'win-btn bg-win-base hover:bg-surface-high'
                      }`}
                    >
                      <div
                        className="w-4 h-4 border font-mono font-bold text-white text-[9px] flex items-center justify-center"
                        style={{
                          backgroundColor: currentPalette.primary,
                          borderColor: currentPalette.accent,
                        }}
                      >
                        {walletAddress.substring(2, 4).toUpperCase()}
                      </div>
                      <span className="text-[9px] font-bold text-black">
                        Use On-Chain Address Blockie ({Web3AuthService.truncateAddress(walletAddress)})
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* System Info Tab */
            <div className="win-inset bg-white p-2 flex flex-col gap-2 font-mono text-[10px] text-black">
              <div className="flex justify-between border-b border-[#DDD] pb-1">
                <span className="text-[#666]">Connected Wallet:</span>
                <span className="font-bold">
                  {walletAddress ? Web3AuthService.truncateAddress(walletAddress) : 'None (Guest Mode)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#DDD] pb-1">
                <span className="text-[#666]">Account Rank:</span>
                <span className="font-bold text-titlebar-navy">{rankTier}</span>
              </div>
              <div className="flex justify-between border-b border-[#DDD] pb-1">
                <span className="text-[#666]">Accumulated XP:</span>
                <span className="font-bold">{xp} XP</span>
              </div>
              <div className="flex justify-between border-b border-[#DDD] pb-1">
                <span className="text-[#666]">Authentication:</span>
                <span className="font-bold">{isConnected ? 'EIP-4361 SIWE Verified' : 'Local Guest Session'}</span>
              </div>
              <div className="text-[9px] text-[#888] pt-1">
                Profile edits are securely stored locally and mirrored to the cloud registry when wallet connection is active.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-2 border-t border-[#808080] bg-win-base flex justify-end space-x-2">
          <button
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="win-btn font-bold text-[11px] px-4 py-1 bg-win-base text-black active:translate-x-0.5 active:translate-y-0.5 min-w-[70px]"
          >
            {isSaving ? 'Saving...' : 'OK'}
          </button>
          <button
            disabled={isSaving}
            onClick={handleClose}
            className="win-btn font-bold text-[11px] px-4 py-1 bg-win-base text-black active:translate-x-0.5 active:translate-y-0.5 min-w-[70px]"
          >
            Cancel
          </button>
          <button
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="win-btn font-bold text-[11px] px-4 py-1 bg-win-base text-black active:translate-x-0.5 active:translate-y-0.5 min-w-[70px]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
