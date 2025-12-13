Resume Semantic Search (Flask + LangChain + FAISS)

Overview

This is a minimal local web app that lets you upload a PDF resume, generates OpenAI embeddings for the resume text using LangChain, stores embeddings locally in a FAISS vectorstore, and lets you run semantic searches over the uploaded resume.

Important: You must provide your own OpenAI API key via environment variable `OPENAI_API_KEY`. The app does NOT include any API keys.

Folder structure

resume-search/
  ├─ app.py               # Flask application
  ├─ requirements.txt     # Python dependencies
  ├─ templates/
  │   └─ index.html       # Simple upload + search UI
  ├─ uploads/             # (created at runtime) uploaded PDFs
  └─ faiss_index/         # (created at runtime) stored vectorstore files

Setup & Run (macOS / Linux)

1) Create and activate a virtual environment (recommended):

```bash
cd /Users/achintsingh/Desktop/Lyrathon/resume-search
python3 -m venv .venv
source .venv/bin/activate
```

2) Install dependencies:

```bash
pip install -r requirements.txt
```

3) Set your OpenAI API key in the environment (do NOT share this key):

```bash
export OPENAI_API_KEY="sk-..."
```

On macOS you can also store it in `~/.zshrc` for convenience.

4) Run the Flask app:

```bash
export FLASK_APP=app.py
flask run
```

By default Flask runs on http://127.0.0.1:5000

5) Open your browser and go to http://127.0.0.1:5000

Usage

- Upload a PDF resume using the form. The app will extract text, split into chunks, generate embeddings, and store them locally in `faiss_index/`.
- Once uploaded, use the search box to query the resume semantically. The app will return the most relevant text chunks and similarity scores.

Notes & Limitations

- This app uses OpenAI embeddings (you must supply an API key). If you prefer a local embedding model instead, I can adjust the code.
- FAISS files are stored locally in `faiss_index/`. Re-uploading a new resume will overwrite the index.
- Keep usage within OpenAI rate/usage limits.

If you'd like, I can add: caching, multiple resume support, or a small admin page to inspect index contents.
