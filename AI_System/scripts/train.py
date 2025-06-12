# train.py - Fixed version for Windows and data imbalance
import torch
from torch import nn, optim
from torchvision import datasets, transforms, models
import torch.nn.functional as F

if __name__ == '__main__':
    # Enhanced data augmentation for better generalization
    train_tfm = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.3),  # Light augmentation for dental images
        transforms.RandomRotation(degrees=10),    # Increased rotation for more variety
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load dataset with enhanced transforms
    ds = datasets.ImageFolder('data/', transform=train_tfm)
    loader = torch.utils.data.DataLoader(ds, batch_size=8, shuffle=True)  # Removed num_workers for Windows

    # Model - using pretrained weights for better feature extraction
    num_classes = len(ds.classes)
    print(f"Found {num_classes} classes: {ds.classes}")

    # Count samples per class to check for imbalance
    class_counts = {}
    for i, class_name in enumerate(ds.classes):
        count = sum(1 for target in ds.targets if target == i)
        class_counts[class_name] = count
        print(f"  {class_name}: {count} images")

    # Check for severely imbalanced classes
    min_samples = min(class_counts.values())
    if min_samples < 5:
        print(f"\n⚠️  WARNING: Category with only {min_samples} images detected!")
        print("Consider adding more training images for better performance.")

    model = models.resnet18(weights='IMAGENET1K_V1')  # Start with pretrained weights
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    device = torch.device('cpu')
    model.to(device)

    # Calculate class weights inversely proportional to frequency
    total_samples = sum(class_counts.values())
    weights = []
    for class_name in ds.classes:
        weight = total_samples / (len(ds.classes) * class_counts[class_name])
        weights.append(weight)
        print(f"  {class_name}: weight = {weight:.2f}")
    
    weights = torch.tensor(weights, dtype=torch.float32)
    loss_fn = nn.CrossEntropyLoss(weight=weights)

    # Improved optimizer with scheduler
    opt = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(opt, step_size=5, gamma=0.5)

    # Train for more epochs to compensate for small dataset
    num_epochs = 15
    print(f"\nStarting training for {num_epochs} epochs...")

    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            opt.zero_grad()
            out = model(imgs)
            loss = loss_fn(out, labels)
            loss.backward()
            opt.step()
            
            total_loss += loss.item()
            _, predicted = torch.max(out.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
        
        accuracy = 100 * correct / total
        avg_loss = total_loss / len(loader)
        
        print(f"Epoch {epoch+1:2d}/{num_epochs} - Loss: {avg_loss:.4f}, Accuracy: {accuracy:.1f}%, LR: {scheduler.get_last_lr()[0]:.6f}")
        scheduler.step()

    # Save the improved model
    torch.save(model.state_dict(), 'dental_classifier.pt')
    print(f"\nTraining completed! Model saved as 'dental_classifier.pt'")
    print("The model should now have better confidence scores for all categories.")
    print("\n💡 To improve further, consider adding more training images,")
    print("   especially for categories with fewer than 10 samples.")
