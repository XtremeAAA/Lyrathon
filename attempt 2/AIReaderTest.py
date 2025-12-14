from flask import Flask, request, jsonify
from groq import Groq

app = Flask(__name__)
client = Groq(api_key='your-key')

# This URL accepts code and returns AI analysis
@app.route('/analyze', methods=['POST'])
def analyze():
    # Get code from whoever is calling this URL
    code = request.json['code']
    
    # Run your AI function
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": f"Rate: {code}"}]
    )
    
    # Send result back
    return jsonify({'result': response.choices[0].message.content})

app.run()