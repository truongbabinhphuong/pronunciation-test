# Pronunciation Competition Server

Backend server for pronunciation analysis using Google Gemini AI and optional forced aligners.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Test server:**
   ```bash
   curl http://localhost:3000/health
   ```

## 📋 Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | - | Your Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model to use |
| `GEMINI_API_URL` | No | Official endpoint | Gemini API base URL |
| `PORT` | No | `3000` | Server port |
| `USE_FORCED_ALIGNER` | No | `false` | Enable forced aligner |
| `ALIGNER_TYPE` | No | `mfa` | Aligner type: `mfa` or `gentle` |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `DEBUG` | No | `false` | Enable debug logging |

## 🔑 Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 🧪 Testing

Test the scoring algorithm:

```bash
npm test
```

## 📦 API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "geminiConfigured": true,
  "forcedAlignerEnabled": false
}
```

### `POST /api/lookup-ipa`
Get IPA transcription for a word.

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

### `POST /api/analyze`
Analyze pronunciation attempt.

**Request:** `multipart/form-data`
- `audio`: Audio file (webm, mp3, wav, ogg)
- `word`: Target word (string)
- `attemptName`: Student identifier (string)
- `expectedIPA`: Expected pronunciation (string, optional)

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
  "aiComments": "Student substituted /θ/ with /t/.",
  "notes": "processed-with-gemini"
}
```

## 🔧 Forced Aligner Setup

### Montreal Forced Aligner (MFA)

1. **Install via Conda:**
   ```bash
   conda create -n aligner -c conda-forge montreal-forced-aligner
   conda activate aligner
   ```

2. **Download models:**
   ```bash
   mfa model download acoustic english_us_arpa
   mfa model download dictionary english_us_arpa
   ```

3. **Update .env:**
   ```env
   USE_FORCED_ALIGNER=true
   ALIGNER_TYPE=mfa
   ```

4. **Complete implementation:**
   - Edit `utils/aligner-wrapper.js`
   - Implement the `runMFA()` function
   - Add TextGrid parsing logic

### Gentle Aligner

1. **Install Gentle:**
   ```bash
   git clone https://github.com/lowerquality/gentle.git
   cd gentle
   ./install.sh
   ```

2. **Start Gentle server:**
   ```bash
   python serve.py
   # Runs on http://localhost:8765
   ```

3. **Update .env:**
   ```env
   USE_FORCED_ALIGNER=true
   ALIGNER_TYPE=gentle
   ```

4. **Complete implementation:**
   - Edit `utils/aligner-wrapper.js`
   - Implement the `runGentle()` function

## 📁 Project Structure

```
server/
├── package.json           # Dependencies and scripts
├── server.js             # Main Express server
├── .env.example          # Environment template
├── .env                  # Your environment (gitignored)
└── utils/
    ├── scoring.js        # Scoring algorithm
    └── aligner-wrapper.js # Forced aligner integration
```

## 🔒 Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Restrict CORS** - Set `CORS_ORIGIN` to your frontend domain in production
3. **Use HTTPS** - Required for production deployment
4. **Rotate API keys** - Regularly update your Gemini API key
5. **Rate limiting** - Add rate limiting middleware for production
6. **Input validation** - Server validates all inputs, but add more checks as needed

## 🐛 Troubleshooting

### "GEMINI_API_KEY is required" error
- Check `.env` file exists in server directory
- Verify `GEMINI_API_KEY=your-key-here` is set correctly
- No quotes needed around the key

### CORS errors
- Check `CORS_ORIGIN` in `.env`
- Set to `*` for development, specific domain for production
- Ensure frontend URL matches CORS_ORIGIN

### Aligner not working
- Check aligner is installed and accessible
- For Gentle, ensure server is running on port 8765
- Review implementation in `utils/aligner-wrapper.js`
- Check console logs for detailed error messages

### Audio upload fails
- Check file size < 10MB
- Ensure file is valid audio format
- Check uploads/ directory permissions

## 📊 Scoring Algorithm

The server uses a **deterministic scoring algorithm** based on:

1. **Phoneme extraction** - Split IPA into individual phonemes
2. **Sequence alignment** - Use Levenshtein distance / dynamic programming
3. **Match calculation** - Count matching phonemes
4. **Score computation** - `(matches / expected) * 100`

This ensures **reproducible scores** regardless of AI variations.

## 🔍 Debug Mode

Enable detailed logging:

```env
DEBUG=true
```

This will log:
- API requests and responses
- Gemini API interactions
- File processing steps
- Scoring calculations

## 📝 Development

### Start with auto-reload (Node 18+):
```bash
npm run dev
```

### Manual testing:
```bash
# Test IPA lookup
curl -X POST http://localhost:3000/api/lookup-ipa \
  -H "Content-Type: application/json" \
  -d '{"word":"through"}'

# Test audio analysis (requires audio file)
curl -X POST http://localhost:3000/api/analyze \
  -F "audio=@test.webm" \
  -F "word=through" \
  -F "attemptName=Test" \
  -F "expectedIPA=θruː"
```

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Multer (File Uploads)](https://github.com/expressjs/multer)
- [Montreal Forced Aligner](https://montreal-forced-aligner.readthedocs.io/)
- [Gentle Documentation](https://github.com/lowerquality/gentle)

## 🤝 Contributing

To extend this server:

1. Add new endpoints in `server.js`
2. Add utility functions in `utils/`
3. Update API documentation in README
4. Test thoroughly before deploying

## ⚠️ Notes

- Audio files are automatically deleted after processing
- No persistent storage on server side
- All analysis is done in real-time
- Gemini API calls count toward your quota
- Consider caching IPA lookups for common words

---

**For main project documentation, see [../README.md](../README.md)**
