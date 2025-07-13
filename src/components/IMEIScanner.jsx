import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const IMEIScanner = ({ onScanned, onClose }) => {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const [log, setLog] = useState("Waiting for scan...");
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        setLog("🔧 Initializing scanner...");

        await new Promise((r) => setTimeout(r, 1000)); // Short delay for UX

        if (!videoRef.current) {
          setLog("❌ Video element not ready");
          return;
        }

        setScanning(true);
        setLog("📷 Accessing camera...");

        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        const backCamera = videoInputDevices.find((device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
        ) || videoInputDevices[0];

        if (!backCamera) {
          setLog("❌ No camera found");
          return;
        }

        setLog(`✅ Using camera: ${backCamera.label}`);

        await codeReader.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !scanned) {
              const code = result.getText();
              setScanned(true);
              setLog(`✅ Scanned IMEI: ${code}`);
              onScanned(code);
              codeReader.current.reset();
              setScanning(false);
            } else if (err && err.name !== "NotFoundException") {
              setLog(`⚠️ Error: ${err.message}`);
            } else {
              setLog("🔍 Scanning...");
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
      } catch (e) {
        console.error(e);
        setLog(`❌ Camera error: ${e.message}`);
      }
    };

    startScanner();

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      setScanning(false);
    };
  }, [onScanned, scanned]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            if (codeReader.current) {
              codeReader.current.reset();
            }
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
        {/* Scanner Box Overlay */}
        <div className="absolute inset-0 border-4 border-dashed border-white rounded-md pointer-events-none" />
      </div>

      {/* Log Texts */}
      <div className="text-white mt-6 w-full max-w-lg text-center">
        <p className="text-lg font-semibold">📦 Align the IMEI barcode inside the box</p>
        <p className="text-sm mt-2 break-words whitespace-pre-wrap">{log}</p>
      </div>
    </div>
  );
};

export default IMEIScanner;
