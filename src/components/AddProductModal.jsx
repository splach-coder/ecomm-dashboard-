import { useState, useEffect, useRef } from "react";
import { X, Upload, Camera } from "lucide-react";
import supabase from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { useTranslation } from "react-i18next";
import IMEIScanner from "./IMEIScanner";

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

const MAX_IMAGE_SIZE_MB = 0.5; // 500KB target
const MAX_WIDTH_HEIGHT = 1200; // pixels

const AddProductModal = ({ showAddModal, setShowAddModal }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    imei: "",
    description: "",
    price: "",
    in_stock: "",
    category: "",
    brand: "",
    condition: "used",
    supplier_name: "",
    supplier_phone: "",
  });
  const [images, setImages] = useState([]);
  const [thumbs, setThumbs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [showReader, setShowReader] = useState(false);
  const handleClick = () => setShowReader(true);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    const handleResize = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Set up video stream when camera is shown
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateFiles = (files) => {
    const arr = Array.from(files);
    if (arr.length > 5) return t("add_product_modal.messages.max_images");
    for (const f of arr) {
      if (!f.type.startsWith("image/"))
        return t("add_product_modal.messages.image_files_only");
    }
    return null;
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: MAX_IMAGE_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_HEIGHT,
      useWebWorker: true,
      fileType: "image/jpeg",
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Compression error:", error);
      return file;
    }
  };

  const handleFiles = async (files) => {
    const err = validateFiles(files);
    if (err) return alert(err);

    setUploading(true);
    try {
      const compressedFiles = await Promise.all(
        Array.from(files).map((file) => compressImage(file))
      );
      setImages((prev) => [...prev, ...compressedFiles]);
      setThumbs((prev) => [
        ...prev,
        ...compressedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } catch (error) {
      alert(t("add_product_modal.messages.error", { message: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert(t("add_product_modal.messages.camera_error"));
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const takePicture = async () => {
    if (!cameraStream || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setUploading(true);
    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      const compressedFile = await compressImage(file);
      setImages((prev) => [...prev, compressedFile]);
      setThumbs((prev) => [...prev, URL.createObjectURL(compressedFile)]);
    } catch (error) {
      alert(t("add_product_modal.messages.error", { message: error.message }));
    } finally {
      setUploading(false);
      stopCamera();
    }
  };

  const handleImageCapture = () => {
    if (isMobile) {
      // On mobile, show options
      const choice = confirm(t("add_product_modal.camera.choose_source"));
      if (choice) {
        startCamera();
      } else {
        document.getElementById("fileInputMobile").click();
      }
    } else {
      // On desktop, just open file picker
      document.getElementById("fileInput").click();
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setThumbs((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAndInsert = async () => {
    const urls = [];
    for (const file of images) {
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file);
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      if (!urlData?.publicUrl) throw new Error("Failed to get image URL");
      urls.push(urlData.publicUrl);
    }

    const { error: insertErr } = await supabase.from("products").insert([
      {
        ...form,
        price: parseFloat(form.price),
        in_stock: parseInt(form.in_stock),
        images: urls,
      },
    ]);

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);
    navigate("/products");
  };

  const handleSubmit = async () => {
    const requiredFields = [
      "title",
      "imei",
      "price",
      "in_stock",
      "category",
      "brand",
    ];
    const missingField = requiredFields.find((field) => !form[field]);
    if (missingField)
      return alert(
        t("add_product_modal.messages.fill_field", { field: missingField })
      );
    if (images.length === 0)
      return alert(t("add_product_modal.messages.upload_one_image"));

    try {
      setUploading(true);
      await uploadAndInsert();
      alert(t("add_product_modal.messages.product_added"));
      setShowAddModal(false);
    } catch (err) {
      alert(t("add_product_modal.messages.error", { message: err.message }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${
        showAddModal ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      

      {showReader && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ marginTop: 20 }}>
          <IMEIScanner />
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 bg-black flex justify-center gap-4">
            <button
              onClick={stopCamera}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={24} />
            </button>
            <button
              onClick={takePicture}
              disabled={uploading}
              className="p-3 bg-white rounded-full w-16 h-16 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
            >
              <div className="w-12 h-12 rounded-full border-2 border-gray-800"></div>
            </button>
            <div className="w-16"></div>
          </div>
        </div>
      )}

      {/* Product Form */}
      <div
        className={`fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-2xl md:rounded-2xl md:w-[700px] md:max-h-[90vh] transition-transform ${
          showAddModal
            ? "translate-y-0"
            : "translate-y-full md:translate-y-0 md:scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {t("add_product_modal.title")}
          </h2>
          <button
            onClick={() => setShowAddModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <button onClick={handleClick} className="bg-red-500 p-2">📷 Scan IMEI</button>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {[
              ["title", t("add_product_modal.fields.title")],
              ["imei", t("add_product_modal.fields.imei")],
              ["price", t("add_product_modal.fields.price")],
              ["in_stock", t("add_product_modal.fields.in_stock")],
              ["supplier_name", t("add_product_modal.fields.supplier_name")],
              ["supplier_phone", t("add_product_modal.fields.supplier_phone")],
            ].map(([name, label]) => (
              <div key={name} className="relative">
                <input
                  name={name}
                  type={
                    name === "price" || name === "in_stock"
                      ? "number"
                      : name === "supplier_phone"
                      ? "tel"
                      : "text"
                  }
                  required={!name.startsWith("supplier")}
                  value={form[name]}
                  onChange={handleChange}
                  className="peer block w-full px-3 pt-6 pb-1 border rounded focus:outline-none focus:ring"
                  placeholder=" "
                />
                <label className="absolute left-4 top-1 text-gray-500 text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm transition">
                  {label}
                </label>
              </div>
            ))}

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
                    {t(`add_product_modal.placeholders.choose_${name}`)}
                  </option>
                  {(name === "brand"
                    ? BRANDS
                    : ["Phone", "Accessory", "Pc", "Tablet"]
                  ).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex gap-4">
              {["used", "new"].map((val) => (
                <label key={val} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="condition"
                    value={val}
                    checked={form.condition === val}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  {t(`add_product_modal.fields.condition.${val}`)}
                </label>
              ))}
            </div>

            <div>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder={t("add_product_modal.fields.description")}
                className="block w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              />
            </div>

            <div className="space-y-4">
              {/* Single Upload Button */}
              <button
                type="button"
                onClick={handleImageCapture}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <Upload size={20} />
                <span>
                  {isMobile
                    ? t("add_product_modal.buttons.add_photo")
                    : t("add_product_modal.buttons.upload_images")}
                </span>
              </button>

              {/* Hidden file inputs */}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />
              <input
                id="fileInputMobile"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />

              {/* Drag and drop area for desktop */}
              {!isMobile && (
                <div
                  onDrop={(e) => {
                    if (uploading) return;
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500"
                >
                  <p>{t("add_product_modal.messages.drag_drop")}</p>
                  <p className="text-sm">
                    {t("add_product_modal.messages.image_compression")}
                  </p>
                </div>
              )}

              {thumbs.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {thumbs.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        className="w-16 h-16 rounded object-cover"
                        alt={`Preview ${i + 1}`}
                      />
                      <button
                        onClick={() => !uploading && removeImage(i)}
                        disabled={uploading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center disabled:opacity-50 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
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
            disabled={uploading}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {t("add_product_modal.buttons.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded hover:bg-oceanblue disabled:opacity-50"
          >
            {uploading
              ? t("add_product_modal.buttons.processing")
              : t("add_product_modal.buttons.add_product")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
