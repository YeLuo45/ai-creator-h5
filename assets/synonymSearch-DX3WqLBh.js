import { T as Tool } from "./index-zZBXRajj.js";
const THESAURUS_API = "https://api.datamuse.com/words";
const synonymSearchTool = new Tool({
  id: "synonym-search",
  name: "近义词搜索",
  description: "查找词语的近义词（使用 Datamuse API）",
  icon: "📚",
  validate: (ctx) => ({ valid: !!ctx.word, error: ctx.word ? null : "需要 word 输入" }),
  execute: async (ctx) => {
    try {
      const res = await fetch(`${THESAURUS_API}?rel_syn=${encodeURIComponent(ctx.word)}&max=10`);
      const words = await res.json();
      return { word: ctx.word, synonyms: words.map((w) => w.word) };
    } catch (e) {
      return { word: ctx.word, synonyms: [], error: e.message };
    }
  }
});
export {
  synonymSearchTool
};
//# sourceMappingURL=synonymSearch-DX3WqLBh.js.map
