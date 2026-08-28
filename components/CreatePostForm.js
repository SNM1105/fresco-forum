"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/lib/actions/posts";
import { Pill } from "./ui";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 4000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];

export default function CreatePostForm({ categories }) {
  const [categoryKey, setCategoryKey] = useState(categories[0]?.key);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [pending, startTransition] = useTransition();

  const selected = categories.find((c) => c.key === categoryKey);
  const grouped = {
    art: categories.filter((c) => c.category_group === "art"),
    politics: categories.filter((c) => c.category_group === "politics"),
    life: categories.filter((c) => c.category_group === "life"),
  };

  const validateFile = (file) => {
    if (!file) return null;
    if (!ALLOWED_TYPES.includes(file.type)) return "Only JPG, PNG, WebP or MP4.";
    if (file.size > MAX_BYTES) return "That file is over the 25MB limit.";
    return null;
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    const typeOrSizeError = validateFile(file);
    if (typeOrSizeError) return setFileError(typeOrSizeError);

    if (file.type.startsWith("image/")) {
      const dims = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = URL.createObjectURL(file);
      });
      if (dims.w > MAX_DIMENSION || dims.h > MAX_DIMENSION) {
        setFileError(`Image is too large — max ${MAX_DIMENSION}px on a side.`);
      }
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.target);
    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) setFormError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2 text-ink-soft">Category</label>
        <div className="flex flex-col gap-3">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="flex flex-wrap gap-1.5">
              {items.map((c) => (
                <Pill key={c.key} type="button" active={categoryKey === c.key} onClick={() => setCategoryKey(c.key)}>
                  {c.label}
                </Pill>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selected?.requires_approval && (
        <div className="p-3 rounded-md text-xs bg-lapis-tint text-lapis">
          Posts in this category are held for a moderator to review before they go live — usually within a
          couple hours. That's how bad-faith accounts and hate speech get kept out.
        </div>
      )}

      <input type="hidden" name="category" value={categoryKey} />

      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2 text-ink-soft">Title</label>
        <input
          name="title"
          required
          minLength={3}
          maxLength={200}
          placeholder="Say it in one line"
          className="w-full px-3 py-2.5 rounded-md text-sm outline-none border border-line bg-card font-display"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2 text-ink-soft">Body</label>
        <textarea
          name="body"
          rows={6}
          maxLength={10000}
          placeholder="Give people something to respond to."
          className="w-full px-3 py-2.5 rounded-md text-sm outline-none border border-line bg-card resize-none"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest block mb-2 text-ink-soft">
          Attach work (optional)
        </label>
        <input
          type="file"
          name="image"
          accept={ALLOWED_TYPES.join(",")}
          onChange={onFileChange}
          className="text-xs text-ink-soft"
        />
        <p className="text-[11px] text-ink-faint mt-1">
          JPG, PNG, WebP or MP4 — up to 25MB, {MAX_DIMENSION}px max on a side.
        </p>
        {fileError && <p className="text-xs text-sienna-deep mt-1">{fileError}</p>}
      </div>

      {formError && <p className="text-sm text-sienna-deep">{formError}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || !!fileError}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-sienna disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
