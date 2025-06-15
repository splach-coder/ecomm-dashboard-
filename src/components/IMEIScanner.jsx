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
        setLog("Starting camera in 3 seconds...");
        await new Promise((r) => setTimeout(r, 3000)); // 3 sec delay

        if (!videoRef.current) {
          setLog("Video element not ready");
          return;
        }

        setLog("Accessing camera...");
        setScanning(true);

        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        const backCamera = videoInputDevices.find(device =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
        ) || videoInputDevices[0];

        await codeReader.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !scanned) {
              setScanned(true);
              setLog(`Scanned IMEI: ${result.getText()}`);
              onScanned(result.getText());
              // If you want to keep scanning after first scan, comment out the next line:
              codeReader.current.reset();
              setScanning(false);
            }
            else if (err && !(err.name === "NotFoundException")) {
              setLog(`Error: ${err.message}`);
            } else {
              setLog("Scanning...");
            }
          }
        );
      } catch (e) {
        setLog(`Camera error: ${e.message}`);
      }
    };

    startScanner();

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
        setScanning(false);
      }
    };
  }, [onScanned, scanned]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
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

      <p className="text-white mt-6">Align the IMEI barcode inside the box</p>
      <p className="text-white mt-2 text-sm break-words">{log}</p>
    </div>
  );
};

export default IMEIScanner;
