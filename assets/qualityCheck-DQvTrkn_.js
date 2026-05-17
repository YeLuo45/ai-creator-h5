import { T as Tool } from "./index-zZBXRajj.js";
const qualityCheckTool = new Tool({
  id: "quality-check",
  name: "品质检测",
  description: "检查生成参数的质量和完整性",
  icon: "✅",
  validate: () => ({ valid: true }),
  execute: (ctx) => {
    const issues = [];
    const warnings = [];
    const prompt = ctx.prompt || "";
    ctx.type || "image";
    if (prompt.length < 10) issues.push("Prompt 过短");
    else if (prompt.length < 30) warnings.push("Prompt 可以更详细");
    const hasStyle = /水彩|油画|素描|动漫|古风|赛博朋克/i.test(prompt);
    if (!hasStyle && prompt.length > 50) warnings.push("可添加风格描述");
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - issues.length * 30 - warnings.length * 10)
    };
  }
});
export {
  qualityCheckTool
};
//# sourceMappingURL=qualityCheck-DQvTrkn_.js.map
