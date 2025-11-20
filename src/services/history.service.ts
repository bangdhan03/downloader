import { Injectable, signal } from '@angular/core';
import { DownloadableContent } from './downloader.service';

export interface HistoryItem {
  url: string;
  title: string;
  thumbnail: string;
  source: string;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = 'demonkite_downloader_history';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  history = signal<HistoryItem[]>(this.loadHistoryFromStorage());

  private loadHistoryFromStorage(): HistoryItem[] {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        return JSON.parse(storedHistory);
      }
    } catch (e) {
      console.error('Error loading history from localStorage', e);
    }
    return [];
  }

  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history()));
    } catch (e) {
      console.error('Error saving history to localStorage', e);
    }
  }

  addHistoryItem(content: DownloadableContent, url: string): void {
    const newItem: HistoryItem = {
      url: url,
      title: content.title,
      thumbnail: content.thumbnail,
      source: content.source,
      timestamp: Date.now(),
    };

    this.history.update(currentHistory => {
      // Remove existing item with the same URL to move it to the top
      const filteredHistory = currentHistory.filter(item => item.url !== url);
      // Add the new item to the beginning and limit to 20 items
      const newHistory = [newItem, ...filteredHistory].slice(0, 20);
      return newHistory;
    });

    this.saveHistoryToStorage();
  }

  clearHistory(): void {
    this.history.set([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing history from localStorage', e);
    }
  }
}