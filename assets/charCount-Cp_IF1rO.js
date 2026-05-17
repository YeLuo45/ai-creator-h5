import { T as Tool } from "./index-zZBXRajj.js";
const charCountTool = new Tool({
  id: "char-count",
  name: "角色统计",
  description: "统计文本中各类字符的数量分布",
  icon: "🔢",
  validate: (ctx) => ({ valid: !!ctx.text, error: ctx.text ? null : "需要 text 输入" }),
  execute: (ctx) => {
    const text = ctx.text || "";
    const stats = {
      total: text.length,
      chinese: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
      english: (text.match(/[a-zA-Z]/g) || []).length,
      numbers: (text.match(/[0-9]/g) || []).length,
      spaces: (text.match(/ /g) || []).length,
      punctuation: (text.match(/[^\u4e00-\u9fa5a-zA-Z0-9 ]/g) || []).length
    };
    stats.others = stats.total - stats.chinese - stats.english - stats.numbers - stats.spaces - stats.punctuation;
    return stats;
  }
});
export {
  charCountTool
};
//# sourceMappingURL=charCount-Cp_IF1rO.js.map
