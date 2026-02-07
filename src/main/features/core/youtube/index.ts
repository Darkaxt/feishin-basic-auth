import { ipcMain } from 'electron';
import YTMusic from 'ytmusic-api';

let youtubeApi: InstanceType<typeof YTMusic> | null = null;

const getYoutubeApi = async (): Promise<InstanceType<typeof YTMusic>> => {
    if (!youtubeApi) {
        youtubeApi = new YTMusic();
        await youtubeApi.initialize();
    }
    return youtubeApi;
};

ipcMain.handle('youtube-search', async (_event, query: string) => {
    const api = await getYoutubeApi();
    const results = await api.search(query);
    return results;
});
