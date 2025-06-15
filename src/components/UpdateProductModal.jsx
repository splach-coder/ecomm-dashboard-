import { useEffect, useState } from "react";
import { X, Upload } from "lucide-react";
import supabase from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";


const BRANDS = [
  "Apple","Samsung","Google","Huawei","Xiaomi","OnePlus","Sony",
  "LG","Nokia","Oppo","Vivo","Motorola","Asus","HTC","Lenovo"
];
const CATEGORIES = ["Phone", "Monitor", "Accessory"];

const UpdateProductModal = ({ product, show, setShow }) => {
  const [form, setForm] = useState(product);
  const [newImages, setNewImages] = useState([]);
  const [thumbs, setThumbs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setForm(product);
  }, [product]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFiles = (files) => {
    const arr = Array.from(files);
    if (form.images.length + arr.length > 5)
      return alert("Max 5 images total.");
    for (const f of arr) {
      if (!f.type.startsWith("image/")) return alert("Only images allowed.");
      if (f.size > 2 * 1024 * 1024) return alert("Max 2MB per image.");
    }
    setNewImages(arr);
    setThumbs(arr.map(file => URL.createObjectURL(file)));
  };

  const deleteImage = async (url) => {
    const filename = url.split("/").pop();
    const { error } = await supabase.storage
      .from("product-images")
      .remove([filename]);
    if (error) return alert("Delete failed");
    setForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }));
  };

  const uploadNewImages = async () => {
    const urls = [];
    for (const file of newImages) {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleUpdate = async () => {
    for (const key of ["title", "imei", "price", "in_stock", "category", "brand"])
      if (!form[key]) return alert(`Missing: ${key}`);
    if (form.images.length + newImages.length > 5)
      return alert("Max 5 images allowed.");
    try {
      setUploading(true);
      const uploaded = await uploadNewImages();
      const finalImages = [...form.images, ...uploaded];
  
      const updatedProduct = {
        ...form,
        price: parseFloat(form.price),
        in_stock: parseInt(form.in_stock),
        images: finalImages,
      };
  
      const { error } = await supabase
        .from("products")
        .update(updatedProduct)
        .eq("id", product.id);
  
      if (error) throw error;
  
      alert("Updated ✅");
      setShow(false);
  
      // ⬇️ Navigate with updated product
      navigate(`/product/${updatedProduct.id}`, { state: { product: updatedProduct } });
  
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };
  

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
      show ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      <div className={`fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2
        md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white
        rounded-t-2xl md:rounded-2xl md:w-[700px] md:max-h-[90vh]
        transition-transform ${ show
         ? "translate-y-0" : "translate-y-full md:translate-y-0 md:scale-95"
      }`}>

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Update Product</h2>
          <button onClick={() => setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {[
            ["title","Title"],["imei","IMEI"],
            ["price","Price (MAD)"],["in_stock","Stock"]
          ].map(([name,label])=>(
            <div key={name} className="relative">
              <input
                name={name} type={name.includes("price") || name.includes("stock") ? "number":"text"}
                value={form[name]} onChange={handleChange}
                className="peer block w-full px-3 pt-6 pb-1 border rounded focus:outline-none focus:ring"
                placeholder=" " required />
              <label className="absolute left-4 top-1 text-gray-500 text-sm
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm transition">
                {label}
              </label>
            </div>
          ))}

          {/* Selects */}
          {["category", "brand"].map(name => (
            <select
              key={name} name={name} required
              value={form[name]} onChange={handleChange}
              className="block w-full px-3 py-2 border rounded bg-white"
            >
              <option value="" disabled>Select {name}</option>
              {(name==="brand"?BRANDS:CATEGORIES).map(opt=>(
                <option key={opt}>{opt}</option>
              ))}
            </select>
          ))}

          {/* Radio */}
          <div className="flex gap-4">
            {["new","used"].map(val => (
              <label key={val} className="flex items-center gap-2">
                <input
                  type="radio" name="condition" value={val}
                  checked={form.condition === val}
                  onChange={handleChange} /> {val}
              </label>
            ))}
          </div>

          {/* Description */}
          <textarea
            name="description" rows="3" value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="block w-full px-3 py-2 border rounded"
          />

          {/* Existing Images */}
          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {form.images.map((src,i)=>(
                <div key={i} className="relative">
                  <img src={src} className="w-16 h-16 object-cover rounded" />
                  <button
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-xs shadow"
                    onClick={() => deleteImage(src)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add Images */}
          <div
            onClick={()=>document.getElementById("updateFileInput").click()}
            onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files)}}
            onDragOver={e=>e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
          >
            <input
              id="updateFileInput" type="file" accept="image/*"
              multiple hidden onChange={e=>handleFiles(e.target.files)} />
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p>Click or drag to upload</p>
            {thumbs.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {thumbs.map((src,i)=>(
                  <img key={i} src={src} className="w-16 h-16 rounded object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={() => setShow(false)}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate} disabled={uploading}
            className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded hover:bg-oceanblue disabled:opacity-50"
          >
            {uploading ? "Updating..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpdateProductModal;