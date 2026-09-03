import heic2any from "heic2any";

/**
 * Checks if a file is HEIC/HEIF format.
 */
export function isHeicFile(file) {
  if (!file) return false;
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  return (
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif") ||
    fileType === "image/heic" ||
    fileType === "image/heif"
  );
}

/**
 * Converts HEIC/HEIF file to JPEG blob/data URL.
 */
export async function convertHeicToJpeg(file) {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });

    const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return new File(
      [resultBlob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  } catch (error) {
    console.warn("HEIC conversion error, falling back to original:", error);
    return file;
  }
}
