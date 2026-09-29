import { formatJsonLosslessly } from "../utils/lossless-json.js";

const jsonFormat = {
  id: "json-format",
  name: "JSON Format/Minify",
  inputTypes: ["text", "json"],
  outputTypes: ["text", "json"],
  options: [
    { id: "mode", type: "select", values: ["format", "minify"] },
    { id: "indent", type: "number", default: 2 },
  ],
  transform(input, { mode = "format", indent = 2 } = {}) {
    if (!input) return "";
    const text = String(input).trim();

    try {
      return formatJsonLosslessly(text, mode === "minify" ? 0 : indent);
    } catch (err) {
      return `[Error: ${err.message}]`;
    }
  },
};

export default jsonFormat;
