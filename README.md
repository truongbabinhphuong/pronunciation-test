# Pronunciation Test

A client-side web application for testing and analyzing pronunciation using Google's Gemini 1.5 Flash AI model. Teachers and students can record pronunciation attempts, and the app provides detailed feedback with IPA transcription and scoring.

## 🎯 Features

- **Client-side only** - No server required, runs entirely in your browser
- **Gemini 1.5 Flash AI** - Uses Google's latest AI model for pronunciation analysis
- **Microphone recording** - WebRTC MediaRecorder API with cross-browser support
- **IPA transcription** - Automatic International Phonetic Alphabet transcription
- **Real-time feedback** - Detailed phoneme-by-phoneme comparison and hints
- **Persistent storage** - All data stored locally in your browser (localStorage)
- **Privacy-focused** - Your API key and recordings never leave your browser
- **Export functionality** - Download attempts as JSON
- **Responsive design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Option 1: Use the Live Demo

Visit the live demo at: **https://truongbabinhphuong.github.io/pronunciation-test/**

1. Click the **Settings** button (⚙️) in the top-right
2. Enter your Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Click **Save Settings**
4. Start testing pronunciation!

### Option 2: Run Locally

1. Clone the repository:
```bash
git clone https://github.com/truongbabinhphuong/pronunciation-test.git
cd pronunciation-test
```

2. Open `index.html` in your browser, or use a local web server:
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

3. Configure your Gemini API key in the Settings

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in the app's Settings

**Note:** Your API key is stored only in your browser's localStorage and is never sent to any server except Google's Gemini API.

## 🎤 Using the Application

### 1. Configure API Key (First Time Only)

1. Click the **Settings** button (⚙️)
2. Enter your Gemini API key
3. Optionally enter your teacher name
4. Click **Save Settings**

### 2. Test Microphone

1. Click **Test Microphone** to grant browser permissions
2. Allow microphone access when prompted

### 3. Set Target Word

1. Enter a target word (e.g., "through")
2. Click **Lookup IPA** to fetch the IPA from Gemini, or enter it manually
3. Click **Set Word**

### 4. Record and Analyze

1. Click **Start Recording**
2. Say the target word clearly
3. Click **Stop Recording**
4. Enter student name (e.g., "Alice - Round 1")
5. Click **Save & Upload**

The system will analyze the pronunciation and show:
- Pronunciation score percentage
- IPA comparison (expected vs. actual)
- Color-coded phoneme matching
- Specific hints for mispronounced phonemes
- AI-generated feedback

### 5. Manage Results

- **Reveal/Hide Results**: Control when students see their scores
- **Export JSON**: Download all attempts and analyses
- **Clear All**: Remove all attempts
- **Edit Names**: Click on any attempt name to edit it

## 📂 Project Structure

```
pronunciation-test/
├── index.html          # Main application page
├── app.js             # Application logic with Gemini API integration
├── styles.css         # Custom styles
├── README.md          # This file
├── .gitignore         # Git ignore rules
├── .nojekyll          # GitHub Pages configuration
└── .github/
    └── workflows/
        └── deploy-pages.yml  # GitHub Pages deployment workflow
```

## 🔧 Technical Details

### Gemini API Integration

The app uses Google's Gemini 1.5 Flash model via the REST API:
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`
- **Features used**:
  - Text generation for IPA lookup
  - Audio analysis for pronunciation transcription
  - AI hints and feedback generation

### Audio Processing

1. **Recording**: Uses the MediaRecorder API with automatic format detection
2. **Encoding**: Audio is converted to base64 for API transmission
3. **Analysis**: Gemini AI transcribes the audio to IPA
4. **Comparison**: Client-side phoneme alignment using dynamic programming
5. **Scoring**: Deterministic scoring based on phoneme matches

### Data Storage

All data is stored locally in your browser using localStorage:
- API key (encrypted by browser)
- Teacher name
- Recording attempts
- Analysis results

**Note**: Recordings are stored as Blob objects. They persist in memory but are not permanently saved. Export to JSON to back up results.

## 🌐 Deployment

### GitHub Pages (Automatic)

This repository is configured for automatic deployment to GitHub Pages:

1. Any push to the `main` branch triggers deployment
2. The workflow is defined in `.github/workflows/deploy-pages.yml`
3. Your site will be available at: `https://yourusername.github.io/pronunciation-test/`

### Forking and Deploying

To deploy your own version:

1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Select "GitHub Actions" as the source
4. Your site will be available at: `https://yourusername.github.io/pronunciation-test/`

### Other Hosting Options

Since this is a static site, you can host it anywhere:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Follow the instructions above
- **Any web server**: Just upload the files

## 🔒 Security & Privacy

### ⚠️ Important Security Notice

**This application is designed for controlled environments (classrooms, personal use) where you trust the users.**

Due to the architecture of this client-side application:
- The Gemini API requires the API key to be passed in the URL query parameter
- API keys in URLs may be logged by browsers, proxies, or network monitoring tools
- Anyone with access to browser developer tools can see your API key

**Security Recommendations:**

1. **Use API Key Restrictions** in Google Cloud Console:
   - Restrict by HTTP referrer (e.g., only allow requests from your domain)
   - Set API quotas to limit potential abuse
   - Monitor usage regularly

2. **For Production Use**: Consider implementing a thin server-side proxy that:
   - Stores the API key securely on the server
   - Validates requests before forwarding to Gemini
   - Implements rate limiting and access controls

3. **Classroom Use**: 
   - Use a shared API key with restricted quotas
   - Monitor usage in Google Cloud Console
   - Clear browser data after sessions

4. **Personal Use**: 
   - Keep your API key private
   - Don't share your browser screen while using the app
   - Clear browser history if needed

### API Key Security

- Your API key is stored in localStorage (encrypted by the browser)
- The key is only sent to Google's Gemini API (HTTPS)
- No third-party servers have access to your key
- **Note**: The Gemini API requires keys in URL parameters (this is by design)

### Data Privacy

- All recordings are processed client-side
- Audio is sent only to Google's Gemini API for analysis
- No data is stored on any server (except temporarily in browser memory)
- Clear browser data to remove all stored information

## 🧪 Browser Compatibility

Tested and working on:
- ✅ Chrome/Chromium 90+
- ✅ Safari 14+ (macOS/iOS)
- ✅ Firefox 88+
- ✅ Edge 90+

**Requirements**:
- Modern browser with MediaRecorder API support
- Microphone access
- JavaScript enabled
- Internet connection (for Gemini API calls)

## 🔍 Troubleshooting

### Microphone not working
- Check browser permissions (chrome://settings/content/microphone)
- Ensure HTTPS or localhost (required for microphone access)
- Try a different browser

### Gemini API errors
- Verify API key is correct in Settings
- Check API key hasn't expired
- Ensure you have Gemini API access enabled
- Check quota/billing in Google Cloud Console
- Check browser console for detailed error messages

### Analysis not returning results
- Check your internet connection
- Verify audio quality (speak clearly, avoid background noise)
- Check browser console for errors
- Try with a different word or recording

### Data not persisting
- Ensure browser isn't in incognito/private mode
- Check browser settings allow localStorage
- Try exporting data as JSON backup

## 📝 API Rate Limits

Google's Gemini API has rate limits (free tier):
- **15 requests per minute**
- **1,500 requests per day**

For each pronunciation attempt, the app makes:
- 1 request for IPA lookup (if not cached)
- 1 request for audio analysis
- 1 request for hints and feedback

**Tip**: Enter expected IPA manually to save API calls.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub issues
- Suggest improvements
- Submit pull requests
- Adapt for your specific needs

## 📄 License

MIT License - Feel free to use this project for educational purposes.

## 🎓 Educational Use

This tool is designed for:
- Pronunciation practice and testing
- Language learning classrooms
- Speech therapy exercises
- Self-study pronunciation improvement
- Phonetics education

## 🙏 Acknowledgments

- **Google Gemini AI** - For the pronunciation analysis capabilities
- **Tailwind CSS** - For the beautiful UI components
- **IPA** - International Phonetic Alphabet standard

## 📚 Resources

- [Google Gemini API Documentation](https://ai.google.dev/)
- [IPA Chart](https://www.internationalphoneticassociation.org/content/ipa-chart)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Built with ❤️ for language learners and educators**
