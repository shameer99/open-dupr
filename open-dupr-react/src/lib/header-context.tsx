/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";

interface HeaderContextType {
  title: string | null;
  setTitle: (title: string | null) => void;
  showBackButton: boolean;
  setShowBackButton: (show: boolean) => void;
  onBackClick?: () => void;
  setOnBackClick: (callback?: () => void) => void;
  actionButton?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
  };
  setActionButton: (button?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
  }) => void;
  avatarUrl?: string | null;
  setAvatarUrl: (url: string | null) => void;
  playerName?: string | null;
  setPlayerName: (name: string | null) => void;
  showHamburgerMenu: boolean;
  setShowHamburgerMenu: (show: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [title, setTitle] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState<boolean>(false);
  const [onBackClick, setOnBackClick] = useState<(() => void) | undefined>(
    undefined
  );
  const [actionButton, setActionButton] = useState<
    { text: string; onClick: () => void; disabled?: boolean } | undefined
  >(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState<boolean>(true);

  return (
    <HeaderContext.Provider
      value={{
        title,
        setTitle,
        showBackButton,
        setShowBackButton,
        onBackClick,
        setOnBackClick,
        actionButton,
        setActionButton,
        avatarUrl,
        setAvatarUrl,
        playerName,
        setPlayerName,
        showHamburgerMenu,
        setShowHamburgerMenu,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
};
