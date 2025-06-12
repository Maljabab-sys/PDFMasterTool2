# train.py
import torch
from torch import nn, optim
from torchvision import datasets, transforms, models

# Data folder structure matches your actual folders
tfm = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
ds = datasets.ImageFolder('data/', transform=tfm)
loader = torch.utils.data.DataLoader(ds, batch_size=8, shuffle=True)

# Model - updated to match number of classes in your data
num_classes = len(ds.classes)
print(f"Found {num_classes} classes: {ds.classes}")
model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, num_classes)
device = torch.device('cpu')
model.to(device)

loss_fn = nn.CrossEntropyLoss()
opt = optim.Adam(model.parameters(), lr=1e-4)

# Train for 3 epochs
for epoch in range(3):
    model.train()
    total = 0
    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        opt.zero_grad()
        out = model(imgs)
        loss = loss_fn(out, labels)
        loss.backward()
        opt.step()
        total += loss.item()
    print(f"Epoch {epoch+1} loss {total/len(loader):.4f}")

# Save
torch.save(model.state_dict(), 'dental_classifier.pt')
print("Saved model.")
