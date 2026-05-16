/**
 * TTS 语音合成服务 (H5 Version - Token Plan)
 */

import { MiniMaxTTSAdapter } from '../adapter/MiniMaxAdapter.js';
import { showLoading, hideLoading, createInnerAudioContext } from '../adapter/web-api.js';
import useStore from '../store/useStore.js';

/**
 * 获取 API 配置
 */
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
}

/**
 * 生成语音
 */
export async function generateTTS({ input, voice = 'female-shaonv', speed = 1.0 }) {
  const { apiKey } = getConfig();

  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }

  const adapter = new MiniMaxTTSAdapter(apiKey);

  showLoading({ title: '语音合成中...' });
  try {
    const result = await adapter.generate({ input, voice, speed });

    let audioUrl = '';
    if (result.b64_audio) {
      // 转换为 data URL
      audioUrl = 'data:audio/mp3;base64,' + result.b64_audio;
      // 保存到历史
      addToHistory({
        input,
        voice,
        speed,
        url: audioUrl,
      });
    }

    hideLoading();
    return { ...result, url: audioUrl };
  } catch (err) {
    hideLoading();
    throw err;
  }
}

/**
 * 播放 TTS 音频
 */
export function playTTS(audioUrl) {
  const audioCtx = createInnerAudioContext();
  audioCtx.src = audioUrl;
  audioCtx.play();
  return audioCtx;
}

/**
 * 添加到历史记录
 */
function addToHistory(item) {
  useStore.getState().addHistoryItem('tts', item);
}

/**
 * 获取历史记录
 */
export function getHistory() {
  return useStore.getState().getHistory('tts');
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  useStore.getState().clearHistory('tts');
}

/**
 * 获取支持的音色列表 (speech-2.8-hd)
 */
export function getVoiceList() {
  return MiniMaxTTSAdapter.VOICE_LIST;
}
