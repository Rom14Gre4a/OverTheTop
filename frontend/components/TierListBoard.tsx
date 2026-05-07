"use client";

import { useState, useEffect, useRef } from "react";
import { TierListData, TierItem, TierRank, TIER_COLORS, TIER_LISTS } from "@/lib/tierlist";

const STORAGE_KEY = "ott_tierlists_v1";

function loadSaved(): Record<string, TierListData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLists(lists: TierListData[]) {
  const map: Record<string, TierListData> = {};
  lists.forEach(l => { map[l.id] = l; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// ─── Image placeholder ────────────────────────────────────────────────────────

function ItemImage({ url, name }: { url?: string; name: string }) {
  if (url) {
    return (
      <img src={url} alt={name}
        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 6, flexShrink: 0,
      background: "linear-gradient(135deg, #1a1a1a, #0f0f0f)",
      border: "1px dashed #333",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "var(--fz-h2)", color: "#333",
    }}>
      💪
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  item: TierItem;
  onSave: (updated: TierItem) => void;
  onDelete: () => void;
  onClose: () => void;
}

function EditModal({ item, onSave, onDelete, onClose }: EditModalProps) {
  const [name, setName]   = useState(item.name);
  const [desc, setDesc]   = useState(item.description);
  const [imgUrl, setImgUrl] = useState(item.imageUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div style={{
        background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 16,
        padding: 24, width: 420, maxWidth: "90vw",
      }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: "#fff", fontSize: "var(--fz-body)", fontWeight: 700, margin: "0 0 18px" }}>
          Редагувати вправу
        </h3>

        {/* Preview */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <ItemImage url={imgUrl || undefined} name={name} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              flex: 1, border: "1px dashed #333", borderRadius: 8,
              background: "transparent", color: "#555", fontSize: "var(--fz-xs)",
              cursor: "pointer", padding: "8px 12px",
            }}
          >
            Завантажити фото
            <br />
            <span style={{ color: "#333", fontSize: "var(--fz-xs)" }}>(або вставити URL нижче)</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>

        <input
          value={imgUrl}
          onChange={e => setImgUrl(e.target.value)}
          placeholder="URL зображення (опціонально)"
          style={{
            width: "100%", background: "#111", border: "1px solid #222",
            borderRadius: 8, padding: "8px 10px", color: "#e5e5e5", fontSize: "var(--fz-sm)",
            marginBottom: 12, boxSizing: "border-box",
          }}
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Назва вправи"
          style={{
            width: "100%", background: "#111", border: "1px solid #222",
            borderRadius: 8, padding: "8px 10px", color: "#e5e5e5", fontSize: "var(--fz-sm)",
            fontWeight: 600, marginBottom: 10, boxSizing: "border-box",
          }}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Опис вправи"
          rows={4}
          style={{
            width: "100%", background: "#111", border: "1px solid #222",
            borderRadius: 8, padding: "8px 10px", color: "#888", fontSize: "var(--fz-sm)",
            resize: "vertical", marginBottom: 16, boxSizing: "border-box",
            fontFamily: "inherit", lineHeight: 1.5,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onSave({ ...item, name, description: desc, imageUrl: imgUrl || undefined })}
            style={{
              flex: 1, background: "#1a3a1a", border: "1px solid #22c55e33",
              color: "#22c55e", borderRadius: 8, padding: "9px 0", fontSize: "var(--fz-sm)",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Зберегти
          </button>
          <button
            onClick={onDelete}
            style={{
              background: "#3a1a1a", border: "1px solid #ef444433",
              color: "#ef4444", borderRadius: 8, padding: "9px 14px", fontSize: "var(--fz-sm)",
              cursor: "pointer",
            }}
          >
            Видалити
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid #222",
              color: "#555", borderRadius: 8, padding: "9px 14px", fontSize: "var(--fz-sm)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tier Row ─────────────────────────────────────────────────────────────────

interface TierRowProps {
  rank: TierRank;
  items: TierItem[];
  onDrop: (rank: TierRank, itemId: string, fromRank: TierRank) => void;
  onEdit: (rank: TierRank, item: TierItem) => void;
  onAddNew: (rank: TierRank) => void;
}

function TierRowComp({ rank, items, onDrop, onEdit, onAddNew }: TierRowProps) {
  const [dragOver, setDragOver] = useState(false);
  const col = TIER_COLORS[rank];

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() { setDragOver(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("text/plain");
    try {
      const { itemId, fromRank } = JSON.parse(raw);
      onDrop(rank, itemId, fromRank as TierRank);
    } catch { /* ignore */ }
  }

  return (
    <div style={{ display: "flex", minHeight: 72, marginBottom: 6 }}>
      {/* Rank label */}
      <div style={{
        width: 60, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: col.bg, border: `1px solid ${col.border}`,
        borderRadius: "10px 0 0 10px",
        fontSize: "var(--fz-h2)", fontWeight: 900, color: col.border,
        letterSpacing: -1,
      }}>
        {rank}
      </div>

      {/* Items area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1, display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 12px",
          background: dragOver ? `${col.bg}` : "#111",
          border: `1px solid ${dragOver ? col.border : "#1e1e1e"}`,
          borderLeft: "none", borderRadius: "0 10px 10px 0",
          transition: "all 0.15s", minHeight: 72,
          alignContent: "flex-start",
        }}
      >
        {items.map(item => (
          <DraggableItem key={item.id} item={item} rank={rank} onEdit={onEdit} />
        ))}

        {/* Add button */}
        <button
          onClick={() => onAddNew(rank)}
          title="Додати вправу"
          style={{
            width: 36, height: 52, borderRadius: 8,
            border: "1px dashed #2a2a2a", background: "transparent",
            color: "#333", fontSize: "var(--fz-h2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, alignSelf: "flex-start",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = col.border; e.currentTarget.style.borderColor = col.border + "55"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#333"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Draggable Item ───────────────────────────────────────────────────────────

function DraggableItem({ item, rank, onEdit }: { item: TierItem; rank: TierRank; onEdit: (rank: TierRank, item: TierItem) => void }) {
  const [tooltip, setTooltip] = useState(false);
  const col = TIER_COLORS[rank];

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ itemId: item.id, fromRank: rank }));
        e.dataTransfer.effectAllowed = "move";
      }}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
      onClick={() => onEdit(rank, item)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#181818", border: `1px solid #2a2a2a`,
        borderRadius: 8, padding: "6px 10px 6px 6px",
        cursor: "grab", userSelect: "none",
        position: "relative", flexShrink: 0, maxWidth: 220,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = col.border + "66";
        e.currentTarget.style.boxShadow = `0 0 10px ${col.border}22`;
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = "#2a2a2a";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <ItemImage url={item.imageUrl} name={item.name} />
      <span style={{ color: "#d4d4d4", fontSize: "var(--fz-sm)", fontWeight: 500, lineHeight: 1.2 }}>
        {item.name}
      </span>

      {/* Tooltip */}
      {tooltip && item.description && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 50,
          background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8,
          padding: "8px 10px", width: 220, pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}>
          <p style={{ color: "#888", fontSize: "var(--fz-xs)", lineHeight: 1.5, margin: 0 }}>
            {item.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main TierListBoard ───────────────────────────────────────────────────────

export function TierListBoard() {
  const [lists, setLists] = useState<TierListData[]>(() => {
    const saved = loadSaved();
    if (!saved) return TIER_LISTS;
    return TIER_LISTS.map(l => saved[l.id] ?? l);
  });

  const [activeListId, setActiveListId] = useState(lists[0].id);
  const [editTarget, setEditTarget]     = useState<{ rank: TierRank; item: TierItem } | null>(null);

  useEffect(() => { saveLists(lists); }, [lists]);

  const activeList = lists.find(l => l.id === activeListId)!;

  function moveItem(toRank: TierRank, itemId: string, fromRank: TierRank) {
    if (toRank === fromRank) return;
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      const fromTier = l.tiers.find(t => t.rank === fromRank)!;
      const item = fromTier.items.find(i => i.id === itemId);
      if (!item) return l;
      return {
        ...l,
        tiers: l.tiers.map(t => {
          if (t.rank === fromRank) return { ...t, items: t.items.filter(i => i.id !== itemId) };
          if (t.rank === toRank)   return { ...t, items: [...t.items, item] };
          return t;
        }),
      };
    }));
  }

  function updateItem(rank: TierRank, updated: TierItem) {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        tiers: l.tiers.map(t => t.rank !== rank ? t : {
          ...t, items: t.items.map(i => i.id === updated.id ? updated : i),
        }),
      };
    }));
    setEditTarget(null);
  }

  function deleteItem(rank: TierRank, itemId: string) {
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        tiers: l.tiers.map(t => t.rank !== rank ? t : {
          ...t, items: t.items.filter(i => i.id !== itemId),
        }),
      };
    }));
    setEditTarget(null);
  }

  function addNewItem(rank: TierRank) {
    const newItem: TierItem = {
      id: `custom-${Date.now()}`,
      name: "Нова вправа",
      description: "",
    };
    setLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return {
        ...l,
        tiers: l.tiers.map(t => t.rank !== rank ? t : {
          ...t, items: [...t.items, newItem],
        }),
      };
    }));
    setEditTarget({ rank, item: newItem });
  }

  function resetList() {
    const original = TIER_LISTS.find(l => l.id === activeListId)!;
    setLists(prev => prev.map(l => l.id !== activeListId ? l : original));
  }

  return (
    <div style={{ padding: "0 24px 40px" }}>
      {/* Style tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {lists.map(l => {
          const active = l.id === activeListId;
          return (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              style={{
                padding: "8px 18px", borderRadius: 10,
                border: `1px solid ${active ? "#fb923c55" : "#2a2a2a"}`,
                background: active ? "rgba(251,146,60,0.08)" : "transparent",
                color: active ? "#fb923c" : "#555",
                fontSize: "var(--fz-sm)", fontWeight: active ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {l.style}
              <span style={{ display: "block", fontSize: "var(--fz-xs)", color: active ? "#fb923c88" : "#333", fontWeight: 400, marginTop: 1 }}>
                {l.subtitle}
              </span>
            </button>
          );
        })}

        <button
          onClick={resetList}
          title="Скинути до початкового стану"
          style={{
            marginLeft: "auto", padding: "8px 14px", borderRadius: 10,
            border: "1px solid #2a2a2a", background: "transparent",
            color: "#444", fontSize: "var(--fz-sm)", cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#888"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#444"; }}
        >
          ↺ Скинути
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {(Object.entries(TIER_COLORS) as [TierRank, typeof TIER_COLORS.S][]).map(([rank, col]) => (
          <div key={rank} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: col.border, borderRadius: 3, opacity: 0.8 }} />
            <span style={{ color: "#444", fontSize: "var(--fz-xs)" }}>{col.label}</span>
          </div>
        ))}
      </div>

      <div style={{ color: "#2a2a2a", fontSize: "var(--fz-xs)", marginBottom: 12 }}>
        Натисніть на вправу — редагувати · Перетягніть — змінити тір
      </div>

      {/* Tiers */}
      {activeList.tiers.map(tier => (
        <TierRowComp
          key={tier.rank}
          rank={tier.rank}
          items={tier.items}
          onDrop={moveItem}
          onEdit={(rank, item) => setEditTarget({ rank, item })}
          onAddNew={addNewItem}
        />
      ))}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          item={editTarget.item}
          onSave={updated => updateItem(editTarget.rank, updated)}
          onDelete={() => deleteItem(editTarget.rank, editTarget.item.id)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
