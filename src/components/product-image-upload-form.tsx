"use client";

import { useState } from "react";

import { uploadProductImageAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

type ProductImageUploadFormProps = {
  productId: number;
};

const maxImageSizeBytes = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductImageUploadForm({ productId }: ProductImageUploadFormProps) {
  const [fileError, setFileError] = useState("");

  return (
    <form
      action={uploadProductImageAction}
      className="grid gap-4"
      onSubmit={(event) => {
        if (fileError) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="product_id" value={productId} />
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Colour name</span>
        <input
          type="text"
          name="colour_name"
          className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700"
          placeholder="Pink"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Upload colour image</span>
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="block w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file && file.size > maxImageSizeBytes) {
              setFileError(
                `This image is ${formatFileSize(file.size)}. Please upload an image up to 5 MB.`,
              );
              return;
            }

            setFileError("");
          }}
          required
        />
      </label>
      {fileError ? (
        <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {fileError}
        </div>
      ) : (
        <p className="text-xs leading-5 text-stone-500">
          Use PNG, JPG, WebP, or GIF. Keep each product image under 5 MB.
        </p>
      )}
      <label className="flex items-center gap-3 text-sm text-stone-700">
        <input type="hidden" name="make_primary" value="false" />
        <input
          type="checkbox"
          name="make_primary"
          value="true"
          className="h-4 w-4 rounded border-stone-300 text-stone-950"
        />
        Make this the primary storefront image
      </label>
      <SubmitButton
        pendingLabel="Uploading image..."
        className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
      >
        Add colour image
      </SubmitButton>
    </form>
  );
}
