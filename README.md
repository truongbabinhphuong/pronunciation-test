# Pronunciation Competition

A complete web application for running pronunciation competitions. Teachers can record student attempts to pronounce target words, and the system analyzes pronunciation using AI (Google Gemini) or forced alignment tools, providing detailed feedback with IPA transcription and scoring.

## 🎯 Features

### Frontend (GitHub Pages Compatible)
- **Single-page application** - Pure HTML/CSS/vanilla JavaScript, no build tools required
- **Microphone recording** - WebRTC MediaRecorder API with Safari/Chrome support
- **Live recording** - Visual feedback with timer and waveform animation
- **Attempt management** - Name, edit, and organize student attempts
- **Results reveal system** - Hide/show analysis results individually or globally
- **IPA comparison** - Color-coded phoneme matching (green = correct, red = incorrect)
- **Persistent storage** - localStorage keeps all attempts and analyses
- **Export functionality** - Download attempts as JSON
- **Responsive design** - Tailwind CSS with mobile-friendly interface
- **Accessible** - Semantic HTML, ARIA labels, keyboard navigation

### Backend (Node.js + Express)
- **Google Gemini integration** - AI-powered pronunciation analysis
- **Deterministic scoring** - Levenshtein-based phoneme alignment for reproducible scores
- **Optional forced aligner** - Support for Montreal Forced Aligner or Gentle
- **IPA lookup** - Automatic IPA transcription for target words
- **Detailed feedback** - Per-phoneme hints and overall AI comments
- **Secure** - API keys in environment variables, CORS configuration
- **Error handling** - Comprehensive error messages and logging

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **Modern browser** with MediaRecorder API support (Chrome, Safari, Firefox)
- **Google Gemini API key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- **Optional**: Montreal Forced Aligner or Gentle (for higher accuracy)

## 🚀 Quick Start

This application has two components:
1. **Frontend (Webapp)** - Static HTML/JS that can be hosted on GitHub Pages
2. **Backend (Server)** - Node.js server that handles Gemini AI API calls

### Option A: GitHub Pages Deployment (Recommended)

This is the easiest way to get started. The frontend is automatically deployed to GitHub Pages, and you only need to set up the backend server.

#### Step 1: Use the Live Frontend

The webapp is already deployed and available at:
**https://truongbabinhphuong.github.io/pronunciation-test/**

#### Step 2: Set Up Your Backend Server

The backend server handles all Gemini AI API calls and must be deployed separately (it cannot run on GitHub Pages since it requires server-side processing).

##### 2a. Install Dependencies

```bash
cd server
npm install
```

##### 2b. Configure Gemini API

Create a `.env` file in the `server` directory with your Gemini API key:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your **actual** Gemini API key:

```env
GEMINI_API_KEY=your-actual-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
USE_FORCED_ALIGNER=false
CORS_ORIGIN=*
```

**🔑 Get your Gemini API key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

**⚠️ Security Note:** The API key must ONLY be in the server `.env` file. Never commit it to Git or include it in the frontend.

##### 2c. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

##### 2d. Configure the Frontend

Open the deployed webapp: https://truongbabinhphuong.github.io/pronunciation-test/

1. Click the **Settings** button (⚙️) in the top-right
2. Enter your server URL: `http://localhost:3000` (or your deployed server URL)
3. Click **Save Settings**

Now you can start recording and analyzing pronunciation!

#### Step 3: Deploy Your Backend (Optional)

For production use, deploy your backend server to a cloud platform:

**Deployment Options:**
- **Heroku**: Deploy server directory using git subtree: `git subtree push --prefix server heroku main`
- **Railway**: Connect your repo, set root directory to `server/`, deploy from dashboard
- **Render**: Connect your repo, set root directory to `server/`, deploy from dashboard  
- **Google Cloud Run**: Deploy from `server/` directory: `gcloud run deploy --source=./server`
- **Your own VPS**: Run with PM2 or systemd from the `server/` directory

After deploying, update the server URL in the webapp settings to your deployed backend URL (e.g., `https://your-app.herokuapp.com`).

**For production, update CORS_ORIGIN in your server `.env`:**
```env
CORS_ORIGIN=https://truongbabinhphuong.github.io
```

### Option B: Local Development Setup

If you want to run both frontend and backend locally:

#### 1. Clone the Repository

```bash
git clone https://github.com/truongbabinhphuong/pronunciation-test.git
cd pronunciation-test
```

#### 2. Set Up Backend Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and add your Gemini API key (see Option A, Step 2b above).

Start the server:
```bash
npm start
```

#### 3. Configure Frontend

The frontend is already configured to use `http://localhost:3000` by default.

You can optionally customize it by editing `.env` in the root directory:

```env
API_URL=http://localhost:3000
```

Then regenerate `config.js`:
```bash
node build.js
```

#### 4. Run the Frontend Locally

Open `index.html` in your browser, or use a local web server:

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: Just open the file
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

Then visit `http://localhost:8000` in your browser.

## 🎤 Using the Application

### 1. Configure Server Connection (First Time Only)

If using the GitHub Pages deployment, you'll need to configure the server URL once:

1. Open the webapp in your browser
2. Click the **Settings** button (⚙️) in the top-right
3. Enter your server URL (e.g., `http://localhost:3000` or your deployed backend URL)
4. Optionally enter your teacher name
5. Click **Save Settings**

The settings are saved in your browser's localStorage and won't need to be entered again.

### 2. Test the Microphone

1. Click **Test Microphone** to grant browser permissions
2. Allow microphone access when prompted

### 3. Set Target Word

1. Enter a target word (e.g., "through")
2. Optionally enter expected IPA (or click "Lookup IPA" to fetch from Gemini)
3. Click **Set Word**

### 4. Record and Analyze

1. Click **Start Recording**
2. Say the target word clearly
3. Click **Stop Recording**
4. Enter student name (e.g., "Alice - Round 1")
5. Click **Save & Upload**

The system will analyze the pronunciation using Gemini AI (gemini-2.5-flash model) and show a processing indicator. Once complete, click **Reveal** to see the detailed results including:
- Pronunciation score percentage
- IPA comparison (expected vs. actual)
- Color-coded phoneme matching
- Specific hints for mispronounced phonemes
- AI-generated feedback

### 5. Manage Results

- **Reveal/Hide Results**: Control when students see their scores
- **Export JSON**: Download all attempts and analyses
- **Clear All**: Remove all attempts (with confirmation)
- **Edit Names**: Click on any attempt name to edit it

## 📦 Project Structure

```
pronunciation-test/
├── index.html          # Main frontend page
├── app.js             # Frontend JavaScript
├── styles.css         # Custom styles
├── build.js           # Build script to generate config.js from .env
├── .env.example       # Webapp environment template
├── config.js          # Auto-generated config (from .env via build.js)
├── README.md          # This file
├── .gitignore         # Git ignore rules
├── copilot.txt        # Original requirements
└── server/            # Backend server
    ├── package.json
    ├── server.js      # Main Express server
    ├── .env.example   # Server environment template
    └── utils/
        ├── scoring.js         # Phoneme comparison & scoring
        └── aligner-wrapper.js # Forced aligner integration
```

## 🔧 Advanced Configuration

### Using Forced Aligners

Forced aligners provide more accurate phoneme-level analysis by aligning audio to expected transcription.

#### Option 1: Montreal Forced Aligner (MFA)

1. **Install Conda** (if not already installed)
   ```bash
   wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
   bash Miniconda3-latest-Linux-x86_64.sh
   ```

2. **Install MFA**
   ```bash
   conda create -n aligner -c conda-forge montreal-forced-aligner
   conda activate aligner
   ```

3. **Download models**
   ```bash
   mfa model download acoustic english_us_arpa
   mfa model download dictionary english_us_arpa
   ```

4. **Update .env**
   ```env
   USE_FORCED_ALIGNER=true
   ALIGNER_TYPE=mfa
   ```

5. **Note**: The MFA integration in `server/utils/aligner-wrapper.js` is a template. You'll need to complete the implementation based on your specific needs.

#### Option 2: Gentle

1. **Install Gentle**
   ```bash
   git clone https://github.com/lowerquality/gentle.git
   cd gentle
   ./install.sh
   ```

2. **Start Gentle server**
   ```bash
   python serve.py
   ```

3. **Update .env**
   ```env
   USE_FORCED_ALIGNER=true
   ALIGNER_TYPE=gentle
   ```

### Gemini API Configuration

The server uses Google's Gemini API for:
- Looking up IPA transcriptions for words
- Analyzing audio recordings
- Generating helpful pronunciation hints

**Supported Models**:
- `gemini-2.5-flash` (default, recommended)
- `gemini-1.5-flash` (fast, reliable)
- `gemini-1.5-pro` (most accurate)

Change the model in `server/.env`:
```env
GEMINI_MODEL=gemini-1.5-pro
```

## 🌐 Deployment Details

### Frontend (GitHub Pages)

The frontend is automatically deployed to GitHub Pages via GitHub Actions.

**Live Site**: https://truongbabinhphuong.github.io/pronunciation-test/

#### How It Works

1. When you push to the `main` branch, GitHub Actions automatically:
   - Checks out the code
   - Generates `config.js` from `.env` using `node build.js`
   - Deploys the static files to GitHub Pages

2. The workflow is defined in `.github/workflows/deploy-pages.yml`

#### Forking and Deploying Your Own

If you fork this repository:

1. **Enable GitHub Pages** in your repository:
   - Go to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions"

2. **Update the API URL** (optional):
   - Edit `.env` in the root directory to point to your backend server
   - Commit and push - GitHub Actions will regenerate `config.js` automatically

3. Your site will be at: `https://yourusername.github.io/pronunciation-test/`

### Backend (Server) Deployment

The backend **cannot** run on GitHub Pages (it requires server-side processing). Deploy it separately:

#### Deployment Options

**Option 1: Local Machine / Development**

```bash
cd server
npm install
# Set up .env with your Gemini API key (see Quick Start above)
npm start
```

Your server will be at `http://localhost:3000`. Use ngrok or a similar tool to make it accessible from the internet if needed.

**Option 2: Cloud Platforms (Recommended for Production)**

Deploy to a cloud platform of your choice:

- **Heroku**: 
  ```bash
  # From repository root
  heroku create your-app-name
  heroku config:set GEMINI_API_KEY=your-key
  heroku config:set GEMINI_MODEL=gemini-2.5-flash
  heroku config:set CORS_ORIGIN=https://truongbabinhphuong.github.io
  # Deploy only the server subdirectory
  git subtree push --prefix server heroku main
  ```
  
  **Note**: This uses `git subtree` to deploy only the `server/` directory to Heroku.

- **Railway** / **Render**: 
  1. Connect your GitHub repository
  2. Set root directory to `server/`
  3. Add environment variables via dashboard
  4. Deploy automatically

- **Google Cloud Run** / **AWS** / **Azure**: Follow platform-specific guides

**Option 3: Docker**

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
cd server
docker build -t pronunciation-server .
docker run -p 3000:3000 --env-file .env pronunciation-server
```

#### After Deployment

1. Note your backend URL (e.g., `https://your-app.herokuapp.com`)
2. Update `CORS_ORIGIN` in your server `.env` to your GitHub Pages URL
3. Open the GitHub Pages site and configure the server URL in settings

### Security Considerations

**Important**: For production use:

1. **Restrict CORS**: Update `.env` to allow only your frontend domain
   ```env
   CORS_ORIGIN=https://yourusername.github.io
   ```

2. **Use HTTPS**: Deploy server with SSL/TLS certificate

3. **Protect API key**: Never commit `.env` file (it's in `.gitignore`)

4. **Rate limiting**: Consider adding rate limiting middleware for production

5. **Network restrictions**: For competition environments, consider restricting server access to local network only

## 🧪 Testing

### Test the Server

```bash
# Health check
curl http://localhost:3000/health

# Test IPA lookup
curl -X POST http://localhost:3000/api/lookup-ipa \
  -H "Content-Type: application/json" \
  -d '{"word":"through"}'
```

### Test Frontend

1. Open browser developer console (F12)
2. Check for errors in Console tab
3. Verify microphone permissions in browser settings
4. Test recording → uploading → analysis flow
5. Check Network tab to see API requests

### Browser Compatibility

Tested and working on:
- ✅ Chrome/Chromium 90+
- ✅ Safari 14+ (macOS/iOS)
- ✅ Firefox 88+
- ✅ Edge 90+

## 📊 API Reference

### POST `/api/lookup-ipa`

Lookup IPA transcription for a word using Gemini.

**Request:**
```json
{
  "word": "through"
}
```

**Response:**
```json
{
  "success": true,
  "word": "through",
  "ipa": "θruː"
}
```

### POST `/api/analyze`

Analyze pronunciation attempt.

**Request:** `multipart/form-data`
- `audio` (file): Audio recording
- `word` (string): Target word
- `attemptName` (string): Student/attempt identifier
- `expectedIPA` (string, optional): Expected IPA transcription

**Response:**
```json
{
  "success": true,
  "attemptName": "Alice - Round 1",
  "word": "through",
  "expectedIPA": "θruː",
  "studentIPA": "truː",
  "scorePercent": 67,
  "matchCount": 2,
  "expectedCount": 3,
  "mismatches": [
    {
      "index": 0,
      "expected": "θ",
      "actual": "t",
      "hint": "Place tongue between teeth for /θ/ (voiceless)"
    }
  ],
  "aiComments": "Student substituted /θ/ with /t/. Recommend practicing 'th' words.",
  "notes": "processed-with-gemini"
}
```

### GET `/health`

Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "geminiConfigured": true,
  "forcedAlignerEnabled": false
}
```

## 🧪 Testing & Screenshots

The webapp has been tested with all functions verified. Below are screenshots demonstrating the key features:

### 1. Settings Modal
![Settings Modal](https://github.com/user-attachments/assets/e34d9115-6088-458e-af3a-b29e06ac763a)

The settings modal allows you to configure:
- Server API URL for backend communication
- Teacher name for personalization

### 2. Main Interface
![Main Interface](https://github.com/user-attachments/assets/6cf03639-4979-4023-9368-63dec8e9f758)

The main interface includes:
- Target Word Configuration section
- Recording Controls (Test Microphone, Start/Stop Recording)
- Global Controls (Reveal/Hide All, Export JSON, Clear All)
- Student Attempts list

### 3. Target Word Set
![Target Word Set](https://github.com/user-attachments/assets/e66dcfd5-8473-4f5b-ab61-c64627f7f5d6)

Shows the word configuration in action:
- Target word: "through"
- Expected IPA: "θruː"
- Success notification displayed

### 4. All Functions Tested
![All Functions Tested](https://github.com/user-attachments/assets/2a8a0b42-ac54-4d40-9188-e6a24bd80c7d)

Demonstrates:
- All buttons functional and responsive
- Toast notifications for user feedback
- Clean, accessible interface

### Tested Features

✅ **Settings Management**
- Open/close settings modal
- Save server URL and teacher name
- Persistent storage using localStorage

✅ **Target Word Configuration**
- Set target word
- Set expected IPA
- Display current word configuration
- IPA lookup button (requires backend)

✅ **Recording Controls**
- Test Microphone button (requests permissions)
- Start/Stop Recording buttons
- Visual recording indicators

✅ **Global Controls**
- Reveal/Hide All Results toggle
- Export JSON functionality (downloads attempts)
- Clear All with confirmation dialog

✅ **User Experience**
- Toast notifications for all actions
- Responsive design
- Accessible markup with ARIA labels
- Confirmation dialogs for destructive actions

## 🔍 Troubleshooting

### Microphone not working
- Check browser permissions (chrome://settings/content/microphone)
- Ensure HTTPS or localhost (required for microphone access)
- Try different browser

### Server connection failed
- Verify server is running (`curl http://localhost:3000/health`)
- Check server URL in frontend Settings
- Ensure CORS_ORIGIN allows your frontend domain
- Check browser console for CORS errors

### Gemini API errors
- Verify API key is correct in `.env`
- Check API key has not expired
- Ensure you have Gemini API access enabled
- Check quota/billing in Google Cloud Console

### Analysis not returning results
- Check server logs for detailed errors
- Verify audio file is valid and not corrupted
- Ensure audio is not too long (< 10MB)
- Try with different audio format

### Forced aligner not working
- Ensure aligner is properly installed
- Check aligner service is running (for Gentle)
- Review aligner logs for errors
- Verify audio quality and format compatibility

## 📝 License

MIT License - Feel free to use this project for educational purposes.

## 🤝 Contributing

This is a competition/educational tool. Feel free to:
- Report bugs via GitHub issues
- Suggest improvements
- Submit pull requests
- Adapt for your specific needs

## 📚 Resources

- [Google Gemini API](https://ai.google.dev/)
- [Montreal Forced Aligner](https://montreal-forced-aligner.readthedocs.io/)
- [Gentle Aligner](https://github.com/lowerquality/gentle)
- [IPA Chart](https://www.internationalphoneticassociation.org/content/ipa-chart)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## ⚠️ Notes

- **Audio processing**: Gemini's audio analysis capabilities may vary. For production use, consider using forced aligners for higher accuracy.
- **Scoring algorithm**: The deterministic scoring uses Levenshtein distance on phoneme sequences. This provides reproducible results but may not capture all pronunciation nuances.
- **IPA parsing**: The phoneme splitting algorithm is simplified. For more accurate IPA parsing, consider using specialized libraries.
- **Privacy**: Audio files are processed on the server and deleted immediately after analysis. No data is permanently stored server-side.

## 🎓 Educational Use

This tool is designed for:
- Pronunciation competitions
- Language learning classrooms
- Speech therapy practice
- Self-study pronunciation improvement
- Phonetics education

**Competition Setup Recommendation**:
1. Set up server on local network (no internet required after setup)
2. Deploy frontend to GitHub Pages or local server
3. Use forced aligner for consistent scoring
4. Hide results until all students complete
5. Reveal and compare results at end of competition

---

**Built with ❤️ for language educators and learners**
