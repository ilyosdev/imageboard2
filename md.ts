import { marked, sanitizeHtml, writeAll } from "./deps.ts";

const markedOpts: marked.MarkedOptions = {
  highlight: (
    code: string,
    lang: string,
    cb: (err: unknown, result?: string) => void,
  ) => {
    (async () => {
      code = code
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&");
      const proc = Deno.run({
        cmd: ["node", "twoslash.node.js", lang ?? "text"],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });
      await writeAll(proc.stdin, new TextEncoder().encode(code));
      proc.stdin.close();
      const [out, err] = await Promise.all([
        proc.output(),
        proc.stderrOutput(),
      ]);
      const { success } = await proc.status();
      if (!success) {
        return cb!(
          new Error(new TextDecoder().decode(err)),
        );
      }
      const output = new TextDecoder().decode(out);
      cb!(undefined, output);
    })();
  },
};

export const markdown = async (text: string) => {
  const result = sanitizeHtml(
    await marked(
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;"),
      markedOpts,
    ),
    {
      allowedTags: [
        "a",
        "abbr",
        "address",
        "article",
        "aside",
        "b",
        "bdi",
        "bdo",
        "blockquote",
        "br",
        "caption",
        "cite",
        "code",
        "col",
        "colgroup",
        "data-lsp",
        "data",
        "dd",
        "dfn",
        "div",
        "dl",
        "dt",
        "em",
        "figcaption",
        "figure",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hgroup",
        "hr",
        "i",
        "kbd",
        "li",
        "main",
        "main",
        "mark",
        "nav",
        "ol",
        "p",
        "pre",
        "q",
        "rb",
        "rp",
        "rt",
        "rtc",
        "ruby",
        "s",
        "samp",
        "section",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "time",
        "tr",
        "u",
        "ul",
        "var",
        "wbr",
      ],
      allowedAttributes: {
        a: ["href"],
        span: ["style"],
        code: ["class"],
        pre: ["shiki", "twoslash", "lsp"],
        "data-lsp": ["lsp"],
      },
      allowedClasses: { code: [/^language-.*$/] },
      allowedStyles: {
        span: {
          color: [/.+/],
        },
      },
    },
  );
  return result.includes("<table>") ? result : result.replace(/\n+/g, "<br />");
};
