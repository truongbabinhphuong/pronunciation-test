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

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pronunciation-test
```

### 2. Set Up the Server

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env` and set your `GEMINI_API_KEY`:

```env
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
PORT=3000
USE_FORCED_ALIGNER=false
CORS_ORIGIN=*
```

**Important**: Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Open the Frontend

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

### 6. Configure the Frontend

1. Click the **Settings** button (⚙️) in the top-right
2. Enter the server URL: `http://localhost:3000`
3. Optionally enter your teacher name
4. Click **Save Settings**

### 7. Test the Microphone

1. Click **Test Microphone** to grant browser permissions
2. Allow microphone access when prompted

### 8. Start Recording Attempts

1. Enter a target word (e.g., "through")
2. Optionally enter expected IPA (or click "Lookup IPA")
3. Click **Set Word**
4. Click **Start Recording**
5. Say the word
6. Click **Stop Recording**
7. Enter student name (e.g., "Alice - Round 1")
8. Click **Save & Upload**

The system will analyze the pronunciation and show a processing indicator. Once complete, click **Reveal** to see the results!

## 📦 Project Structure

```
pronunciation-test/
├── index.html          # Main frontend page
├── app.js             # Frontend JavaScript
├── styles.css         # Custom styles
├── README.md          # This file
├── .gitignore         # Git ignore rules
├── copilot.txt        # Original requirements
└── server/            # Backend server
    ├── package.json
    ├── server.js      # Main Express server
    ├── .env.example   # Environment template
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
- `gemini-2.0-flash-exp` (default, fastest)
- `gemini-1.5-flash` (fast, reliable)
- `gemini-1.5-pro` (most accurate)

Change the model in `.env`:
```env
GEMINI_MODEL=gemini-1.5-pro
```

## 🌐 Deployment

### Frontend Deployment (GitHub Pages)

1. **Push to GitHub**
   ```bash
   git add index.html app.js styles.css
   git commit -m "Add pronunciation competition frontend"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "main" branch as source
   - Click Save
   - Your site will be available at `https://yourusername.github.io/pronunciation-test/`

3. **Update frontend settings**
   - Open your deployed site
   - Click Settings (⚙️)
   - Set server URL to your backend server (see below)

### Backend Deployment

Deploy the server on a controlled VM, cloud instance, or local machine:

#### Option 1: Local Machine / VM

```bash
cd server
npm install
# Set up .env with your API key
npm start
```

Make sure port 3000 is accessible to your frontend.

#### Option 2: Cloud Services (Heroku, Railway, Render, etc.)

1. Create account on your chosen platform
2. Deploy the `server/` directory
3. Set environment variables in platform dashboard
4. Note the deployed URL (e.g., `https://your-app.herokuapp.com`)

#### Option 3: Docker

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
docker build -t pronunciation-server ./server
docker run -p 3000:3000 --env-file server/.env pronunciation-server
```

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
