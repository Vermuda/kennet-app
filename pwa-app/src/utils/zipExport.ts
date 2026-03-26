import JSZip from 'jszip';
import { inspectionMaster } from './inspectionMaster';
import type { PropertyInspectionData } from '../types/inspectionData';
import type {
  Property,
  DefectInfo,
  Blueprint,
  Floor,
  Marker,
  Inspection,
  StandardPhoto,
} from '../types';

// --- Helper: category label mapping ---

const categoryLabelMap: Record<string, string> = {
  cat1: '外部1',
  cat2: '外部2',
  cat3: '外部3',
  cat4: '外部4',
  cat5: '外部5',
  cat8: '遵法性',
};

/**
 * Build a lookup: itemId -> categoryId from inspectionMaster.
 * Computed once at module load.
 */
const itemToCategoryMap: Map<string, string> = new Map();
const itemNameMap: Map<string, string> = new Map();

for (const category of inspectionMaster) {
  for (const item of category.items) {
    itemToCategoryMap.set(item.id, category.id);
    itemNameMap.set(item.id, item.name);
  }
}

/**
 * Get the category label for defect photo naming.
 * e.g. "item3" -> "外部1"
 */
export function getCategoryLabel(itemId: string): string {
  const catId = itemToCategoryMap.get(itemId);
  if (!catId) return '不明';
  return categoryLabelMap[catId] ?? catId;
}

/**
 * Get the item short name for defect photo naming.
 * e.g. "item3" -> "擁壁（敷地内の地盤面と高低差がある壁）"
 */
export function getItemName(itemId: string): string {
  return itemNameMap.get(itemId) ?? '不明';
}

// --- Helper: Base64 conversion ---

interface BlobResult {
  blob: Blob;
  extension: string;
}

/**
 * Convert a Base64 data URI string to a Blob with detected extension.
 * Handles both "data:image/xxx;base64,..." and raw base64 strings.
 */
export function base64ToBlob(base64String: string): BlobResult {
  let mimeType = 'image/jpeg';
  let base64Data = base64String;

  const dataUriMatch = base64String.match(
    /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/
  );
  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    base64Data = dataUriMatch[2];
  }

  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const extension = extensionMap[mimeType] ?? 'jpg';

  const byteChars = atob(base64Data);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([byteNumbers], { type: mimeType });

  return { blob, extension };
}

// --- Helper: Blueprint with compass overlay ---

/**
 * Load an image from a source URL or Base64 string.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Convert a canvas to a Blob (PNG).
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png');
  });
}

/**
 * Render a blueprint image with compass overlay and return as PNG Blob.
 */
export async function renderBlueprintWithCompass(
  blueprint: Blueprint,
  houiImageSrc: string
): Promise<Blob> {
  const blueprintImg = await loadImage(blueprint.imageData);

  const canvas = document.createElement('canvas');
  canvas.width = blueprintImg.naturalWidth;
  canvas.height = blueprintImg.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  // Draw blueprint image
  ctx.drawImage(blueprintImg, 0, 0);

  // Draw compass overlay if orientation data exists
  if (
    blueprint.orientation !== undefined &&
    blueprint.orientationIconX !== undefined &&
    blueprint.orientationIconY !== undefined
  ) {
    const compassImg = await loadImage(houiImageSrc);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const x = (blueprint.orientationIconX / 100) * canvasWidth;
    const y = (blueprint.orientationIconY / 100) * canvasHeight;
    const scale = blueprint.orientationIconScale ?? 1.0;
    const size = 80 * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((blueprint.orientation * Math.PI) / 180);
    ctx.drawImage(compassImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  return canvasToBlob(canvas);
}

// --- Helper: sequential numbering ---

/**
 * Format a sequence number as zero-padded 3-digit string.
 */
function padSeq(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Sanitize a file name component by removing/replacing problematic characters.
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
}

// --- Main export types ---

export interface ExportParams {
  property: Property;
  floors: Floor[];
  blueprints: Blueprint[];
  markers: Marker[];
  inspectionChecklist: PropertyInspectionData | null;
  inspections: Inspection[];
  defects: DefectInfo[];
  standardPhotos: StandardPhoto[];
}

interface StandardPhotoEntry {
  photoType: number;
  imageFile: string;
}

interface DefectExportEntry {
  id: string;
  inspectionId: string;
  location: string;
  component: string;
  deterioration: string;
  repairMethod: string;
  imageFile: string;
  createdAt: string;
  inspectionItemId?: string;
  evaluationId?: string;
  evaluationType?: string;
  positionX?: number;
  positionY?: number;
  blueprintId?: string;
}

interface BlueprintExportEntry {
  id: string;
  floorId: string;
  imageFile: string;
  orientation?: number;
  orientationIconX?: number;
  orientationIconY?: number;
  orientationIconScale?: number;
  createdAt: string;
}

// --- Main export function ---

/**
 * Export inspection data as a ZIP file.
 *
 * ZIP structure:
 *   {date}_{propertyName}/
 *     data.json
 *     通常写真/通常写真_001.jpg ...
 *     事象写真/{category}_{itemName}_{evalType}_{seq}.jpg ...
 *     図面/{floorName}.png
 */
export async function exportAsZip(params: ExportParams): Promise<void> {
  const {
    property,
    floors,
    blueprints,
    markers,
    inspectionChecklist,
    inspections,
    defects,
    standardPhotos,
  } = params;

  const zip = new JSZip();

  // Root folder name: YYYYMMDD_propertyName
  const now = new Date();
  const dateStr = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const rootName = `${dateStr}_${sanitizeFileName(property.name)}`;
  const root = zip.folder(rootName);
  if (!root) {
    throw new Error('Failed to create ZIP root folder');
  }

  // --- 1. Standard Photos ---
  const standardPhotoFolder = root.folder('通常写真');
  if (!standardPhotoFolder) {
    throw new Error('Failed to create 通常写真 folder');
  }

  const validPhotos = standardPhotos
    .filter((p) => p.imageData && p.imageData.length > 0)
    .sort((a, b) => a.photoType - b.photoType);

  const standardPhotoEntries: StandardPhotoEntry[] = [];
  for (let i = 0; i < validPhotos.length; i++) {
    const photo = validPhotos[i];
    const { blob, extension } = base64ToBlob(photo.imageData);
    const fileName = `通常写真_${padSeq(i + 1)}.${extension}`;
    standardPhotoFolder.file(fileName, blob);
    standardPhotoEntries.push({
      photoType: photo.photoType,
      imageFile: `通常写真/${fileName}`,
    });
  }

  // --- 2. Defect Photos ---
  const defectPhotoFolder = root.folder('事象写真');
  if (!defectPhotoFolder) {
    throw new Error('Failed to create 事象写真 folder');
  }

  // Group defects by category for sequential numbering
  const defectsByCategory = new Map<string, DefectInfo[]>();
  for (const defect of defects) {
    if (!defect.imageData || defect.imageData.length === 0) continue;
    const catLabel = defect.inspectionItemId
      ? getCategoryLabel(defect.inspectionItemId)
      : '不明';
    const existing = defectsByCategory.get(catLabel) ?? [];
    existing.push(defect);
    defectsByCategory.set(catLabel, existing);
  }

  const defectFileMap = new Map<string, string>(); // defect.id -> relative path
  for (const [catLabel, categoryDefects] of defectsByCategory) {
    for (let i = 0; i < categoryDefects.length; i++) {
      const defect = categoryDefects[i];
      const itemName = defect.inspectionItemId
        ? sanitizeFileName(getItemName(defect.inspectionItemId))
        : '不明';
      const evalType = defect.evaluationType ?? 'unknown';
      const seq = padSeq(i + 1);
      const { blob, extension } = base64ToBlob(defect.imageData);
      const fileName = `${sanitizeFileName(catLabel)}_${itemName}_${evalType}_${seq}.${extension}`;
      defectPhotoFolder.file(fileName, blob);
      defectFileMap.set(defect.id, `事象写真/${fileName}`);
    }
  }

  // --- 3. Blueprints with compass overlay ---
  const blueprintFolder = root.folder('図面');
  if (!blueprintFolder) {
    throw new Error('Failed to create 図面 folder');
  }

  // Build floorId -> floorName lookup
  const floorNameMap = new Map<string, string>();
  for (const floor of floors) {
    floorNameMap.set(floor.id, floor.name);
  }

  const blueprintEntries: BlueprintExportEntry[] = [];
  for (const bp of blueprints) {
    if (!bp.imageData || bp.imageData.length === 0) continue;

    const floorName = floorNameMap.get(bp.floorId) ?? 'unknown';
    const safeFloorName = sanitizeFileName(floorName);

    let pngBlob: Blob;
    try {
      pngBlob = await renderBlueprintWithCompass(bp, '/houi.png');
    } catch {
      // Fallback: export raw image without compass
      const { blob } = base64ToBlob(bp.imageData);
      pngBlob = blob;
    }

    const fileName = `${safeFloorName}.png`;
    blueprintFolder.file(fileName, pngBlob);

    blueprintEntries.push({
      id: bp.id,
      floorId: bp.floorId,
      imageFile: `図面/${fileName}`,
      orientation: bp.orientation,
      orientationIconX: bp.orientationIconX,
      orientationIconY: bp.orientationIconY,
      orientationIconScale: bp.orientationIconScale,
      createdAt: bp.createdAt,
    });
  }

  // --- 4. Build data.json ---
  const defectEntries: DefectExportEntry[] = defects.map((d) => ({
    id: d.id,
    inspectionId: d.inspectionId,
    location: d.location,
    component: d.component,
    deterioration: d.deterioration,
    repairMethod: d.repairMethod,
    imageFile: defectFileMap.get(d.id) ?? '',
    createdAt: d.createdAt,
    inspectionItemId: d.inspectionItemId,
    evaluationId: d.evaluationId,
    evaluationType: d.evaluationType,
    positionX: d.positionX,
    positionY: d.positionY,
    blueprintId: d.blueprintId,
  }));

  const dataJson = {
    exportedAt: now.toISOString(),
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      inspectionDate: property.inspectionDate,
      inspectionStartTime: property.inspectionStartTime,
      inspectionEndTime: property.inspectionEndTime,
      weather: property.weather,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    },
    floors,
    blueprints: blueprintEntries,
    markers,
    inspectionChecklist: inspectionChecklist ?? null,
    inspections,
    defects: defectEntries,
    standardPhotos: standardPhotoEntries,
  };

  root.file('data.json', JSON.stringify(dataJson, null, 2));

  // --- 5. Generate and download ZIP ---
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${rootName}.zip`);
}

/**
 * Trigger a browser download for a Blob.
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
