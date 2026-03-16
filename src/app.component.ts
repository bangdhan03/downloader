import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DownloaderService, DownloadableContent, DownloadOption, PinterestResult, HappymodResult, SpotifySearchResult, YoutubeSearchResult, TiktokSearchResult } from './services/downloader.service';
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

type HomeViewMode = 'downloader' | 'search' | 'ai';

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

  aiChatMessages = signal<{ role: 'user' | 'ai', content: string }[]>([]);
  aiChatInput = signal('');
  aiChatLoading = signal(false);
  aiChatError = signal<string | null>(null);
  selectedAi = signal<AiModel | null>(null);

  isSideNavOpen = signal(false);

  pageTitle = computed(() => {
    switch(this.activeView()) {
      case 'history': return 'Riwayat Unduhan';
      case 'info': return 'Bantuan & Informasi';
      case 'home':
        switch(this.homeViewMode()) {
          case 'downloader': return 'Xyooly Downloader';
          case 'search': return 'Pencarian Konten';
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
      iconSvgPath: 'M10.5 11.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-10 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12.4-2.6c.1.2.1.4.1.6 0 1.9-1.1 3.5-2.8 4.2.3-1 .1-2.1-.6-3.1-.3-.6-.8-1-1.4-1.4z'
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

  selectPlatform(platformName: string): void {
    this.urlPlaceholder.set(`Tempel url ${platformName} disini...`);
  }

  async downloadContent(urlToDownload?: string): Promise<void> {

    const currentUrl = urlToDownload || this.url();
    if (!currentUrl || this.loading()) return;

    this.loading.set(true);
    this.downloadResult.set(null);
    this.error.set(null);

    try {

      const result = await this.downloaderService.fetchDownloadableContent(currentUrl);
      this.downloadResult.set(result);
      this.historyService.addHistoryItem(result, currentUrl);

    } catch (err: any) {

      this.error.set(err.message || 'Gagal mengambil data.');

    } finally {

      this.loading.set(false);

    }
  }

  async searchContent(): Promise<void> {

    if (!this.searchQuery() || this.searchLoading()) return;

    this.searchLoading.set(true);
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

    } catch (err:any) {

      this.searchError.set(err.message || 'Gagal mencari');

    } finally {

      this.searchLoading.set(false);

    }

  }

  selectAi(ai: AiModel): void {
    this.selectedAi.set(ai);
    this.aiChatMessages.set([]);
  }

  backToAiSelection(): void {
    this.selectedAi.set(null);
  }

  async sendChatMessage(): Promise<void> {

    const userMessage = this.aiChatInput().trim();
    const selected = this.selectedAi();

    if (!userMessage || this.aiChatLoading() || !selected) return;

    this.aiChatMessages.update(m => [...m,{ role:'user', content:userMessage }]);
    this.aiChatInput.set('');
    this.aiChatLoading.set(true);

    try {

      let aiResponse:string;

      if (selected.id === 'bard') {
        aiResponse = await this.downloaderService.chatWithBardGoogle(userMessage);
      } else {
        aiResponse = await this.downloaderService.chatWithAi(userMessage);
      }

      this.aiChatMessages.update(m => [...m,{ role:'ai', content:this.formatAiResponse(aiResponse) }]);

    } catch(err:any){

      this.aiChatError.set(err.message || 'AI error');

    } finally {

      this.aiChatLoading.set(false);

    }

  }

  formatAiResponse(text:string):string{
    if(typeof marked === 'function'){
      return marked.parse(text)
    }
    return text.replace(/\n/g,'<br>')
  }

  handleTabSelection(tab:string):void{
    if(tab === 'home' || tab === 'history' || tab === 'info'){
      this.activeView.set(tab as any)
    }
  }

  handleSideNavSelection(mode:string):void{
    this.homeViewMode.set(mode as HomeViewMode)
    this.isSideNavOpen.set(false)
  }

  toggleSideNav():void{
    this.isSideNavOpen.update(v => !v)
  }

  closeSideNav():void{
    this.isSideNavOpen.set(false)
  }

  clearHistory():void{
    this.historyService.clearHistory()
  }

  formatTimestamp(timestamp:number):string{
    return new Date(timestamp).toLocaleString()
  }

  toggleFaq(index:number):void{
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index)
  }

  createFileName(title:string,option:DownloadOption):string{

    const cleanTitle = title.replace(/[^\w\s.-]/g,'').trim().replace(/\s+/g,'-').slice(0,50)

    const extension =
      option.format === 'video'
        ? 'mp4'
        : option.format === 'audio'
        ? 'mp3'
        : 'jpg'

    return `${cleanTitle}-${option.quality}.${extension}`

  }

}
