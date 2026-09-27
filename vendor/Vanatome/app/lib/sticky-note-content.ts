const NOTE_CONTENT_PREFIX = "ANATOLENS_NOTE_V1:";

export type StickyNoteContent = {
  content: string;
  completed: boolean;
};

export function parseStickyNoteContent(value: string): StickyNoteContent {
  if (!value.startsWith(NOTE_CONTENT_PREFIX)) {
    return { content: value, completed: false };
  }

  try {
    const parsed: unknown = JSON.parse(value.slice(NOTE_CONTENT_PREFIX.length));
    if (
      typeof parsed === "object" && parsed !== null &&
      "content" in parsed && typeof parsed.content === "string" &&
      "completed" in parsed && typeof parsed.completed === "boolean"
    ) {
      return { content: parsed.content, completed: parsed.completed };
    }
  } catch {
    return { content: value, completed: false };
  }

  return { content: value, completed: false };
}

export function serializeStickyNoteContent(content: string, completed: boolean) {
  return `${NOTE_CONTENT_PREFIX}${JSON.stringify({ content, completed })}`;
}

const formattingTags: Record<string, string> = {
  "**": "strong", "*": "em", "__": "u", "==": "mark", "~~": "s",
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// A stack lets the same text carry multiple formats, including ***bold italic***.
export function markupToEditableHtml(value: string): string {
  const stack = [{ marker: "", html: "" }];
  for (const chunk of value.split(/(\*+|__|==|~~)/g)) {
    if (!chunk) continue;
    let remaining = chunk;
    if (!(chunk in formattingTags) && !/^\*+$/.test(chunk)) {
      stack[stack.length - 1].html += escapeHtml(chunk).replace(/\n/g, "<br>");
      continue;
    }
    while (remaining) {
      const current = stack[stack.length - 1];
      if (current.marker && remaining.startsWith(current.marker)) {
        stack.pop();
        const tag = formattingTags[current.marker];
        stack[stack.length - 1].html += `<${tag}>${current.html}</${tag}>`;
        remaining = remaining.slice(current.marker.length);
      } else {
        const marker = remaining.startsWith("**") ? "**" : remaining.startsWith("*") ? "*" : remaining;
        stack.push({ marker, html: "" });
        remaining = remaining.slice(marker.length);
      }
    }
  }
  // Unpaired markers remain literal, as in legacy plain-text notes.
  while (stack.length > 1) {
    const current = stack.pop()!;
    stack[stack.length - 1].html += current.marker + current.html;
  }
  return stack[0].html;
}

export function editableHtmlToMarkup(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const convert = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const inner = Array.from(node.childNodes, convert).join("");
    switch (node.tagName.toLowerCase()) {
      case "strong": case "b": return `**${inner}**`;
      case "em": case "i": return `*${inner}*`;
      case "u": return `__${inner}__`;
      case "s": case "strike": case "del": return `~~${inner}~~`;
      case "mark": return `==${inner}==`;
      case "span": case "font":
        return node.style.backgroundColor ? `==${inner}==` : inner;
      case "br": return "\n";
      case "div": case "p": {
        const previous = node.previousSibling;
        const needsBreak = previous && !(previous instanceof HTMLElement && /^(DIV|P|BR)$/.test(previous.tagName));
        return `${needsBreak ? "\n" : ""}${inner}\n`;
      }
      default: return inner;
    }
  };
  return Array.from(document.body.childNodes, convert).join("").replace(/\n+$/u, "");
}

