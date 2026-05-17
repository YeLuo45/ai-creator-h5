import { T as Tool } from "./index-zZBXRajj.js";
const punctuationCheckTool = new Tool({
  id: "punctuation-check",
  name: "标点修复",
  description: "自动修复标点符号（全角/半角/重复）",
  icon: "✏️",
  validate: (ctx) => ({ valid: !!ctx.text, error: ctx.text ? null : "需要 text 输入" }),
  execute: (ctx) => {
    let text = ctx.text || "";
    text = text.replace(/([。！？，、；：]){2,}/g, "$1");
    text = text.replace(/"/g, "“").replace(/"/g, "”");
    text = text.replace(/'/g, "‘").replace(/'/g, "’");
    text = text.replace(/\.{3,}/g, "…");
    text = text.replace(/，{2,}/g, "，");
    return { original: ctx.text, fixed: text, changes: text !== ctx.text };
  }
});
export {
  punctuationCheckTool
};
//# sourceMappingURL=punctuationCheck-Bfc92V41.js.map
