# train_focused.py - Focused training for extraoral right confidence improvement
import torch
from torch import nn, optim
from torchvision import datasets, transforms, models
import torch.nn.functional as F
import os

if __name__ == '__main__':
    print("🎯 Focused Training for Extraoral Right Confidence Improvement")
    print("=" * 60)
    
    # Enhanced data augmentation specifically for extraoral images
    train_tfm = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),  # Higher probability for lateral views
        transforms.RandomRotation(degrees=15),    # More rotation for better angle variety
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),  # Slight translation
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load dataset
    ds = datasets.ImageFolder('data/', transform=train_tfm)
    loader = torch.utils.data.DataLoader(ds, batch_size=4, shuffle=True)  # Smaller batch for better gradient updates

    # Model setup
    num_classes = len(ds.classes)
    print(f"Found {num_classes} classes: {ds.classes}")

    # Analyze class distribution
    class_counts = {}
    for i, class_name in enumerate(ds.classes):
        count = sum(1 for target in ds.targets if target == i)
        class_counts[class_name] = count
        print(f"  {class_name}: {count} images")

    # Identify extraoral_right index
    extraoral_right_idx = ds.classes.index('extraoral_right') if 'extraoral_right' in ds.classes else -1
    if extraoral_right_idx == -1:
        print("❌ extraoral_right category not found!")
        exit(1)
    
    print(f"\n🎯 Focus: extraoral_right (index {extraoral_right_idx}) has {class_counts['extraoral_right']} images")

    # Enhanced model with better feature extraction
    model = models.resnet34(weights='IMAGENET1K_V1')  # Deeper model for better features
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    device = torch.device('cpu')
    model.to(device)

    # Calculate enhanced class weights with extra boost for extraoral_right
    total_samples = sum(class_counts.values())
    weights = []
    for i, class_name in enumerate(ds.classes):
        base_weight = total_samples / (len(ds.classes) * class_counts[class_name])
        if class_name == 'extraoral_right':
            enhanced_weight = base_weight * 1.5  # Extra boost for problem category
            print(f"  🚀 {class_name}: enhanced weight = {enhanced_weight:.2f} (boosted from {base_weight:.2f})")
        else:
            enhanced_weight = base_weight
            print(f"     {class_name}: weight = {enhanced_weight:.2f}")
        weights.append(enhanced_weight)
    
    weights = torch.tensor(weights, dtype=torch.float32)
    loss_fn = nn.CrossEntropyLoss(weight=weights)

    # Focused optimizer settings
    opt = optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)  # Higher learning rate
    scheduler = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=20, eta_min=1e-5)

    # Extended training with focus tracking
    num_epochs = 20
    print(f"\n🏃‍♂️ Starting focused training for {num_epochs} epochs...")
    print("Tracking extraoral_right performance specifically...\n")

    best_extraoral_accuracy = 0
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        extraoral_right_correct = 0
        extraoral_right_total = 0
        
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
            
            # Track extraoral_right specifically
            extraoral_mask = (labels == extraoral_right_idx)
            extraoral_right_total += extraoral_mask.sum().item()
            extraoral_right_correct += ((predicted == labels) & extraoral_mask).sum().item()
        
        overall_accuracy = 100 * correct / total
        extraoral_accuracy = 100 * extraoral_right_correct / extraoral_right_total if extraoral_right_total > 0 else 0
        avg_loss = total_loss / len(loader)
        
        if extraoral_accuracy > best_extraoral_accuracy:
            best_extraoral_accuracy = extraoral_accuracy
            # Save best model for extraoral_right
            torch.save(model.state_dict(), 'dental_classifier_focused.pt')
        
        print(f"Epoch {epoch+1:2d}/{num_epochs} - Loss: {avg_loss:.4f} | Overall: {overall_accuracy:.1f}% | 🎯 Extraoral Right: {extraoral_accuracy:.1f}% | LR: {scheduler.get_last_lr()[0]:.6f}")
        scheduler.step()

    # Final model save
    torch.save(model.state_dict(), 'dental_classifier.pt')
    print(f"\n✅ Training completed!")
    print(f"🏆 Best extraoral_right accuracy: {best_extraoral_accuracy:.1f}%")
    print(f"📁 Final model saved as 'dental_classifier.pt'")
    print(f"📁 Best extraoral model saved as 'dental_classifier_focused.pt'")
    print("\n💡 Recommendations:")
    print("   1. Add more extraoral_right training images (aim for 20+)")
    print("   2. Ensure variety in angles and lighting conditions")
    print("   3. Remove duplicate/similar images from training set") 