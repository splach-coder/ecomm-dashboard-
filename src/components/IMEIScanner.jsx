import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { Camera, Scan, CheckCircle, XCircle } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess }) => {
  const [isScannerOn, setIsScannerOn] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  // Check camera permissions when component mounts
  useEffect(() => {
    if (isScannerOn) {
      checkCameraPermissions();
    }
  }, [isScannerOn]);

  const checkCameraPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setError('Camera access was denied. Please enable camera permissions.');
    }
  };

  const handleScanResult = (result, error) => {
    if (!!result) {
      setIsScannerOn(false);
      onScanSuccess(result?.text);
    }

    if (!!error) {
      const ignorableErrors = [
        'NotFoundException',
        'ChecksumException',
        'FormatException'
      ];
      
      if (!ignorableErrors.includes(error.name)) {
        console.error('Scanner error:', error);
        setError('An error occurred while scanning. Please try again.');
      }
    }
  };

  const startScanner = () => {
    setError(null);
    setIsScannerOn(true);
  };

  if (isScannerOn) {
    if (hasPermission === false) {
      return (
        <div className="w-full max-w-md mx-auto bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="bg-red-900/50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-400 flex items-center">
              <XCircle className="mr-2" />
              Camera Access Denied
            </h2>
            <p className="text-slate-300 mt-2">
              Please enable camera permissions in your browser settings.
            </p>
            <button
              onClick={() => setIsScannerOn(false)}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md mx-auto bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden shadow-inner">
          <QrReader
            onResult={handleScanResult}
            constraints={{
              facingMode: 'environment',
              aspectRatio: 1
            }}
            scanDelay={300}
            videoContainerStyle={{
              width: '100%',
              height: '100%',
              paddingTop: '0',
              position: 'relative'
            }}
            videoStyle={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: hasPermission ? 'block' : 'none'
            }}
            ViewFinder={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2/3 h-2/3 border-4 border-dashed border-cyan-400 rounded-lg animate-pulse"></div>
              </div>
            )}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => setIsScannerOn(false)} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/50 p-4 rounded-lg mt-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-red-400 flex items-center">
              <XCircle className="mr-2" />
              Error
            </h2>
            <p className="text-slate-300 mt-2 break-words">
              {error}
            </p>
          </div>
        )}
        
        {hasPermission === null && (
          <div className="text-center text-slate-400">
            <p>Loading camera...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto">
      <button
        onClick={startScanner}
        className="flex items-center justify-center w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
      >
        <Camera className="mr-2 h-6 w-6" />
        Start Scanner
      </button>
    </div>
  );
};

export default function App() {
  const [scannedData, setScannedData] = useState(null);

  const handleScanSuccess = (data) => {
    const imeiRegex = /^\d{15}$/;
    const cleanData = data.trim();
    
    if (imeiRegex.test(cleanData)) {
      setScannedData(cleanData);
    } else {
      alert('Invalid IMEI format. Please scan a valid 15-digit IMEI barcode.');
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 flex items-center justify-center">
            <Scan className="mr-3 h-8 w-8" />
            IMEI Scanner App
          </h1>
          <p className="text-slate-400 mt-2">
            Use the scanner below to capture the IMEI barcode.
          </p>
        </div>

        {!scannedData ? (
          <BarcodeScanner onScanSuccess={handleScanSuccess} />
        ) : (
          <div className="bg-slate-700 p-4 rounded-lg mt-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-cyan-400 flex items-center">
              <CheckCircle className="mr-2 text-green-400" />
              Scan Successful
            </h2>
            <p className="text-slate-300 mt-2 break-words">
              <strong>Scanned IMEI:</strong> {scannedData}
            </p>
            <button
              onClick={() => setScannedData(null)}
              className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-all"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
      <footer className="text-center text-slate-500 mt-8">
        <p>Powered by react-qr-reader</p>
      </footer>
    </div>
  );
}