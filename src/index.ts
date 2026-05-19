// Cloudflare Worker: 한자 탐험 앱 서버
// 프론트엔드는 frontend/ 폴더에서 Vite로 빌드되어 public/ 에 출력됩니다.

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        // 1. 먼저 ASSETS에서 해당 파일을 찾아 응답 시도
        const response = await env.ASSETS.fetch(request);

        // 2. 파일이 존재하거나 (200대) 오류가 아닌 경우 그대로 반환
        // (404인 경우에만 SPA 폴백 로직 수행)
        if (response.status !== 404) {
            return response;
        }

        // 3. 404이면서 파일 확장자가 없는 요청(페이지 라우팅)인 경우 index.html 반환
        const isFileRequest = url.pathname.includes('.');
        if (!isFileRequest) {
            const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
            return env.ASSETS.fetch(indexRequest);
        }

        // 4. 확장자가 있는 파일 요청인데 404라면 그대로 404 반환
        return response;
    },
};