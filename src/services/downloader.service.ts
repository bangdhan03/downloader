import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface DownloadOption {
  url: string;
  quality: string;
  format: 'video' | 'audio' | 'image';
  label: string;
  filename?: string;
}

export interface DownloadableContent {
  title: string;
  thumbnail: string;
  duration?: string;
  source: string;
  options: DownloadOption[];
}

export interface PinterestResult {
  title: string;
  image_url: string;
  author: {
    username: string;
    fullname: string;
    followers: number;
  };
  pin_url: string;
}

export interface HappymodResult {
  title: string;
  package: string;
  version: string;
  size: string;
  modInfo: string;
  page_dl: string;
}

export interface SpotifySearchResult {
  track_url: string;
  thumbnail: string;
  title: string;
  artist: string;
  duration: string;
}

export interface YoutubeSearchResult {
  title: string;
  channel: string;
  duration: string;
  imageUrl: string;
  link: string;
}

export interface TiktokSearchResult {
  video_id: string;
  title: string;
  cover: string;
  author: {
    unique_id: string;
    nickname: string;
  };
  duration: number;
}

export interface RemoveBgResult {
  success: boolean;
  creator: string;
  original: string;
  cutout: string;
  mask: string;
}

export interface ReminiResult {
  status: boolean;
  creator: string;
  result: string;
}

export interface SimpleImageEditResult {
  success: boolean;
  creator: string;
  result: string;
}

export interface AiChatResponse {
  status: boolean;
  creator: string;
  result: string;
}


@Injectable({
  providedIn: 'root',
})
export class DownloaderService {
  private http = inject(HttpClient);

  private detectPlatform(url: string): string {
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('open.spotify.com')) return 'spotify';
    if (url.includes('mediafire.com')) return 'mediafire';
    return 'unknown';
  }

  async fetchDownloadableContent(url: string): Promise<DownloadableContent> {
    const platform = this.detectPlatform(url);

    switch (platform) {
      case 'tiktok':
        return this.fetchTikTok(url);
      case 'youtube':
        return this.fetchYouTube(url);
      case 'instagram':
        return this.fetchInstagram(url);
      case 'facebook':
        return this.fetchFacebook(url);
      case 'spotify':
        return this.fetchSpotify(url);
      case 'mediafire':
        return this.fetchMediafire(url);
      default:
        throw new Error('Platform tidak didukung atau URL tidak valid.');
    }
  }

  private async fetchTikTok(url: string): Promise<DownloadableContent> {
    const apiUrl = `https://api-faa.my.id/faa/tiktok?url=${encodeURIComponent(url)}`;
    try {
        const response: any = await firstValueFrom(this.http.get(apiUrl));
        if (!response.status || !response.result || !response.result.success || !response.result.data) {
            throw new Error('Gagal mengambil data TikTok atau format respons tidak valid.');
        }

        const data = response.result.data;
        const options: DownloadOption[] = [];

        // Handle videos
        if (data.hdplay) {
            options.push({ url: data.hdplay, quality: 'HD', format: 'video', label: 'Video (HD)' });
        }
        if (data.play) {
            options.push({ url: data.play, quality: 'SD', format: 'video', label: 'Video (SD)' });
        }
        if (data.wmplay) {
            options.push({ url: data.wmplay, quality: 'SD (WM)', format: 'video', label: 'Video (Watermark)' });
        }
        
        // Handle audio
        if (data.music) {
            options.push({ url: data.music, quality: '128kbps', format: 'audio', label: 'Audio (MP3)' });
        }

        if (options.length === 0) {
            throw new Error('Tidak ada media yang dapat diunduh ditemukan.');
        }
        
        let durationStr: string | undefined;
        if (data.duration) {
            const durationSeconds = data.duration;
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        return {
            title: data.title || 'Konten TikTok',
            thumbnail: data.cover,
            duration: durationStr,
            source: 'TikTok',
            options: options,
        };
    } catch (error: any) {
        console.error('TikTok API Error:', error);
        throw new Error(error.message || 'Gagal mengunduh dari TikTok. Pastikan URL valid dan publik.');
    }
  }

  private async fetchYouTube(url: string): Promise<DownloadableContent> {
    const audioMetaApiUrl = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(url)}`;
    const videoApiUrl = `https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`;

    try {
        const [audioResponse, videoResponse]: [any, any] = await Promise.all([
            firstValueFrom(this.http.get(audioMetaApiUrl)),
            firstValueFrom(this.http.get(videoApiUrl))
        ]);
        
        if (!audioResponse.status || !audioResponse.result) {
            throw new Error('Tidak dapat mengambil metadata YouTube.');
        }

        const audioMeta = audioResponse.result;
        const videoResult = videoResponse.result;
        const options: DownloadOption[] = [];

        if (videoResponse.status && videoResult && videoResult.download_url) {
            options.push({ url: videoResult.download_url, quality: 'HD', format: 'video', label: 'Video (MP4)' });
        }
        
        if (audioMeta.mp3) {
            options.push({ url: audioMeta.mp3, quality: '128kbps', format: 'audio', label: 'Audio (MP3)' });
        }

        if (options.length === 0) {
            throw new Error('Gagal mengambil tautan unduhan dari YouTube.');
        }
        
        let durationStr = 'N/A';
        if (typeof audioMeta.duration === 'number') {
            const durationSeconds = audioMeta.duration;
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        return {
            title: audioMeta.title || 'Video YouTube',
            thumbnail: audioMeta.thumbnail || 'https://images.weserv.nl/?url=files.catbox.moe/oqenc7.jpg&w=192&h=192&fit=cover',
            duration: durationStr,
            source: 'YouTube',
            options: options
        };
    } catch (error) {
        console.error('YouTube API Error:', error);
        throw new Error('Gagal mengambil data YouTube. Pastikan URL video bersifat publik dan valid.');
    }
  }

  private async fetchInstagram(url: string): Promise<DownloadableContent> {
    const apiUrl = `https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(url)}`;
    try {
        const response: any = await firstValueFrom(this.http.get(apiUrl));

        if (!response.status || !response.result) {
            throw new Error('Gagal mengambil data Instagram.');
        }

        const result = response.result;
        const options: DownloadOption[] = [];

        if (result.url && result.url.length > 0) {
            result.url.forEach((itemUrl: string, index: number) => {
                const isVideo = result.metadata.isVideo || itemUrl.includes('.mp4');
                options.push({
                    url: itemUrl,
                    quality: isVideo ? 'HD' : 'Gambar',
                    format: isVideo ? 'video' : 'image',
                    label: result.url.length > 1 ? `${isVideo ? 'Video' : 'Gambar'} ${index + 1}` : (isVideo ? 'Video' : 'Gambar')
                });
            });
        } else {
            throw new Error('Tidak ada konten yang dapat diunduh ditemukan.');
        }

        const isVideoPost = result.metadata.isVideo;
        const thumbnail = isVideoPost 
            ? 'https://images.weserv.nl/?url=files.catbox.moe/oqenc7.jpg&w=192&h=192&fit=cover'
            : result.url[0];

        return {
            title: result.metadata.caption || 'Konten Instagram',
            thumbnail: thumbnail,
            source: 'Instagram',
            options: options,
        };
    } catch (error) {
      console.error('Instagram API Error:', error);
      throw new Error('Gagal mengunduh dari Instagram. Pastikan akun tidak privat.');
    }
  }

  private async fetchFacebook(url: string): Promise<DownloadableContent> {
    const apiUrl = `https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(url)}`;
     try {
        const response: any = await firstValueFrom(this.http.get(apiUrl));
        if (!response.status || !response.result) {
            throw new Error('Format respons API Facebook tidak valid atau video tidak ditemukan.');
        }

        const result = response.result;
        const options: DownloadOption[] = [];

        if (result.media.video_hd) {
            options.push({
                url: result.media.video_hd,
                quality: 'HD',
                format: 'video',
                label: `Video (HD)`
            });
        }

        if (result.media.video_sd) {
            options.push({
                url: result.media.video_sd,
                quality: 'SD',
                format: 'video',
                label: `Video (SD)`
            });
        }
        
        if (options.length === 0) {
            throw new Error('Tidak ada tautan unduhan video yang ditemukan.');
        }

        return {
            title: result.info.title || 'Video Facebook',
            thumbnail: result.media.thumbnail || 'https://images.weserv.nl/?url=files.catbox.moe/oqenc7.jpg&w=192&h=192&fit=cover',
            source: 'Facebook',
            options: options
        };
     } catch (error) {
       console.error('Facebook API Error:', error);
       throw new Error('Gagal mengunduh dari Facebook. Coba URL video lain.');
     }
  }

  private async fetchSpotify(url: string): Promise<DownloadableContent> {
    const apiUrl = `https://api.baguss.xyz/api/download/spotify?url=${encodeURIComponent(url)}`;
    try {
        const response: any = await firstValueFrom(this.http.get(apiUrl));
        
        if (!response.status || !response.metadata || !response.download) {
            throw new Error('Gagal mengambil data Spotify atau format respons tidak valid.');
        }
        
        const data = response.metadata;

        return {
            title: `${data.artist} - ${data.title}`,
            thumbnail: data.images,
            duration: data.duration,
            source: 'Spotify',
            options: [
                {
                    url: response.download,
                    quality: '128kbps',
                    format: 'audio',
                    label: 'Audio (MP3)'
                }
            ],
        };
    } catch (error: any) {
        console.error('Spotify API Error:', error);
        throw new Error(error.message || 'Gagal mengunduh dari Spotify. Pastikan URL lagu valid.');
    }
  }

  private async fetchMediafire(url: string): Promise<DownloadableContent> {
    const apiUrl = `https://api.baguss.xyz/api/download/mediafire?url=${encodeURIComponent(url)}`;
    try {
        const response: any = await firstValueFrom(this.http.get(apiUrl));
        
        if (!response.status || !response.result || !response.result.download) {
            throw new Error('Gagal mengambil data Mediafire atau format respons tidak valid.');
        }
        
        const data = response.result;

        return {
            title: data.fileName,
            thumbnail: 'https://images.weserv.nl/?url=files.catbox.moe/oqenc7.jpg&w=192&h=192&fit=cover',
            source: 'Mediafire',
            options: [
                {
                    url: data.download,
                    quality: data.fileSize,
                    format: 'image', // Placeholder format, filename is used directly
                    label: data.fileType || 'Unduh File',
                    filename: data.fileName
                }
            ],
        };
    } catch (error: any) {
        console.error('Mediafire API Error:', error);
        throw new Error(error.message || 'Gagal mengunduh dari Mediafire. Pastikan URL file valid.');
    }
  }

  async searchPinterest(query: string): Promise<PinterestResult[]> {
    const apiUrl = `https://api.baguss.xyz/api/search/pinterest?q=${encodeURIComponent(query)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.status && response.results) {
        return response.results;
      }
      throw new Error('Gagal mencari di Pinterest atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Pinterest API Error:', error);
      throw new Error(error.message || 'Gagal mencari di Pinterest.');
    }
  }

  async searchHappymod(query: string): Promise<HappymodResult[]> {
    const apiUrl = `https://api.baguss.xyz/api/search/happymod?q=${encodeURIComponent(query)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.status && response.result) {
        return response.result;
      }
      throw new Error('Gagal mencari di Happymod atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Happymod API Error:', error);
      throw new Error(error.message || 'Gagal mencari di Happymod.');
    }
  }

  async searchSpotify(query: string): Promise<SpotifySearchResult[]> {
    const apiUrl = `https://api.baguss.xyz/api/search/spotify?q=${encodeURIComponent(query)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Gagal mencari di Spotify atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Spotify Search API Error:', error);
      throw new Error(error.message || 'Gagal mencari di Spotify.');
    }
  }

  async searchYoutube(query: string): Promise<YoutubeSearchResult[]> {
    const apiUrl = `https://api.baguss.xyz/api/search/yts?q=${encodeURIComponent(query)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.status && response.result) {
        return response.result;
      }
      throw new Error('Gagal mencari di YouTube atau format respons tidak valid.');
    } catch (error: any) {
      console.error('YouTube Search API Error:', error);
      throw new Error(error.message || 'Gagal mencari di YouTube.');
    }
  }

  async searchTiktok(query: string): Promise<TiktokSearchResult[]> {
    const apiUrl = `https://api.baguss.xyz/api/search/tiktok?q=${encodeURIComponent(query)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.status && response.results) {
        return response.results;
      }
      throw new Error('Gagal mencari di TikTok atau format respons tidak valid.');
    } catch (error: any) {
      console.error('TikTok Search API Error:', error);
      throw new Error(error.message || 'Gagal mencari di TikTok.');
    }
  }

  async removeBackground(imageUrl: string): Promise<RemoveBgResult> {
    const apiUrl = `https://api.baguss.xyz/api/edits/removebg?image=${encodeURIComponent(imageUrl)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.success && response.cutout) {
        return response;
      }
      throw new Error('Gagal menghapus latar belakang atau format respons tidak valid.');
    } catch (error: any) {
      console.error('RemoveBG API Error:', error);
      throw new Error(error.message || 'Gagal menghapus latar belakang.');
    }
  }

  async remini(imageUrl: string): Promise<ReminiResult> {
    const apiUrl = `https://api.baguss.xyz/api/edits/remini?image=${encodeURIComponent(imageUrl)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.status && response.result) {
        return response;
      }
      throw new Error('Gagal meningkatkan kualitas gambar atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Remini API Error:', error);
      throw new Error(error.message || 'Gagal meningkatkan kualitas gambar.');
    }
  }

  async tobotak(imageUrl: string): Promise<SimpleImageEditResult> {
    const apiUrl = `https://api.baguss.xyz/api/edits/tobotak?image=${encodeURIComponent(imageUrl)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.success && response.result) {
        return response;
      }
      throw new Error('Gagal memproses gambar (tobotak) atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Tobotak API Error:', error);
      throw new Error(error.message || 'Gagal memproses gambar (tobotak).');
    }
  }

  async tofigure(imageUrl: string): Promise<SimpleImageEditResult> {
    const apiUrl = `https://api.baguss.xyz/api/edits/tofigure?image=${encodeURIComponent(imageUrl)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.success && response.result) {
        return response;
      }
      throw new Error('Gagal memproses gambar (tofigure) atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Tofigure API Error:', error);
      throw new Error(error.message || 'Gagal memproses gambar (tofigure).');
    }
  }

  async tozombie(imageUrl: string): Promise<SimpleImageEditResult> {
    const apiUrl = `https://api.baguss.xyz/api/edits/tozombie?image=${encodeURIComponent(imageUrl)}`;
    try {
      const response: any = await firstValueFrom(this.http.get(apiUrl));
      if (response.success && response.result) {
        return response;
      }
      throw new Error('Gagal memproses gambar (tozombie) atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Tozombie API Error:', error);
      throw new Error(error.message || 'Gagal memproses gambar (tozombie).');
    }
  }

  async chatWithAi(prompt: string): Promise<string> {
    const apiUrl = `https://api-faa.my.id/faa/ai-realtime?text=${encodeURIComponent(prompt)}`;
    try {
      const response: AiChatResponse = await firstValueFrom(this.http.get<AiChatResponse>(apiUrl));
      if (response.status && response.result) {
        return response.result;
      }
      throw new Error('Gagal mendapatkan respons dari AI atau format respons tidak valid.');
    } catch (error: any) {
      console.error('AI Chat API Error:', error);
      throw new Error(error.message || 'Gagal berkomunikasi dengan AI.');
    }
  }

  async chatWithBardGoogle(prompt: string): Promise<string> {
    const apiUrl = `https://api-faa.my.id/faa/bard-google?text=${encodeURIComponent(prompt)}`;
    try {
      const response: AiChatResponse = await firstValueFrom(this.http.get<AiChatResponse>(apiUrl));
      if (response.status && response.result) {
        return response.result;
      }
      throw new Error('Gagal mendapatkan respons dari Bard Google atau format respons tidak valid.');
    } catch (error: any) {
      console.error('Bard Google API Error:', error);
      throw new Error(error.message || 'Gagal berkomunikasi dengan Bard Google.');
    }
  }
}
