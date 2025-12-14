export function normalizeMarkdown(input: unknown): string {
  if (typeof input !== "string") return "";

  let text = input;

  // If the text was stored with escaped newlines, convert them back.
  // Only do this when the string doesn't already contain real newlines.
  if (text.includes("\\n") && !text.includes("\n")) {
    text = text.replace(/\\n/g, "\n");
  }

  text = text.trim();

  // If the entire content is wrapped in a single fenced block (common when LLMs respond
  // with ```markdown ... ```), unwrap it so markdown can render normally.
  const fenced = text.match(
    /^```(?:\s*(?:markdown|md))?\s*\r?\n([\s\S]*?)\r?\n```[ \t]*$/i
  );
  if (fenced?.[1] != null) {
    return fenced[1].trim();
  }

  return text;
}


