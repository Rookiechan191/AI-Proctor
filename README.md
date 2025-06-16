# AI Proctor

An intelligent proctoring system that uses computer vision and machine learning to monitor online exams and detect potential violations.

## Features

- **Real-time Face Detection**: Monitors for multiple faces in the frame
- **Head Pose Estimation**: Detects if the user is looking away from the screen
- **Gaze Tracking**: Monitors eye movements and detects when the user is not looking at the screen
- **Device Detection**: Identifies electronic devices like phones, laptops, and monitors
- **Modern UI**: Clean and responsive interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Python
- OpenCV
- MediaPipe
- YOLOv8
- Flask

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- Webcam

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Rookiechan191/AI-Proctor.git
cd AI-Proctor
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Running the Application

1. Start the Python backend server:
```bash
cd backend
python app.py
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Allow camera access when prompted
2. The system will automatically start monitoring for:
   - Multiple faces
   - Head rotation
   - Looking away from screen
   - Electronic devices

## Configuration

You can adjust detection thresholds in `backend/proctor_detector.py`:
- Device detection confidence: 0.35
- Face detection confidence: 0.5
- Head pose thresholds: 30° yaw, 20° pitch
- Eye aspect ratio range: 0.2 to 0.5

## Contributing

Feel free to submit issues and enhancement requests!

