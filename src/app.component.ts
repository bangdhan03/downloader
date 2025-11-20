import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DownloaderService, DownloadableContent, DownloadOption, PinterestResult, HappymodResult, SpotifySearchResult, YoutubeSearchResult, TiktokSearchResult, RemoveBgResult, ReminiResult, SimpleImageEditResult } from './services/downloader.service';
import { HistoryService } from './services/history.service';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { LoaderComponent } from './components/loader/loader.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';

declare var marked: any;

export interface AiModel {
  id: 'realtime' | 'bard';
  name: string;
  description: string;
  iconSvgPath: string;
}

type HomeViewMode = 'downloader' | 'search' | 'edits' | 'ai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BottomNavComponent, LoaderComponent, NgOptimizedImage, NavbarComponent, SideNavComponent]
})
export class AppComponent {
  private downloaderService = inject(DownloaderService);
  historyService = inject(HistoryService);

  url = signal('');
  urlPlaceholder = signal('Tempel URL di sini...');
  loading = signal(false);
  downloadResult = signal<DownloadableContent | null>(null);
  error = signal<string | null>(null);
  activeView = signal<'home' | 'history' | 'info'>('home');
  openFaqIndex = signal<number | null>(null);

  // New signals for search functionality
  homeViewMode = signal<HomeViewMode>('downloader');
  searchQuery = signal('');
  searchType = signal<'pinterest' | 'happymod' | 'spotify' | 'youtube' | 'tiktok'>('pinterest');
  searchLoading = signal(false);
  pinterestResults = signal<PinterestResult[] | null>(null);
  happymodResults = signal<HappymodResult[] | null>(null);
  spotifyResults = signal<SpotifySearchResult[] | null>(null);
  youtubeResults = signal<YoutubeSearchResult[] | null>(null);
  tiktokResults = signal<TiktokSearchResult[] | null>(null);
  searchError = signal<string | null>(null);

  // New signals for Edits feature
  removeBgImageUrl = signal('');
  reminiImageUrl = signal('');
  removeBgLoading = signal(false);
  reminiLoading = signal(false);
  removeBgResult = signal<RemoveBgResult | null>(null);
  reminiResult = signal<ReminiResult | null>(null);
  removeBgError = signal<string | null>(null);
  reminiError = signal<string | null>(null);

  // Signals for Tobotak
  tobotakImageUrl = signal('');
  tobotakLoading = signal(false);
  tobotakResult = signal<SimpleImageEditResult | null>(null);
  tobotakError = signal<string | null>(null);

  // Signals for Tofigure
  tofigureImageUrl = signal('');
  tofigureLoading = signal(false);
  tofigureResult = signal<SimpleImageEditResult | null>(null);
  tofigureError = signal<string | null>(null);

  // Signals for Tozombie
  tozombieImageUrl = signal('');
  tozombieLoading = signal(false);
  tozombieResult = signal<SimpleImageEditResult | null>(null);
  tozombieError = signal<string | null>(null);

  // Signals for AI Chat
  aiChatMessages = signal<{ role: 'user' | 'ai', content: string }[]>([]);
  aiChatInput = signal('');
  aiChatLoading = signal(false);
  aiChatError = signal<string | null>(null);
  selectedAi = signal<AiModel | null>(null);

  // Signals for new Navigation
  isSideNavOpen = signal(false);

  pageTitle = computed(() => {
    switch(this.activeView()) {
      case 'history': return 'Riwayat Unduhan';
      case 'info': return 'Bantuan & Informasi';
      case 'home':
        switch(this.homeViewMode()) {
          case 'downloader': return 'Demonkite Downloader';
          case 'search': return 'Pencarian Konten';
          case 'edits': return 'Alat Edit Gambar';
          case 'ai': return 'Chat AI';
        }
    }
  });

  aiModels: AiModel[] = [
    {
      id: 'realtime',
      name: 'Realtime AI',
      description: 'AI serbaguna untuk jawaban cepat.',
      iconSvgPath: 'M17.5,12A5.5,5.5,0,0,1,12,17.5A5.5,5.5,0,0,1,6.5,12A5.5,5.5,0,0,1,12,6.5A5.5,5.5,0,0,1,17.5,12M12,2A10,10,0,0,0,2,12A10,10,0,0,0,12,22A10,10,0,0,0,22,12A10,10,0,0,0,12,2Z'
    },
    {
      id: 'bard',
      name: 'Bard Google',
      description: 'AI percakapan canggih dari Google.',
      iconSvgPath: 'M10.5 11.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-10 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12.4-2.6c.1.2.1.4.1.6 0 1.9-1.1 3.5-2.8 4.2.3-1 .1-2.1-.6-3.1-.3-.6-.8-1-1.4-1.4-.2-.1-.4-.2-.6-.2-.2 0-.4 0-.6.1-.2.1-.3.2-.5.3-.2.1-.4.3-.5.5-.3.4-.5.8-.6 1.3-.1.4-.1.9-.1 1.3 0 .4.1.8.2 1.2.1.4.3.8.5 1.2.3.4.6.8.9 1.1.8.8 1.8 1.3 2.9 1.3.5 0 1-.1 1.5-.3.5-.2 1-.5 1.4-.9.4-.4.8-.9 1.1-1.4.3-.5.5-1.1.6-1.7.1-.6.2-1.2.2-1.8 0-1.2-.2-2.3-.7-3.4-.2-.5-.5-1-.9-1.4zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z'
    }
  ];

  videoPreview = computed(() => {
    const result = this.downloadResult();
    if (!result) return null;
    const videoOption = result.options.find(opt => opt.format === 'video');
    return videoOption ? { url: videoOption.url, format: 'video' } : null;
  });

  audioPreview = computed(() => {
    const result = this.downloadResult();
    if (!result) return null;
    const audioOption = result.options.find(opt => opt.format === 'audio');
    return audioOption ? { url: audioOption.url, format: 'audio' } : null;
  });

  supportedPlatforms = [
    { name: 'TikTok', iconName: 'TikTok', color: 'text-black' },
    { name: 'YouTube', iconName: 'YouTube', color: 'text-red-600' },
    { name: 'Instagram', iconName: 'Instagram', color: 'text-pink-600' },
    { name: 'Facebook', iconName: 'Facebook', color: 'text-blue-600' },
    { name: 'Spotify', iconName: 'Spotify', color: 'text-green-500' },
    { name: 'Mediafire', iconName: 'Mediafire', color: 'text-blue-500' }
  ];

  faqs = [
    {
      question: 'Mengapa unduhan saya gagal?',
      answer: 'Pastikan URL valid dan konten tidak bersifat privat. Beberapa platform membatasi unduhan konten tertentu atau API mungkin sedang tidak aktif.'
    },
    {
      question: 'Apakah layanan ini gratis?',
      answer: 'Ya, Demonkite Downloader sepenuhnya gratis untuk penggunaan pribadi.'
    },
    {
      question: 'Bisakah saya mengunduh video privat?',
      answer: 'Tidak, alat ini hanya dapat mengakses dan mengunduh konten yang tersedia untuk publik.'
    },
    {
      question: 'Format apa saja yang didukung?',
      answer: 'Kami mendukung format populer seperti MP4 untuk video dan MP3 untuk audio. Ketersediaan format tergantung pada platform sumber.'
    }
  ];

  selectPlatform(platformName: string): void {
    this.urlPlaceholder.set(`Tempel url ${platformName} disini...`);
  }

  async downloadContent(urlToDownload?: string): Promise<void> {
    const currentUrl = urlToDownload || this.url();
    if (!currentUrl || this.loading()) {
      return;
    }

    if (urlToDownload) {
      this.url.set(currentUrl);
      this.activeView.set('home');
      this.homeViewMode.set('downloader');
    }

    this.loading.set(true);
    this.downloadResult.set(null);
    this.error.set(null);

    try {
      const result = await this.downloaderService.fetchDownloadableContent(currentUrl);
      this.downloadResult.set(result);
      this.historyService.addHistoryItem(result, currentUrl);
    } catch (err: any) {
      this.error.set(err.message || 'Gagal mengambil data. Pastikan URL valid dan coba lagi.');
    } finally {
      this.loading.set(false);
    }
  }

  async searchContent(): Promise<void> {
    if (!this.searchQuery() || this.searchLoading()) {
      return;
    }

    this.searchLoading.set(true);
    this.pinterestResults.set(null);
    this.happymodResults.set(null);
    this.spotifyResults.set(null);
    this.youtubeResults.set(null);
    this.tiktokResults.set(null);
    this.searchError.set(null);

    try {
      switch (this.searchType()) {
        case 'pinterest':
          this.pinterestResults.set(await this.downloaderService.searchPinterest(this.searchQuery()));
          break;
        case 'happymod':
          this.happymodResults.set(await this.downloaderService.searchHappymod(this.searchQuery()));
          break;
        case 'spotify':
          this.spotifyResults.set(await this.downloaderService.searchSpotify(this.searchQuery()));
          break;
        case 'youtube':
          this.youtubeResults.set(await this.downloaderService.searchYoutube(this.searchQuery()));
          break;
        case 'tiktok':
          this.tiktokResults.set(await this.downloaderService.searchTiktok(this.searchQuery()));
          break;
      }
    } catch (err: any) {
      this.searchError.set(err.message || 'Gagal melakukan pencarian.');
    } finally {
      this.searchLoading.set(false);
    }
  }

  async performRemoveBg(): Promise<void> {
    if (!this.removeBgImageUrl() || this.removeBgLoading()) {
      return;
    }
    this.removeBgLoading.set(true);
    this.removeBgResult.set(null);
    this.removeBgError.set(null);
    try {
      const result = await this.downloaderService.removeBackground(this.removeBgImageUrl());
      this.removeBgResult.set(result);
    } catch (err: any) {
      this.removeBgError.set(err.message || 'Gagal memproses gambar.');
    } finally {
      this.removeBgLoading.set(false);
    }
  }

  async performRemini(): Promise<void> {
    if (!this.reminiImageUrl() || this.reminiLoading()) {
      return;
    }
    this.reminiLoading.set(true);
    this.reminiResult.set(null);
    this.reminiError.set(null);
    try {
      const result = await this.downloaderService.remini(this.reminiImageUrl());
      this.reminiResult.set(result);
    } catch (err: any) {
      this.reminiError.set(err.message || 'Gagal memproses gambar.');
    } finally {
      this.reminiLoading.set(false);
    }
  }

  async performTobotak(): Promise<void> {
    if (!this.tobotakImageUrl() || this.tobotakLoading()) {
      return;
    }
    this.tobotakLoading.set(true);
    this.tobotakResult.set(null);
    this.tobotakError.set(null);
    try {
      const result = await this.downloaderService.tobotak(this.tobotakImageUrl());
      this.tobotakResult.set(result);
    } catch (err: any) {
      this.tobotakError.set(err.message || 'Gagal memproses gambar.');
    } finally {
      this.tobotakLoading.set(false);
    }
  }

  async performTofigure(): Promise<void> {
    if (!this.tofigureImageUrl() || this.tofigureLoading()) {
      return;
    }
    this.tofigureLoading.set(true);
    this.tofigureResult.set(null);
    this.tofigureError.set(null);
    try {
      const result = await this.downloaderService.tofigure(this.tofigureImageUrl());
      this.tofigureResult.set(result);
    } catch (err: any) {
      this.tofigureError.set(err.message || 'Gagal memproses gambar.');
    } finally {
      this.tofigureLoading.set(false);
    }
  }

  async performTozombie(): Promise<void> {
    if (!this.tozombieImageUrl() || this.tozombieLoading()) {
      return;
    }
    this.tozombieLoading.set(true);
    this.tozombieResult.set(null);
    this.tozombieError.set(null);
    try {
      const result = await this.downloaderService.tozombie(this.tozombieImageUrl());
      this.tozombieResult.set(result);
    } catch (err: any) {
      this.tozombieError.set(err.message || 'Gagal memproses gambar.');
    } finally {
      this.tozombieLoading.set(false);
    }
  }

  selectAi(ai: AiModel): void {
    this.selectedAi.set(ai);
    this.aiChatMessages.set([]);
    this.aiChatError.set(null);
  }

  backToAiSelection(): void {
    this.selectedAi.set(null);
  }

  async sendChatMessage(): Promise<void> {
    const userMessage = this.aiChatInput().trim();
    const selected = this.selectedAi();
    if (!userMessage || this.aiChatLoading() || !selected) {
      return;
    }

    this.aiChatMessages.update(messages => [...messages, { role: 'user', content: userMessage }]);
    this.aiChatInput.set('');
    this.aiChatLoading.set(true);
    this.aiChatError.set(null);

    // Scroll to bottom
    setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, 0);

    try {
      let aiResponse: string;
      if (selected.id === 'bard') {
        aiResponse = await this.downloaderService.chatWithBardGoogle(userMessage);
      } else {
        aiResponse = await this.downloaderService.chatWithAi(userMessage);
      }
      this.aiChatMessages.update(messages => [...messages, { role: 'ai', content: this.formatAiResponse(aiResponse) }]);
    } catch (err: any) {
      this.aiChatError.set(err.message || 'Gagal mendapatkan respons dari AI.');
    } finally {
      this.aiChatLoading.set(false);
      // Scroll to bottom again after response
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 0);
    }
  }

  formatAiResponse(text: string): string {
    if (typeof marked === 'function') {
      return marked.parse(text);
    }
    // Fallback if marked is not loaded for some reason
    return text.replace(/\n/g, '<br>');
  }

  handleTabSelection(tab: string): void {
    if (tab === 'home' || tab === 'history' || tab === 'info') {
      this.activeView.set(tab as 'home' | 'history' | 'info');
    }
  }

  handleSideNavSelection(mode: string): void {
    this.homeViewMode.set(mode as HomeViewMode);
    this.isSideNavOpen.set(false);
  }

  toggleSideNav(): void {
    this.isSideNavOpen.update(v => !v);
  }

  closeSideNav(): void {
    this.isSideNavOpen.set(false);
  }

  clearHistory(): void {
    this.historyService.clearHistory();
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  createFileName(title: string, option: DownloadOption): string {
    const cleanTitle = title.replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50);
    const extension = option.format === 'video' ? 'mp4' : option.format === 'audio' ? 'mp3' : 'jpg';
    return `${cleanTitle}-${option.quality}.${extension}`;
  }

  createImageFileName(title: string): string {
    const cleanTitle = title.replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50);
    return `${cleanTitle}.jpg`;
  }
}