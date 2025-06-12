# 🔧 Terminal Issues Fixed

## Issues Identified and Resolved

### 1. **Flask API Error** ❌→✅
**Problem**: `@app.before_first_request` is deprecated in Flask 2.2+
```python
# OLD (Broken)
@app.before_first_request
def create_tables():
    db.create_all()
```

**Solution**: Updated to modern Flask pattern
```python
# NEW (Fixed)
def create_tables():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    create_tables()  # Initialize database tables
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### 2. **Directory Navigation Error** ❌→✅
**Problem**: Trying to `cd PDFMasterTool2` when already in that directory
```bash
PS C:\Users\mhann\OneDrive\Desktop\PDFMasterTool2> cd PDFMasterTool2
# Error: Path does not exist
```

**Solution**: Already in correct directory, no need to change
```bash
PS C:\Users\mhann\OneDrive\Desktop\PDFMasterTool2> # You're already here!
```

### 3. **npm Start Error** ❌→✅
**Problem**: Running `npm start` in wrong directory
```bash
PS C:\Users\mhann\OneDrive\Desktop\PDFMasterTool2> npm start
# Error: No package.json found
```

**Solution**: Navigate to frontend directory first
```bash
PS C:\Users\mhann\OneDrive\Desktop\PDFMasterTool2> cd frontend
PS C:\Users\mhann\OneDrive\Desktop\PDFMasterTool2\frontend> npm start
```

## ✅ **Current Status**

Both servers should now be running:
- **Flask API**: http://localhost:5000 ✅
- **React App**: http://localhost:3000 ✅

## 🚀 **Quick Start Commands**

### Option 1: Manual Start
```bash
# Terminal 1 - Flask API
python api_app.py

# Terminal 2 - React App  
cd frontend
npm start
```

### Option 2: Automated Start (Windows)
```bash
# Double-click or run:
start_servers.bat
```

## 🔍 **Verification Steps**

1. **Check Flask API**:
   - Open: http://localhost:5000
   - Should see API response or 404 (normal)

2. **Check React App**:
   - Open: http://localhost:3000
   - Should see React login page

3. **Test API Connection**:
   - React app should connect to Flask API automatically
   - No CORS errors in browser console

## 🐛 **Common Issues & Solutions**

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

### Module Import Errors
```bash
# Activate virtual environment
.venv\Scripts\activate

# Install missing dependencies
pip install flask-cors flask-jwt-extended
```

### React Dependencies
```bash
cd frontend
npm install  # Install missing packages
npm start    # Start development server
```

---

**Status**: ✅ **All Issues Resolved**  
**Next**: Open http://localhost:3000 to use the React app! 