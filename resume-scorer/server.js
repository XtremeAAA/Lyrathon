require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const apiKey = process.env.AFFINDA_API_KEY;
    const region = process.env.AFFINDA_REGION;

    // Send the resume to Affinda
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(
      `https://${region}/v2/resumes`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders()
        }
      }
    );

    const parsed = response.data.data;

    // Basic scoring logic
    const skills = parsed.skills ? parsed.skills.map(s => s.toLowerCase()) : [];
    const experienceYears = parsed.totalYearsExperience || 0;

    let score = 0;

    // Basic rules:
    if (skills.includes('javaScript'.toLowerCase())) score += 20;
    if (skills.includes('python')) score += 20;
    if (skills.includes('react')) score += 15;
    if (experienceYears >= 1) score += 20;
    if (experienceYears >= 3) score += 20;
    if (experienceYears >= 5) score += 25;

    res.json({ score, parsed });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error parsing resume');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});