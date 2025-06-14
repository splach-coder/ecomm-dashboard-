import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const IMEIScanner = ({ onScanned, onClose }) => {
  const [scanned, setScanned] = useState(false);

  const handleScan = (err, result) => {
    if (result?.text && !scanned) {
      setScanned(true);
      onScanned(result.text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="text-white text-xl font-bold px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          ✕
        </button>
      </div>

      <div className="relative w-full max-w-lg aspect-video border-4 border-green-500 rounded-xl overflow-hidden shadow-lg">
        <BarcodeScannerComponent
          width={500}
          height={500}
          onUpdate={handleScan}
        />
        <div className="absolute inset-0 border-4 border-dashed border-white rounded-md pointer-events-none" />
      </div>

      <p className="text-white mt-6">Align the IMEI barcode inside the box {scanned}</p>
    </div>
  );
};

export default IMEIScanner;