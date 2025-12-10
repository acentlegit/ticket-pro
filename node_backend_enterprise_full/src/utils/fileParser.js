import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';

/**
 * Parse CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Clean up file after parsing
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

/**
 * Parse Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseExcel = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Clean up file after parsing
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Error deleting file:', err);
            }

            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Determine file type and parse accordingly
 * @param {string} filePath - Path to file
 * @param {string} mimetype - MIME type of file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseFile = async (filePath, mimetype) => {
    if (mimetype === 'text/csv') {
        return await parseCSV(filePath);
    } else if (
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
        return await parseExcel(filePath);
    } else {
        throw new Error('Unsupported file type');
    }
};
