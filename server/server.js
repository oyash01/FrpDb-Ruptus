const express = require('express');
const path = require('path');
const geoip = require('geoip-lite');
const ExcelJS = require('exceljs');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Function to get file paths based on platform
const getFilePaths = (platform) => {
    const baseDir = path.join(__dirname, '..', 'data', platform); // Use platform in path
    if (!fs.existsSync(baseDir)){
        fs.mkdirSync(baseDir, { recursive: true });
    }
    return {
        excelFilePath: path.join(baseDir, 'fingerprints.xlsx'),
        jsonFilePath: path.join(baseDir, 'fingerprints.json'),
    };
};

async function appendDataToExcel(data, platform) {
    const { excelFilePath } = getFilePaths(platform);
    let workbook;
    try {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
    } catch (error) {
        workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fingerprints');
        worksheet.columns = Object.keys(data).map(key => ({
            header: key, key: key, width: 20
        }));
    }

    const worksheet = workbook.getWorksheet('Fingerprints') || workbook.addWorksheet('Fingerprints');
    worksheet.addRow(data).commit();
    return workbook.xlsx.writeFile(excelFilePath);
}

function appendDataToJson(data, platform) {
    const { jsonFilePath } = getFilePaths(platform);
    let jsonData = [];
    try {
        jsonData = JSON.parse(fs.readFileSync(jsonFilePath));
    } catch (error) {
        jsonData = [];
    }

    jsonData.push(data);
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    return Promise.resolve();
}

app.post('/fingerprint', (req, res) => {
    const data = req.body;
    const platform = data.osPlatform || 'Miscellaneous'; // Default to 'Miscellaneous' if not provided
    const geo = geoip.lookup(data.ip);
    data.geo = geo ? { country: geo.country, region: geo.region, city: geo.city } : {};

    appendDataToExcel(data, platform)
        .then(() => appendDataToJson(data, platform))
        .then(() => res.status(200).send("Data processed successfully."))
        .catch(error => res.status(500).send(`Error processing data: ${error}`));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
