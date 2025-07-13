import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

const IMEICameraScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imei, setIMEI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'environment' }, // Rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreamStarted(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access the camera. Try a different device or browser.');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamStarted(false);
    }
  };

  const captureAndScan = async () => {
    setLoading(true);
    setIMEI(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');

    try {
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: m => console.log(m)
      });

      const text = result.data.text;
      const matches = text.match(/\d{15}/g);
      setIMEI(matches?.[0] || 'No IMEI found');
    } catch (err) {
      console.error('OCR error:', err);
      setIMEI('Error reading IMEI');
    }

    setLoading(false);
  };

  return (
    <div>
      {!streamStarted ? (
        <button onClick={startCamera}>📷 Start Camera</button>
      ) : (
        <button onClick={stopCamera}>🛑 Stop Camera</button>
      )}

      <div style={{ marginTop: 10 }}>
        <video
          ref={videoRef}
          width="100%"
          autoPlay
          playsInline
          muted
          style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #ccc' }}
        />
      </div>

      {streamStarted && (
        <button onClick={captureAndScan} disabled={loading} style={{ marginTop: 10 }}>
          {loading ? '🔍 Scanning...' : '📸 Capture & Read IMEI'}
        </button>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {imei && (
        <div style={{ marginTop: 10 }}>
          <strong>📱 IMEI:</strong> {imei}
        </div>
      )}
    </div>
  );
};

export default IMEICameraScanner;
