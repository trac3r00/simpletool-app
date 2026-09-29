/**
 * Validate JSON and change only insignificant whitespace.
 *
 * JSON.parse remains the syntax oracle, while the lexical pass deliberately
 * avoids serializing parsed numbers through JavaScript's Number type.
 */
export function formatJsonLosslessly(input, indent = 2) {
  const text = String(input).trim();
  JSON.parse(text);

  let gap = "";
  if (typeof indent === "number") {
    const width = Math.min(10, Math.max(0, Math.trunc(indent)));
    gap = " ".repeat(width);
  } else if (typeof indent === "string") {
    gap = indent.slice(0, 10);
  }

  let output = "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  let previousToken = "";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (
      character === " " ||
      character === "\t" ||
      character === "\n" ||
      character === "\r"
    ) {
      continue;
    }

    if (character === '"') {
      inString = true;
      output += character;
    } else if (character === "{" || character === "[") {
      output += character;
      depth += 1;

      if (gap) {
        let nextIndex = index + 1;
        while (
          text[nextIndex] === " " ||
          text[nextIndex] === "\t" ||
          text[nextIndex] === "\n" ||
          text[nextIndex] === "\r"
        ) {
          nextIndex += 1;
        }
        const closing = character === "{" ? "}" : "]";
        if (text[nextIndex] !== closing) {
          output += `\n${gap.repeat(depth)}`;
        }
      }
    } else if (character === "}" || character === "]") {
      depth -= 1;
      if (gap && previousToken !== "{" && previousToken !== "[") {
        output += `\n${gap.repeat(depth)}`;
      }
      output += character;
    } else if (character === ",") {
      output += gap ? `,\n${gap.repeat(depth)}` : ",";
    } else if (character === ":") {
      output += gap ? ": " : ":";
    } else {
      output += character;
    }

    previousToken = character;
  }

  return output;
}
