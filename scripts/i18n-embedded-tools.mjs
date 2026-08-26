#!/usr/bin/env node
/**
 * i18n backfill for the four embedded workflow tools.
 *
 * `http-status-reference`, `public-repos-yml-builder`, `public-repos-not-automation`
 * and `review-description-generator` lost their standalone routes in the
 * network-reference / repo-ops merges, but their markup still carries
 * `data-i18n="tools.<id>.ui.*"` hooks and their scripts still call
 * `_t('tools.<id>.js.*')`. They therefore still need catalog entries.
 *
 * English below is the source of truth; every other locale must keep exact key
 * parity with it. Re-run after changing any of those routes' visible strings:
 *
 *   node scripts/i18n-embedded-tools.mjs && npm run build
 *
 * Parity is enforced by src/i18n/embedded-tools.test.js.
 */
import fs from "node:fs";

const en = {
  "http-status-reference": {
    name: "HTTP Status Reference",
    desc: "Searchable reference for standard HTTP status codes with usage and caching guidance.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Searchable",
      badge2: "Client-Side Only",
      button0: "Clear",
      button1: "All",
      button2: "1xx Informational",
      button3: "2xx Success",
      button4: "3xx Redirection",
      button5: "4xx Client Error",
      button6: "5xx Server Error",
      desc0:
        "Search by code, phrase, class, description, or when-to-use guidance.",
      heading0: "Search HTTP statuses",
      heading1: "Status codes",
      label0: "Status code search",
      placeholder0: "e.g., 404, redirect, cacheable, rate limit",
      stat0: "Total statuses",
      stat1: "Matching results",
      stat2: "Status classes",
      stat3: "Default cacheable",
      status0: "Showing all HTTP status codes.",
      status1:
        "No HTTP status codes match the current search and class filter.",
      th0: "Class",
      th1: "Meaning",
      th2: "Typical use",
    },
    cheatsheet: {
      title: "HTTP Status Code Guide",
      h0: "Class meanings",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Class</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Meaning</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Typical use</th></tr>\n            <tr><td><code>1xx</code></td><td>Informational</td><td>Interim responses while a request continues.</td></tr>\n            <tr><td><code>2xx</code></td><td>Successful</td><td>The request was received, understood, and accepted.</td></tr>\n            <tr><td><code>3xx</code></td><td>Redirection</td><td>The client needs another request or cached representation.</td></tr>\n            <tr><td><code>4xx</code></td><td>Client Error</td><td>The request has a client-side problem or cannot be fulfilled.</td></tr>\n            <tr><td><code>5xx</code></td><td>Server Error</td><td>The server failed to fulfill an apparently valid request.</td></tr>\n          </table>",
      h1: "Safety, idempotency, and caching",
      c1: "\n          <p>Status codes do not make a request safe or idempotent by themselves. Safety and idempotency come from the request method and application semantics.</p>\n          <p>RFC caching rules allow some responses to be reused by default, including common statuses such as <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, and <code>501</code>. Other statuses generally need explicit cache headers.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "Public Repos YAML Builder",
    desc: "Generate and validate repos.yml inventories for public repository automation.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Client-Side Only",
      badge1: "Kanban Automation",
      button0: "Sample",
      button1: "Build YAML",
      button2: "Clear",
      button3: "Copy",
      desc0:
        "Use one repository per line. Add metadata as key=value pairs after the slug, for example team=platform cadence=weekly sha=ok.",
      desc1:
        "Accepted metadata: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Paste repositories and build YAML to validate recurring automation policy needs.",
      heading0: "Inventory defaults",
      heading1: "repos.yml",
      heading2: "GitHub Actions audit",
      heading3: "Policy findings",
      label0: "Repository slugs or URLs",
      label1: "Owner",
      label2: "Default cadence",
      option0: "Weekly",
      option1: "Biweekly",
      option2: "Monthly",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "Waiting for input",
    },
    js: {
      branchProtection: "branch protection is not marked protected.",
      copied: "Copied",
      invalidJson: "Could not parse GitHub public repos JSON array.",
      invalidJsonRepo:
        "Could not map GitHub API object to a repository slug or URL.",
      invalidRepo: "Could not parse repository slug or GitHub URL.",
      monetizationReadiness: "monetization readiness is not marked ready.",
      needsReview: "Needs review",
      noFindings: "No findings for the selected policy checks.",
      ready: "Ready",
      secretsPosture:
        "secrets posture needs confirmation before public automation.",
      shaPinning:
        "SHA pinning needs review for workflow actions and third-party references.",
      waiting: "Waiting for input",
    },
  },
  "public-repos-not-automation": {
    name: "Public Repos Not Automation",
    desc: "Decide which recurring public repository tasks should stay manual for now and generate a no-automation decision record.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: auto-close stale public issues from recurring Kanban demand\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Client-Side Only",
      badge1: "Manual Stewardship",
      button0: "Sample",
      button1: "Build decision record",
      button2: "Clear",
      button3: "Copy",
      desc0:
        "Use one key:value per line for repo, task, owner, cadence, risk, next-review, and notes. GitHub public repos JSON arrays and plain text are also accepted.",
      desc1:
        "Designed for public repository work that has recurring Kanban demand but still needs manual stewardship and human judgment. Paste GitHub public repos JSON arrays to start from repo metadata.",
      heading0: "No-automation reasons",
      heading1: "Decision record",
      heading2: "Checklist",
      label0: "Repository task",
      label1: "Decision owner",
      label2: "Review window",
      label3: "Evidence needed before automation",
      option0: "30 days",
      option1: "60 days",
      option2: "90 days",
      option3: "Next release",
      placeholder1:
        "e.g., written policy, rollback owner, audit log, dry-run evidence, and 3 repeated manual executions.",
      placeholder2: "No automation decision record will appear here.",
      placeholder3: "Manual stewardship checklist will appear here.",
    },
    js: {
      copied: "Copied",
      copyFailed: "Copy failed. Select the output and copy it manually.",
      manual: "Manual",
      missingReasons: "Select at least one reason not to automate yet.",
      missingRepos: "Paste at least one valid public GitHub repository.",
      missingTask: "Add a repository task before building the decision record.",
      needsReason: "Needs reason",
      reasonFrequency: "Low frequency or weak demand",
      reasonObservability: "Missing observability",
      reasonOwner: "Unclear owner or approval path",
      reasonPolicy: "Ambiguous policy boundary",
      reasonSafety: "Safety or reputation risk",
    },
  },
  "review-description-generator": {
    name: "Review Description Generator",
    desc: "Generate structured PR review and comment descriptions from commits, diffs, or notes.",
    ui: {
      badge0: "Client-Side Only",
      badge1: "6 Templates",
      button0: "Generate",
      button1: "Copy",
      button2: "Clear",
      heading0: "How It Works",
      label0: "Review Template",
      label1: "Generated Description",
      option0: "Dependency Bump",
      option1: "Bug Fix",
      option2: "Feature Addition",
      option3: "Refactor / Cleanup",
      option4: "CI / Pipeline Change",
      option5: "Custom",
      text0:
        "Choose a template that matches your review type (dependency bump, bug fix, feature, etc.).",
      text1:
        "Fill in the context fields — the tool provides sensible defaults and guidance for each template.",
      text2:
        "Click Generate to produce a structured, markdown-formatted description ready for your PR or review comment.",
      text3: "All processing is local — your data is not sent to our servers.",
    },
  },
};

const ko = {
  "http-status-reference": {
    name: "HTTP 상태 코드 참조",
    desc: "표준 HTTP 상태 코드를 사용 사례와 캐싱 지침과 함께 검색합니다.",
    ui: {
      badge0: "RFC 9110",
      badge1: "검색 가능",
      badge2: "브라우저에서 처리",
      button0: "지우기",
      button1: "전체",
      button2: "1xx 정보",
      button3: "2xx 성공",
      button4: "3xx 리디렉션",
      button5: "4xx 클라이언트 오류",
      button6: "5xx 서버 오류",
      desc0: "코드, 문구, 분류, 설명 또는 사용 시점 지침으로 검색합니다.",
      heading0: "HTTP 상태 코드 검색",
      heading1: "상태 코드",
      label0: "상태 코드 검색",
      placeholder0: "예: 404, 리디렉션, 캐시 가능, 요청 제한",
      stat0: "전체 상태 코드",
      stat1: "일치하는 결과",
      stat2: "상태 분류",
      stat3: "기본 캐시 가능",
      status0: "모든 HTTP 상태 코드를 표시합니다.",
      status1: "현재 검색어와 분류 필터에 맞는 HTTP 상태 코드가 없습니다.",
      th0: "분류",
      th1: "의미",
      th2: "일반적인 용도",
    },
    cheatsheet: {
      title: "HTTP 상태 코드 가이드",
      h0: "클래스별 의미",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">클래스</th><th data-i18n=\"tools.http-status-reference.ui.th1\">의미</th><th data-i18n=\"tools.http-status-reference.ui.th2\">일반적인 용도</th></tr>\n            <tr><td><code>1xx</code></td><td>정보</td><td>요청이 계속되는 동안의 중간 응답입니다.</td></tr>\n            <tr><td><code>2xx</code></td><td>성공</td><td>요청이 수신되고 이해되었으며 수락되었습니다.</td></tr>\n            <tr><td><code>3xx</code></td><td>리다이렉션</td><td>클라이언트에 추가 요청 또는 캐시된 표현이 필요합니다.</td></tr>\n            <tr><td><code>4xx</code></td><td>클라이언트 오류</td><td>요청에 클라이언트 측 문제가 있거나 처리할 수 없습니다.</td></tr>\n            <tr><td><code>5xx</code></td><td>서버 오류</td><td>서버가 유효해 보이는 요청을 처리하지 못했습니다.</td></tr>\n          </table>",
      h1: "안전성, 멱등성, 캐싱",
      c1: "\n          <p>상태 코드 자체가 요청을 안전하거나 멱등하게 만들지는 않습니다. 안전성과 멱등성은 요청 메서드와 애플리케이션 시맨틱에서 비롯됩니다.</p>\n          <p>RFC 캐싱 규칙은 일부 응답을 기본적으로 재사용하도록 허용하며, 여기에는 다음과 같은 일반적인 상태 코드가 포함됩니다: <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. 그 밖의 상태 코드는 일반적으로 명시적인 캐시 헤더가 필요합니다.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "공개 저장소 YAML 빌더",
    desc: "공개 저장소 자동화를 위한 repos.yml 인벤토리를 생성하고 검증합니다.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "브라우저에서 처리",
      badge1: "칸반 자동화",
      button0: "샘플",
      button1: "YAML 생성",
      button2: "지우기",
      button3: "복사",
      desc0:
        "저장소를 한 줄에 하나씩 입력하세요. 슬러그 뒤에 key=value 형식으로 메타데이터를 추가할 수 있습니다. 예: team=platform cadence=weekly sha=ok.",
      desc1:
        "지원하는 메타데이터: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "저장소를 붙여넣고 YAML을 생성해 반복 자동화 정책 요건을 검증하세요.",
      heading0: "인벤토리 기본값",
      heading1: "repos.yml",
      heading2: "GitHub Actions 감사",
      heading3: "정책 검토 결과",
      label0: "저장소 슬러그 또는 URL",
      label1: "소유자",
      label2: "기본 주기",
      option0: "매주",
      option1: "격주",
      option2: "매월",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "입력을 기다리는 중",
    },
    js: {
      branchProtection: "브랜치 보호가 설정되어 있지 않습니다.",
      copied: "복사됨",
      invalidJson: "GitHub 공개 저장소 JSON 배열을 파싱할 수 없습니다.",
      invalidJsonRepo:
        "GitHub API 객체를 저장소 슬러그나 URL로 변환할 수 없습니다.",
      invalidRepo: "저장소 슬러그 또는 GitHub URL을 파싱할 수 없습니다.",
      monetizationReadiness:
        "수익화 준비 상태가 완료로 표시되어 있지 않습니다.",
      needsReview: "검토 필요",
      noFindings: "선택한 정책 검사에서 발견된 문제가 없습니다.",
      ready: "준비됨",
      secretsPosture: "공개 자동화 전에 시크릿 관리 상태를 확인해야 합니다.",
      shaPinning: "워크플로 액션과 서드파티 참조의 SHA 고정을 검토해야 합니다.",
      waiting: "입력을 기다리는 중",
    },
  },
  "public-repos-not-automation": {
    name: "공개 저장소 수동 관리 판단",
    desc: "반복되는 공개 저장소 작업 중 당분간 수동으로 유지할 항목을 결정하고 자동화 보류 기록을 생성합니다.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: 반복되는 칸반 수요로 인한 오래된 공개 이슈 자동 종료\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "브라우저에서 처리",
      badge1: "수동 관리",
      button0: "샘플",
      button1: "판단 기록 생성",
      button2: "지우기",
      button3: "복사",
      desc0:
        "repo, task, owner, cadence, risk, next-review, notes를 한 줄에 하나씩 key:value 형식으로 입력하세요. GitHub 공개 저장소 JSON 배열과 일반 텍스트도 지원합니다.",
      desc1:
        "반복적인 칸반 수요가 있지만 여전히 사람의 판단과 수동 관리가 필요한 공개 저장소 작업을 위해 설계되었습니다. GitHub 공개 저장소 JSON 배열을 붙여넣어 저장소 메타데이터부터 시작할 수 있습니다.",
      heading0: "자동화하지 않는 이유",
      heading1: "판단 기록",
      heading2: "체크리스트",
      label0: "저장소 작업",
      label1: "판단 책임자",
      label2: "재검토 주기",
      label3: "자동화 전에 필요한 근거",
      option0: "30일",
      option1: "60일",
      option2: "90일",
      option3: "다음 릴리스",
      placeholder1:
        "예: 문서화된 정책, 롤백 책임자, 감사 로그, 드라이런 결과, 3회 이상의 수동 실행 기록.",
      placeholder2: "자동화 보류 판단 기록이 여기에 표시됩니다.",
      placeholder3: "수동 관리 체크리스트가 여기에 표시됩니다.",
    },
    js: {
      copied: "복사됨",
      copyFailed: "복사에 실패했습니다. 출력을 선택해 직접 복사하세요.",
      manual: "수동",
      missingReasons: "자동화하지 않을 이유를 하나 이상 선택하세요.",
      missingRepos: "유효한 공개 GitHub 저장소를 하나 이상 붙여넣으세요.",
      missingTask: "판단 기록을 생성하기 전에 저장소 작업을 입력하세요.",
      needsReason: "이유 필요",
      reasonFrequency: "빈도가 낮거나 수요가 약함",
      reasonObservability: "관측 수단 부족",
      reasonOwner: "책임자 또는 승인 경로 불명확",
      reasonPolicy: "정책 경계가 모호함",
      reasonSafety: "안전 또는 평판 위험",
    },
  },
  "review-description-generator": {
    name: "리뷰 설명 생성기",
    desc: "커밋, diff 또는 메모에서 구조화된 PR 리뷰 및 코멘트 설명을 생성합니다.",
    ui: {
      badge0: "브라우저에서 처리",
      badge1: "템플릿 6종",
      button0: "생성",
      button1: "복사",
      button2: "지우기",
      heading0: "사용 방법",
      label0: "리뷰 템플릿",
      label1: "생성된 설명",
      option0: "의존성 업데이트",
      option1: "버그 수정",
      option2: "기능 추가",
      option3: "리팩터링 / 정리",
      option4: "CI / 파이프라인 변경",
      option5: "직접 입력",
      text0:
        "리뷰 유형에 맞는 템플릿을 선택하세요(의존성 업데이트, 버그 수정, 기능 추가 등).",
      text1:
        "컨텍스트 항목을 채우세요 — 템플릿마다 적절한 기본값과 안내를 제공합니다.",
      text2:
        "생성을 클릭하면 PR이나 리뷰 코멘트에 바로 쓸 수 있는 마크다운 형식의 구조화된 설명이 만들어집니다.",
      text3:
        "모든 처리는 브라우저에서 이루어지며 입력한 내용은 서버로 전송되지 않습니다.",
    },
  },
};

const ja = {
  "http-status-reference": {
    name: "HTTPステータスリファレンス",
    desc: "標準的なHTTPステータスコードを用途とキャッシュの指針つきで検索できます。",
    ui: {
      badge0: "RFC 9110",
      badge1: "検索可能",
      badge2: "ブラウザ内で処理",
      button0: "クリア",
      button1: "すべて",
      button2: "1xx 情報",
      button3: "2xx 成功",
      button4: "3xx リダイレクト",
      button5: "4xx クライアントエラー",
      button6: "5xx サーバーエラー",
      desc0:
        "コード、フレーズ、クラス、説明、使いどころの指針から検索できます。",
      heading0: "HTTPステータスを検索",
      heading1: "ステータスコード",
      label0: "ステータスコード検索",
      placeholder0: "例: 404、リダイレクト、キャッシュ可能、レート制限",
      stat0: "ステータス総数",
      stat1: "一致した結果",
      stat2: "ステータスクラス",
      stat3: "既定でキャッシュ可能",
      status0: "すべてのHTTPステータスコードを表示しています。",
      status1:
        "現在の検索条件とクラスフィルターに一致するHTTPステータスコードはありません。",
      th0: "クラス",
      th1: "意味",
      th2: "主な用途",
    },
    cheatsheet: {
      title: "HTTP ステータスコードガイド",
      h0: "クラスの意味",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">クラス</th><th data-i18n=\"tools.http-status-reference.ui.th1\">意味</th><th data-i18n=\"tools.http-status-reference.ui.th2\">一般的な用途</th></tr>\n            <tr><td><code>1xx</code></td><td>情報</td><td>リクエストの処理が続いている間の暫定的な応答です。</td></tr>\n            <tr><td><code>2xx</code></td><td>成功</td><td>リクエストが受信され、理解され、受理されました。</td></tr>\n            <tr><td><code>3xx</code></td><td>リダイレクト</td><td>クライアントは別のリクエストまたはキャッシュされた表現を必要とします。</td></tr>\n            <tr><td><code>4xx</code></td><td>クライアントエラー</td><td>リクエストにクライアント側の問題があるか、実行できません。</td></tr>\n            <tr><td><code>5xx</code></td><td>サーバーエラー</td><td>サーバーが有効と思われるリクエストの処理に失敗しました。</td></tr>\n          </table>",
      h1: "安全性・冪等性・キャッシュ",
      c1: "\n          <p>ステータスコードそれ自体がリクエストを安全または冪等にするわけではありません。安全性と冪等性はリクエストメソッドとアプリケーションのセマンティクスに由来します。</p>\n          <p>RFC のキャッシュ規則では、一部の応答が既定で再利用可能とされており、次のような一般的なステータスが含まれます: <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>。それ以外のステータスには通常、明示的なキャッシュヘッダーが必要です。</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "公開リポジトリYAMLビルダー",
    desc: "公開リポジトリ自動化のためのrepos.ymlインベントリを生成・検証します。",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "ブラウザ内で処理",
      badge1: "カンバン自動化",
      button0: "サンプル",
      button1: "YAMLを生成",
      button2: "クリア",
      button3: "コピー",
      desc0:
        "リポジトリを1行に1つ入力します。スラッグの後ろに key=value 形式でメタデータを追加できます。例: team=platform cadence=weekly sha=ok",
      desc1:
        "利用できるメタデータ: team, cadence, topic, sha, branch, secrets, monetization, notes",
      desc2:
        "リポジトリを貼り付けてYAMLを生成し、繰り返し発生する自動化ポリシー要件を検証します。",
      heading0: "インベントリの既定値",
      heading1: "repos.yml",
      heading2: "GitHub Actions 監査",
      heading3: "ポリシー指摘事項",
      label0: "リポジトリのスラッグまたはURL",
      label1: "オーナー",
      label2: "既定の頻度",
      option0: "毎週",
      option1: "隔週",
      option2: "毎月",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "入力待ちです",
    },
    js: {
      branchProtection: "ブランチ保護が有効になっていません。",
      copied: "コピーしました",
      invalidJson: "GitHub公開リポジトリのJSON配列を解析できませんでした。",
      invalidJsonRepo:
        "GitHub APIオブジェクトをリポジトリのスラッグまたはURLに対応付けられませんでした。",
      invalidRepo:
        "リポジトリのスラッグまたはGitHub URLを解析できませんでした。",
      monetizationReadiness: "収益化の準備状況が完了になっていません。",
      needsReview: "要確認",
      noFindings: "選択したポリシーチェックで指摘事項はありません。",
      ready: "準備完了",
      secretsPosture: "公開自動化の前にシークレット管理状況の確認が必要です。",
      shaPinning:
        "ワークフローのアクションと外部参照のSHA固定を確認する必要があります。",
      waiting: "入力待ちです",
    },
  },
  "public-repos-not-automation": {
    name: "公開リポジトリ手動運用の判断",
    desc: "繰り返し発生する公開リポジトリ作業のうち当面は手動で維持するものを判断し、自動化見送りの記録を生成します。",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: 繰り返し発生するカンバン需要による古い公開 issue の自動クローズ\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "ブラウザ内で処理",
      badge1: "手動運用",
      button0: "サンプル",
      button1: "判断記録を作成",
      button2: "クリア",
      button3: "コピー",
      desc0:
        "repo, task, owner, cadence, risk, next-review, notes を1行に1つ key:value 形式で入力します。GitHub公開リポジトリのJSON配列や通常のテキストも利用できます。",
      desc1:
        "カンバン上で繰り返し需要があるものの、人の判断と手動運用が必要な公開リポジトリ作業のために設計されています。GitHub公開リポジトリのJSON配列を貼り付ければリポジトリのメタデータから始められます。",
      heading0: "自動化しない理由",
      heading1: "判断記録",
      heading2: "チェックリスト",
      label0: "リポジトリ作業",
      label1: "判断の責任者",
      label2: "再検討の期間",
      label3: "自動化の前に必要な根拠",
      option0: "30日",
      option1: "60日",
      option2: "90日",
      option3: "次のリリース",
      placeholder1:
        "例: 文書化されたポリシー、ロールバック責任者、監査ログ、ドライラン結果、3回以上の手動実行。",
      placeholder2: "自動化見送りの判断記録がここに表示されます。",
      placeholder3: "手動運用のチェックリストがここに表示されます。",
    },
    js: {
      copied: "コピーしました",
      copyFailed:
        "コピーに失敗しました。出力を選択して手動でコピーしてください。",
      manual: "手動",
      missingReasons: "まだ自動化しない理由を1つ以上選択してください。",
      missingRepos: "有効な公開GitHubリポジトリを1つ以上貼り付けてください。",
      missingTask: "判断記録を作成する前にリポジトリ作業を入力してください。",
      needsReason: "理由が必要",
      reasonFrequency: "頻度が低い、または需要が弱い",
      reasonObservability: "監視手段が不足",
      reasonOwner: "担当者や承認経路が不明確",
      reasonPolicy: "ポリシーの境界が曖昧",
      reasonSafety: "安全性や評判のリスク",
    },
  },
  "review-description-generator": {
    name: "レビュー説明ジェネレーター",
    desc: "コミット、差分、メモから構造化されたPRレビューやコメントの説明を生成します。",
    ui: {
      badge0: "ブラウザ内で処理",
      badge1: "テンプレート6種",
      button0: "生成",
      button1: "コピー",
      button2: "クリア",
      heading0: "使い方",
      label0: "レビューテンプレート",
      label1: "生成された説明",
      option0: "依存関係の更新",
      option1: "バグ修正",
      option2: "機能追加",
      option3: "リファクタリング / 整理",
      option4: "CI / パイプラインの変更",
      option5: "カスタム",
      text0:
        "レビューの種類に合ったテンプレートを選びます（依存関係の更新、バグ修正、機能追加など）。",
      text1:
        "コンテキスト項目を入力します — テンプレートごとに適切な既定値とガイダンスが用意されています。",
      text2:
        "「生成」をクリックすると、PRやレビューコメントにそのまま使える構造化されたMarkdown形式の説明が作成されます。",
      text3:
        "処理はすべてブラウザ内で行われ、入力内容がサーバーに送信されることはありません。",
    },
  },
};

const es = {
  "http-status-reference": {
    name: "Referencia de Estados HTTP",
    desc: "Referencia consultable de los códigos de estado HTTP estándar con guía de uso y de caché.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Consultable",
      badge2: "Solo en el navegador",
      button0: "Limpiar",
      button1: "Todos",
      button2: "1xx Informativo",
      button3: "2xx Éxito",
      button4: "3xx Redirección",
      button5: "4xx Error de cliente",
      button6: "5xx Error de servidor",
      desc0: "Busca por código, frase, clase, descripción o guía de uso.",
      heading0: "Buscar estados HTTP",
      heading1: "Códigos de estado",
      label0: "Búsqueda de código de estado",
      placeholder0: "p. ej., 404, redirección, cacheable, límite de peticiones",
      stat0: "Estados totales",
      stat1: "Resultados coincidentes",
      stat2: "Clases de estado",
      stat3: "Cacheable por defecto",
      status0: "Mostrando todos los códigos de estado HTTP.",
      status1:
        "Ningún código de estado HTTP coincide con la búsqueda y el filtro de clase actuales.",
      th0: "Clase",
      th1: "Significado",
      th2: "Uso habitual",
    },
    cheatsheet: {
      title: "Guía de códigos de estado HTTP",
      h0: "Significado de las clases",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Clase</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Significado</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Uso típico</th></tr>\n            <tr><td><code>1xx</code></td><td>Informativo</td><td>Respuestas provisionales mientras continúa una solicitud.</td></tr>\n            <tr><td><code>2xx</code></td><td>Correcto</td><td>La solicitud se recibió, se entendió y se aceptó.</td></tr>\n            <tr><td><code>3xx</code></td><td>Redirección</td><td>El cliente necesita otra solicitud o una representación en caché.</td></tr>\n            <tr><td><code>4xx</code></td><td>Error del cliente</td><td>La solicitud tiene un problema del lado del cliente o no puede completarse.</td></tr>\n            <tr><td><code>5xx</code></td><td>Error del servidor</td><td>El servidor no pudo completar una solicitud aparentemente válida.</td></tr>\n          </table>",
      h1: "Seguridad, idempotencia y almacenamiento en caché",
      c1: "\n          <p>Los códigos de estado por sí solos no hacen que una solicitud sea segura ni idempotente. La seguridad y la idempotencia provienen del método de la solicitud y de la semántica de la aplicación.</p>\n          <p>Las reglas de caché de los RFC permiten reutilizar algunas respuestas de forma predeterminada, incluidos estados comunes como <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. Otros estados suelen requerir encabezados de caché explícitos.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "Generador de YAML de Repos Públicos",
    desc: "Genera y valida inventarios repos.yml para la automatización de repositorios públicos.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Solo en el navegador",
      badge1: "Automatización Kanban",
      button0: "Ejemplo",
      button1: "Generar YAML",
      button2: "Limpiar",
      button3: "Copiar",
      desc0:
        "Usa un repositorio por línea. Añade metadatos como pares key=value después del slug, por ejemplo team=platform cadence=weekly sha=ok.",
      desc1:
        "Metadatos admitidos: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Pega los repositorios y genera el YAML para validar las necesidades recurrentes de la política de automatización.",
      heading0: "Valores por defecto del inventario",
      heading1: "repos.yml",
      heading2: "Auditoría de GitHub Actions",
      heading3: "Hallazgos de política",
      label0: "Slugs o URLs de repositorios",
      label1: "Propietario",
      label2: "Cadencia por defecto",
      option0: "Semanal",
      option1: "Quincenal",
      option2: "Mensual",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "Esperando entrada",
    },
    js: {
      branchProtection: "la protección de rama no está marcada como protegida.",
      copied: "Copiado",
      invalidJson:
        "No se pudo analizar el array JSON de repositorios públicos de GitHub.",
      invalidJsonRepo:
        "No se pudo asignar el objeto de la API de GitHub a un slug o URL de repositorio.",
      invalidRepo:
        "No se pudo analizar el slug del repositorio o la URL de GitHub.",
      monetizationReadiness:
        "la preparación para monetización no está marcada como lista.",
      needsReview: "Necesita revisión",
      noFindings:
        "Sin hallazgos para las comprobaciones de política seleccionadas.",
      ready: "Listo",
      secretsPosture:
        "la gestión de secretos necesita confirmarse antes de la automatización pública.",
      shaPinning:
        "el anclaje por SHA debe revisarse en las acciones del flujo de trabajo y las referencias de terceros.",
      waiting: "Esperando entrada",
    },
  },
  "public-repos-not-automation": {
    name: "Repos Públicos Sin Automatizar",
    desc: "Decide qué tareas recurrentes de repositorios públicos deben seguir siendo manuales por ahora y genera un registro de decisión de no automatizar.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: cerrar automáticamente issues públicos obsoletos por demanda recurrente de Kanban\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Solo en el navegador",
      badge1: "Gestión manual",
      button0: "Ejemplo",
      button1: "Crear registro de decisión",
      button2: "Limpiar",
      button3: "Copiar",
      desc0:
        "Usa un par key:value por línea para repo, task, owner, cadence, risk, next-review y notes. También se admiten arrays JSON de repositorios públicos de GitHub y texto plano.",
      desc1:
        "Diseñado para trabajo en repositorios públicos con demanda recurrente en Kanban que aún requiere gestión manual y criterio humano. Pega arrays JSON de repositorios públicos de GitHub para partir de los metadatos del repositorio.",
      heading0: "Razones para no automatizar",
      heading1: "Registro de decisión",
      heading2: "Lista de comprobación",
      label0: "Tarea del repositorio",
      label1: "Responsable de la decisión",
      label2: "Periodo de revisión",
      label3: "Evidencia necesaria antes de automatizar",
      option0: "30 días",
      option1: "60 días",
      option2: "90 días",
      option3: "Próxima versión",
      placeholder1:
        "p. ej., política escrita, responsable de reversión, registro de auditoría, evidencia de simulacro y 3 ejecuciones manuales repetidas.",
      placeholder2: "Aquí aparecerá el registro de decisión de no automatizar.",
      placeholder3:
        "Aquí aparecerá la lista de comprobación de gestión manual.",
    },
    js: {
      copied: "Copiado",
      copyFailed:
        "Error al copiar. Selecciona la salida y cópiala manualmente.",
      manual: "Manual",
      missingReasons:
        "Selecciona al menos una razón para no automatizar todavía.",
      missingRepos: "Pega al menos un repositorio público de GitHub válido.",
      missingTask:
        "Añade una tarea del repositorio antes de crear el registro de decisión.",
      needsReason: "Falta una razón",
      reasonFrequency: "Baja frecuencia o demanda débil",
      reasonObservability: "Falta de observabilidad",
      reasonOwner: "Responsable o vía de aprobación poco clara",
      reasonPolicy: "Límite de política ambiguo",
      reasonSafety: "Riesgo de seguridad o reputación",
    },
  },
  "review-description-generator": {
    name: "Generador de Descripciones de Revisión",
    desc: "Genera descripciones estructuradas de revisiones y comentarios de PR a partir de commits, diffs o notas.",
    ui: {
      badge0: "Solo en el navegador",
      badge1: "6 plantillas",
      button0: "Generar",
      button1: "Copiar",
      button2: "Limpiar",
      heading0: "Cómo funciona",
      label0: "Plantilla de revisión",
      label1: "Descripción generada",
      option0: "Actualización de dependencia",
      option1: "Corrección de error",
      option2: "Nueva funcionalidad",
      option3: "Refactorización / limpieza",
      option4: "Cambio de CI / pipeline",
      option5: "Personalizada",
      text0:
        "Elige una plantilla que coincida con tu tipo de revisión (actualización de dependencia, corrección de error, funcionalidad, etc.).",
      text1:
        "Rellena los campos de contexto: la herramienta ofrece valores por defecto y orientación para cada plantilla.",
      text2:
        "Haz clic en Generar para producir una descripción estructurada en formato Markdown, lista para tu PR o comentario de revisión.",
      text3:
        "Todo el procesamiento es local: tus datos no se envían a nuestros servidores.",
    },
  },
};

const zhCN = {
  "http-status-reference": {
    name: "HTTP 状态码参考",
    desc: "可搜索的标准 HTTP 状态码参考，附带用途与缓存指南。",
    ui: {
      badge0: "RFC 9110",
      badge1: "可搜索",
      badge2: "仅在浏览器中处理",
      button0: "清除",
      button1: "全部",
      button2: "1xx 信息",
      button3: "2xx 成功",
      button4: "3xx 重定向",
      button5: "4xx 客户端错误",
      button6: "5xx 服务器错误",
      desc0: "可按状态码、短语、类别、描述或使用场景指南搜索。",
      heading0: "搜索 HTTP 状态码",
      heading1: "状态码",
      label0: "状态码搜索",
      placeholder0: "例如：404、重定向、可缓存、限流",
      stat0: "状态码总数",
      stat1: "匹配结果",
      stat2: "状态类别",
      stat3: "默认可缓存",
      status0: "正在显示全部 HTTP 状态码。",
      status1: "没有符合当前搜索条件和类别筛选的 HTTP 状态码。",
      th0: "类别",
      th1: "含义",
      th2: "常见用途",
    },
    cheatsheet: {
      title: "HTTP 状态码指南",
      h0: "类别含义",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">类别</th><th data-i18n=\"tools.http-status-reference.ui.th1\">含义</th><th data-i18n=\"tools.http-status-reference.ui.th2\">典型用途</th></tr>\n            <tr><td><code>1xx</code></td><td>信息</td><td>请求继续处理期间的临时响应。</td></tr>\n            <tr><td><code>2xx</code></td><td>成功</td><td>请求已被接收、理解并接受。</td></tr>\n            <tr><td><code>3xx</code></td><td>重定向</td><td>客户端需要发起另一个请求或使用缓存的表示。</td></tr>\n            <tr><td><code>4xx</code></td><td>客户端错误</td><td>请求存在客户端问题或无法被满足。</td></tr>\n            <tr><td><code>5xx</code></td><td>服务器错误</td><td>服务器未能完成一个看似有效的请求。</td></tr>\n          </table>",
      h1: "安全性、幂等性与缓存",
      c1: "\n          <p>状态码本身并不能使请求变得安全或幂等。安全性和幂等性来自请求方法和应用语义。</p>\n          <p>RFC 缓存规则允许默认重用某些响应，包括以下常见状态码：<code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>。其他状态码通常需要显式的缓存标头。</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "公开仓库 YAML 构建器",
    desc: "为公开仓库自动化生成并校验 repos.yml 清单。",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "仅在浏览器中处理",
      badge1: "看板自动化",
      button0: "示例",
      button1: "生成 YAML",
      button2: "清除",
      button3: "复制",
      desc0:
        "每行填写一个仓库。可在 slug 后以 key=value 形式添加元数据，例如 team=platform cadence=weekly sha=ok。",
      desc1:
        "支持的元数据：team、cadence、topic、sha、branch、secrets、monetization、notes。",
      desc2: "粘贴仓库并生成 YAML，以校验重复出现的自动化策略需求。",
      heading0: "清单默认值",
      heading1: "repos.yml",
      heading2: "GitHub Actions 审计",
      heading3: "策略检查结果",
      label0: "仓库 slug 或 URL",
      label1: "所有者",
      label2: "默认周期",
      option0: "每周",
      option1: "每两周",
      option2: "每月",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "等待输入",
    },
    js: {
      branchProtection: "分支保护未标记为已启用。",
      copied: "已复制",
      invalidJson: "无法解析 GitHub 公开仓库的 JSON 数组。",
      invalidJsonRepo: "无法将 GitHub API 对象映射为仓库 slug 或 URL。",
      invalidRepo: "无法解析仓库 slug 或 GitHub URL。",
      monetizationReadiness: "变现准备情况未标记为就绪。",
      needsReview: "需要复核",
      noFindings: "所选策略检查未发现问题。",
      ready: "就绪",
      secretsPosture: "在公开自动化之前需要确认密钥管理状况。",
      shaPinning: "工作流 Action 与第三方引用的 SHA 固定需要复核。",
      waiting: "等待输入",
    },
  },
  "public-repos-not-automation": {
    name: "公开仓库暂不自动化决策",
    desc: "判断哪些重复性的公开仓库工作目前应保持人工处理，并生成暂不自动化的决策记录。",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: 根据周期性看板需求自动关闭过期的公开 issue\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "仅在浏览器中处理",
      badge1: "人工维护",
      button0: "示例",
      button1: "生成决策记录",
      button2: "清除",
      button3: "复制",
      desc0:
        "每行以 key:value 形式填写 repo、task、owner、cadence、risk、next-review 和 notes。也支持 GitHub 公开仓库 JSON 数组和纯文本。",
      desc1:
        "适用于在看板中有重复需求、但仍需人工维护与人为判断的公开仓库工作。粘贴 GitHub 公开仓库 JSON 数组即可从仓库元数据开始。",
      heading0: "暂不自动化的原因",
      heading1: "决策记录",
      heading2: "检查清单",
      label0: "仓库工作项",
      label1: "决策负责人",
      label2: "复审周期",
      label3: "自动化前需要的依据",
      option0: "30 天",
      option1: "60 天",
      option2: "90 天",
      option3: "下个版本",
      placeholder1:
        "例如：书面策略、回滚负责人、审计日志、试运行结果，以及 3 次以上的人工执行记录。",
      placeholder2: "暂不自动化的决策记录将显示在这里。",
      placeholder3: "人工维护检查清单将显示在这里。",
    },
    js: {
      copied: "已复制",
      copyFailed: "复制失败。请选中输出内容手动复制。",
      manual: "人工",
      missingReasons: "请至少选择一个暂不自动化的原因。",
      missingRepos: "请至少粘贴一个有效的 GitHub 公开仓库。",
      missingTask: "生成决策记录前请先填写仓库工作项。",
      needsReason: "需填写原因",
      reasonFrequency: "频率低或需求不足",
      reasonObservability: "缺少可观测性",
      reasonOwner: "负责人或审批路径不明确",
      reasonPolicy: "策略边界模糊",
      reasonSafety: "安全或声誉风险",
    },
  },
  "review-description-generator": {
    name: "评审说明生成器",
    desc: "从提交、差异或笔记生成结构化的 PR 评审与评论说明。",
    ui: {
      badge0: "仅在浏览器中处理",
      badge1: "6 种模板",
      button0: "生成",
      button1: "复制",
      button2: "清除",
      heading0: "使用方法",
      label0: "评审模板",
      label1: "生成的说明",
      option0: "依赖升级",
      option1: "缺陷修复",
      option2: "新增功能",
      option3: "重构 / 清理",
      option4: "CI / 流水线变更",
      option5: "自定义",
      text0: "选择与评审类型匹配的模板（依赖升级、缺陷修复、新增功能等）。",
      text1: "填写上下文字段——每个模板都提供了合理的默认值和说明。",
      text2:
        "点击生成即可得到结构化的 Markdown 说明，可直接用于 PR 或评审评论。",
      text3: "所有处理都在本地完成——你的数据不会发送到我们的服务器。",
    },
  },
};

const zhTW = {
  "http-status-reference": {
    name: "HTTP 狀態碼參考",
    desc: "可搜尋的標準 HTTP 狀態碼參考，附上用途與快取指引。",
    ui: {
      badge0: "RFC 9110",
      badge1: "可搜尋",
      badge2: "僅在瀏覽器中處理",
      button0: "清除",
      button1: "全部",
      button2: "1xx 資訊",
      button3: "2xx 成功",
      button4: "3xx 重新導向",
      button5: "4xx 用戶端錯誤",
      button6: "5xx 伺服器錯誤",
      desc0: "可依狀態碼、片語、類別、描述或使用時機指引搜尋。",
      heading0: "搜尋 HTTP 狀態碼",
      heading1: "狀態碼",
      label0: "狀態碼搜尋",
      placeholder0: "例如：404、重新導向、可快取、速率限制",
      stat0: "狀態碼總數",
      stat1: "符合的結果",
      stat2: "狀態類別",
      stat3: "預設可快取",
      status0: "正在顯示所有 HTTP 狀態碼。",
      status1: "沒有符合目前搜尋條件與類別篩選的 HTTP 狀態碼。",
      th0: "類別",
      th1: "意義",
      th2: "常見用途",
    },
    cheatsheet: {
      title: "HTTP 狀態碼指南",
      h0: "類別含義",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">類別</th><th data-i18n=\"tools.http-status-reference.ui.th1\">含義</th><th data-i18n=\"tools.http-status-reference.ui.th2\">典型用途</th></tr>\n            <tr><td><code>1xx</code></td><td>資訊</td><td>請求繼續處理期間的暫時回應。</td></tr>\n            <tr><td><code>2xx</code></td><td>成功</td><td>請求已被接收、理解並接受。</td></tr>\n            <tr><td><code>3xx</code></td><td>重新導向</td><td>用戶端需要發出另一個請求或使用快取的表示。</td></tr>\n            <tr><td><code>4xx</code></td><td>用戶端錯誤</td><td>請求存在用戶端問題或無法被滿足。</td></tr>\n            <tr><td><code>5xx</code></td><td>伺服器錯誤</td><td>伺服器未能完成一個看似有效的請求。</td></tr>\n          </table>",
      h1: "安全性、冪等性與快取",
      c1: "\n          <p>狀態碼本身並不能使請求變得安全或冪等。安全性與冪等性來自請求方法與應用語意。</p>\n          <p>RFC 快取規則允許預設重用某些回應，包括以下常見狀態碼：<code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>。其他狀態碼通常需要明確的快取標頭。</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "公開儲存庫 YAML 建構器",
    desc: "為公開儲存庫自動化產生並驗證 repos.yml 清單。",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "僅在瀏覽器中處理",
      badge1: "看板自動化",
      button0: "範例",
      button1: "產生 YAML",
      button2: "清除",
      button3: "複製",
      desc0:
        "每行填寫一個儲存庫。可在 slug 後以 key=value 形式加入中繼資料，例如 team=platform cadence=weekly sha=ok。",
      desc1:
        "支援的中繼資料：team、cadence、topic、sha、branch、secrets、monetization、notes。",
      desc2: "貼上儲存庫並產生 YAML，以驗證重複出現的自動化政策需求。",
      heading0: "清單預設值",
      heading1: "repos.yml",
      heading2: "GitHub Actions 稽核",
      heading3: "政策檢查結果",
      label0: "儲存庫 slug 或 URL",
      label1: "擁有者",
      label2: "預設週期",
      option0: "每週",
      option1: "每兩週",
      option2: "每月",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "等待輸入",
    },
    js: {
      branchProtection: "分支保護未標記為已啟用。",
      copied: "已複製",
      invalidJson: "無法解析 GitHub 公開儲存庫的 JSON 陣列。",
      invalidJsonRepo: "無法將 GitHub API 物件對應到儲存庫 slug 或 URL。",
      invalidRepo: "無法解析儲存庫 slug 或 GitHub URL。",
      monetizationReadiness: "營利準備狀態未標記為就緒。",
      needsReview: "需要複查",
      noFindings: "所選政策檢查未發現問題。",
      ready: "就緒",
      secretsPosture: "在公開自動化之前需要確認密鑰管理狀態。",
      shaPinning: "工作流程 Action 與第三方參考的 SHA 固定需要複查。",
      waiting: "等待輸入",
    },
  },
  "public-repos-not-automation": {
    name: "公開儲存庫暫不自動化決策",
    desc: "判斷哪些重複性的公開儲存庫工作目前應維持人工處理，並產生暫不自動化的決策記錄。",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: 根據週期性看板需求自動關閉過期的公開 issue\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "僅在瀏覽器中處理",
      badge1: "人工維護",
      button0: "範例",
      button1: "產生決策記錄",
      button2: "清除",
      button3: "複製",
      desc0:
        "每行以 key:value 形式填寫 repo、task、owner、cadence、risk、next-review 與 notes。也支援 GitHub 公開儲存庫 JSON 陣列與純文字。",
      desc1:
        "適用於在看板上有重複需求、但仍需人工維護與人為判斷的公開儲存庫工作。貼上 GitHub 公開儲存庫 JSON 陣列即可從儲存庫中繼資料開始。",
      heading0: "暫不自動化的原因",
      heading1: "決策記錄",
      heading2: "檢查清單",
      label0: "儲存庫工作項目",
      label1: "決策負責人",
      label2: "複審週期",
      label3: "自動化前需要的佐證",
      option0: "30 天",
      option1: "60 天",
      option2: "90 天",
      option3: "下個版本",
      placeholder1:
        "例如：書面政策、回復負責人、稽核紀錄、試運行結果，以及 3 次以上的人工執行紀錄。",
      placeholder2: "暫不自動化的決策記錄將顯示在這裡。",
      placeholder3: "人工維護檢查清單將顯示在這裡。",
    },
    js: {
      copied: "已複製",
      copyFailed: "複製失敗。請選取輸出內容手動複製。",
      manual: "人工",
      missingReasons: "請至少選擇一個暫不自動化的原因。",
      missingRepos: "請至少貼上一個有效的 GitHub 公開儲存庫。",
      missingTask: "產生決策記錄前請先填寫儲存庫工作項目。",
      needsReason: "需填寫原因",
      reasonFrequency: "頻率低或需求不足",
      reasonObservability: "缺少可觀測性",
      reasonOwner: "負責人或核准路徑不明確",
      reasonPolicy: "政策界線模糊",
      reasonSafety: "安全或聲譽風險",
    },
  },
  "review-description-generator": {
    name: "審查說明產生器",
    desc: "從提交、差異或筆記產生結構化的 PR 審查與留言說明。",
    ui: {
      badge0: "僅在瀏覽器中處理",
      badge1: "6 種範本",
      button0: "產生",
      button1: "複製",
      button2: "清除",
      heading0: "使用方式",
      label0: "審查範本",
      label1: "產生的說明",
      option0: "相依套件更新",
      option1: "錯誤修正",
      option2: "新增功能",
      option3: "重構 / 整理",
      option4: "CI / 管線變更",
      option5: "自訂",
      text0: "選擇符合審查類型的範本（相依套件更新、錯誤修正、新增功能等）。",
      text1: "填寫情境欄位——每個範本都提供合理的預設值與指引。",
      text2:
        "點擊產生即可得到結構化的 Markdown 說明，可直接用於 PR 或審查留言。",
      text3: "所有處理都在本機完成——你的資料不會傳送到我們的伺服器。",
    },
  },
};

const fr = {
  "http-status-reference": {
    name: "Référence des Statuts HTTP",
    desc: "Référence consultable des codes de statut HTTP standards, avec conseils d'usage et de mise en cache.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Consultable",
      badge2: "Uniquement dans le navigateur",
      button0: "Effacer",
      button1: "Tous",
      button2: "1xx Information",
      button3: "2xx Succès",
      button4: "3xx Redirection",
      button5: "4xx Erreur client",
      button6: "5xx Erreur serveur",
      desc0:
        "Recherchez par code, expression, classe, description ou conseils d'utilisation.",
      heading0: "Rechercher des statuts HTTP",
      heading1: "Codes de statut",
      label0: "Recherche de code de statut",
      placeholder0: "p. ex. 404, redirection, cacheable, limite de débit",
      stat0: "Statuts au total",
      stat1: "Résultats correspondants",
      stat2: "Classes de statut",
      stat3: "Cacheable par défaut",
      status0: "Affichage de tous les codes de statut HTTP.",
      status1:
        "Aucun code de statut HTTP ne correspond à la recherche et au filtre de classe actuels.",
      th0: "Classe",
      th1: "Signification",
      th2: "Usage courant",
    },
    cheatsheet: {
      title: "Guide des codes de statut HTTP",
      h0: "Signification des classes",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Classe</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Signification</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Usage typique</th></tr>\n            <tr><td><code>1xx</code></td><td>Information</td><td>Réponses provisoires pendant qu'une requête se poursuit.</td></tr>\n            <tr><td><code>2xx</code></td><td>Succès</td><td>La requête a été reçue, comprise et acceptée.</td></tr>\n            <tr><td><code>3xx</code></td><td>Redirection</td><td>Le client doit envoyer une autre requête ou utiliser une représentation en cache.</td></tr>\n            <tr><td><code>4xx</code></td><td>Erreur client</td><td>La requête présente un problème côté client ou ne peut pas être satisfaite.</td></tr>\n            <tr><td><code>5xx</code></td><td>Erreur serveur</td><td>Le serveur n'a pas pu satisfaire une requête apparemment valide.</td></tr>\n          </table>",
      h1: "Sûreté, idempotence et mise en cache",
      c1: "\n          <p>Les codes de statut ne rendent pas à eux seuls une requête sûre ou idempotente. La sûreté et l'idempotence découlent de la méthode de requête et de la sémantique applicative.</p>\n          <p>Les règles de mise en cache des RFC permettent de réutiliser certaines réponses par défaut, y compris des statuts courants tels que <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. Les autres statuts nécessitent généralement des en-têtes de cache explicites.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "Générateur YAML de Dépôts Publics",
    desc: "Générez et validez des inventaires repos.yml pour l'automatisation des dépôts publics.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Uniquement dans le navigateur",
      badge1: "Automatisation Kanban",
      button0: "Exemple",
      button1: "Générer le YAML",
      button2: "Effacer",
      button3: "Copier",
      desc0:
        "Un dépôt par ligne. Ajoutez des métadonnées sous forme de paires key=value après le slug, par exemple team=platform cadence=weekly sha=ok.",
      desc1:
        "Métadonnées acceptées : team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Collez les dépôts et générez le YAML pour valider les besoins récurrents de la politique d'automatisation.",
      heading0: "Valeurs par défaut de l'inventaire",
      heading1: "repos.yml",
      heading2: "Audit GitHub Actions",
      heading3: "Constats de politique",
      label0: "Slugs ou URL de dépôts",
      label1: "Propriétaire",
      label2: "Cadence par défaut",
      option0: "Hebdomadaire",
      option1: "Bimensuelle",
      option2: "Mensuelle",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "En attente de saisie",
    },
    js: {
      branchProtection:
        "la protection de branche n'est pas marquée comme protégée.",
      copied: "Copié",
      invalidJson:
        "Impossible d'analyser le tableau JSON des dépôts publics GitHub.",
      invalidJsonRepo:
        "Impossible d'associer l'objet de l'API GitHub à un slug ou une URL de dépôt.",
      invalidRepo: "Impossible d'analyser le slug du dépôt ou l'URL GitHub.",
      monetizationReadiness:
        "la préparation à la monétisation n'est pas marquée comme prête.",
      needsReview: "À revoir",
      noFindings: "Aucun constat pour les contrôles de politique sélectionnés.",
      ready: "Prêt",
      secretsPosture:
        "la gestion des secrets doit être confirmée avant toute automatisation publique.",
      shaPinning:
        "l'épinglage par SHA doit être revu pour les actions du workflow et les références tierces.",
      waiting: "En attente de saisie",
    },
  },
  "public-repos-not-automation": {
    name: "Dépôts Publics à Ne Pas Automatiser",
    desc: "Décidez quelles tâches récurrentes de dépôts publics doivent rester manuelles pour l'instant et générez un registre de décision de non-automatisation.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: fermer automatiquement les issues publiques obsolètes issues d'une demande Kanban récurrente\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Uniquement dans le navigateur",
      badge1: "Gestion manuelle",
      button0: "Exemple",
      button1: "Créer le registre de décision",
      button2: "Effacer",
      button3: "Copier",
      desc0:
        "Une paire key:value par ligne pour repo, task, owner, cadence, risk, next-review et notes. Les tableaux JSON de dépôts publics GitHub et le texte brut sont aussi acceptés.",
      desc1:
        "Conçu pour le travail sur dépôts publics avec une demande récurrente en Kanban mais qui nécessite encore une gestion manuelle et un jugement humain. Collez des tableaux JSON de dépôts publics GitHub pour partir des métadonnées du dépôt.",
      heading0: "Raisons de ne pas automatiser",
      heading1: "Registre de décision",
      heading2: "Liste de contrôle",
      label0: "Tâche du dépôt",
      label1: "Responsable de la décision",
      label2: "Fenêtre de révision",
      label3: "Preuves nécessaires avant l'automatisation",
      option0: "30 jours",
      option1: "60 jours",
      option2: "90 jours",
      option3: "Prochaine version",
      placeholder1:
        "p. ex. politique écrite, responsable du retour arrière, journal d'audit, résultat d'essai à blanc et 3 exécutions manuelles répétées.",
      placeholder2:
        "Le registre de décision de non-automatisation apparaîtra ici.",
      placeholder3: "La liste de contrôle de gestion manuelle apparaîtra ici.",
    },
    js: {
      copied: "Copié",
      copyFailed:
        "Échec de la copie. Sélectionnez la sortie et copiez-la manuellement.",
      manual: "Manuel",
      missingReasons:
        "Sélectionnez au moins une raison de ne pas automatiser pour l'instant.",
      missingRepos: "Collez au moins un dépôt public GitHub valide.",
      missingTask:
        "Ajoutez une tâche de dépôt avant de créer le registre de décision.",
      needsReason: "Raison requise",
      reasonFrequency: "Faible fréquence ou demande limitée",
      reasonObservability: "Observabilité insuffisante",
      reasonOwner: "Responsable ou circuit d'approbation flou",
      reasonPolicy: "Limite de politique ambiguë",
      reasonSafety: "Risque de sécurité ou de réputation",
    },
  },
  "review-description-generator": {
    name: "Générateur de Descriptions de Revue",
    desc: "Générez des descriptions structurées de revues et de commentaires de PR à partir de commits, de diffs ou de notes.",
    ui: {
      badge0: "Uniquement dans le navigateur",
      badge1: "6 modèles",
      button0: "Générer",
      button1: "Copier",
      button2: "Effacer",
      heading0: "Comment ça marche",
      label0: "Modèle de revue",
      label1: "Description générée",
      option0: "Mise à jour de dépendance",
      option1: "Correction de bug",
      option2: "Ajout de fonctionnalité",
      option3: "Refactorisation / nettoyage",
      option4: "Changement CI / pipeline",
      option5: "Personnalisé",
      text0:
        "Choisissez un modèle correspondant à votre type de revue (mise à jour de dépendance, correction de bug, fonctionnalité, etc.).",
      text1:
        "Remplissez les champs de contexte — l'outil fournit des valeurs par défaut pertinentes et des conseils pour chaque modèle.",
      text2:
        "Cliquez sur Générer pour produire une description structurée au format Markdown, prête pour votre PR ou votre commentaire de revue.",
      text3:
        "Tout le traitement est local — vos données ne sont pas envoyées à nos serveurs.",
    },
  },
};

const de = {
  "http-status-reference": {
    name: "HTTP-Status-Referenz",
    desc: "Durchsuchbare Referenz der HTTP-Standardstatuscodes mit Hinweisen zu Verwendung und Caching.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Durchsuchbar",
      badge2: "Nur im Browser",
      button0: "Zurücksetzen",
      button1: "Alle",
      button2: "1xx Information",
      button3: "2xx Erfolg",
      button4: "3xx Weiterleitung",
      button5: "4xx Client-Fehler",
      button6: "5xx Server-Fehler",
      desc0:
        "Suche nach Code, Begriff, Klasse, Beschreibung oder Einsatzhinweisen.",
      heading0: "HTTP-Status suchen",
      heading1: "Statuscodes",
      label0: "Statuscode-Suche",
      placeholder0: "z. B. 404, Weiterleitung, cachebar, Ratenbegrenzung",
      stat0: "Statuscodes gesamt",
      stat1: "Passende Ergebnisse",
      stat2: "Statusklassen",
      stat3: "Standardmäßig cachebar",
      status0: "Es werden alle HTTP-Statuscodes angezeigt.",
      status1:
        "Keine HTTP-Statuscodes entsprechen der aktuellen Suche und dem Klassenfilter.",
      th0: "Klasse",
      th1: "Bedeutung",
      th2: "Typische Verwendung",
    },
    cheatsheet: {
      title: "Leitfaden für HTTP-Statuscodes",
      h0: "Bedeutung der Klassen",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Klasse</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Bedeutung</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Typische Verwendung</th></tr>\n            <tr><td><code>1xx</code></td><td>Information</td><td>Vorläufige Antworten, während eine Anfrage fortgesetzt wird.</td></tr>\n            <tr><td><code>2xx</code></td><td>Erfolg</td><td>Die Anfrage wurde empfangen, verstanden und akzeptiert.</td></tr>\n            <tr><td><code>3xx</code></td><td>Umleitung</td><td>Der Client benötigt eine weitere Anfrage oder eine zwischengespeicherte Repräsentation.</td></tr>\n            <tr><td><code>4xx</code></td><td>Client-Fehler</td><td>Die Anfrage hat ein clientseitiges Problem oder kann nicht erfüllt werden.</td></tr>\n            <tr><td><code>5xx</code></td><td>Server-Fehler</td><td>Der Server konnte eine scheinbar gültige Anfrage nicht erfüllen.</td></tr>\n          </table>",
      h1: "Sicherheit, Idempotenz und Caching",
      c1: "\n          <p>Statuscodes allein machen eine Anfrage weder sicher noch idempotent. Sicherheit und Idempotenz ergeben sich aus der Anfragemethode und der Anwendungssemantik.</p>\n          <p>Die Caching-Regeln der RFCs erlauben die standardmäßige Wiederverwendung einiger Antworten, darunter gängige Status wie <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. Andere Status benötigen in der Regel explizite Cache-Header.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "YAML-Builder für öffentliche Repositorys",
    desc: "Erstellt und prüft repos.yml-Inventare für die Automatisierung öffentlicher Repositorys.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Nur im Browser",
      badge1: "Kanban-Automatisierung",
      button0: "Beispiel",
      button1: "YAML erstellen",
      button2: "Zurücksetzen",
      button3: "Kopieren",
      desc0:
        "Ein Repository pro Zeile. Metadaten als key=value-Paare nach dem Slug ergänzen, zum Beispiel team=platform cadence=weekly sha=ok.",
      desc1:
        "Unterstützte Metadaten: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Repositorys einfügen und YAML erzeugen, um wiederkehrende Anforderungen der Automatisierungsrichtlinie zu prüfen.",
      heading0: "Inventar-Standardwerte",
      heading1: "repos.yml",
      heading2: "GitHub-Actions-Audit",
      heading3: "Richtlinienbefunde",
      label0: "Repository-Slugs oder URLs",
      label1: "Eigentümer",
      label2: "Standardintervall",
      option0: "Wöchentlich",
      option1: "Zweiwöchentlich",
      option2: "Monatlich",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "Warte auf Eingabe",
    },
    js: {
      branchProtection: "Branch-Schutz ist nicht als geschützt markiert.",
      copied: "Kopiert",
      invalidJson:
        "Das JSON-Array der öffentlichen GitHub-Repositorys konnte nicht gelesen werden.",
      invalidJsonRepo:
        "Das GitHub-API-Objekt konnte keinem Repository-Slug oder keiner URL zugeordnet werden.",
      invalidRepo:
        "Repository-Slug oder GitHub-URL konnte nicht gelesen werden.",
      monetizationReadiness:
        "Die Monetarisierungsbereitschaft ist nicht als bereit markiert.",
      needsReview: "Prüfung nötig",
      noFindings: "Keine Befunde für die ausgewählten Richtlinienprüfungen.",
      ready: "Bereit",
      secretsPosture:
        "Der Umgang mit Secrets muss vor der öffentlichen Automatisierung bestätigt werden.",
      shaPinning:
        "Die SHA-Fixierung von Workflow-Actions und Drittanbieter-Referenzen muss geprüft werden.",
      waiting: "Warte auf Eingabe",
    },
  },
  "public-repos-not-automation": {
    name: "Öffentliche Repositorys ohne Automatisierung",
    desc: "Entscheiden Sie, welche wiederkehrenden Aufgaben in öffentlichen Repositorys vorerst manuell bleiben, und erzeugen Sie einen Beschluss gegen die Automatisierung.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: veraltete öffentliche Issues aus wiederkehrendem Kanban-Bedarf automatisch schließen\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Nur im Browser",
      badge1: "Manuelle Betreuung",
      button0: "Beispiel",
      button1: "Beschluss erstellen",
      button2: "Zurücksetzen",
      button3: "Kopieren",
      desc0:
        "Ein key:value-Paar pro Zeile für repo, task, owner, cadence, risk, next-review und notes. JSON-Arrays öffentlicher GitHub-Repositorys und einfacher Text werden ebenfalls akzeptiert.",
      desc1:
        "Gedacht für Arbeit an öffentlichen Repositorys mit wiederkehrendem Kanban-Bedarf, die dennoch manuelle Betreuung und menschliches Urteil erfordert. Fügen Sie JSON-Arrays öffentlicher GitHub-Repositorys ein, um mit den Repository-Metadaten zu starten.",
      heading0: "Gründe gegen eine Automatisierung",
      heading1: "Beschluss",
      heading2: "Checkliste",
      label0: "Repository-Aufgabe",
      label1: "Verantwortlich für den Beschluss",
      label2: "Prüfintervall",
      label3: "Nachweise vor einer Automatisierung",
      option0: "30 Tage",
      option1: "60 Tage",
      option2: "90 Tage",
      option3: "Nächstes Release",
      placeholder1:
        "z. B. schriftliche Richtlinie, Rollback-Verantwortliche, Audit-Log, Testlaufergebnis und 3 wiederholte manuelle Ausführungen.",
      placeholder2: "Der Beschluss gegen die Automatisierung erscheint hier.",
      placeholder3: "Die Checkliste zur manuellen Betreuung erscheint hier.",
    },
    js: {
      copied: "Kopiert",
      copyFailed:
        "Kopieren fehlgeschlagen. Markieren Sie die Ausgabe und kopieren Sie sie manuell.",
      manual: "Manuell",
      missingReasons:
        "Wählen Sie mindestens einen Grund, vorerst nicht zu automatisieren.",
      missingRepos:
        "Fügen Sie mindestens ein gültiges öffentliches GitHub-Repository ein.",
      missingTask:
        "Ergänzen Sie eine Repository-Aufgabe, bevor Sie den Beschluss erstellen.",
      needsReason: "Grund erforderlich",
      reasonFrequency: "Geringe Häufigkeit oder schwacher Bedarf",
      reasonObservability: "Fehlende Beobachtbarkeit",
      reasonOwner: "Unklare Verantwortung oder Freigabe",
      reasonPolicy: "Unklare Richtliniengrenze",
      reasonSafety: "Sicherheits- oder Reputationsrisiko",
    },
  },
  "review-description-generator": {
    name: "Generator für Review-Beschreibungen",
    desc: "Erzeugt strukturierte PR-Review- und Kommentarbeschreibungen aus Commits, Diffs oder Notizen.",
    ui: {
      badge0: "Nur im Browser",
      badge1: "6 Vorlagen",
      button0: "Erzeugen",
      button1: "Kopieren",
      button2: "Zurücksetzen",
      heading0: "So funktioniert es",
      label0: "Review-Vorlage",
      label1: "Erzeugte Beschreibung",
      option0: "Abhängigkeits-Update",
      option1: "Fehlerbehebung",
      option2: "Neue Funktion",
      option3: "Refactoring / Aufräumen",
      option4: "CI-/Pipeline-Änderung",
      option5: "Benutzerdefiniert",
      text0:
        "Wählen Sie eine Vorlage, die zu Ihrem Review-Typ passt (Abhängigkeits-Update, Fehlerbehebung, Funktion usw.).",
      text1:
        "Füllen Sie die Kontextfelder aus — das Tool liefert sinnvolle Standardwerte und Hinweise für jede Vorlage.",
      text2:
        "Klicken Sie auf Erzeugen, um eine strukturierte Beschreibung im Markdown-Format für Ihren PR oder Review-Kommentar zu erhalten.",
      text3:
        "Die gesamte Verarbeitung erfolgt lokal — Ihre Daten werden nicht an unsere Server gesendet.",
    },
  },
};

const pt = {
  "http-status-reference": {
    name: "Referência de Status HTTP",
    desc: "Referência pesquisável dos códigos de status HTTP padrão, com orientações de uso e cache.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Pesquisável",
      badge2: "Apenas no navegador",
      button0: "Limpar",
      button1: "Todos",
      button2: "1xx Informativo",
      button3: "2xx Sucesso",
      button4: "3xx Redirecionamento",
      button5: "4xx Erro do cliente",
      button6: "5xx Erro do servidor",
      desc0:
        "Pesquise por código, expressão, classe, descrição ou orientação de uso.",
      heading0: "Pesquisar status HTTP",
      heading1: "Códigos de status",
      label0: "Busca de código de status",
      placeholder0:
        "ex.: 404, redirecionamento, cacheável, limite de requisições",
      stat0: "Total de status",
      stat1: "Resultados correspondentes",
      stat2: "Classes de status",
      stat3: "Cacheável por padrão",
      status0: "Exibindo todos os códigos de status HTTP.",
      status1:
        "Nenhum código de status HTTP corresponde à busca e ao filtro de classe atuais.",
      th0: "Classe",
      th1: "Significado",
      th2: "Uso típico",
    },
    cheatsheet: {
      title: "Guia de códigos de status HTTP",
      h0: "Significado das classes",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Classe</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Significado</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Uso típico</th></tr>\n            <tr><td><code>1xx</code></td><td>Informativo</td><td>Respostas provisórias enquanto uma requisição continua.</td></tr>\n            <tr><td><code>2xx</code></td><td>Sucesso</td><td>A requisição foi recebida, compreendida e aceita.</td></tr>\n            <tr><td><code>3xx</code></td><td>Redirecionamento</td><td>O cliente precisa de outra requisição ou de uma representação em cache.</td></tr>\n            <tr><td><code>4xx</code></td><td>Erro do cliente</td><td>A requisição tem um problema do lado do cliente ou não pode ser atendida.</td></tr>\n            <tr><td><code>5xx</code></td><td>Erro do servidor</td><td>O servidor não conseguiu atender a uma requisição aparentemente válida.</td></tr>\n          </table>",
      h1: "Segurança, idempotência e cache",
      c1: "\n          <p>Os códigos de status por si só não tornam uma requisição segura ou idempotente. A segurança e a idempotência vêm do método da requisição e da semântica da aplicação.</p>\n          <p>As regras de cache dos RFCs permitem reutilizar algumas respostas por padrão, incluindo status comuns como <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. Outros status geralmente precisam de cabeçalhos de cache explícitos.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "Construtor de YAML de Repositórios Públicos",
    desc: "Gere e valide inventários repos.yml para a automação de repositórios públicos.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Apenas no navegador",
      badge1: "Automação Kanban",
      button0: "Exemplo",
      button1: "Gerar YAML",
      button2: "Limpar",
      button3: "Copiar",
      desc0:
        "Um repositório por linha. Adicione metadados como pares key=value após o slug, por exemplo team=platform cadence=weekly sha=ok.",
      desc1:
        "Metadados aceitos: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Cole os repositórios e gere o YAML para validar as necessidades recorrentes da política de automação.",
      heading0: "Padrões do inventário",
      heading1: "repos.yml",
      heading2: "Auditoria do GitHub Actions",
      heading3: "Achados de política",
      label0: "Slugs ou URLs de repositórios",
      label1: "Proprietário",
      label2: "Cadência padrão",
      option0: "Semanal",
      option1: "Quinzenal",
      option2: "Mensal",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "Aguardando entrada",
    },
    js: {
      branchProtection: "a proteção de branch não está marcada como protegida.",
      copied: "Copiado",
      invalidJson:
        "Não foi possível analisar o array JSON de repositórios públicos do GitHub.",
      invalidJsonRepo:
        "Não foi possível mapear o objeto da API do GitHub para um slug ou URL de repositório.",
      invalidRepo:
        "Não foi possível analisar o slug do repositório ou a URL do GitHub.",
      monetizationReadiness:
        "a preparação para monetização não está marcada como pronta.",
      needsReview: "Precisa de revisão",
      noFindings:
        "Nenhum achado para as verificações de política selecionadas.",
      ready: "Pronto",
      secretsPosture:
        "a gestão de segredos precisa ser confirmada antes da automação pública.",
      shaPinning:
        "a fixação por SHA precisa de revisão nas actions do fluxo de trabalho e nas referências de terceiros.",
      waiting: "Aguardando entrada",
    },
  },
  "public-repos-not-automation": {
    name: "Repositórios Públicos Sem Automação",
    desc: "Decida quais tarefas recorrentes de repositórios públicos devem permanecer manuais por enquanto e gere um registro de decisão de não automatizar.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: fechar automaticamente issues públicas obsoletas por demanda recorrente do Kanban\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Apenas no navegador",
      badge1: "Gestão manual",
      button0: "Exemplo",
      button1: "Criar registro de decisão",
      button2: "Limpar",
      button3: "Copiar",
      desc0:
        "Um par key:value por linha para repo, task, owner, cadence, risk, next-review e notes. Arrays JSON de repositórios públicos do GitHub e texto simples também são aceitos.",
      desc1:
        "Feito para trabalho em repositórios públicos com demanda recorrente no Kanban que ainda exige gestão manual e julgamento humano. Cole arrays JSON de repositórios públicos do GitHub para começar pelos metadados do repositório.",
      heading0: "Motivos para não automatizar",
      heading1: "Registro de decisão",
      heading2: "Checklist",
      label0: "Tarefa do repositório",
      label1: "Responsável pela decisão",
      label2: "Janela de revisão",
      label3: "Evidências necessárias antes de automatizar",
      option0: "30 dias",
      option1: "60 dias",
      option2: "90 dias",
      option3: "Próxima versão",
      placeholder1:
        "ex.: política escrita, responsável pelo rollback, log de auditoria, evidência de teste simulado e 3 execuções manuais repetidas.",
      placeholder2: "O registro de decisão de não automatizar aparecerá aqui.",
      placeholder3: "A checklist de gestão manual aparecerá aqui.",
    },
    js: {
      copied: "Copiado",
      copyFailed: "Falha ao copiar. Selecione a saída e copie manualmente.",
      manual: "Manual",
      missingReasons:
        "Selecione pelo menos um motivo para ainda não automatizar.",
      missingRepos: "Cole pelo menos um repositório público válido do GitHub.",
      missingTask:
        "Adicione uma tarefa do repositório antes de criar o registro de decisão.",
      needsReason: "Motivo necessário",
      reasonFrequency: "Baixa frequência ou demanda fraca",
      reasonObservability: "Falta de observabilidade",
      reasonOwner: "Responsável ou caminho de aprovação indefinido",
      reasonPolicy: "Limite de política ambíguo",
      reasonSafety: "Risco de segurança ou reputação",
    },
  },
  "review-description-generator": {
    name: "Gerador de Descrições de Revisão",
    desc: "Gere descrições estruturadas de revisões e comentários de PR a partir de commits, diffs ou notas.",
    ui: {
      badge0: "Apenas no navegador",
      badge1: "6 modelos",
      button0: "Gerar",
      button1: "Copiar",
      button2: "Limpar",
      heading0: "Como funciona",
      label0: "Modelo de revisão",
      label1: "Descrição gerada",
      option0: "Atualização de dependência",
      option1: "Correção de bug",
      option2: "Nova funcionalidade",
      option3: "Refatoração / limpeza",
      option4: "Mudança de CI / pipeline",
      option5: "Personalizado",
      text0:
        "Escolha um modelo que corresponda ao seu tipo de revisão (atualização de dependência, correção de bug, funcionalidade etc.).",
      text1:
        "Preencha os campos de contexto — a ferramenta oferece padrões sensatos e orientação para cada modelo.",
      text2:
        "Clique em Gerar para produzir uma descrição estruturada em Markdown, pronta para seu PR ou comentário de revisão.",
      text3:
        "Todo o processamento é local — seus dados não são enviados aos nossos servidores.",
    },
  },
};

const vi = {
  "http-status-reference": {
    name: "Tra Cứu Mã Trạng Thái HTTP",
    desc: "Tra cứu các mã trạng thái HTTP tiêu chuẩn kèm hướng dẫn sử dụng và bộ nhớ đệm.",
    ui: {
      badge0: "RFC 9110",
      badge1: "Có thể tìm kiếm",
      badge2: "Chỉ xử lý trên trình duyệt",
      button0: "Xóa",
      button1: "Tất cả",
      button2: "1xx Thông tin",
      button3: "2xx Thành công",
      button4: "3xx Chuyển hướng",
      button5: "4xx Lỗi phía client",
      button6: "5xx Lỗi máy chủ",
      desc0:
        "Tìm theo mã, cụm từ, nhóm, mô tả hoặc hướng dẫn tình huống sử dụng.",
      heading0: "Tìm mã trạng thái HTTP",
      heading1: "Mã trạng thái",
      label0: "Tìm mã trạng thái",
      placeholder0:
        "ví dụ: 404, chuyển hướng, có thể lưu đệm, giới hạn tần suất",
      stat0: "Tổng số mã trạng thái",
      stat1: "Kết quả phù hợp",
      stat2: "Nhóm trạng thái",
      stat3: "Mặc định lưu đệm được",
      status0: "Đang hiển thị tất cả mã trạng thái HTTP.",
      status1:
        "Không có mã trạng thái HTTP nào khớp với từ khóa và bộ lọc nhóm hiện tại.",
      th0: "Nhóm",
      th1: "Ý nghĩa",
      th2: "Trường hợp dùng phổ biến",
    },
    cheatsheet: {
      title: "Hướng dẫn mã trạng thái HTTP",
      h0: "Ý nghĩa của các lớp",
      c0: "\n          <table>\n            <tr><th data-i18n=\"tools.http-status-reference.ui.th0\">Lớp</th><th data-i18n=\"tools.http-status-reference.ui.th1\">Ý nghĩa</th><th data-i18n=\"tools.http-status-reference.ui.th2\">Cách dùng điển hình</th></tr>\n            <tr><td><code>1xx</code></td><td>Thông tin</td><td>Phản hồi tạm thời trong khi một yêu cầu vẫn đang tiếp tục.</td></tr>\n            <tr><td><code>2xx</code></td><td>Thành công</td><td>Yêu cầu đã được nhận, hiểu và chấp nhận.</td></tr>\n            <tr><td><code>3xx</code></td><td>Chuyển hướng</td><td>Máy khách cần một yêu cầu khác hoặc một biểu diễn đã lưu trong bộ nhớ đệm.</td></tr>\n            <tr><td><code>4xx</code></td><td>Lỗi máy khách</td><td>Yêu cầu có vấn đề phía máy khách hoặc không thể được đáp ứng.</td></tr>\n            <tr><td><code>5xx</code></td><td>Lỗi máy chủ</td><td>Máy chủ không thể đáp ứng một yêu cầu có vẻ hợp lệ.</td></tr>\n          </table>",
      h1: "Tính an toàn, tính bất biến và bộ nhớ đệm",
      c1: "\n          <p>Bản thân mã trạng thái không làm cho một yêu cầu trở nên an toàn hay bất biến. Tính an toàn và tính bất biến đến từ phương thức yêu cầu và ngữ nghĩa của ứng dụng.</p>\n          <p>Các quy tắc bộ nhớ đệm của RFC cho phép tái sử dụng một số phản hồi theo mặc định, bao gồm các trạng thái phổ biến như <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, <code>501</code>. Các trạng thái khác thường cần tiêu đề bộ nhớ đệm rõ ràng.</p>",
    },
  },
  "public-repos-yml-builder": {
    name: "Trình Tạo YAML Cho Kho Mã Công Khai",
    desc: "Tạo và kiểm tra danh mục repos.yml cho việc tự động hóa kho mã công khai.",
    ui: {
      placeholder0: "example-api team=platform cadence=weekly sha=ok branch=protected secrets=ok monetization=ready\nhttps://github.com/example/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo",
      badge0: "Chỉ xử lý trên trình duyệt",
      badge1: "Tự động hóa Kanban",
      button0: "Mẫu",
      button1: "Tạo YAML",
      button2: "Xóa",
      button3: "Sao chép",
      desc0:
        "Mỗi dòng một kho mã. Thêm siêu dữ liệu theo dạng key=value sau slug, ví dụ team=platform cadence=weekly sha=ok.",
      desc1:
        "Siêu dữ liệu được hỗ trợ: team, cadence, topic, sha, branch, secrets, monetization, notes.",
      desc2:
        "Dán danh sách kho mã rồi tạo YAML để kiểm tra các yêu cầu chính sách tự động hóa lặp lại.",
      heading0: "Giá trị mặc định của danh mục",
      heading1: "repos.yml",
      heading2: "Kiểm tra GitHub Actions",
      heading3: "Phát hiện về chính sách",
      label0: "Slug hoặc URL kho mã",
      label1: "Chủ sở hữu",
      label2: "Chu kỳ mặc định",
      option0: "Hàng tuần",
      option1: "Hai tuần một lần",
      option2: "Hàng tháng",
      placeholder1: "repositories: []",
      placeholder2: "name: Public repos audit",
      text0: "Đang chờ nhập liệu",
    },
    js: {
      branchProtection: "bảo vệ nhánh chưa được đánh dấu là đã bật.",
      copied: "Đã sao chép",
      invalidJson: "Không thể phân tích mảng JSON kho mã công khai của GitHub.",
      invalidJsonRepo:
        "Không thể ánh xạ đối tượng GitHub API sang slug hoặc URL kho mã.",
      invalidRepo: "Không thể phân tích slug kho mã hoặc URL GitHub.",
      monetizationReadiness:
        "mức độ sẵn sàng kiếm tiền chưa được đánh dấu là sẵn sàng.",
      needsReview: "Cần xem xét",
      noFindings: "Không có phát hiện nào với các kiểm tra chính sách đã chọn.",
      ready: "Sẵn sàng",
      secretsPosture:
        "cần xác nhận cách quản lý khóa bí mật trước khi tự động hóa công khai.",
      shaPinning:
        "cần rà soát việc ghim theo SHA cho các action trong workflow và tham chiếu bên thứ ba.",
      waiting: "Đang chờ nhập liệu",
    },
  },
  "public-repos-not-automation": {
    name: "Kho Mã Công Khai Chưa Tự Động Hóa",
    desc: "Quyết định những công việc lặp lại nào của kho mã công khai nên tiếp tục làm thủ công và tạo hồ sơ quyết định chưa tự động hóa.",
    ui: {
      placeholder0: "repo: trac3r00/simpletool-app\ntask: tự động đóng các issue công khai đã cũ phát sinh từ nhu cầu Kanban lặp lại\nowner: maintainers\ncadence: monthly\nrisk: high\nnext-review: 2026-07-15",
      badge0: "Chỉ xử lý trên trình duyệt",
      badge1: "Quản lý thủ công",
      button0: "Mẫu",
      button1: "Tạo hồ sơ quyết định",
      button2: "Xóa",
      button3: "Sao chép",
      desc0:
        "Mỗi dòng một cặp key:value cho repo, task, owner, cadence, risk, next-review và notes. Cũng hỗ trợ mảng JSON kho mã công khai của GitHub và văn bản thuần.",
      desc1:
        "Được thiết kế cho công việc trên kho mã công khai có nhu cầu lặp lại trên Kanban nhưng vẫn cần quản lý thủ công và phán đoán của con người. Dán mảng JSON kho mã công khai của GitHub để bắt đầu từ siêu dữ liệu kho mã.",
      heading0: "Lý do chưa tự động hóa",
      heading1: "Hồ sơ quyết định",
      heading2: "Danh sách kiểm tra",
      label0: "Công việc của kho mã",
      label1: "Người chịu trách nhiệm quyết định",
      label2: "Chu kỳ xem xét lại",
      label3: "Bằng chứng cần có trước khi tự động hóa",
      option0: "30 ngày",
      option1: "60 ngày",
      option2: "90 ngày",
      option3: "Bản phát hành kế tiếp",
      placeholder1:
        "ví dụ: chính sách bằng văn bản, người phụ trách khôi phục, nhật ký kiểm toán, kết quả chạy thử và 3 lần thực hiện thủ công lặp lại.",
      placeholder2: "Hồ sơ quyết định chưa tự động hóa sẽ hiển thị ở đây.",
      placeholder3: "Danh sách kiểm tra quản lý thủ công sẽ hiển thị ở đây.",
    },
    js: {
      copied: "Đã sao chép",
      copyFailed:
        "Sao chép thất bại. Hãy chọn nội dung đầu ra và sao chép thủ công.",
      manual: "Thủ công",
      missingReasons: "Hãy chọn ít nhất một lý do chưa tự động hóa.",
      missingRepos: "Hãy dán ít nhất một kho mã công khai GitHub hợp lệ.",
      missingTask:
        "Hãy thêm công việc của kho mã trước khi tạo hồ sơ quyết định.",
      needsReason: "Cần lý do",
      reasonFrequency: "Tần suất thấp hoặc nhu cầu yếu",
      reasonObservability: "Thiếu khả năng quan sát",
      reasonOwner: "Người phụ trách hoặc quy trình phê duyệt chưa rõ",
      reasonPolicy: "Ranh giới chính sách chưa rõ ràng",
      reasonSafety: "Rủi ro về an toàn hoặc uy tín",
    },
  },
  "review-description-generator": {
    name: "Trình Tạo Mô Tả Đánh Giá",
    desc: "Tạo mô tả đánh giá PR và bình luận có cấu trúc từ commit, diff hoặc ghi chú.",
    ui: {
      badge0: "Chỉ xử lý trên trình duyệt",
      badge1: "6 mẫu",
      button0: "Tạo",
      button1: "Sao chép",
      button2: "Xóa",
      heading0: "Cách hoạt động",
      label0: "Mẫu đánh giá",
      label1: "Mô tả đã tạo",
      option0: "Nâng cấp phụ thuộc",
      option1: "Sửa lỗi",
      option2: "Thêm tính năng",
      option3: "Tái cấu trúc / dọn dẹp",
      option4: "Thay đổi CI / pipeline",
      option5: "Tùy chỉnh",
      text0:
        "Chọn mẫu phù hợp với loại đánh giá của bạn (nâng cấp phụ thuộc, sửa lỗi, thêm tính năng, v.v.).",
      text1:
        "Điền các trường ngữ cảnh — công cụ cung cấp giá trị mặc định hợp lý và hướng dẫn cho từng mẫu.",
      text2:
        "Nhấn Tạo để có mô tả có cấu trúc ở định dạng Markdown, sẵn sàng dùng cho PR hoặc bình luận đánh giá.",
      text3:
        "Mọi xử lý đều diễn ra cục bộ — dữ liệu của bạn không được gửi tới máy chủ của chúng tôi.",
    },
  },
};

const LOCALES = {
  en,
  ko,
  ja,
  es,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  fr,
  de,
  pt,
  vi,
};

function formatEntry(toolId, translation) {
  const value = JSON.stringify(translation, null, 2).replace(/\n/g, "\n    ");
  return `    ${JSON.stringify(toolId)}: ${value},`;
}

function upsert(content, toolId, translation) {
  const esc = toolId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^    ["']${esc}["']:\\s*\\{[\\s\\S]*?^    \\},?$`,
    "m",
  );
  const entry = formatEntry(toolId, translation);
  if (pattern.test(content)) return content.replace(pattern, () => entry);
  const end = content.lastIndexOf("\n  },\n};");
  if (end === -1) {
    throw new Error(`tools dictionary end not found while adding ${toolId}`);
  }
  return `${content.slice(0, end)}\n${entry}${content.slice(end)}`;
}

for (const [lang, dicts] of Object.entries(LOCALES)) {
  const path = `src/i18n/${lang}.js`;
  let content = fs.readFileSync(path, "utf8");
  let changed = 0;
  for (const [toolId, translation] of Object.entries(dicts)) {
    const before = content;
    content = upsert(content, toolId, translation);
    if (content !== before) changed += 1;
  }
  fs.writeFileSync(path, content, "utf8");
  console.log(
    `${lang}: ${changed}/${Object.keys(dicts).length} tool entries updated`,
  );
}
