const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Temp directory for audio files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Clean old files periodically
setInterval(() => {
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtime.getTime() > 60000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 30000);

// TTS endpoint
app.post('/speak', (req, res) => {
  const { text, wpm = 275, lang = 'en' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }
  
  const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const outputFile = path.join(TEMP_DIR, `${id}.wav`);
  
  // Determine voice based on language
  const voice = lang === 'de' ? 'de' : 'en';
  
  // eSpeak command: -s = speed (wpm), -v = voice, -w = output wave
  const cmd = `espeak -s ${wpm} -v ${voice} -w "${outputFile}" "${text.replace(/"/g, '\\"')}"`;
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('eSpeak error:', error);
      return res.status(500).json({ error: 'TTS generation failed' });
    }
    
    // Send the audio file
    res.sendFile(outputFile, (err) => {
      if (err) {
        console.error('Send error:', err);
      }
      // Clean up after sending
      setTimeout(() => {
        fs.unlink(outputFile, () => {});
      }, 5000);
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', espeak: 'available' });
});

app.listen(PORT, () => {
  console.log(`TTS Server running on http://localhost:${PORT}`);
  console.log('eSpeak integration active - supports up to 400+ WPM');
});
