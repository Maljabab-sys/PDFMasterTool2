# train_smile_focused.py - Focused training for extraoral_full_face_smile confidence improvement
import torch
from torch import nn, optim
from torchvision import datasets, transforms, models
import torch.nn.functional as F
import os

if __name__ == '__main__':
    print("😄 Focused Training for Extraoral Full Face Smile Confidence Improvement")
    print("=" * 70)
    
    # Enhanced data augmentation specifically for smile images
    train_tfm = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.3),  # Lower probability to preserve facial symmetry
        transforms.RandomRotation(degrees=8),     # Gentle rotation for smile images
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.3, hue=0.05),  # Enhanced color for smile detection
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),  # Minimal translation for faces
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load dataset
    ds = datasets.ImageFolder('data/', transform=train_tfm)
    loader = torch.utils.data.DataLoader(ds, batch_size=4, shuffle=True)  # Small batch for better gradient updates

    # Model setup
    num_classes = len(ds.classes)
    print(f"Found {num_classes} classes: {ds.classes}")

    # Analyze class distribution
    class_counts = {}
    for i, class_name in enumerate(ds.classes):
        count = sum(1 for target in ds.targets if target == i)
        class_counts[class_name] = count
        print(f"  {class_name}: {count} images")

    # Identify extraoral_full_face_smile index
    smile_idx = ds.classes.index('extraoral_full_face_smile') if 'extraoral_full_face_smile' in ds.classes else -1
    if smile_idx == -1:
        print("❌ extraoral_full_face_smile category not found!")
        exit(1)
    
    print(f"\n😄 Focus: extraoral_full_face_smile (index {smile_idx}) has {class_counts['extraoral_full_face_smile']} images")

    # Enhanced model with better feature extraction for facial recognition
    model = models.resnet34(weights='IMAGENET1K_V1')  # ResNet34 better for facial features
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    device = torch.device('cpu')
    model.to(device)

    # Calculate enhanced class weights with extra boost for extraoral_full_face_smile
    total_samples = sum(class_counts.values())
    weights = []
    for i, class_name in enumerate(ds.classes):
        base_weight = total_samples / (len(ds.classes) * class_counts[class_name])
        if class_name == 'extraoral_full_face_smile':
            enhanced_weight = base_weight * 1.8  # Extra boost for smile detection
            print(f"  😄 {class_name}: enhanced weight = {enhanced_weight:.2f} (boosted from {base_weight:.2f})")
        elif class_name == 'extraoral_right':  # Keep previous boost
            enhanced_weight = base_weight * 1.5
            print(f"  🚀 {class_name}: enhanced weight = {enhanced_weight:.2f} (boosted from {base_weight:.2f})")
        else:
            enhanced_weight = base_weight
            print(f"     {class_name}: weight = {enhanced_weight:.2f}")
        weights.append(enhanced_weight)
    
    weights = torch.tensor(weights, dtype=torch.float32)
    loss_fn = nn.CrossEntropyLoss(weight=weights)

    # Focused optimizer settings for smile detection
    opt = optim.AdamW(model.parameters(), lr=1.5e-3, weight_decay=1e-4)  # Moderate learning rate for faces
    scheduler = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=25, eta_min=1e-6)

    # Extended training with dual focus tracking
    num_epochs = 25
    print(f"\n🏃‍♂️ Starting smile-focused training for {num_epochs} epochs...")
    print("Tracking both extraoral_full_face_smile and extraoral_right performance...\n")

    best_smile_accuracy = 0
    best_right_accuracy = 0
    extraoral_right_idx = ds.classes.index('extraoral_right') if 'extraoral_right' in ds.classes else -1
    
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        smile_correct = 0
        smile_total = 0
        right_correct = 0
        right_total = 0
        
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
            
            # Track extraoral_full_face_smile specifically
            smile_mask = (labels == smile_idx)
            smile_total += smile_mask.sum().item()
            smile_correct += ((predicted == labels) & smile_mask).sum().item()
            
            # Also track extraoral_right to ensure we don't lose progress
            if extraoral_right_idx >= 0:
                right_mask = (labels == extraoral_right_idx)
                right_total += right_mask.sum().item()
                right_correct += ((predicted == labels) & right_mask).sum().item()
        
        overall_accuracy = 100 * correct / total
        smile_accuracy = 100 * smile_correct / smile_total if smile_total > 0 else 0
        right_accuracy = 100 * right_correct / right_total if right_total > 0 else 0
        avg_loss = total_loss / len(loader)
        
        if smile_accuracy > best_smile_accuracy:
            best_smile_accuracy = smile_accuracy
            # Save best model for smile detection
            torch.save(model.state_dict(), 'dental_classifier_smile_focused.pt')
        
        if right_accuracy > best_right_accuracy:
            best_right_accuracy = right_accuracy
        
        print(f"Epoch {epoch+1:2d}/{num_epochs} - Loss: {avg_loss:.4f} | Overall: {overall_accuracy:.1f}% | 😄 Smile: {smile_accuracy:.1f}% | 🚀 Right: {right_accuracy:.1f}% | LR: {scheduler.get_last_lr()[0]:.6f}")
        scheduler.step()

    # Final model save
    torch.save(model.state_dict(), 'dental_classifier.pt')
    print(f"\n✅ Training completed!")
    print(f"😄 Best extraoral_full_face_smile accuracy: {best_smile_accuracy:.1f}%")
    print(f"🚀 Best extraoral_right accuracy: {best_right_accuracy:.1f}%")
    print(f"📁 Final model saved as 'dental_classifier.pt'")
    print(f"📁 Best smile model saved as 'dental_classifier_smile_focused.pt'")
    print("\n💡 Recommendations:")
    print("   1. Add more extraoral_full_face_smile training images (aim for 20+)")
    print("   2. Ensure variety in smile expressions and lighting")
    print("   3. Include both subtle and broad smiles for better detection")
    print("   4. Maintain good image quality for facial feature recognition") 