#!/usr/bin/env node
/**
 * 上传本地 CSV 数据到 Cloudflare KV
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://dca-simulator-api.sonic980828.workers.dev';
const ADMIN_PASSWORD = 'sonic666';
const CSV_PATH = path.join(__dirname, '../public/data/all_assets.csv');

console.log('=' + '='.repeat(60));
console.log('📊 上传 CSV 数据到 Cloudflare KV');
console.log('=' + '='.repeat(60));

// 读取并解析 CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = { date: values[0] };

        for (let j = 1; j < headers.length; j++) {
            const header = headers[j];
            const value = values[j];

            if (value && value !== '' && value !== 'NaN') {
                row[header] = parseFloat(value);
            }
        }
        data.push(row);
    }

    return data;
}

// 上传数据到 API
function uploadData(data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ data });
        const url = new URL('/api/admin/assets/upload-data', API_URL);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': ADMIN_PASSWORD,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    try {
        // 1. 读取 CSV 文件
        console.log(`\n📥 正在读取 CSV 文件: ${CSV_PATH}`);
        if (!fs.existsSync(CSV_PATH)) {
            throw new Error(`CSV 文件不存在: ${CSV_PATH}`);
        }

        const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
        const data = parseCSV(csvText);

        console.log(`✅ CSV 解析成功: ${data.length} 条记录`);
        console.log(`📦 数据大小: ${(JSON.stringify(data).length / 1024).toFixed(2)} KB`);

        // 2. 上传到 API
        console.log(`\n📤 正在上传数据到 KV...`);
        const result = await uploadData(data);

        if (result.success) {
            console.log(`\n✅ 上传成功！`);
            console.log(`   ${result.data.message}`);
            console.log(`\n${'='.repeat(60)}`);
            console.log(`✅ 完成！现在刷新前端页面，应该不会再看到 CSV 兜底警告了。`);
            console.log(`${'='.repeat(60)}`);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error(`\n❌ 错误: ${error.message}`);
        process.exit(1);
    }
}

main();

