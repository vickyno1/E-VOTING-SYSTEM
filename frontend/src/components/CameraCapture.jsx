import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, AlertTriangle, Check } from 'lucide-react';

export const CameraCapture = ({ onCapture, initialImage = null, actionLabel = 'Capture Face' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(initialImage);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [useUploadFallback, setUseUploadFallback] = useState(false);

  useEffect(() => {
    if (!capturedImage && !useUploadFallback) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [useUploadFallback]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera initialization error:', err);
      setCameraError('Camera access denied or unavailable. You can use the fallback image upload below.');
      setUseUploadFallback(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror horizontal to match webcam display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (onCapture) {
      onCapture(null);
    }
    if (!useUploadFallback) {
      startCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must not exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedImage(dataUrl);
      if (onCapture) {
        onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="camera-container" style={{ textAlign: 'center' }}>
      {cameraError && (
        <div className="alert alert-warning" style={{ fontSize: '0.85rem', textAlign: 'left' }}>
          <AlertTriangle size={18} />
          <div>{cameraError}</div>
        </div>
      )}

      {!capturedImage ? (
        <>
          {!useUploadFallback ? (
            <div className="camera-wrapper">
              <video ref={videoRef} playsInline muted className="camera-video" />
              <div className="camera-overlay">
                <div className="face-guide-oval"></div>
                <div className="camera-guide-text">Align your face inside the oval</div>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                backgroundColor: 'var(--gray-50)',
                marginBottom: '1rem',
              }}
            >
              <Upload size={40} color="var(--gray-500)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Upload Facial Photograph</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                Ensure your face is clearly visible, well-lit, and centered.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="face-file-input"
              />
              <label htmlFor="face-file-input" className="btn btn-primary btn-sm">
                Choose Photo
              </label>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {!useUploadFallback && cameraActive && (
              <button type="button" onClick={handleCapture} className="btn btn-primary">
                <Camera size={18} /> {actionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => setUseUploadFallback(!useUploadFallback)}
              className="btn btn-secondary btn-sm"
            >
              {useUploadFallback ? 'Switch to Camera' : 'Upload Photo Instead'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '320px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '3px solid var(--success)',
            }}
          >
            <img src={capturedImage} alt="Face Preview" style={{ width: '100%', display: 'block' }} />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'var(--success)',
                color: '#fff',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
              }}
            >
              <Check size={16} />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={handleRetake} className="btn btn-secondary btn-sm">
              <RefreshCw size={16} /> Retake Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing bitmap from video element */}
      <canvas ref={canvasRef} className="camera-canvas" />
    </div>
  );
};
