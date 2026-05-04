// 1. React 기반의 통합 앱을 포함하는 전체 HTML 구조를 백틱(`)으로 감싸서 저장합니다.
const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>신나는 한자 탐험</title>
    
    <!-- SUIT 폰트 (ExtraBold 800) 적용 (프리미엄 모던 폰트) -->
    <link href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/static/woff2/SUIT.css" rel="stylesheet">
    
    <!-- Tailwind CSS (CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- React 및 ReactDOM (CDN) -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    
    <!-- Babel (브라우저에서 JSX 변환) -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        body {
            font-family: 'SUIT', sans-serif; /* 전체 앱에 프리미엄 모던 폰트 적용 */
            font-weight: 800; /* 요청하신 스위트 800 굵기 기본 적용 */
            letter-spacing: -0.02em;
        }
        
        /* 세련된 은은한 다이아몬드 패턴 배경 */
        .diamond-pattern {
            background-color: #f8fafc;
            background-image: 
                linear-gradient(135deg, rgba(148, 163, 184, 0.05) 25%, transparent 25%), 
                linear-gradient(225deg, rgba(148, 163, 184, 0.05) 25%, transparent 25%), 
                linear-gradient(45deg, rgba(148, 163, 184, 0.05) 25%, transparent 25%), 
                linear-gradient(315deg, rgba(148, 163, 184, 0.05) 25%, transparent 25%);
            background-position:  20px 0, 20px 0, 0 0, 0 0;
            background-size: 40px 40px;
            background-repeat: repeat;
        }

        /* 3D 카드 뒤집기 및 애니메이션 공통 스타일 */
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        /* 짝맞추기 젤리 터지는 애니메이션 */
        @keyframes popJelly {
            0% { transform: rotateY(180deg) scale(1); opacity: 1; }
            40% { transform: rotateY(180deg) scale(1.2) rotate(5deg); opacity: 1; }
            100% { transform: rotateY(180deg) scale(0) rotate(-15deg); opacity: 0; }
        }
        .card-matched { animation: popJelly 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; pointer-events: none; }
        
        /* 타이틀 프리미엄 텍스트 효과 */
        .premium-text-shadow {
            text-shadow: 0px 4px 0px rgba(0,0,0,0.05), 0px 8px 15px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <!-- React 앱이 렌더