코나미 마성전설 웹포팅

## 실행

빌드 과정이 없습니다. `web/` 폴더가 그대로 실행 가능한 결과물입니다.

```bash
npm start          # http://localhost:8080
```

또는 아무 정적 서버나 사용해도 됩니다.

```bash
cd web && python -m http.server 8080
```

VS Code에서는 **F5**를 누르면 서버가 뜨고 디버거가 붙은 Chrome이 열립니다.

> `index.html`을 더블클릭해서 `file://`로 여는 것은 동작하지 않습니다.
> 브라우저가 `file://`에서 ES 모듈 import와 `fetch()`(맵 로딩)를 차단하기 때문에
> 로컬 서버가 필요합니다.

## 구조

```
web/                실행되는 결과물 전체
  index.html        진입점
  js/               게임 코드 (일반 ES 모듈, 18개 파일)
  tiles/ maps/ sfx/ music/ images/    에셋
src_web/            원본 TypeScript (참고용, 실행에는 쓰이지 않음)
tools/serve.mjs     의존성 없는 정적 서버
tools/build-js.mjs  src_web/src -> web/js 재변환 (`npm run convert`)
```

게임 코드는 이제 `web/js/` 의 JavaScript가 원본입니다. 수정은 여기서 하면 되고,
저장 후 브라우저 새로고침만 하면 반영됩니다.
