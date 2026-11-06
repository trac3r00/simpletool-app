// Offline decoders for captured streams. The route inlines this factory with
// fn.toString(), so everything it needs lives inside the function body.
//
// parseEventStream follows the WHATWG HTML "Interpreting an event stream"
// algorithm (https://html.spec.whatwg.org/multipage/server-sent-events.html).
// decodeWebSocketFrames follows RFC 6455 section 5.2 (base framing protocol).
export function createSseWsLogic() {
  function parseEventStream(input) {
    var text = String(input == null ? "" : input);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    var lines = text.split(/\r\n|\r|\n/);
    // A final line with no terminator is not a complete line; the spec only
    // processes lines that end in CR, LF or CRLF.
    var complete = lines.slice(0, -1);
    var events = [];
    var comments = [];
    var data = "";
    var eventType = "";
    var lastEventId = "";
    var retry = null;
    for (var i = 0; i < complete.length; i++) {
      var line = complete[i];
      if (line === "") {
        if (data === "") {
          eventType = "";
          continue;
        }
        if (data.charAt(data.length - 1) === "\n") data = data.slice(0, -1);
        events.push({ type: eventType || "message", data: data, lastEventId: lastEventId, line: i + 1 });
        data = "";
        eventType = "";
        continue;
      }
      if (line.charAt(0) === ":") {
        comments.push(line.slice(1));
        continue;
      }
      var field;
      var value;
      var colon = line.indexOf(":");
      if (colon === -1) {
        field = line;
        value = "";
      } else {
        field = line.slice(0, colon);
        value = line.slice(colon + 1);
        if (value.charAt(0) === " ") value = value.slice(1);
      }
      if (field === "event") {
        eventType = value;
      } else if (field === "data") {
        data += value + "\n";
      } else if (field === "id") {
        if (value.indexOf("\u0000") === -1) lastEventId = value;
      } else if (field === "retry") {
        if (/^[0-9]+$/.test(value)) retry = parseInt(value, 10);
      }
    }
    var pending = data !== "" || lines[lines.length - 1] !== "";
    return { events: events, comments: comments, lastEventId: lastEventId, retry: retry, discardedTail: pending };
  }

  function parseHex(input) {
    var cleaned = String(input == null ? "" : input)
      .replace(/0x/gi, "")
      .replace(/[\s:,-]/g, "");
    if (cleaned === "") return { error: "Paste frame bytes as hex, for example 81 05 48 65 6c 6c 6f." };
    if (/[^0-9a-f]/i.test(cleaned)) return { error: "Only hex digits (0-9, a-f) are allowed." };
    if (cleaned.length % 2 !== 0) return { error: "Hex input has an odd number of digits; each byte needs two." };
    var bytes = new Uint8Array(cleaned.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
    return { bytes: bytes };
  }

  var OPCODES = { 0: "continuation", 1: "text", 2: "binary", 8: "close", 9: "ping", 10: "pong" };

  function decodeUtf8(bytes) {
    try {
      return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
    } catch (e) {
      return { error: "Payload is not valid UTF-8." };
    }
  }

  function toHex(bytes) {
    var out = [];
    for (var i = 0; i < bytes.length; i++) out.push((bytes[i] < 16 ? "0" : "") + bytes[i].toString(16));
    return out.join(" ");
  }

  function decodeWebSocketFrames(bytes) {
    var frames = [];
    var offset = 0;
    var error = null;
    while (offset < bytes.length) {
      var start = offset;
      var need = function (n) {
        return offset + n <= bytes.length;
      };
      if (!need(2)) {
        error = "Frame " + (frames.length + 1) + " is truncated: a frame header needs at least 2 bytes.";
        break;
      }
      var b0 = bytes[offset];
      var b1 = bytes[offset + 1];
      offset += 2;
      var frame = {
        index: frames.length + 1,
        fin: (b0 & 0x80) !== 0,
        rsv: (b0 >> 4) & 0x07,
        opcode: b0 & 0x0f,
        masked: (b1 & 0x80) !== 0,
        warnings: [],
      };
      frame.opcodeName = OPCODES[frame.opcode] || "reserved";
      var len = b1 & 0x7f;
      if (len === 126) {
        if (!need(2)) {
          error = "Frame " + frame.index + " is truncated inside its 16-bit length.";
          break;
        }
        len = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        frame.lengthEncoding = "16-bit";
      } else if (len === 127) {
        if (!need(8)) {
          error = "Frame " + frame.index + " is truncated inside its 64-bit length.";
          break;
        }
        if (bytes[offset] & 0x80) frame.warnings.push("The most significant bit of a 64-bit length must be 0.");
        var high = ((bytes[offset] & 0x7f) * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]);
        var low = (bytes[offset + 4] * 0x1000000 + (bytes[offset + 5] << 16) + (bytes[offset + 6] << 8) + bytes[offset + 7]);
        len = high * 0x100000000 + low;
        offset += 8;
        frame.lengthEncoding = "64-bit";
      } else {
        frame.lengthEncoding = "7-bit";
      }
      frame.payloadLength = len;
      var key = null;
      if (frame.masked) {
        if (!need(4)) {
          error = "Frame " + frame.index + " is truncated inside its masking key.";
          break;
        }
        key = bytes.slice(offset, offset + 4);
        offset += 4;
        frame.maskingKey = toHex(key);
      }
      if (!need(len)) {
        error = "Frame " + frame.index + " is truncated: its header announces " + len + " payload bytes but only " + (bytes.length - offset) + " remain.";
        break;
      }
      var payload = bytes.slice(offset, offset + len);
      offset += len;
      if (key) for (var i = 0; i < payload.length; i++) payload[i] ^= key[i % 4];
      frame.headerBytes = offset - start - len;
      frame.payloadHex = toHex(payload.slice(0, 64)) + (payload.length > 64 ? " ..." : "");
      if (frame.rsv !== 0) frame.warnings.push("RSV bits are set; that requires a negotiated extension such as permessage-deflate.");
      if (frame.opcodeName === "reserved") frame.warnings.push("Opcode " + frame.opcode + " is reserved.");
      if (frame.opcode >= 8) {
        if (!frame.fin) frame.warnings.push("Control frames must not be fragmented (FIN must be set).");
        if (len > 125) frame.warnings.push("Control frame payloads must be 125 bytes or fewer.");
      }
      if (frame.opcode === 1) {
        var t = decodeUtf8(payload);
        if (t.error) frame.warnings.push(t.error);
        else frame.text = t.text;
      } else if (frame.opcode === 8) {
        if (len === 1) frame.warnings.push("A close payload must be empty or at least 2 bytes (the status code).");
        if (len >= 2) {
          frame.closeCode = (payload[0] << 8) | payload[1];
          var reason = decodeUtf8(payload.slice(2));
          if (reason.error) frame.warnings.push("Close reason is not valid UTF-8.");
          else frame.closeReason = reason.text;
        }
      } else if (frame.opcode === 9 || frame.opcode === 10 || frame.opcode === 0) {
        var maybe = decodeUtf8(payload);
        if (!maybe.error && payload.length > 0) frame.text = maybe.text;
      }
      frames.push(frame);
    }
    return { frames: frames, error: error, bytesRead: offset, bytesTotal: bytes.length };
  }

  return { parseEventStream: parseEventStream, parseHex: parseHex, decodeWebSocketFrames: decodeWebSocketFrames };
}
