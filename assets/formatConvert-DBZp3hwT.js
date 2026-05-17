import { T as Tool } from "./index-zZBXRajj.js";
const formatConvertTool = new Tool({
  id: "format-convert",
  name: "格式转换",
  description: "转换数据格式（JSON↔文本↔列表）",
  icon: "🔄",
  validate: () => ({ valid: true }),
  execute: (ctx) => {
    const { data, from, to } = ctx;
    if (!data) return { error: "需要 data 输入" };
    try {
      if (from === "json" && to === "text") {
        const obj = typeof data === "string" ? JSON.parse(data) : data;
        return { result: JSON.stringify(obj, null, 2) };
      }
      if (from === "text" && to === "list") {
        const lines = data.split("\n").filter((l) => l.trim());
        return { result: lines };
      }
      if (from === "list" && to === "json") {
        const arr = typeof data === "string" ? JSON.parse(data) : data;
        return { result: JSON.stringify(arr, null, 2) };
      }
      return { error: "不支持的转换类型" };
    } catch (e) {
      return { error: `转换失败: ${e.message}` };
    }
  }
});
export {
  formatConvertTool
};
//# sourceMappingURL=formatConvert-DBZp3hwT.js.map
