import { a as MiniMaxLyricsAdapter, b as MiniMaxMusicAdapter, c as MiniMaxMusicCoverAdapter } from "./MiniMaxAdapter-DyumB4ZE.js";
import { u as useStore, s as showLoading, h as hideLoading } from "./index-zZBXRajj.js";
function hexToBase64(hex) {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    const chunkSize = 3e4;
    let base64 = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      let binary = "";
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
      base64 += btoa(binary);
    }
    return base64;
  } catch (err) {
    console.error("[MusicService] hexToBase64 error:", err, "hex length:", hex.length);
    throw new Error("音频数据转换失败");
  }
}
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
}
async function generateMusic({ prompt, model = "music-2.6", lyrics = "", duration = 180, instrumental = false }) {
  var _a, _b;
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  const adapter = new MiniMaxMusicAdapter(apiKey);
  showLoading({ title: "音乐生成中（可能需要30-60秒）..." });
  try {
    const finalLyrics = lyrics || `这是一首关于 ${prompt} 的歌曲`;
    console.log("[MusicService] Generating with prompt:", prompt, "lyrics:", finalLyrics);
    const result = await adapter.generate({ prompt, model, lyrics: finalLyrics, duration, instrumental });
    console.log("[MusicService] API result:", JSON.stringify(result).substring(0, 200));
    if (((_a = result.data) == null ? void 0 : _a.audio) && result.data.status === 2) {
      console.log("[MusicService] Converting audio hex, length:", result.data.audio.length);
      const audioUrl = "data:audio/mp3;base64," + hexToBase64(result.data.audio);
      addToHistory({
        prompt,
        lyrics: finalLyrics,
        duration,
        instrumental,
        url: audioUrl
      });
      hideLoading();
      console.log("[MusicService] Success, audioUrl:", audioUrl.substring(0, 50) + "...");
      return { ...result, url: audioUrl };
    } else if ((_b = result.base_resp) == null ? void 0 : _b.status_msg) {
      console.error("[MusicService] API error:", result.base_resp.status_msg);
      throw new Error(`API 错误: ${result.base_resp.status_msg}`);
    }
    console.warn("[MusicService] Unexpected result structure:", result);
    hideLoading();
    return result;
  } catch (err) {
    console.error("[MusicService] generateMusic error:", err);
    hideLoading();
    throw err;
  }
}
async function generateLyrics({ prompt, genre = "pop", theme = "love" }) {
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  const adapter = new MiniMaxLyricsAdapter(apiKey);
  showLoading({ title: "歌词生成中..." });
  try {
    const result = await adapter.generate({ prompt, genre, theme });
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    throw err;
  }
}
async function generateMusicCover({ prompt, musicUrl }) {
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  const adapter = new MiniMaxMusicCoverAdapter(apiKey);
  showLoading({ title: "封面生成中..." });
  try {
    const result = await adapter.generate({ prompt, music_url: musicUrl });
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    throw err;
  }
}
function addToHistory(item) {
  useStore.getState().addHistoryItem("music", item);
}
function getHistory() {
  return useStore.getState().getHistory("music");
}
function clearHistory() {
  useStore.getState().clearHistory("music");
}
export {
  clearHistory,
  generateLyrics,
  generateMusic,
  generateMusicCover,
  getHistory
};
//# sourceMappingURL=musicService-9Lx0WHyP.js.map
