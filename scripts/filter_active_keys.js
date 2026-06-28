const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../frontend/src');
const KO_FILE = path.join(__dirname, '../frontend/src/i18n/extracted_ko.json');
const FILTERED_KO_FILE = path.join(__dirname, '../frontend/src/i18n/filtered_ko.json');

// 1. 소스코드 내 모든 파일 스캔
function walkDir(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, fileList);
        } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

// 2. 사용 중인 키 정규식으로 추출
function getActiveKeys() {
    const files = walkDir(SRC_DIR);
    const activeKeys = new Set();
    const regex = /ext_\d+/g; // 'ext_123' 형태 매칭

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            activeKeys.add(match[0]);
        }
    }
    return activeKeys;
}

function main() {
    console.log('🔍 소스코드 내 참조 중인 다국어 키 스캔 시작...');
    const activeKeys = getActiveKeys();
    console.log(`✅ 소스코드에서 발견된 활성 키 개수: ${activeKeys.size}개`);

    if (!fs.existsSync(KO_FILE)) {
        console.error('❌ extracted_ko.json 파일을 찾을 수 없습니다.');
        return;
    }

    const koData = JSON.parse(fs.readFileSync(KO_FILE, 'utf-8'));
    const totalKeys = Object.keys(koData).length;
    console.log(`기존 사전(extracted_ko.json) 총 키 개수: ${totalKeys}개`);

    const filteredData = {};
    let matchedCount = 0;
    let missingCount = 0;

    for (const key of activeKeys) {
        if (koData[key] !== undefined) {
            filteredData[key] = koData[key];
            matchedCount++;
        } else {
            // 이 경우는 이전 버전의 찌꺼기이거나 수작업 실수일 수 있음
            missingCount++;
        }
    }

    const removedCount = totalKeys - matchedCount;

    fs.writeFileSync(FILTERED_KO_FILE, JSON.stringify(filteredData, null, 2), 'utf-8');
    
    console.log('\n==================================');
    console.log(`🗑️  제거된 찌꺼기(미사용) 키: ${removedCount}개`);
    console.log(`💡 누락된 참조(사전에 없는 키): ${missingCount}개`);
    console.log(`✨ 최종 필터링된 사전 키: ${matchedCount}개`);
    console.log(`📁 저장 완료: ${FILTERED_KO_FILE}`);
    console.log('==================================\n');
}

main();
