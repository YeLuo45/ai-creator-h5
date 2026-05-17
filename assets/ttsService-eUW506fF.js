import { d as MiniMaxTTSAdapter } from "./MiniMaxAdapter-DyumB4ZE.js";
import { u as useStore, s as showLoading, h as hideLoading, c as createInnerAudioContext } from "./index-zZBXRajj.js";
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
}
async function generateTTS({ input, model = "speech-01", voice = "female-shaonv", speed = 1 }) {
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  const adapter = new MiniMaxTTSAdapter(apiKey);
  showLoading({ title: "语音合成中..." });
  try {
    const result = await adapter.generate({ input, model, voice, speed });
    let audioUrl = "";
    if (result.b64_audio) {
      audioUrl = "data:audio/mp3;base64," + result.b64_audio;
      addToHistory({
        input,
        voice,
        speed,
        url: audioUrl
      });
    }
    hideLoading();
    return { ...result, url: audioUrl };
  } catch (err) {
    hideLoading();
    throw err;
  }
}
function playTTS(audioUrl) {
  const audioCtx = createInnerAudioContext();
  audioCtx.src = audioUrl;
  audioCtx.play();
  return audioCtx;
}
function addToHistory(item) {
  useStore.getState().addHistoryItem("tts", item);
}
function getHistory() {
  return useStore.getState().getHistory("tts");
}
function clearHistory() {
  useStore.getState().clearHistory("tts");
}
function getVoiceList() {
  return MiniMaxTTSAdapter.VOICE_LIST;
}
export {
  clearHistory,
  generateTTS,
  getHistory,
  getVoiceList,
  playTTS
};
//# sourceMappingURL=ttsService-eUW506fF.js.map
