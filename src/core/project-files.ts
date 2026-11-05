export const CAD_FILE_LIMIT = 3 * 1024 * 1024;
export const CAD_PREVIEW_LIMIT = 1024 * 1024;
export type CadUnit = "mm" | "cm" | "m" | "in" | "ft";
export const CAD_SCALES: Record<CadUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};
export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  format: "dxf" | "dwg";
  size: number;
  sha256: string;
  createdAt: string;
}
export interface StoredProjectFile extends ProjectFile {
  objectKey: string;
}
