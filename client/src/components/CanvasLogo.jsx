import { useEffect, useRef } from "react";

export function CanvasLogo() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    // רקע הלוגו
    const gradient = context.createLinearGradient(0, 0, 44, 44);
    gradient.addColorStop(0, "#1f6f5f");
    gradient.addColorStop(1, "#164f45");

    context.fillStyle = gradient;
    context.beginPath();
    context.roundRect(2, 2, 40, 40, 12);
    context.fill();

    // גוף לוח השנה
    context.fillStyle = "#fffdf8";
    context.beginPath();
    context.roundRect(10, 10, 24, 25, 5);
    context.fill();

    // החלק העליון של לוח השנה
    context.fillStyle = "#f4b860";
    context.fillRect(10, 15, 24, 5);

    // טבעות לוח השנה
    context.strokeStyle = "#fffdf8";
    context.lineWidth = 3;
    context.lineCap = "round";

    context.beginPath();
    context.moveTo(16, 8);
    context.lineTo(16, 14);
    context.moveTo(28, 8);
    context.lineTo(28, 14);
    context.stroke();

    // סימן אישור
    context.strokeStyle = "#1f6f5f";
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(15, 27);
    context.lineTo(20, 31);
    context.lineTo(29, 23);
    context.stroke();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="brand-canvas"
      width="44"
      height="44"
      aria-hidden="true"
    />
  );
}