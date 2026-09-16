'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ui_studio_saved_components';
const EVENT_KEY = 'ui_studio_favorites_updated';

// Optional initial favorites for fresh installs
const DEFAULT_FAVORITES: string[] = ['radial-menu', 'smooth-tabs'];

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
          setIsLoaded(true);
          return;
        }
      }
      // First visit: initialize with default favorites
      setFavorites(DEFAULT_FAVORITES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FAVORITES));
    } catch {
      setFavorites(DEFAULT_FAVORITES);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadFromStorage();

    const handleStorageChange = () => {
      loadFromStorage();
    };

    window.addEventListener(EVENT_KEY, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_KEY, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadFromStorage]);

  const saveFavorites = useCallback((newFavs: string[]) => {
    setFavorites(newFavs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
        window.dispatchEvent(new Event(EVENT_KEY));
      } catch (err) {
        console.error('Failed to save favorites to localStorage', err);
      }
    }
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.includes(id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const exists = favorites.includes(id);
      const next = exists ? favorites.filter((item) => item !== id) : [...favorites, id];
      saveFavorites(next);
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      saveFavorites(favorites.filter((item) => item !== id));
    },
    [favorites, saveFavorites]
  );

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  return {
    favorites,
    isLoaded,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
