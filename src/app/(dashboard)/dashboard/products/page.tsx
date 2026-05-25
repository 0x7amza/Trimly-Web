"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, Product } from "@/lib/api";
import { useB2BAuth } from "@/components/providers";
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  PackageOpen,
  Check,
  AlertTriangle,
} from "lucide-react";

const inputCls =
  "w-full bg-canvas border border-ink/10 rounded-xl py-3 px-4 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm";

export default function ProductsPage() {
  const { activeBarber, shop } = useB2BAuth();
  const shopId = shop?.id || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const res = await api.products.getShopProducts(shopId);
      if (res.success) setProducts(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  const openAdd = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPriceStr("");
    setImageUrl("");
    setError("");
    setIsOpen(true);
  };

  const openEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPriceStr((prod.price / 100).toFixed(2));
    setImageUrl(prod.imageUrl);
    setError("");
    setIsOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const res = await api.upload(file);
      if (res.success) setImageUrl(res.data.url);
    } catch (err: any) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceStr || !shopId) return;
    const priceInPence = Math.round(parseFloat(priceStr) * 100);
    if (isNaN(priceInPence) || priceInPence <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, shopId, {
          name: name.trim(),
          description: description.trim(),
          price: priceInPence,
          imageUrl: imageUrl.trim(),
        });
        if (res.success) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data : p)));
          setIsOpen(false);
          flash("Product updated successfully.");
        }
      } else {
        const res = await api.products.create({
          shopId,
          name: name.trim(),
          description: description.trim(),
          price: priceInPence,
          imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&h=400&q=80",
        });
        if (res.success) {
          setProducts((prev) => [...prev, res.data]);
          setIsOpen(false);
          flash("Product added to marketplace.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prod: Product) => {
    if (!confirm(`Delete "${prod.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.products.delete(prod.id, shopId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        flash("Product removed.");
      }
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    }
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-ink flex items-center gap-2">
            <ShoppingBag className="w-7 h-7" />
            Products Marketplace
          </h1>
          <p className="text-sm text-body-text mt-1">
            Manage the retail products displayed on your public booking page. Each shop has its own isolated catalogue.
          </p>
        </div>
        <button onClick={openAdd} className="button-primary cursor-pointer flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Toast Notifications */}
      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && !isOpen && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-canvas border border-ink/10 rounded-2xl p-5 animate-pulse h-60" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-24 border-2 border-dashed border-ink/10 rounded-2xl bg-canvas">
          <PackageOpen className="w-14 h-14 text-mute-text/40 mb-4" />
          <h3 className="text-lg font-black text-ink mb-2">No products yet</h3>
          <p className="text-sm text-body-text max-w-xs">
            Add retail products — pomades, beard oils, shampoos — to your public marketplace. Clients can add them alongside bookings.
          </p>
          <button onClick={openAdd} className="button-primary mt-6 cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
            >
              {/* Product Image */}
              <div className="relative h-44 overflow-hidden bg-canvas-soft">
                {prod.imageUrl ? (
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&h=400&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-mute-text/30" />
                  </div>
                )}
                {/* Price badge */}
                <div className="absolute top-3 right-3 bg-ink text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
                  £{(prod.price / 100).toFixed(2)}
                </div>
                {!prod.isActive && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Hidden
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="font-extrabold text-sm text-ink leading-tight mb-1">{prod.name}</h3>
                <p className="text-[11px] text-mute-text line-clamp-2 leading-relaxed">{prod.description}</p>

                <div className="flex gap-2 mt-4 border-t border-ink/5 pt-4">
                  <button
                    onClick={() => openEdit(prod)}
                    className="button-secondary flex-1 !py-2 !px-3 text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(prod)}
                    className="button-tertiary flex-1 !py-2 !px-3 text-xs !text-negative border-negative hover:!bg-negative/5 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-ink/10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-7 py-5 border-b border-ink/5">
              <h3 className="text-lg font-black text-ink">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-mute-text hover:text-ink transition-colors hover:bg-canvas-soft"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              {/* Product Image Preview + Upload */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Product Image
                </label>
                <div className="flex gap-3 items-start">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-ink/10 bg-canvas-soft flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&h=400&q=80";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-mute-text/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      placeholder="https://... (paste image URL)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className={inputCls}
                    />
                    <input
                      type="file"
                      ref={fileRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                      className="button-secondary !py-2 !px-3 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Beard Oil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Description
                </label>
                <textarea
                  placeholder="Brief product description for clients..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputCls} h-20 resize-none`}
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text">
                  Price (£) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-mute-text">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="14.99"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className={`${inputCls} pl-7`}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="button-secondary flex-1 cursor-pointer py-3"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="button-primary flex-1 cursor-pointer py-3 disabled:opacity-50">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    editingProduct ? "Update Product" : "Add to Marketplace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
