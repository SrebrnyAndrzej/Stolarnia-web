import { execFileSync } from "node:child_process";
export function pdfText(path: string): string {
  if (process.env.PAN_STOLARZ_QA_PDF_PYTHON)
    return execFileSync(
      process.env.PAN_STOLARZ_QA_PDF_PYTHON,
      [
        "-X",
        "utf8",
        "-c",
        "import sys;from pypdf import PdfReader;print('\\n'.join(p.extract_text() or '' for p in PdfReader(sys.argv[1]).pages))",
        path,
      ],
      { encoding: "utf8" },
    );
  return execFileSync("pdftotext", ["-enc", "UTF-8", path, "-"], {
    encoding: "utf8",
  });
}
