// Cloudflare Worker: 한자 탐험 앱 서버
// 프론트엔드는 frontend/ 폴더에서 Vite로 빌드되어 public/ 에 출력됩니다.

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        // 정적 에셋 (이미지, 오디오, JS, CSS) 처리
        if (
            url.pathname.startsWith('/assets/') ||
            url.pathname.startsWith('/js/')
        ) {
            return env.ASSETS.fetch(request);
        }

        // SPA 라우팅: 모든 요청을 index.html로 폴백
        const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
        return env.ASSETS.fetch(indexRequest);
    },
};