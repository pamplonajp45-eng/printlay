import { useState, useCallback, useEffect } from "react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Layers,
  Sparkles,
  ImageIcon,
  CalendarDays,
  Keyboard,
  MessageCircle,
  Tag,
  CheckCircle2,
} from "lucide-react";

export const FONT_FAMILIES = [
  { id: "Caveat", name: "Caveat", preview: "Handwriting" },
  { id: "Permanent Marker", name: "Marker", preview: "Marker" },
  { id: "Pacifico", name: "Pacifico", preview: "Script" },
  { id: "Lobster", name: "Lobster", preview: "Retro Script" },
  { id: "Courier Prime", name: "Typewriter", preview: "Typewriter" },
  { id: "VT323", name: "Retro Stamp", preview: "Retro" },
  { id: "Playfair Display", name: "Playfair", preview: "Serif" },
  { id: "Abril Fatface", name: "Abril", preview: "Display Serif" },
  { id: "Montserrat", name: "Montserrat", preview: "Sans" },
  { id: "Poppins", name: "Poppins", preview: "Modern Sans" },
  { id: "DM Sans", name: "DM Sans", preview: "Clean Sans" },
];

const QUICK_PRESETS = [
  {
    id: "polaroidChin",
    label: "Polaroid Note",
    icon: <ImageIcon size={13} />,
    overlay: {
      text: "my photo",
      fontFamily: "Caveat",
      fontSize: 14,
      fontWeight: "700",
      color: "#2d2d2d",
      align: "center",
      x: 0.5,
      y: 0.91,
      shadow: false,
      bgEnabled: false,
    },
  },
  {
    id: "retroDate",
    label: "Retro Date",
    icon: <CalendarDays size={13} />,
    overlay: {
      text: "'98 04 24",
      fontFamily: "VT323",
      fontSize: 18,
      fontWeight: "400",
      color: "#e8671a",
      align: "right",
      x: 0.92,
      y: 0.88,
      shadow: false,
      bgEnabled: false,
    },
  },
  {
    id: "typewriterCaption",
    label: "Typewriter",
    icon: <Keyboard size={13} />,
    overlay: {
      text: "a memory",
      fontFamily: "Courier Prime",
      fontSize: 12,
      fontWeight: "400",
      color: "#1a1a1a",
      align: "center",
      x: 0.5,
      y: 0.93,
      shadow: false,
      bgEnabled: false,
    },
  },
  {
    id: "floatWhite",
    label: "Float White",
    icon: <MessageCircle size={13} />,
    overlay: {
      text: "caption here",
      fontFamily: "Montserrat",
      fontSize: 13,
      fontWeight: "700",
      color: "#ffffff",
      align: "center",
      x: 0.5,
      y: 0.88,
      shadow: true,
      bgEnabled: false,
    },
  },
  {
    id: "badgeBlack",
    label: "Badge",
    icon: <Tag size={13} />,
    overlay: {
      text: "label",
      fontFamily: "Montserrat",
      fontSize: 11,
      fontWeight: "700",
      color: "#ffffff",
      align: "center",
      x: 0.5,
      y: 0.88,
      shadow: false,
      bgEnabled: true,
      bgColor: "rgba(0,0,0,0.60)",
    },
  },
];

const POSITION_SNAPS = [
  { label: "Polaroid Chin", x: 0.5, y: 0.93 },
  { label: "Bottom", x: 0.5, y: 0.88 },
  { label: "Center", x: 0.5, y: 0.5 },
  { label: "Top", x: 0.5, y: 0.1 },
  { label: "Top-Left", x: 0.08, y: 0.1 },
  { label: "Top-Right", x: 0.92, y: 0.1 },
];

function newOverlay() {
  return {
    id: `txt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    text: "",
    fontFamily: "Caveat",
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    align: "center",
    x: 0.5,
    y: 0.88,
    shadow: true,
    bgEnabled: false,
    bgColor: "rgba(0,0,0,0.4)",
  };
}

export default function TextControls({
  photos,
  onUpdatePhotoText,
  onApplyTextToAll,
  onRemoveTextFromAll,
  onPreviewChange,
}) {
  const [targetMode, setTargetMode] = useState("all");
  const [editingOverlay, setEditingOverlay] = useState(newOverlay());
  const [applyMsg, setApplyMsg] = useState("");

  const hasPhotos = photos.length > 0;

  const flash = (msg) => {
    setApplyMsg(msg);
    setTimeout(() => setApplyMsg(""), 2200);
  };

  const handleApply = () => {
    if (!editingOverlay.text.trim()) return;
    const overlay = { ...editingOverlay };
    if (targetMode === "all") {
      onApplyTextToAll([overlay]);
      flash(`Applied to all ${photos.length} photos`);
    } else {
      const photo = photos.find((p) => p.id === targetMode);
      if (!photo) return;
      const existing = photo.textOverlays || [];
      onUpdatePhotoText(targetMode, [overlay, ...existing.filter((o) => o.id !== overlay.id)]);
      flash("Applied to photo");
    }
    onPreviewChange?.(null);
  };

  const handleClearAll = () => {
    if (targetMode === "all") {
      onRemoveTextFromAll();
      flash("Cleared text from all photos");
    } else {
      onUpdatePhotoText(targetMode, []);
      flash("Cleared text from photo");
    }
    onPreviewChange?.(null);
  };

  const handleQuickPreset = (preset) => {
    setEditingOverlay((prev) => ({
      ...prev,
      ...preset.overlay,
      id: prev.id,
    }));
  };

  const update = useCallback((field, value) => {
    setEditingOverlay((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    onPreviewChange?.({ targetMode, overlay: editingOverlay });
  }, [targetMode, editingOverlay, onPreviewChange]);

  useEffect(() => () => onPreviewChange?.(null), [onPreviewChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Target Selector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
          <Layers size={13} color="#8f7fe0" /> Apply To
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setTargetMode("all")}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              borderRadius: "999px",
              background: targetMode === "all" ? "linear-gradient(135deg,#8f7fe0,#b78ee0)" : "#fff",
              color: targetMode === "all" ? "#fff" : "#4e4963",
              border: targetMode === "all" ? "none" : "1px solid rgba(143,127,224,0.25)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            All Photos ({photos.length})
          </button>
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTargetMode(p.id)}
              style={{
                padding: "5px 10px",
                fontSize: 11,
                borderRadius: "999px",
                background: targetMode === p.id ? "linear-gradient(135deg,#8f7fe0,#b78ee0)" : "#fff",
                color: targetMode === p.id ? "#fff" : "#4e4963",
                border: targetMode === p.id ? "none" : "1px solid rgba(143,127,224,0.25)",
                fontWeight: 700,
                cursor: "pointer",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={p.name}
            >
              #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Style Presets */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
          <Sparkles size={13} color="#8f7fe0" /> Quick Styles
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {QUICK_PRESETS.map((qp) => (
            <button
              key={qp.id}
              type="button"
              onClick={() => handleQuickPreset(qp)}
              style={{
                padding: "5px 9px",
                fontSize: 11,
                borderRadius: "8px",
                background: "#fff",
                border: "1px solid rgba(143,127,224,0.3)",
                color: "#4e4963",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {qp.icon}
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
          <Type size={13} color="#8f7fe0" /> Text Content
        </div>
        <textarea
          value={editingOverlay.text}
          onChange={(e) => update("text", e.target.value)}
          placeholder={"Type your caption...\nSupports multiple lines (Enter)"}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "12px",
            border: "1.5px solid rgba(143,127,224,0.3)",
            background: "rgba(255,255,255,0.85)",
            fontSize: 13,
            fontFamily: `"${editingOverlay.fontFamily}", sans-serif`,
            fontWeight: editingOverlay.fontWeight,
            color: "#3d3856",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Font Family */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 6 }}>Font Style</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => update("fontFamily", f.id)}
              style={{
                padding: "6px 11px",
                fontSize: 12,
                borderRadius: "10px",
                background: editingOverlay.fontFamily === f.id ? "rgba(143,127,224,0.15)" : "#fff",
                border: editingOverlay.fontFamily === f.id ? "2px solid #8f7fe0" : "1px solid rgba(143,127,224,0.25)",
                color: editingOverlay.fontFamily === f.id ? "#6f5ec7" : "#57536b",
                cursor: "pointer",
                fontFamily: `"${f.id}", sans-serif`,
                fontWeight: 600,
              }}
            >
              {f.preview}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size + Weight */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 4 }}>
            Size ({editingOverlay.fontSize}pt)
          </div>
          <input
            type="range"
            min={6}
            max={48}
            step={1}
            value={editingOverlay.fontSize}
            onChange={(e) => update("fontSize", parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#8f7fe0" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 4 }}>Weight</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["400", "700"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => update("fontWeight", w)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 8,
                  border: editingOverlay.fontWeight === w ? "2px solid #8f7fe0" : "1px solid rgba(143,127,224,0.25)",
                  background: editingOverlay.fontWeight === w ? "rgba(143,127,224,0.15)" : "#fff",
                  color: editingOverlay.fontWeight === w ? "#6f5ec7" : "#57536b",
                  fontWeight: w,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {w === "400" ? "Reg" : "Bold"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color + Alignment */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 4 }}>Color</div>
          <input
            type="color"
            value={editingOverlay.color.startsWith("rgba") ? "#ffffff" : editingOverlay.color}
            onChange={(e) => update("color", e.target.value)}
            style={{
              width: 44,
              height: 34,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              padding: 2,
              background: "none",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 4 }}>Align</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { v: "left", icon: <AlignLeft size={14} /> },
              { v: "center", icon: <AlignCenter size={14} /> },
              { v: "right", icon: <AlignRight size={14} /> },
            ].map(({ v, icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => update("align", v)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 0",
                  borderRadius: 8,
                  border: editingOverlay.align === v ? "2px solid #8f7fe0" : "1px solid rgba(143,127,224,0.25)",
                  background: editingOverlay.align === v ? "rgba(143,127,224,0.15)" : "#fff",
                  color: editingOverlay.align === v ? "#6f5ec7" : "#57536b",
                  cursor: "pointer",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Position Snaps */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#57536b", marginBottom: 6 }}>Position</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {POSITION_SNAPS.map((snap) => {
            const isActive = Math.abs(editingOverlay.x - snap.x) < 0.015 && Math.abs(editingOverlay.y - snap.y) < 0.015;
            return (
              <button
                key={snap.label}
                type="button"
                onClick={() => { update("x", snap.x); update("y", snap.y); }}
                style={{
                  padding: "4px 9px",
                  fontSize: 11,
                  borderRadius: "8px",
                  border: isActive ? "2px solid #8f7fe0" : "1px solid rgba(143,127,224,0.25)",
                  background: isActive ? "rgba(143,127,224,0.12)" : "#fff",
                  color: isActive ? "#6f5ec7" : "#57536b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {snap.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7c7893", marginBottom: 3 }}>X: {Math.round(editingOverlay.x * 100)}%</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={editingOverlay.x}
              onChange={(e) => update("x", parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7c7893", marginBottom: 3 }}>Y: {Math.round(editingOverlay.y * 100)}%</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={editingOverlay.y}
              onChange={(e) => update("y", parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#8f7fe0" }}
            />
          </div>
        </div>
      </div>

      {/* Shadow + Background */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", background: "rgba(143,127,224,0.06)", padding: "10px 12px", borderRadius: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#57536b", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={editingOverlay.shadow}
            onChange={(e) => update("shadow", e.target.checked)}
            style={{ accentColor: "#8f7fe0" }}
          />
          Drop Shadow
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#57536b", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={editingOverlay.bgEnabled}
            onChange={(e) => update("bgEnabled", e.target.checked)}
            style={{ accentColor: "#8f7fe0" }}
          />
          Background Pill
        </label>
        {editingOverlay.bgEnabled && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#7c7893", fontWeight: 600 }}>Bg color:</span>
            <input
              type="color"
              defaultValue="#000000"
              onChange={(e) => update("bgColor", e.target.value)}
              style={{ width: 30, height: 24, border: "none", borderRadius: 6, cursor: "pointer", padding: 1 }}
            />
          </div>
        )}
      </div>

      {/* Apply & Clear */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={handleApply}
          disabled={!editingOverlay.text.trim() || !hasPhotos}
          style={{
            padding: "11px 0",
            borderRadius: "12px",
            background: editingOverlay.text.trim() && hasPhotos
              ? "linear-gradient(135deg, #8f7fe0, #b78ee0)"
              : "rgba(143,127,224,0.18)",
            color: editingOverlay.text.trim() && hasPhotos ? "#fff" : "#9490aa",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: editingOverlay.text.trim() && hasPhotos ? "pointer" : "not-allowed",
            transition: "all 150ms ease",
            boxShadow: editingOverlay.text.trim() && hasPhotos ? "0 4px 14px rgba(143,127,224,0.35)" : "none",
          }}
        >
          <CheckCircle2 size={15} />
          {targetMode === "all"
            ? `Apply to All ${photos.length} Photos`
            : "Apply to This Photo"}
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={!hasPhotos}
          style={{
            padding: "8px 0",
            borderRadius: "12px",
            background: "rgba(255,100,100,0.08)",
            color: hasPhotos ? "#d94f4f" : "#c8bcd4",
            border: "1px solid rgba(255,100,100,0.25)",
            fontWeight: 700,
            fontSize: 12,
            cursor: hasPhotos ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Trash2 size={13} />
          {targetMode === "all" ? "Clear Text from All" : "Clear Text from This Photo"}
        </button>
      </div>

      {/* Feedback toast */}
      {applyMsg && (
        <div style={{
          padding: "8px 14px",
          borderRadius: "10px",
          background: "rgba(143,127,224,0.15)",
          color: "#6f5ec7",
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
        }}>
          <CheckCircle2 size={14} /> {applyMsg}
        </div>
      )}
    </div>
  );
}
