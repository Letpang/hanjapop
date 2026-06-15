const word = "電話";
const reading = "전화";
const examples = [
    "엄마한테 ( ) 걸어봐.",
    "電話로 친구에게 연락했다.",
    "매일 전화(電話)를 합니다.",
    "그는 전화를 걸었다."
];

for (let ex of examples) {
    let sentence = ex;
    if (!sentence.includes('(')) {
        if (sentence.includes(word)) {
            sentence = sentence.replace(word, `(${word})`);
        } else if (sentence.includes(reading)) {
            sentence = sentence.replace(reading, `(${reading})`);
        }
    }
    console.log(`Original: ${ex} -> Modified: ${sentence}`);
}
