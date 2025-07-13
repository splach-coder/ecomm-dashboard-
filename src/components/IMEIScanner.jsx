import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Tesseract from "tesseract.js";

const IMEIScanner = ({ onScanned, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReader = useRef(null);
  const [log, setLog] = useState("📷 Initializing...");
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    let fallbackTimer = null;

    const startScanner = async () => {
      try {
        const devices = await codeReader.current.listVideoInputDevices();
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
        ) || devices[0];

        if (!backCamera) {
          setLog("❌ No camera device found");
          return;
        }

        setLog("✅ Rear camera selected: " + backCamera.label);

        await codeReader.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !scanned) {
              const code = result.getText();
              setScanned(true);
              setScanning(false);
              setLog(`✅ Barcode found: ${code}`);
              codeReader.current.reset();
              onScanned(code);
            } else if (err && err.name !== "NotFoundException") {
              setLog(`⚠️ Barcode Error: ${err.message}`);
            } else {
              setLog("🔍 Scanning for barcode...");
            }
          },
          {
            video: {
              facingMode: { exact: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          }
        );

        // Fallback to OCR after 5 sec if barcode fails
        fallbackTimer = setTimeout(() => {
          if (!scanned) {
            setLog("⏱️ Barcode not found. Falling back to OCR...");
            fallbackToOCR();
          }
        }, 5000);
      } catch (e) {
        console.error("Camera error", e);
        setLog("❌ Failed to access camera: " + e.message);
      }
    };

    const fallbackToOCR = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) {
          setLog("❌ Video or canvas not ready");
          return;
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/png");

        const { data: { text } } = await Tesseract.recognize(imageData, "eng", {
          logger: (m) => console.log(m)
        });

        const matches = text.match(/\d{15}/g); // Find 15-digit IMEI
        if (matches && matches[0]) {
          setLog(`✅ OCR IMEI: ${matches[0]}`);
          setScanned(true);
          setScanning(false);
          codeReader.current.reset();
          onScanned(matches[0]);
        } else {
          setLog("❌ OCR failed to find IMEI");
        }
      } catch (e) {
        console.error("OCR error", e);
        setLog("❌ OCR Error: " + e.message);
      }
    };

    startScanner();

    return () => {
      if (codeReader.current) codeReader.current.reset();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      setScanning(false);
    };
  }, [onScanned, scanned]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      {/* Close Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            codeReader.current?.reset();
            onClose();
          }}
          className="text-white text-xl font-bold px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          ✕
        </button>
      </div>

      {/* Camera Preview */}
      <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden shadow-lg border-4 border-green-500">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <div className="absolute inset-0 border-4 border-dashed border-white rounded-md pointer-events-none" />
      </div>

      {/* Canvas (hidden for OCR fallback) */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Logs */}
      <div className="text-white mt-6 w-full max-w-lg text-center">
        <p className="text-lg font-semibold">📲 Align the IMEI with the box</p>
        <p className="text-sm mt-2 break-words whitespace-pre-wrap">{log}</p>
      </div>
    </div>
  );
};

export default IMEIScanner;
