const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'middleware.ts');
try {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Successfully deleted middleware.ts');
    } else {
        console.log('middleware.ts does not exist at ' + filePath);
    }
} catch (err) {
    console.error('Error deleting file:', err);
}
