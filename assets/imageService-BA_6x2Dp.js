import { M as MiniMaxImageAdapter } from "./MiniMaxAdapter-DyumB4ZE.js";
import { u as useStore, s as showLoading, h as hideLoading } from "./index-zZBXRajj.js";
function getConfig() {
  const apiKey = useStore.getState().apiKey;
  return { apiKey };
}
async function generateImage({ prompt, model = "image-01", style = "vivid", size = "1024x1024" }) {
  var _a, _b;
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error('请先在"我的"页面配置 MiniMax API Key');
  }
  const adapter = new MiniMaxImageAdapter(apiKey);
  showLoading({ title: "图片生成中..." });
  try {
    const result = await adapter.generate({ prompt, model, style, size });
    if (((_b = (_a = result.data) == null ? void 0 : _a.image_urls) == null ? void 0 : _b.length) > 0) {
      addToHistory({
        prompt,
        model,
        style,
        size,
        url: result.data.image_urls[0],
        revised_prompt: result.revised_prompt || ""
      });
      hideLoading();
      return result;
    }
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    throw err;
  }
}
function addToHistory(item) {
  useStore.getState().addHistoryItem("image", item);
}
function getHistory() {
  return useStore.getState().getHistory("image");
}
function clearHistory() {
  useStore.getState().clearHistory("image");
}
export {
  clearHistory,
  generateImage,
  getHistory
};
//# sourceMappingURL=imageService-BA_6x2Dp.js.map
