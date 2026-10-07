import heic2any from "heic2any";
import { createRateLimitedQueue } from "./concurrency";

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

/**
 * Converts multiple HEIC/HEIF files to JPEG blobs in parallel,
 * with bounded concurrency and per-file progress callbacks.
 *
 * @param {File[]} files - HEIC/HEIF files to convert
 * @param {Object} [options]
 * @param {number} [options.concurrency=4] - Max parallel conversions
 * @param {Function} [options.onProgress] - Called per file: (id, done, total)
 * @param {AbortSignal} [options.signal] - Optional abort signal to cancel early
 * @returns {Promise<{results: Array, errors: Array}>} ordered results (Blob per file)
 */
export async function convertHeicFilesInParallel(files, options = {}) {
  const { concurrency = 4, onProgress, signal } = options;
  const queue = createRateLimitedQueue(concurrency);

  const tasks = files.map((file, index) => ({
    id: file.name,
    index,
    data: file,
    fn: async (data) => {
      if (signal?.aborted) {
        const abortError = new Error("Conversion cancelled");
        abortError.name = "AbortError";
        throw abortError;
      }
      const converted = await heic2any({
        blob: data,
        toType: "image/jpeg",
        quality: 0.92,
      });
      // heic2any resolves with a Blob (or an array of Blobs for multi-frame)
      return Array.isArray(converted) ? converted[0] : converted;
    },
  }));

  const outcome = await queue(tasks, onProgress);

  if (signal?.aborted) {
    const abortError = new Error("Conversion cancelled");
    abortError.name = "AbortError";
    throw abortError;
  }

  return outcome;
}
