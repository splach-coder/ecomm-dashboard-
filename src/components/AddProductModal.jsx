// AddProductModal.jsx
import { useState } from "react";
import { X, Upload, DollarSign, FileText } from "lucide-react";
import supabase from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const BRANDS = [
  "Apple",
  "Samsung",
  "Google",
  "Huawei",
  "Xiaomi",
  "OnePlus",
  "Sony",
  "LG",
  "Nokia",
  "Oppo",
  "Vivo",
  "Motorola",
  "Asus",
  "HTC",
  "Lenovo",
];

const AddProductModal = ({ showAddModal, setShowAddModal }) => {
  const [form, setForm] = useState({
    title: "",
    imei: "",
    description: "",
    price: "",
    in_stock: "",
    category: "",
    brand: "",
    condition: "new",
  });
  const [images, setImages] = useState([]);
  const [thumbs, setThumbs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const validateFiles = (files) => {
    const arr = Array.from(files);
    if (arr.length > 5) return "Max 5 images allowed.";
    for (const f of arr) {
      if (!f.type.startsWith("image/")) return "Only image files allowed.";
      if (f.size > 2 * 1024 * 1024) return "Max 2MB per image.";
    }
    return null;
  };

  const handleFiles = (files) => {
    const err = validateFiles(files);
    if (err) return alert(err);
    const arr = Array.from(files);
    setImages(arr);
    setThumbs(arr.map((file) => URL.createObjectURL(file)));
  };

  const uploadAndInsert = async () => {
    const urls = [];

    console.log("Starting image upload...");

    for (const file of images) {
      const path = `${Date.now()}-${file.name}`;
      console.log(`Uploading: ${path}`);

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (upErr) {
        console.error("Upload error:", upErr);
        throw new Error(`Image upload failed: ${upErr.message}`);
      }

      const { data: urlData, error: urlErr } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      if (urlErr || !urlData?.publicUrl) {
        console.error("Public URL error:", urlErr || "No public URL");
        throw new Error("Failed to get public image URL");
      }

      urls.push(urlData.publicUrl);
      console.log(`Uploaded & accessible at: ${urlData.publicUrl}`);
    }

    console.log("All images uploaded. Inserting product...");

    const { error: insertErr, data: insertData } = await supabase
      .from("products")
      .insert([
        {
          title: form.title,
          imei: form.imei,
          description: form.description,
          price: parseFloat(form.price),
          in_stock: parseInt(form.in_stock),
          category: form.category,
          brand: form.brand,
          condition: form.condition,
          images: urls,
        },
      ]);

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw new Error(`Product insert failed: ${insertErr.message}`);
    }

    navigate('/products')
  };

  const handleSubmit = async () => {
    for (const key of [
      "title",
      "imei",
      "price",
      "in_stock",
      "category",
      "brand",
    ]) {
      if (!form[key]) return alert(`Please fill in ${key}`);
    }
    if (images.length === 0) return alert("Upload at least 1 image.");
    try {
      setUploading(true);
      await uploadAndInsert();
      alert("Product added 🎉");
      setShowAddModal(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
        showAddModal ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2
        md:transform md:-translate-x-1/2 md:-translate-y-1/2
        bg-white rounded-t-2xl md:rounded-2xl md:w-[700px] md:max-h-[90vh]
        transition-transform ${
          showAddModal
            ? "translate-y-0"
            : "translate-y-full md:translate-y-0 md:scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Product</h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {[
              ["title", "Title"],
              ["imei", "IMEI"],
              ["price", "Price (MAD)"],
              ["in_stock", "Stock"],
            ].map(([name, label]) => (
              <div key={name} className="relative">
                <input
                  name={name}
                  type={
                    name.includes("price")
                      ? "number"
                      : name.includes("stock")
                      ? "number"
                      : "text"
                  }
                  required
                  value={form[name] || (name === "in_stock" ? 1 : "")}
                  onChange={handleChange}
                  className="peer block w-full px-3 pt-6 pb-1 border rounded focus:outline-none focus:ring"
                  placeholder=" "
                />
                <label
                  className="absolute left-4 top-1 text-gray-500 text-sm
      peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm transition"
                >
                  {label}
                </label>
              </div>
            ))}

            {/* Category & Brand */}
            {["category", "brand"].map((name) => (
              <div key={name} className="relative">
                <select
                  name={name}
                  required
                  value={form[name]}
                  onChange={handleChange}
                  className="peer block w-full px-3 p-3 border rounded focus:outline-none focus:ring bg-white"
                >
                  <option value="" disabled>
                    Choose {name}
                  </option>
                  {(name === "brand"
                    ? BRANDS
                    : ["Phone", "Monitor", "Accessory"]
                  ).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Condition */}
            <div className="flex gap-4">
              {["new", "used"].map((val) => (
                <label key={val} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="condition"
                    value={val}
                    checked={form.condition === val}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </label>
              ))}
            </div>

            {/* Description */}
            <div>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="Description (optional)"
                className="block w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              />
            </div>

            {/* Image Upload */}
            <div
              onClick={() => document.getElementById("fileInput").click()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p>Click or drag & drop (max 5 images, 2 MB each)</p>
              {thumbs.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {thumbs.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={() => setShowAddModal(false)}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded hover:bg-oceanblue disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
