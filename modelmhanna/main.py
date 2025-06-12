import os
from flask import Flask, request, jsonify
from PIL import Image
import torch
from torchvision import transforms, models

# Load model
model = models.resnet18(pretrained=False)
model.fc = torch.nn.Linear(model.fc.in_features, 9)  # Changed to 9 classes
model.load_state_dict(torch.load('dental_classifier.pt', map_location='cpu'))
model.eval()

app = Flask(__name__)

tfm = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],
                         [0.229,0.224,0.225])
])

# Serve the upload form
@app.route('/', methods=['GET'])
def home():
    return open('index.html').read()

# Prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    img = Image.open(request.files['image'].stream).convert('RGB')
    x = tfm(img).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)
    idx = logits.argmax().item()
    labels = ['extraoral_frontal', 'extraoral_full_face_smile', 'extraoral_right', 
              'extraoral_zoomed_smile', 'intraoral_front', 'intraoral_left', 
              'intraoral_right', 'lower_occlusal', 'upper_occlusal']
    label = labels[idx]
    return jsonify({'view': label})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3000))
    app.run(host='0.0.0.0', port=port)
