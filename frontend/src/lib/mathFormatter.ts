/**
 * Universal Math and Markdown Normalizer for EduRAG Scholar.
 * Transforms raw LLM output, raw LaTeX delimiters, calculus expressions,
 * and unclosed mermaid blocks into perfectly parsable markdown for remark-math & rehype-katex.
 */

export function normalizeMathAndMarkdown(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Normalize line endings
  text = text.replace(/\r\n/g, "\n");

  // 2. Convert LaTeX display math delimiters: \[ ... \] -> $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, expr) => {
    return `\n\n$$\n${expr.trim()}\n$$\n\n`;
  });

  // 3. Convert LaTeX inline math delimiters: \( ... \) -> $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, expr) => {
    return `$${expr.trim()}$`;
  });

  // 4. Wrap standalone LaTeX environments in display math $$ if not already inside $$
  const environments = [
    "aligned",
    "align*",
    "align",
    "matrix",
    "pmatrix",
    "bmatrix",
    "vmatrix",
    "cases",
    "equation",
    "equation*",
  ];

  for (const env of environments) {
    const beginTag = `\\begin{${env}}`;
    const endTag = `\\end{${env}}`;
    
    // Check if the environment exists and is not already wrapped in $$
    if (text.includes(beginTag) && text.includes(endTag)) {
      const regex = new RegExp(
        `(?<!\\$\\$)\\s*(\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\})\\s*(?!\\$\\$)`,
        "g"
      );
      text = text.replace(regex, "\n\n$$\n$1\n$$\n\n");
    }
  }

  // 5. Clean up any inline math spaces: $ x $ -> $x$
  // remark-math requires no space between the dollar sign and math content
  text = text.replace(/\$([ \t]+)([^$\n]+?)([ \t]*)\$/g, "$$2$");
  text = text.replace(/\$([^$\n]+?)([ \t]+)\$/g, "$$1$");

  // 6. Wrap unwrapped Mermaid diagram blocks
  const mermaidKeywords = [
    "flowchart TD",
    "flowchart LR",
    "flowchart TB",
    "flowchart RL",
    "graph TD",
    "graph LR",
    "graph TB",
    "sequenceDiagram",
    "classDiagram",
    "erDiagram",
    "stateDiagram-v2",
    "stateDiagram",
  ];

  for (const kw of mermaidKeywords) {
    if (text.includes(kw) && !text.includes("```mermaid")) {
      const regex = new RegExp(`(${kw}[\\s\\S]*?)(?=\\n\\s*\\n\\s*\\d|\\n\\s*\\n\\s*#|\\n\\s*\\n\\s*[A-Z]|$)`, "g");
      text = text.replace(regex, "\n```mermaid\n$1\n```\n");
    }
  }

  return text;
}
