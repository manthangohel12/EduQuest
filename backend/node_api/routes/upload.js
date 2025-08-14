const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'video/mp4',
        'video/avi',
        'video/mov'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload single file
router.post('/single', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
        };
        
        res.json({
            message: 'File uploaded successfully',
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload multiple files
router.post('/multiple', protect, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
        }));
        
        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get uploaded files for user
router.get('/files', protect, async (req, res) => {
    try {
        const uploadDir = 'uploads/';
        const files = [];
        
        if (fs.existsSync(uploadDir)) {
            const fileList = fs.readdirSync(uploadDir);
            
            for (const filename of fileList) {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                
                files.push({
                    filename,
                    size: stats.size,
                    uploadedAt: stats.mtime,
                    path: filePath
                });
            }
        }
        
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file
router.get('/download/:filename', protect, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join('uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete file
router.delete('/files/:filename', protect, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join('uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get file info
router.get('/files/:filename/info', protect, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join('uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        const stats = fs.statSync(filePath);
        const fileInfo = {
            filename,
            size: stats.size,
            uploadedAt: stats.mtime,
            path: filePath,
            mimetype: path.extname(filename)
        };
        
        res.json(fileInfo);
    } catch (error) {
        console.error('Error getting file info:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large' });
        }
        return res.status(400).json({ message: error.message });
    }
    
    if (error.message === 'Invalid file type') {
        return res.status(400).json({ message: 'Invalid file type' });
    }
    
    next(error);
});

module.exports = router; 