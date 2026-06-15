// Web Worker for client-side eye-gaze tracking
// Runs TensorFlow.js and BlazeFace on a separate thread to maintain a locked 60 FPS UI refresh rate.

let model = null;
let isInitializing = false;

// Load TensorFlow.js and BlazeFace from JS CDN
try {
  importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
  importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js');
} catch (err) {
  console.error("Worker importScripts failed: ", err);
}

async function initModel() {
  if (model || isInitializing) return;
  isInitializing = true;
  
  try {
    if (typeof tf === 'undefined' || typeof blazeface === 'undefined') {
      throw new Error("TensorFlow.js or BlazeFace library failed to load in Web Worker.");
    }
    
    // Explicitly initialize CPU backend for maximum compatibility in worker threads
    await tf.setBackend('cpu');
    await tf.ready();
    
    model = await blazeface.load();
    self.postMessage({ type: 'STATUS', status: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'STATUS', status: 'error', message: err.message });
  } finally {
    isInitializing = false;
  }
}

self.onmessage = async function (e) {
  const { type, imageData } = e.data;

  if (type === 'INIT') {
    await initModel();
    return;
  }

  if (type === 'PROCESS_FRAME') {
    if (!model) {
      // Auto-initialize if model is not yet loaded
      await initModel();
      if (!model) {
        self.postMessage({ type: 'STATUS', status: 'error', message: 'Model not loaded' });
        return;
      }
    }

    try {
      const { width, height, data } = imageData;
      
      // Wrap tensor operations in tf.tidy to prevent memory leaks in the worker context
      const faceData = await tf.tidy(() => {
        // Construct 3D tensor from transferable array buffer
        const channels = 4;
        const imgTensor = tf.tensor3d(new Uint8Array(data), [height, width, channels], 'int32');
        
        // Strip alpha channel (slice to RGB)
        const rgbTensor = imgTensor.slice([0, 0, 0], [height, width, 3]);
        
        // Run estimation (don't return tensor, evaluate immediately)
        return model.estimateFaces(rgbTensor, false);
      });

      if (faceData && faceData.length > 0) {
        const pred = faceData[0];
        // Send predictions (landmarks, bounding box) back to the main thread
        self.postMessage({
          type: 'DETECTION',
          detected: true,
          landmarks: pred.landmarks,
          topLeft: pred.topLeft,
          bottomRight: pred.bottomRight,
          probability: pred.probability ? pred.probability[0] : 1
        });
      } else {
        self.postMessage({
          type: 'DETECTION',
          detected: false
        });
      }
    } catch (err) {
      self.postMessage({ type: 'ERROR', message: err.message });
    }
  }
};
