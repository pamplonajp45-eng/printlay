import { useCallback, useEffect, useMemo, useState } from "react";
import { computeWarnings } from "../lib/bleedWarnings";

const LAYERS_KEY = "printlay.bleedCutLayers.v1";

export const DEFAULT_LAYERS = {
  artwork: true,
  bleedZone: true,
  cutLine: true,
  safeZone: true,
  labels: true,
  pageMargin: true,
};

function loadLayers() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAYERS_KEY));
    const s = { ...DEFAULT_LAYERS };
    if (raw && typeof raw === "object") {
      for (const k of Object.keys(DEFAULT_LAYERS)) if (k in raw) s[k] = !!raw[k];
    }
    return s;
  } catch {
    return { ...DEFAULT_LAYERS };
  }
}

/** Layer visibility for the bleed-cut preview, persisted in localStorage. */
export function useBleedLayers() {
  const [layers, setLayers] = useState(loadLayers);

  useEffect(() => {
    try {
      localStorage.setItem(LAYERS_KEY, JSON.stringify(layers));
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [layers]);

  const toggleLayer = useCallback((key) => {
    setLayers((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  return { layers, toggleLayer };
}

/** Per-item info + warnings for the items on one sheet (pure, memoised). */
export function useBleedWarnings({ items, bleedShape, croppedCanvases, preset, dpi, bleedMm, sheet, marginMm }) {
  return useMemo(
    () =>
      bleedShape
        ? computeWarnings({ items, bleedShape, croppedCanvases, preset, dpi, bleedMm, sheet, marginMm })
        : { byIndex: new Map(), itemInfos: [], fixGapMm: null },
    [items, bleedShape, croppedCanvases, preset, dpi, bleedMm, sheet, marginMm],
  );
}
