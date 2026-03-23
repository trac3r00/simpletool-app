import { DEFAULT_LANGUAGE, normalizeLanguage } from '../utils/i18n.js';

const BLOG_LOCALE_OVERRIDES = {
  ko: {
    'why-client-side-tools-matter': {
      title: '개발자 프라이버시를 위해 클라이언트 사이드 도구가 중요한 이유',
      description: '민감한 데이터를 서버로 보내지 않고 브라우저에서 처리하는 것이 왜 중요한지 살펴봅니다.',
      readingTime: '5분 읽기',
      content: `
        <p>온라인 도구에 민감한 데이터를 붙여넣는 순간 가장 먼저 확인해야 할 것은 "이 데이터가 어디로 가는가"입니다. 서버 전송이 필요한 구조라면, 입력값은 곧바로 보관, 분석, 유출의 위험에 노출됩니다.</p>
        <h2>브라우저 안에서 끝나는 처리</h2>
        <p>클라이언트 사이드 도구는 브라우저가 가진 연산 능력으로 작업을 로컬에서 끝냅니다. JSON 포맷팅, 해시 계산, 비밀번호 생성처럼 많은 작업은 서버 도움 없이도 충분히 처리할 수 있습니다.</p>
        <h2>핵심 이점</h2>
        <ul>
          <li><strong>데이터 노출 최소화</strong> — 입력이 기기 밖으로 나가지 않습니다</li>
          <li><strong>빠른 응답성</strong> — 서버 왕복 지연이 없습니다</li>
          <li><strong>오프라인 친화성</strong> — 로드 후에는 네트워크 의존도가 낮습니다</li>
          <li><strong>규제 대응 용이성</strong> — 개인정보 흐름을 단순하게 설명할 수 있습니다</li>
        </ul>
        <h2>무엇을 확인해야 하나요?</h2>
        <p>개발자 도구의 네트워크 탭을 열고 입력 시 외부 요청이 발생하는지 보세요. 진짜 로컬 처리 도구라면, 광고나 정적 자산을 제외하고 도구 본문이 외부 서버로 전송되지 않아야 합니다.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: '2026년 비밀번호 보안 모범 사례',
      description: '현대적인 위협 환경에서 비밀번호를 만들고 저장하고 운영하는 핵심 원칙을 정리합니다.',
      readingTime: '7분 읽기',
      content: `
        <p>패스키와 생체 인증이 늘고 있어도, 비밀번호는 여전히 대부분의 서비스에서 핵심 인증 수단입니다. 그래서 비밀번호 정책은 오래된 습관이 아니라 최신 위협 모델을 기준으로 다시 점검해야 합니다.</p>
        <h2>복잡성보다 길이</h2>
        <p>NIST 가이드라인은 억지 특수문자 규칙보다 충분한 길이를 더 중요하게 봅니다. 짧고 복잡한 비밀번호보다 긴 패스프레이즈가 실제로 더 강한 경우가 많습니다.</p>
        <h2>비밀번호 관리자를 사용하세요</h2>
        <p>서비스마다 고유한 비밀번호를 기억하는 것은 현실적으로 어렵습니다. 비밀번호 관리자는 무작위 비밀번호를 생성하고 안전하게 보관해, 재사용이라는 가장 큰 취약점을 줄여 줍니다.</p>
        <h2>2단계 인증을 켜세요</h2>
        <p>강한 비밀번호도 피싱과 유출 앞에서는 무력해질 수 있습니다. 2FA는 비밀번호가 노출됐을 때 피해를 줄여 주는 두 번째 방어선입니다.</p>
        <h2>권장 기준</h2>
        <ul>
          <li><strong>중요 계정은 16자 이상</strong></li>
          <li><strong>서비스마다 고유하게</strong></li>
          <li><strong>무작위 생성 사용</strong></li>
          <li><strong>관리자에 안전하게 저장</strong></li>
          <li><strong>유출 시 즉시 교체</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'JSON Web Token 이해하기: 개발자 가이드',
      description: 'JWT의 구조, 사용 시점, 그리고 피해야 할 대표적인 보안 실수를 빠르게 정리합니다.',
      readingTime: '8분 읽기',
      content: `
        <p>JWT는 두 시스템 사이에서 클레임을 전달하기 위한 간결한 토큰 형식입니다. 현대 웹 애플리케이션에서 인증과 권한 부여 흐름에 널리 사용됩니다.</p>
        <h2>JWT 구조</h2>
        <p>JWT는 점으로 구분된 세 부분, 즉 <code>header.payload.signature</code> 로 구성됩니다. 각 부분은 Base64URL 형식으로 인코딩된 JSON입니다.</p>
        <ul>
          <li><strong>Header</strong> — 토큰 타입과 서명 알고리즘</li>
          <li><strong>Payload</strong> — 등록/공개/비공개 클레임</li>
          <li><strong>Signature</strong> — 토큰 위변조 여부 검증</li>
        </ul>
        <h2>보안 주의점</h2>
        <ul>
          <li><strong>민감정보를 payload에 넣지 마세요</strong> — JWT는 인코딩이지 암호화가 아닙니다</li>
          <li><strong>서명 검증을 생략하지 마세요</strong></li>
          <li><strong>짧은 만료 시간을 사용하세요</strong></li>
          <li><strong>충분히 강한 서명 키를 사용하세요</strong></li>
        </ul>
        <h2>안전하게 점검하기</h2>
        <p>토큰을 확인할 때는 브라우저 안에서 동작하는 검사 도구를 사용하는 편이 안전합니다. 서버 기반 디코더는 운영 토큰을 로그에 남길 위험이 있습니다.</p>
      `
    },
    'what-is-json': {
      title: 'JSON이란 무엇인가? 개발자를 위한 완전 가이드',
      description: 'JSON의 구조, 기본 타입, 실무에서의 선택 기준, 그리고 자주 겪는 실수를 한 번에 정리합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>JSON은 API, 설정 파일, 데이터 교환에서 가장 널리 쓰이는 포맷입니다. 단순해 보이지만, 구조를 제대로 이해하면 성능과 유지보수에서 큰 차이를 만들 수 있습니다.</p>
        <h2>JSON의 핵심</h2>
        <p>JSON은 객체와 배열을 중심으로 한 단순한 데이터 표현 방식입니다. 사람이 읽기 쉽고 기계도 파싱하기 쉬워서, 대부분의 웹 애플리케이션에서 기본 선택지가 됩니다.</p>
        <h2>실무에서 중요한 이유</h2>
        <ul>
          <li><strong>API 친화적</strong> — 요청과 응답을 명확하게 표현할 수 있습니다</li>
          <li><strong>언어 중립적</strong> — 거의 모든 언어에서 지원합니다</li>
          <li><strong>가볍고 빠름</strong> — XML보다 일반적으로 단순합니다</li>
          <li><strong>검증이 쉬움</strong> — 스키마와 함께 사용하기 좋습니다</li>
        </ul>
        <h2>주의할 점</h2>
        <p>트레일링 콤마, 작은따옴표, 따옴표 없는 키 같은 습관은 JSON에서 허용되지 않습니다. 또한 날짜는 타입이 아니라 문자열로 표현하는 경우가 많으므로, ISO 8601 같은 표준을 일관되게 쓰는 것이 좋습니다.</p>
        <h2>요약</h2>
        <p>JSON은 가장 화려한 포맷은 아니지만, 팀이 공유하기 쉽고 장기적으로 관리하기 쉬운 포맷입니다. 단순함을 과소평가하지 않는 것이 핵심입니다.</p>
      `
    },
    'understanding-hashes': {
      title: '암호학적 해시 이해하기: MD5, SHA-256 그리고 그 너머',
      description: '해시 함수의 성질, 충돌 위험, 그리고 어떤 알고리즘을 언제 써야 하는지 정리합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>해시는 파일 무결성 확인, 서명, 비밀번호 저장까지 폭넓게 쓰입니다. 하지만 모든 해시가 같은 목적에 적합한 것은 아닙니다.</p>
        <h2>좋은 해시의 조건</h2>
        <ul>
          <li><strong>결정적</strong> — 같은 입력은 항상 같은 출력을 만듭니다</li>
          <li><strong>빠름</strong> — 계산 비용이 낮아야 합니다</li>
          <li><strong>되돌리기 어려움</strong> — 원본을 알아내기 어려워야 합니다</li>
          <li><strong>충돌 저항성</strong> — 다른 입력이 같은 결과를 만들기 어려워야 합니다</li>
        </ul>
        <h2>MD5는 왜 위험한가</h2>
        <p>MD5는 오래된 체크섬 용도로는 남아 있지만, 보안 목적에는 부적합합니다. 충돌 생성이 실용적이기 때문에 신뢰 검증이나 서명에 사용하면 안 됩니다.</p>
        <h2>실무 기준</h2>
        <p>일반적인 무결성 검증에는 SHA-256이 가장 무난합니다. 더 긴 출력이 필요하거나 정책상 요구된다면 SHA-512를 고려할 수 있습니다. 비밀번호 저장은 별도의 느린 해시, 예를 들면 bcrypt나 Argon2를 써야 합니다.</p>
        <h2>핵심 정리</h2>
        <p>해시는 "무엇을 해시하느냐"보다 "왜 해시하느냐"가 중요합니다. 목적에 맞는 알고리즘을 선택해야 안전하고 예측 가능한 시스템을 만들 수 있습니다.</p>
      `
    },
    'regex-guide': {
      title: '정규표현식 완전 정복: 실전 가이드',
      description: '정규식의 기본 요소, 흔한 패턴, 성능 함정, 그리고 디버깅 방법을 실전 중심으로 정리합니다.',
      readingTime: '14분 읽기',
      content: `
        <p>정규표현식은 텍스트 검색과 변환을 매우 강력하게 만들어 주지만, 한 번만 잘못 써도 유지보수가 급격히 어려워질 수 있습니다.</p>
        <h2>기본 요소</h2>
        <ul>
          <li><strong>리터럴</strong> — 그대로 일치해야 하는 문자</li>
          <li><strong>문자 클래스</strong> — <code>[a-z]</code>, <code>\\d</code> 같은 집합</li>
          <li><strong>수량자</strong> — 반복 횟수를 정합니다</li>
          <li><strong>앵커</strong> — 문자열의 시작과 끝을 고정합니다</li>
        </ul>
        <h2>실무에서 자주 쓰는 패턴</h2>
        <p>이메일, URL, UUID, 날짜처럼 형식이 반복되는 값은 정규식으로 빠르게 검증할 수 있습니다. 다만 형식 검증이 의미 검증까지 보장하지는 않습니다.</p>
        <h2>성능 함정</h2>
        <p>중첩 수량자는 catastrophic backtracking을 만들 수 있습니다. 특히 길고 매칭되지 않는 입력에서 성능이 급격히 나빠질 수 있으므로, 복잡한 패턴은 반드시 긴 입력으로 테스트해야 합니다.</p>
        <h2>디버깅 방법</h2>
        <p>복잡한 정규식은 시각화 도구로 분해해서 보는 것이 좋습니다. 표현식을 눈으로 읽을 수 있게 만들면 팀 내 공유와 리뷰가 훨씬 쉬워집니다.</p>
      `
    },
    'curl-essentials': {
      title: '개발자를 위한 cURL 필수 가이드',
      description: 'API 디버깅, 인증, 세션 처리, 자동화에 필요한 cURL 핵심 패턴을 정리합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>cURL은 API 테스트와 네트워크 디버깅에서 가장 기본적인 도구 중 하나입니다. 요청을 눈으로 확인할 수 있어서 애플리케이션 코드와 전송 계층 문제를 분리하기 쉽습니다.</p>
        <h2>자주 쓰는 옵션</h2>
        <ul>
          <li><strong>-X</strong> — HTTP 메서드 지정</li>
          <li><strong>-H</strong> — 헤더 추가</li>
          <li><strong>-d</strong> — 요청 본문 전송</li>
          <li><strong>-L</strong> — 리다이렉트 추적</li>
          <li><strong>-v</strong> — 요청과 응답을 자세히 확인</li>
        </ul>
        <h2>JSON API와 함께 쓰기</h2>
        <p>JSON을 전송할 때는 <code>Content-Type: application/json</code> 헤더를 명시해야 합니다. 그렇지 않으면 서버가 본문을 다르게 해석할 수 있습니다.</p>
        <h2>인증과 세션</h2>
        <p>Basic Auth는 <code>-u</code>로, Bearer 토큰은 <code>Authorization</code> 헤더로 전달하는 것이 일반적입니다. 쿠키가 필요한 경우에는 cookie jar를 이용해 로그인 흐름을 재현할 수 있습니다.</p>
        <h2>디버깅 팁</h2>
        <p>응답이 이상할 때는 verbose 모드와 헤더 출력부터 확인하세요. DNS, TLS, 리다이렉트, 인증 실패를 분리해서 볼 수 있습니다.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy(CSP) 실전 구현 가이드',
      description: 'XSS 방어를 위해 CSP를 안전하게 도입하고, nonce, hash, report-only를 올바르게 쓰는 방법을 다룹니다.',
      readingTime: '10분 읽기',
      content: `
        <p>CSP는 XSS 대응에서 가장 효과적인 보안 계층 중 하나입니다. 단순히 입력을 막는 것보다 더 강하게, 브라우저가 무엇을 실행할 수 있는지 자체를 제한합니다.</p>
        <h2>핵심 지시어</h2>
        <ul>
          <li><strong>default-src</strong> — 기본 허용 범위</li>
          <li><strong>script-src</strong> — 스크립트 출처</li>
          <li><strong>style-src</strong> — 스타일 출처</li>
          <li><strong>connect-src</strong> — 네트워크 호출</li>
          <li><strong>frame-ancestors</strong> — iframe 임베드 방지</li>
        </ul>
        <h2>unsafe-inline을 피해야 하는 이유</h2>
        <p><code>'unsafe-inline'</code>은 적용은 쉽지만 XSS 방어 효과를 크게 약화시킵니다. 가능한 경우 nonce나 hash 기반 정책으로 옮겨야 합니다.</p>
        <h2>도입 전략</h2>
        <p>기존 사이트에는 바로 강제 모드보다 <code>Content-Security-Policy-Report-Only</code>로 시작하는 것이 안전합니다. 리포트를 모아 실제 자산 목록을 파악한 뒤, 필요한 것만 허용하는 방식이 실무적으로 가장 안정적입니다.</p>
        <h2>마무리</h2>
        <p>CSP는 한 번에 완성하는 정책이 아니라 점진적으로 강화하는 정책입니다. 기본은 거부하고, 필요한 것만 추가하는 방향이 가장 예측 가능합니다.</p>
      `
    },
  },
  ja: {
    'why-client-side-tools-matter': {
      title: '開発者のプライバシーにとってクライアントサイドツールが重要な理由',
      description: '機密データをサーバーへ送らず、ブラウザ内で処理することの価値を解説します。',
      readingTime: '5分',
      content: `
        <p>オンラインツールへ機密データを貼り付けるとき、最初に確認すべきなのは「そのデータがどこへ送られるか」です。サーバー処理が前提の設計なら、入力値は保存・分析・漏えいのリスクにさらされます。</p>
        <h2>ブラウザ内で完結する処理</h2>
        <p>クライアントサイドツールは、ブラウザ自身の計算能力で処理をローカル完結させます。JSON 整形、ハッシュ計算、パスワード生成のような作業は、サーバーを使わなくても十分実現できます。</p>
        <h2>主な利点</h2>
        <ul>
          <li><strong>データ露出の最小化</strong> — 入力が端末外へ出ません</li>
          <li><strong>高速</strong> — サーバー往復の待ち時間がありません</li>
          <li><strong>オフラインに強い</strong> — 読み込み後はネットワーク依存が小さいです</li>
          <li><strong>コンプライアンスにやさしい</strong> — データフローを単純に説明できます</li>
        </ul>
        <h2>何を確認すべきか</h2>
        <p>ブラウザのネットワークタブを開き、入力時に外部送信が発生するか確認してください。本当にローカル処理のツールなら、広告や静的アセットを除いて、ツール本文は外部サーバーへ送られないはずです。</p>
      `
    },
    'password-security-best-practices-2026': {
      title: '2026 年のパスワードセキュリティ実践ガイド',
      description: '現代の脅威環境で安全なパスワードを作成・保管・運用するための要点を整理します。',
      readingTime: '7分',
      content: `
        <p>パスキーや生体認証が広がっても、パスワードは依然として多くのサービスの中心的な認証要素です。だからこそ、古い慣習ではなく現在の脅威モデルに合わせて運用を見直す必要があります。</p>
        <h2>複雑さより長さ</h2>
        <p>NIST の推奨は、過剰な記号ルールより十分な長さを重視します。短く複雑な文字列より、長いパスフレーズの方が実用上強いことが多いです。</p>
        <h2>パスワードマネージャーを使う</h2>
        <p>サービスごとに固有のパスワードを人間が覚えるのは現実的ではありません。マネージャーを使えば、使い回しという最大の弱点を避けられます。</p>
        <h2>二要素認証を有効にする</h2>
        <p>強いパスワードでも、フィッシングや漏えいの前では十分ではありません。2FA は被害範囲を抑える第二の防御線です。</p>
        <h2>推奨チェックリスト</h2>
        <ul>
          <li><strong>重要アカウントは 16 文字以上</strong></li>
          <li><strong>サービスごとに一意</strong></li>
          <li><strong>ランダム生成を使う</strong></li>
          <li><strong>安全に保管する</strong></li>
          <li><strong>漏えい時はすぐ更新する</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'JSON Web Token 入門: 開発者ガイド',
      description: 'JWT の構造、使いどころ、避けるべき典型的なセキュリティミスを素早く理解します。',
      readingTime: '8分',
      content: `
        <p>JWT は、2 つのシステム間でクレームをやり取りするためのコンパクトなトークン形式です。現代の Web アプリでは認証と認可で広く使われています。</p>
        <h2>JWT の構造</h2>
        <p>JWT は <code>header.payload.signature</code> の 3 部で構成され、それぞれが Base64URL 形式の JSON です。</p>
        <ul>
          <li><strong>Header</strong> — トークン種別と署名アルゴリズム</li>
          <li><strong>Payload</strong> — 登録済み・公開・非公開のクレーム</li>
          <li><strong>Signature</strong> — 改ざんの有無を検証</li>
        </ul>
        <h2>セキュリティ上の注意</h2>
        <ul>
          <li><strong>機密情報を payload に入れない</strong> — JWT は暗号化ではなくエンコードです</li>
          <li><strong>署名検証を省略しない</strong></li>
          <li><strong>短い有効期限を設定する</strong></li>
          <li><strong>十分に強い署名鍵を使う</strong></li>
        </ul>
        <h2>安全に確認する</h2>
        <p>トークン確認にはブラウザ内で動くインスペクタを使う方が安全です。サーバー側デコーダは本番トークンをログへ残す可能性があります。</p>
      `
    },
    'what-is-json': {
      title: 'JSONとは何か: 開発者のための完全ガイド',
      description: 'JSON の構造、基本型、実務での使い分け、そしてありがちなミスをまとめて理解できます。',
      readingTime: '12分',
      content: `
        <p>JSON は API、設定ファイル、データ交換で最も広く使われる形式です。単純ですが、構造を正しく理解すると保守性と性能に大きな差が出ます。</p>
        <h2>JSON の要点</h2>
        <p>JSON はオブジェクトと配列を中心にしたシンプルなデータ表現です。人間にも読みやすく、機械にも扱いやすいため、多くの Web アプリで標準になっています。</p>
        <h2>実務で重要な理由</h2>
        <ul>
          <li><strong>API に向いている</strong> — リクエストとレスポンスを明快に表現できます</li>
          <li><strong>言語中立</strong> — ほとんどの言語でサポートされています</li>
          <li><strong>軽量</strong> — XML より一般にシンプルです</li>
          <li><strong>検証しやすい</strong> — スキーマと組み合わせやすいです</li>
        </ul>
        <h2>注意点</h2>
        <p>末尾のカンマ、シングルクォート、引用符のないキーは JSON では使えません。日付も型ではなく文字列で扱うことが多いので、ISO 8601 を統一して使うのが安全です。</p>
        <h2>まとめ</h2>
        <p>JSON は派手ではありませんが、チームで共有しやすく長期運用しやすい形式です。シンプルさを過小評価しないことが重要です。</p>
      `
    },
    'understanding-hashes': {
      title: '暗号学的ハッシュを理解する: MD5、SHA-256、その先へ',
      description: 'ハッシュ関数の性質、衝突リスク、そして用途に応じたアルゴリズム選択を整理します。',
      readingTime: '12分',
      content: `
        <p>ハッシュはファイル整合性の確認、署名、パスワード保存などに広く使われます。ただし、すべてのハッシュが同じ目的に向いているわけではありません。</p>
        <h2>良いハッシュの条件</h2>
        <ul>
          <li><strong>決定的</strong> — 同じ入力は同じ出力になります</li>
          <li><strong>高速</strong> — 計算コストが低い必要があります</li>
          <li><strong>逆算困難</strong> — 元の入力を推測しづらい必要があります</li>
          <li><strong>衝突耐性</strong> — 異なる入力が同じ出力を作りにくい必要があります</li>
        </ul>
        <h2>MD5 が危険な理由</h2>
        <p>MD5 は古いチェックサム用途には残っていますが、セキュリティ用途には不十分です。衝突を実用的に作れるため、信頼確認や署名には使うべきではありません。</p>
        <h2>実務の目安</h2>
        <p>一般的な整合性確認には SHA-256 が無難です。より長い出力が必要なら SHA-512 を検討できます。パスワード保存には bcrypt や Argon2 のような別系統の遅いハッシュを使うべきです。</p>
        <h2>要点</h2>
        <p>ハッシュでは「何を使うか」より「何のために使うか」が重要です。目的に合わせて選ぶことで、安全で予測可能なシステムになります。</p>
      `
    },
    'regex-guide': {
      title: '正規表現の完全ガイド: 実戦編',
      description: '正規表現の基礎、よくあるパターン、性能の落とし穴、そしてデバッグ方法を実践的にまとめます。',
      readingTime: '14分',
      content: `
        <p>正規表現はテキスト検索と変換を非常に強力にしますが、少し間違えるだけで保守が難しくなります。</p>
        <h2>基本要素</h2>
        <ul>
          <li><strong>リテラル</strong> — そのまま一致させたい文字</li>
          <li><strong>文字クラス</strong> — <code>[a-z]</code> や <code>\\d</code> のような集合</li>
          <li><strong>量指定子</strong> — 繰り返し回数を決めます</li>
          <li><strong>アンカー</strong> — 先頭と末尾を固定します</li>
        </ul>
        <h2>よく使うパターン</h2>
        <p>メール、URL、UUID、日付のような定型値は正規表現で素早く検証できます。ただし、形式の一致が意味の正しさまで保証するわけではありません。</p>
        <h2>性能の落とし穴</h2>
        <p>入れ子になった量指定子は catastrophic backtracking を起こすことがあります。長く一致しない入力で性能が悪化するため、複雑な式は必ず長いデータでも試してください。</p>
        <h2>デバッグ</h2>
        <p>複雑な正規表現は可視化して読むのが有効です。ロジックが見えると、チーム内での共有とレビューがずっと楽になります。</p>
      `
    },
    'curl-essentials': {
      title: '開発者のための cURL 実践ガイド',
      description: 'API デバッグ、認証、セッション、自動化に必要な cURL の基本パターンを整理します。',
      readingTime: '12分',
      content: `
        <p>cURL は API テストやネットワーク調査で最も基本的な道具のひとつです。リクエストの中身をそのまま見られるので、アプリケーションコードと通信層の問題を切り分けやすくなります。</p>
        <h2>よく使うオプション</h2>
        <ul>
          <li><strong>-X</strong> — HTTP メソッドを指定します</li>
          <li><strong>-H</strong> — ヘッダーを追加します</li>
          <li><strong>-d</strong> — 本文を送ります</li>
          <li><strong>-L</strong> — リダイレクトを追います</li>
          <li><strong>-v</strong> — 詳細なリクエスト/レスポンスを表示します</li>
        </ul>
        <h2>JSON API で使う</h2>
        <p>JSON を送るときは <code>Content-Type: application/json</code> を明示してください。指定がないと、サーバーが本文を別形式として解釈することがあります。</p>
        <h2>認証とセッション</h2>
        <p>Basic Auth には <code>-u</code>、Bearer トークンには <code>Authorization</code> ヘッダーを使うのが一般的です。Cookie が必要なときは cookie jar を使うとログインの流れを再現できます。</p>
        <h2>デバッグのコツ</h2>
        <p>応答がおかしいときは verbose モードとヘッダー表示から始めるのが定石です。DNS、TLS、リダイレクト、認証失敗を切り分けて確認できます。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy(CSP) 実装ガイド',
      description: 'XSS を防ぐために CSP を安全に導入し、nonce, hash, report-only を正しく使う方法を解説します。',
      readingTime: '10分',
      content: `
        <p>CSP は XSS 対策で最も効果的な防御層のひとつです。入力を止めるだけでなく、ブラウザが何を実行できるか自体を制限します。</p>
        <h2>主要ディレクティブ</h2>
        <ul>
          <li><strong>default-src</strong> — デフォルトの許可範囲</li>
          <li><strong>script-src</strong> — スクリプトの出所</li>
          <li><strong>style-src</strong> — スタイルの出所</li>
          <li><strong>connect-src</strong> — ネットワーク呼び出し</li>
          <li><strong>frame-ancestors</strong> — iframe 埋め込みの制御</li>
        </ul>
        <h2>unsafe-inline を避ける理由</h2>
        <p><code>'unsafe-inline'</code> は導入が簡単ですが、XSS 防御を大きく弱めます。可能であれば nonce や hash ベースの方針に移行してください。</p>
        <h2>導入の進め方</h2>
        <p>既存サイトでは、いきなり強制せず <code>Content-Security-Policy-Report-Only</code> から始めるのが安全です。レポートを集めて実際に必要な資産を把握してから、必要最小限だけ許可するのが実務的です。</p>
        <h2>まとめ</h2>
        <p>CSP は一度で完成させるものではなく、段階的に強化するものです。まず拒否し、必要なものだけ追加する方針が最も予測可能です。</p>
      `
    },
  },
  es: {
    'why-client-side-tools-matter': {
      title: 'Por qué las herramientas client-side importan para la privacidad del desarrollador',
      description: 'Descubre por qué procesar datos en el navegador, y no en un servidor remoto, es una decisión clave de seguridad.',
      readingTime: '5 min de lectura',
      content: `
        <p>Cada vez que pegas datos sensibles en una herramienta online, la primera pregunta debería ser: "¿a dónde se envían esos datos?". Si el procesamiento depende del servidor, la información queda expuesta a almacenamiento, análisis y posibles fugas.</p>
        <h2>Procesamiento que termina en el navegador</h2>
        <p>Las herramientas client-side aprovechan la capacidad de cómputo del navegador para resolver la tarea localmente. Formatear JSON, calcular hashes o generar contraseñas puede hacerse sin enviar el contenido a otro sistema.</p>
        <h2>Beneficios clave</h2>
        <ul>
          <li><strong>Menor exposición de datos</strong> — la entrada permanece en tu dispositivo</li>
          <li><strong>Más velocidad</strong> — sin latencia de ida y vuelta al servidor</li>
          <li><strong>Mejor experiencia offline</strong> — menos dependencia de la red</li>
          <li><strong>Más fácil de explicar en compliance</strong> — el flujo de datos es más simple</li>
        </ul>
        <h2>Qué debes comprobar</h2>
        <p>Abre la pestaña de red de las herramientas de desarrollo y observa si aparece tráfico externo mientras usas la herramienta. Un flujo realmente local no debería enviar el contenido del trabajo a servidores externos, salvo activos estáticos o publicidad.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: 'Buenas prácticas de seguridad de contraseñas para 2026',
      description: 'Un resumen claro de cómo crear, guardar y operar contraseñas seguras en el panorama moderno de amenazas.',
      readingTime: '7 min de lectura',
      content: `
        <p>Aunque las passkeys y la biometría avanzan, las contraseñas siguen siendo el mecanismo principal de autenticación en muchos servicios. Por eso conviene revisar las políticas con criterios modernos y no con reglas heredadas.</p>
        <h2>La longitud importa más que la complejidad artificial</h2>
        <p>La guía moderna de NIST prioriza contraseñas largas sobre requisitos arbitrarios de símbolos. Una passphrase larga suele ser más fuerte y más usable que una contraseña corta y compleja.</p>
        <h2>Usa un gestor de contraseñas</h2>
        <p>Recordar credenciales únicas para cada servicio no escala. Un gestor reduce la reutilización, que sigue siendo una de las mayores debilidades en seguridad personal y profesional.</p>
        <h2>Activa 2FA</h2>
        <p>Incluso una contraseña fuerte puede caer por phishing o filtraciones. La autenticación en dos pasos añade una segunda barrera cuando la primera falla.</p>
        <h2>Lista recomendada</h2>
        <ul>
          <li><strong>16 caracteres o más</strong> para cuentas importantes</li>
          <li><strong>Una contraseña distinta por servicio</strong></li>
          <li><strong>Generación aleatoria</strong></li>
          <li><strong>Almacenamiento seguro</strong></li>
          <li><strong>Rotación si hubo compromiso</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'Entender JSON Web Tokens: guía para desarrolladores',
      description: 'Aprende rápidamente la estructura de un JWT, cuándo usarlo y qué errores de seguridad evitar.',
      readingTime: '8 min de lectura',
      content: `
        <p>Un JWT es un formato compacto de token para transportar claims entre dos sistemas. Se utiliza ampliamente en autenticación y autorización dentro de aplicaciones web modernas.</p>
        <h2>Estructura del JWT</h2>
        <p>Un JWT tiene tres partes separadas por puntos: <code>header.payload.signature</code>. Cada parte es JSON codificado en Base64URL.</p>
        <ul>
          <li><strong>Header</strong> — tipo de token y algoritmo de firma</li>
          <li><strong>Payload</strong> — claims registradas, públicas y privadas</li>
          <li><strong>Signature</strong> — verifica que el token no fue alterado</li>
        </ul>
        <h2>Consideraciones de seguridad</h2>
        <ul>
          <li><strong>No guardes datos sensibles en el payload</strong> — JWT no significa cifrado</li>
          <li><strong>No omitas la validación de firma</strong></li>
          <li><strong>Usa expiraciones cortas</strong></li>
          <li><strong>Firma con claves robustas</strong></li>
        </ul>
        <h2>Inspección segura</h2>
        <p>Para revisar tokens, es preferible usar un inspector que funcione en el navegador. Los decodificadores server-side pueden terminar registrando credenciales reales.</p>
      `
    }
  },
  'zh-CN': {
    'why-client-side-tools-matter': {
      title: '为何客户端工具对开发者隐私至关重要',
      description: '探讨为什么在浏览器本地处理敏感数据，而非发送到远程服务器，是一个关键的安全决策。',
      readingTime: '5 分钟阅读',
      content: `
        <p>每当你将敏感数据粘贴到在线工具时，首先应该问的是："这些数据会被发送到哪里？"如果处理依赖服务器，你的输入就会面临被存储、分析乃至泄露的风险。</p>
        <h2>在浏览器内完成处理</h2>
        <p>客户端工具利用浏览器本身的计算能力在本地完成任务。格式化 JSON、计算哈希、生成密码——这些操作完全不需要将内容发送给任何外部系统。</p>
        <h2>核心优势</h2>
        <ul>
          <li><strong>数据暴露最小化</strong> — 输入内容不离开你的设备</li>
          <li><strong>响应更快</strong> — 没有服务器往返延迟</li>
          <li><strong>离线友好</strong> — 加载后对网络依赖极低</li>
          <li><strong>合规更简单</strong> — 数据流向清晰易于说明</li>
        </ul>
        <h2>如何验证</h2>
        <p>打开浏览器开发者工具的网络标签，观察使用工具时是否有外部请求。真正的本地处理工具在处理内容时不应向外部服务器发送任何数据（广告和静态资源除外）。</p>
      `
    },
    'password-security-best-practices-2026': {
      title: '2026 年密码安全最佳实践',
      description: '在现代威胁环境下，创建、存储和管理安全密码的核心原则。',
      readingTime: '7 分钟阅读',
      content: `
        <p>尽管通行密钥和生物识别技术日益普及，密码仍是大多数服务的核心认证机制。因此，密码策略需要以当前的威胁模型为基准重新审视，而非沿用过时的习惯。</p>
        <h2>长度比复杂度更重要</h2>
        <p>NIST 指南优先强调足够的长度，而非强制要求特殊字符规则。一个较长的密码短语往往比短而复杂的密码实际上更难破解。</p>
        <h2>使用密码管理器</h2>
        <p>为每项服务记忆独特的密码在现实中并不可行。密码管理器能生成随机密码并安全存储，从而消除复用这一最大的安全弱点。</p>
        <h2>开启双因素认证</h2>
        <p>即使是强密码，在网络钓鱼和数据泄露面前也可能失效。2FA 是密码暴露时的第二道防线。</p>
        <h2>推荐检查清单</h2>
        <ul>
          <li><strong>重要账户使用 16 位以上密码</strong></li>
          <li><strong>每项服务使用唯一密码</strong></li>
          <li><strong>使用随机生成</strong></li>
          <li><strong>安全存储于管理器中</strong></li>
          <li><strong>泄露时立即更换</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: '理解 JSON Web Token：开发者指南',
      description: '快速掌握 JWT 的结构、适用场景以及需要避免的典型安全错误。',
      readingTime: '8 分钟阅读',
      content: `
        <p>JWT 是一种在两个系统之间传递声明的紧凑令牌格式，在现代 Web 应用的认证和授权流程中被广泛使用。</p>
        <h2>JWT 的结构</h2>
        <p>JWT 由三个以点分隔的部分组成：<code>header.payload.signature</code>，每部分都是经过 Base64URL 编码的 JSON。</p>
        <ul>
          <li><strong>Header</strong> — 令牌类型和签名算法</li>
          <li><strong>Payload</strong> — 注册、公开和私有声明</li>
          <li><strong>Signature</strong> — 验证令牌未被篡改</li>
        </ul>
        <h2>安全注意事项</h2>
        <ul>
          <li><strong>不要将敏感信息放入 payload</strong> — JWT 是编码而非加密</li>
          <li><strong>不要跳过签名验证</strong></li>
          <li><strong>使用较短的过期时间</strong></li>
          <li><strong>使用足够强的签名密钥</strong></li>
        </ul>
        <h2>安全检查方式</h2>
        <p>检查令牌时，建议使用在浏览器内运行的检查工具。服务器端解码器可能会将生产令牌记录到日志中。</p>
      `
    },
    'what-is-json': {
      title: 'JSON 是什么？开发者完全指南',
      description: '一次性梳理 JSON 的结构、基本类型、与 XML/YAML 的对比以及常见的解析错误。',
      readingTime: '12 分钟阅读',
      content: `
        <p>JSON 是 API、配置文件和数据交换中使用最广泛的格式。看似简单，但正确理解其结构能在性能和可维护性上带来显著差异。</p>
        <h2>JSON 的核心</h2>
        <p>JSON 是以对象和数组为核心的简洁数据表示方式，既易于人类阅读，也易于机器解析，因此成为大多数 Web 应用的默认选择。</p>
        <h2>为何在实践中重要</h2>
        <ul>
          <li><strong>API 友好</strong> — 能清晰表达请求和响应</li>
          <li><strong>语言中立</strong> — 几乎所有语言都原生支持</li>
          <li><strong>轻量快速</strong> — 通常比 XML 更简洁</li>
          <li><strong>易于验证</strong> — 与 Schema 配合使用效果好</li>
        </ul>
        <h2>注意事项</h2>
        <p>尾随逗号、单引号、无引号键名等习惯在 JSON 中均不被允许。日期通常以字符串而非类型表示，建议统一使用 ISO 8601 标准。</p>
        <h2>小结</h2>
        <p>JSON 并不华丽，但它是最易于团队共享和长期维护的格式。不要低估其简单性的价值。</p>
      `
    },
    'understanding-hashes': {
      title: '理解密码学哈希：MD5、SHA-256 及更多',
      description: '梳理哈希函数的特性、碰撞风险以及应在何时选用哪种算法。',
      readingTime: '12 分钟阅读',
      content: `
        <p>哈希在文件完整性验证、数字签名和密码存储中被广泛使用，但并非所有哈希都适合相同的用途。</p>
        <h2>好的哈希的特征</h2>
        <ul>
          <li><strong>确定性</strong> — 相同输入始终产生相同输出</li>
          <li><strong>高效</strong> — 计算成本低</li>
          <li><strong>单向性</strong> — 难以从输出推算原始输入</li>
          <li><strong>抗碰撞</strong> — 不同输入极难产生相同输出</li>
        </ul>
        <h2>为何 MD5 不再安全</h2>
        <p>MD5 虽然还保留在一些旧式校验用途中，但已不适用于安全场景。由于可以实际构造碰撞，它不应用于信任验证或签名。</p>
        <h2>实践标准</h2>
        <p>一般完整性验证首选 SHA-256。若需要更长的输出或策略要求，可考虑 SHA-512。密码存储则必须使用专门的慢速哈希，如 bcrypt 或 Argon2。</p>
        <h2>核心要点</h2>
        <p>哈希的关键不在于"用什么"，而在于"为何而用"。根据目的选择合适的算法，才能构建安全可预期的系统。</p>
      `
    },
    'regex-guide': {
      title: '正则表达式完全指南：实战版',
      description: '从实践角度梳理正则表达式的基本要素、常用模式、性能陷阱和调试方法。',
      readingTime: '14 分钟阅读',
      content: `
        <p>正则表达式能让文本搜索和转换变得极为强大，但稍有不慎就会使代码难以维护。</p>
        <h2>基本要素</h2>
        <ul>
          <li><strong>字面量</strong> — 需要精确匹配的字符</li>
          <li><strong>字符类</strong> — 如 <code>[a-z]</code>、<code>\\d</code> 等集合</li>
          <li><strong>量词</strong> — 控制重复次数</li>
          <li><strong>锚点</strong> — 固定匹配的起始和结束位置</li>
        </ul>
        <h2>实践中的常用模式</h2>
        <p>邮箱、URL、UUID、日期等有固定格式的值都可以用正则快速验证，但格式匹配并不等同于语义正确性。</p>
        <h2>性能陷阱</h2>
        <p>嵌套量词可能引发灾难性回溯。特别是在处理长的不匹配输入时性能会急剧下降，因此复杂的模式务必要用长字符串测试。</p>
        <h2>调试方法</h2>
        <p>复杂的正则表达式建议使用可视化工具分解查看。让表达式可读，能大大降低团队内部的沟通和审查成本。</p>
      `
    },
    'curl-essentials': {
      title: '开发者必备的 cURL 指南',
      description: '梳理 API 调试、认证、会话处理和自动化所需的核心 cURL 用法。',
      readingTime: '12 分钟阅读',
      content: `
        <p>cURL 是 API 测试和网络调试中最基础的工具之一。它能让你直观看到请求内容，从而轻松将应用层问题与传输层问题区分开来。</p>
        <h2>常用选项</h2>
        <ul>
          <li><strong>-X</strong> — 指定 HTTP 方法</li>
          <li><strong>-H</strong> — 添加请求头</li>
          <li><strong>-d</strong> — 发送请求体</li>
          <li><strong>-L</strong> — 跟随重定向</li>
          <li><strong>-v</strong> — 详细查看请求与响应</li>
        </ul>
        <h2>与 JSON API 配合使用</h2>
        <p>发送 JSON 时必须明确指定 <code>Content-Type: application/json</code> 请求头，否则服务器可能以其他方式解析请求体。</p>
        <h2>认证与会话</h2>
        <p>Basic Auth 通过 <code>-u</code> 传递，Bearer 令牌通过 <code>Authorization</code> 请求头发送。需要 Cookie 时可使用 cookie jar 重现登录流程。</p>
        <h2>调试技巧</h2>
        <p>响应异常时，先从 verbose 模式和请求头输出入手。可以分别排查 DNS、TLS、重定向和认证失败的问题。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy (CSP) 实战部署指南',
      description: '介绍如何安全引入 CSP 以防御 XSS，以及正确使用 nonce、hash 和 report-only 的方法。',
      readingTime: '10 分钟阅读',
      content: `
        <p>CSP 是应对 XSS 最有效的安全防御层之一。它不仅仅拦截恶意输入，更从根本上限制浏览器可以执行的内容。</p>
        <h2>核心指令</h2>
        <ul>
          <li><strong>default-src</strong> — 默认允许范围</li>
          <li><strong>script-src</strong> — 脚本来源</li>
          <li><strong>style-src</strong> — 样式来源</li>
          <li><strong>connect-src</strong> — 网络请求</li>
          <li><strong>frame-ancestors</strong> — 防止 iframe 嵌入</li>
        </ul>
        <h2>为何要避免 unsafe-inline</h2>
        <p><code>'unsafe-inline'</code> 虽然部署简单，但会大幅削弱 XSS 防护效果。条件允许时应迁移到基于 nonce 或 hash 的策略。</p>
        <h2>部署策略</h2>
        <p>对现有站点，建议先以 <code>Content-Security-Policy-Report-Only</code> 模式启动，而非直接强制执行。收集报告、了解实际资源清单后，再以最小权限模式逐步收紧。</p>
        <h2>总结</h2>
        <p>CSP 不是一次性完成的策略，而是需要持续迭代加固的策略。默认拒绝、按需添加，是最具可预测性的方向。</p>
      `
    },
  },
  'zh-TW': {
    'why-client-side-tools-matter': {
      title: '為何客戶端工具對開發者隱私至關重要',
      description: '探討為什麼在瀏覽器本地處理敏感資料，而非傳送至遠端伺服器，是一個關鍵的安全決策。',
      readingTime: '5 分鐘閱讀',
      content: `
        <p>每當你將敏感資料貼入線上工具時，首先應該問的是：「這些資料會被傳送到哪裡？」如果處理仰賴伺服器，你的輸入就面臨被儲存、分析乃至外洩的風險。</p>
        <h2>在瀏覽器內完成處理</h2>
        <p>客戶端工具利用瀏覽器本身的運算能力在本地端完成任務。格式化 JSON、計算雜湊值、產生密碼——這些操作完全不需要將內容傳送給任何外部系統。</p>
        <h2>核心優勢</h2>
        <ul>
          <li><strong>資料暴露最小化</strong> — 輸入內容不離開你的裝置</li>
          <li><strong>回應更快</strong> — 沒有伺服器往返延遲</li>
          <li><strong>離線友善</strong> — 載入後對網路依賴極低</li>
          <li><strong>合規更簡單</strong> — 資料流向清晰易於說明</li>
        </ul>
        <h2>如何驗證</h2>
        <p>打開瀏覽器開發者工具的網路分頁，觀察使用工具時是否有外部請求。真正的本地端處理工具在處理內容時不應向外部伺服器傳送任何資料（廣告和靜態資源除外）。</p>
      `
    },
    'password-security-best-practices-2026': {
      title: '2026 年密碼安全最佳實踐',
      description: '在現代威脅環境下，建立、儲存和管理安全密碼的核心原則。',
      readingTime: '7 分鐘閱讀',
      content: `
        <p>儘管通行密鑰和生物辨識技術日益普及，密碼仍是大多數服務的核心驗證機制。因此，密碼策略需要以當前的威脅模型為基準重新檢視，而非沿用過時的習慣。</p>
        <h2>長度比複雜度更重要</h2>
        <p>NIST 指南優先強調足夠的長度，而非強制要求特殊字元規則。一個較長的密碼短語往往比短而複雜的密碼實際上更難破解。</p>
        <h2>使用密碼管理器</h2>
        <p>為每項服務記憶獨特的密碼在現實中並不可行。密碼管理器能產生隨機密碼並安全儲存，從而消除重複使用這一最大的安全弱點。</p>
        <h2>開啟雙因素驗證</h2>
        <p>即使是強密碼，在網路釣魚和資料外洩面前也可能失效。2FA 是密碼暴露時的第二道防線。</p>
        <h2>推薦檢查清單</h2>
        <ul>
          <li><strong>重要帳戶使用 16 位以上密碼</strong></li>
          <li><strong>每項服務使用唯一密碼</strong></li>
          <li><strong>使用隨機產生</strong></li>
          <li><strong>安全儲存於管理器中</strong></li>
          <li><strong>外洩時立即更換</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: '理解 JSON Web Token：開發者指南',
      description: '快速掌握 JWT 的結構、適用場景以及需要避免的典型安全錯誤。',
      readingTime: '8 分鐘閱讀',
      content: `
        <p>JWT 是一種在兩個系統之間傳遞宣告的緊湊令牌格式，在現代 Web 應用的驗證和授權流程中被廣泛使用。</p>
        <h2>JWT 的結構</h2>
        <p>JWT 由三個以點分隔的部分組成：<code>header.payload.signature</code>，每部分都是經過 Base64URL 編碼的 JSON。</p>
        <ul>
          <li><strong>Header</strong> — 令牌類型和簽名演算法</li>
          <li><strong>Payload</strong> — 已登錄、公開和私有宣告</li>
          <li><strong>Signature</strong> — 驗證令牌未被竄改</li>
        </ul>
        <h2>安全注意事項</h2>
        <ul>
          <li><strong>不要將敏感資訊放入 payload</strong> — JWT 是編碼而非加密</li>
          <li><strong>不要跳過簽名驗證</strong></li>
          <li><strong>使用較短的過期時間</strong></li>
          <li><strong>使用足夠強的簽名金鑰</strong></li>
        </ul>
        <h2>安全檢查方式</h2>
        <p>檢查令牌時，建議使用在瀏覽器內運行的檢查工具。伺服器端解碼器可能會將正式環境的令牌記錄到日誌中。</p>
      `
    },
    'what-is-json': {
      title: 'JSON 是什麼？開發者完全指南',
      description: '一次性梳理 JSON 的結構、基本型別、與 XML/YAML 的比較以及常見的解析錯誤。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>JSON 是 API、設定檔和資料交換中使用最廣泛的格式。看似簡單，但正確理解其結構能在效能和可維護性上帶來顯著差異。</p>
        <h2>JSON 的核心</h2>
        <p>JSON 是以物件和陣列為核心的簡潔資料表示方式，既易於人類閱讀，也易於機器解析，因此成為大多數 Web 應用的預設選擇。</p>
        <h2>為何在實踐中重要</h2>
        <ul>
          <li><strong>API 友善</strong> — 能清晰表達請求和回應</li>
          <li><strong>語言中立</strong> — 幾乎所有語言都原生支援</li>
          <li><strong>輕量快速</strong> — 通常比 XML 更簡潔</li>
          <li><strong>易於驗證</strong> — 與 Schema 搭配使用效果好</li>
        </ul>
        <h2>注意事項</h2>
        <p>尾隨逗號、單引號、無引號鍵名等習慣在 JSON 中均不被允許。日期通常以字串而非型別表示，建議統一使用 ISO 8601 標準。</p>
        <h2>小結</h2>
        <p>JSON 並不華麗，但它是最易於團隊共享和長期維護的格式。不要低估其簡單性的價值。</p>
      `
    },
    'understanding-hashes': {
      title: '理解密碼學雜湊：MD5、SHA-256 及更多',
      description: '梳理雜湊函數的特性、碰撞風險以及應在何時選用哪種演算法。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>雜湊在檔案完整性驗證、數位簽名和密碼儲存中被廣泛使用，但並非所有雜湊都適合相同的用途。</p>
        <h2>好的雜湊的特徵</h2>
        <ul>
          <li><strong>確定性</strong> — 相同輸入始終產生相同輸出</li>
          <li><strong>高效</strong> — 計算成本低</li>
          <li><strong>單向性</strong> — 難以從輸出推算原始輸入</li>
          <li><strong>抗碰撞</strong> — 不同輸入極難產生相同輸出</li>
        </ul>
        <h2>為何 MD5 不再安全</h2>
        <p>MD5 雖然還保留在一些舊式校驗用途中，但已不適用於安全場景。由於可以實際構造碰撞，它不應用於信任驗證或簽名。</p>
        <h2>實踐標準</h2>
        <p>一般完整性驗證首選 SHA-256。若需要更長的輸出或策略要求，可考慮 SHA-512。密碼儲存則必須使用專門的慢速雜湊，如 bcrypt 或 Argon2。</p>
        <h2>核心要點</h2>
        <p>雜湊的關鍵不在於「用什麼」，而在於「為何而用」。根據目的選擇合適的演算法，才能構建安全可預期的系統。</p>
      `
    },
    'regex-guide': {
      title: '正規表示式完全指南：實戰版',
      description: '從實踐角度梳理正規表示式的基本要素、常用模式、效能陷阱和除錯方法。',
      readingTime: '14 分鐘閱讀',
      content: `
        <p>正規表示式能讓文字搜尋和轉換變得極為強大，但稍有不慎就會使程式碼難以維護。</p>
        <h2>基本要素</h2>
        <ul>
          <li><strong>字面量</strong> — 需要精確匹配的字元</li>
          <li><strong>字元類</strong> — 如 <code>[a-z]</code>、<code>\\d</code> 等集合</li>
          <li><strong>量詞</strong> — 控制重複次數</li>
          <li><strong>錨點</strong> — 固定匹配的起始和結束位置</li>
        </ul>
        <h2>實踐中的常用模式</h2>
        <p>電子郵件、URL、UUID、日期等有固定格式的值都可以用正規表示式快速驗證，但格式匹配並不等同於語義正確性。</p>
        <h2>效能陷阱</h2>
        <p>巢狀量詞可能引發災難性回溯。特別是在處理長的不匹配輸入時效能會急劇下降，因此複雜的模式務必要用長字串測試。</p>
        <h2>除錯方法</h2>
        <p>複雜的正規表示式建議使用視覺化工具分解查看。讓表示式可讀，能大大降低團隊內部的溝通和審查成本。</p>
      `
    },
    'curl-essentials': {
      title: '開發者必備的 cURL 指南',
      description: '梳理 API 除錯、驗證、工作階段處理和自動化所需的核心 cURL 用法。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>cURL 是 API 測試和網路除錯中最基礎的工具之一。它能讓你直觀看到請求內容，從而輕鬆將應用層問題與傳輸層問題區分開來。</p>
        <h2>常用選項</h2>
        <ul>
          <li><strong>-X</strong> — 指定 HTTP 方法</li>
          <li><strong>-H</strong> — 新增請求標頭</li>
          <li><strong>-d</strong> — 傳送請求本體</li>
          <li><strong>-L</strong> — 追蹤重新導向</li>
          <li><strong>-v</strong> — 詳細查看請求與回應</li>
        </ul>
        <h2>與 JSON API 搭配使用</h2>
        <p>傳送 JSON 時必須明確指定 <code>Content-Type: application/json</code> 請求標頭，否則伺服器可能以其他方式解析請求本體。</p>
        <h2>驗證與工作階段</h2>
        <p>Basic Auth 透過 <code>-u</code> 傳遞，Bearer 令牌透過 <code>Authorization</code> 請求標頭傳送。需要 Cookie 時可使用 cookie jar 重現登入流程。</p>
        <h2>除錯技巧</h2>
        <p>回應異常時，先從 verbose 模式和請求標頭輸出入手。可以分別排查 DNS、TLS、重新導向和驗證失敗的問題。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy (CSP) 實戰部署指南',
      description: '介紹如何安全引入 CSP 以防禦 XSS，以及正確使用 nonce、hash 和 report-only 的方法。',
      readingTime: '10 分鐘閱讀',
      content: `
        <p>CSP 是應對 XSS 最有效的安全防禦層之一。它不僅僅攔截惡意輸入，更從根本上限制瀏覽器可以執行的內容。</p>
        <h2>核心指令</h2>
        <ul>
          <li><strong>default-src</strong> — 預設允許範圍</li>
          <li><strong>script-src</strong> — 腳本來源</li>
          <li><strong>style-src</strong> — 樣式來源</li>
          <li><strong>connect-src</strong> — 網路請求</li>
          <li><strong>frame-ancestors</strong> — 防止 iframe 嵌入</li>
        </ul>
        <h2>為何要避免 unsafe-inline</h2>
        <p><code>'unsafe-inline'</code> 雖然部署簡單，但會大幅削弱 XSS 防護效果。條件允許時應遷移到基於 nonce 或 hash 的策略。</p>
        <h2>部署策略</h2>
        <p>對現有網站，建議先以 <code>Content-Security-Policy-Report-Only</code> 模式啟動，而非直接強制執行。收集報告、了解實際資源清單後，再以最小權限模式逐步收緊。</p>
        <h2>總結</h2>
        <p>CSP 不是一次性完成的策略，而是需要持續迭代加固的策略。預設拒絕、按需新增，是最具可預測性的方向。</p>
      `
    },
  },
  fr: {
    'why-client-side-tools-matter': {
      title: 'Pourquoi les outils côté client sont essentiels pour la confidentialité des développeurs',
      description: 'Découvrez pourquoi traiter les données sensibles dans le navigateur, plutôt que sur un serveur distant, est une décision de sécurité cruciale.',
      readingTime: '5 min de lecture',
      content: `
        <p>Chaque fois que vous collez des données sensibles dans un outil en ligne, la première question à se poser est : "Où vont ces données ?" Si le traitement dépend d'un serveur, vos données sont exposées au risque d'être stockées, analysées ou divulguées.</p>
        <h2>Un traitement qui reste dans le navigateur</h2>
        <p>Les outils côté client utilisent la puissance de calcul du navigateur pour effectuer les tâches localement. Formater du JSON, calculer des hashs, générer des mots de passe — tout cela peut se faire sans envoyer le moindre contenu à un système externe.</p>
        <h2>Avantages clés</h2>
        <ul>
          <li><strong>Exposition minimale des données</strong> — vos saisies ne quittent pas votre appareil</li>
          <li><strong>Plus rapide</strong> — aucune latence de déplacement vers le serveur</li>
          <li><strong>Compatible hors ligne</strong> — faible dépendance au réseau après le chargement</li>
          <li><strong>Plus simple pour la conformité</strong> — les flux de données sont faciles à expliquer</li>
        </ul>
        <h2>Comment vérifier</h2>
        <p>Ouvrez l'onglet Réseau des outils de développement et observez si des requêtes externes apparaissent pendant l'utilisation. Un outil vraiment local ne devrait pas envoyer le contenu traité à des serveurs externes, en dehors des publicités et des ressources statiques.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: 'Bonnes pratiques de sécurité des mots de passe en 2026',
      description: 'Un résumé des principes essentiels pour créer, stocker et gérer des mots de passe sécurisés dans le contexte des menaces actuelles.',
      readingTime: '7 min de lecture',
      content: `
        <p>Même si les passkeys et la biométrie progressent, les mots de passe restent le mécanisme d'authentification principal pour la plupart des services. C'est pourquoi les politiques de mots de passe doivent être revues à l'aune des menaces actuelles, et non d'habitudes obsolètes.</p>
        <h2>La longueur prime sur la complexité artificielle</h2>
        <p>Les recommandations modernes du NIST privilégient une longueur suffisante plutôt que des règles de caractères spéciaux arbitraires. Une longue phrase secrète est souvent plus robuste qu'un mot de passe court et complexe.</p>
        <h2>Utilisez un gestionnaire de mots de passe</h2>
        <p>Se souvenir d'identifiants uniques pour chaque service n'est pas réaliste. Un gestionnaire génère des mots de passe aléatoires et les stocke de façon sécurisée, éliminant ainsi la réutilisation, principale faille de sécurité.</p>
        <h2>Activez l'authentification à deux facteurs</h2>
        <p>Même un mot de passe fort peut être compromis par le phishing ou une fuite de données. Le 2FA constitue une deuxième ligne de défense lorsque le mot de passe est exposé.</p>
        <h2>Liste de contrôle recommandée</h2>
        <ul>
          <li><strong>16 caractères minimum</strong> pour les comptes importants</li>
          <li><strong>Un mot de passe unique par service</strong></li>
          <li><strong>Génération aléatoire</strong></li>
          <li><strong>Stockage sécurisé</strong></li>
          <li><strong>Remplacement immédiat en cas de compromission</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'Comprendre les JSON Web Tokens : guide du développeur',
      description: 'Maîtrisez rapidement la structure d\'un JWT, quand l\'utiliser et quelles erreurs de sécurité éviter.',
      readingTime: '8 min de lecture',
      content: `
        <p>Un JWT est un format de token compact permettant de transporter des claims entre deux systèmes. Il est largement utilisé dans les flux d'authentification et d'autorisation des applications web modernes.</p>
        <h2>Structure d'un JWT</h2>
        <p>Un JWT se compose de trois parties séparées par des points : <code>header.payload.signature</code>. Chaque partie est du JSON encodé en Base64URL.</p>
        <ul>
          <li><strong>Header</strong> — type de token et algorithme de signature</li>
          <li><strong>Payload</strong> — claims enregistrées, publiques et privées</li>
          <li><strong>Signature</strong> — vérifie que le token n'a pas été altéré</li>
        </ul>
        <h2>Considérations de sécurité</h2>
        <ul>
          <li><strong>Ne stockez pas de données sensibles dans le payload</strong> — JWT signifie encodage, pas chiffrement</li>
          <li><strong>Ne sautez pas la validation de la signature</strong></li>
          <li><strong>Utilisez des durées d'expiration courtes</strong></li>
          <li><strong>Utilisez des clés de signature suffisamment robustes</strong></li>
        </ul>
        <h2>Inspection sécurisée</h2>
        <p>Pour inspecter des tokens, préférez un outil fonctionnant dans le navigateur. Les décodeurs côté serveur risquent de consigner des tokens de production dans les journaux.</p>
      `
    },
    'what-is-json': {
      title: 'Qu\'est-ce que JSON ? Le guide complet du développeur',
      description: 'Structure, types de base, différences avec XML/YAML et erreurs courantes : tout ce qu\'il faut savoir sur JSON.',
      readingTime: '12 min de lecture',
      content: `
        <p>JSON est le format le plus utilisé pour les API, les fichiers de configuration et les échanges de données. Sa simplicité apparente cache une valeur réelle pour la maintenabilité et les performances.</p>
        <h2>L'essentiel de JSON</h2>
        <p>JSON est une représentation de données simple centrée sur les objets et les tableaux. Sa lisibilité pour les humains et sa facilité de traitement automatique en font le choix par défaut dans la plupart des applications web.</p>
        <h2>Pourquoi c'est important en pratique</h2>
        <ul>
          <li><strong>Adapté aux API</strong> — exprime clairement les requêtes et réponses</li>
          <li><strong>Neutre vis-à-vis du langage</strong> — pris en charge nativement par presque tous les langages</li>
          <li><strong>Léger et rapide</strong> — généralement plus simple que XML</li>
          <li><strong>Facile à valider</strong> — se combine bien avec des schémas</li>
        </ul>
        <h2>Points d'attention</h2>
        <p>Les virgules finales, les guillemets simples et les clés sans guillemets ne sont pas autorisés en JSON. Les dates sont souvent représentées sous forme de chaînes plutôt que de types — il est recommandé d'utiliser systématiquement ISO 8601.</p>
        <h2>En résumé</h2>
        <p>JSON n'est pas le format le plus élégant, mais c'est celui qui se partage le mieux en équipe et se maintient le plus facilement sur le long terme. Sa simplicité est une force à ne pas sous-estimer.</p>
      `
    },
    'understanding-hashes': {
      title: 'Comprendre les hashs cryptographiques : MD5, SHA-256 et au-delà',
      description: 'Propriétés des fonctions de hachage, risques de collision et guide pour choisir le bon algorithme selon l\'usage.',
      readingTime: '12 min de lecture',
      content: `
        <p>Les hashs sont utilisés pour la vérification d'intégrité des fichiers, les signatures numériques et le stockage des mots de passe, mais tous ne conviennent pas aux mêmes usages.</p>
        <h2>Caractéristiques d'un bon hash</h2>
        <ul>
          <li><strong>Déterministe</strong> — même entrée, même sortie à chaque fois</li>
          <li><strong>Rapide</strong> — faible coût de calcul</li>
          <li><strong>À sens unique</strong> — difficile de retrouver l'entrée depuis la sortie</li>
          <li><strong>Résistant aux collisions</strong> — deux entrées différentes produisent très rarement la même sortie</li>
        </ul>
        <h2>Pourquoi MD5 est dangereux</h2>
        <p>MD5 subsiste dans certains usages de somme de contrôle légacy, mais n'est plus adapté à la sécurité. La construction pratique de collisions le disqualifie pour toute vérification de confiance ou signature.</p>
        <h2>Référence pratique</h2>
        <p>Pour la vérification d'intégrité courante, SHA-256 est le choix le plus sûr. SHA-512 peut être envisagé si une sortie plus longue est requise. Pour le stockage des mots de passe, il faut utiliser un hash lent dédié, comme bcrypt ou Argon2.</p>
        <h2>Points essentiels</h2>
        <p>En matière de hachage, la question n'est pas "quoi hacher" mais "pourquoi hacher". Choisir l'algorithme adapté à l'objectif est la clé d'un système sûr et prévisible.</p>
      `
    },
    'regex-guide': {
      title: 'Guide complet des expressions régulières : approche pratique',
      description: 'Éléments de base, motifs courants, pièges de performance et méthodes de débogage des expressions régulières.',
      readingTime: '14 min de lecture',
      content: `
        <p>Les expressions régulières rendent la recherche et la transformation de texte extrêmement puissantes, mais une seule erreur peut rendre la maintenance très difficile.</p>
        <h2>Éléments fondamentaux</h2>
        <ul>
          <li><strong>Littéraux</strong> — caractères à faire correspondre exactement</li>
          <li><strong>Classes de caractères</strong> — ensembles comme <code>[a-z]</code> ou <code>\\d</code></li>
          <li><strong>Quantificateurs</strong> — définissent le nombre de répétitions</li>
          <li><strong>Ancres</strong> — fixent le début et la fin de la chaîne</li>
        </ul>
        <h2>Motifs courants en pratique</h2>
        <p>Les emails, URL, UUID, dates et autres valeurs à format répétable se valident rapidement avec des regex. Attention toutefois : valider le format ne garantit pas la validité sémantique.</p>
        <h2>Pièges de performance</h2>
        <p>Les quantificateurs imbriqués peuvent provoquer un backtracking catastrophique. Les performances peuvent se dégrader brutalement sur des entrées longues sans correspondance — testez toujours les motifs complexes avec de longues entrées.</p>
        <h2>Méthodes de débogage</h2>
        <p>Il est recommandé de décomposer les expressions complexes à l'aide d'outils de visualisation. Rendre une expression lisible facilite grandement le partage et la revue en équipe.</p>
      `
    },
    'curl-essentials': {
      title: 'Guide essentiel de cURL pour les développeurs',
      description: 'Les motifs cURL indispensables pour déboguer les API, gérer l\'authentification, les sessions et l\'automatisation.',
      readingTime: '12 min de lecture',
      content: `
        <p>cURL est l'un des outils les plus fondamentaux pour tester les API et déboguer le réseau. La visibilité directe sur les requêtes facilite la distinction entre les problèmes applicatifs et les problèmes de transport.</p>
        <h2>Options fréquemment utilisées</h2>
        <ul>
          <li><strong>-X</strong> — spécifie la méthode HTTP</li>
          <li><strong>-H</strong> — ajoute un en-tête</li>
          <li><strong>-d</strong> — envoie le corps de la requête</li>
          <li><strong>-L</strong> — suit les redirections</li>
          <li><strong>-v</strong> — affiche le détail des requêtes et réponses</li>
        </ul>
        <h2>Utilisation avec les API JSON</h2>
        <p>Lors de l'envoi de JSON, il faut obligatoirement spécifier l'en-tête <code>Content-Type: application/json</code>, sans quoi le serveur pourrait interpréter le corps différemment.</p>
        <h2>Authentification et sessions</h2>
        <p>Basic Auth se passe via <code>-u</code>, les tokens Bearer via l'en-tête <code>Authorization</code>. Pour les cookies, un cookie jar permet de reproduire un flux de connexion complet.</p>
        <h2>Conseils de débogage</h2>
        <p>En cas de réponse anormale, commencez par le mode verbose et l'affichage des en-têtes. Cela permet d'isoler les problèmes DNS, TLS, redirections et authentification.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Guide pratique d\'implémentation du Content Security Policy (CSP)',
      description: 'Comment déployer CSP de façon sécurisée pour se défendre contre XSS, avec nonce, hash et report-only.',
      readingTime: '10 min de lecture',
      content: `
        <p>CSP est l'une des couches de sécurité les plus efficaces contre XSS. Plutôt que de simplement bloquer les entrées malveillantes, elle restreint directement ce que le navigateur est autorisé à exécuter.</p>
        <h2>Directives clés</h2>
        <ul>
          <li><strong>default-src</strong> — périmètre d'autorisation par défaut</li>
          <li><strong>script-src</strong> — origines des scripts</li>
          <li><strong>style-src</strong> — origines des styles</li>
          <li><strong>connect-src</strong> — appels réseau</li>
          <li><strong>frame-ancestors</strong> — prévention de l'intégration dans des iframes</li>
        </ul>
        <h2>Pourquoi éviter unsafe-inline</h2>
        <p><code>'unsafe-inline'</code> est simple à appliquer mais affaiblit considérablement la protection XSS. Il faut, dans la mesure du possible, migrer vers une politique basée sur des nonces ou des hashs.</p>
        <h2>Stratégie de déploiement</h2>
        <p>Pour les sites existants, il est préférable de commencer avec <code>Content-Security-Policy-Report-Only</code> plutôt que d'appliquer directement les restrictions. Collectez les rapports pour identifier les ressources réellement utilisées, puis n'autorisez que le strict nécessaire.</p>
        <h2>Conclusion</h2>
        <p>CSP n'est pas une politique à définir une seule fois, mais à renforcer progressivement. Tout refuser par défaut et n'ajouter que ce qui est nécessaire est l'approche la plus prévisible.</p>
      `
    },
  },
  de: {
    'why-client-side-tools-matter': {
      title: 'Warum clientseitige Tools für die Privatsphäre von Entwicklern wichtig sind',
      description: 'Warum die Verarbeitung sensibler Daten im Browser statt auf einem Remote-Server eine entscheidende Sicherheitsentscheidung ist.',
      readingTime: '5 Min. Lesezeit',
      content: `
        <p>Jedes Mal, wenn Sie sensible Daten in ein Online-Tool einfügen, sollten Sie zuerst fragen: "Wohin werden diese Daten gesendet?" Wenn die Verarbeitung einen Server erfordert, sind Ihre Eingaben dem Risiko der Speicherung, Analyse und des Verlusts ausgesetzt.</p>
        <h2>Verarbeitung bleibt im Browser</h2>
        <p>Clientseitige Tools nutzen die Rechenleistung des Browsers, um Aufgaben lokal zu erledigen. JSON formatieren, Hashes berechnen, Passwörter generieren — all das lässt sich erledigen, ohne Inhalte an externe Systeme zu senden.</p>
        <h2>Wichtigste Vorteile</h2>
        <ul>
          <li><strong>Minimale Datenexposition</strong> — Eingaben verlassen Ihr Gerät nicht</li>
          <li><strong>Schneller</strong> — keine Server-Roundtrip-Latenz</li>
          <li><strong>Offline-freundlich</strong> — geringe Netzwerkabhängigkeit nach dem Laden</li>
          <li><strong>Einfacher für Compliance</strong> — Datenflüsse lassen sich klar erklären</li>
        </ul>
        <h2>Wie Sie es überprüfen</h2>
        <p>Öffnen Sie den Netzwerk-Tab der Entwicklertools und beobachten Sie, ob beim Verwenden externe Anfragen erscheinen. Ein echtes lokales Tool sollte den verarbeiteten Inhalt nicht an externe Server senden — außer für Werbung und statische Assets.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: 'Passwort-Sicherheit 2026: Best Practices',
      description: 'Die wichtigsten Prinzipien zum Erstellen, Speichern und Verwalten sicherer Passwörter in der modernen Bedrohungslandschaft.',
      readingTime: '7 Min. Lesezeit',
      content: `
        <p>Auch wenn Passkeys und biometrische Verfahren zunehmen, sind Passwörter nach wie vor der zentrale Authentifizierungsmechanismus bei den meisten Diensten. Deshalb müssen Passwort-Richtlinien anhand aktueller Bedrohungsmodelle neu bewertet werden — nicht auf Basis veralteter Gewohnheiten.</p>
        <h2>Länge ist wichtiger als erzwungene Komplexität</h2>
        <p>Moderne NIST-Richtlinien priorisieren ausreichende Länge gegenüber willkürlichen Sonderzeichen-Regeln. Eine lange Passphrase ist oft stärker als ein kurzes, komplexes Passwort.</p>
        <h2>Verwenden Sie einen Passwort-Manager</h2>
        <p>Eindeutige Passwörter für jeden Dienst im Gedächtnis zu behalten ist unrealistisch. Ein Manager generiert zufällige Passwörter und speichert sie sicher, womit die Wiederverwendung als größte Schwachstelle eliminiert wird.</p>
        <h2>Aktivieren Sie Zwei-Faktor-Authentifizierung</h2>
        <p>Selbst starke Passwörter können durch Phishing und Datenlecks kompromittiert werden. 2FA ist die zweite Verteidigungslinie, wenn ein Passwort bekannt wird.</p>
        <h2>Empfohlene Checkliste</h2>
        <ul>
          <li><strong>16 Zeichen oder mehr</strong> für wichtige Konten</li>
          <li><strong>Eindeutiges Passwort pro Dienst</strong></li>
          <li><strong>Zufällige Generierung verwenden</strong></li>
          <li><strong>Sicher im Manager speichern</strong></li>
          <li><strong>Bei Kompromittierung sofort ersetzen</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'JSON Web Tokens verstehen: Entwickler-Leitfaden',
      description: 'Schnell die Struktur eines JWT verstehen, wann man ihn einsetzt und welche Sicherheitsfehler man vermeiden sollte.',
      readingTime: '8 Min. Lesezeit',
      content: `
        <p>Ein JWT ist ein kompaktes Token-Format zum Übertragen von Claims zwischen zwei Systemen. Es wird in modernen Web-Apps für Authentifizierung und Autorisierung weit verbreitet eingesetzt.</p>
        <h2>Struktur eines JWT</h2>
        <p>Ein JWT besteht aus drei durch Punkte getrennten Teilen: <code>header.payload.signature</code>. Jeder Teil ist Base64URL-kodiertes JSON.</p>
        <ul>
          <li><strong>Header</strong> — Token-Typ und Signaturalgorithmus</li>
          <li><strong>Payload</strong> — registrierte, öffentliche und private Claims</li>
          <li><strong>Signature</strong> — überprüft, dass das Token nicht verändert wurde</li>
        </ul>
        <h2>Sicherheitshinweise</h2>
        <ul>
          <li><strong>Keine sensiblen Daten in den Payload</strong> — JWT bedeutet Kodierung, nicht Verschlüsselung</li>
          <li><strong>Signaturvalidierung nicht überspringen</strong></li>
          <li><strong>Kurze Ablaufzeiten verwenden</strong></li>
          <li><strong>Ausreichend starke Signaturschlüssel nutzen</strong></li>
        </ul>
        <h2>Sichere Inspektion</h2>
        <p>Zur Token-Prüfung empfiehlt sich ein im Browser laufendes Inspect-Tool. Server-seitige Decoder können Produktions-Tokens in Log-Dateien hinterlassen.</p>
      `
    },
    'what-is-json': {
      title: 'Was ist JSON? Der vollständige Leitfaden für Entwickler',
      description: 'Struktur, Grundtypen, Unterschiede zu XML/YAML und häufige Parsing-Fehler — alles über JSON auf einen Blick.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>JSON ist das am häufigsten verwendete Format für APIs, Konfigurationsdateien und Datenaustausch. Die scheinbare Einfachheit verbirgt einen echten Mehrwert für Wartbarkeit und Performance.</p>
        <h2>Das Wesentliche an JSON</h2>
        <p>JSON ist eine einfache Datendarstellung, die auf Objekten und Arrays aufbaut. Da es sowohl für Menschen lesbar als auch maschinell verarbeitbar ist, ist es die Standardwahl in den meisten Web-Applikationen.</p>
        <h2>Warum es in der Praxis wichtig ist</h2>
        <ul>
          <li><strong>API-freundlich</strong> — Requests und Responses lassen sich klar ausdrücken</li>
          <li><strong>Sprachunabhängig</strong> — von fast allen Sprachen nativ unterstützt</li>
          <li><strong>Leichtgewichtig</strong> — generell einfacher als XML</li>
          <li><strong>Leicht validierbar</strong> — gut mit Schemata kombinierbar</li>
        </ul>
        <h2>Worauf man achten muss</h2>
        <p>Abschließende Kommas, einfache Anführungszeichen und Schlüssel ohne Anführungszeichen sind in JSON nicht erlaubt. Daten werden oft als Strings statt als Typen dargestellt — für ISO 8601 als Standard ist eine konsistente Verwendung empfehlenswert.</p>
        <h2>Fazit</h2>
        <p>JSON ist nicht das eleganteste Format, aber das am einfachsten gemeinsam nutzbare und langfristig wartbarste. Seine Einfachheit sollte nicht unterschätzt werden.</p>
      `
    },
    'understanding-hashes': {
      title: 'Kryptografische Hashes verstehen: MD5, SHA-256 und mehr',
      description: 'Eigenschaften von Hash-Funktionen, Kollisionsrisiken und eine Anleitung zur Wahl des richtigen Algorithmus.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>Hashes werden für Dateiintegritätsprüfungen, digitale Signaturen und Passwortspeicherung eingesetzt — aber nicht alle Hashes eignen sich für denselben Zweck.</p>
        <h2>Merkmale eines guten Hashes</h2>
        <ul>
          <li><strong>Deterministisch</strong> — gleicher Input liefert immer gleichen Output</li>
          <li><strong>Schnell</strong> — geringer Rechenaufwand</li>
          <li><strong>Einwegfunktion</strong> — schwer, den Original-Input aus dem Output abzuleiten</li>
          <li><strong>Kollisionsresistent</strong> — unterschiedliche Inputs erzeugen sehr selten denselben Output</li>
        </ul>
        <h2>Warum MD5 unsicher ist</h2>
        <p>MD5 existiert noch für ältere Prüfsummen-Anwendungen, ist aber für Sicherheitszwecke nicht geeignet. Da praktische Kollisionen möglich sind, darf es nicht für Vertrauensprüfungen oder Signaturen verwendet werden.</p>
        <h2>Praktische Referenz</h2>
        <p>Für allgemeine Integritätsprüfungen ist SHA-256 die sicherste Wahl. SHA-512 kann bei Bedarf nach längerer Ausgabe in Betracht gezogen werden. Für die Passwortspeicherung müssen speziell langsame Hashes wie bcrypt oder Argon2 verwendet werden.</p>
        <h2>Kernpunkte</h2>
        <p>Bei Hashes ist nicht "Was wird gehasht?" die entscheidende Frage, sondern "Warum wird gehasht?". Den richtigen Algorithmus für den Zweck zu wählen, ist der Schlüssel zu einem sicheren und vorhersehbaren System.</p>
      `
    },
    'regex-guide': {
      title: 'Der vollständige Leitfaden zu Regular Expressions: Praxis-Edition',
      description: 'Grundbausteine, häufige Muster, Performance-Fallstricke und Debugging-Methoden für reguläre Ausdrücke.',
      readingTime: '14 Min. Lesezeit',
      content: `
        <p>Reguläre Ausdrücke machen Textsuche und -transformation sehr mächtig, aber ein einziger Fehler kann die Wartung drastisch erschweren.</p>
        <h2>Grundbausteine</h2>
        <ul>
          <li><strong>Literale</strong> — Zeichen, die exakt übereinstimmen müssen</li>
          <li><strong>Zeichenklassen</strong> — Mengen wie <code>[a-z]</code> oder <code>\\d</code></li>
          <li><strong>Quantoren</strong> — definieren die Anzahl der Wiederholungen</li>
          <li><strong>Anker</strong> — fixieren Anfang und Ende des Strings</li>
        </ul>
        <h2>Häufige Muster in der Praxis</h2>
        <p>E-Mails, URLs, UUIDs, Datumsangaben und andere Werte mit wiederkehrendem Format lassen sich schnell mit Regex validieren — Format-Übereinstimmung garantiert jedoch keine semantische Korrektheit.</p>
        <h2>Performance-Fallstricke</h2>
        <p>Verschachtelte Quantoren können katastrophales Backtracking verursachen. Die Performance kann bei langen, nicht passenden Eingaben stark einbrechen — testen Sie komplexe Muster daher unbedingt mit langen Eingaben.</p>
        <h2>Debugging-Methoden</h2>
        <p>Komplexe Regular Expressions sollten mit Visualisierungs-Tools zerlegt und betrachtet werden. Lesbare Ausdrücke vereinfachen den Austausch im Team erheblich.</p>
      `
    },
    'curl-essentials': {
      title: 'Der wesentliche cURL-Leitfaden für Entwickler',
      description: 'Die wichtigsten cURL-Muster für API-Debugging, Authentifizierung, Session-Handling und Automatisierung.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>cURL ist eines der grundlegendsten Tools für API-Tests und Netzwerk-Debugging. Die direkte Sichtbarkeit von Requests macht es einfach, Anwendungsprobleme von Transport-Schicht-Problemen zu trennen.</p>
        <h2>Häufig verwendete Optionen</h2>
        <ul>
          <li><strong>-X</strong> — HTTP-Methode angeben</li>
          <li><strong>-H</strong> — Header hinzufügen</li>
          <li><strong>-d</strong> — Request-Body senden</li>
          <li><strong>-L</strong> — Weiterleitungen folgen</li>
          <li><strong>-v</strong> — Requests und Responses detailliert anzeigen</li>
        </ul>
        <h2>Mit JSON-APIs verwenden</h2>
        <p>Beim Senden von JSON muss der Header <code>Content-Type: application/json</code> explizit angegeben werden, sonst könnte der Server den Body anders interpretieren.</p>
        <h2>Authentifizierung und Sessions</h2>
        <p>Basic Auth wird über <code>-u</code> übergeben, Bearer-Tokens über den <code>Authorization</code>-Header. Für Cookies kann ein Cookie-Jar verwendet werden, um Login-Flows zu reproduzieren.</p>
        <h2>Debugging-Tipps</h2>
        <p>Bei unerwarteten Antworten empfiehlt sich der Einstieg über den Verbose-Modus und die Header-Ausgabe. DNS, TLS, Weiterleitungen und Authentifizierungsfehler lassen sich so isoliert untersuchen.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy (CSP) — Praxis-Implementierungsleitfaden',
      description: 'Wie Sie CSP zum Schutz gegen XSS sicher einführen und nonce, hash sowie report-only richtig einsetzen.',
      readingTime: '10 Min. Lesezeit',
      content: `
        <p>CSP ist eine der wirksamsten Sicherheitsschichten gegen XSS. Statt nur schädliche Eingaben zu blockieren, beschränkt sie direkt, was der Browser ausführen darf.</p>
        <h2>Kern-Direktiven</h2>
        <ul>
          <li><strong>default-src</strong> — Standard-Erlaubnisbereich</li>
          <li><strong>script-src</strong> — Skript-Herkunft</li>
          <li><strong>style-src</strong> — Style-Herkunft</li>
          <li><strong>connect-src</strong> — Netzwerkaufrufe</li>
          <li><strong>frame-ancestors</strong> — Iframe-Einbettung verhindern</li>
        </ul>
        <h2>Warum unsafe-inline vermieden werden sollte</h2>
        <p><code>'unsafe-inline'</code> ist einfach anzuwenden, schwächt aber den XSS-Schutz erheblich. Wenn möglich, sollte auf eine Nonce- oder Hash-basierte Richtlinie migriert werden.</p>
        <h2>Einführungsstrategie</h2>
        <p>Für bestehende Sites ist es sicherer, mit <code>Content-Security-Policy-Report-Only</code> zu beginnen statt direkt zu erzwingen. Sammeln Sie Reports, um den tatsächlichen Asset-Bestand zu erfassen, und erlauben Sie dann nur das wirklich Notwendige.</p>
        <h2>Fazit</h2>
        <p>CSP ist keine einmalig fertige Richtlinie, sondern eine schrittweise zu härtende. Standardmäßig ablehnen und nur Notwendiges hinzufügen — das ist die vorhersehbarste Vorgehensweise.</p>
      `
    },
  },
  pt: {
    'why-client-side-tools-matter': {
      title: 'Por que ferramentas client-side importam para a privacidade dos desenvolvedores',
      description: 'Por que processar dados sensíveis no navegador, em vez de enviá-los a um servidor remoto, é uma decisão de segurança fundamental.',
      readingTime: '5 min de leitura',
      content: `
        <p>Sempre que você cola dados sensíveis em uma ferramenta online, a primeira pergunta deve ser: "Para onde esses dados estão sendo enviados?" Se o processamento depende de um servidor, sua entrada fica exposta ao risco de armazenamento, análise e vazamento.</p>
        <h2>Processamento que fica no navegador</h2>
        <p>Ferramentas client-side utilizam a capacidade de processamento do próprio navegador para executar tarefas localmente. Formatar JSON, calcular hashes, gerar senhas — tudo isso pode ser feito sem enviar nenhum conteúdo a sistemas externos.</p>
        <h2>Principais benefícios</h2>
        <ul>
          <li><strong>Exposição mínima de dados</strong> — as entradas não saem do seu dispositivo</li>
          <li><strong>Mais rápido</strong> — sem latência de ida e volta ao servidor</li>
          <li><strong>Compatível com uso offline</strong> — baixa dependência de rede após o carregamento</li>
          <li><strong>Mais fácil para compliance</strong> — fluxos de dados simples e claros de explicar</li>
        </ul>
        <h2>Como verificar</h2>
        <p>Abra a aba Rede das ferramentas de desenvolvimento e observe se aparecem requisições externas durante o uso. Uma ferramenta realmente local não deve enviar o conteúdo processado a servidores externos, exceto para anúncios e ativos estáticos.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: 'Boas práticas de segurança de senhas em 2026',
      description: 'Os princípios essenciais para criar, armazenar e gerenciar senhas seguras no cenário de ameaças atual.',
      readingTime: '7 min de leitura',
      content: `
        <p>Mesmo com o avanço das passkeys e da biometria, as senhas continuam sendo o mecanismo central de autenticação na maioria dos serviços. Por isso, as políticas de senhas precisam ser revisadas com base nas ameaças atuais, e não em hábitos desatualizados.</p>
        <h2>Comprimento importa mais que complexidade forçada</h2>
        <p>As diretrizes modernas do NIST priorizam comprimento suficiente em vez de regras arbitrárias de caracteres especiais. Uma passphrase longa geralmente é mais forte do que uma senha curta e complexa.</p>
        <h2>Use um gerenciador de senhas</h2>
        <p>Memorizar credenciais únicas para cada serviço não é viável. Um gerenciador gera senhas aleatórias e as armazena com segurança, eliminando a reutilização — a maior vulnerabilidade em segurança pessoal.</p>
        <h2>Ative a autenticação de dois fatores</h2>
        <p>Mesmo senhas fortes podem ser comprometidas por phishing ou vazamentos de dados. O 2FA é a segunda linha de defesa quando uma senha é exposta.</p>
        <h2>Lista de verificação recomendada</h2>
        <ul>
          <li><strong>16 caracteres ou mais</strong> para contas importantes</li>
          <li><strong>Senha única por serviço</strong></li>
          <li><strong>Usar geração aleatória</strong></li>
          <li><strong>Armazenar com segurança</strong></li>
          <li><strong>Substituir imediatamente se comprometida</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'Entendendo JSON Web Tokens: guia para desenvolvedores',
      description: 'Aprenda rapidamente a estrutura de um JWT, quando usá-lo e quais erros de segurança evitar.',
      readingTime: '8 min de leitura',
      content: `
        <p>Um JWT é um formato compacto de token para transportar claims entre dois sistemas. É amplamente utilizado em fluxos de autenticação e autorização em aplicações web modernas.</p>
        <h2>Estrutura de um JWT</h2>
        <p>Um JWT é composto por três partes separadas por pontos: <code>header.payload.signature</code>. Cada parte é JSON codificado em Base64URL.</p>
        <ul>
          <li><strong>Header</strong> — tipo do token e algoritmo de assinatura</li>
          <li><strong>Payload</strong> — claims registradas, públicas e privadas</li>
          <li><strong>Signature</strong> — verifica que o token não foi alterado</li>
        </ul>
        <h2>Considerações de segurança</h2>
        <ul>
          <li><strong>Não coloque dados sensíveis no payload</strong> — JWT é codificação, não criptografia</li>
          <li><strong>Não pule a validação da assinatura</strong></li>
          <li><strong>Use tempos de expiração curtos</strong></li>
          <li><strong>Use chaves de assinatura suficientemente fortes</strong></li>
        </ul>
        <h2>Inspeção segura</h2>
        <p>Para inspecionar tokens, prefira uma ferramenta que funcione no navegador. Decodificadores server-side podem registrar tokens de produção nos logs.</p>
      `
    },
    'what-is-json': {
      title: 'O que é JSON? O guia completo para desenvolvedores',
      description: 'Estrutura, tipos básicos, diferenças em relação a XML/YAML e erros comuns de parsing — tudo sobre JSON de uma vez.',
      readingTime: '12 min de leitura',
      content: `
        <p>JSON é o formato mais utilizado para APIs, arquivos de configuração e troca de dados. Sua aparente simplicidade esconde um valor real para manutenibilidade e desempenho.</p>
        <h2>O essencial do JSON</h2>
        <p>JSON é uma representação de dados simples centrada em objetos e arrays. Por ser legível tanto para humanos quanto para máquinas, tornou-se a escolha padrão na maioria das aplicações web.</p>
        <h2>Por que é importante na prática</h2>
        <ul>
          <li><strong>Amigável para APIs</strong> — expressa requisições e respostas com clareza</li>
          <li><strong>Neutro em relação à linguagem</strong> — suportado nativamente por quase todas as linguagens</li>
          <li><strong>Leve e rápido</strong> — geralmente mais simples que XML</li>
          <li><strong>Fácil de validar</strong> — combina bem com schemas</li>
        </ul>
        <h2>Pontos de atenção</h2>
        <p>Vírgulas finais, aspas simples e chaves sem aspas não são permitidas em JSON. Datas são frequentemente representadas como strings em vez de tipos — usar ISO 8601 de forma consistente é a melhor prática.</p>
        <h2>Conclusão</h2>
        <p>JSON não é o formato mais elegante, mas é o mais fácil de compartilhar em equipe e de manter no longo prazo. Não subestime o valor da sua simplicidade.</p>
      `
    },
    'understanding-hashes': {
      title: 'Entendendo hashes criptográficos: MD5, SHA-256 e além',
      description: 'Propriedades das funções de hash, riscos de colisão e um guia para escolher o algoritmo certo para cada uso.',
      readingTime: '12 min de leitura',
      content: `
        <p>Hashes são amplamente usados para verificação de integridade de arquivos, assinaturas digitais e armazenamento de senhas — mas nem todos são adequados para os mesmos fins.</p>
        <h2>Características de um bom hash</h2>
        <ul>
          <li><strong>Determinístico</strong> — mesma entrada sempre produz a mesma saída</li>
          <li><strong>Rápido</strong> — baixo custo computacional</li>
          <li><strong>Unidirecional</strong> — difícil derivar a entrada original a partir da saída</li>
          <li><strong>Resistente a colisões</strong> — entradas diferentes raramente produzem a mesma saída</li>
        </ul>
        <h2>Por que MD5 é inseguro</h2>
        <p>O MD5 ainda existe em alguns casos de checksum legado, mas não é adequado para fins de segurança. Como colisões práticas são possíveis, ele não deve ser usado para verificação de confiança ou assinaturas.</p>
        <h2>Referência prática</h2>
        <p>Para verificação de integridade geral, SHA-256 é a escolha mais segura. SHA-512 pode ser considerado quando uma saída mais longa é necessária. Para armazenamento de senhas, é obrigatório usar hashes lentos dedicados, como bcrypt ou Argon2.</p>
        <h2>Pontos essenciais</h2>
        <p>Em hashing, a questão não é "o que está sendo hasheado", mas "por que está sendo hasheado". Escolher o algoritmo adequado ao objetivo é a chave para um sistema seguro e previsível.</p>
      `
    },
    'regex-guide': {
      title: 'Guia completo de expressões regulares: abordagem prática',
      description: 'Elementos básicos, padrões comuns, armadilhas de performance e métodos de debug de expressões regulares.',
      readingTime: '14 min de leitura',
      content: `
        <p>Expressões regulares tornam a busca e a transformação de texto extremamente poderosas, mas um único erro pode tornar a manutenção muito difícil.</p>
        <h2>Elementos fundamentais</h2>
        <ul>
          <li><strong>Literais</strong> — caracteres que precisam corresponder exatamente</li>
          <li><strong>Classes de caracteres</strong> — conjuntos como <code>[a-z]</code> ou <code>\\d</code></li>
          <li><strong>Quantificadores</strong> — definem o número de repetições</li>
          <li><strong>Âncoras</strong> — fixam o início e o fim da string</li>
        </ul>
        <h2>Padrões comuns na prática</h2>
        <p>Emails, URLs, UUIDs, datas e outros valores de formato repetível podem ser validados rapidamente com regex — mas correspondência de formato não garante validade semântica.</p>
        <h2>Armadilhas de performance</h2>
        <p>Quantificadores aninhados podem causar backtracking catastrófico. A performance pode cair drasticamente com entradas longas sem correspondência — teste sempre padrões complexos com entradas longas.</p>
        <h2>Métodos de debug</h2>
        <p>Expressões regulares complexas devem ser decompostas com ferramentas de visualização. Tornar uma expressão legível facilita muito o compartilhamento e a revisão em equipe.</p>
      `
    },
    'curl-essentials': {
      title: 'O guia essencial de cURL para desenvolvedores',
      description: 'Os padrões cURL essenciais para debug de APIs, autenticação, gerenciamento de sessões e automação.',
      readingTime: '12 min de leitura',
      content: `
        <p>O cURL é uma das ferramentas mais fundamentais para testes de API e debug de rede. A visibilidade direta das requisições facilita distinguir problemas da camada de aplicação dos problemas de transporte.</p>
        <h2>Opções mais utilizadas</h2>
        <ul>
          <li><strong>-X</strong> — especifica o método HTTP</li>
          <li><strong>-H</strong> — adiciona um cabeçalho</li>
          <li><strong>-d</strong> — envia o corpo da requisição</li>
          <li><strong>-L</strong> — segue redirecionamentos</li>
          <li><strong>-v</strong> — exibe detalhes das requisições e respostas</li>
        </ul>
        <h2>Uso com APIs JSON</h2>
        <p>Ao enviar JSON, é obrigatório especificar o cabeçalho <code>Content-Type: application/json</code>, caso contrário o servidor pode interpretar o corpo de outra forma.</p>
        <h2>Autenticação e sessões</h2>
        <p>Basic Auth é passado via <code>-u</code>, tokens Bearer via o cabeçalho <code>Authorization</code>. Para cookies, um cookie jar pode ser usado para reproduzir fluxos de login.</p>
        <h2>Dicas de debug</h2>
        <p>Quando a resposta for inesperada, comece pelo modo verbose e pela saída de cabeçalhos. É possível isolar problemas de DNS, TLS, redirecionamentos e falhas de autenticação.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Guia prático de implementação de Content Security Policy (CSP)',
      description: 'Como implementar CSP de forma segura para se defender contra XSS, com nonce, hash e report-only.',
      readingTime: '10 min de leitura',
      content: `
        <p>CSP é uma das camadas de segurança mais eficazes contra XSS. Em vez de apenas bloquear entradas maliciosas, ela restringe diretamente o que o navegador tem permissão para executar.</p>
        <h2>Diretivas principais</h2>
        <ul>
          <li><strong>default-src</strong> — escopo de permissão padrão</li>
          <li><strong>script-src</strong> — origem dos scripts</li>
          <li><strong>style-src</strong> — origem dos estilos</li>
          <li><strong>connect-src</strong> — chamadas de rede</li>
          <li><strong>frame-ancestors</strong> — prevenção de embedding em iframes</li>
        </ul>
        <h2>Por que evitar unsafe-inline</h2>
        <p><code>'unsafe-inline'</code> é fácil de aplicar mas enfraquece significativamente a proteção XSS. Quando possível, deve-se migrar para uma política baseada em nonce ou hash.</p>
        <h2>Estratégia de implantação</h2>
        <p>Para sites existentes, é mais seguro começar com <code>Content-Security-Policy-Report-Only</code> em vez de impor diretamente. Colete relatórios para entender o inventário real de ativos e depois permita apenas o estritamente necessário.</p>
        <h2>Conclusão</h2>
        <p>CSP não é uma política definida de uma vez por todas, mas sim reforçada progressivamente. Negar por padrão e adicionar apenas o necessário é a abordagem mais previsível.</p>
      `
    },
  },
  vi: {
    'why-client-side-tools-matter': {
      title: 'Tại sao công cụ phía máy khách quan trọng với quyền riêng tư của lập trình viên',
      description: 'Tìm hiểu tại sao xử lý dữ liệu nhạy cảm trong trình duyệt, thay vì gửi lên máy chủ từ xa, là một quyết định bảo mật quan trọng.',
      readingTime: '5 phút đọc',
      content: `
        <p>Mỗi khi bạn dán dữ liệu nhạy cảm vào một công cụ trực tuyến, câu hỏi đầu tiên cần đặt ra là: "Dữ liệu này sẽ đi đâu?" Nếu quá trình xử lý phụ thuộc vào máy chủ, dữ liệu đầu vào của bạn có nguy cơ bị lưu trữ, phân tích hoặc rò rỉ.</p>
        <h2>Xử lý ngay trong trình duyệt</h2>
        <p>Các công cụ phía máy khách tận dụng sức mạnh tính toán của chính trình duyệt để hoàn thành công việc cục bộ. Định dạng JSON, tính toán hash, tạo mật khẩu — tất cả đều có thể thực hiện mà không cần gửi nội dung đến bất kỳ hệ thống bên ngoài nào.</p>
        <h2>Lợi ích cốt lõi</h2>
        <ul>
          <li><strong>Giảm thiểu tiếp xúc dữ liệu</strong> — dữ liệu đầu vào không rời khỏi thiết bị của bạn</li>
          <li><strong>Nhanh hơn</strong> — không có độ trễ khứ hồi đến máy chủ</li>
          <li><strong>Thân thiện với chế độ ngoại tuyến</strong> — ít phụ thuộc vào mạng sau khi tải</li>
          <li><strong>Đơn giản hơn cho tuân thủ</strong> — luồng dữ liệu rõ ràng, dễ giải thích</li>
        </ul>
        <h2>Cách kiểm tra</h2>
        <p>Mở tab Mạng trong công cụ dành cho nhà phát triển và quan sát xem có yêu cầu bên ngoài nào xuất hiện khi sử dụng không. Một công cụ thực sự xử lý cục bộ không nên gửi nội dung đã xử lý đến máy chủ bên ngoài, ngoại trừ quảng cáo và tài nguyên tĩnh.</p>
      `
    },
    'password-security-best-practices-2026': {
      title: 'Thực hành bảo mật mật khẩu tốt nhất năm 2026',
      description: 'Các nguyên tắc cốt lõi để tạo, lưu trữ và quản lý mật khẩu an toàn trong bối cảnh mối đe dọa hiện đại.',
      readingTime: '7 phút đọc',
      content: `
        <p>Dù passkey và sinh trắc học đang phát triển, mật khẩu vẫn là cơ chế xác thực trung tâm ở hầu hết các dịch vụ. Vì vậy, chính sách mật khẩu cần được xem xét lại dựa trên mô hình mối đe dọa hiện tại, không phải thói quen lỗi thời.</p>
        <h2>Độ dài quan trọng hơn độ phức tạp bắt buộc</h2>
        <p>Hướng dẫn NIST hiện đại ưu tiên độ dài đủ thay vì các quy tắc ký tự đặc biệt tùy tiện. Một cụm mật khẩu dài thường mạnh hơn thực tế so với mật khẩu ngắn và phức tạp.</p>
        <h2>Sử dụng trình quản lý mật khẩu</h2>
        <p>Ghi nhớ thông tin đăng nhập duy nhất cho từng dịch vụ là không thực tế. Trình quản lý tạo mật khẩu ngẫu nhiên và lưu trữ an toàn, loại bỏ việc tái sử dụng — điểm yếu bảo mật lớn nhất.</p>
        <h2>Bật xác thực hai yếu tố</h2>
        <p>Ngay cả mật khẩu mạnh cũng có thể bị xâm phạm qua phishing và rò rỉ dữ liệu. 2FA là tuyến phòng thủ thứ hai khi mật khẩu bị lộ.</p>
        <h2>Danh sách kiểm tra khuyến nghị</h2>
        <ul>
          <li><strong>16 ký tự trở lên</strong> cho các tài khoản quan trọng</li>
          <li><strong>Mật khẩu duy nhất mỗi dịch vụ</strong></li>
          <li><strong>Sử dụng tạo ngẫu nhiên</strong></li>
          <li><strong>Lưu trữ an toàn trong trình quản lý</strong></li>
          <li><strong>Thay thế ngay lập tức nếu bị xâm phạm</strong></li>
        </ul>
      `
    },
    'understanding-json-web-tokens': {
      title: 'Hiểu JSON Web Token: hướng dẫn dành cho lập trình viên',
      description: 'Nắm nhanh cấu trúc của JWT, khi nào nên dùng và những lỗi bảo mật điển hình cần tránh.',
      readingTime: '8 phút đọc',
      content: `
        <p>JWT là định dạng token nhỏ gọn để truyền tải các claim giữa hai hệ thống. Nó được sử dụng rộng rãi trong luồng xác thực và phân quyền của các ứng dụng web hiện đại.</p>
        <h2>Cấu trúc JWT</h2>
        <p>JWT gồm ba phần được phân tách bằng dấu chấm: <code>header.payload.signature</code>. Mỗi phần là JSON được mã hóa Base64URL.</p>
        <ul>
          <li><strong>Header</strong> — loại token và thuật toán ký</li>
          <li><strong>Payload</strong> — các claim đã đăng ký, công khai và riêng tư</li>
          <li><strong>Signature</strong> — xác minh token chưa bị giả mạo</li>
        </ul>
        <h2>Lưu ý bảo mật</h2>
        <ul>
          <li><strong>Không đặt dữ liệu nhạy cảm vào payload</strong> — JWT là mã hóa, không phải mã hóa bảo mật</li>
          <li><strong>Không bỏ qua xác thực chữ ký</strong></li>
          <li><strong>Sử dụng thời gian hết hạn ngắn</strong></li>
          <li><strong>Sử dụng khóa ký đủ mạnh</strong></li>
        </ul>
        <h2>Kiểm tra an toàn</h2>
        <p>Khi kiểm tra token, nên dùng công cụ chạy trong trình duyệt. Các bộ giải mã phía máy chủ có thể ghi token sản xuất vào nhật ký.</p>
      `
    },
    'what-is-json': {
      title: 'JSON là gì? Hướng dẫn toàn diện dành cho lập trình viên',
      description: 'Cấu trúc, kiểu dữ liệu cơ bản, so sánh với XML/YAML và các lỗi phân tích phổ biến — tất cả về JSON trong một bài.',
      readingTime: '12 phút đọc',
      content: `
        <p>JSON là định dạng được sử dụng rộng rãi nhất cho API, tệp cấu hình và trao đổi dữ liệu. Sự đơn giản biểu kiến của nó ẩn chứa giá trị thực sự cho khả năng bảo trì và hiệu suất.</p>
        <h2>Cốt lõi của JSON</h2>
        <p>JSON là cách biểu diễn dữ liệu đơn giản tập trung vào đối tượng và mảng. Vì dễ đọc với cả con người lẫn máy móc, nó trở thành lựa chọn mặc định trong hầu hết các ứng dụng web.</p>
        <h2>Tại sao quan trọng trong thực tế</h2>
        <ul>
          <li><strong>Thân thiện với API</strong> — diễn đạt rõ ràng các yêu cầu và phản hồi</li>
          <li><strong>Trung lập về ngôn ngữ</strong> — được hỗ trợ gốc bởi hầu hết các ngôn ngữ</li>
          <li><strong>Nhẹ và nhanh</strong> — thường đơn giản hơn XML</li>
          <li><strong>Dễ xác thực</strong> — kết hợp tốt với schema</li>
        </ul>
        <h2>Điểm cần chú ý</h2>
        <p>Dấu phẩy cuối, nháy đơn và khóa không có nháy đều không được phép trong JSON. Ngày tháng thường được biểu diễn dưới dạng chuỗi thay vì kiểu — nên dùng nhất quán ISO 8601.</p>
        <h2>Tóm lại</h2>
        <p>JSON không phải định dạng ấn tượng nhất, nhưng là định dạng dễ chia sẻ nhất trong nhóm và dễ bảo trì lâu dài nhất. Đừng đánh giá thấp giá trị của sự đơn giản.</p>
      `
    },
    'understanding-hashes': {
      title: 'Hiểu hash mật mã học: MD5, SHA-256 và hơn thế nữa',
      description: 'Các đặc tính của hàm băm, rủi ro va chạm và hướng dẫn chọn thuật toán phù hợp theo mục đích.',
      readingTime: '12 phút đọc',
      content: `
        <p>Hash được dùng rộng rãi để xác minh tính toàn vẹn tệp, chữ ký số và lưu trữ mật khẩu — nhưng không phải tất cả đều phù hợp cho cùng một mục đích.</p>
        <h2>Đặc điểm của một hàm băm tốt</h2>
        <ul>
          <li><strong>Xác định</strong> — cùng đầu vào luôn cho cùng đầu ra</li>
          <li><strong>Nhanh</strong> — chi phí tính toán thấp</li>
          <li><strong>Một chiều</strong> — khó suy ra đầu vào gốc từ đầu ra</li>
          <li><strong>Kháng va chạm</strong> — rất khó để hai đầu vào khác nhau tạo ra cùng đầu ra</li>
        </ul>
        <h2>Tại sao MD5 không còn an toàn</h2>
        <p>MD5 vẫn tồn tại trong một số trường hợp checksum cũ, nhưng không còn phù hợp cho mục đích bảo mật. Vì va chạm thực tế có thể xây dựng được, nó không nên dùng để xác minh độ tin cậy hoặc ký.</p>
        <h2>Tiêu chuẩn thực tế</h2>
        <p>Để xác minh tính toàn vẹn thông thường, SHA-256 là lựa chọn an toàn nhất. SHA-512 có thể xem xét khi cần đầu ra dài hơn. Để lưu trữ mật khẩu, bắt buộc phải dùng hash chậm chuyên dụng như bcrypt hoặc Argon2.</p>
        <h2>Điểm mấu chốt</h2>
        <p>Trong băm dữ liệu, câu hỏi không phải là "băm cái gì" mà là "tại sao cần băm". Chọn thuật toán phù hợp với mục tiêu là chìa khóa xây dựng hệ thống an toàn và có thể dự đoán.</p>
      `
    },
    'regex-guide': {
      title: 'Hướng dẫn toàn diện về biểu thức chính quy: phiên bản thực chiến',
      description: 'Các yếu tố cơ bản, mẫu phổ biến, bẫy hiệu suất và phương pháp gỡ lỗi biểu thức chính quy.',
      readingTime: '14 phút đọc',
      content: `
        <p>Biểu thức chính quy làm cho việc tìm kiếm và chuyển đổi văn bản trở nên cực kỳ mạnh mẽ, nhưng chỉ cần một lỗi nhỏ có thể khiến việc bảo trì trở nên rất khó khăn.</p>
        <h2>Các yếu tố cơ bản</h2>
        <ul>
          <li><strong>Ký tự literal</strong> — các ký tự cần khớp chính xác</li>
          <li><strong>Lớp ký tự</strong> — tập hợp như <code>[a-z]</code> hay <code>\\d</code></li>
          <li><strong>Bộ đếm</strong> — xác định số lần lặp lại</li>
          <li><strong>Neo</strong> — cố định vị trí đầu và cuối chuỗi</li>
        </ul>
        <h2>Các mẫu phổ biến trong thực tế</h2>
        <p>Email, URL, UUID, ngày tháng và các giá trị có định dạng lặp lại đều có thể xác thực nhanh bằng regex — nhưng khớp định dạng không đảm bảo tính hợp lệ về ngữ nghĩa.</p>
        <h2>Bẫy hiệu suất</h2>
        <p>Các bộ đếm lồng nhau có thể gây ra backtracking thảm khốc. Hiệu suất có thể giảm mạnh với đầu vào dài không khớp — luôn kiểm tra các mẫu phức tạp với đầu vào dài.</p>
        <h2>Phương pháp gỡ lỗi</h2>
        <p>Biểu thức chính quy phức tạp nên được phân tách bằng công cụ trực quan hóa. Làm cho biểu thức dễ đọc giúp ích rất nhiều cho việc chia sẻ và xem xét trong nhóm.</p>
      `
    },
    'curl-essentials': {
      title: 'Hướng dẫn cURL thiết yếu dành cho lập trình viên',
      description: 'Các mẫu cURL cốt lõi cho gỡ lỗi API, xác thực, quản lý phiên và tự động hóa.',
      readingTime: '12 phút đọc',
      content: `
        <p>cURL là một trong những công cụ cơ bản nhất để kiểm tra API và gỡ lỗi mạng. Khả năng hiển thị trực tiếp các yêu cầu giúp dễ dàng phân biệt vấn đề ở tầng ứng dụng và tầng vận chuyển.</p>
        <h2>Các tùy chọn thường dùng</h2>
        <ul>
          <li><strong>-X</strong> — chỉ định phương thức HTTP</li>
          <li><strong>-H</strong> — thêm header</li>
          <li><strong>-d</strong> — gửi thân yêu cầu</li>
          <li><strong>-L</strong> — theo dõi chuyển hướng</li>
          <li><strong>-v</strong> — xem chi tiết yêu cầu và phản hồi</li>
        </ul>
        <h2>Dùng với API JSON</h2>
        <p>Khi gửi JSON, phải chỉ định rõ header <code>Content-Type: application/json</code>, nếu không máy chủ có thể diễn giải thân yêu cầu theo cách khác.</p>
        <h2>Xác thực và phiên</h2>
        <p>Basic Auth được truyền qua <code>-u</code>, Bearer token qua header <code>Authorization</code>. Với cookie, cookie jar có thể dùng để tái tạo luồng đăng nhập.</p>
        <h2>Mẹo gỡ lỗi</h2>
        <p>Khi phản hồi bất thường, hãy bắt đầu từ chế độ verbose và đầu ra header. Có thể cô lập các vấn đề DNS, TLS, chuyển hướng và lỗi xác thực riêng biệt.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Hướng dẫn triển khai thực chiến Content Security Policy (CSP)',
      description: 'Cách triển khai CSP an toàn để phòng thủ XSS, với nonce, hash và report-only.',
      readingTime: '10 phút đọc',
      content: `
        <p>CSP là một trong những tầng bảo mật hiệu quả nhất chống XSS. Thay vì chỉ chặn đầu vào độc hại, nó hạn chế trực tiếp những gì trình duyệt được phép thực thi.</p>
        <h2>Các chỉ thị cốt lõi</h2>
        <ul>
          <li><strong>default-src</strong> — phạm vi cho phép mặc định</li>
          <li><strong>script-src</strong> — nguồn script</li>
          <li><strong>style-src</strong> — nguồn style</li>
          <li><strong>connect-src</strong> — các cuộc gọi mạng</li>
          <li><strong>frame-ancestors</strong> — ngăn nhúng qua iframe</li>
        </ul>
        <h2>Tại sao nên tránh unsafe-inline</h2>
        <p><code>'unsafe-inline'</code> dễ áp dụng nhưng làm yếu đáng kể khả năng bảo vệ XSS. Khi có thể, nên chuyển sang chính sách dựa trên nonce hoặc hash.</p>
        <h2>Chiến lược triển khai</h2>
        <p>Với các trang web hiện có, an toàn hơn khi bắt đầu với <code>Content-Security-Policy-Report-Only</code> thay vì áp dụng cưỡng bức ngay. Thu thập báo cáo để hiểu danh sách tài nguyên thực tế, sau đó chỉ cho phép những gì thực sự cần thiết.</p>
        <h2>Tóm lại</h2>
        <p>CSP không phải chính sách hoàn thiện một lần mà là chính sách cần được tăng cường dần dần. Từ chối theo mặc định và chỉ thêm những gì cần thiết là hướng có thể dự đoán nhất.</p>
      `
    },
  },
};

const BLOG_LONG_LOCALE_OVERRIDES = {
  ko: {
    'what-is-json': {
      title: 'JSON이란 무엇인가? 개발자를 위한 완전 가이드',
      description: 'JSON 구조, 데이터 타입, JSON과 XML/YAML의 차이, 실무 팁과 흔한 파싱 실수를 정리합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>JSON은 현대 웹에서 가장 널리 쓰이는 데이터 포맷입니다. API 응답, 설정 파일, 배포 파이프라인까지 거의 모든 곳에서 만날 수 있습니다.</p>
        <h2>JSON의 성격</h2>
        <p>JSON은 사람이 읽기 쉽고 기계가 처리하기도 쉬운 포맷입니다. 구조는 단순하지만, 그 단순함 덕분에 서로 다른 시스템 사이에서 안정적으로 데이터를 주고받을 수 있습니다.</p>
        <h2>핵심 규칙</h2>
        <ul>
          <li>키와 문자열은 큰따옴표를 사용합니다</li>
          <li>마지막 쉼표는 허용되지 않습니다</li>
          <li>숫자, 문자열, 객체, 배열, boolean, null만 사용합니다</li>
        </ul>
        <h2>실무 팁</h2>
        <p>과도한 중첩은 피하고, 데이터 계약이 필요하면 JSON Schema로 구조를 명시하세요. 포맷 확인은 JSON Formatter로, 스키마 생성은 JSON Schema Studio로 처리하면 안전합니다.</p>
      `
    },
    'understanding-hashes': {
      title: '암호학적 해시 이해하기: MD5, SHA-256 그리고 그 이후',
      description: '해시 함수의 성질, 충돌 문제, 그리고 왜 알고리즘 선택이 중요한지 설명합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>해시는 데이터를 고정 길이의 지문처럼 바꾸는 도구입니다. 무결성 검증과 서명, 그리고 일부 보안 흐름에서 핵심 역할을 합니다.</p>
        <h2>왜 중요한가</h2>
        <p>좋은 해시 함수는 같은 입력에 같은 출력을 내고, 반대로 출력만 보고 원문을 되돌리기 어렵습니다. 또한 서로 다른 입력이 같은 결과를 만드는 충돌도 매우 어려워야 합니다.</p>
        <h2>알고리즘 선택</h2>
        <ul>
          <li>MD5는 보안 용도로는 이미 부적합합니다</li>
          <li>SHA-256은 무결성 검증의 기본값에 가깝습니다</li>
          <li>SHA-3는 다른 내부 구조를 가진 대안입니다</li>
        </ul>
        <h2>실무 기준</h2>
        <p>파일 검증에는 SHA-256 이상을 쓰고, 비밀번호 저장에는 bcrypt나 Argon2 같은 느린 해시를 사용하세요. Hash Calculator로 로컬에서 바로 확인할 수 있습니다.</p>
      `
    },
    'regex-guide': {
      title: '정규 표현식 실전 가이드',
      description: '정규식의 기본 구성 요소, 자주 쓰는 패턴, 그리고 성능 함정을 실전 관점에서 설명합니다.',
      readingTime: '14분 읽기',
      content: `
        <p>정규식은 텍스트 검색과 변환에 강력하지만, 복잡해질수록 읽기와 유지보수가 어려워집니다. 그래서 기본 요소를 분명하게 이해하는 것이 중요합니다.</p>
        <h2>기본 요소</h2>
        <ul>
          <li>Literal, character class, quantifier, anchor가 핵심입니다</li>
          <li>greedy와 lazy의 차이를 알아야 합니다</li>
          <li>lookahead와 lookbehind는 필요할 때만 씁니다</li>
        </ul>
        <h2>성능 주의</h2>
        <p>중첩 반복자는 catastrophic backtracking을 일으킬 수 있습니다. 긴 비매칭 문자열로 테스트하고, 복잡한 패턴은 먼저 시각화해 보세요.</p>
        <h2>실무 활용</h2>
        <p>로그 마스킹, 이메일 검증, 날짜 추출처럼 규칙이 명확한 작업에 특히 잘 맞습니다. Regex Studio로 패턴을 시각화하면 디버깅이 훨씬 쉬워집니다.</p>
      `
    },
    'curl-essentials': {
      title: '개발자를 위한 cURL: 핵심 명령과 테크닉',
      description: 'cURL 플래그, 인증 패턴, 디버깅 흐름을 실무 기준으로 정리한 가이드입니다.',
      readingTime: '12분 읽기',
      content: `
        <p>cURL은 API 테스트와 네트워크 디버깅의 표준 도구입니다. 요청과 응답을 투명하게 보여주기 때문에 문제를 좁혀 가기 좋습니다.</p>
        <h2>기본 사용법</h2>
        <ul>
          <li><code>-X</code>로 메서드를 지정합니다</li>
          <li><code>-H</code>로 헤더를 추가합니다</li>
          <li><code>-d</code>로 본문을 보냅니다</li>
          <li><code>-v</code>와 <code>--trace</code>로 문제를 추적합니다</li>
        </ul>
        <h2>인증과 세션</h2>
        <p>Basic Auth는 <code>-u</code>로, Bearer 토큰은 Authorization 헤더로 전달합니다. 쿠키 저장과 재사용도 가능해서 로그인 플로우 재현에 유용합니다.</p>
        <h2>실무 팁</h2>
        <p>큰 JSON은 파일로 분리하고, 리다이렉트와 타임아웃을 명시하세요. Curl Studio를 쓰면 복잡한 요청을 더 쉽게 만들고 해석할 수 있습니다.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy 실전 구현 가이드',
      description: 'nonce, hash, strict-dynamic을 이용해 CSP를 안전하게 도입하는 방법을 설명합니다.',
      readingTime: '10분 읽기',
      content: `
        <p>CSP는 XSS를 막는 가장 강력한 브라우저 보안 도구 중 하나입니다. 핵심은 허용할 리소스를 명확히 선언하고 나머지는 차단하는 것입니다.</p>
        <h2>핵심 지시어</h2>
        <ul>
          <li><code>default-src</code>는 기본 차단 정책을 만듭니다</li>
          <li><code>script-src</code>와 <code>style-src</code>가 가장 중요합니다</li>
          <li><code>connect-src</code>와 <code>frame-ancestors</code>도 자주 필요합니다</li>
        </ul>
        <h2>도입 방법</h2>
        <p>기존 사이트에는 Report-Only로 먼저 넣어 위반 보고를 수집한 뒤, nonce나 hash를 적용해 강제 모드로 옮기세요. <code>'unsafe-inline'</code>은 가능한 한 피해야 합니다.</p>
        <h2>현대적 보강</h2>
        <p>strict-dynamic, Trusted Types, upgrade-insecure-requests를 조합하면 실전 방어력이 높아집니다. CSP Builder로 정책을 구성하면 실수를 줄일 수 있습니다.</p>
      `
    },
    'password-security-guide': {
      title: '2026년 비밀번호 보안: 개발자가 알아야 할 핵심',
      description: '엔트로피, NIST 기준, Argon2, MFA, 패스키까지 현대적인 비밀번호 보안 원칙을 정리합니다.',
      readingTime: '12분 읽기',
      content: `
        <p>현대의 비밀번호 보안은 복잡성 규칙보다 길이, 랜덤성, 피싱 저항성에 더 큰 비중을 둡니다. 개발자는 사용자 경험과 방어력을 동시에 고려해야 합니다.</p>
        <h2>길이가 중요합니다</h2>
        <p>짧고 복잡한 문자열보다 긴 패스프레이즈가 실제로 더 강한 경우가 많습니다. 핵심은 예측 가능한 패턴을 줄이는 것입니다.</p>
        <h2>저장은 반드시 느린 해시로</h2>
        <p>비밀번호 저장에는 SHA-256 같은 빠른 해시가 아니라 Argon2나 bcrypt를 사용해야 합니다. salt는 기본이며, 필요하다면 pepper도 고려할 수 있습니다.</p>
        <h2>MFA와 패스키</h2>
        <p>중요 계정은 비밀번호만으로 충분하지 않습니다. WebAuthn과 패스키는 피싱 저항성이 높아 가장 강한 선택지입니다.</p>
        <h2>운영 체크리스트</h2>
        <ul>
          <li>긴 비밀번호 허용</li>
          <li>유출 비밀번호 차단</li>
          <li>근거 없는 강제 주기 변경 최소화</li>
          <li>로그인과 재설정에 rate limiting 적용</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT 완전 해설: 구조, 보안, 흔한 실수',
      description: 'JWT의 세 부분 구조, 검증 포인트, revocation 전략, 구현 실수를 실무 기준으로 설명합니다.',
      readingTime: '13분 읽기',
      content: `
        <p>JWT는 상태를 줄여 주지만, 잘못 구현하면 회수하기 어려운 인증 정보가 됩니다. 편의성보다 검증 규칙이 더 중요합니다.</p>
        <h2>세 부분 구조</h2>
        <p>JWT는 header, payload, signature 세 부분으로 구성됩니다. payload는 읽을 수 있으므로 민감정보를 담아서는 안 됩니다.</p>
        <h2>필수 검증 항목</h2>
        <ul>
          <li>허용 알고리즘 화이트리스트</li>
          <li><code>exp</code>, <code>iss</code>, <code>aud</code> 확인</li>
          <li>짧은 access token 수명</li>
          <li>필요 시 refresh token 분리</li>
        </ul>
        <h2>회수 전략</h2>
        <p>JWT는 본질적으로 무효화가 어렵기 때문에 짧은 TTL, 블랙리스트, 비밀키 회전 같은 전략이 필요합니다.</p>
        <h2>실무 팁</h2>
        <p>운영 토큰 분석은 브라우저 기반 JWT Inspector처럼 로컬에서 동작하는 도구로 처리하는 편이 안전합니다.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'X.509 인증서 이해하기: TLS/SSL은 실제로 어떻게 동작하나',
      description: '인증서 체인, CA 신뢰, SAN, CSR, 폐기 상태까지 PKI의 핵심을 개발자 관점에서 설명합니다.',
      readingTime: '10분 읽기',
      content: `
        <p>X.509 인증서는 공개키를 특정 주체와 연결하는 문서입니다. 브라우저 자물쇠 아이콘 뒤에는 이 인증서 체인과 신뢰 저장소가 있습니다.</p>
        <h2>핵심 필드</h2>
        <p>주체, 발급자, 유효기간, 공개키, 서명 알고리즘, SAN이 연결의 신뢰를 결정합니다. 특히 SAN은 현대 인증서에서 사실상 필수입니다.</p>
        <h2>체인 오브 트러스트</h2>
        <p>브라우저는 leaf 인증서뿐 아니라 intermediate와 root까지 포함해 검증합니다. 중간 인증서가 빠지면 모바일과 CLI 클라이언트에서 실패하기 쉽습니다.</p>
        <h2>CSR과 운영</h2>
        <p>인증서를 받으려면 먼저 개인키를 만들고 CSR을 생성해야 합니다. 가장 중요한 점은 개인키를 외부로 내보내지 않는 것입니다.</p>
        <h2>자주 터지는 문제</h2>
        <ul>
          <li>인증서 만료</li>
          <li>불완전한 체인</li>
          <li>호스트 이름 불일치</li>
          <li>신뢰되지 않는 루트</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: 어떤 인증 프로토콜을 선택해야 하나',
      description: '엔터프라이즈 SSO, API 권한 위임, 현대적 로그인 흐름에서 세 프로토콜의 차이를 정리합니다.',
      readingTime: '11분 읽기',
      content: `
        <p>SAML, OAuth 2.0, OIDC는 이름이 비슷해 보여도 목적이 다릅니다. 무엇이 인증이고 무엇이 권한 위임인지 먼저 구분해야 설계가 흔들리지 않습니다.</p>
        <h2>SAML</h2>
        <p>SAML은 기업용 SSO에서 강력한 표준입니다. XML 기반이라 무겁지만 엔터프라이즈 디렉터리 연동에는 여전히 강합니다.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth는 인증이 아니라 권한 위임 프레임워크입니다. 제3자 앱이 사용자 비밀번호 없이 제한된 접근권을 얻도록 설계되었습니다.</p>
        <h2>OIDC</h2>
        <p>OIDC는 OAuth 위에 신원 계층을 추가한 프로토콜입니다. ID Token과 discovery 덕분에 현대 웹과 모바일 로그인에 잘 맞습니다.</p>
        <h2>선택 기준</h2>
        <ul>
          <li>B2B 기업 SSO면 SAML</li>
          <li>API 접근 권한 위임이면 OAuth</li>
          <li>현대적 로그인과 사용자 신원이면 OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: '크론 표현식 마스터하기: 일정 자동화를 제대로 다루는 법',
      description: '크론 문법, 특수 문자, 타임존 함정, 운영 모니터링까지 실무에 필요한 핵심을 설명합니다.',
      readingTime: '9분 읽기',
      content: `
        <p>크론 표현식은 단순해 보이지만 운영 사고를 자주 만드는 영역입니다. 문법보다 더 중요한 것은 타임존, 재시도, 중복 실행 같은 운영 조건입니다.</p>
        <h2>기본 구조</h2>
        <p>일반적인 크론은 분, 시, 일, 월, 요일 다섯 필드로 구성됩니다. 각 필드에서 와일드카드, 범위, 증분, 목록을 조합해 일정을 표현합니다.</p>
        <h2>자주 헷갈리는 부분</h2>
        <p>day-of-month와 day-of-week를 동시에 넣을 때의 동작은 오해가 많습니다. 배포 전에는 실제 next run을 반드시 확인해야 합니다.</p>
        <h2>운영 시 주의점</h2>
        <ul>
          <li>서버 타임존 확인</li>
          <li>중복 실행 방지</li>
          <li>로그와 헬스체크 추가</li>
          <li>실패 시 재시도 정책 분리</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: '정규표현식 입문: 실용적인 초보자 가이드',
      description: '로그 파싱, 데이터 검증, 텍스트 처리에 자주 쓰는 regex 기초를 빠르게 익히는 가이드입니다.',
      readingTime: '10분 읽기',
      content: `
        <p>정규표현식은 텍스트 패턴을 찾고 바꾸는 데 매우 강력한 도구입니다. 처음에는 난해해 보이지만, 핵심 기호만 익히면 반복 작업을 크게 줄일 수 있습니다.</p>
        <h2>기본 구성 요소</h2>
        <ul>
          <li><code>.</code> — 임의의 한 글자</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — 반복 수량자</li>
          <li><code>[abc]</code> — 문자 집합</li>
          <li><code>^</code>, <code>$</code> — 시작과 끝 앵커</li>
        </ul>
        <h2>실전 예시</h2>
        <p>이메일 검증, IP 주소 추출, 로그 타임스탬프 검색처럼 규칙이 분명한 문자열에 특히 잘 맞습니다.</p>
        <h2>흔한 함정</h2>
        <ul>
          <li>중첩 수량자로 인한 성능 저하</li>
          <li>greedy와 lazy 매칭 혼동</li>
          <li>문자 클래스 이스케이프 누락</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: '해시 알고리즘 비교: MD5 vs SHA-256 vs SHA-3',
      description: '대표적인 해시 알고리즘의 차이와, 각 알고리즘을 언제 써야 하는지 간단하게 정리합니다.',
      readingTime: '6분 읽기',
      content: `
        <p>해시 함수는 데이터를 고정 길이 결과로 바꿔 무결성 확인과 서명에 사용됩니다. 하지만 알고리즘마다 안전성과 용도가 다릅니다.</p>
        <h2>MD5</h2>
        <p>MD5는 빠르지만 보안 용도로는 깨진 알고리즘입니다. 의도적 충돌 공격이 가능하므로 신뢰 검증에는 부적합합니다.</p>
        <h2>SHA-256</h2>
        <p>SHA-256은 현재 가장 널리 쓰이는 기본 선택지입니다. 인증서, 코드 서명, 파일 무결성 확인 등에서 안정적인 기준이 됩니다.</p>
        <h2>SHA-3</h2>
        <p>SHA-3는 SHA-2와 내부 구조가 다른 대안입니다. 장기적인 방어 여지를 확보하려는 경우 유용합니다.</p>
        <h2>빠른 선택 기준</h2>
        <ul>
          <li>파일 무결성: SHA-256</li>
          <li>비밀번호 저장: bcrypt / Argon2</li>
          <li>장기적 대안 검토: SHA-3</li>
        </ul>
      `
    }
  },
  ja: {
    'what-is-json': {
      title: 'JSONとは何か: 開発者向け完全ガイド',
      description: 'JSON の構造、データ型、XML/YAML との違い、実務での注意点を整理します。',
      readingTime: '12分',
      content: `
        <p>JSON は現代 Web で最も広く使われるデータ形式のひとつです。API レスポンス、設定ファイル、ビルドツールまで幅広く使われています。</p>
        <h2>JSON の特徴</h2>
        <p>JSON は人間にも機械にも読みやすい構造を持ち、シンプルで予測しやすいのが強みです。シンプルだからこそ、異なるシステム間で安定して使えます。</p>
        <h2>基本ルール</h2>
        <ul>
          <li>キーと文字列はダブルクォートを使います</li>
          <li>末尾のカンマは許されません</li>
          <li>使える値は string / number / object / array / boolean / null です</li>
        </ul>
        <h2>実務のコツ</h2>
        <p>ネストを深くしすぎないこと、そして構造が重要なデータは JSON Schema で契約を明示することが大切です。JSON Formatter で文法を確認し、必要なら JSON Schema Studio を使ってください。</p>
      `
    },
    'understanding-hashes': {
      title: '暗号学的ハッシュを理解する: MD5、SHA-256、その先へ',
      description: 'ハッシュ関数の性質、衝突問題、アルゴリズム選定の重要性を解説します。',
      readingTime: '12分',
      content: `
        <p>ハッシュはデータを固定長の指紋のような値に変換します。整合性確認や署名、セキュリティ用途で重要な役割を持ちます。</p>
        <h2>なぜ重要か</h2>
        <p>良いハッシュ関数は、同じ入力に同じ出力を返し、出力から元データを逆算しにくく、衝突を起こしにくい必要があります。</p>
        <h2>アルゴリズムの選び方</h2>
        <ul>
          <li>MD5 はセキュリティ用途では不適切です</li>
          <li>SHA-256 は整合性確認の基本選択肢です</li>
          <li>SHA-3 は別構造の代替手段です</li>
        </ul>
        <h2>実務基準</h2>
        <p>ファイル検証は SHA-256 以上、パスワード保存は bcrypt や Argon2 を使ってください。Hash Calculator でローカルに確認できます。</p>
      `
    },
    'regex-guide': {
      title: '正規表現の実践ガイド',
      description: '正規表現の基本要素、よく使うパターン、性能上の落とし穴を実務視点でまとめます。',
      readingTime: '14分',
      content: `
        <p>正規表現はテキスト検索や変換に強力ですが、複雑になるほど読みにくくなります。基本要素をはっきり理解することが重要です。</p>
        <h2>基本要素</h2>
        <ul>
          <li>Literal, character class, quantifier, anchor が基本です</li>
          <li>greedy と lazy の違いを理解してください</li>
          <li>lookahead / lookbehind は必要なときだけ使いましょう</li>
        </ul>
        <h2>性能の注意点</h2>
        <p>ネストした繰り返しは catastrophic backtracking を引き起こすことがあります。長い非一致文字列でテストし、複雑なパターンは先に可視化してください。</p>
        <h2>実務での活用</h2>
        <p>ログのマスク、メール検証、日時抽出など、ルールが明確な場面で特に有効です。Regex Studio で可視化するとデバッグしやすくなります。</p>
      `
    },
    'curl-essentials': {
      title: '開発者のための cURL: 必須コマンドとテクニック',
      description: 'cURL の主要フラグ、認証パターン、デバッグの流れを実務向けに整理します。',
      readingTime: '12分',
      content: `
        <p>cURL は API テストとネットワークデバッグの標準ツールです。リクエストとレスポンスが透けて見えるので、問題の切り分けに向いています。</p>
        <h2>基本の使い方</h2>
        <ul>
          <li><code>-X</code> でメソッド指定</li>
          <li><code>-H</code> でヘッダー追加</li>
          <li><code>-d</code> で本文送信</li>
          <li><code>-v</code> や <code>--trace</code> で追跡</li>
        </ul>
        <h2>認証とセッション</h2>
        <p>Basic Auth は <code>-u</code>、Bearer トークンは Authorization ヘッダーで送ります。Cookie の保存と再利用もできるので、ログインフローの再現に役立ちます。</p>
        <h2>実務のコツ</h2>
        <p>大きな JSON はファイルに分け、リダイレクトやタイムアウトを明示してください。Curl Studio を使うと複雑な要求を扱いやすくなります。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy 実装ガイド',
      description: 'nonce、hash、strict-dynamic を使って CSP を安全に導入する方法を説明します。',
      readingTime: '10分',
      content: `
        <p>CSP は XSS を防ぐ強力なブラウザセキュリティ機能です。重要なのは、何を許可するかを明示して、それ以外を既定で止めることです。</p>
        <h2>主なディレクティブ</h2>
        <ul>
          <li><code>default-src</code> で既定の許可範囲を決めます</li>
          <li><code>script-src</code> と <code>style-src</code> が特に重要です</li>
          <li><code>connect-src</code> と <code>frame-ancestors</code> もよく使います</li>
        </ul>
        <h2>導入の進め方</h2>
        <p>既存サイトには Report-Only で先に入れて、違反レポートを集めてから nonce や hash を使った強制モードへ移行してください。<code>'unsafe-inline'</code> はできるだけ避けるべきです。</p>
        <h2>現代的な強化</h2>
        <p>strict-dynamic、Trusted Types、upgrade-insecure-requests を組み合わせると防御力が上がります。CSP Builder で構成するとミスを減らせます。</p>
      `
    },
    'password-security-guide': {
      title: '2026 年のパスワードセキュリティ: 開発者が押さえるべきこと',
      description: 'エントロピー、NIST、Argon2、MFA、パスキーまで、現代的なパスワード防御を整理します。',
      readingTime: '12分',
      content: `
        <p>現代のパスワードセキュリティは、複雑さルールよりも長さ、ランダム性、フィッシング耐性を重視します。使い勝手と防御力の両立が重要です。</p>
        <h2>長さが重要</h2>
        <p>短く複雑な文字列より、長いパスフレーズの方が強いことが多いです。ユーザーが予測しやすいパターンに流れない設計が必要です。</p>
        <h2>保存は遅いハッシュで</h2>
        <p>保存時には SHA-256 のような高速ハッシュではなく、Argon2 や bcrypt を使います。salt は必須で、必要なら pepper も検討できます。</p>
        <h2>MFA とパスキー</h2>
        <p>重要アカウントでは、パスワード単独では不十分です。WebAuthn やパスキーは高いフィッシング耐性を持ちます。</p>
        <h2>運用チェック</h2>
        <ul>
          <li>長いパスワードを許可する</li>
          <li>漏えい済みパスワードを拒否する</li>
          <li>根拠のない定期変更をやめる</li>
          <li>ログインと再設定に rate limiting を入れる</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT 徹底解説: 構造、セキュリティ、よくある落とし穴',
      description: 'JWT の 3 部構造、検証ポイント、失効戦略、実装ミスを実務視点で整理します。',
      readingTime: '13分',
      content: `
        <p>JWT は便利ですが、実装を誤ると回収しづらい認証情報になります。手軽さより、検証規律の方が重要です。</p>
        <h2>3 つの部分</h2>
        <p>JWT は header、payload、signature の 3 部で構成されます。payload は読める前提なので、機密情報は入れてはいけません。</p>
        <h2>必須の検証</h2>
        <ul>
          <li>署名アルゴリズムのホワイトリスト</li>
          <li><code>exp</code>、<code>iss</code>、<code>aud</code> の確認</li>
          <li>短命な access token</li>
          <li>必要なら refresh token の分離</li>
        </ul>
        <h2>失効の考え方</h2>
        <p>JWT は本質的に失効が難しいため、短い TTL、ブラックリスト、鍵ローテーションなどの戦略が必要です。</p>
        <h2>実務のコツ</h2>
        <p>調査にはブラウザ内で動く JWT Inspector のようなローカルツールを使う方が安全です。運用トークンを外部デコーダへ送るべきではありません。</p>
      `
    },
    'x509-certificates-explained': {
      title: 'X.509 証明書を理解する: TLS/SSL はどう動くのか',
      description: '証明書チェーン、CA 信頼、SAN、CSR、失効確認まで PKI の核を整理します。',
      readingTime: '10分',
      content: `
        <p>X.509 証明書は公開鍵を主体へ結び付けるための文書です。ブラウザの鍵アイコンの裏側には、この証明書チェーンと信頼ストアがあります。</p>
        <h2>重要なフィールド</h2>
        <p>Subject、Issuer、Validity、Public Key、Signature Algorithm、SAN などが接続の信頼性を決めます。特に SAN は現代の証明書運用で欠かせません。</p>
        <h2>チェーン・オブ・トラスト</h2>
        <p>ブラウザは leaf 証明書だけでなく intermediate と root まで含めて検証します。中間証明書が欠けると、一部クライアントではすぐ失敗します。</p>
        <h2>CSR と運用</h2>
        <p>証明書取得にはまず秘密鍵を作り、CSR を生成します。重要なのは秘密鍵をサーバー外へ出さないことです。</p>
        <h2>よくある障害</h2>
        <ul>
          <li>証明書の期限切れ</li>
          <li>不完全なチェーン</li>
          <li>ホスト名の不一致</li>
          <li>信頼されないルート</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: どの認証プロトコルを選ぶべきか',
      description: '企業向け SSO、API 権限委譲、現代的ログインでの 3 プロトコルの違いを整理します。',
      readingTime: '11分',
      content: `
        <p>SAML、OAuth 2.0、OIDC は似て見えても目的が異なります。何が認証で何が認可なのかを切り分けることが設計の出発点です。</p>
        <h2>SAML</h2>
        <p>SAML は企業向け SSO の代表格です。XML ベースで重い反面、企業ディレクトリ連携や属性連携に強みがあります。</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth は認証ではなく認可フレームワークです。第三者アプリへ限定的なアクセス権を渡すために設計されています。</p>
        <h2>OIDC</h2>
        <p>OIDC は OAuth の上に ID レイヤーを追加したものです。ID Token と discovery のおかげで、現代的な Web / モバイルログインに向いています。</p>
        <h2>選び方</h2>
        <ul>
          <li>B2B の企業 SSO なら SAML</li>
          <li>API への権限委譲なら OAuth</li>
          <li>現代的なログイン体験なら OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'cron 式を使いこなす: 自動実行を安全に運用するために',
      description: 'cron 構文、特殊文字、タイムゾーンの罠、監視の考え方まで実務向けに整理します。',
      readingTime: '9分',
      content: `
        <p>cron は短い記法ですが、運用事故の原因にもなりやすい領域です。文法だけでなく、タイムゾーンや再試行、重複起動まで考える必要があります。</p>
        <h2>基本構造</h2>
        <p>標準的な cron は分、時、日、月、曜日の 5 フィールドです。ワイルドカード、範囲、増分、リストを組み合わせて予定を表現します。</p>
        <h2>混乱しやすい点</h2>
        <p>特に day-of-month と day-of-week を同時に使うと誤解が起きやすいので、投入前に next run を必ず確認してください。</p>
        <h2>運用上の注意</h2>
        <ul>
          <li>サーバーのタイムゾーン確認</li>
          <li>重複実行の防止</li>
          <li>ログとヘルスチェックの追加</li>
          <li>失敗時の再試行設計</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: '正規表現入門: 実践的な初心者ガイド',
      description: 'ログ解析、入力検証、テキスト処理で役立つ regex の基本を短く整理します。',
      readingTime: '10分',
      content: `
        <p>正規表現は文字列パターンを検索・変換するための強力な道具です。最初は難しく見えても、基本記号を覚えるだけで作業効率が大きく変わります。</p>
        <h2>基本要素</h2>
        <ul>
          <li><code>.</code> — 任意の 1 文字</li>
          <li><code>*</code>、<code>+</code>、<code>?</code> — 繰り返し</li>
          <li><code>[abc]</code> — 文字クラス</li>
          <li><code>^</code>、<code>$</code> — 先頭と末尾</li>
        </ul>
        <h2>実用例</h2>
        <p>メール形式、IP アドレス、ログのタイムスタンプなど、規則が明確な文字列で特に便利です。</p>
        <h2>よくある落とし穴</h2>
        <ul>
          <li>ネストした量指定による性能悪化</li>
          <li>greedy と lazy の混同</li>
          <li>文字クラスのエスケープ漏れ</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'ハッシュアルゴリズム比較: MD5 vs SHA-256 vs SHA-3',
      description: '代表的なハッシュアルゴリズムの違いと、用途ごとの選び方を簡潔に整理します。',
      readingTime: '6分',
      content: `
        <p>ハッシュ関数はデータを固定長の値へ変換し、整合性確認や署名に使われます。ただし、アルゴリズムごとに安全性と用途は異なります。</p>
        <h2>MD5</h2>
        <p>MD5 は高速ですが、安全用途では壊れています。意図的な衝突攻撃が可能なため、信頼確認には向きません。</p>
        <h2>SHA-256</h2>
        <p>SHA-256 は現在の標準的な選択肢です。証明書、コード署名、ファイル整合性確認などで広く使われます。</p>
        <h2>SHA-3</h2>
        <p>SHA-3 は SHA-2 と異なる内部構造を持つ代替手段です。将来の防御余地を広げたい場合に検討できます。</p>
        <h2>すぐ使える選び方</h2>
        <ul>
          <li>ファイル整合性: SHA-256</li>
          <li>パスワード保存: bcrypt / Argon2</li>
          <li>別系統の代替: SHA-3</li>
        </ul>
      `
    }
  },
  es: {
    'what-is-json': {
      title: 'Qué es JSON: guía completa para desarrolladores',
      description: 'Repaso de la estructura de JSON, tipos de datos, diferencias con XML/YAML y errores comunes de parseo.',
      readingTime: '12 min de lectura',
      content: `
        <p>JSON es uno de los formatos de datos más usados en la web moderna. Lo verás en respuestas de API, archivos de configuración y herramientas de desarrollo.</p>
        <h2>Qué aporta JSON</h2>
        <p>JSON es fácil de leer para humanos y simple de procesar para máquinas. Esa combinación lo hace ideal para intercambiar datos entre sistemas distintos.</p>
        <h2>Reglas básicas</h2>
        <ul>
          <li>Las claves y las cadenas usan comillas dobles</li>
          <li>No se permiten comas finales</li>
          <li>Solo existen string, number, object, array, boolean y null</li>
        </ul>
        <h2>Consejos prácticos</h2>
        <p>Evita la anidación excesiva y usa JSON Schema cuando necesites un contrato claro. JSON Formatter te ayuda a validar la sintaxis y JSON Schema Studio a definir la estructura.</p>
      `
    },
    'understanding-hashes': {
      title: 'Entender los hashes criptográficos: MD5, SHA-256 y más',
      description: 'Explicación de propiedades de los hashes, problemas de colisión y por qué la elección del algoritmo importa.',
      readingTime: '12 min de lectura',
      content: `
        <p>Un hash convierte datos en una huella de longitud fija. Es fundamental para verificar integridad, firmar datos y sostener varios flujos de seguridad.</p>
        <h2>Por qué importan</h2>
        <p>Un buen hash debe ser determinista, rápido, de una sola dirección y resistente a colisiones. Si falla en una de estas propiedades, su utilidad cae rápidamente.</p>
        <h2>Elegir algoritmo</h2>
        <ul>
          <li>MD5 no sirve para seguridad</li>
          <li>SHA-256 es una opción estándar para integridad</li>
          <li>SHA-3 ofrece una estructura interna distinta como alternativa</li>
        </ul>
        <h2>Uso real</h2>
        <p>Para verificar archivos usa SHA-256 o superior. Para contraseñas usa bcrypt o Argon2, no un hash rápido. Puedes comprobarlo localmente con Hash Calculator.</p>
      `
    },
    'regex-guide': {
      title: 'Guía práctica de expresiones regulares',
      description: 'Los elementos básicos de regex, patrones comunes y trampas de rendimiento explicados con enfoque práctico.',
      readingTime: '14 min de lectura',
      content: `
        <p>Las expresiones regulares son muy potentes para buscar y transformar texto, pero se vuelven difíciles de mantener cuando crecen demasiado. Conviene entender primero los bloques básicos.</p>
        <h2>Elementos básicos</h2>
        <ul>
          <li>Literal, character class, quantifier y anchor forman la base</li>
          <li>Distingue entre greedy y lazy</li>
          <li>Usa lookahead/lookbehind solo cuando aporte claridad</li>
        </ul>
        <h2>Riesgos de rendimiento</h2>
        <p>Los cuantificadores anidados pueden causar catastrophic backtracking. Prueba con cadenas largas que no coincidan y visualiza patrones complejos antes de producirlos.</p>
        <h2>Aplicaciones prácticas</h2>
        <p>Sirven para validar emails, extraer fechas o enmascarar logs. Regex Studio ayuda a ver el flujo del patrón y a depurarlo más rápido.</p>
      `
    },
    'curl-essentials': {
      title: 'cURL para desarrolladores: comandos y técnicas esenciales',
      description: 'Resumen práctico de flags de cURL, autenticación y depuración para APIs modernas.',
      readingTime: '12 min de lectura',
      content: `
        <p>cURL es la herramienta estándar para probar APIs y depurar tráfico de red. Permite ver con claridad qué estás enviando y qué devuelve el servidor.</p>
        <h2>Uso básico</h2>
        <ul>
          <li><code>-X</code> para el método</li>
          <li><code>-H</code> para cabeceras</li>
          <li><code>-d</code> para el cuerpo</li>
          <li><code>-v</code> y <code>--trace</code> para depurar</li>
        </ul>
        <h2>Autenticación y sesiones</h2>
        <p>Basic Auth se envía con <code>-u</code> y los tokens Bearer en la cabecera Authorization. También puedes guardar cookies y reutilizarlas para simular sesiones completas.</p>
        <h2>Consejos prácticos</h2>
        <p>Separa payloads grandes en archivos, especifica timeouts y sigue redirecciones cuando lo necesites. Curl Studio simplifica la construcción y lectura de comandos complejos.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Guía práctica para implementar Content Security Policy',
      description: 'Cómo introducir CSP de forma segura usando nonce, hash y strict-dynamic.',
      readingTime: '10 min de lectura',
      content: `
        <p>CSP es una de las defensas más potentes contra XSS. La idea central es permitir solo recursos explícitos y bloquear el resto por defecto.</p>
        <h2>Directivas principales</h2>
        <ul>
          <li><code>default-src</code> define la base de la política</li>
          <li><code>script-src</code> y <code>style-src</code> suelen ser las más críticas</li>
          <li><code>connect-src</code> y <code>frame-ancestors</code> también importan mucho</li>
        </ul>
        <h2>Cómo desplegarla</h2>
        <p>Empieza con Report-Only para ver qué rompería la política, luego pasa a nonce o hash para el contenido inline necesario. Evita <code>'unsafe-inline'</code> siempre que puedas.</p>
        <h2>Refuerzos modernos</h2>
        <p>Combina strict-dynamic, Trusted Types y upgrade-insecure-requests para una postura más sólida. CSP Builder ayuda a construir reglas sin errores.</p>
      `
    },
    'password-security-guide': {
      title: 'Seguridad de contraseñas en 2026: lo que todo desarrollador debe saber',
      description: 'Entropía, guías NIST, Argon2, MFA y passkeys explicados desde una perspectiva práctica.',
      readingTime: '12 min de lectura',
      content: `
        <p>La seguridad moderna de contraseñas ya no gira en torno a reglas arbitrarias de complejidad. Importan más la longitud, la aleatoriedad y la resistencia al phishing.</p>
        <h2>La longitud gana</h2>
        <p>Una passphrase larga suele ser más fuerte y usable que una contraseña corta llena de símbolos. Lo importante es evitar patrones previsibles del usuario.</p>
        <h2>Almacenar con hashes lentos</h2>
        <p>Para almacenar contraseñas no uses hashes rápidos como SHA-256. Debes usar Argon2 o bcrypt, con salt y, si aplica, una estrategia complementaria como pepper.</p>
        <h2>MFA y passkeys</h2>
        <p>En cuentas sensibles, la contraseña por sí sola no basta. WebAuthn y las passkeys ofrecen una defensa mucho más fuerte contra phishing y robo de credenciales.</p>
        <h2>Checklist operativo</h2>
        <ul>
          <li>Permitir contraseñas largas</li>
          <li>Bloquear contraseñas filtradas</li>
          <li>Evitar rotaciones forzadas sin motivo</li>
          <li>Aplicar rate limiting al login y al reset</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT explicado: estructura, seguridad y errores comunes',
      description: 'Las tres partes del JWT, los puntos de validación obligatorios y las trampas más comunes en producción.',
      readingTime: '13 min de lectura',
      content: `
        <p>JWT simplifica la autenticación sin estado, pero también hace más fácil distribuir credenciales difíciles de revocar. La disciplina de validación importa más que la comodidad.</p>
        <h2>Las tres partes</h2>
        <p>Un JWT tiene header, payload y signature. El payload no está cifrado por defecto, así que no debe contener secretos ni información sensible.</p>
        <h2>Qué debes validar siempre</h2>
        <ul>
          <li>Algoritmos permitidos explícitamente</li>
          <li><code>exp</code>, <code>iss</code> y <code>aud</code></li>
          <li>Tokens de acceso de vida corta</li>
          <li>Refresh tokens separados cuando sea necesario</li>
        </ul>
        <h2>Revocación y operación</h2>
        <p>Como un JWT ya emitido es difícil de retirar, conviene combinar TTL corto, rotación de claves y, cuando haga falta, listas de revocación.</p>
        <h2>Consejo práctico</h2>
        <p>Inspecciona tokens con herramientas locales como JWT Inspector. Subir tokens reales a decodificadores externos es una mala práctica operativa.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'Certificados X.509: cómo funciona realmente TLS/SSL',
      description: 'Cadena de certificados, confianza de CA, SAN, CSR y revocación explicados de forma práctica.',
      readingTime: '10 min de lectura',
      content: `
        <p>Un certificado X.509 vincula una clave pública con una identidad. Detrás del candado del navegador hay una cadena de confianza completa que hace posible TLS.</p>
        <h2>Campos importantes</h2>
        <p>Subject, issuer, validez, clave pública, algoritmo de firma y SAN son los campos que más afectan el despliegue real. SAN es especialmente crítico hoy.</p>
        <h2>Cadena de confianza</h2>
        <p>El navegador no valida solo el certificado final. También revisa los intermedios hasta una raíz confiable. Una cadena incompleta puede romper clientes móviles o herramientas CLI.</p>
        <h2>CSR y operación</h2>
        <p>Para emitir un certificado primero generas la clave privada y luego el CSR. La clave privada nunca debe salir del entorno que controlas.</p>
        <h2>Fallos habituales</h2>
        <ul>
          <li>Certificados caducados</li>
          <li>Cadenas incompletas</li>
          <li>Nombres de host que no coinciden</li>
          <li>Raíces no confiables</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: cómo elegir el protocolo correcto',
      description: 'Diferencias clave entre SSO empresarial, delegación de acceso a APIs e identidad moderna.',
      readingTime: '11 min de lectura',
      content: `
        <p>SAML, OAuth 2.0 y OIDC no compiten por el mismo problema. Antes de elegir, hay que separar claramente autenticación, identidad y autorización.</p>
        <h2>SAML</h2>
        <p>SAML sigue siendo una base fuerte para SSO empresarial. Es más pesado por su base XML, pero encaja muy bien con directorios corporativos y requisitos B2B.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth no es un protocolo de login sino un framework de autorización. Sirve para delegar acceso limitado a recursos sin compartir la contraseña del usuario.</p>
        <h2>OIDC</h2>
        <p>OIDC añade una capa de identidad encima de OAuth. Gracias al ID Token y al discovery, es la opción natural para experiencias modernas de inicio de sesión.</p>
        <h2>Regla rápida</h2>
        <ul>
          <li>SSO corporativo: SAML</li>
          <li>Acceso delegado a APIs: OAuth</li>
          <li>Login moderno e identidad: OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'Dominar expresiones cron: programa tareas como un profesional',
      description: 'Sintaxis, caracteres especiales, trampas de zona horaria y prácticas operativas para cron.',
      readingTime: '9 min de lectura',
      content: `
        <p>Las expresiones cron parecen simples, pero suelen generar errores operativos costosos. No basta con conocer la sintaxis; también hay que pensar en zona horaria, reintentos y solapamientos.</p>
        <h2>Estructura básica</h2>
        <p>El formato clásico usa cinco campos: minuto, hora, día del mes, mes y día de la semana. A partir de ahí se combinan rangos, listas, incrementos y comodines.</p>
        <h2>Qué suele confundir</h2>
        <p>La interacción entre día del mes y día de la semana genera muchos errores. Antes de desplegar, conviene revisar siempre las próximas ejecuciones reales.</p>
        <h2>Buenas prácticas operativas</h2>
        <ul>
          <li>Verificar la zona horaria del entorno</li>
          <li>Evitar ejecuciones solapadas</li>
          <li>Añadir logs y health checks</li>
          <li>Diseñar reintentos por separado</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: 'Expresiones regulares: guía práctica para principiantes',
      description: 'Introducción rápida a los fundamentos de regex con ejemplos útiles para validación, logs y limpieza de texto.',
      readingTime: '10 min de lectura',
      content: `
        <p>Las expresiones regulares permiten buscar y transformar patrones de texto con muy pocas líneas. Parecen crípticas al principio, pero los símbolos básicos cubren una gran parte del trabajo diario.</p>
        <h2>Bloques básicos</h2>
        <ul>
          <li><code>.</code> — cualquier carácter</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — repetición</li>
          <li><code>[abc]</code> — clase de caracteres</li>
          <li><code>^</code> y <code>$</code> — inicio y fin</li>
        </ul>
        <h2>Ejemplos útiles</h2>
        <p>Son muy prácticas para validar emails, buscar direcciones IP o extraer marcas de tiempo en logs.</p>
        <h2>Errores frecuentes</h2>
        <ul>
          <li>Backtracking catastrófico por cuantificadores anidados</li>
          <li>Confundir comportamiento greedy y lazy</li>
          <li>Olvidar escapes en clases de caracteres</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'Comparativa de algoritmos hash: MD5 vs SHA-256 vs SHA-3',
      description: 'Resumen corto de las diferencias entre algoritmos hash populares y cuándo conviene usar cada uno.',
      readingTime: '6 min de lectura',
      content: `
        <p>Las funciones hash convierten datos en salidas de longitud fija para verificar integridad y construir firmas. Elegir el algoritmo correcto depende del objetivo.</p>
        <h2>MD5</h2>
        <p>MD5 es rápido pero inseguro para propósitos de confianza. Las colisiones prácticas lo descartan para seguridad real.</p>
        <h2>SHA-256</h2>
        <p>SHA-256 es la elección por defecto más común para integridad, certificados y firma de artefactos.</p>
        <h2>SHA-3</h2>
        <p>SHA-3 ofrece una construcción interna distinta y puede servir como alternativa moderna cuando se busca diversidad criptográfica.</p>
        <h2>Regla rápida</h2>
        <ul>
          <li>Integridad de archivos: SHA-256</li>
          <li>Contraseñas: bcrypt / Argon2</li>
          <li>Alternativa estructural: SHA-3</li>
        </ul>
      `
    }
  },
  'zh-CN': {
    'what-is-json': {
      title: 'JSON 是什么？开发者完全指南',
      description: 'JSON 结构、数据类型、与 XML/YAML 的差异、实践技巧与常见解析错误。',
      readingTime: '12 分钟阅读',
      content: `
        <p>JSON 是现代 Web 中使用最广泛的数据格式之一。API 响应、配置文件、构建工具——几乎随处可见。</p>
        <h2>JSON 的特点</h2>
        <p>JSON 兼具人类可读性和机器易处理性，结构简洁且可预期，正是这种简单性使它能在不同系统之间稳定地传递数据。</p>
        <h2>基本规则</h2>
        <ul>
          <li>键和字符串使用双引号</li>
          <li>不允许尾随逗号</li>
          <li>值类型只有 string、number、object、array、boolean、null</li>
        </ul>
        <h2>实践技巧</h2>
        <p>避免过深的嵌套，数据契约重要时用 JSON Schema 明确结构。用 JSON Formatter 验证语法，用 JSON Schema Studio 定义结构规范。</p>
      `
    },
    'understanding-hashes': {
      title: '理解密码学哈希：MD5、SHA-256 及更多',
      description: '哈希函数的特性、碰撞问题以及为何算法选择至关重要。',
      readingTime: '12 分钟阅读',
      content: `
        <p>哈希将数据转换为固定长度的"指纹"。在完整性验证、签名和部分安全流程中扮演核心角色。</p>
        <h2>为何重要</h2>
        <p>好的哈希函数对相同输入给出相同输出，且难以从输出反推原始数据，同时不同输入产生相同结果的碰撞极难构造。</p>
        <h2>算法选择</h2>
        <ul>
          <li>MD5 已不适用于安全场景</li>
          <li>SHA-256 是完整性验证的基本选择</li>
          <li>SHA-3 是具有不同内部结构的备选方案</li>
        </ul>
        <h2>实践标准</h2>
        <p>文件验证用 SHA-256 或更高，密码存储用 bcrypt 或 Argon2 等慢速哈希。可用 Hash Calculator 在本地直接验证。</p>
      `
    },
    'regex-guide': {
      title: '正则表达式实战指南',
      description: '正则表达式的基本构成要素、常用模式以及性能陷阱的实践解析。',
      readingTime: '14 分钟阅读',
      content: `
        <p>正则表达式对文本搜索和转换极为强大，但越复杂越难阅读和维护。清晰理解基本要素是关键。</p>
        <h2>基本要素</h2>
        <ul>
          <li>Literal、character class、quantifier、anchor 是核心</li>
          <li>理解 greedy 与 lazy 的区别</li>
          <li>lookahead 和 lookbehind 仅在必要时使用</li>
        </ul>
        <h2>性能注意</h2>
        <p>嵌套量词可能引发灾难性回溯。用长的不匹配字符串测试，复杂模式先做可视化再上线。</p>
        <h2>实际应用</h2>
        <p>日志脱敏、邮箱验证、日期提取等规则明确的场景尤为适合。使用 Regex Studio 可视化模式能大幅加快调试。</p>
      `
    },
    'curl-essentials': {
      title: '开发者必备 cURL：核心命令与技巧',
      description: '以实战为导向梳理 cURL 标志、认证模式和调试流程。',
      readingTime: '12 分钟阅读',
      content: `
        <p>cURL 是 API 测试和网络调试的标准工具。请求和响应一目了然，便于缩小问题范围。</p>
        <h2>基本用法</h2>
        <ul>
          <li><code>-X</code> 指定方法</li>
          <li><code>-H</code> 添加请求头</li>
          <li><code>-d</code> 发送请求体</li>
          <li><code>-v</code> 和 <code>--trace</code> 追踪问题</li>
        </ul>
        <h2>认证与会话</h2>
        <p>Basic Auth 用 <code>-u</code>，Bearer token 用 Authorization 请求头。支持 Cookie 的存储和复用，便于重现登录流程。</p>
        <h2>实践技巧</h2>
        <p>大型 JSON 单独存文件，明确指定重定向和超时。使用 Curl Studio 能更轻松地构建和解读复杂请求。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy 实战实施指南',
      description: '使用 nonce、hash 和 strict-dynamic 安全引入 CSP 的方法。',
      readingTime: '10 分钟阅读',
      content: `
        <p>CSP 是防御 XSS 最强大的浏览器安全功能之一。核心在于明确声明允许的资源，默认拦截其余一切。</p>
        <h2>核心指令</h2>
        <ul>
          <li><code>default-src</code> 建立默认拦截策略</li>
          <li><code>script-src</code> 和 <code>style-src</code> 最为关键</li>
          <li><code>connect-src</code> 和 <code>frame-ancestors</code> 也常用</li>
        </ul>
        <h2>部署方式</h2>
        <p>现有站点先以 Report-Only 模式收集违规报告，再应用 nonce 或 hash 迁移到强制模式。应尽量避免 <code>'unsafe-inline'</code>。</p>
        <h2>现代化加固</h2>
        <p>组合使用 strict-dynamic、Trusted Types、upgrade-insecure-requests 可显著提升实战防御能力。使用 CSP Builder 构建策略能减少失误。</p>
      `
    },
    'password-security-guide': {
      title: '2026 年密码安全：开发者必知核心',
      description: '从熵值、NIST 标准、Argon2、MFA 到 passkey，系统梳理现代密码防御原则。',
      readingTime: '12 分钟阅读',
      content: `
        <p>现代密码安全更注重长度、随机性和抗钓鱼能力，而非复杂度规则。开发者需同时兼顾用户体验和防御强度。</p>
        <h2>长度最重要</h2>
        <p>长密码短语通常比短而复杂的密码更强。核心是减少可预测的模式。</p>
        <h2>存储必须用慢速哈希</h2>
        <p>密码存储应使用 Argon2 或 bcrypt，而非 SHA-256 等快速哈希。salt 是基本要求，必要时还可考虑 pepper。</p>
        <h2>MFA 与 passkey</h2>
        <p>重要账户仅凭密码还不够。WebAuthn 和 passkey 的抗钓鱼能力最强，是最优选择。</p>
        <h2>运营检查清单</h2>
        <ul>
          <li>允许长密码</li>
          <li>拒绝已泄露的密码</li>
          <li>减少无依据的强制定期更换</li>
          <li>对登录和重置接口启用限流</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT 全面解析：结构、安全与常见错误',
      description: 'JWT 三段结构、验证要点、吊销策略及实现误区的实战解析。',
      readingTime: '13 分钟阅读',
      content: `
        <p>JWT 能减少状态维护，但实现有误就会产生难以吊销的认证信息。验证规则比便利性更重要。</p>
        <h2>三段结构</h2>
        <p>JWT 由 header、payload、signature 三部分组成。payload 是可读的，因此不能包含敏感信息。</p>
        <h2>必须验证的项目</h2>
        <ul>
          <li>算法白名单</li>
          <li>检查 <code>exp</code>、<code>iss</code>、<code>aud</code></li>
          <li>access token 生命周期要短</li>
          <li>必要时分离 refresh token</li>
        </ul>
        <h2>吊销策略</h2>
        <p>JWT 本质上难以无效化，需要短 TTL、黑名单、密钥轮换等配套策略。</p>
        <h2>实践技巧</h2>
        <p>分析生产 token 应使用 JWT Inspector 等本地浏览器工具，避免将真实 token 发送到外部解码器。</p>
      `
    },
    'x509-certificates-explained': {
      title: '理解 X.509 证书：TLS/SSL 实际如何运作',
      description: '从开发者角度解析证书链、CA 信任、SAN、CSR 和吊销状态等 PKI 核心概念。',
      readingTime: '10 分钟阅读',
      content: `
        <p>X.509 证书是将公钥与特定主体绑定的文档。浏览器锁形图标背后，是这套证书链和信任存储的支撑。</p>
        <h2>核心字段</h2>
        <p>主体、颁发者、有效期、公钥、签名算法和 SAN 共同决定连接的可信度。SAN 在现代证书中几乎是必须项。</p>
        <h2>信任链</h2>
        <p>浏览器不仅验证叶证书，还会验证到 intermediate 和 root。中间证书缺失容易导致移动端和 CLI 客户端失败。</p>
        <h2>CSR 与运营</h2>
        <p>申请证书前需先生成私钥和 CSR。最重要的是不要将私钥导出到外部。</p>
        <h2>常见故障</h2>
        <ul>
          <li>证书过期</li>
          <li>不完整的证书链</li>
          <li>主机名不匹配</li>
          <li>不受信任的根证书</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC：如何选择认证协议',
      description: '梳理三种协议在企业 SSO、API 权限委托和现代登录场景中的差异。',
      readingTime: '11 分钟阅读',
      content: `
        <p>SAML、OAuth 2.0 和 OIDC 看似相似，目的却各不相同。先分清什么是认证、什么是授权，设计才不会摇摆。</p>
        <h2>SAML</h2>
        <p>SAML 是企业 SSO 的强力标准。基于 XML 较重，但在企业目录集成方面依然强劲。</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth 是授权框架，而非认证协议。设计用于在不暴露用户密码的前提下，授予第三方应用有限访问权。</p>
        <h2>OIDC</h2>
        <p>OIDC 是在 OAuth 上添加身份层的协议。凭借 ID Token 和 discovery，非常适合现代 Web 和移动端登录。</p>
        <h2>选择标准</h2>
        <ul>
          <li>B2B 企业 SSO 选 SAML</li>
          <li>API 访问权限委托选 OAuth</li>
          <li>现代登录与用户身份选 OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: '掌握 Cron 表达式：正确处理计划任务自动化',
      description: '梳理 cron 语法、特殊字符、时区陷阱和运营监控等实战要点。',
      readingTime: '9 分钟阅读',
      content: `
        <p>Cron 表达式看似简单，却是运营事故的常见来源。比语法更重要的是时区、重试和并发执行等运营条件。</p>
        <h2>基本结构</h2>
        <p>标准 cron 由分钟、小时、日期、月份、星期五个字段组成。通过通配符、范围、步长和列表的组合来表达计划。</p>
        <h2>容易混淆的地方</h2>
        <p>同时使用 day-of-month 和 day-of-week 时行为常被误解。部署前务必确认实际的下次执行时间。</p>
        <h2>运营注意事项</h2>
        <ul>
          <li>确认服务器时区</li>
          <li>防止并发重复执行</li>
          <li>添加日志和健康检查</li>
          <li>单独设计失败重试策略</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: '正则表达式入门：实用初学者指南',
      description: '快速掌握日志解析、数据验证、文本处理中常用的 regex 基础。',
      readingTime: '10 分钟阅读',
      content: `
        <p>正则表达式是查找和替换文本模式的强大工具。初看晦涩，但掌握核心符号便能大幅减少重复工作。</p>
        <h2>基本构成</h2>
        <ul>
          <li><code>.</code> — 任意单个字符</li>
          <li><code>*</code>、<code>+</code>、<code>?</code> — 重复量词</li>
          <li><code>[abc]</code> — 字符集</li>
          <li><code>^</code>、<code>$</code> — 开始和结束锚点</li>
        </ul>
        <h2>实战示例</h2>
        <p>邮箱验证、IP 地址提取、日志时间戳搜索等规则清晰的字符串场景尤为适合。</p>
        <h2>常见陷阱</h2>
        <ul>
          <li>嵌套量词导致的性能下降</li>
          <li>混淆 greedy 与 lazy 匹配</li>
          <li>字符类中遗漏转义</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: '哈希算法比较：MD5 vs SHA-256 vs SHA-3',
      description: '简要梳理主流哈希算法的差异及各算法适用场景。',
      readingTime: '6 分钟阅读',
      content: `
        <p>哈希函数将数据转换为固定长度结果，用于完整性验证和签名。但不同算法的安全性和适用场景各异。</p>
        <h2>MD5</h2>
        <p>MD5 快速但已被攻破，不可用于安全目的。可构造实际碰撞，不适合信任验证。</p>
        <h2>SHA-256</h2>
        <p>SHA-256 是当前最广泛使用的基本选择，在证书、代码签名和文件完整性验证中均可靠。</p>
        <h2>SHA-3</h2>
        <p>SHA-3 具有与 SHA-2 不同的内部结构，是寻求长期防御余地时的备选方案。</p>
        <h2>快速选择标准</h2>
        <ul>
          <li>文件完整性：SHA-256</li>
          <li>密码存储：bcrypt / Argon2</li>
          <li>结构性备选：SHA-3</li>
        </ul>
      `
    }
  },
  'zh-TW': {
    'what-is-json': {
      title: 'JSON 是什麼？開發者完全指南',
      description: 'JSON 結構、資料型別、與 XML/YAML 的差異、實踐技巧與常見解析錯誤。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>JSON 是現代 Web 中使用最廣泛的資料格式之一。API 回應、設定檔、建置工具——幾乎隨處可見。</p>
        <h2>JSON 的特點</h2>
        <p>JSON 兼具人類可讀性和機器易處理性，結構簡潔且可預期，正是這種簡單性使它能在不同系統之間穩定地傳遞資料。</p>
        <h2>基本規則</h2>
        <ul>
          <li>鍵和字串使用雙引號</li>
          <li>不允許尾隨逗號</li>
          <li>值型別只有 string、number、object、array、boolean、null</li>
        </ul>
        <h2>實踐技巧</h2>
        <p>避免過深的巢狀，資料契約重要時用 JSON Schema 明確結構。用 JSON Formatter 驗證語法，用 JSON Schema Studio 定義結構規範。</p>
      `
    },
    'understanding-hashes': {
      title: '理解密碼學雜湊：MD5、SHA-256 及更多',
      description: '雜湊函數的特性、碰撞問題以及為何演算法選擇至關重要。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>雜湊將資料轉換為固定長度的「指紋」。在完整性驗證、簽名和部分安全流程中扮演核心角色。</p>
        <h2>為何重要</h2>
        <p>好的雜湊函數對相同輸入給出相同輸出，且難以從輸出反推原始資料，同時不同輸入產生相同結果的碰撞極難構造。</p>
        <h2>演算法選擇</h2>
        <ul>
          <li>MD5 已不適用於安全場景</li>
          <li>SHA-256 是完整性驗證的基本選擇</li>
          <li>SHA-3 是具有不同內部結構的備選方案</li>
        </ul>
        <h2>實踐標準</h2>
        <p>檔案驗證用 SHA-256 或更高，密碼儲存用 bcrypt 或 Argon2 等慢速雜湊。可用 Hash Calculator 在本地直接驗證。</p>
      `
    },
    'regex-guide': {
      title: '正規表示式實戰指南',
      description: '正規表示式的基本構成要素、常用模式以及效能陷阱的實踐解析。',
      readingTime: '14 分鐘閱讀',
      content: `
        <p>正規表示式對文字搜尋和轉換極為強大，但越複雜越難閱讀和維護。清晰理解基本要素是關鍵。</p>
        <h2>基本要素</h2>
        <ul>
          <li>Literal、character class、quantifier、anchor 是核心</li>
          <li>理解 greedy 與 lazy 的區別</li>
          <li>lookahead 和 lookbehind 僅在必要時使用</li>
        </ul>
        <h2>效能注意</h2>
        <p>巢狀量詞可能引發災難性回溯。用長的不匹配字串測試，複雜模式先做視覺化再上線。</p>
        <h2>實際應用</h2>
        <p>日誌遮罩、郵件驗證、日期提取等規則明確的場景尤為適合。使用 Regex Studio 視覺化模式能大幅加快除錯速度。</p>
      `
    },
    'curl-essentials': {
      title: '開發者必備 cURL：核心指令與技巧',
      description: '以實戰為導向梳理 cURL 標誌、驗證模式和除錯流程。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>cURL 是 API 測試和網路除錯的標準工具。請求和回應一目了然，便於縮小問題範圍。</p>
        <h2>基本用法</h2>
        <ul>
          <li><code>-X</code> 指定方法</li>
          <li><code>-H</code> 新增請求標頭</li>
          <li><code>-d</code> 傳送請求體</li>
          <li><code>-v</code> 和 <code>--trace</code> 追蹤問題</li>
        </ul>
        <h2>驗證與工作階段</h2>
        <p>Basic Auth 用 <code>-u</code>，Bearer token 用 Authorization 請求標頭。支援 Cookie 的儲存和複用，便於重現登入流程。</p>
        <h2>實踐技巧</h2>
        <p>大型 JSON 單獨存檔，明確指定重新導向和逾時。使用 Curl Studio 能更輕鬆地建立和解讀複雜請求。</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Content Security Policy 實戰實施指南',
      description: '使用 nonce、hash 和 strict-dynamic 安全引入 CSP 的方法。',
      readingTime: '10 分鐘閱讀',
      content: `
        <p>CSP 是防禦 XSS 最強大的瀏覽器安全功能之一。核心在於明確宣告允許的資源，預設攔截其餘一切。</p>
        <h2>核心指令</h2>
        <ul>
          <li><code>default-src</code> 建立預設攔截策略</li>
          <li><code>script-src</code> 和 <code>style-src</code> 最為關鍵</li>
          <li><code>connect-src</code> 和 <code>frame-ancestors</code> 也常用</li>
        </ul>
        <h2>部署方式</h2>
        <p>現有網站先以 Report-Only 模式收集違規報告，再應用 nonce 或 hash 遷移到強制模式。應盡量避免 <code>'unsafe-inline'</code>。</p>
        <h2>現代化加固</h2>
        <p>組合使用 strict-dynamic、Trusted Types、upgrade-insecure-requests 可顯著提升實戰防禦能力。使用 CSP Builder 建構策略能減少失誤。</p>
      `
    },
    'password-security-guide': {
      title: '2026 年密碼安全：開發者必知核心',
      description: '從熵值、NIST 標準、Argon2、MFA 到 passkey，系統梳理現代密碼防禦原則。',
      readingTime: '12 分鐘閱讀',
      content: `
        <p>現代密碼安全更注重長度、隨機性和抗釣魚能力，而非複雜度規則。開發者需同時兼顧使用者體驗和防禦強度。</p>
        <h2>長度最重要</h2>
        <p>長密碼短語通常比短而複雜的密碼更強。核心是減少可預測的模式。</p>
        <h2>儲存必須用慢速雜湊</h2>
        <p>密碼儲存應使用 Argon2 或 bcrypt，而非 SHA-256 等快速雜湊。salt 是基本要求，必要時還可考慮 pepper。</p>
        <h2>MFA 與 passkey</h2>
        <p>重要帳戶僅憑密碼還不夠。WebAuthn 和 passkey 的抗釣魚能力最強，是最優選擇。</p>
        <h2>運營檢查清單</h2>
        <ul>
          <li>允許長密碼</li>
          <li>拒絕已外洩的密碼</li>
          <li>減少無依據的強制定期更換</li>
          <li>對登入和重設介面啟用限流</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT 全面解析：結構、安全與常見錯誤',
      description: 'JWT 三段結構、驗證要點、吊銷策略及實作誤區的實戰解析。',
      readingTime: '13 分鐘閱讀',
      content: `
        <p>JWT 能減少狀態維護，但實作有誤就會產生難以吊銷的認證資訊。驗證規則比便利性更重要。</p>
        <h2>三段結構</h2>
        <p>JWT 由 header、payload、signature 三部分組成。payload 是可讀的，因此不能包含敏感資訊。</p>
        <h2>必須驗證的項目</h2>
        <ul>
          <li>演算法白名單</li>
          <li>檢查 <code>exp</code>、<code>iss</code>、<code>aud</code></li>
          <li>access token 生命週期要短</li>
          <li>必要時分離 refresh token</li>
        </ul>
        <h2>吊銷策略</h2>
        <p>JWT 本質上難以無效化，需要短 TTL、黑名單、金鑰輪換等配套策略。</p>
        <h2>實踐技巧</h2>
        <p>分析正式環境 token 應使用 JWT Inspector 等本地瀏覽器工具，避免將真實 token 傳送到外部解碼器。</p>
      `
    },
    'x509-certificates-explained': {
      title: '理解 X.509 憑證：TLS/SSL 實際如何運作',
      description: '從開發者角度解析憑證鏈、CA 信任、SAN、CSR 和吊銷狀態等 PKI 核心概念。',
      readingTime: '10 分鐘閱讀',
      content: `
        <p>X.509 憑證是將公鑰與特定主體綁定的文件。瀏覽器鎖形圖示背後，是這套憑證鏈和信任儲存的支撐。</p>
        <h2>核心欄位</h2>
        <p>主體、頒發者、有效期間、公鑰、簽名演算法和 SAN 共同決定連線的可信度。SAN 在現代憑證中幾乎是必須項。</p>
        <h2>信任鏈</h2>
        <p>瀏覽器不僅驗證葉憑證，還會驗證到 intermediate 和 root。中間憑證缺失容易導致行動端和 CLI 用戶端失敗。</p>
        <h2>CSR 與運營</h2>
        <p>申請憑證前需先產生私鑰和 CSR。最重要的是不要將私鑰匯出到外部。</p>
        <h2>常見故障</h2>
        <ul>
          <li>憑證過期</li>
          <li>不完整的憑證鏈</li>
          <li>主機名稱不符</li>
          <li>不受信任的根憑證</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC：如何選擇驗證協議',
      description: '梳理三種協議在企業 SSO、API 權限委託和現代登入場景中的差異。',
      readingTime: '11 分鐘閱讀',
      content: `
        <p>SAML、OAuth 2.0 和 OIDC 看似相似，目的卻各不相同。先分清什麼是驗證、什麼是授權，設計才不會搖擺。</p>
        <h2>SAML</h2>
        <p>SAML 是企業 SSO 的強力標準。基於 XML 較重，但在企業目錄整合方面依然強勁。</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth 是授權框架，而非驗證協議。設計用於在不暴露使用者密碼的前提下，授予第三方應用有限存取權。</p>
        <h2>OIDC</h2>
        <p>OIDC 是在 OAuth 上新增身份層的協議。憑借 ID Token 和 discovery，非常適合現代 Web 和行動端登入。</p>
        <h2>選擇標準</h2>
        <ul>
          <li>B2B 企業 SSO 選 SAML</li>
          <li>API 存取權限委託選 OAuth</li>
          <li>現代登入與使用者身份選 OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: '掌握 Cron 表達式：正確處理計劃任務自動化',
      description: '梳理 cron 語法、特殊字元、時區陷阱和運營監控等實戰要點。',
      readingTime: '9 分鐘閱讀',
      content: `
        <p>Cron 表達式看似簡單，卻是運營事故的常見來源。比語法更重要的是時區、重試和並發執行等運營條件。</p>
        <h2>基本結構</h2>
        <p>標準 cron 由分鐘、小時、日期、月份、星期五個欄位組成。透過萬用字元、範圍、步長和清單的組合來表達計劃。</p>
        <h2>容易混淆的地方</h2>
        <p>同時使用 day-of-month 和 day-of-week 時行為常被誤解。部署前務必確認實際的下次執行時間。</p>
        <h2>運營注意事項</h2>
        <ul>
          <li>確認伺服器時區</li>
          <li>防止並發重複執行</li>
          <li>新增日誌和健康檢查</li>
          <li>單獨設計失敗重試策略</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: '正規表示式入門：實用初學者指南',
      description: '快速掌握日誌解析、資料驗證、文字處理中常用的 regex 基礎。',
      readingTime: '10 分鐘閱讀',
      content: `
        <p>正規表示式是查找和替換文字模式的強大工具。初看晦澀，但掌握核心符號便能大幅減少重複工作。</p>
        <h2>基本構成</h2>
        <ul>
          <li><code>.</code> — 任意單個字元</li>
          <li><code>*</code>、<code>+</code>、<code>?</code> — 重複量詞</li>
          <li><code>[abc]</code> — 字元集</li>
          <li><code>^</code>、<code>$</code> — 開始和結束錨點</li>
        </ul>
        <h2>實戰範例</h2>
        <p>郵件驗證、IP 位址擷取、日誌時間戳搜尋等規則清晰的字串場景尤為適合。</p>
        <h2>常見陷阱</h2>
        <ul>
          <li>巢狀量詞導致的效能下降</li>
          <li>混淆 greedy 與 lazy 匹配</li>
          <li>字元類中遺漏跳脫字元</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: '雜湊演算法比較：MD5 vs SHA-256 vs SHA-3',
      description: '簡要梳理主流雜湊演算法的差異及各演算法適用場景。',
      readingTime: '6 分鐘閱讀',
      content: `
        <p>雜湊函數將資料轉換為固定長度結果，用於完整性驗證和簽名。但不同演算法的安全性和適用場景各異。</p>
        <h2>MD5</h2>
        <p>MD5 快速但已被攻破，不可用於安全目的。可構造實際碰撞，不適合信任驗證。</p>
        <h2>SHA-256</h2>
        <p>SHA-256 是當前最廣泛使用的基本選擇，在憑證、程式碼簽名和檔案完整性驗證中均可靠。</p>
        <h2>SHA-3</h2>
        <p>SHA-3 具有與 SHA-2 不同的內部結構，是尋求長期防禦余地時的備選方案。</p>
        <h2>快速選擇標準</h2>
        <ul>
          <li>檔案完整性：SHA-256</li>
          <li>密碼儲存：bcrypt / Argon2</li>
          <li>結構性備選：SHA-3</li>
        </ul>
      `
    }
  },
  fr: {
    'what-is-json': {
      title: 'Qu\'est-ce que JSON ? Le guide complet du développeur',
      description: 'Structure de JSON, types de données, différences avec XML/YAML et erreurs courantes de parsing.',
      readingTime: '12 min de lecture',
      content: `
        <p>JSON est l'un des formats de données les plus utilisés sur le web moderne. On le retrouve dans les réponses d'API, les fichiers de configuration et les outils de développement.</p>
        <h2>Ce que JSON apporte</h2>
        <p>JSON est lisible par les humains et simple à traiter par les machines. Cette combinaison en fait le choix idéal pour échanger des données entre systèmes hétérogènes.</p>
        <h2>Règles fondamentales</h2>
        <ul>
          <li>Les clés et les chaînes utilisent des guillemets doubles</li>
          <li>Les virgules en fin de liste ne sont pas autorisées</li>
          <li>Seuls string, number, object, array, boolean et null existent</li>
        </ul>
        <h2>Conseils pratiques</h2>
        <p>Évitez les imbrications excessives et utilisez JSON Schema quand vous avez besoin d'un contrat de données clair. JSON Formatter vous aide à valider la syntaxe et JSON Schema Studio à définir la structure.</p>
      `
    },
    'understanding-hashes': {
      title: 'Comprendre les hachages cryptographiques : MD5, SHA-256 et au-delà',
      description: 'Propriétés des fonctions de hachage, risques de collision et importance du choix d\'algorithme.',
      readingTime: '12 min de lecture',
      content: `
        <p>Un hachage convertit des données en une empreinte de longueur fixe. Il est essentiel pour vérifier l'intégrité, signer des données et sécuriser certains flux.</p>
        <h2>Pourquoi c'est important</h2>
        <p>Une bonne fonction de hachage doit être déterministe, rapide, à sens unique et résistante aux collisions. Si l'une de ces propriétés est compromise, son utilité s'effondre.</p>
        <h2>Choisir l'algorithme</h2>
        <ul>
          <li>MD5 n'est plus adapté à la sécurité</li>
          <li>SHA-256 est le choix standard pour l'intégrité</li>
          <li>SHA-3 offre une structure interne différente en alternative</li>
        </ul>
        <h2>Usage réel</h2>
        <p>Pour vérifier des fichiers, utilisez SHA-256 ou supérieur. Pour les mots de passe, utilisez bcrypt ou Argon2, pas un hachage rapide. Vous pouvez le vérifier localement avec Hash Calculator.</p>
      `
    },
    'regex-guide': {
      title: 'Guide pratique des expressions régulières',
      description: 'Les éléments de base des regex, les patterns courants et les pièges de performance expliqués avec une approche pratique.',
      readingTime: '14 min de lecture',
      content: `
        <p>Les expressions régulières sont très puissantes pour rechercher et transformer du texte, mais elles deviennent difficiles à maintenir quand elles grossissent. Il vaut mieux commencer par bien comprendre les blocs de base.</p>
        <h2>Éléments de base</h2>
        <ul>
          <li>Literal, character class, quantifier et anchor forment le socle</li>
          <li>Distinguez le comportement greedy du lazy</li>
          <li>Utilisez lookahead/lookbehind seulement quand c'est vraiment utile</li>
        </ul>
        <h2>Risques de performance</h2>
        <p>Les quantificateurs imbriqués peuvent provoquer un catastrophic backtracking. Testez avec de longues chaînes non correspondantes et visualisez les patterns complexes avant de les déployer.</p>
        <h2>Applications pratiques</h2>
        <p>Elles conviennent à la validation d'e-mails, l'extraction de dates ou le masquage de logs. Regex Studio aide à visualiser le flux du pattern et à le déboguer plus rapidement.</p>
      `
    },
    'curl-essentials': {
      title: 'cURL pour développeurs : commandes et techniques essentielles',
      description: 'Récapitulatif pratique des options cURL, de l\'authentification et du débogage pour les API modernes.',
      readingTime: '12 min de lecture',
      content: `
        <p>cURL est l'outil standard pour tester les API et déboguer le trafic réseau. Il permet de voir clairement ce que vous envoyez et ce que le serveur renvoie.</p>
        <h2>Utilisation de base</h2>
        <ul>
          <li><code>-X</code> pour la méthode HTTP</li>
          <li><code>-H</code> pour les en-têtes</li>
          <li><code>-d</code> pour le corps</li>
          <li><code>-v</code> et <code>--trace</code> pour déboguer</li>
        </ul>
        <h2>Authentification et sessions</h2>
        <p>Basic Auth s'envoie avec <code>-u</code> et les tokens Bearer via l'en-tête Authorization. Vous pouvez aussi enregistrer des cookies et les réutiliser pour simuler des sessions complètes.</p>
        <h2>Conseils pratiques</h2>
        <p>Externalisez les payloads JSON dans des fichiers, spécifiez des timeouts et suivez les redirections selon les besoins. Curl Studio simplifie la construction et la lecture de commandes complexes.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Guide pratique pour implémenter Content Security Policy',
      description: 'Comment déployer CSP de façon sécurisée avec nonce, hash et strict-dynamic.',
      readingTime: '10 min de lecture',
      content: `
        <p>CSP est l'une des défenses les plus efficaces contre XSS. L'idée centrale est d'autoriser uniquement les ressources explicitement déclarées et de bloquer tout le reste par défaut.</p>
        <h2>Directives principales</h2>
        <ul>
          <li><code>default-src</code> définit la base de la politique</li>
          <li><code>script-src</code> et <code>style-src</code> sont généralement les plus critiques</li>
          <li><code>connect-src</code> et <code>frame-ancestors</code> comptent aussi beaucoup</li>
        </ul>
        <h2>Comment la déployer</h2>
        <p>Commencez par Report-Only pour voir ce que la politique casserait, puis appliquez nonce ou hash pour le contenu inline nécessaire. Évitez <code>'unsafe-inline'</code> autant que possible.</p>
        <h2>Renforcements modernes</h2>
        <p>Combinez strict-dynamic, Trusted Types et upgrade-insecure-requests pour une posture plus solide. CSP Builder aide à construire les règles sans erreurs.</p>
      `
    },
    'password-security-guide': {
      title: 'Sécurité des mots de passe en 2026 : ce que tout développeur doit savoir',
      description: 'Entropie, recommandations NIST, Argon2, MFA et passkeys expliqués dans une perspective pratique.',
      readingTime: '12 min de lecture',
      content: `
        <p>La sécurité moderne des mots de passe ne tourne plus autour de règles de complexité arbitraires. La longueur, l'aléatoire et la résistance au phishing comptent davantage.</p>
        <h2>La longueur prime</h2>
        <p>Une longue passphrase est souvent plus solide et utilisable qu'un mot de passe court rempli de symboles. L'essentiel est d'éviter les patterns prévisibles.</p>
        <h2>Stocker avec des hachages lents</h2>
        <p>Pour stocker des mots de passe, n'utilisez pas des hachages rapides comme SHA-256. Préférez Argon2 ou bcrypt, avec salt et, si applicable, une stratégie complémentaire comme pepper.</p>
        <h2>MFA et passkeys</h2>
        <p>Pour les comptes sensibles, le mot de passe seul ne suffit pas. WebAuthn et les passkeys offrent une défense bien plus forte contre le phishing et le vol de credentials.</p>
        <h2>Checklist opérationnelle</h2>
        <ul>
          <li>Autoriser les mots de passe longs</li>
          <li>Bloquer les mots de passe compromis</li>
          <li>Éviter les rotations forcées sans raison</li>
          <li>Appliquer le rate limiting à la connexion et à la réinitialisation</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT expliqué : structure, sécurité et erreurs courantes',
      description: 'Les trois parties d\'un JWT, les points de validation obligatoires et les pièges les plus fréquents en production.',
      readingTime: '13 min de lecture',
      content: `
        <p>JWT simplifie l'authentification sans état, mais facilite aussi la distribution de credentials difficiles à révoquer. La rigueur de validation compte plus que la commodité.</p>
        <h2>Les trois parties</h2>
        <p>Un JWT a un header, un payload et une signature. Le payload n'est pas chiffré par défaut, il ne doit donc pas contenir de secrets ni d'informations sensibles.</p>
        <h2>Ce que vous devez toujours valider</h2>
        <ul>
          <li>Les algorithmes autorisés de façon explicite</li>
          <li><code>exp</code>, <code>iss</code> et <code>aud</code></li>
          <li>Des tokens d'accès à durée de vie courte</li>
          <li>Des refresh tokens séparés quand nécessaire</li>
        </ul>
        <h2>Révocation et opérations</h2>
        <p>Comme un JWT déjà émis est difficile à retirer, il convient de combiner TTL court, rotation de clés et, quand c'est nécessaire, listes de révocation.</p>
        <h2>Conseil pratique</h2>
        <p>Inspectez les tokens avec des outils locaux comme JWT Inspector. Envoyer de vrais tokens à des décodeurs externes est une mauvaise pratique opérationnelle.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'Certificats X.509 : comment TLS/SSL fonctionne vraiment',
      description: 'Chaîne de certificats, confiance des CA, SAN, CSR et révocation expliqués de façon pratique.',
      readingTime: '10 min de lecture',
      content: `
        <p>Un certificat X.509 lie une clé publique à une identité. Derrière le cadenas du navigateur se trouve une chaîne de confiance complète qui rend TLS possible.</p>
        <h2>Champs importants</h2>
        <p>Subject, issuer, validité, clé publique, algorithme de signature et SAN sont les champs qui influencent le plus le déploiement réel. SAN est particulièrement critique aujourd'hui.</p>
        <h2>Chaîne de confiance</h2>
        <p>Le navigateur ne valide pas seulement le certificat final. Il vérifie aussi les intermédiaires jusqu'à une racine de confiance. Une chaîne incomplète peut casser les clients mobiles ou les outils CLI.</p>
        <h2>CSR et opérations</h2>
        <p>Pour émettre un certificat, vous générez d'abord la clé privée puis le CSR. La clé privée ne doit jamais quitter l'environnement que vous contrôlez.</p>
        <h2>Problèmes courants</h2>
        <ul>
          <li>Certificats expirés</li>
          <li>Chaînes incomplètes</li>
          <li>Noms d'hôte qui ne correspondent pas</li>
          <li>Racines non approuvées</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC : comment choisir le bon protocole',
      description: 'Différences clés entre SSO d\'entreprise, délégation d\'accès aux API et identité moderne.',
      readingTime: '11 min de lecture',
      content: `
        <p>SAML, OAuth 2.0 et OIDC ne résolvent pas le même problème. Avant de choisir, il faut séparer clairement authentification, identité et autorisation.</p>
        <h2>SAML</h2>
        <p>SAML reste une base solide pour le SSO d'entreprise. Il est plus lourd en raison de sa base XML, mais s'intègre très bien avec les annuaires d'entreprise et les exigences B2B.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth n'est pas un protocole de connexion mais un framework d'autorisation. Il sert à déléguer un accès limité à des ressources sans partager le mot de passe de l'utilisateur.</p>
        <h2>OIDC</h2>
        <p>OIDC ajoute une couche d'identité par-dessus OAuth. Grâce à l'ID Token et à la découverte automatique, c'est le choix naturel pour les expériences de connexion modernes.</p>
        <h2>Règle rapide</h2>
        <ul>
          <li>SSO d'entreprise : SAML</li>
          <li>Accès délégué aux API : OAuth</li>
          <li>Connexion moderne et identité : OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'Maîtriser les expressions cron : planifiez des tâches comme un pro',
      description: 'Syntaxe, caractères spéciaux, pièges de fuseau horaire et bonnes pratiques opérationnelles pour cron.',
      readingTime: '9 min de lecture',
      content: `
        <p>Les expressions cron semblent simples, mais elles génèrent souvent des incidents opérationnels coûteux. Connaître la syntaxe ne suffit pas : il faut aussi penser au fuseau horaire, aux reprises et aux chevauchements.</p>
        <h2>Structure de base</h2>
        <p>Le format classique utilise cinq champs : minute, heure, jour du mois, mois et jour de la semaine. On y combine ensuite plages, listes, incréments et jokers.</p>
        <h2>Ce qui prête à confusion</h2>
        <p>L'interaction entre jour du mois et jour de la semaine génère beaucoup d'erreurs. Avant de déployer, vérifiez toujours les prochaines exécutions réelles.</p>
        <h2>Bonnes pratiques opérationnelles</h2>
        <ul>
          <li>Vérifier le fuseau horaire de l'environnement</li>
          <li>Éviter les exécutions qui se chevauchent</li>
          <li>Ajouter des logs et des health checks</li>
          <li>Concevoir les reprises séparément</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: 'Expressions régulières : guide pratique pour débutants',
      description: 'Introduction rapide aux fondamentaux des regex avec des exemples utiles pour la validation, les logs et le nettoyage de texte.',
      readingTime: '10 min de lecture',
      content: `
        <p>Les expressions régulières permettent de rechercher et transformer des patterns de texte en très peu de lignes. Elles paraissent cryptiques au début, mais les symboles de base couvrent une grande partie du travail quotidien.</p>
        <h2>Blocs de base</h2>
        <ul>
          <li><code>.</code> — n'importe quel caractère</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — répétition</li>
          <li><code>[abc]</code> — classe de caractères</li>
          <li><code>^</code> et <code>$</code> — début et fin</li>
        </ul>
        <h2>Exemples utiles</h2>
        <p>Elles sont très pratiques pour valider des e-mails, rechercher des adresses IP ou extraire des horodatages dans des logs.</p>
        <h2>Erreurs fréquentes</h2>
        <ul>
          <li>Backtracking catastrophique dû à des quantificateurs imbriqués</li>
          <li>Confondre comportement greedy et lazy</li>
          <li>Oublier les échappements dans les classes de caractères</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'Comparaison des algorithmes de hachage : MD5 vs SHA-256 vs SHA-3',
      description: 'Résumé concis des différences entre les algorithmes de hachage populaires et quand utiliser chacun.',
      readingTime: '6 min de lecture',
      content: `
        <p>Les fonctions de hachage convertissent des données en sorties de longueur fixe pour vérifier l'intégrité et construire des signatures. Choisir le bon algorithme dépend de l'objectif.</p>
        <h2>MD5</h2>
        <p>MD5 est rapide mais peu sûr pour des usages de confiance. Les collisions pratiques le disqualifient pour la sécurité réelle.</p>
        <h2>SHA-256</h2>
        <p>SHA-256 est le choix par défaut le plus courant pour l'intégrité, les certificats et la signature d'artefacts.</p>
        <h2>SHA-3</h2>
        <p>SHA-3 offre une construction interne différente et peut servir d'alternative moderne quand on recherche une diversité cryptographique.</p>
        <h2>Règle rapide</h2>
        <ul>
          <li>Intégrité de fichiers : SHA-256</li>
          <li>Mots de passe : bcrypt / Argon2</li>
          <li>Alternative structurelle : SHA-3</li>
        </ul>
      `
    }
  },
  de: {
    'what-is-json': {
      title: 'Was ist JSON? Der vollständige Leitfaden für Entwickler',
      description: 'JSON-Struktur, Datentypen, Unterschiede zu XML/YAML und häufige Parsing-Fehler.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>JSON ist eines der meistgenutzten Datenformate im modernen Web. Es begegnet einem in API-Antworten, Konfigurationsdateien und Entwicklungswerkzeugen.</p>
        <h2>Was JSON bietet</h2>
        <p>JSON ist für Menschen lesbar und für Maschinen einfach zu verarbeiten. Diese Kombination macht es zum idealen Format für den Datenaustausch zwischen unterschiedlichen Systemen.</p>
        <h2>Grundlegende Regeln</h2>
        <ul>
          <li>Schlüssel und Zeichenketten verwenden doppelte Anführungszeichen</li>
          <li>Abschließende Kommas sind nicht erlaubt</li>
          <li>Nur string, number, object, array, boolean und null existieren</li>
        </ul>
        <h2>Praktische Tipps</h2>
        <p>Vermeiden Sie übermäßige Verschachtelung und nutzen Sie JSON Schema, wenn Sie einen klaren Datenvertrag benötigen. JSON Formatter hilft bei der Syntaxvalidierung, JSON Schema Studio beim Definieren der Struktur.</p>
      `
    },
    'understanding-hashes': {
      title: 'Kryptografische Hashes verstehen: MD5, SHA-256 und darüber hinaus',
      description: 'Eigenschaften von Hash-Funktionen, Kollisionsrisiken und warum die Wahl des Algorithmus entscheidend ist.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>Ein Hash wandelt Daten in einen Fingerabdruck fester Länge um. Er ist unverzichtbar für die Integritätsprüfung, das Signieren von Daten und verschiedene Sicherheitsabläufe.</p>
        <h2>Warum es wichtig ist</h2>
        <p>Eine gute Hash-Funktion muss deterministisch, schnell, einwegig und kollisionsresistent sein. Fehlt eine dieser Eigenschaften, sinkt der Nutzen erheblich.</p>
        <h2>Algorithmus wählen</h2>
        <ul>
          <li>MD5 ist für Sicherheitszwecke nicht mehr geeignet</li>
          <li>SHA-256 ist die Standardwahl für Integrität</li>
          <li>SHA-3 bietet eine andere interne Struktur als Alternative</li>
        </ul>
        <h2>Praxisanwendung</h2>
        <p>Zur Dateiprüfung verwenden Sie SHA-256 oder besser. Für Passwörter nutzen Sie bcrypt oder Argon2, keinen schnellen Hash. Mit dem Hash Calculator können Sie das lokal überprüfen.</p>
      `
    },
    'regex-guide': {
      title: 'Praxisleitfaden für reguläre Ausdrücke',
      description: 'Grundbausteine von Regex, häufige Muster und Performance-Fallen mit praktischem Fokus erklärt.',
      readingTime: '14 Min. Lesezeit',
      content: `
        <p>Reguläre Ausdrücke sind sehr mächtig für die Textsuche und -transformation, werden aber schwer zu warten, wenn sie zu groß werden. Es lohnt sich, die Grundbausteine zuerst gründlich zu verstehen.</p>
        <h2>Grundbausteine</h2>
        <ul>
          <li>Literal, Zeichenklasse, Quantor und Anker bilden das Fundament</li>
          <li>Unterscheiden Sie greedy von lazy</li>
          <li>Verwenden Sie Lookahead/Lookbehind nur, wenn es wirklich Klarheit bringt</li>
        </ul>
        <h2>Performance-Risiken</h2>
        <p>Verschachtelte Quantoren können catastrophic backtracking auslösen. Testen Sie mit langen nicht übereinstimmenden Zeichenketten und visualisieren Sie komplexe Muster vor dem Produktionseinsatz.</p>
        <h2>Praktische Anwendungen</h2>
        <p>Sie eignen sich für E-Mail-Validierung, Datumsextraktion oder Log-Maskierung. Regex Studio hilft, den Musterfluss zu visualisieren und schneller zu debuggen.</p>
      `
    },
    'curl-essentials': {
      title: 'cURL für Entwickler: wichtige Befehle und Techniken',
      description: 'Praktische Übersicht zu cURL-Optionen, Authentifizierung und Debugging für moderne APIs.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>cURL ist das Standardwerkzeug zum Testen von APIs und zum Debuggen von Netzwerkverkehr. Es zeigt klar, was Sie senden und was der Server zurückgibt.</p>
        <h2>Grundlegende Verwendung</h2>
        <ul>
          <li><code>-X</code> für die HTTP-Methode</li>
          <li><code>-H</code> für Header</li>
          <li><code>-d</code> für den Body</li>
          <li><code>-v</code> und <code>--trace</code> zum Debuggen</li>
        </ul>
        <h2>Authentifizierung und Sessions</h2>
        <p>Basic Auth wird mit <code>-u</code> übergeben, Bearer-Tokens über den Authorization-Header. Cookies lassen sich speichern und wiederverwenden, um vollständige Sessions zu simulieren.</p>
        <h2>Praktische Tipps</h2>
        <p>Lagern Sie große JSON-Payloads in Dateien aus, geben Sie Timeouts an und folgen Sie Weiterleitungen nach Bedarf. Curl Studio vereinfacht das Erstellen und Lesen komplexer Befehle.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Praxisleitfaden zur Implementierung von Content Security Policy',
      description: 'Wie man CSP sicher mit nonce, hash und strict-dynamic einführt.',
      readingTime: '10 Min. Lesezeit',
      content: `
        <p>CSP ist eine der wirkungsvollsten Abwehrmaßnahmen gegen XSS. Der Kerngedanke ist, nur explizit deklarierte Ressourcen zu erlauben und alles andere standardmäßig zu blockieren.</p>
        <h2>Wichtigste Direktiven</h2>
        <ul>
          <li><code>default-src</code> definiert die Grundlage der Richtlinie</li>
          <li><code>script-src</code> und <code>style-src</code> sind meist am kritischsten</li>
          <li><code>connect-src</code> und <code>frame-ancestors</code> sind ebenfalls wichtig</li>
        </ul>
        <h2>Einführungsstrategie</h2>
        <p>Beginnen Sie mit Report-Only, um zu sehen, was die Richtlinie brechen würde, und wenden Sie dann nonce oder hash für notwendige Inline-Inhalte an. Vermeiden Sie <code>'unsafe-inline'</code> so weit wie möglich.</p>
        <h2>Moderne Härtungsmaßnahmen</h2>
        <p>Kombinieren Sie strict-dynamic, Trusted Types und upgrade-insecure-requests für eine solidere Sicherheitsposition. CSP Builder hilft, Regeln fehlerfrei zu erstellen.</p>
      `
    },
    'password-security-guide': {
      title: 'Passwortsicherheit 2026: Was jeder Entwickler wissen sollte',
      description: 'Entropie, NIST-Empfehlungen, Argon2, MFA und Passkeys aus praktischer Perspektive erklärt.',
      readingTime: '12 Min. Lesezeit',
      content: `
        <p>Moderne Passwortsicherheit dreht sich nicht mehr um willkürliche Komplexitätsregeln. Länge, Zufälligkeit und Phishing-Resistenz zählen mehr.</p>
        <h2>Länge schlägt alles</h2>
        <p>Eine lange Passphrase ist oft robuster und benutzerfreundlicher als ein kurzes Passwort voller Sonderzeichen. Entscheidend ist, vorhersehbare Muster zu vermeiden.</p>
        <h2>Speicherung mit langsamen Hashes</h2>
        <p>Verwenden Sie für die Passwortspeicherung keine schnellen Hashes wie SHA-256. Nutzen Sie Argon2 oder bcrypt mit Salt und ggf. einer ergänzenden Strategie wie Pepper.</p>
        <h2>MFA und Passkeys</h2>
        <p>Bei sensiblen Konten reicht ein Passwort allein nicht aus. WebAuthn und Passkeys bieten einen deutlich stärkeren Schutz gegen Phishing und Credential-Diebstahl.</p>
        <h2>Operative Checkliste</h2>
        <ul>
          <li>Lange Passwörter erlauben</li>
          <li>Kompromittierte Passwörter sperren</li>
          <li>Erzwungene Rotationen ohne Grund vermeiden</li>
          <li>Rate Limiting bei Login und Passwort-Reset anwenden</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT erklärt: Struktur, Sicherheit und häufige Fehler',
      description: 'Die drei Teile eines JWT, obligatorische Validierungspunkte und die häufigsten Fallen in der Produktion.',
      readingTime: '13 Min. Lesezeit',
      content: `
        <p>JWT vereinfacht die zustandslose Authentifizierung, erleichtert aber auch die Verteilung schwer revozierbarer Credentials. Validierungsdisziplin ist wichtiger als Bequemlichkeit.</p>
        <h2>Die drei Teile</h2>
        <p>Ein JWT hat Header, Payload und Signature. Der Payload ist standardmäßig nicht verschlüsselt und darf daher keine Geheimnisse oder sensible Informationen enthalten.</p>
        <h2>Was Sie immer validieren müssen</h2>
        <ul>
          <li>Erlaubte Algorithmen explizit festlegen</li>
          <li><code>exp</code>, <code>iss</code> und <code>aud</code> prüfen</li>
          <li>Kurzlebige Access Tokens verwenden</li>
          <li>Separate Refresh Tokens, wenn nötig</li>
        </ul>
        <h2>Revozierung und Betrieb</h2>
        <p>Da ein bereits ausgestelltes JWT schwer zurückzuziehen ist, empfiehlt sich die Kombination aus kurzem TTL, Schlüsselrotation und, wenn nötig, Revozierungslisten.</p>
        <h2>Praxistipp</h2>
        <p>Untersuchen Sie Tokens mit lokalen Tools wie JWT Inspector. Echte Tokens an externe Decoder zu senden ist eine schlechte betriebliche Praxis.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'X.509-Zertifikate erklärt: Wie TLS/SSL wirklich funktioniert',
      description: 'Zertifikatskette, CA-Vertrauen, SAN, CSR und Revozierung praktisch erklärt.',
      readingTime: '10 Min. Lesezeit',
      content: `
        <p>Ein X.509-Zertifikat verknüpft einen öffentlichen Schlüssel mit einer Identität. Hinter dem Browser-Schloss steckt eine vollständige Vertrauenskette, die TLS ermöglicht.</p>
        <h2>Wichtige Felder</h2>
        <p>Subject, Issuer, Gültigkeit, öffentlicher Schlüssel, Signaturalgorithmus und SAN sind die Felder, die den realen Einsatz am stärksten beeinflussen. SAN ist heute besonders kritisch.</p>
        <h2>Vertrauenskette</h2>
        <p>Der Browser validiert nicht nur das Endzertikat. Er prüft auch die Zwischenzertifikate bis zu einer vertrauenswürdigen Wurzel. Eine unvollständige Kette kann mobile Clients oder CLI-Tools zum Scheitern bringen.</p>
        <h2>CSR und Betrieb</h2>
        <p>Zur Zertifikatsausstellung erzeugen Sie zunächst den privaten Schlüssel und dann den CSR. Der private Schlüssel darf niemals die Umgebung verlassen, die Sie kontrollieren.</p>
        <h2>Häufige Fehler</h2>
        <ul>
          <li>Abgelaufene Zertifikate</li>
          <li>Unvollständige Ketten</li>
          <li>Nicht übereinstimmende Hostnamen</li>
          <li>Nicht vertrauenswürdige Wurzeln</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: Das richtige Protokoll wählen',
      description: 'Wichtigste Unterschiede zwischen Enterprise-SSO, API-Zugriffsdelegation und moderner Identität.',
      readingTime: '11 Min. Lesezeit',
      content: `
        <p>SAML, OAuth 2.0 und OIDC lösen nicht dasselbe Problem. Vor der Wahl muss man Authentifizierung, Identität und Autorisierung klar trennen.</p>
        <h2>SAML</h2>
        <p>SAML bleibt eine solide Grundlage für Enterprise-SSO. Es ist schwerer aufgrund seiner XML-Basis, passt aber sehr gut zu Unternehmensverzeichnissen und B2B-Anforderungen.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth ist kein Login-Protokoll, sondern ein Autorisierungs-Framework. Es dient dazu, begrenzten Zugriff auf Ressourcen zu delegieren, ohne das Passwort des Nutzers zu teilen.</p>
        <h2>OIDC</h2>
        <p>OIDC fügt OAuth eine Identitätsschicht hinzu. Dank ID Token und automatischer Erkennung ist es die natürliche Wahl für moderne Anmeldeerlebnisse.</p>
        <h2>Schnelle Entscheidungshilfe</h2>
        <ul>
          <li>Enterprise-SSO: SAML</li>
          <li>Delegierter API-Zugriff: OAuth</li>
          <li>Modernes Login und Identität: OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'Cron-Ausdrücke meistern: Aufgaben wie ein Profi planen',
      description: 'Syntax, Sonderzeichen, Zeitzonenfallen und operative Best Practices für cron.',
      readingTime: '9 Min. Lesezeit',
      content: `
        <p>Cron-Ausdrücke wirken simpel, verursachen aber oft kostspielige operative Fehler. Die Syntax zu kennen reicht nicht — man muss auch an Zeitzone, Wiederholungen und Überlappungen denken.</p>
        <h2>Grundstruktur</h2>
        <p>Das klassische Format verwendet fünf Felder: Minute, Stunde, Tag des Monats, Monat und Wochentag. Daraus kombiniert man Bereiche, Listen, Schritte und Platzhalter.</p>
        <h2>Was häufig verwirrt</h2>
        <p>Die Wechselwirkung zwischen Tag des Monats und Wochentag führt zu vielen Fehlern. Vor dem Deployment sollte man immer die tatsächlichen nächsten Ausführungszeiten prüfen.</p>
        <h2>Operative Best Practices</h2>
        <ul>
          <li>Zeitzone der Umgebung prüfen</li>
          <li>Überlappende Ausführungen vermeiden</li>
          <li>Logs und Health Checks hinzufügen</li>
          <li>Wiederholungslogik separat designen</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: 'Reguläre Ausdrücke: Praxisleitfaden für Einsteiger',
      description: 'Schnelle Einführung in die Grundlagen von Regex mit nützlichen Beispielen für Validierung, Logs und Textbereinigung.',
      readingTime: '10 Min. Lesezeit',
      content: `
        <p>Reguläre Ausdrücke ermöglichen das Suchen und Transformieren von Textmustern mit sehr wenig Code. Sie wirken anfangs kryptisch, aber die grundlegenden Symbole decken einen Großteil der täglichen Arbeit ab.</p>
        <h2>Grundbausteine</h2>
        <ul>
          <li><code>.</code> — beliebiges Zeichen</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — Wiederholung</li>
          <li><code>[abc]</code> — Zeichenklasse</li>
          <li><code>^</code> und <code>$</code> — Anfang und Ende</li>
        </ul>
        <h2>Nützliche Beispiele</h2>
        <p>Sie eignen sich hervorragend zur E-Mail-Validierung, zum Suchen von IP-Adressen oder zum Extrahieren von Zeitstempeln aus Logs.</p>
        <h2>Häufige Fehler</h2>
        <ul>
          <li>Catastrophic backtracking durch verschachtelte Quantoren</li>
          <li>Greedy- und Lazy-Verhalten verwechseln</li>
          <li>Escapes in Zeichenklassen vergessen</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'Hash-Algorithmen im Vergleich: MD5 vs SHA-256 vs SHA-3',
      description: 'Kurze Übersicht der Unterschiede zwischen gängigen Hash-Algorithmen und wann man welchen einsetzt.',
      readingTime: '6 Min. Lesezeit',
      content: `
        <p>Hash-Funktionen wandeln Daten in Ausgaben fester Länge um, um Integrität zu prüfen und Signaturen zu erstellen. Den richtigen Algorithmus zu wählen hängt vom Ziel ab.</p>
        <h2>MD5</h2>
        <p>MD5 ist schnell, aber für Vertrauenszwecke unsicher. Praktische Kollisionen disqualifizieren es für echte Sicherheitsanwendungen.</p>
        <h2>SHA-256</h2>
        <p>SHA-256 ist die häufigste Standardwahl für Integrität, Zertifikate und Artefakt-Signierung.</p>
        <h2>SHA-3</h2>
        <p>SHA-3 bietet eine andere interne Konstruktion und kann als moderne Alternative dienen, wenn kryptografische Diversität gewünscht ist.</p>
        <h2>Schnelle Entscheidungshilfe</h2>
        <ul>
          <li>Dateiintegrität: SHA-256</li>
          <li>Passwörter: bcrypt / Argon2</li>
          <li>Strukturelle Alternative: SHA-3</li>
        </ul>
      `
    }
  },
  pt: {
    'what-is-json': {
      title: 'O que é JSON? O guia completo para desenvolvedores',
      description: 'Estrutura do JSON, tipos de dados, diferenças em relação ao XML/YAML e erros comuns de parsing.',
      readingTime: '12 min de leitura',
      content: `
        <p>JSON é um dos formatos de dados mais utilizados na web moderna. Você o encontra em respostas de API, arquivos de configuração e ferramentas de desenvolvimento.</p>
        <h2>O que o JSON oferece</h2>
        <p>O JSON é legível por humanos e simples de processar por máquinas. Essa combinação o torna a escolha ideal para trocar dados entre sistemas heterogêneos.</p>
        <h2>Regras fundamentais</h2>
        <ul>
          <li>Chaves e strings usam aspas duplas</li>
          <li>Vírgulas finais não são permitidas</li>
          <li>Apenas string, number, object, array, boolean e null existem</li>
        </ul>
        <h2>Dicas práticas</h2>
        <p>Evite aninhamento excessivo e use JSON Schema quando precisar de um contrato de dados claro. O JSON Formatter ajuda a validar a sintaxe e o JSON Schema Studio a definir a estrutura.</p>
      `
    },
    'understanding-hashes': {
      title: 'Entendendo hashes criptográficos: MD5, SHA-256 e além',
      description: 'Propriedades das funções hash, riscos de colisão e por que a escolha do algoritmo importa.',
      readingTime: '12 min de leitura',
      content: `
        <p>Um hash converte dados em uma impressão digital de comprimento fixo. É essencial para verificar integridade, assinar dados e sustentar vários fluxos de segurança.</p>
        <h2>Por que isso importa</h2>
        <p>Uma boa função hash deve ser determinística, rápida, unidirecional e resistente a colisões. Se uma dessas propriedades falhar, sua utilidade cai rapidamente.</p>
        <h2>Escolhendo o algoritmo</h2>
        <ul>
          <li>MD5 não serve mais para segurança</li>
          <li>SHA-256 é a escolha padrão para integridade</li>
          <li>SHA-3 oferece uma estrutura interna diferente como alternativa</li>
        </ul>
        <h2>Uso real</h2>
        <p>Para verificar arquivos, use SHA-256 ou superior. Para senhas, use bcrypt ou Argon2, não um hash rápido. Você pode verificar isso localmente com o Hash Calculator.</p>
      `
    },
    'regex-guide': {
      title: 'Guia prático de expressões regulares',
      description: 'Os elementos básicos de regex, padrões comuns e armadilhas de desempenho explicados com foco prático.',
      readingTime: '14 min de leitura',
      content: `
        <p>As expressões regulares são muito poderosas para buscar e transformar texto, mas ficam difíceis de manter quando crescem demais. Vale a pena entender bem os blocos básicos primeiro.</p>
        <h2>Elementos básicos</h2>
        <ul>
          <li>Literal, classe de caracteres, quantificador e âncora formam a base</li>
          <li>Diferencie o comportamento greedy do lazy</li>
          <li>Use lookahead/lookbehind apenas quando realmente trouxer clareza</li>
        </ul>
        <h2>Riscos de desempenho</h2>
        <p>Quantificadores aninhados podem causar catastrophic backtracking. Teste com strings longas que não correspondam e visualize padrões complexos antes de colocá-los em produção.</p>
        <h2>Aplicações práticas</h2>
        <p>São muito úteis para validar e-mails, extrair datas ou mascarar logs. O Regex Studio ajuda a visualizar o fluxo do padrão e depurá-lo mais rapidamente.</p>
      `
    },
    'curl-essentials': {
      title: 'cURL para desenvolvedores: comandos e técnicas essenciais',
      description: 'Resumo prático de flags do cURL, autenticação e depuração para APIs modernas.',
      readingTime: '12 min de leitura',
      content: `
        <p>O cURL é a ferramenta padrão para testar APIs e depurar tráfego de rede. Ele permite ver com clareza o que você está enviando e o que o servidor devolve.</p>
        <h2>Uso básico</h2>
        <ul>
          <li><code>-X</code> para o método HTTP</li>
          <li><code>-H</code> para cabeçalhos</li>
          <li><code>-d</code> para o corpo</li>
          <li><code>-v</code> e <code>--trace</code> para depurar</li>
        </ul>
        <h2>Autenticação e sessões</h2>
        <p>Basic Auth é enviado com <code>-u</code> e tokens Bearer no cabeçalho Authorization. Você também pode salvar cookies e reutilizá-los para simular sessões completas.</p>
        <h2>Dicas práticas</h2>
        <p>Separe payloads JSON grandes em arquivos, especifique timeouts e siga redirecionamentos quando necessário. O Curl Studio simplifica a construção e a leitura de comandos complexos.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Guia prático para implementar Content Security Policy',
      description: 'Como implantar CSP de forma segura usando nonce, hash e strict-dynamic.',
      readingTime: '10 min de leitura',
      content: `
        <p>O CSP é uma das defesas mais eficazes contra XSS. A ideia central é permitir apenas recursos explicitamente declarados e bloquear todo o resto por padrão.</p>
        <h2>Diretivas principais</h2>
        <ul>
          <li><code>default-src</code> define a base da política</li>
          <li><code>script-src</code> e <code>style-src</code> costumam ser as mais críticas</li>
          <li><code>connect-src</code> e <code>frame-ancestors</code> também são muito importantes</li>
        </ul>
        <h2>Como implantá-lo</h2>
        <p>Comece com Report-Only para ver o que a política quebraria, depois aplique nonce ou hash para o conteúdo inline necessário. Evite <code>'unsafe-inline'</code> sempre que possível.</p>
        <h2>Reforços modernos</h2>
        <p>Combine strict-dynamic, Trusted Types e upgrade-insecure-requests para uma postura mais sólida. O CSP Builder ajuda a construir regras sem erros.</p>
      `
    },
    'password-security-guide': {
      title: 'Segurança de senhas em 2026: o que todo desenvolvedor precisa saber',
      description: 'Entropia, diretrizes NIST, Argon2, MFA e passkeys explicados de uma perspectiva prática.',
      readingTime: '12 min de leitura',
      content: `
        <p>A segurança moderna de senhas não gira mais em torno de regras de complexidade arbitrárias. Comprimento, aleatoriedade e resistência a phishing contam mais.</p>
        <h2>O comprimento vence</h2>
        <p>Uma passphrase longa costuma ser mais robusta e utilizável do que uma senha curta cheia de símbolos. O importante é evitar padrões previsíveis.</p>
        <h2>Armazenar com hashes lentos</h2>
        <p>Para armazenar senhas, não use hashes rápidos como SHA-256. Use Argon2 ou bcrypt, com salt e, se aplicável, uma estratégia complementar como pepper.</p>
        <h2>MFA e passkeys</h2>
        <p>Para contas sensíveis, a senha sozinha não basta. WebAuthn e passkeys oferecem uma defesa muito mais forte contra phishing e roubo de credenciais.</p>
        <h2>Checklist operacional</h2>
        <ul>
          <li>Permitir senhas longas</li>
          <li>Bloquear senhas comprometidas</li>
          <li>Evitar rotações forçadas sem motivo</li>
          <li>Aplicar rate limiting no login e na redefinição de senha</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT explicado: estrutura, segurança e erros comuns',
      description: 'As três partes de um JWT, os pontos de validação obrigatórios e as armadilhas mais comuns em produção.',
      readingTime: '13 min de leitura',
      content: `
        <p>O JWT simplifica a autenticação sem estado, mas também facilita a distribuição de credenciais difíceis de revogar. A disciplina de validação importa mais do que a conveniência.</p>
        <h2>As três partes</h2>
        <p>Um JWT tem header, payload e signature. O payload não é criptografado por padrão, portanto não deve conter segredos nem informações sensíveis.</p>
        <h2>O que você deve sempre validar</h2>
        <ul>
          <li>Algoritmos permitidos de forma explícita</li>
          <li><code>exp</code>, <code>iss</code> e <code>aud</code></li>
          <li>Tokens de acesso de curta duração</li>
          <li>Refresh tokens separados quando necessário</li>
        </ul>
        <h2>Revogação e operação</h2>
        <p>Como um JWT já emitido é difícil de retirar, convém combinar TTL curto, rotação de chaves e, quando necessário, listas de revogação.</p>
        <h2>Dica prática</h2>
        <p>Inspecione tokens com ferramentas locais como o JWT Inspector. Enviar tokens reais para decodificadores externos é uma má prática operacional.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'Certificados X.509: como TLS/SSL realmente funciona',
      description: 'Cadeia de certificados, confiança de CA, SAN, CSR e revogação explicados de forma prática.',
      readingTime: '10 min de leitura',
      content: `
        <p>Um certificado X.509 vincula uma chave pública a uma identidade. Por trás do cadeado do navegador há uma cadeia de confiança completa que torna o TLS possível.</p>
        <h2>Campos importantes</h2>
        <p>Subject, issuer, validade, chave pública, algoritmo de assinatura e SAN são os campos que mais afetam a implantação real. O SAN é especialmente crítico hoje.</p>
        <h2>Cadeia de confiança</h2>
        <p>O navegador não valida apenas o certificado final. Ele também verifica os intermediários até uma raiz confiável. Uma cadeia incompleta pode quebrar clientes móveis ou ferramentas CLI.</p>
        <h2>CSR e operação</h2>
        <p>Para emitir um certificado, você primeiro gera a chave privada e depois o CSR. A chave privada nunca deve sair do ambiente que você controla.</p>
        <h2>Problemas comuns</h2>
        <ul>
          <li>Certificados expirados</li>
          <li>Cadeias incompletas</li>
          <li>Nomes de host que não correspondem</li>
          <li>Raízes não confiáveis</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: como escolher o protocolo certo',
      description: 'Diferenças principais entre SSO empresarial, delegação de acesso a APIs e identidade moderna.',
      readingTime: '11 min de leitura',
      content: `
        <p>SAML, OAuth 2.0 e OIDC não resolvem o mesmo problema. Antes de escolher, é preciso separar claramente autenticação, identidade e autorização.</p>
        <h2>SAML</h2>
        <p>O SAML continua sendo uma base sólida para SSO empresarial. É mais pesado por sua base XML, mas se encaixa muito bem com diretórios corporativos e requisitos B2B.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth não é um protocolo de login, mas um framework de autorização. Serve para delegar acesso limitado a recursos sem compartilhar a senha do usuário.</p>
        <h2>OIDC</h2>
        <p>O OIDC adiciona uma camada de identidade sobre o OAuth. Graças ao ID Token e à descoberta automática, é a escolha natural para experiências modernas de login.</p>
        <h2>Regra rápida</h2>
        <ul>
          <li>SSO empresarial: SAML</li>
          <li>Acesso delegado a APIs: OAuth</li>
          <li>Login moderno e identidade: OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'Dominando expressões cron: agende tarefas como um profissional',
      description: 'Sintaxe, caracteres especiais, armadilhas de fuso horário e boas práticas operacionais para cron.',
      readingTime: '9 min de leitura',
      content: `
        <p>As expressões cron parecem simples, mas costumam gerar incidentes operacionais custosos. Conhecer a sintaxe não é suficiente — também é preciso pensar em fuso horário, tentativas de repetição e sobreposições.</p>
        <h2>Estrutura básica</h2>
        <p>O formato clássico usa cinco campos: minuto, hora, dia do mês, mês e dia da semana. A partir daí, combinam-se intervalos, listas, incrementos e curingas.</p>
        <h2>O que costuma confundir</h2>
        <p>A interação entre dia do mês e dia da semana gera muitos erros. Antes de implantar, sempre verifique as próximas execuções reais.</p>
        <h2>Boas práticas operacionais</h2>
        <ul>
          <li>Verificar o fuso horário do ambiente</li>
          <li>Evitar execuções sobrepostas</li>
          <li>Adicionar logs e health checks</li>
          <li>Projetar lógica de repetição separadamente</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: 'Expressões regulares: guia prático para iniciantes',
      description: 'Introdução rápida aos fundamentos de regex com exemplos úteis para validação, logs e limpeza de texto.',
      readingTime: '10 min de leitura',
      content: `
        <p>As expressões regulares permitem buscar e transformar padrões de texto com poucas linhas de código. Parecem crípticas no início, mas os símbolos básicos cobrem grande parte do trabalho diário.</p>
        <h2>Blocos básicos</h2>
        <ul>
          <li><code>.</code> — qualquer caractere</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — repetição</li>
          <li><code>[abc]</code> — classe de caracteres</li>
          <li><code>^</code> e <code>$</code> — início e fim</li>
        </ul>
        <h2>Exemplos úteis</h2>
        <p>São muito práticas para validar e-mails, buscar endereços IP ou extrair timestamps em logs.</p>
        <h2>Erros frequentes</h2>
        <ul>
          <li>Backtracking catastrófico por quantificadores aninhados</li>
          <li>Confundir comportamento greedy e lazy</li>
          <li>Esquecer escapes em classes de caracteres</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'Comparação de algoritmos hash: MD5 vs SHA-256 vs SHA-3',
      description: 'Resumo conciso das diferenças entre algoritmos hash populares e quando usar cada um.',
      readingTime: '6 min de leitura',
      content: `
        <p>As funções hash convertem dados em saídas de comprimento fixo para verificar integridade e construir assinaturas. Escolher o algoritmo correto depende do objetivo.</p>
        <h2>MD5</h2>
        <p>O MD5 é rápido, mas inseguro para fins de confiança. Colisões práticas o descartam para segurança real.</p>
        <h2>SHA-256</h2>
        <p>O SHA-256 é a escolha padrão mais comum para integridade, certificados e assinatura de artefatos.</p>
        <h2>SHA-3</h2>
        <p>O SHA-3 oferece uma construção interna diferente e pode servir como alternativa moderna quando se busca diversidade criptográfica.</p>
        <h2>Regra rápida</h2>
        <ul>
          <li>Integridade de arquivos: SHA-256</li>
          <li>Senhas: bcrypt / Argon2</li>
          <li>Alternativa estrutural: SHA-3</li>
        </ul>
      `
    }
  },
  vi: {
    'what-is-json': {
      title: 'JSON là gì? Hướng dẫn đầy đủ cho nhà phát triển',
      description: 'Cấu trúc JSON, kiểu dữ liệu, sự khác biệt với XML/YAML và các lỗi parsing phổ biến.',
      readingTime: '12 phút đọc',
      content: `
        <p>JSON là một trong những định dạng dữ liệu được sử dụng nhiều nhất trên web hiện đại. Bạn sẽ gặp nó trong phản hồi API, tệp cấu hình và các công cụ phát triển.</p>
        <h2>JSON mang lại điều gì</h2>
        <p>JSON dễ đọc với con người và đơn giản để xử lý bằng máy tính. Sự kết hợp này làm cho nó trở thành lựa chọn lý tưởng để trao đổi dữ liệu giữa các hệ thống khác nhau.</p>
        <h2>Các quy tắc cơ bản</h2>
        <ul>
          <li>Khóa và chuỗi sử dụng dấu ngoặc kép</li>
          <li>Dấu phẩy ở cuối không được phép</li>
          <li>Chỉ có string, number, object, array, boolean và null</li>
        </ul>
        <h2>Mẹo thực tế</h2>
        <p>Tránh lồng nhau quá mức và sử dụng JSON Schema khi cần hợp đồng dữ liệu rõ ràng. JSON Formatter giúp xác thực cú pháp và JSON Schema Studio giúp định nghĩa cấu trúc.</p>
      `
    },
    'understanding-hashes': {
      title: 'Hiểu về hash mật mã: MD5, SHA-256 và hơn thế nữa',
      description: 'Thuộc tính của hàm hash, rủi ro va chạm và tầm quan trọng của việc chọn thuật toán.',
      readingTime: '12 phút đọc',
      content: `
        <p>Hash chuyển đổi dữ liệu thành dấu vân tay có độ dài cố định. Nó rất cần thiết để xác minh tính toàn vẹn, ký dữ liệu và hỗ trợ nhiều luồng bảo mật.</p>
        <h2>Tại sao điều này quan trọng</h2>
        <p>Hàm hash tốt phải có tính xác định, nhanh, một chiều và chống va chạm. Nếu một trong những thuộc tính này bị vi phạm, tính hữu dụng của nó sẽ giảm nhanh chóng.</p>
        <h2>Chọn thuật toán</h2>
        <ul>
          <li>MD5 không còn phù hợp cho mục đích bảo mật</li>
          <li>SHA-256 là lựa chọn tiêu chuẩn cho tính toàn vẹn</li>
          <li>SHA-3 cung cấp cấu trúc nội bộ khác như một giải pháp thay thế</li>
        </ul>
        <h2>Sử dụng thực tế</h2>
        <p>Để xác minh tệp, hãy dùng SHA-256 hoặc cao hơn. Với mật khẩu, hãy dùng bcrypt hoặc Argon2, không phải hash nhanh. Bạn có thể kiểm tra cục bộ bằng Hash Calculator.</p>
      `
    },
    'regex-guide': {
      title: 'Hướng dẫn thực hành biểu thức chính quy',
      description: 'Các thành phần cơ bản của regex, các mẫu phổ biến và bẫy hiệu suất được giải thích theo cách thực tiễn.',
      readingTime: '14 phút đọc',
      content: `
        <p>Biểu thức chính quy rất mạnh mẽ để tìm kiếm và chuyển đổi văn bản, nhưng sẽ khó bảo trì khi chúng phát triển quá lớn. Tốt nhất là hiểu rõ các khối cơ bản trước.</p>
        <h2>Các thành phần cơ bản</h2>
        <ul>
          <li>Literal, lớp ký tự, bộ định lượng và neo tạo nền tảng</li>
          <li>Phân biệt hành vi greedy và lazy</li>
          <li>Chỉ dùng lookahead/lookbehind khi thực sự mang lại sự rõ ràng</li>
        </ul>
        <h2>Rủi ro hiệu suất</h2>
        <p>Các bộ định lượng lồng nhau có thể gây ra catastrophic backtracking. Hãy kiểm tra với các chuỗi dài không khớp và trực quan hóa các mẫu phức tạp trước khi triển khai.</p>
        <h2>Ứng dụng thực tế</h2>
        <p>Chúng rất hữu ích để xác thực email, trích xuất ngày tháng hoặc che giấu log. Regex Studio giúp trực quan hóa luồng mẫu và debug nhanh hơn.</p>
      `
    },
    'curl-essentials': {
      title: 'cURL cho nhà phát triển: lệnh và kỹ thuật thiết yếu',
      description: 'Tóm tắt thực hành về các tùy chọn cURL, xác thực và debug cho API hiện đại.',
      readingTime: '12 phút đọc',
      content: `
        <p>cURL là công cụ tiêu chuẩn để kiểm tra API và debug lưu lượng mạng. Nó cho phép bạn thấy rõ những gì bạn đang gửi và máy chủ trả về.</p>
        <h2>Sử dụng cơ bản</h2>
        <ul>
          <li><code>-X</code> cho phương thức HTTP</li>
          <li><code>-H</code> cho header</li>
          <li><code>-d</code> cho body</li>
          <li><code>-v</code> và <code>--trace</code> để debug</li>
        </ul>
        <h2>Xác thực và phiên</h2>
        <p>Basic Auth được gửi bằng <code>-u</code> và Bearer token qua header Authorization. Bạn cũng có thể lưu cookie và tái sử dụng chúng để mô phỏng các phiên đầy đủ.</p>
        <h2>Mẹo thực tế</h2>
        <p>Tách payload JSON lớn vào các tệp, chỉ định timeout và theo dõi redirect khi cần. Curl Studio đơn giản hóa việc xây dựng và đọc các lệnh phức tạp.</p>
      `
    },
    'csp-implementation-guide': {
      title: 'Hướng dẫn thực hành triển khai Content Security Policy',
      description: 'Cách triển khai CSP an toàn bằng nonce, hash và strict-dynamic.',
      readingTime: '10 phút đọc',
      content: `
        <p>CSP là một trong những biện pháp phòng thủ hiệu quả nhất chống lại XSS. Ý tưởng cốt lõi là chỉ cho phép các tài nguyên được khai báo rõ ràng và chặn mọi thứ còn lại theo mặc định.</p>
        <h2>Các directive chính</h2>
        <ul>
          <li><code>default-src</code> định nghĩa nền tảng của chính sách</li>
          <li><code>script-src</code> và <code>style-src</code> thường là quan trọng nhất</li>
          <li><code>connect-src</code> và <code>frame-ancestors</code> cũng rất quan trọng</li>
        </ul>
        <h2>Cách triển khai</h2>
        <p>Bắt đầu với Report-Only để xem chính sách sẽ phá vỡ gì, sau đó áp dụng nonce hoặc hash cho nội dung inline cần thiết. Tránh <code>'unsafe-inline'</code> càng nhiều càng tốt.</p>
        <h2>Tăng cường hiện đại</h2>
        <p>Kết hợp strict-dynamic, Trusted Types và upgrade-insecure-requests để có tư thế bảo mật vững chắc hơn. CSP Builder giúp xây dựng quy tắc không có lỗi.</p>
      `
    },
    'password-security-guide': {
      title: 'Bảo mật mật khẩu năm 2026: những gì mỗi nhà phát triển cần biết',
      description: 'Entropy, hướng dẫn NIST, Argon2, MFA và passkey được giải thích từ góc độ thực tiễn.',
      readingTime: '12 phút đọc',
      content: `
        <p>Bảo mật mật khẩu hiện đại không còn xoay quanh các quy tắc độ phức tạp tùy tiện nữa. Độ dài, tính ngẫu nhiên và khả năng chống phishing quan trọng hơn.</p>
        <h2>Độ dài chiến thắng</h2>
        <p>Một passphrase dài thường mạnh hơn và dễ dùng hơn một mật khẩu ngắn đầy ký hiệu. Điều quan trọng là tránh các mẫu có thể đoán trước.</p>
        <h2>Lưu trữ với hash chậm</h2>
        <p>Để lưu trữ mật khẩu, đừng dùng hash nhanh như SHA-256. Hãy dùng Argon2 hoặc bcrypt, với salt và nếu áp dụng, chiến lược bổ sung như pepper.</p>
        <h2>MFA và passkey</h2>
        <p>Đối với các tài khoản nhạy cảm, mật khẩu một mình không đủ. WebAuthn và passkey cung cấp khả năng phòng thủ mạnh hơn nhiều chống lại phishing và đánh cắp thông tin xác thực.</p>
        <h2>Danh sách kiểm tra vận hành</h2>
        <ul>
          <li>Cho phép mật khẩu dài</li>
          <li>Chặn mật khẩu đã bị lộ</li>
          <li>Tránh thay đổi định kỳ bắt buộc không có lý do</li>
          <li>Áp dụng rate limiting cho đăng nhập và đặt lại mật khẩu</li>
        </ul>
      `
    },
    'jwt-explained': {
      title: 'JWT giải thích: cấu trúc, bảo mật và lỗi thường gặp',
      description: 'Ba phần của JWT, các điểm xác thực bắt buộc và những bẫy phổ biến nhất trong môi trường production.',
      readingTime: '13 phút đọc',
      content: `
        <p>JWT đơn giản hóa xác thực không trạng thái, nhưng cũng tạo điều kiện phân phối thông tin xác thực khó thu hồi. Kỷ luật xác thực quan trọng hơn sự tiện lợi.</p>
        <h2>Ba phần</h2>
        <p>Một JWT có header, payload và signature. Payload không được mã hóa theo mặc định, vì vậy không được chứa bí mật hay thông tin nhạy cảm.</p>
        <h2>Những gì bạn phải luôn xác thực</h2>
        <ul>
          <li>Các thuật toán được phép một cách rõ ràng</li>
          <li><code>exp</code>, <code>iss</code> và <code>aud</code></li>
          <li>Access token có thời gian sống ngắn</li>
          <li>Refresh token riêng biệt khi cần thiết</li>
        </ul>
        <h2>Thu hồi và vận hành</h2>
        <p>Vì JWT đã phát hành khó thu hồi, nên kết hợp TTL ngắn, xoay vòng khóa và khi cần thiết, danh sách thu hồi.</p>
        <h2>Mẹo thực tế</h2>
        <p>Kiểm tra token bằng các công cụ cục bộ như JWT Inspector. Gửi token thực đến bộ giải mã bên ngoài là thực hành vận hành không tốt.</p>
      `
    },
    'x509-certificates-explained': {
      title: 'Chứng chỉ X.509: TLS/SSL thực sự hoạt động như thế nào',
      description: 'Chuỗi chứng chỉ, tin cậy CA, SAN, CSR và thu hồi được giải thích theo cách thực tế.',
      readingTime: '10 phút đọc',
      content: `
        <p>Chứng chỉ X.509 liên kết khóa công khai với một danh tính. Đằng sau ổ khóa của trình duyệt là một chuỗi tin cậy hoàn chỉnh giúp TLS hoạt động được.</p>
        <h2>Các trường quan trọng</h2>
        <p>Subject, issuer, hiệu lực, khóa công khai, thuật toán chữ ký và SAN là các trường ảnh hưởng nhiều nhất đến việc triển khai thực tế. SAN đặc biệt quan trọng ngày nay.</p>
        <h2>Chuỗi tin cậy</h2>
        <p>Trình duyệt không chỉ xác thực chứng chỉ cuối. Nó cũng kiểm tra các chứng chỉ trung gian đến một gốc tin cậy. Chuỗi không đầy đủ có thể làm hỏng client di động hoặc công cụ CLI.</p>
        <h2>CSR và vận hành</h2>
        <p>Để phát hành chứng chỉ, trước tiên bạn tạo khóa riêng tư rồi CSR. Khóa riêng tư không bao giờ được rời khỏi môi trường bạn kiểm soát.</p>
        <h2>Vấn đề thường gặp</h2>
        <ul>
          <li>Chứng chỉ hết hạn</li>
          <li>Chuỗi không đầy đủ</li>
          <li>Tên máy chủ không khớp</li>
          <li>Gốc không được tin cậy</li>
        </ul>
      `
    },
    'saml-oauth-oidc-compared': {
      title: 'SAML vs OAuth vs OIDC: cách chọn giao thức đúng',
      description: 'Sự khác biệt chính giữa SSO doanh nghiệp, ủy quyền truy cập API và danh tính hiện đại.',
      readingTime: '11 phút đọc',
      content: `
        <p>SAML, OAuth 2.0 và OIDC không giải quyết cùng một vấn đề. Trước khi chọn, cần phân biệt rõ ràng xác thực, danh tính và ủy quyền.</p>
        <h2>SAML</h2>
        <p>SAML vẫn là nền tảng vững chắc cho SSO doanh nghiệp. Nặng hơn do nền tảng XML, nhưng tích hợp rất tốt với thư mục doanh nghiệp và yêu cầu B2B.</p>
        <h2>OAuth 2.0</h2>
        <p>OAuth không phải giao thức đăng nhập mà là framework ủy quyền. Nó dùng để ủy quyền truy cập giới hạn vào tài nguyên mà không chia sẻ mật khẩu người dùng.</p>
        <h2>OIDC</h2>
        <p>OIDC thêm một lớp danh tính trên OAuth. Nhờ ID Token và tự động khám phá, đây là lựa chọn tự nhiên cho trải nghiệm đăng nhập hiện đại.</p>
        <h2>Quy tắc nhanh</h2>
        <ul>
          <li>SSO doanh nghiệp: SAML</li>
          <li>Truy cập API được ủy quyền: OAuth</li>
          <li>Đăng nhập hiện đại và danh tính: OIDC</li>
        </ul>
      `
    },
    'cron-expressions-guide': {
      title: 'Làm chủ biểu thức cron: lập lịch tác vụ như một chuyên gia',
      description: 'Cú pháp, ký tự đặc biệt, bẫy múi giờ và các thực hành vận hành tốt nhất cho cron.',
      readingTime: '9 phút đọc',
      content: `
        <p>Biểu thức cron có vẻ đơn giản, nhưng thường tạo ra các sự cố vận hành tốn kém. Biết cú pháp thôi chưa đủ — bạn cũng phải nghĩ đến múi giờ, thử lại và chồng chéo.</p>
        <h2>Cấu trúc cơ bản</h2>
        <p>Định dạng cổ điển sử dụng năm trường: phút, giờ, ngày trong tháng, tháng và ngày trong tuần. Từ đó kết hợp phạm vi, danh sách, bước và ký tự đại diện.</p>
        <h2>Điều thường gây nhầm lẫn</h2>
        <p>Sự tương tác giữa ngày trong tháng và ngày trong tuần tạo ra nhiều lỗi. Trước khi triển khai, hãy luôn kiểm tra các lần chạy thực tế tiếp theo.</p>
        <h2>Thực hành vận hành tốt</h2>
        <ul>
          <li>Xác minh múi giờ của môi trường</li>
          <li>Tránh các lần chạy chồng chéo</li>
          <li>Thêm log và health check</li>
          <li>Thiết kế logic thử lại riêng biệt</li>
        </ul>
      `
    },
    'regex-guide-for-beginners': {
      title: 'Biểu thức chính quy: hướng dẫn thực hành cho người mới bắt đầu',
      description: 'Giới thiệu nhanh về kiến thức cơ bản của regex với các ví dụ hữu ích cho xác thực, log và làm sạch văn bản.',
      readingTime: '10 phút đọc',
      content: `
        <p>Biểu thức chính quy cho phép tìm kiếm và chuyển đổi các mẫu văn bản chỉ với vài dòng code. Chúng có vẻ khó hiểu lúc đầu, nhưng các ký hiệu cơ bản đã bao gồm phần lớn công việc hàng ngày.</p>
        <h2>Các khối cơ bản</h2>
        <ul>
          <li><code>.</code> — bất kỳ ký tự nào</li>
          <li><code>*</code>, <code>+</code>, <code>?</code> — lặp lại</li>
          <li><code>[abc]</code> — lớp ký tự</li>
          <li><code>^</code> và <code>$</code> — đầu và cuối</li>
        </ul>
        <h2>Ví dụ hữu ích</h2>
        <p>Chúng rất hữu ích để xác thực email, tìm kiếm địa chỉ IP hoặc trích xuất timestamp trong log.</p>
        <h2>Lỗi thường gặp</h2>
        <ul>
          <li>Catastrophic backtracking do các bộ định lượng lồng nhau</li>
          <li>Nhầm lẫn hành vi greedy và lazy</li>
          <li>Quên escape trong lớp ký tự</li>
        </ul>
      `
    },
    'hash-algorithms-compared': {
      title: 'So sánh các thuật toán hash: MD5 vs SHA-256 vs SHA-3',
      description: 'Tóm tắt ngắn gọn về sự khác biệt giữa các thuật toán hash phổ biến và khi nào nên dùng từng loại.',
      readingTime: '6 phút đọc',
      content: `
        <p>Hàm hash chuyển đổi dữ liệu thành đầu ra có độ dài cố định để xác minh tính toàn vẹn và xây dựng chữ ký. Chọn thuật toán đúng phụ thuộc vào mục tiêu.</p>
        <h2>MD5</h2>
        <p>MD5 nhanh nhưng không an toàn cho mục đích tin cậy. Các va chạm thực tế loại nó ra khỏi bảo mật thực sự.</p>
        <h2>SHA-256</h2>
        <p>SHA-256 là lựa chọn mặc định phổ biến nhất cho tính toàn vẹn, chứng chỉ và ký artifact.</p>
        <h2>SHA-3</h2>
        <p>SHA-3 cung cấp cấu trúc nội bộ khác và có thể phục vụ như một giải pháp thay thế hiện đại khi tìm kiếm sự đa dạng mật mã.</p>
        <h2>Quy tắc nhanh</h2>
        <ul>
          <li>Tính toàn vẹn tệp: SHA-256</li>
          <li>Mật khẩu: bcrypt / Argon2</li>
          <li>Giải pháp thay thế cấu trúc: SHA-3</li>
        </ul>
      `
    }
  }
};

export function getLocalizedBlogArticle(baseArticle, lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  if (currentLang === DEFAULT_LANGUAGE) {
    return baseArticle;
  }

  const override = {
    ...BLOG_LOCALE_OVERRIDES[currentLang]?.[baseArticle.slug],
    ...BLOG_LONG_LOCALE_OVERRIDES[currentLang]?.[baseArticle.slug]
  };

  return Object.keys(override).length > 0 ? { ...baseArticle, ...override } : baseArticle;
}
