import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = ({ onScanned, onClose }) => {
  const videoRef = useRef(null);
  const reader = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [log, setLog] = useState('Initializing...');
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    reader.current = new BrowserMultiFormatReader();

    (async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);

        const back = videoInputs
          .find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear')
          );
        setSelectedDeviceId((back || videoInputs[0])?.deviceId);

      } catch (e) {
        setLog(`Failed to get devices: ${e.message}`);
      }
    })();

    return () => {
      reader.current?.reset();
    };
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    setLog('📷 Starting scanner...');
    reader.current.decodeFromVideoDevice(
      selectedDeviceId,
      videoRef.current,
      (result, err) => {
        if (result && !scanned) {
          const code = result.getText();
          setScanned(true);
          setLog(`✅ Scanned: ${code}`);
          onScanned(code);
          reader.current.reset();
        } else if (err && err.name !== 'NotFoundException') {
          setLog(`⚠️ ${err.message}`);
        } else {
          setLog('🔍 Scanning...');
        }
      },
      { video: { deviceId: selectedDeviceId, facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } }
    );
  }, [selectedDeviceId]);

  return (
    <div className="scanner-modal">
      <button className="close-btn" onClick={() => { reader.current.reset(); onClose(); }}>✕</button>
      <div className="picker">
        <label>Camera:</label>
        <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
          {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
        </select>
      </div>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%' }} />
      <div className="log">
        <p>{log}</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
