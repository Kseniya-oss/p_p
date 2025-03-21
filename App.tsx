import { useRef, useEffect } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

function App() {
    // Указываем точные типы для videoRef и canvasRef
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    let camera: cam.Camera | null = null;

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        // Инициализация камеры
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((error) => console.error("Ошибка доступа к камере:", error));

        // Настройка MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 2,
            minDetectionConfidence: 0.2, // Сделаем более чувствительным
            minTrackingConfidence: 0.2, // Сделаем более чувствительным
            modelComplexity: 1,
        });

        hands.onResults((results) => {
            if (!canvasRef.current || !videoRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            // Устанавливаем размер канваса в зависимости от видео
            canvas.width = videoWidth;
            canvas.height = videoHeight;

            // Отображаем видео на канвасе
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка экрана

            // Отрисовываем точки и соединения на руках
            if (results.multiHandLandmarks) {
                results.multiHandLandmarks.forEach((landmarks) => {
                    // Рисуем точки вручную
                    landmarks.forEach((point) => {
                        const x = point.x * canvas.width;
                        const y = point.y * canvas.height;

                        ctx.fillStyle = "red";
                        ctx.beginPath();
                        ctx.arc(x, y, 10, 0, 2 * Math.PI); // Рисуем красные точки
                        ctx.fill();
                    });

                    // Соединяем точки (кости)
                    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "blue", lineWidth: 2 });
                });
            }
        });

        // Запуск камеры
        camera = new cam.Camera(videoRef.current, {
            onFrame: async () => {
                await hands.send({ image: videoRef.current! });
            },
            width: 1280,
            height: 720,
        });

        camera.start();
    }, []); // Закрываем useEffect() перед return

    return (
        <div className="video-container">
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} />
        </div>
    );
}

export default App;
