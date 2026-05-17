# InclusiveView: Adaptive Public Interfaces via Implicit Sensing

CISC 867

### The Team
- Jack Kuchma
- Mizuho Okitani

### The Project
Public kiosks can be found all around us such as in airports, grocery stores, banks, city halls, and shopping malls. However, these public kiosks are largely inaccessible due to their one-size-fits-all design with static design and user initiated accessibility features. This creates a significant accessibility barrier for people with disabilities who either can’t read the screen or can’t interact with it in order to activate the accessibility options. This creates a significant barrier for this audience. In order to solve this problem, we developed InclusiveView, a prototype middleware layer that can actively adapt the kiosk for posture, height, viewing distance, and assistive device accessibility use.
### Features
- Detects user's sitting/standing/crouched position, viewing distance and adapts the text size accordingly
- Color contrast mode
- Text to speech
- Gaze-based eye tracking for automatic switching between regular and text to speech and color contrast mode
- Multi-language support (EN / ES / ZH / AR)
### How to Run
This prototype in split into two applications: the frontend and the backend, which have to be run simultaneously in order to function. The instructions can also be found in a .txt file in the repo. Important to note, make sure you have a webcam plugged in if you're using desktop and to allow desktop apps access to your camera.

Note: If running scripts on your system is disabled by default, run this command first after opening up a new terminal for each the frontend and the backend: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#### Backend: Open the terminal of your choice, (i.e.: VS Code's Terminal) run: 
  ```
cd .\backend\
python -m venv .venv
\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload
```
#### Frontend: Open the terminal of your choice, (i.e.: VS Code's Terminal) run:
```
cd .\frontend\
npm install
npm run dev
```
### Resources
- Google MediaPipe Pose: https://ai.google.dev/edge/mediapipe/solutions/guide
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- OpenCV: https://opencv.org/


