import { T as Tool } from "./index-zZBXRajj.js";
const RHYME_API = "https://api.datamuse.com/words";
const rhymeSearchTool = new Tool({
  id: "rhyme-search",
  name: "押韵搜索",
  description: "查找押韵词（使用 Datamuse API）",
  icon: "🎵",
  validate: (ctx) => ({ valid: !!ctx.word, error: ctx.word ? null : "需要 word 输入" }),
  execute: async (ctx) => {
    try {
      const res = await fetch(`${RHYME_API}?rel_rhy=${encodeURIComponent(ctx.word)}&max=10`);
      const words = await res.json();
      return { word: ctx.word, rhymes: words.map((w) => w.word) };
    } catch (e) {
      return { word: ctx.word, rhymes: [], error: e.message };
    }
  }
});
export {
  rhymeSearchTool
};
//# sourceMappingURL=rhymeSearch-C1fiFx2o.js.map
