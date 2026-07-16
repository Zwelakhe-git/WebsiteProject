const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('../config');

// Раздаем статические файлы
router.use(express.static(config.TEMPLATES_DIR, {
    maxAge: '1d', // Кэширование на 1 день
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));


// Для SPA: все маршруты, которые не являются файлами, отдают index.html
router.get('', (req, res) => {
    // Проверяем, что запрос не к статическому файлу
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
        return res.status(404).send('File not found');
    }
    
    res.sendFile(path.resolve(config.TEMPLATES_DIR, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(404).send('404 - Page Not Found');
        }
    });
});

module.exports = router;