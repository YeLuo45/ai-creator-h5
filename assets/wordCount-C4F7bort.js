import { T as Tool } from "./index-zZBXRajj.js";
const wordCountTool = new Tool({
  id: "word-count",
  name: "字数统计",
  description: "统计文本内容的字数、行数、段落数",
  icon: "📝",
  validate: (ctx) => ({ valid: !!ctx.text, error: ctx.text ? null : "需要文本输入" }),
  execute: (ctx) => {
    const text = ctx.text || "";
    const chars = text.length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const lines = text.split("\n").filter((l) => l.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    return { chars, chineseChars, englishWords, lines, paragraphs };
  }
});
export {
  wordCountTool
};
//# sourceMappingURL=wordCount-C4F7bort.js.map
