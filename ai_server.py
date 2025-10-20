# ~/ai_server.py
from flask import Flask, request, Response
import subprocess

app = Flask(__name__)

@app.route("/run", methods=["POST"])
def run():
    data = request.json
    prompt = data.get("prompt","")
    def generate():
        proc = subprocess.Popen(["/home/loop/_/ai.sh", prompt], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        for line in iter(proc.stdout.readline, b''):
            yield line.decode()
    return Response(generate(), mimetype="text/plain")

app.run(host="0.0.0.0", port=5000)
