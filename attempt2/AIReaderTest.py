from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from groq import Groq
import requests
import base64

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = Groq(api_key='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')

# Serve the HTML file
@app.route('/')
def home():
    return render_template('index.html')

# Analyze pasted code
@app.route('/analyze', methods=['POST'])
def analyze():
    code = request.json['code']
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": f"Rate this code from 1-10 and explain why: {code}"}]
    )
    
    return jsonify({'result': response.choices[0].message.content})

# NEW: Analyze a GitHub repository
@app.route('/analyze-github', methods=['POST'])
def analyze_github():
    data = request.json
    repo_url = data.get('repo_url')
    
    if not repo_url:
        return jsonify({'error': 'No repo URL provided'}), 400
    
    # Parse GitHub URL (e.g., https://github.com/username/repo)
    try:
        parts = repo_url.rstrip('/').split('/')
        username = parts[-2]
        repo = parts[-1]
    except:
        return jsonify({'error': 'Invalid GitHub URL'}), 400
    
    # Fetch repo files from GitHub API
    api_url = f'https://api.github.com/repos/{username}/{repo}/contents'
    
    try:
        response = requests.get(api_url)
        if response.status_code != 200:
            return jsonify({'error': 'Could not fetch repository'}), 400
        
        files = response.json()
        
        # Find Python files (you can add more languages)
        code_files = []
        for file in files:
            if file['name'].endswith(('.py', '.js', '.java', '.cpp', '.c')):
                # Get file content
                file_response = requests.get(file['download_url'])
                if file_response.status_code == 200:
                    code_files.append({
                        'name': file['name'],
                        'content': file_response.text[:3000]  # Limit to first 3000 chars
                    })
        
        if not code_files:
            return jsonify({'error': 'No code files found in repository'}), 400
        
        # Prepare code for AI analysis
        code_summary = "\n\n".join([f"File: {f['name']}\n{f['content']}" for f in code_files])
        
        # Send to AI
        ai_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""Analyze this GitHub repository code and provide:
1. Overall code quality rating (1-10)
2. Strengths
3. Areas for improvement
4. Estimated skill level (Beginner/Intermediate/Advanced)

Code:
{code_summary}
"""
            }]
        )
        
        return jsonify({
            'analysis': ai_response.choices[0].message.content,
            'files_analyzed': len(code_files)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)