"""
app.py

Minimal Flask app to upload a PDF resume, create OpenAI embeddings via LangChain,
store them in a FAISS vectorstore locally, and query semantically.

Run instructions are in README.md
"""
import os
from flask import Flask, request, render_template, redirect, url_for, flash
from werkzeug.utils import secure_filename

# LangChain / FAISS imports
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS

# Basic app config
UPLOAD_FOLDER = 'uploads'
INDEX_FOLDER = 'faiss_index'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET', 'dev-secret')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def index():
    # show index page; indicate whether an index exists
    index_exists = os.path.isdir(INDEX_FOLDER) and any(os.scandir(INDEX_FOLDER))
    return render_template('index.html', index_exists=index_exists)

@app.route('/upload', methods=['POST'])
def upload():
    """Handle PDF upload, extract text, split, embed, and store in FAISS."""
    if 'file' not in request.files:
        flash('No file part')
        return redirect(url_for('index'))

    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('index'))

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)

        # Load the PDF with PyPDFLoader (handles pages)
        loader = PyPDFLoader(path)
        docs = loader.load()

        # Split into chunks for embeddings
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunked_docs = splitter.split_documents(docs)

        # Create embeddings (uses OPENAI_API_KEY environment variable)
        embeddings = OpenAIEmbeddings()

        # Build FAISS vectorstore from documents
        vectorstore = FAISS.from_documents(chunked_docs, embeddings)

        # Remove old index folder and save new one
        if os.path.exists(INDEX_FOLDER):
            # safe: remove files inside
            for f in os.listdir(INDEX_FOLDER):
                fp = os.path.join(INDEX_FOLDER, f)
                try:
                    if os.path.isfile(fp):
                        os.remove(fp)
                except Exception:
                    pass
        else:
            os.makedirs(INDEX_FOLDER, exist_ok=True)

        vectorstore.save_local(INDEX_FOLDER)

        flash('Resume processed and embeddings stored.')
        return redirect(url_for('index'))

    flash('Invalid file type; please upload a PDF.')
    return redirect(url_for('index'))

@app.route('/search', methods=['POST'])
def search():
    """Perform semantic search over the stored FAISS index and return top chunks."""
    query = request.form.get('query', '').strip()
    if not query:
        flash('Please enter a search query')
        return redirect(url_for('index'))

    # Check index exists
    if not (os.path.isdir(INDEX_FOLDER) and any(os.scandir(INDEX_FOLDER))):
        flash('No index found. Please upload a resume first.')
        return redirect(url_for('index'))

    # Load embeddings and index
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.load_local(INDEX_FOLDER, embeddings)

    # Perform similarity search
    results = vectorstore.similarity_search_with_relevance_scores(query, k=5)

    # results is list of tuples (Document, score)
    output = []
    for doc, score in results:
        output.append({'text': doc.page_content, 'score': float(score), 'meta': doc.metadata})

    return render_template('index.html', results=output, index_exists=True)

if __name__ == '__main__':
    app.run(debug=True)
