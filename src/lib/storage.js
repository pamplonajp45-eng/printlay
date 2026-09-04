import { get, set, del } from "idb-keyval";

const DB_KEY_SESSION = "printlay_session_v1";

/**
 * Saves active session state to IndexedDB with persistent base64 image storage.
 */
export async function saveSession(state) {
  try {
    const serializablePhotos = await Promise.all(
      state.photos.map(async (p) => {
        let persistentDataUrl = p.dataUrl || p.url;

        // If photo has a file object or a temporary blob: URL, convert it to persistent base64
        if (p.file) {
          try {
            persistentDataUrl = await fileToDataUrl(p.file);
          } catch (e) {
            console.warn("Failed to convert file to data URL:", e);
          }
        } else if (persistentDataUrl && persistentDataUrl.startsWith("blob:")) {
          try {
            const res = await fetch(persistentDataUrl);
            const blob = await res.blob();
            persistentDataUrl = await blobToDataUrl(blob);
          } catch (e) {
            console.warn("Failed to convert blob URL to data URL:", e);
          }
        }

        return {
          id: p.id,
          name: p.name || "Photo",
          dataUrl: persistentDataUrl,
          cropSettings: p.cropSettings || { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
        };
      })
    );

    const sessionData = {
      photos: serializablePhotos,
      photoPresetId: state.photoPresetId,
      sheetPresetId: state.sheetPresetId,
      photoOrientation: state.photoOrientation || "portrait",
      sheetOrientation: state.sheetOrientation || "portrait",
      customPhotoSize: state.customPhotoSize,
      showCutGuides: state.showCutGuides,
      cutGuideStyle: state.cutGuideStyle || "dashed",
      marginIn: state.marginIn,
      gutterIn: state.gutterIn,
      dpi: state.dpi || 300,
      frameBgColor: state.frameBgColor || "#ffffff",
      showSequenceLabels: state.showSequenceLabels || false,
      timestamp: Date.now(),
    };

    await set(DB_KEY_SESSION, sessionData);
  } catch (err) {
    console.error("Failed to save session to IndexedDB:", err);
  }
}

/**
 * Loads session state from IndexedDB.
 */
export async function loadSession() {
  try {
    const sessionData = await get(DB_KEY_SESSION);
    if (!sessionData || !Array.isArray(sessionData.photos)) return null;

    const restoredPhotos = sessionData.photos.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.dataUrl,
      dataUrl: p.dataUrl,
      cropSettings: p.cropSettings || { offsetX: 0, offsetY: 0, zoom: 1, rotate: 0 },
    }));

    return {
      ...sessionData,
      photos: restoredPhotos,
    };
  } catch (err) {
    console.error("Failed to load session from IndexedDB:", err);
    return null;
  }
}

/**
 * Clears saved session from IndexedDB.
 */
export async function clearSessionStorage() {
  try {
    await del(DB_KEY_SESSION);
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
