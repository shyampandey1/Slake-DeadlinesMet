"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GazeTrackerProps {
  onPauseToggle: () => void;
  onStop: () => void;
  onSkip: () => void;
  isPaused: boolean;
  isUIVisible: boolean;
}

type CalibrationStep = "idle" | "pause" | "stop" | "skip" | "complete";
type TrackerStatus = "off" | "loading" | "calibrating" | "active" | "failsafe";

export default function GazeTracker({ onPauseToggle, onStop, onSkip, isPaused, isUIVisible }: GazeTrackerProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TrackerStatus>("off");
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep>("idle");
  const [faceDetected, setFaceDetected] = useState(false);
  const [mouseSimMode, setMouseSimMode] = useState(false);
  const [showWebcamPreview, setShowWebcamPreview] = useState(false);

  // Calibration points (normalized eye-to-nose vectors)
  const [points, setPoints] = useState({
    pause: { x: 0, y: 0 },
    stop: { x: 0, y: 0 },
    skip: { x: 0, y: 0 },
  });

  // Gaze-dwell state
  const [gazeTarget, setGazeTarget] = useState<"pause" | "stop" | "skip" | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 100

  // Refs for tracking loop
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const dwellTimerRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef(points);

  // Blink detection state & refs
  const ratioHistoryRef = useRef<number[]>([]);
  const blinkStartRef = useRef<number | null>(null);
  const gazeTargetRef = useRef<"pause" | "stop" | "skip" | null>(null);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    gazeTargetRef.current = gazeTarget;
  }, [gazeTarget]);

  // Clean up
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus("off");
    setCalibrationStep("idle");
    setFaceDetected(false);
    setGazeTarget(null);
    setDwellProgress(0);
  }, []);

  const triggerBlinkClick = useCallback(() => {
    const target = gazeTargetRef.current;
    if (target) {
      if (target === "pause") onPauseToggle();
      else if (target === "stop") onStop();
      else if (target === "skip") onSkip();

      toast({
        title: "Blink Click! 😉",
        description: `Triggered ${target.toUpperCase()} via eye blink click.`,
        className: "bg-slate-900 border-amber-500/20 text-amber-400 font-bold rounded-2xl shadow-xl",
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100]);
      }
      
      // Reset progress
      setDwellProgress(0);
    }
  }, [onPauseToggle, onStop, onSkip, toast]);

  // Spacebar to trigger simulated blink click for easy manual debugging
  useEffect(() => {
    if (status !== "active") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        triggerBlinkClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, triggerBlinkClick]);

  // Initialize Worker and WebCam
  const startCamera = async () => {
    setStatus("loading");
    setMouseSimMode(false);
    
    try {
      // 1. Request camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 2. Instantiate Web Worker
      const worker = new Worker("/gaze-worker.js");
      workerRef.current = worker;

      worker.postMessage({ type: "INIT" });

      worker.onmessage = (e) => {
        const { type, status: workerStatus, detected, landmarks, topLeft, bottomRight, message } = e.data;
        
        if (type === "STATUS") {
          if (workerStatus === "ready") {
            setStatus("calibrating");
            setCalibrationStep("pause");
            toast({
              title: "Hands-Free Activated 👀",
              description: "Look at the glowing dots to calibrate your eye movement.",
            });
          } else {
            console.error("Worker error:", message);
            triggerFailsafe("Model compilation failed. Using touch fallback.");
          }
        } else if (type === "DETECTION") {
          lastDetectionTimeRef.current = Date.now();
          setFaceDetected(detected);

          if (detected && landmarks) {
            // Process landmark coordinates to compute normalized eye-to-nose offset
            const rightEye = landmarks[0]; // [x, y]
            const leftEye = landmarks[1];
            const nose = landmarks[2];

            const eyeCenterX = (rightEye[0] + leftEye[0]) / 2;
            const eyeCenterY = (rightEye[1] + leftEye[1]) / 2;

            const faceWidth = bottomRight[0] - topLeft[0];
            const faceHeight = bottomRight[1] - topLeft[1];

            // Normalize gaze vector relative to face width (scale-invariant)
            const offsetX = (eyeCenterX - nose[0]) / faceWidth;
            const offsetY = (eyeCenterY - nose[1]) / faceWidth;

            currentOffsetRef.current = { x: offsetX, y: offsetY };

            // --- Eye Blink Detection Heuristic ---
            const eyeY = (rightEye[1] + leftEye[1]) / 2;
            const distY = nose[1] - eyeY; // vertical eye-to-nose distance
            const ratio = distY / faceHeight; // scale-invariant ratio

            const history = ratioHistoryRef.current;
            history.push(ratio);
            if (history.length > 30) history.shift();

            const avgRatio = history.reduce((a, b) => a + b, 0) / history.length;

            if (history.length >= 15) {
              // If current ratio drops below 82% of running average (eyes closed/moving down)
              const isClosed = ratio < avgRatio * 0.82;
              if (isClosed) {
                if (blinkStartRef.current === null) {
                  blinkStartRef.current = Date.now();
                }
              } else {
                if (blinkStartRef.current !== null) {
                  const duration = Date.now() - blinkStartRef.current;
                  blinkStartRef.current = null;
                  
                  // Valid intentional blink click (between 80ms and 500ms)
                  if (duration >= 80 && duration <= 500) {
                    triggerBlinkClick();
                  }
                }
              }
            }

            // Render privacy-safe neon AR face mesh in PIP
            drawPreviewOverlay(landmarks, topLeft, bottomRight);
          }
        }
      };

      // 3. Start processing loop
      startProcessingLoop();

    } catch (err: any) {
      console.warn("Camera access denied or Web Worker blocked:", err);
      triggerFailsafe("Camera access denied or blocked. Using touch/mouse controls.");
    }
  };

  const triggerFailsafe = (reason: string) => {
    stopCamera();
    setStatus("failsafe");
    toast({
      title: "Gaze Failsafe Triggered ⚠️",
      description: reason,
      variant: "destructive",
    });
  };

  // Processing loop to grab frames and post to Web Worker
  const startProcessingLoop = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 128; // Small 128x128 size ensures minimal worker processing overhead
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const processFrame = () => {
      if (!streamRef.current || !workerRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_CURRENT_DATA && ctx) {
        // Draw cropped/downscaled video frame
        ctx.drawImage(video, 0, 0, 128, 128);
        const imgData = ctx.getImageData(0, 0, 128, 128);
        
        // Transfer raw array buffer (0-copy overhead) to worker thread
        const buffer = imgData.data.buffer;
        workerRef.current.postMessage(
          {
            type: "PROCESS_FRAME",
            imageData: {
              width: imgData.width,
              height: imgData.height,
              data: buffer,
            },
          },
          [buffer]
        );
      }

      // Lighting and connection failsafe: if no frame detection updates for 3 seconds, fallback
      if (Date.now() - lastDetectionTimeRef.current > 3000 && status === "active") {
        setFaceDetected(false);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // PRIVACY FIRST: Draws an abstract neon-glowing HUD/AR mesh, never drawing actual camera pixels
  const drawPreviewOverlay = (landmarks: number[][], topLeft: number[], bottomRight: number[]) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !showWebcamPreview) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw absolute dark futuristic tech HUD grid background
    ctx.fillStyle = "#020617"; // Slate 950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw thin circular radar grids in the background
    ctx.strokeStyle = "rgba(14, 165, 233, 0.12)"; // Sky-500
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 25, 0, 2 * Math.PI);
    ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, 2 * Math.PI);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 4);
    ctx.lineTo(canvas.width / 2, canvas.height - 4);
    ctx.moveTo(4, canvas.height / 2);
    ctx.lineTo(canvas.width - 4, canvas.height / 2);
    ctx.stroke();

    const scaleX = canvas.width / 320;
    const scaleY = canvas.height / 240;

    const getMirroredPt = (pt: number[]) => {
      return {
        x: canvas.width - pt[0] * scaleX,
        y: pt[1] * scaleY,
      };
    };

    const rightEye = getMirroredPt(landmarks[0]);
    const leftEye = getMirroredPt(landmarks[1]);
    const nose = getMirroredPt(landmarks[2]);
    const mouth = getMirroredPt(landmarks[3]);
    const rightEar = getMirroredPt(landmarks[4]);
    const leftEar = getMirroredPt(landmarks[5]);

    // Draw glowing neon wireframe connection lines (AR avatar overlay)
    ctx.strokeStyle = "rgba(6, 182, 212, 0.65)"; // Cyan
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(6, 182, 212, 0.8)";
    ctx.shadowBlur = 3;

    // Draw face skeleton lines
    ctx.beginPath();
    // Connect eyes
    ctx.moveTo(leftEye.x, leftEye.y);
    ctx.lineTo(rightEye.x, rightEye.y);
    
    // Connect eyes to nose
    ctx.lineTo(nose.x, nose.y);
    ctx.lineTo(leftEye.x, leftEye.y);
    
    // Connect nose to mouth
    ctx.moveTo(nose.x, nose.y);
    ctx.lineTo(mouth.x, mouth.y);

    // Connect mouth to ears
    ctx.lineTo(leftEar.x, leftEar.y);
    ctx.moveTo(mouth.x, mouth.y);
    ctx.lineTo(rightEar.x, rightEar.y);
    ctx.stroke();
    
    ctx.shadowBlur = 0; // reset glow shadow

    // Draw head bounding oval
    ctx.strokeStyle = "rgba(99, 102, 241, 0.35)"; // Indigo
    ctx.beginPath();
    const faceW = (bottomRight[0] - topLeft[0]) * scaleX;
    const faceH = (bottomRight[1] - topLeft[1]) * scaleY;
    const faceCenterX = canvas.width - (topLeft[0] + (bottomRight[0] - topLeft[0]) / 2) * scaleX;
    const faceCenterY = (topLeft[1] + (bottomRight[1] - topLeft[1]) / 2) * scaleY;
    ctx.ellipse(faceCenterX, faceCenterY, faceW / 2.2, faceH / 2.2, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw scanning target reticles on the eyes (makes it feel highly technical)
    const drawEyeReticle = (eye: { x: number; y: number }) => {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.8)"; // Amber
      ctx.lineWidth = 1.2;
      
      // Circle
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 5, 0, 2 * Math.PI);
      ctx.stroke();

      // Crosshairs ticks
      ctx.beginPath();
      ctx.moveTo(eye.x - 7, eye.y);
      ctx.lineTo(eye.x - 4, eye.y);
      ctx.moveTo(eye.x + 4, eye.y);
      ctx.lineTo(eye.x + 7, eye.y);
      ctx.moveTo(eye.x, eye.y - 7);
      ctx.lineTo(eye.x, eye.y - 4);
      ctx.moveTo(eye.x, eye.y + 4);
      ctx.lineTo(eye.x, eye.y + 7);
      ctx.stroke();
    };

    drawEyeReticle(rightEye);
    drawEyeReticle(leftEye);

    // Draw central tracking cursor at nose
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)"; // Red dot
    ctx.beginPath();
    ctx.arc(nose.x, nose.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Privacy lock warning text overlay
    ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("PRIVACY LOCK: ON", 5, 12);
  };

  // Record eye offset for a specific target point
  const calibrateTarget = (target: "pause" | "stop" | "skip") => {
    if (!faceDetected) {
      toast({
        title: "No face detected!",
        description: "Reposition yourself in front of the camera and try again.",
        variant: "destructive",
      });
      return;
    }

    setPoints((prev) => ({
      ...prev,
      [target]: { ...currentOffsetRef.current },
    }));

    toast({
      title: `${target.toUpperCase()} Registered ✅`,
      description: "Calibration point saved.",
    });

    // Advance state machine
    if (target === "pause") {
      setCalibrationStep("stop");
    } else if (target === "stop") {
      setCalibrationStep("skip");
    } else if (target === "skip") {
      setCalibrationStep("complete");
      setStatus("active");
      toast({
        title: "Hands-Free Control Engaged! 🚀",
        description: "Dwell on a button (1.5s) or blink your eyes to click instantly.",
      });
    }
  };

  // Skip calibration and use standard presets
  const skipCalibration = () => {
    setPoints({
      pause: { x: 0.05, y: -0.04 },
      stop: { x: -0.05, y: -0.04 },
      skip: { x: 0.0, y: 0.04 },
    });
    setCalibrationStep("complete");
    setStatus("active");
    toast({
      title: "Gaze Configured!",
      description: "Using standard eye calibration presets.",
    });
  };

  // Mouse simulated gaze for testing in environment
  const enableMouseSimulation = () => {
    stopCamera();
    setMouseSimMode(true);
    setStatus("active");
    setCalibrationStep("complete");
    toast({
      title: "Gaze Simulated 🖱",
      description: "Hover your mouse cursor close to the button icons to simulate gaze. Click to simulate blinks.",
    });
  };

  // Mouse move and click listeners for Gaze simulation
  useEffect(() => {
    if (!mouseSimMode || status !== "active") return;

    const handleMouseMove = (e: MouseEvent) => {
      const targets = ["pause", "stop", "skip"] as const;
      let matchedTarget: "pause" | "stop" | "skip" | null = null;

      for (const t of targets) {
        const btn = document.getElementById(`gaze-${t}-btn`);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2);
          
          if (distance < 45) {
            matchedTarget = t;
            break;
          }
        }
      }
      setGazeTarget(matchedTarget);
    };

    const handleMouseClick = () => {
      if (gazeTargetRef.current) {
        triggerBlinkClick();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
    };
  }, [mouseSimMode, status, triggerBlinkClick]);

  // Main active tracking loop (evaluates look direction every 100ms)
  useEffect(() => {
    if (status !== "active" || mouseSimMode) return;

    const trackingInterval = setInterval(() => {
      if (!faceDetected) {
        setGazeTarget(null);
        return;
      }

      const curr = currentOffsetRef.current;
      const pts = pointsRef.current;

      const distPause = Math.sqrt((curr.x - pts.pause.x) ** 2 + (curr.y - pts.pause.y) ** 2);
      const distStop = Math.sqrt((curr.x - pts.stop.x) ** 2 + (curr.y - pts.stop.y) ** 2);
      const distSkip = Math.sqrt((curr.x - pts.skip.x) ** 2 + (curr.y - pts.skip.y) ** 2);

      const minDist = Math.min(distPause, distStop, distSkip);
      let target: "pause" | "stop" | "skip" | null = null;

      const threshold = 0.08;
      if (minDist < threshold) {
        if (minDist === distPause) target = "pause";
        else if (minDist === distStop) target = "stop";
        else if (minDist === distSkip) target = "skip";
      }

      setGazeTarget(target);
    }, 100);

    return () => clearInterval(trackingInterval);
  }, [status, faceDetected, mouseSimMode]);

  // Handle Dwell Timer Accumulation (1.5 seconds)
  useEffect(() => {
    if (!gazeTarget) {
      setDwellProgress(0);
      if (dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
      return;
    }

    let accumulatedTime = 0;
    const intervalTime = 50; 
    const totalDwellTime = 1500; 

    dwellTimerRef.current = window.setInterval(() => {
      accumulatedTime += intervalTime;
      const progress = Math.min(100, (accumulatedTime / totalDwellTime) * 100);
      setDwellProgress(progress);

      if (accumulatedTime >= totalDwellTime) {
        if (gazeTarget === "pause") onPauseToggle();
        else if (gazeTarget === "stop") onStop();
        else if (gazeTarget === "skip") onSkip();

        toast({
          title: `Hands-free command run 👁`,
          description: `Executed action: ${gazeTarget.toUpperCase()}`,
        });

        setDwellProgress(0);
        setGazeTarget(null);
        if (dwellTimerRef.current) {
          clearInterval(dwellTimerRef.current);
          dwellTimerRef.current = null;
        }
      }
    }, intervalTime);

    return () => {
      if (dwellTimerRef.current) {
        clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [gazeTarget, onPauseToggle, onStop, onSkip, toast]);

  // Expose dwell loading ring elements around active buttons via absolute DOM portals
  const renderDwellRings = () => {
    if (!gazeTarget || dwellProgress <= 0 || !isUIVisible) return null;

    const btn = document.getElementById(`gaze-${gazeTarget}-btn`);
    if (!btn) return null;

    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;

    const radius = 26;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (dwellProgress / 100) * circ;

    return (
      <div 
        style={{
          position: "absolute",
          top: centerY - 32,
          left: centerX - 32,
          width: 64,
          height: 64,
          pointerEvents: "none",
          zIndex: 9999,
        }}
        className="flex items-center justify-center animate-fade-in"
      >
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="3.5"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>
      </div>
    );
  };

  return (
    <>
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Render absolute dwell portals */}
      {renderDwellRings()}

      {/* Gaze calibration guides overlay */}
      {status === "calibrating" && calibrationStep !== "complete" && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl relative">
            <div className="absolute top-4 right-4 animate-spin text-primary">
              <RefreshCw className="h-5 w-5 opacity-40" />
            </div>
            
            <h2 className="text-2xl font-bold font-headline mb-2 flex items-center justify-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
              Gaze Calibration
            </h2>
            
            <p className="text-sm text-muted-foreground mb-6">
              Please look directly at the designated target and click (or dwell) on it to calibrate your gaze coordinates.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-accent/30">
                <span className="font-medium text-sm text-foreground">1. PAUSE / PLAY Button</span>
                <Button 
                  size="sm"
                  variant={calibrationStep === "pause" ? "default" : "secondary"}
                  onClick={() => calibrateTarget("pause")}
                  disabled={calibrationStep !== "pause"}
                  className="rounded-full shadow-lg"
                >
                  Calibrate
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-accent/30">
                <span className="font-medium text-sm text-foreground">2. STOP Button</span>
                <Button 
                  size="sm"
                  variant={calibrationStep === "stop" ? "default" : "secondary"}
                  onClick={() => calibrateTarget("stop")}
                  disabled={calibrationStep !== "stop"}
                  className="rounded-full shadow-lg"
                >
                  Calibrate
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-accent/30">
                <span className="font-medium text-sm text-foreground">3. SKIP Button</span>
                <Button 
                  size="sm"
                  variant={calibrationStep === "skip" ? "default" : "secondary"}
                  onClick={() => calibrateTarget("skip")}
                  disabled={calibrationStep !== "skip"}
                  className="rounded-full shadow-lg"
                >
                  Calibrate
                </Button>
              </div>
            </div>

            <div className="flex gap-2 w-full justify-between mt-8">
              <Button size="sm" variant="ghost" className="text-xs" onClick={skipCalibration}>
                Use Presets
              </Button>
              <Button size="sm" variant="ghost" className="text-xs text-amber-500 hover:text-amber-600" onClick={enableMouseSimulation}>
                Simulate with Mouse
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating control widget (respects parent dimming / isUIVisible state) */}
      <div className={cn(
        "fixed bottom-24 left-8 z-40 flex flex-col items-start gap-2 transition-all duration-300",
        !isUIVisible && "opacity-0 pointer-events-none translate-y-4"
      )}>
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-xl border border-primary/20 rounded-full p-1.5 shadow-xl">
          {status === "off" || status === "failsafe" ? (
            <Button
              onClick={startCamera}
              className="h-10 rounded-full px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
              Gaze Control
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={stopCamera}
              className="h-10 rounded-full px-4 text-xs font-semibold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <CameraOff className="h-4 w-4" />
              Disable Gaze
            </Button>
          )}

          {status !== "off" && status !== "failsafe" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalibrationStep("pause")}
              className="h-10 w-10 rounded-full text-foreground/80 hover:bg-foreground/10"
              title="Recalibrate gaze"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {status !== "off" && status !== "failsafe" && !mouseSimMode && (
            <button
              onClick={() => setShowWebcamPreview(prev => !prev)}
              className="h-10 px-3 rounded-full text-[10px] uppercase font-bold text-primary/80 hover:bg-foreground/5 transition-colors border border-primary/10 ml-1"
            >
              {showWebcamPreview ? "Hide PIP" : "Show PIP"}
            </button>
          )}
        </div>

        {/* Animated Privacy-Respecting AR Wireframe PIP */}
        {showWebcamPreview && status !== "off" && status !== "failsafe" && !mouseSimMode && (
          <div className="relative border border-primary/30 rounded-2xl overflow-hidden shadow-2xl bg-black w-[100px] h-[75px] ml-1 scale-100 transition-all">
            <canvas ref={previewCanvasRef} width={100} height={75} className="w-full h-full" />
            <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${faceDetected ? "bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-red-500"}`} />
          </div>
        )}

        {/* Tracking Status Badge */}
        {status === "active" && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-background/70 backdrop-blur-md border rounded-full text-[10px] uppercase tracking-widest font-semibold ml-1 shadow-md">
            {mouseSimMode ? (
              <span className="text-amber-500">Gaze Simulated</span>
            ) : faceDetected ? (
              <span className="text-cyan-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Gaze + Blink Active
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1 animate-pulse">
                <ShieldAlert className="h-3 w-3" /> Looking Away
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
