import { T as Tool } from "./index-zZBXRajj.js";
const STYLE_TAGS = ["水彩", "油画", "素描", "动漫", "古风", "赛博朋克", "像素艺术", "写实", "抽象", "插画", "扁平插画", "厚涂"];
const styleTagTool = new Tool({
  id: "style-tag",
  name: "风格标签",
  description: "为图片内容推荐合适的风格标签",
  icon: "🏷️",
  validate: () => ({ valid: true }),
  execute: (ctx) => {
    const text = (ctx.text || ctx.prompt || "").toLowerCase();
    const matched = STYLE_TAGS.filter((tag) => text.includes(tag.toLowerCase()));
    const suggestions = matched.length > 0 ? matched : ["插画"];
    return { tags: suggestions, allTags: STYLE_TAGS };
  }
});
export {
  styleTagTool
};
//# sourceMappingURL=styleTag-CNCjNrLG.js.map
