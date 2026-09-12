import { getAdPolicySnapshot } from "../utils/ads.js";
import { PRODUCTION_TOOL_COUNT } from "../utils/tool-registry.js";
import { DEFAULT_LANGUAGE, normalizeLanguage } from "../utils/i18n.js";
import { REVIEWED_LEGAL_CONTENT } from "./generated-content-locales.js";

const LEGAL_CONTENT = {
  terms: {
    en: {
      sections: [
        {
          heading: "1. Acceptance of Terms",
          paragraphs: [
            "By accessing and using SimpleTool App, you agree to these terms. If you do not agree, do not use the service.",
          ],
        },
        {
          heading: "2. Description of Service",
          paragraphs: [
            "SimpleTool App provides privacy-focused web utilities such as formatters, generators, converters, and developer support tools.",
            "All tool processing is intended to happen client-side in your browser. We do not intentionally collect or retain tool input content on our servers.",
          ],
          list: [
            "Password and username generators",
            "Encoding, decoding, and conversion tools",
            "Developer debugging and reference tools",
            "Client-side games and utilities",
          ],
        },
        {
          heading: "3. Privacy and Data Processing",
          paragraphs: ["We design the service around privacy-first operation."],
          list: [
            "Tool computations happen client-side where possible",
            "We do not require accounts to use the service",
            "Operational infrastructure may keep limited request logs for abuse prevention",
          ],
        },
        {
          heading: "4. Advertising",
          paragraphs: [
            "The service is free to use and may show non-personalized Google ads on a small allow list of pages: JSON Formatter below the editor, and the About, Privacy, Terms, and changelog pages. Password, SSH, Token Studio, WireGuard, certificates, secret scanner, and encoding pages never load advertising scripts.",
          ],
        },
        {
          heading: "5. Permitted Use",
          paragraphs: [
            "You may use the service for lawful personal or commercial purposes.",
          ],
          list: [
            "Use the tools for legitimate work",
            "Generate output for your own applications or workflows",
            "Avoid abuse, overload, or illegal activity",
            "Do not attempt to extract or misuse the service infrastructure",
          ],
        },
        {
          heading: "6. Disclaimer",
          paragraphs: [
            'The service is provided "as is" without warranties of availability, fitness, or uninterrupted operation. You are responsible for validating whether a tool is suitable for your use case.',
          ],
        },
        {
          heading: "7. Limitation of Liability",
          paragraphs: [
            "SimpleTool App and its operators are not liable for damages arising from use or inability to use the service, including loss of data or business interruption.",
          ],
        },
        {
          heading: "8. Security Best Practices",
          list: [
            "Store generated credentials securely",
            "Use unique passwords and MFA where possible",
            "Keep devices and browsers updated",
            "Avoid sharing secrets over insecure channels",
          ],
        },
        {
          heading: "9. Changes",
          paragraphs: [
            "We may update these terms over time. Continued use of the service after changes means you accept the revised terms.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "For questions about these terms:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    ko: {
      sections: [
        {
          heading: "1. 약관 동의",
          paragraphs: [
            "SimpleTool App에 접속하고 사용하는 순간 본 약관에 동의한 것으로 봅니다. 동의하지 않는다면 서비스를 사용하지 마세요.",
          ],
        },
        {
          heading: "2. 서비스 설명",
          paragraphs: [
            "SimpleTool App은 포매터, 생성기, 변환기, 개발자 지원 도구 등 개인정보 보호 중심의 웹 유틸리티를 제공합니다.",
            "도구 처리는 가능한 한 브라우저 내부에서 이뤄지며, 도구 입력 본문을 서버에 의도적으로 수집하거나 보관하지 않습니다.",
          ],
          list: [
            "비밀번호 및 사용자명 생성기",
            "인코딩, 디코딩, 변환 도구",
            "개발자 디버깅 및 레퍼런스 도구",
            "클라이언트 사이드 게임 및 유틸리티",
          ],
        },
        {
          heading: "3. 개인정보 및 데이터 처리",
          paragraphs: ["서비스는 프라이버시 우선 원칙에 따라 설계됩니다."],
          list: [
            "도구 계산은 가능한 한 클라이언트에서 수행됩니다",
            "서비스 사용에 계정이 필요하지 않습니다",
            "남용 방지를 위해 인프라 수준의 제한적 요청 로그가 남을 수 있습니다",
          ],
        },
        {
          heading: "4. 광고",
          paragraphs: [
            "서비스는 무료이며, JSON Formatter 에디터 아래·About / Privacy / Terms / changelog 페이지에만 비개인화 Google 광고를 둘 수 있습니다. 비밀번호, SSH, Token Studio, WireGuard, 인증서, 시크릿 스캐너, 인코딩 페이지는 광고 스크립트를 로드하지 않습니다.",
          ],
        },
        {
          heading: "5. 허용되는 사용",
          paragraphs: [
            "합법적인 개인용 또는 상업용 목적으로 서비스를 사용할 수 있습니다.",
          ],
          list: [
            "정당한 업무와 학습에 도구를 사용",
            "출력을 자신의 애플리케이션이나 워크플로에 활용",
            "남용, 과부하, 불법 활동 금지",
            "서비스 인프라를 추출하거나 악용하려는 시도 금지",
          ],
        },
        {
          heading: "6. 면책",
          paragraphs: [
            '서비스는 가용성, 적합성, 무중단 운영에 대한 보증 없이 "있는 그대로" 제공됩니다. 특정 용도에 적합한지 여부는 사용자가 직접 판단해야 합니다.',
          ],
        },
        {
          heading: "7. 책임 제한",
          paragraphs: [
            "SimpleTool App 및 운영자는 서비스 사용 또는 사용 불가로 인해 발생하는 손해, 데이터 손실, 업무 중단 등에 대해 책임을 지지 않습니다.",
          ],
        },
        {
          heading: "8. 보안 권장 사항",
          list: [
            "생성된 자격 증명은 안전하게 보관하세요",
            "가능한 경우 고유 비밀번호와 MFA를 사용하세요",
            "브라우저와 기기를 최신 상태로 유지하세요",
            "민감한 정보는 안전하지 않은 채널로 공유하지 마세요",
          ],
        },
        {
          heading: "9. 변경",
          paragraphs: [
            "약관은 수시로 변경될 수 있으며, 변경 후 서비스를 계속 사용하면 개정 약관에 동의한 것으로 봅니다.",
          ],
        },
        {
          heading: "10. 문의",
          paragraphs: ["약관 관련 문의:", "hello@simpletool.app"],
        },
      ],
    },
    ja: {
      sections: [
        {
          heading: "1. 利用規約への同意",
          paragraphs: [
            "SimpleTool App にアクセスして利用することで、本規約に同意したものとみなします。不同意の場合は利用しないでください。",
          ],
        },
        {
          heading: "2. サービス概要",
          paragraphs: [
            "SimpleTool App は、フォーマッタ、ジェネレータ、変換ツール、開発者支援ツールなどのプライバシー重視の Web ユーティリティを提供します。",
            "処理は可能な限りブラウザ内で行われ、ツール入力内容をサーバー側で意図的に収集・保存しません。",
          ],
          list: [
            "パスワードやユーザー名の生成",
            "エンコード、デコード、変換ツール",
            "開発向けデバッグ・リファレンスツール",
            "クライアントサイドのゲームとユーティリティ",
          ],
        },
        {
          heading: "3. プライバシーとデータ処理",
          paragraphs: [
            "本サービスはプライバシー優先の方針で設計されています。",
          ],
          list: [
            "ツールの計算は可能な限りクライアント側で行われます",
            "利用にアカウント登録は不要です",
            "不正利用防止のため、インフラ側で限定的なリクエストログが残る場合があります",
          ],
        },
        {
          heading: "4. 広告",
          paragraphs: [
            "本サービスは無料です。非パーソナライズの Google 広告を、JSON Formatter のエディタ下、About / Privacy / Terms / changelog ページに掲載する場合があります。パスワード、SSH、Token Studio、WireGuard、証明書、シークレットスキャナー、エンコーディングのページでは広告スクリプトを読み込みません。",
          ],
        },
        {
          heading: "5. 許可される利用",
          paragraphs: ["適法な個人利用および商用利用が可能です。"],
          list: [
            "正当な業務や学習にツールを利用すること",
            "出力結果を自分のアプリケーションやワークフローに利用すること",
            "乱用、過負荷、違法行為を行わないこと",
            "サービス基盤の抽出や悪用を試みないこと",
          ],
        },
        {
          heading: "6. 免責",
          paragraphs: [
            "本サービスは可用性、適合性、無停止運用を含むいかなる保証もなく「現状のまま」提供されます。用途への適合性は利用者自身が判断してください。",
          ],
        },
        {
          heading: "7. 責任制限",
          paragraphs: [
            "SimpleTool App および運営者は、サービスの利用または利用不能によって生じる損害、データ損失、業務中断等について責任を負いません。",
          ],
        },
        {
          heading: "8. セキュリティのベストプラクティス",
          list: [
            "生成した認証情報は安全に保管してください",
            "可能な限り一意のパスワードと MFA を使用してください",
            "ブラウザと端末を最新状態に保ってください",
            "秘密情報を安全でないチャネルで共有しないでください",
          ],
        },
        {
          heading: "9. 変更",
          paragraphs: [
            "本規約は随時更新される場合があります。変更後も継続して利用する場合、改定後の規約に同意したものとみなします。",
          ],
        },
        {
          heading: "10. お問い合わせ",
          paragraphs: ["利用規約に関するお問い合わせ:", "hello@simpletool.app"],
        },
      ],
    },
    es: {
      sections: [
        {
          heading: "1. Aceptación de los términos",
          paragraphs: [
            "Al acceder y usar SimpleTool App, aceptas estos términos. Si no estás de acuerdo, no utilices el servicio.",
          ],
        },
        {
          heading: "2. Descripción del servicio",
          paragraphs: [
            "SimpleTool App ofrece utilidades web centradas en la privacidad, como formateadores, generadores, convertidores y herramientas de apoyo para desarrolladores.",
            "El procesamiento se realiza dentro del navegador siempre que sea posible y no recopilamos ni conservamos intencionadamente el contenido que introduces en las herramientas.",
          ],
          list: [
            "Generadores de contraseñas y nombres de usuario",
            "Herramientas de codificación, decodificación y conversión",
            "Utilidades de depuración y referencia para desarrolladores",
            "Juegos y utilidades del lado del cliente",
          ],
        },
        {
          heading: "3. Privacidad y tratamiento de datos",
          paragraphs: [
            "El servicio está diseñado con un enfoque de privacidad primero.",
          ],
          list: [
            "Los cálculos se realizan del lado del cliente siempre que sea posible",
            "No se requiere crear una cuenta",
            "La infraestructura puede conservar registros mínimos de solicitudes para prevenir abuso",
            "Los proveedores de anuncios de terceros pueden procesar cookies o identificadores según sus propias políticas",
          ],
        },
        {
          heading: "4. Publicidad",
          paragraphs: [
            "El servicio es gratuito y puede mostrar anuncios no personalizados de Google en una lista reducida de páginas: JSON Formatter debajo del editor, y las páginas About, Privacy, Terms y changelog. Las páginas de contraseñas, SSH, Token Studio, WireGuard, certificados, secret scanner y encoding nunca cargan scripts publicitarios.",
          ],
        },
        {
          heading: "5. Uso permitido",
          paragraphs: [
            "Puedes usar el servicio con fines personales o comerciales siempre que sean legales.",
          ],
          list: [
            "Usar las herramientas para trabajo o aprendizaje legítimo",
            "Utilizar los resultados en tus propias aplicaciones o flujos",
            "No abusar, sobrecargar ni utilizar el servicio para actividades ilegales",
            "No intentar extraer ni explotar la infraestructura del servicio",
          ],
        },
        {
          heading: "6. Exención de garantías",
          paragraphs: [
            'El servicio se ofrece "tal cual", sin garantías sobre disponibilidad, idoneidad o funcionamiento ininterrumpido. Debes evaluar si cada herramienta se ajusta a tu caso de uso.',
          ],
        },
        {
          heading: "7. Limitación de responsabilidad",
          paragraphs: [
            "SimpleTool App y sus operadores no serán responsables por daños derivados del uso o la imposibilidad de uso del servicio, incluidos pérdida de datos o interrupción del negocio.",
          ],
        },
        {
          heading: "8. Buenas prácticas de seguridad",
          list: [
            "Guarda las credenciales generadas de forma segura",
            "Usa contraseñas únicas y MFA siempre que sea posible",
            "Mantén el navegador y el dispositivo actualizados",
            "No compartas secretos por canales inseguros",
          ],
        },
        {
          heading: "9. Cambios",
          paragraphs: [
            "Podemos actualizar estos términos con el tiempo. Si sigues usando el servicio después de los cambios, se considerará que aceptas la versión revisada.",
          ],
        },
        {
          heading: "10. Contacto",
          paragraphs: [
            "Para consultas sobre estos términos:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          heading: "1. 接受条款",
          paragraphs: [
            "访问并使用 SimpleTool App 即表示您同意本条款。如不同意，请勿使用本服务。",
          ],
        },
        {
          heading: "2. 服务说明",
          paragraphs: [
            "SimpleTool App 提供以隐私为核心的网页工具，包括格式化工具、生成器、转换器及开发者辅助工具。",
            "工具处理尽可能在您的浏览器中本地完成，我们不会有意在服务器上收集或留存工具输入内容。",
          ],
          list: [
            "密码与用户名生成器",
            "编码、解码与转换工具",
            "开发者调试与参考工具",
            "客户端游戏与实用工具",
          ],
        },
        {
          heading: "3. 隐私与数据处理",
          paragraphs: ["本服务以隐私优先原则设计。"],
          list: [
            "工具计算尽可能在客户端执行",
            "使用服务无需注册账号",
            "运营基础设施可能保留有限的请求日志以防止滥用",
            "第三方广告服务商可能依据其自身政策处理 Cookie 或标识符",
          ],
        },
        {
          heading: "4. 广告",
          paragraphs: [
            "本服务免费，并可能在少量允许的页面展示非个性化 Google 广告：JSON Formatter 编辑器下方，以及 About、Privacy、Terms 和 changelog 页面。密码、SSH、Token Studio、WireGuard、证书、密钥扫描、编码页面不会加载广告脚本。",
          ],
        },
        {
          heading: "5. 允许的使用方式",
          paragraphs: ["您可将本服务用于合法的个人或商业目的。"],
          list: [
            "将工具用于合法工作或学习",
            "将生成内容用于您自己的应用程序或工作流",
            "禁止滥用、过载或从事非法活动",
            "禁止尝试提取或恶意利用服务基础设施",
          ],
        },
        {
          heading: "6. 免责声明",
          paragraphs: [
            '本服务按"现状"提供，不对可用性、适用性或不间断运行作出任何保证。您有责任评估工具是否适合您的使用场景。',
          ],
        },
        {
          heading: "7. 责任限制",
          paragraphs: [
            "SimpleTool App 及其运营者不对因使用或无法使用本服务而引起的损失承担责任，包括数据丢失或业务中断。",
          ],
        },
        {
          heading: "8. 安全最佳实践",
          list: [
            "请妥善保管生成的凭据",
            "尽可能使用唯一密码并启用多重身份验证",
            "保持设备和浏览器更新",
            "避免通过不安全渠道共享敏感信息",
          ],
        },
        {
          heading: "9. 条款变更",
          paragraphs: [
            "我们可能不时更新本条款。变更后继续使用本服务即表示您接受修订后的条款。",
          ],
        },
        {
          heading: "10. 联系方式",
          paragraphs: ["如有关于本条款的问题：", "hello@simpletool.app"],
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          heading: "1. 條款同意",
          paragraphs: [
            "存取並使用 SimpleTool App 即表示您同意本條款。如不同意，請勿使用本服務。",
          ],
        },
        {
          heading: "2. 服務說明",
          paragraphs: [
            "SimpleTool App 提供以隱私為核心的網頁工具，包括格式化工具、產生器、轉換器及開發者輔助工具。",
            "工具處理盡可能在您的瀏覽器中本地完成，我們不會刻意在伺服器上收集或留存工具輸入內容。",
          ],
          list: [
            "密碼與使用者名稱產生器",
            "編碼、解碼與轉換工具",
            "開發者除錯與參考工具",
            "用戶端遊戲與實用工具",
          ],
        },
        {
          heading: "3. 隱私與資料處理",
          paragraphs: ["本服務以隱私優先原則設計。"],
          list: [
            "工具計算盡可能在用戶端執行",
            "使用服務無需註冊帳號",
            "營運基礎設施可能保留有限的請求日誌以防止濫用",
            "第三方廣告服務商可能依據其自身政策處理 Cookie 或識別碼",
          ],
        },
        {
          heading: "4. 廣告",
          paragraphs: [
            "本服務免費，並可能在少量允許的頁面展示非個人化 Google 廣告：JSON Formatter 編輯器下方，以及 About、Privacy、Terms 與 changelog 頁面。密碼、SSH、Token Studio、WireGuard、憑證、祕密掃描、編碼頁面不會載入廣告指令碼。",
          ],
        },
        {
          heading: "5. 允許的使用方式",
          paragraphs: ["您可將本服務用於合法的個人或商業目的。"],
          list: [
            "將工具用於合法工作或學習",
            "將產生內容用於您自己的應用程式或工作流程",
            "禁止濫用、過載或從事非法活動",
            "禁止嘗試提取或惡意利用服務基礎設施",
          ],
        },
        {
          heading: "6. 免責聲明",
          paragraphs: [
            "本服務按「現狀」提供，不對可用性、適用性或不間斷運行作出任何保證。您有責任評估工具是否適合您的使用情境。",
          ],
        },
        {
          heading: "7. 責任限制",
          paragraphs: [
            "SimpleTool App 及其營運者不對因使用或無法使用本服務而引起的損失承擔責任，包括資料遺失或業務中斷。",
          ],
        },
        {
          heading: "8. 安全最佳實踐",
          list: [
            "請妥善保管產生的憑證",
            "盡可能使用唯一密碼並啟用多重身份驗證",
            "保持裝置和瀏覽器更新",
            "避免透過不安全管道分享敏感資訊",
          ],
        },
        {
          heading: "9. 條款變更",
          paragraphs: [
            "我們可能不時更新本條款。變更後繼續使用本服務即表示您接受修訂後的條款。",
          ],
        },
        {
          heading: "10. 聯絡方式",
          paragraphs: ["如有關於本條款的問題：", "hello@simpletool.app"],
        },
      ],
    },
    fr: {
      sections: [
        {
          heading: "1. Acceptation des conditions",
          paragraphs: [
            "En accédant à SimpleTool App et en l'utilisant, vous acceptez ces conditions. Si vous n'êtes pas d'accord, n'utilisez pas le service.",
          ],
        },
        {
          heading: "2. Description du service",
          paragraphs: [
            "SimpleTool App propose des utilitaires web axés sur la confidentialité : formateurs, générateurs, convertisseurs et outils d'assistance aux développeurs.",
            "Le traitement s'effectue dans votre navigateur dans la mesure du possible. Nous ne collectons ni ne conservons intentionnellement le contenu saisi dans les outils sur nos serveurs.",
          ],
          list: [
            "Générateurs de mots de passe et de noms d'utilisateur",
            "Outils d'encodage, de décodage et de conversion",
            "Outils de débogage et de référence pour développeurs",
            "Jeux et utilitaires côté client",
          ],
        },
        {
          heading: "3. Confidentialité et traitement des données",
          paragraphs: [
            "Le service est conçu selon le principe de la confidentialité par défaut.",
          ],
          list: [
            "Les calculs des outils s'effectuent côté client dans la mesure du possible",
            "Aucun compte n'est requis pour utiliser le service",
            "L'infrastructure opérationnelle peut conserver des journaux de requêtes limités à des fins de prévention des abus",
          ],
        },
        {
          heading: "4. Publicité",
          paragraphs: [
            "Le service est gratuit et peut afficher des publicités Google non personnalisées sur une liste limitée de pages : JSON Formatter sous l'éditeur, ainsi que les pages About, Privacy, Terms et changelog. Les pages mot de passe, SSH, Token Studio, WireGuard, certificats, secret scanner et encodage ne chargent jamais de scripts publicitaires.",
          ],
        },
        {
          heading: "5. Utilisation autorisée",
          paragraphs: [
            "Vous pouvez utiliser le service à des fins personnelles ou commerciales licites.",
          ],
          list: [
            "Utiliser les outils pour un travail ou un apprentissage légitime",
            "Utiliser les résultats générés dans vos propres applications ou flux de travail",
            "Éviter tout abus, surcharge ou activité illégale",
            "Ne pas tenter d'extraire ou de détourner l'infrastructure du service",
          ],
        },
        {
          heading: "6. Clause de non-responsabilité",
          paragraphs: [
            "Le service est fourni « en l'état », sans garantie de disponibilité, d'adéquation ou de fonctionnement ininterrompu. Il vous appartient de déterminer si un outil convient à votre cas d'usage.",
          ],
        },
        {
          heading: "7. Limitation de responsabilité",
          paragraphs: [
            "SimpleTool App et ses opérateurs ne sauraient être tenus responsables des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le service, y compris la perte de données ou l'interruption d'activité.",
          ],
        },
        {
          heading: "8. Bonnes pratiques de sécurité",
          list: [
            "Conservez les identifiants générés en lieu sûr",
            "Utilisez des mots de passe uniques et l'authentification multifacteur dans la mesure du possible",
            "Maintenez vos appareils et navigateurs à jour",
            "Évitez de partager des informations sensibles via des canaux non sécurisés",
          ],
        },
        {
          heading: "9. Modifications",
          paragraphs: [
            "Nous pouvons mettre à jour ces conditions à tout moment. La poursuite de l'utilisation du service après toute modification vaut acceptation des conditions révisées.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Pour toute question relative à ces conditions :",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    de: {
      sections: [
        {
          heading: "1. Zustimmung zu den Nutzungsbedingungen",
          paragraphs: [
            "Durch den Zugriff auf SimpleTool App und dessen Nutzung stimmen Sie diesen Bedingungen zu. Wenn Sie nicht zustimmen, nutzen Sie den Dienst bitte nicht.",
          ],
        },
        {
          heading: "2. Beschreibung des Dienstes",
          paragraphs: [
            "SimpleTool App bietet datenschutzorientierte Web-Hilfsprogramme wie Formatierer, Generatoren, Konverter und Entwickler-Tools.",
            "Die Verarbeitung erfolgt soweit möglich im Browser. Wir erfassen oder speichern Tool-Eingaben auf unseren Servern nicht absichtlich.",
          ],
          list: [
            "Passwort- und Benutzernamen-Generatoren",
            "Tools zum Kodieren, Dekodieren und Konvertieren",
            "Debugging- und Referenz-Tools für Entwickler",
            "Client-seitige Spiele und Hilfsprogramme",
          ],
        },
        {
          heading: "3. Datenschutz und Datenverarbeitung",
          paragraphs: [
            'Der Dienst ist nach dem Prinzip „Privacy by Default" konzipiert.',
          ],
          list: [
            "Tool-Berechnungen erfolgen soweit möglich client-seitig",
            "Für die Nutzung des Dienstes ist kein Konto erforderlich",
            "Die Betriebsinfrastruktur kann begrenzte Anfrage-Logs zur Missbrauchsprävention vorhalten",
          ],
        },
        {
          heading: "4. Werbung",
          paragraphs: [
            "Der Dienst ist kostenlos und kann nicht personalisierte Google-Anzeigen auf einer kleinen Freigabeliste zeigen: in JSON Formatter unter dem Editor sowie auf den Seiten About, Privacy, Terms und Changelog. Passwort-, SSH-, Token-Studio-, WireGuard-, Zertifikats-, Secret-Scanner- und Encoding-Seiten laden keine Werbeskripte.",
          ],
        },
        {
          heading: "5. Zulässige Nutzung",
          paragraphs: [
            "Sie dürfen den Dienst für rechtmäßige private oder kommerzielle Zwecke nutzen.",
          ],
          list: [
            "Die Tools für legitime Arbeit oder Lernzwecke verwenden",
            "Ergebnisse in eigenen Anwendungen oder Arbeitsabläufen nutzen",
            "Missbrauch, Überlastung oder illegale Aktivitäten vermeiden",
            "Keine Versuche, die Dienstinfrastruktur zu extrahieren oder zu missbrauchen",
          ],
        },
        {
          heading: "6. Haftungsausschluss",
          paragraphs: [
            'Der Dienst wird „wie besehen" ohne Gewährleistung für Verfügbarkeit, Eignung oder unterbrechungsfreien Betrieb bereitgestellt. Sie sind selbst dafür verantwortlich zu prüfen, ob ein Tool für Ihren Anwendungsfall geeignet ist.',
          ],
        },
        {
          heading: "7. Haftungsbeschränkung",
          paragraphs: [
            "SimpleTool App und seine Betreiber haften nicht für Schäden, die aus der Nutzung oder der Unmöglichkeit der Nutzung des Dienstes entstehen, einschließlich Datenverlust oder Betriebsunterbrechung.",
          ],
        },
        {
          heading: "8. Sicherheits-Best-Practices",
          list: [
            "Bewahren Sie generierte Zugangsdaten sicher auf",
            "Verwenden Sie nach Möglichkeit eindeutige Passwörter und Multi-Faktor-Authentifizierung",
            "Halten Sie Geräte und Browser aktuell",
            "Teilen Sie keine sensiblen Informationen über unsichere Kanäle",
          ],
        },
        {
          heading: "9. Änderungen",
          paragraphs: [
            "Wir können diese Bedingungen jederzeit aktualisieren. Die weitere Nutzung des Dienstes nach Änderungen gilt als Zustimmung zu den überarbeiteten Bedingungen.",
          ],
        },
        {
          heading: "10. Kontakt",
          paragraphs: [
            "Bei Fragen zu diesen Bedingungen:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    pt: {
      sections: [
        {
          heading: "1. Aceitação dos termos",
          paragraphs: [
            "Ao acessar e usar o SimpleTool App, você concorda com estes termos. Se não concordar, não utilize o serviço.",
          ],
        },
        {
          heading: "2. Descrição do serviço",
          paragraphs: [
            "O SimpleTool App oferece utilitários web focados em privacidade, como formatadores, geradores, conversores e ferramentas de suporte para desenvolvedores.",
            "O processamento ocorre no seu navegador sempre que possível. Não coletamos nem retemos intencionalmente o conteúdo inserido nas ferramentas em nossos servidores.",
          ],
          list: [
            "Geradores de senhas e nomes de usuário",
            "Ferramentas de codificação, decodificação e conversão",
            "Ferramentas de depuração e referência para desenvolvedores",
            "Jogos e utilitários do lado do cliente",
          ],
        },
        {
          heading: "3. Privacidade e tratamento de dados",
          paragraphs: [
            "O serviço é projetado com base no princípio de privacidade por padrão.",
          ],
          list: [
            "Os cálculos das ferramentas ocorrem no lado do cliente sempre que possível",
            "Nenhuma conta é necessária para usar o serviço",
            "A infraestrutura operacional pode manter registros limitados de requisições para prevenção de abusos",
          ],
        },
        {
          heading: "4. Publicidade",
          paragraphs: [
            "O serviço é gratuito e pode exibir anúncios não personalizados do Google numa lista reduzida de páginas: o JSON Formatter abaixo do editor, e as páginas About, Privacy, Terms e changelog. As páginas de palavra-passe, SSH, Token Studio, WireGuard, certificados, secret scanner e encoding nunca carregam scripts de publicidade.",
          ],
        },
        {
          heading: "5. Uso permitido",
          paragraphs: [
            "Você pode usar o serviço para fins pessoais ou comerciais lícitos.",
          ],
          list: [
            "Usar as ferramentas para trabalho ou aprendizado legítimo",
            "Utilizar os resultados gerados em suas próprias aplicações ou fluxos de trabalho",
            "Evitar abuso, sobrecarga ou atividades ilegais",
            "Não tentar extrair ou fazer uso indevido da infraestrutura do serviço",
          ],
        },
        {
          heading: "6. Isenção de responsabilidade",
          paragraphs: [
            'O serviço é fornecido "como está", sem garantias de disponibilidade, adequação ou operação ininterrupta. É sua responsabilidade avaliar se uma ferramenta é adequada para o seu caso de uso.',
          ],
        },
        {
          heading: "7. Limitação de responsabilidade",
          paragraphs: [
            "O SimpleTool App e seus operadores não são responsáveis por danos decorrentes do uso ou da impossibilidade de uso do serviço, incluindo perda de dados ou interrupção de negócios.",
          ],
        },
        {
          heading: "8. Boas práticas de segurança",
          list: [
            "Armazene as credenciais geradas com segurança",
            "Use senhas únicas e autenticação multifator sempre que possível",
            "Mantenha dispositivos e navegadores atualizados",
            "Evite compartilhar informações sensíveis por canais inseguros",
          ],
        },
        {
          heading: "9. Alterações",
          paragraphs: [
            "Podemos atualizar estes termos ao longo do tempo. O uso continuado do serviço após alterações implica a aceitação dos termos revisados.",
          ],
        },
        {
          heading: "10. Contato",
          paragraphs: [
            "Para dúvidas sobre estes termos:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    vi: {
      sections: [
        {
          heading: "1. Chấp nhận điều khoản",
          paragraphs: [
            "Bằng cách truy cập và sử dụng SimpleTool App, bạn đồng ý với các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.",
          ],
        },
        {
          heading: "2. Mô tả dịch vụ",
          paragraphs: [
            "SimpleTool App cung cấp các tiện ích web tập trung vào quyền riêng tư như công cụ định dạng, tạo dữ liệu, chuyển đổi và hỗ trợ lập trình viên.",
            "Quá trình xử lý được thực hiện trong trình duyệt của bạn khi có thể. Chúng tôi không cố ý thu thập hoặc lưu giữ nội dung nhập vào công cụ trên máy chủ.",
          ],
          list: [
            "Công cụ tạo mật khẩu và tên người dùng",
            "Công cụ mã hóa, giải mã và chuyển đổi",
            "Công cụ gỡ lỗi và tra cứu cho lập trình viên",
            "Trò chơi và tiện ích phía máy khách",
          ],
        },
        {
          heading: "3. Quyền riêng tư và xử lý dữ liệu",
          paragraphs: [
            "Dịch vụ được thiết kế theo nguyên tắc ưu tiên quyền riêng tư.",
          ],
          list: [
            "Các phép tính của công cụ được thực hiện phía máy khách khi có thể",
            "Không cần tài khoản để sử dụng dịch vụ",
            "Cơ sở hạ tầng vận hành có thể lưu giữ nhật ký yêu cầu hạn chế để ngăn chặn lạm dụng",
          ],
        },
        {
          heading: "4. Quảng cáo",
          paragraphs: [
            "Dịch vụ miễn phí và có thể hiển thị quảng cáo Google không cá nhân hóa trên một danh sách trang cho phép: JSON Formatter dưới trình soạn thảo, và các trang About, Privacy, Terms, changelog. Các trang mật khẩu, SSH, Token Studio, WireGuard, chứng chỉ, quét bí mật và encoding không bao giờ tải script quảng cáo.",
          ],
        },
        {
          heading: "5. Sử dụng được phép",
          paragraphs: [
            "Bạn có thể sử dụng dịch vụ cho các mục đích cá nhân hoặc thương mại hợp pháp.",
          ],
          list: [
            "Sử dụng công cụ cho công việc hoặc học tập hợp pháp",
            "Sử dụng kết quả tạo ra trong ứng dụng hoặc quy trình làm việc của bạn",
            "Tránh lạm dụng, quá tải hoặc hoạt động bất hợp pháp",
            "Không cố gắng khai thác hoặc lạm dụng cơ sở hạ tầng dịch vụ",
          ],
        },
        {
          heading: "6. Tuyên bố miễn trừ trách nhiệm",
          paragraphs: [
            'Dịch vụ được cung cấp "nguyên trạng" mà không có bảo đảm về tính khả dụng, phù hợp hay hoạt động liên tục. Bạn có trách nhiệm tự đánh giá xem công cụ có phù hợp với trường hợp sử dụng của mình không.',
          ],
        },
        {
          heading: "7. Giới hạn trách nhiệm",
          paragraphs: [
            "SimpleTool App và các nhà vận hành không chịu trách nhiệm về các thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ, bao gồm mất dữ liệu hoặc gián đoạn kinh doanh.",
          ],
        },
        {
          heading: "8. Thực hành bảo mật tốt nhất",
          list: [
            "Lưu trữ thông tin đăng nhập được tạo ra một cách an toàn",
            "Sử dụng mật khẩu duy nhất và xác thực đa yếu tố khi có thể",
            "Giữ thiết bị và trình duyệt được cập nhật",
            "Tránh chia sẻ thông tin nhạy cảm qua các kênh không an toàn",
          ],
        },
        {
          heading: "9. Thay đổi",
          paragraphs: [
            "Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản đã sửa đổi.",
          ],
        },
        {
          heading: "10. Liên hệ",
          paragraphs: [
            "Nếu có câu hỏi về các điều khoản này:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
  },
  about: {
    en: {
      sections: [
        {
          heading: "Our Mission",
          paragraphs: [
            "SimpleTool App provides browser-based utilities for formatting, inspecting, generating, and converting data.",
            "Tool computations are designed to run in the browser where practical. Page requests, assets, and advertising on allow-listed pages still involve network services.",
          ],
          list: [
            "Free to use with no account required",
            "Privacy-first processing in the browser",
            "Transparent about how the tools work",
            "Built for professionals, students, and teams",
          ],
        },
        {
          heading: "By the Numbers",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Public Tools</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Global Languages</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Accounts Required</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Technical Philosophy",
          paragraphs: [
            "When a browser API can perform a task, the tool keeps that computation in the page instead of adding an application upload endpoint.",
            "Cloudflare still serves pages and assets, while Web Crypto and other browser APIs perform supported tool operations locally.",
            "Each tool documents limits that still require external validation or a server-side system.",
          ],
        },
        {
          heading: "Why Client-Side Matters",
          paragraphs: [
            "Keeping a computation in the browser avoids creating an application endpoint for the tool payload.",
            "This does not make the page air-gapped: the initial page, assets, browser extensions, clipboard, and allow-listed advertising remain separate trust considerations.",
          ],
          list: [
            "No account required for public tools",
            "Many computations continue after assets load",
            "Tool payloads are not intentionally submitted to an application backend",
            "External verification is still required when the task depends on a live service",
          ],
        },
        {
          heading: "Privacy Commitment",
          paragraphs: [
            "Privacy is not a feature added later. It is the default design constraint for every tool we ship.",
            "We avoid tracking pixels, session recording, and persistent tool-data storage. Labeled non-personalized ads may appear on allow-listed pages; password and key tools stay ad-free.",
          ],
          list: [
            "No accounts for normal use",
            "No first-party analytics on tool inputs",
            "No long-lived persistence for generated content",
            "Clear explanations of the underlying architecture",
          ],
        },
        {
          heading: "Technology Stack",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infrastructure</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> Edge delivery with low latency and a small attack surface.</li>
                  <li><strong>Web Crypto API:</strong> Browser-native cryptography for secure client-side work.</li>
                  <li><strong>Subresource Integrity:</strong> Vendor scripts load from this origin with SRI hashes.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> Keeps bundles small and behavior predictable.</li>
                  <li><strong>Tailwind CSS:</strong> Provides the design system and responsive layout primitives.</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams, and related browser capabilities.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Who It Is For",
          paragraphs: [
            "SimpleTool App is for individual developers and small teams who want client-side utilities without sending payloads to a backend.",
            "There is no paid product or licensing program.",
          ],
          list: [
            "No account required",
            "Tool inputs stay on the device",
            "Labeled ads may appear on a small allow list",
            "Password and key tools stay ad-free",
          ],
        },
        {
          heading: "Contact & Support",
          paragraphs: [
            "Use the existing public contacts for reproducible bug reports, security concerns, or non-product questions. Replies are not guaranteed on a fixed schedule.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">General Contact</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Questions, suggestions, bug reports, press, or media.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Security Reports</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Include affected URLs, steps, impact, and a safe proof of concept.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    ko: {
      sections: [
        {
          heading: "우리의 목표",
          paragraphs: [
            "SimpleTool App은 필수적인 디지털 도구를 프라이버시와 보안을 해치지 않고 사용할 수 있게 만드는 것을 목표로 합니다.",
            "비밀번호 생성, 로그 확인, 코드 정리 같은 작업이 민감한 데이터를 백엔드로 보내지 않고도 처리되도록 클라이언트 사이드 모델을 채택했습니다.",
          ],
          list: [
            "계정 없이 무료로 사용 가능",
            "브라우저 내부의 프라이버시 우선 처리",
            "도구 동작 방식을 투명하게 공개",
            "전문가, 학생, 팀 모두를 위한 설계",
          ],
        },
        {
          heading: "숫자로 보는 SimpleTool",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">전문 도구</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">지원 언어</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">필요한 계정</div>
              </div>
            </div>
          `,
        },
        {
          heading: "기술 철학",
          paragraphs: [
            "기술 철학의 핵심은 제로 트러스트입니다. 브라우저가 로컬에서 처리할 수 있다면 서버가 데이터를 볼 필요가 없도록 설계합니다.",
            "Cloudflare Workers, Web Crypto API, 가벼운 클라이언트 실행을 활용해 빠르면서도 투명한 제품을 유지합니다.",
            "보안은 마케팅 문구가 아니라 아키텍처의 속성으로 다룹니다.",
          ],
        },
        {
          heading: "왜 클라이언트 사이드가 중요한가",
          paragraphs: [
            "민감한 데이터를 원격 서버로 보내는 순간 불필요한 신뢰 경계가 생깁니다.",
            "로컬 처리는 서버 침해, 가로채기, 보관 위험을 줄입니다.",
          ],
          list: [
            "왕복 지연이 없어 즉시 반응",
            "자산 로드 후 오프라인에서도 잘 동작",
            "입력값의 서버 복제본이 없음",
            "운영 부담과 공격면 감소",
          ],
        },
        {
          heading: "개인정보 보호 원칙",
          paragraphs: [
            "개인정보 보호는 나중에 얹는 기능이 아니라 모든 도구의 기본 제약입니다.",
            "추적 픽셀, 세션 기록, 도구 데이터의 장기 저장을 사용하지 않습니다. 허용 목록에 있는 페이지에는 라벨이 표시된 비개인화 광고가 나타날 수 있으며, 비밀번호·키 도구는 광고를 로드하지 않습니다.",
          ],
          list: [
            "일반 사용에 계정 불필요",
            "도구 입력에 대한 1st-party 분석 없음",
            "생성된 콘텐츠의 장기 보관 없음",
            "아키텍처를 명확하게 설명",
          ],
        },
        {
          heading: "기술 스택",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">인프라</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> 낮은 지연과 작은 공격면을 제공하는 엣지 배포.</li>
                  <li><strong>Web Crypto API:</strong> 안전한 클라이언트 사이드 작업을 위한 브라우저 네이티브 암호화.</li>
                  <li><strong>Subresource Integrity:</strong> 벤더 스크립트는 이 출처에서 SRI 해시와 함께 로드됩니다.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">프론트엔드</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> 번들을 작고 예측 가능하게 유지합니다.</li>
                  <li><strong>Tailwind CSS:</strong> 디자인 시스템과 반응형 레이아웃의 기반입니다.</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams 등 브라우저 기능을 활용합니다.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "누구를 위한 도구인가",
          paragraphs: [
            "SimpleTool App은 데이터 취급, 규정 준수, 감사 가능성이 중요한 환경을 고려해 설계되었습니다.",
            "도구 입력이 사용자 기기 안에 머무르기 때문에 중앙 서버로 민감 정보를 우회시키지 않고도 도입할 수 있습니다.",
          ],
          list: [
            "규정 준수 친화적 설계",
            "Privacy-by-design 아키텍처",
            "데이터 거버넌스 부담 감소",
            "제로 트러스트 운영 모델과 정합",
          ],
        },
        {
          heading: "문의 및 지원",
          paragraphs: [
            "개별 개발자, 학생, 엔터프라이즈 팀의 피드백을 중요하게 생각합니다.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">일반 지원</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">질문, 제안, 버그 리포트.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">보안 팀</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">취약점 제보 및 보안 문의.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">비즈니스 문의</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">보도, 미디어, 그 외 제품 외 문의.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    ja: {
      sections: [
        {
          heading: "私たちの使命",
          paragraphs: [
            "SimpleTool App は、プライバシーやセキュリティを損なわずに、必要なデジタルツールを使えるようにすることを目的としています。",
            "パスワード生成、ログ確認、コード整形のような作業を、敏感なデータをバックエンドに送らずに完結できるよう、クライアントサイド中心で設計しています。",
          ],
          list: [
            "アカウント不要で無料",
            "ブラウザ内でのプライバシー優先処理",
            "ツールの仕組みを透明に公開",
            "プロ、学生、チーム向けに設計",
          ],
        },
        {
          heading: "数字で見る SimpleTool",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Professional Tools</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Global Languages</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Accounts Required</div>
              </div>
            </div>
          `,
        },
        {
          heading: "技術哲学",
          paragraphs: [
            "技術哲学の中心はゼロトラストです。ブラウザがローカルで処理できるなら、サーバーがデータを見る必要はありません。",
            "Cloudflare Workers、Web Crypto API、軽量なクライアント実行を使い、速くて透明な体験を維持しています。",
            "セキュリティはマーケティング文句ではなく、アーキテクチャの性質として扱います。",
          ],
        },
        {
          heading: "なぜクライアントサイドが重要か",
          paragraphs: [
            "機密データをリモートサーバーへ送ると、不要な信頼境界が生まれます。",
            "ローカル処理は、サーバー侵害、傍受、保持リスクを減らします。",
          ],
          list: [
            "往復遅延がなく即座に動作",
            "ロード後はオフラインでも動きやすい",
            "入力のサーバー側コピーが残らない",
            "運用負荷と攻撃面を縮小",
          ],
        },
        {
          heading: "プライバシー方針",
          paragraphs: [
            "プライバシーは後付けではなく、すべてのツールの初期制約です。",
            "トラッキングピクセル、セッション記録、ツールデータの長期保存は使用しません。許可リストに含まれるページにはラベル付きの非パーソナライズ広告が表示される場合があります。パスワードおよび鍵関連ツールには広告を読み込みません。",
          ],
          list: [
            "通常利用はアカウント不要",
            "ツール入力のファーストパーティ分析なし",
            "生成コンテンツの長期保持なし",
            "アーキテクチャを明確に説明",
          ],
        },
        {
          heading: "技術スタック",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infrastructure</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> 低遅延で攻撃面の小さいエッジ配信。</li>
                  <li><strong>Web Crypto API:</strong> 安全なクライアント処理のためのブラウザネイティブ暗号。</li>
                  <li><strong>Subresource Integrity:</strong> ベンダースクリプトはこのオリジンから SRI ハッシュ付きで読み込みます。</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> バンドルを小さく保ちます。</li>
                  <li><strong>Tailwind CSS:</strong> デザインシステムとレスポンシブの基盤。</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams などを活用。</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "対象ユーザー",
          paragraphs: [
            "SimpleTool App は、データ取り扱い、コンプライアンス、監査可能性が重要な環境を想定しています。",
            "入力が端末内にとどまるため、機密情報を中央サーバーへ迂回させずに導入できます。",
          ],
          list: [
            "コンプライアンスに配慮した設計",
            "Privacy-by-design アーキテクチャ",
            "データ居住要件の負担軽減",
            "ゼロトラスト運用に整合",
          ],
        },
        {
          heading: "お問い合わせとサポート",
          paragraphs: [
            "個人開発者、学生、企業チームからのフィードバックを重視しています。",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">General Support</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Questions, suggestions, or bug reports.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Security Team</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Vulnerability reports and security concerns.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Business Inquiries</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Press, media, or other non-product questions.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    es: {
      sections: [
        {
          heading: "Nuestra misión",
          paragraphs: [
            "SimpleTool App existe para ofrecer herramientas digitales esenciales sin comprometer la privacidad ni la seguridad.",
            "Preferimos un modelo del lado del cliente para que tareas como generar contraseñas, revisar logs o limpiar código puedan hacerse sin enviar datos sensibles a un backend.",
          ],
          list: [
            "Gratis y sin cuenta",
            "Procesamiento con prioridad en privacidad en el navegador",
            "Transparencia sobre cómo funcionan las herramientas",
            "Pensado para profesionales, estudiantes y equipos",
          ],
        },
        {
          heading: "Números",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Professional Tools</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Global Languages</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Accounts Required</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Filosofía técnica",
          paragraphs: [
            "Nuestra filosofía parte de un modelo de confianza cero: si el navegador puede hacer el trabajo localmente, el servidor no necesita ver tus datos.",
            "Usamos Cloudflare Workers, Web Crypto API y ejecución ligera del lado del cliente para mantener una experiencia rápida y transparente.",
            "La seguridad se trata como una propiedad de la arquitectura, no como un mensaje de marketing.",
          ],
        },
        {
          heading: "Por qué importa el lado del cliente",
          paragraphs: [
            "Enviar datos sensibles a un servidor remoto añade una frontera de confianza innecesaria.",
            "El procesamiento local reduce la exposición a compromisos del servidor, intercepciones y retención indebida.",
          ],
          list: [
            "Procesamiento en el navegador sin una carga adicional a la aplicación",
            "Mejor comportamiento offline una vez cargados los activos",
            "Sin copia en servidor de tus entradas",
            "Menor superficie de ataque y menos carga operativa",
          ],
        },
        {
          heading: "Compromiso con la privacidad",
          paragraphs: [
            "La privacidad no es una función añadida al final. Es la restricción de diseño por defecto de cada herramienta.",
            "Evitamos píxeles de seguimiento, grabación de sesión y almacenamiento persistente de datos de herramientas. Pueden aparecer anuncios no personalizados y etiquetados en páginas de la lista permitida; las herramientas de contraseñas y claves permanecen sin publicidad.",
          ],
          list: [
            "Sin cuentas para el uso normal",
            "Sin analítica propia sobre entradas de herramientas",
            "Sin retención a largo plazo de contenido generado",
            "Explicaciones claras de la arquitectura",
          ],
        },
        {
          heading: "Stack tecnológico",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infraestructura</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> Distribución en el borde con baja latencia y menor superficie de ataque.</li>
                  <li><strong>Web Crypto API:</strong> Criptografía nativa del navegador para trabajos seguros del lado del cliente.</li>
                  <li><strong>Subresource Integrity:</strong> Los scripts de terceros se cargan desde este origen con hashes SRI.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> Mantiene el bundle pequeño y el comportamiento predecible.</li>
                  <li><strong>Tailwind CSS:</strong> Base del sistema visual y del layout responsive.</li>
                  <li><strong>Modern Web APIs:</strong> Aprovecha File, Canvas, Streams y otras APIs del navegador.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Para quién es",
          paragraphs: [
            "SimpleTool App es para desarrolladores individuales y equipos pequeños que quieren utilidades del lado del cliente sin enviar cargas a un backend.",
            "No hay producto de pago ni programa de licencias.",
          ],
          list: [
            "No se requiere cuenta",
            "Las entradas de las herramientas permanecen en el dispositivo",
            "Pueden aparecer anuncios etiquetados en una lista reducida de páginas",
            "Las herramientas de contraseñas y claves permanecen sin publicidad",
          ],
        },
        {
          heading: "Contacto y soporte",
          paragraphs: [
            "Valoramos los comentarios de desarrolladores individuales, estudiantes y equipos.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">General Support</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Questions, suggestions, or bug reports.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Security Team</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Vulnerability reports and security concerns.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Business Inquiries</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Press, media, or other non-product questions.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          heading: "我们的使命",
          paragraphs: [
            "SimpleTool App 致力于在不损害隐私和安全的前提下，让每个人都能使用必要的数字工具。",
            "我们采用客户端优先模式，使密码生成、日志检查、代码整理等常见任务无需将敏感数据发送至后端即可完成。",
          ],
          list: [
            "免费使用，无需注册账号",
            "浏览器内隐私优先处理",
            "透明公开工具工作原理",
            "专为专业人士、学生和团队设计",
          ],
        },
        {
          heading: "SimpleTool 数字概览",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">专业工具</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">支持语言</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">需要账户</div>
              </div>
            </div>
          `,
        },
        {
          heading: "技术理念",
          paragraphs: [
            "我们的技术理念根植于零信任模型：如果浏览器能在本地完成工作，服务器就无需接触您的数据。",
            "我们使用 Cloudflare Workers、Web Crypto API 以及轻量级客户端执行等现代 Web 标准，保持产品快速且透明。",
            "安全性被视为架构属性，而非营销宣传。",
          ],
        },
        {
          heading: "为什么客户端处理至关重要",
          paragraphs: [
            "将敏感数据发送至远程服务器会引入不必要的信任边界。",
            "本地处理可降低服务器端入侵、数据拦截和留存风险。",
          ],
          list: [
            "即时响应，无往返延迟",
            "资源加载后离线也能正常使用",
            "服务器端不保留您输入内容的副本",
            "更低的运营开销和更小的攻击面",
          ],
        },
        {
          heading: "隐私承诺",
          paragraphs: [
            "隐私保护不是事后添加的功能，而是我们每款工具的默认设计约束。",
            "我们不使用追踪像素、会话录制或持久性工具数据存储。允许列表内的页面可能显示带标识的非个性化广告；密码和密钥工具始终不加载广告。",
          ],
          list: [
            "正常使用无需账号",
            "不对工具输入进行第一方数据分析",
            "不长期存储生成的内容",
            "清晰说明底层架构",
          ],
        },
        {
          heading: "技术栈",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">基础设施</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers：</strong>低延迟、小攻击面的边缘分发。</li>
                  <li><strong>Web Crypto API：</strong>浏览器原生加密，支持安全的客户端操作。</li>
                  <li><strong>Subresource Integrity：</strong>第三方脚本从本站加载并带有 SRI 哈希。</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">前端</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript：</strong>保持构建包小巧、行为可预测。</li>
                  <li><strong>Tailwind CSS：</strong>提供设计系统和响应式布局基础。</li>
                  <li><strong>Modern Web APIs：</strong>充分利用 File、Canvas、Streams 等浏览器能力。</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "企业级应用",
          paragraphs: [
            "SimpleTool App 专为重视数据处理、合规性和可审计性的企业环境设计。",
            "由于工具输入保留在用户设备上，团队可以在不将敏感资料路由至集中后端的前提下部署使用。",
          ],
          list: [
            "合规友好的设计理念",
            "隐私优先架构",
            "降低数据驻留负担",
            "契合零信任运营模型",
          ],
        },
        {
          heading: "联系与支持",
          paragraphs: ["我们重视来自独立开发者、学生和企业团队的反馈。"],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">通用支持</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">问题、建议或错误报告。</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">安全团队</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">漏洞报告及安全相关问题。</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">商务合作</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">合作伙伴关系、企业授权或媒体事宜。</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          heading: "我們的使命",
          paragraphs: [
            "SimpleTool App 致力於在不損害隱私和安全的前提下，讓每個人都能使用必要的數位工具。",
            "我們採用用戶端優先模式，使密碼產生、日誌檢查、程式碼整理等常見任務無需將敏感資料傳送至後端即可完成。",
          ],
          list: [
            "免費使用，無需註冊帳號",
            "瀏覽器內隱私優先處理",
            "透明公開工具運作原理",
            "專為專業人士、學生和團隊設計",
          ],
        },
        {
          heading: "SimpleTool 數字概覽",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">專業工具</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">支援語言</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">需要帳戶</div>
              </div>
            </div>
          `,
        },
        {
          heading: "技術理念",
          paragraphs: [
            "我們的技術理念根植於零信任模型：如果瀏覽器能在本地完成工作，伺服器就無需接觸您的資料。",
            "我們使用 Cloudflare Workers、Web Crypto API 以及輕量級用戶端執行等現代 Web 標準，保持產品快速且透明。",
            "安全性被視為架構屬性，而非行銷宣傳。",
          ],
        },
        {
          heading: "為什麼用戶端處理至關重要",
          paragraphs: [
            "將敏感資料傳送至遠端伺服器會引入不必要的信任邊界。",
            "本地處理可降低伺服器端入侵、資料攔截和留存風險。",
          ],
          list: [
            "即時回應，無往返延遲",
            "資源載入後離線也能正常使用",
            "伺服器端不保留您輸入內容的副本",
            "更低的營運開銷和更小的攻擊面",
          ],
        },
        {
          heading: "隱私承諾",
          paragraphs: [
            "隱私保護不是事後添加的功能，而是我們每款工具的預設設計約束。",
            "我們不使用追蹤像素、工作階段錄製或持久性工具資料儲存。允許清單內的頁面可能顯示標示的非個人化廣告；密碼與金鑰工具始終不載入廣告。",
          ],
          list: [
            "正常使用無需帳號",
            "不對工具輸入進行第一方資料分析",
            "不長期儲存產生的內容",
            "清楚說明底層架構",
          ],
        },
        {
          heading: "技術堆疊",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">基礎設施</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers：</strong>低延遲、小攻擊面的邊緣分發。</li>
                  <li><strong>Web Crypto API：</strong>瀏覽器原生加密，支援安全的用戶端操作。</li>
                  <li><strong>Subresource Integrity：</strong>第三方指令碼從本站載入並帶有 SRI 雜湊。</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">前端</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript：</strong>保持建構包小巧、行為可預測。</li>
                  <li><strong>Tailwind CSS：</strong>提供設計系統和響應式版面基礎。</li>
                  <li><strong>Modern Web APIs：</strong>充分利用 File、Canvas、Streams 等瀏覽器能力。</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "適用對象",
          paragraphs: [
            "SimpleTool App 專為重視資料處理、法規遵循性和可稽核性的企業環境設計。",
            "由於工具輸入保留在使用者裝置上，團隊可以在不將敏感資料路由至集中後端的前提下部署使用。",
          ],
          list: [
            "法規遵循友好的設計理念",
            "隱私優先架構",
            "降低資料駐留負擔",
            "契合零信任營運模型",
          ],
        },
        {
          heading: "聯絡與支援",
          paragraphs: ["我們重視來自獨立開發者、學生和企業團隊的意見回饋。"],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">一般支援</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">問題、建議或錯誤回報。</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">安全團隊</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">漏洞回報及安全相關問題。</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">商務合作</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">合作夥伴關係、企業授權或媒體事宜。</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    fr: {
      sections: [
        {
          heading: "Notre mission",
          paragraphs: [
            "SimpleTool App existe pour rendre des outils numériques essentiels accessibles sans compromettre la confidentialité ni la sécurité.",
            "Nous privilégions un modèle côté client pour que des tâches courantes comme la génération de mots de passe, l'inspection de logs et le nettoyage de code puissent s'effectuer sans envoyer de données sensibles à un serveur.",
          ],
          list: [
            "Gratuit et sans compte requis",
            "Traitement dans le navigateur avec confidentialité par défaut",
            "Transparence sur le fonctionnement des outils",
            "Conçu pour les professionnels, les étudiants et les équipes",
          ],
        },
        {
          heading: "SimpleTool en chiffres",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Outils professionnels</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Langues</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Comptes requis</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Philosophie technique",
          paragraphs: [
            "Notre philosophie technique repose sur un modèle zéro confiance : si le navigateur peut effectuer le travail localement, le serveur n'a jamais besoin de voir vos données.",
            "Nous utilisons des standards web modernes tels que Cloudflare Workers, l'API Web Crypto et une exécution légère côté client pour maintenir un produit rapide et transparent.",
            "La sécurité est traitée comme une propriété architecturale, non comme un argument marketing.",
          ],
        },
        {
          heading: "Pourquoi le traitement côté client est important",
          paragraphs: [
            "Envoyer des données sensibles à un serveur distant introduit une frontière de confiance inutile.",
            "Le traitement local réduit l'exposition aux compromissions côté serveur, aux interceptions et aux risques de rétention.",
          ],
          list: [
            "Traitement dans le navigateur sans transfert supplémentaire vers l'application",
            "Meilleur fonctionnement hors ligne une fois les ressources chargées",
            "Aucune copie serveur de vos saisies",
            "Moins de charge opérationnelle et surface d'attaque réduite",
          ],
        },
        {
          heading: "Engagement en matière de confidentialité",
          paragraphs: [
            "La confidentialité n'est pas une fonctionnalité ajoutée après coup. C'est la contrainte de conception par défaut de chaque outil que nous publions.",
            "Nous évitons les pixels de suivi, l'enregistrement de session et le stockage persistant des données d'outils. Des annonces non personnalisées et identifiées peuvent apparaître sur les pages d'une liste d'autorisation ; les outils de mots de passe et de clés restent sans publicité.",
          ],
          list: [
            "Aucun compte requis pour une utilisation normale",
            "Pas d'analytique propriétaire sur les saisies des outils",
            "Pas de conservation à long terme du contenu généré",
            "Explications claires de l'architecture sous-jacente",
          ],
        },
        {
          heading: "Stack technique",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infrastructure</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers :</strong> Distribution en périphérie avec faible latence et surface d'attaque réduite.</li>
                  <li><strong>Web Crypto API :</strong> Cryptographie native du navigateur pour un travail sécurisé côté client.</li>
                  <li><strong>Subresource Integrity :</strong> Les scripts tiers sont chargés depuis cette origine avec des hachages SRI.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript :</strong> Maintient les bundles légers et le comportement prévisible.</li>
                  <li><strong>Tailwind CSS :</strong> Fournit le système de design et les primitives de mise en page responsive.</li>
                  <li><strong>Modern Web APIs :</strong> File, Canvas, Streams et autres capacités du navigateur.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Pour qui",
          paragraphs: [
            "SimpleTool App s'adresse aux développeurs individuels et aux petites équipes qui veulent des utilitaires côté client sans envoyer de charges utiles à un backend.",
            "Il n'existe pas d'offre payante ni de programme de licences.",
          ],
          list: [
            "Aucun compte requis",
            "Les saisies des outils restent sur l'appareil",
            "Des annonces identifiées peuvent apparaître sur une petite liste de pages",
            "Les outils de mots de passe et de clés restent sans publicité",
          ],
        },
        {
          heading: "Contact et support",
          paragraphs: [
            "Nous valorisons les retours des développeurs individuels, des étudiants et des équipes.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Support général</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Questions, suggestions ou rapports de bugs.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Équipe sécurité</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Rapports de vulnérabilité et questions de sécurité.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Demandes commerciales</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Presse, médias ou autres questions hors produit.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    de: {
      sections: [
        {
          heading: "Unsere Mission",
          paragraphs: [
            "SimpleTool App wurde entwickelt, um wesentliche digitale Werkzeuge bereitzustellen, ohne dabei Datenschutz oder Sicherheit zu beeinträchtigen.",
            "Wir bevorzugen ein clientseitiges Modell, damit gängige Aufgaben wie Passwortgenerierung, Log-Inspektion und Code-Bereinigung ohne das Übersenden sensibler Daten an ein Backend erledigt werden können.",
          ],
          list: [
            "Kostenlos und ohne Konto nutzbar",
            "Datenschutzorientierte Verarbeitung im Browser",
            "Transparenz über die Funktionsweise der Tools",
            "Für Profis, Studierende und Teams konzipiert",
          ],
        },
        {
          heading: "SimpleTool in Zahlen",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Professionelle Tools</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Sprachen</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Konten erforderlich</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Technische Philosophie",
          paragraphs: [
            "Wenn eine Browser-API eine Aufgabe ausführen kann, vermeidet das Tool einen zusätzlichen Upload-Endpunkt. Seiten, Assets und zugelassene Werbung bleiben Netzwerkvorgänge.",
            "Wir nutzen moderne Web-Standards wie Cloudflare Workers, die Web Crypto API und leichtgewichtige clientseitige Ausführung, um das Produkt schnell und transparent zu halten.",
            "Sicherheit wird als architektonische Eigenschaft behandelt, nicht als Marketing-Aussage.",
          ],
        },
        {
          heading: "Warum clientseitige Verarbeitung wichtig ist",
          paragraphs: [
            "Das Senden sensibler Daten an einen Remote-Server schafft eine unnötige Vertrauensgrenze.",
            "Lokale Verarbeitung reduziert die Exposition gegenüber serverseitigen Kompromittierungen, Abfang-Angriffen und Speicherungsrisiken.",
          ],
          list: [
            "Sofortige Leistung ohne Roundtrip-Latenz",
            "Besseres Offline-Verhalten nach dem Laden der Assets",
            "Keine serverseitige Kopie Ihrer Eingaben",
            "Geringerer Betriebsaufwand und kleinere Angriffsfläche",
          ],
        },
        {
          heading: "Datenschutzverpflichtung",
          paragraphs: [
            "Datenschutz ist keine nachträglich hinzugefügte Funktion. Er ist die Standard-Designbeschränkung für jedes Tool, das wir veröffentlichen.",
            "Wir vermeiden Tracking-Pixel, Sitzungsaufzeichnung und persistente Tool-Datenspeicherung. Auf Seiten einer Positivliste können gekennzeichnete, nicht personalisierte Anzeigen erscheinen; Passwort- und Schlüssel-Tools bleiben werbefrei.",
          ],
          list: [
            "Kein Konto für die normale Nutzung erforderlich",
            "Keine eigene Analyse von Tool-Eingaben",
            "Keine Langzeitspeicherung generierter Inhalte",
            "Klare Erklärungen zur zugrundeliegenden Architektur",
          ],
        },
        {
          heading: "Technologie-Stack",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infrastruktur</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> Edge-Auslieferung mit niedriger Latenz und kleiner Angriffsfläche.</li>
                  <li><strong>Web Crypto API:</strong> Browser-native Kryptographie für sichere clientseitige Arbeit.</li>
                  <li><strong>Subresource Integrity:</strong> Drittanbieter-Skripte werden von diesem Ursprung mit SRI-Hashes geladen.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> Hält Bundles klein und das Verhalten vorhersehbar.</li>
                  <li><strong>Tailwind CSS:</strong> Stellt das Design-System und responsive Layout-Primitive bereit.</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams und weitere Browser-Fähigkeiten.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Für wen",
          paragraphs: [
            "SimpleTool App ist für Umgebungen konzipiert, in denen Datenhandhabung, Compliance und Auditierbarkeit wichtig sind.",
            "Da Tool-Eingaben auf dem Benutzergerät verbleiben, können Teams die Tools einsetzen, ohne sensible Daten über ein zentralisiertes Backend zu leiten.",
          ],
          list: [
            "Compliance-freundliches Design",
            "Privacy-by-Design-Architektur",
            "Reduzierte Datenhaltungslast",
            "Browserbasierte Verarbeitung mit dokumentierten Grenzen",
          ],
        },
        {
          heading: "Kontakt & Support",
          paragraphs: [
            "Wir schätzen Feedback von einzelnen Entwicklern, Studierenden und Teams.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Allgemeiner Support</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Fragen, Vorschläge oder Fehlerberichte.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Sicherheitsteam</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Meldung von Sicherheitslücken und Sicherheitsbedenken.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Geschäftliche Anfragen</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Presse, Medien oder andere produktfremde Fragen.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    pt: {
      sections: [
        {
          heading: "Nossa missão",
          paragraphs: [
            "O SimpleTool App existe para disponibilizar ferramentas digitais essenciais sem comprometer a privacidade ou a segurança.",
            "Favorecemos um modelo do lado do cliente para que tarefas comuns como geração de senhas, inspeção de logs e limpeza de código possam ser realizadas sem enviar dados sensíveis a um servidor.",
          ],
          list: [
            "Gratuito e sem necessidade de conta",
            "Processamento com foco em privacidade no navegador",
            "Transparência sobre o funcionamento das ferramentas",
            "Desenvolvido para profissionais, estudantes e equipes",
          ],
        },
        {
          heading: "SimpleTool em números",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Ferramentas profissionais</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Idiomas</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Contas necessárias</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Filosofia técnica",
          paragraphs: [
            "Nossa filosofia técnica está enraizada em um modelo de confiança zero: se o navegador pode fazer o trabalho localmente, o servidor nunca precisa ver seus dados.",
            "Usamos padrões web modernos como Cloudflare Workers, Web Crypto API e execução leve no lado do cliente para manter o produto rápido e transparente.",
            "A segurança é tratada como uma propriedade arquitetural, não como um argumento de marketing.",
          ],
        },
        {
          heading: "Por que o processamento do lado do cliente importa",
          paragraphs: [
            "Enviar dados sensíveis a um servidor remoto introduz uma fronteira de confiança desnecessária.",
            "O processamento local reduz a exposição a comprometimentos no servidor, interceptações e riscos de retenção de dados.",
          ],
          list: [
            "Processamento no navegador sem envio adicional para a aplicação",
            "Melhor comportamento offline após o carregamento dos recursos",
            "Nenhuma cópia das suas entradas no servidor",
            "Menor sobrecarga operacional e superfície de ataque reduzida",
          ],
        },
        {
          heading: "Compromisso com a privacidade",
          paragraphs: [
            "A privacidade não é um recurso adicionado depois. É a restrição de design padrão para cada ferramenta que desenvolvemos.",
            "Evitamos pixels de rastreamento, gravação de sessão e armazenamento persistente de dados de ferramentas. Anúncios não personalizados e identificados podem aparecer em páginas de uma lista de permissões; ferramentas de senha e chaves permanecem sem anúncios.",
          ],
          list: [
            "Sem contas para uso normal",
            "Sem análise própria das entradas das ferramentas",
            "Sem retenção de longo prazo do conteúdo gerado",
            "Explicações claras sobre a arquitetura subjacente",
          ],
        },
        {
          heading: "Stack tecnológico",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Infraestrutura</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> Entrega de borda com baixa latência e superfície de ataque reduzida.</li>
                  <li><strong>Web Crypto API:</strong> Criptografia nativa do navegador para trabalho seguro do lado do cliente.</li>
                  <li><strong>Subresource Integrity:</strong> Scripts de terceiros são carregados nesta origem com hashes SRI.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> Mantém os bundles pequenos e o comportamento previsível.</li>
                  <li><strong>Tailwind CSS:</strong> Fornece o sistema de design e as primitivas de layout responsivo.</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams e outras capacidades do navegador.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Para quem é",
          paragraphs: [
            "O SimpleTool App é para programadores individuais e equipas pequenas que querem utilitários no lado do cliente sem enviar cargas para um backend.",
            "Não existe produto pago nem programa de licenças.",
          ],
          list: [
            "Não é necessária conta",
            "As entradas das ferramentas permanecem no dispositivo",
            "Anúncios identificados podem aparecer numa lista reduzida de páginas",
            "As ferramentas de palavra-passe e chaves permanecem sem anúncios",
          ],
        },
        {
          heading: "Contato e suporte",
          paragraphs: [
            "Valorizamos o feedback de desenvolvedores individuais, estudantes e equipes.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Suporte geral</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Perguntas, sugestões ou relatórios de bugs.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Equipe de segurança</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Relatórios de vulnerabilidade e questões de segurança.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Consultas comerciais</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Imprensa, mídia ou outras perguntas que não sejam de produto.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
    vi: {
      sections: [
        {
          heading: "Sứ mệnh của chúng tôi",
          paragraphs: [
            "SimpleTool App ra đời để cung cấp các công cụ kỹ thuật số thiết yếu mà không ảnh hưởng đến quyền riêng tư hay bảo mật.",
            "Chúng tôi ưu tiên mô hình phía máy khách để các tác vụ phổ biến như tạo mật khẩu, kiểm tra log và dọn dẹp mã nguồn có thể thực hiện mà không cần gửi dữ liệu nhạy cảm lên máy chủ.",
          ],
          list: [
            "Miễn phí, không cần tài khoản",
            "Xử lý ưu tiên quyền riêng tư trong trình duyệt",
            "Minh bạch về cách hoạt động của các công cụ",
            "Được xây dựng cho chuyên gia, sinh viên và nhóm làm việc",
          ],
        },
        {
          heading: "SimpleTool qua các con số",
          html: `
            <div class="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1" data-public-tool-count>${PRODUCTION_TOOL_COUNT}</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Công cụ chuyên nghiệp</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Ngôn ngữ</div>
              </div>
              <div class="card p-6 text-center border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
                <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">0</div>
                <div class="text-sm font-medium text-surface-600 dark:text-surface-400 uppercase tracking-wider">Tài khoản cần thiết</div>
              </div>
            </div>
          `,
        },
        {
          heading: "Triết lý kỹ thuật",
          paragraphs: [
            "Triết lý kỹ thuật của chúng tôi bắt nguồn từ mô hình không tin tưởng mặc định: nếu trình duyệt có thể xử lý công việc cục bộ, máy chủ không bao giờ cần nhìn thấy dữ liệu của bạn.",
            "Chúng tôi sử dụng các tiêu chuẩn web hiện đại như Cloudflare Workers, Web Crypto API và thực thi nhẹ phía máy khách để đảm bảo sản phẩm nhanh và minh bạch.",
            "Bảo mật được coi là một thuộc tính kiến trúc, không phải tuyên bố marketing.",
          ],
        },
        {
          heading: "Tại sao xử lý phía máy khách quan trọng",
          paragraphs: [
            "Gửi dữ liệu nhạy cảm đến máy chủ từ xa tạo ra ranh giới tin cậy không cần thiết.",
            "Xử lý cục bộ giảm thiểu rủi ro từ việc máy chủ bị xâm phạm, bị nghe lén và lưu giữ dữ liệu.",
          ],
          list: [
            "Hiệu năng tức thì, không có độ trễ khứ hồi",
            "Hoạt động offline tốt hơn sau khi tài nguyên được tải",
            "Không có bản sao dữ liệu nhập của bạn trên máy chủ",
            "Giảm chi phí vận hành và thu hẹp bề mặt tấn công",
          ],
        },
        {
          heading: "Cam kết về quyền riêng tư",
          paragraphs: [
            "Quyền riêng tư không phải tính năng được thêm vào sau. Đó là ràng buộc thiết kế mặc định cho mọi công cụ chúng tôi phát hành.",
            "Chúng tôi tránh pixel theo dõi, ghi lại phiên làm việc và lưu trữ dữ liệu công cụ lâu dài. Quảng cáo không cá nhân hóa có gắn nhãn có thể xuất hiện trên các trang trong danh sách cho phép; công cụ mật khẩu và khóa luôn không tải quảng cáo.",
          ],
          list: [
            "Không cần tài khoản để sử dụng thông thường",
            "Không phân tích dữ liệu nhập của công cụ theo phương thức nội bộ",
            "Không lưu giữ nội dung được tạo ra trong thời gian dài",
            "Giải thích rõ ràng về kiến trúc bên dưới",
          ],
        },
        {
          heading: "Công nghệ sử dụng",
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold mb-2">Cơ sở hạ tầng</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Cloudflare Workers:</strong> Phân phối tại biên với độ trễ thấp và bề mặt tấn công nhỏ.</li>
                  <li><strong>Web Crypto API:</strong> Mã hóa gốc của trình duyệt cho công việc phía máy khách an toàn.</li>
                  <li><strong>Subresource Integrity:</strong> Script bên thứ ba được tải từ origin này kèm hash SRI.</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2">Frontend</h3>
                <ul class="space-y-2 text-sm">
                  <li><strong>Vanilla JavaScript:</strong> Giữ các bundle nhỏ gọn và hành vi dễ dự đoán.</li>
                  <li><strong>Tailwind CSS:</strong> Cung cấp hệ thống thiết kế và các thành phần bố cục responsive.</li>
                  <li><strong>Modern Web APIs:</strong> File, Canvas, Streams và các khả năng trình duyệt liên quan.</li>
                </ul>
              </div>
            </div>
          `,
        },
        {
          heading: "Dành cho ai",
          paragraphs: [
            "SimpleTool App dành cho lập trình viên cá nhân và nhóm nhỏ muốn công cụ chạy phía trình duyệt mà không gửi dữ liệu lên backend.",
            "Không có sản phẩm trả phí hay chương trình cấp phép.",
          ],
          list: [
            "Không cần tài khoản",
            "Dữ liệu nhập của công cụ ở lại trên thiết bị",
            "Quảng cáo có nhãn có thể xuất hiện trên một danh sách trang nhỏ",
            "Công cụ mật khẩu và khóa luôn không tải quảng cáo",
          ],
        },
        {
          heading: "Liên hệ & Hỗ trợ",
          paragraphs: [
            "Chúng tôi trân trọng phản hồi từ các lập trình viên cá nhân, sinh viên và nhóm doanh nghiệp.",
          ],
          html: `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Hỗ trợ chung</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Câu hỏi, góp ý hoặc báo cáo lỗi.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Nhóm bảo mật</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Báo cáo lỗ hổng và các vấn đề bảo mật.</p>
                <a href="mailto:security@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">security@simpletool.app</a>
              </div>
              <div class="card p-4 border border-surface-200 dark:border-surface-800">
                <h3 class="font-bold mb-1">Liên hệ khác</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">Báo chí, truyền thông hoặc câu hỏi không liên quan đến sản phẩm.</p>
                <a href="mailto:hello@simpletool.app" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">hello@simpletool.app</a>
              </div>
            </div>
          `,
        },
      ],
    },
  },
  privacy: {
    en: {
      sections: [
        {
          heading: "Our Privacy Commitment",
          paragraphs: [
            "SimpleTool App is designed around privacy-first operation. Most tools process data locally in your browser, and we intentionally avoid collecting tool inputs or generated output on our servers.",
            "The service is supported by infrastructure providers, and allow-listed pages may also load Google advertising scripts. A limited amount of technical request data may still be processed by those providers under their own policies.",
          ],
        },
        {
          heading: "1. Information We Do Not Intentionally Collect",
          list: [
            "Generated passwords, tokens, hashes, or encoded content",
            "Uploaded logs, certificates, payloads, or configuration files for tool computation",
            "Account profiles or persistent user accounts",
            "First-party analytics profiles tied to your identity",
          ],
        },
        {
          heading: "2. How the Tools Work",
          paragraphs: [
            "Where technically possible, calculations happen entirely in your browser using client-side JavaScript and browser APIs such as Web Crypto.",
          ],
          list: [
            "Tool inputs are intended to remain on your device",
            "Generated output stays in browser memory unless you copy, export, or save it yourself",
            "Some third-party resources such as ad delivery may still trigger external network requests",
          ],
        },
        {
          heading: "3. Browser Storage and Preferences",
          paragraphs: [
            "The app may use local browser storage (localStorage) for product preferences such as theme, language, or game settings. This storage remains on your device and is not treated as a hosted user account. It is separate from any third-party cookies Google may set when ads load on allow-listed pages.",
          ],
        },
        {
          heading: "4. Cookies and Advertising",
          paragraphs: [
            "We do not use first-party tracking cookies for core tool functionality. On allow-listed pages (the homepage, JSON Formatter, About, Privacy, Terms, changelog, blog, and FAQ) we may load Google AdSense in non-personalized mode. Google and its partners may set cookies and similar identifiers — including cookies associated with doubleclick.net and Google domains — to serve ads, cap frequency, measure aggregated performance, and detect fraud or abuse. These ads are not personalized from your browsing history on other sites. We do not use Google Tag Manager or Google Analytics. Password, SSH, Token Studio, WireGuard, certificates, secret scanner, and encoding pages never load advertising scripts.",
            "You can review or opt out of personalized advertising at https://adssettings.google.com and industry opt-outs at https://www.aboutads.info. Google explains how it uses data at https://policies.google.com/technologies/ads and https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Infrastructure and Third Parties",
          paragraphs: [
            "We use a small set of third-party services to operate the site.",
          ],
          list: [
            "Cloudflare for hosting, CDN delivery, and abuse protection",
            "Non-personalized Google AdSense on allow-listed pages only",
            "Other browser-delivered assets only when required for the user experience",
          ],
        },
        {
          heading: "6. Security",
          paragraphs: [
            "Because the service is primarily client-side, we reduce exposure by not centralizing tool payloads. We also use HTTPS, strict security headers, and modern browser APIs where possible.",
          ],
        },
        {
          heading: "7. Your Responsibilities",
          list: [
            "Verify you are using the legitimate SimpleTool App site",
            "Store generated credentials securely",
            "Avoid sharing secrets through insecure channels",
            "Keep your browser and device updated",
          ],
        },
        {
          heading: "8. Regional Privacy Rights",
          paragraphs: [
            "If a regional privacy law applies to you, note that our role is intentionally limited because we do not seek to receive or retain most tool payload data. Third-party providers may still process technical identifiers or advertising signals under their own legal responsibilities.",
          ],
        },
        {
          heading: "9. Policy Changes",
          paragraphs: [
            "We may update this privacy policy as the product, laws, or service providers change. The latest revision date appears on this page.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Questions about this privacy policy:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    ko: {
      sections: [
        {
          heading: "개인정보 보호 원칙",
          paragraphs: [
            "SimpleTool App은 프라이버시 우선 원칙으로 설계되었습니다. 대부분의 도구는 브라우저 안에서 로컬 처리되며, 도구 입력값이나 생성 결과를 서버에 의도적으로 수집하지 않습니다.",
            "다만 사이트 운영을 위해 사용하는 인프라는 자체 정책에 따라 제한적인 기술 정보나 요청 데이터를 처리할 수 있습니다.",
          ],
        },
        {
          heading: "1. 의도적으로 수집하지 않는 정보",
          list: [
            "생성된 비밀번호, 토큰, 해시, 인코딩 결과",
            "도구 계산을 위한 로그, 인증서, 페이로드, 설정 파일 본문",
            "사용자 계정이나 프로필 데이터",
            "개인 식별 기반의 1st-party 분석 프로필",
          ],
        },
        {
          heading: "2. 도구 동작 방식",
          paragraphs: [
            "기술적으로 가능한 경우 계산은 클라이언트 JavaScript와 Web Crypto 같은 브라우저 API를 사용해 브라우저 내부에서 수행됩니다.",
          ],
          list: [
            "도구 입력은 원칙적으로 사용자 기기 안에 머뭅니다",
            "생성된 결과는 사용자가 직접 복사·내보내기·저장하지 않는 한 브라우저 메모리에만 남습니다",
            "광고 로딩 등 일부 서드파티 리소스는 외부 네트워크 요청을 발생시킬 수 있습니다",
          ],
        },
        {
          heading: "3. 브라우저 저장소와 환경설정",
          paragraphs: [
            "앱은 테마, 언어, 게임 설정 같은 환경설정을 위해 브라우저 로컬 저장소를 사용할 수 있습니다. 이 데이터는 사용자 기기에 남으며, 서버 호스팅 계정 데이터처럼 취급하지 않습니다.",
          ],
        },
        {
          heading: "4. 쿠키와 광고",
          paragraphs: [
            "핵심 도구 기능을 위해 1st-party 추적 쿠키를 사용하지 않습니다. 허용된 페이지(홈, JSON Formatter, About, Privacy, Terms, changelog, 블로그, FAQ)에서만 비개인화 Google AdSense를 로드할 수 있습니다. Google과 파트너는 doubleclick.net 및 Google 도메인과 연결된 쿠키·식별자를 사용해 광고 게재, 노출 빈도 제한, 집계 보고, 사기 방지에 쓸 수 있습니다. 이 광고는 다른 사이트 방문 이력을 바탕으로 개인화되지 않습니다. GTM과 GA는 쓰지 않으며, 비밀번호·SSH·Token Studio·WireGuard·인증서·시크릿 스캐너·인코딩 페이지는 광고 스크립트를 로드하지 않습니다.",
            "맞춤 광고 설정은 https://adssettings.google.com 에서, 업계 옵트아웃은 https://www.aboutads.info 에서 확인할 수 있습니다. Google의 데이터 이용은 https://policies.google.com/technologies/ads 및 https://policies.google.com/privacy 를 참고하세요.",
          ],
        },
        {
          heading: "5. 인프라와 제3자 서비스",
          paragraphs: ["사이트 운영을 위해 소수의 외부 서비스를 사용합니다."],
          list: [
            "호스팅, CDN, 남용 방지를 위한 Cloudflare",
            "허용된 페이지만 비개인화 Google AdSense",
            "사용자 경험에 필요한 경우에만 전달되는 기타 브라우저 자산",
          ],
        },
        {
          heading: "6. 보안",
          paragraphs: [
            "서비스는 주로 클라이언트 사이드로 동작하므로 도구 본문을 중앙 서버에 모으지 않아 노출 범위를 줄입니다. 또한 HTTPS, 엄격한 보안 헤더, 현대적 브라우저 API를 가능한 범위에서 사용합니다.",
          ],
        },
        {
          heading: "7. 사용자 책임",
          list: [
            "정식 SimpleTool App 사이트를 사용하고 있는지 확인하세요",
            "생성된 자격 증명은 안전하게 보관하세요",
            "민감한 정보는 안전하지 않은 채널로 공유하지 마세요",
            "브라우저와 기기를 최신 상태로 유지하세요",
          ],
        },
        {
          heading: "8. 지역별 개인정보 권리",
          paragraphs: [
            "GDPR, CCPA 등 지역별 개인정보 법령이 적용되더라도, 우리는 대부분의 도구 본문 데이터를 받거나 저장하지 않도록 설계되어 있어 역할이 제한적입니다. 다만 서드파티 사업자는 기술 식별자나 광고 신호를 자체 법적 책임 아래 처리할 수 있습니다.",
          ],
        },
        {
          heading: "9. 정책 변경",
          paragraphs: [
            "제품, 법률, 서비스 제공자 변경에 따라 본 정책을 수정할 수 있습니다. 최신 개정일은 이 페이지에 표시됩니다.",
          ],
        },
        {
          heading: "10. 문의",
          paragraphs: ["개인정보 처리방침 관련 문의:", "hello@simpletool.app"],
        },
      ],
    },
    ja: {
      sections: [
        {
          heading: "プライバシー方針",
          paragraphs: [
            "SimpleTool App はプライバシー優先で設計されています。ほとんどのツールはブラウザ内でローカル処理され、ツール入力や生成結果をサーバー側で意図的に収集しません。",
            "一方で、サイト運営のために利用するインフラ事業者は、それぞれのポリシーに基づき限定的な技術情報やリクエスト情報を処理する場合があります。",
          ],
        },
        {
          heading: "1. 意図的に収集しない情報",
          list: [
            "生成されたパスワード、トークン、ハッシュ、エンコード結果",
            "ツール処理のためのログ、証明書、ペイロード、設定ファイル本文",
            "ユーザーアカウントやプロフィール情報",
            "個人識別に結びつくファーストパーティ分析プロファイル",
          ],
        },
        {
          heading: "2. ツールの動作方法",
          paragraphs: [
            "技術的に可能な限り、処理はクライアントサイド JavaScript と Web Crypto などのブラウザ API を使ってブラウザ内で完結します。",
          ],
          list: [
            "ツール入力は原則として端末内に留まります",
            "生成結果は、利用者が自分でコピー・保存・書き出しを行わない限りブラウザメモリ内にのみ存在します",
            "広告配信など一部の第三者リソースは外部通信を発生させる場合があります",
          ],
        },
        {
          heading: "3. ブラウザ保存領域と設定",
          paragraphs: [
            "テーマ、言語、ゲーム設定などの利便性のためにブラウザのローカル保存領域を使うことがあります。これらのデータは端末内に残り、サーバー上のアカウントデータとして扱いません。",
          ],
        },
        {
          heading: "4. Cookie と広告",
          paragraphs: [
            "中核ツール機能のためにファーストパーティの追跡 Cookie は使いません。許可ページ（ホーム、JSON Formatter、About、Privacy、Terms、changelog、ブログ、FAQ）でのみ非パーソナライズの Google AdSense を読み込む場合があります。Google とそのパートナーは、doubleclick.net や Google ドメインの Cookie・識別子を、広告配信、表示回数の制限、集計レポート、不正防止のために使用することがあります。これらの広告は他サイトの閲覧履歴に基づいてパーソナライズされません。GTM と GA は使用せず、パスワード、SSH、Token Studio、WireGuard、証明書、シークレットスキャナー、エンコーディングのページでは広告スクリプトを読み込みません。",
            "パーソナライズド広告の確認・オプトアウトは https://adssettings.google.com 、業界オプトアウトは https://www.aboutads.info です。Google のデータ利用は https://policies.google.com/technologies/ads と https://policies.google.com/privacy を参照してください。",
          ],
        },
        {
          heading: "5. インフラと第三者サービス",
          paragraphs: ["サイト運営には少数の第三者サービスを利用します。"],
          list: [
            "ホスティング、CDN、悪用対策のための Cloudflare",
            "許可ページのみの非パーソナライズ Google AdSense",
            "ユーザー体験上必要な場合に限って読み込まれるその他のブラウザ向けアセット",
          ],
        },
        {
          heading: "6. セキュリティ",
          paragraphs: [
            "本サービスは主にクライアントサイドで動作するため、ツール内容を中央サーバーへ集約せず、露出範囲を抑えています。加えて HTTPS、厳格なセキュリティヘッダー、現代的なブラウザ API を可能な限り採用しています。",
          ],
        },
        {
          heading: "7. ご利用者の責任",
          list: [
            "正規の SimpleTool App サイトを利用していることを確認する",
            "生成した認証情報を安全に保管する",
            "秘密情報を安全でない経路で共有しない",
            "ブラウザと端末を最新状態に保つ",
          ],
        },
        {
          heading: "8. 地域ごとのプライバシー権",
          paragraphs: [
            "GDPR や CCPA などの法令が適用される場合でも、当サービスは多くのツール本文データを受け取らず保存しない設計のため、当社の役割は限定的です。ただし第三者事業者は技術識別子や広告シグナルを独自の法的責任のもとで処理することがあります。",
          ],
        },
        {
          heading: "9. ポリシー変更",
          paragraphs: [
            "製品、法令、利用サービスの変更に応じて本ポリシーを更新することがあります。最新の改定日はこのページに表示します。",
          ],
        },
        {
          heading: "10. お問い合わせ",
          paragraphs: [
            "プライバシーポリシーに関するお問い合わせ:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    es: {
      sections: [
        {
          heading: "Nuestro compromiso con la privacidad",
          paragraphs: [
            "SimpleTool App está diseñado con un enfoque de privacidad por defecto. La mayoría de las herramientas procesan los datos localmente en tu navegador y evitamos recopilar de forma intencional las entradas o los resultados generados por las herramientas.",
            "Aun así, los proveedores de infraestructura que utilizamos pueden procesar una cantidad limitada de datos técnicos o de solicitud conforme a sus propias políticas.",
          ],
        },
        {
          heading: "1. Información que no recopilamos intencionalmente",
          list: [
            "Contraseñas, tokens, hashes o contenido codificado generado",
            "Logs, certificados, payloads o archivos de configuración usados para el cálculo de herramientas",
            "Cuentas de usuario o perfiles persistentes",
            "Perfiles de analítica propia vinculados a tu identidad",
          ],
        },
        {
          heading: "2. Cómo funcionan las herramientas",
          paragraphs: [
            "Siempre que sea técnicamente posible, el procesamiento ocurre por completo en tu navegador usando JavaScript del lado del cliente y APIs del navegador como Web Crypto.",
          ],
          list: [
            "Las entradas de las herramientas están pensadas para permanecer en tu dispositivo",
            "Los resultados generados permanecen en la memoria del navegador salvo que tú los copies, exportes o guardes",
            "Algunos recursos de terceros, como la publicidad, pueden generar solicitudes de red externas",
          ],
        },
        {
          heading: "3. Almacenamiento del navegador y preferencias",
          paragraphs: [
            "La app puede usar almacenamiento local del navegador para preferencias de producto como tema, idioma o ajustes de juegos. Estos datos permanecen en tu dispositivo y no se tratan como una cuenta alojada en nuestros servidores.",
          ],
        },
        {
          heading: "4. Cookies y publicidad",
          paragraphs: [
            "No usamos cookies propias de seguimiento para la funcionalidad principal. En páginas de la lista permitida (inicio, JSON Formatter, About, Privacy, Terms, changelog, blog y FAQ) podemos cargar Google AdSense en modo no personalizado. Google y sus socios pueden establecer cookies e identificadores —incluidas cookies de doubleclick.net y dominios de Google— para mostrar anuncios, limitar frecuencia, medir el rendimiento agregado y detectar fraude. Estos anuncios no se personalizan con tu historial de navegación en otros sitios. No usamos Google Tag Manager ni Google Analytics. Las páginas de contraseñas, SSH, Token Studio, WireGuard, certificados, secret scanner y encoding nunca cargan scripts publicitarios.",
            "Puedes revisar u optar por no recibir publicidad personalizada en https://adssettings.google.com y en https://www.aboutads.info. Google explica cómo usa los datos en https://policies.google.com/technologies/ads y https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Infraestructura y terceros",
          paragraphs: [
            "Usamos un conjunto reducido de servicios de terceros para operar el sitio.",
          ],
          list: [
            "Cloudflare para hosting, CDN y protección contra abuso",
            "Google AdSense no personalizado solo en páginas de la lista permitida",
            "Otros recursos entregados al navegador solo cuando son necesarios para la experiencia",
          ],
        },
        {
          heading: "6. Seguridad",
          paragraphs: [
            "Como el servicio funciona principalmente del lado del cliente, reducimos la exposición al no centralizar los payloads de las herramientas. Además usamos HTTPS, cabeceras de seguridad estrictas y APIs modernas del navegador siempre que es posible.",
          ],
        },
        {
          heading: "7. Tus responsabilidades",
          list: [
            "Verifica que estás usando el sitio legítimo de SimpleTool App",
            "Guarda de forma segura las credenciales generadas",
            "No compartas secretos por canales inseguros",
            "Mantén actualizado tu navegador y tu dispositivo",
          ],
        },
        {
          heading: "8. Derechos regionales de privacidad",
          paragraphs: [
            "Si una ley regional de privacidad aplica a tu caso, ten en cuenta que nuestro rol es intencionalmente limitado porque no buscamos recibir ni conservar la mayor parte de los datos procesados por las herramientas. Los proveedores terceros sí pueden tratar identificadores técnicos o señales publicitarias bajo sus propias obligaciones legales.",
          ],
        },
        {
          heading: "9. Cambios en la política",
          paragraphs: [
            "Podemos actualizar esta política de privacidad cuando cambien el producto, las leyes o los proveedores del servicio. La fecha de revisión más reciente aparece en esta página.",
          ],
        },
        {
          heading: "10. Contacto",
          paragraphs: [
            "Preguntas sobre esta política de privacidad:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          heading: "我们的隐私承诺",
          paragraphs: [
            "SimpleTool App 以隐私优先原则设计。大多数工具在您的浏览器中本地处理数据，我们不会有意在服务器上收集工具输入或生成的结果。",
            "本服务依托基础设施和广告服务商运营，这些服务商可能依据自身政策处理有限的技术请求数据。",
          ],
        },
        {
          heading: "1. 我们不刻意收集的信息",
          list: [
            "生成的密码、令牌、哈希或编码内容",
            "用于工具计算的日志、证书、载荷或配置文件",
            "用户账号或持久性个人资料",
            "与您身份挂钩的第一方分析档案",
          ],
        },
        {
          heading: "2. 工具的工作方式",
          paragraphs: [
            "在技术可行的情况下，计算完全在您的浏览器中通过客户端 JavaScript 和 Web Crypto 等浏览器 API 完成。",
          ],
          list: [
            "工具输入预期留在您的设备上",
            "生成的结果保留在浏览器内存中，除非您自行复制、导出或保存",
            "广告投放等部分第三方资源仍可能触发外部网络请求",
          ],
        },
        {
          heading: "3. 浏览器存储与偏好设置",
          paragraphs: [
            "应用可能使用浏览器本地存储来保存主题、语言或游戏设置等产品偏好。这些数据保留在您的设备上，不被视为托管的用户账号数据。",
          ],
        },
        {
          heading: "4. Cookie 与广告",
          paragraphs: [
            "我们不依赖第一方追踪 Cookie 实现核心工具功能。仅在允许列表页面（首页、JSON Formatter、About、Privacy、Terms、changelog、博客和 FAQ）可能加载非个性化 Google AdSense。Google 及其合作伙伴可能设置 cookie 和类似标识符（包括 doubleclick.net 与 Google 域下的 cookie），用于投放广告、限制展示频次、汇总效果衡量以及欺诈防护。这些广告不会根据你在其他网站的浏览记录进行个性化。我们不使用 Google Tag Manager 或 Google Analytics。密码、SSH、Token Studio、WireGuard、证书、密钥扫描、编码页面不会加载广告脚本。",
            "你可以在 https://adssettings.google.com 查看或退出个性化广告，并在 https://www.aboutads.info 使用行业退出选项。Google 如何使用数据见 https://policies.google.com/technologies/ads 和 https://policies.google.com/privacy。",
          ],
        },
        {
          heading: "5. 基础设施与第三方",
          paragraphs: ["我们使用少量第三方服务来运营本站。"],
          list: [
            "Cloudflare 提供托管、CDN 分发和滥用防护",
            "仅在允许列表页面使用非个性化 Google AdSense",
            "仅在用户体验需要时加载的其他浏览器资源",
          ],
        },
        {
          heading: "6. 安全性",
          paragraphs: [
            "由于本服务主要在客户端运行，我们通过不集中存储工具载荷来降低风险。同时在可行的情况下使用 HTTPS、严格的安全标头和现代浏览器 API。",
          ],
        },
        {
          heading: "7. 您的责任",
          list: [
            "确认您正在使用正版 SimpleTool App 网站",
            "妥善保管生成的凭据",
            "避免通过不安全渠道分享敏感信息",
            "保持浏览器和设备更新",
          ],
        },
        {
          heading: "8. 地区隐私权利",
          paragraphs: [
            "如适用地区隐私法律，请注意我们的角色是有意受限的，因为我们不寻求接收或留存大多数工具载荷数据。第三方服务商仍可能在其自身法律责任下处理技术标识符或广告信号。",
          ],
        },
        {
          heading: "9. 政策变更",
          paragraphs: [
            "随着产品、法律或服务商的变化，我们可能更新本隐私政策。最新修订日期显示在本页面上。",
          ],
        },
        {
          heading: "10. 联系方式",
          paragraphs: ["如有关于本隐私政策的问题：", "hello@simpletool.app"],
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          heading: "我們的隱私承諾",
          paragraphs: [
            "SimpleTool App 以隱私優先原則設計。大多數工具在您的瀏覽器中本地處理資料，我們不會刻意在伺服器上收集工具輸入或產生的結果。",
            "本服務依託基礎設施和廣告服務商營運，這些服務商可能依據自身政策處理有限的技術請求資料。",
          ],
        },
        {
          heading: "1. 我們不刻意收集的資訊",
          list: [
            "產生的密碼、令牌、雜湊或編碼內容",
            "用於工具計算的日誌、憑證、載荷或設定檔",
            "使用者帳號或持久性個人資料",
            "與您身份掛鉤的第一方分析檔案",
          ],
        },
        {
          heading: "2. 工具的運作方式",
          paragraphs: [
            "在技術可行的情況下，計算完全在您的瀏覽器中透過用戶端 JavaScript 和 Web Crypto 等瀏覽器 API 完成。",
          ],
          list: [
            "工具輸入預期留在您的裝置上",
            "產生的結果保留在瀏覽器記憶體中，除非您自行複製、匯出或儲存",
            "廣告投放等部分第三方資源仍可能觸發外部網路請求",
          ],
        },
        {
          heading: "3. 瀏覽器儲存與偏好設定",
          paragraphs: [
            "應用程式可能使用瀏覽器本機儲存來保存主題、語言或遊戲設定等產品偏好。這些資料保留在您的裝置上，不被視為託管的使用者帳號資料。",
          ],
        },
        {
          heading: "4. Cookie 與廣告",
          paragraphs: [
            "我們不依賴第一方追蹤 Cookie 實現核心工具功能。僅在允許清單頁面（首頁、JSON Formatter、About、Privacy、Terms、changelog、部落格與 FAQ）可能載入非個人化 Google AdSense。Google 及其合作夥伴可能設定 cookie 與類似識別碼（包括 doubleclick.net 與 Google 網域下的 cookie），用於投放廣告、限制曝光頻率、彙總成效衡量以及詐欺防護。這些廣告不會依你在其他網站的瀏覽紀錄個人化。我們不使用 Google Tag Manager 或 Google Analytics。密碼、SSH、Token Studio、WireGuard、憑證、祕密掃描、編碼頁面不會載入廣告指令碼。",
            "你可以在 https://adssettings.google.com 查看或退出個人化廣告，並在 https://www.aboutads.info 使用產業退出選項。Google 如何使用資料見 https://policies.google.com/technologies/ads 與 https://policies.google.com/privacy。",
          ],
        },
        {
          heading: "5. 基礎設施與第三方",
          paragraphs: ["我們使用少量第三方服務來營運本站。"],
          list: [
            "Cloudflare 提供託管、CDN 分發和濫用防護",
            "僅在允許清單頁面使用非個人化 Google AdSense",
            "僅在使用者體驗需要時載入的其他瀏覽器資源",
          ],
        },
        {
          heading: "6. 安全性",
          paragraphs: [
            "由於本服務主要在用戶端運行，我們透過不集中儲存工具載荷來降低風險。同時在可行的情況下使用 HTTPS、嚴格的安全標頭和現代瀏覽器 API。",
          ],
        },
        {
          heading: "7. 您的責任",
          list: [
            "確認您正在使用正版 SimpleTool App 網站",
            "妥善保管產生的憑證",
            "避免透過不安全管道分享敏感資訊",
            "保持瀏覽器和裝置更新",
          ],
        },
        {
          heading: "8. 地區隱私權利",
          paragraphs: [
            "如適用地區隱私法律，請注意我們的角色是有意受限的，因為我們不尋求接收或留存大多數工具載荷資料。第三方服務商仍可能在其自身法律責任下處理技術識別碼或廣告訊號。",
          ],
        },
        {
          heading: "9. 政策變更",
          paragraphs: [
            "隨著產品、法律或服務商的變化，我們可能更新本隱私政策。最新修訂日期顯示在本頁面上。",
          ],
        },
        {
          heading: "10. 聯絡方式",
          paragraphs: ["如有關於本隱私政策的問題：", "hello@simpletool.app"],
        },
      ],
    },
    fr: {
      sections: [
        {
          heading: "Notre engagement en matière de confidentialité",
          paragraphs: [
            "SimpleTool App est conçu autour d'une opération axée sur la confidentialité. La plupart des outils traitent les données localement dans votre navigateur, et nous évitons intentionnellement de collecter les saisies des outils ou les résultats générés sur nos serveurs.",
            "Le service est soutenu par des fournisseurs d'infrastructure et de publicité, de sorte qu'une quantité limitée de données techniques de requête peut encore être traitée par ces fournisseurs selon leurs propres politiques.",
          ],
        },
        {
          heading:
            "1. Informations que nous ne collectons pas intentionnellement",
          list: [
            "Mots de passe, tokens, hachages ou contenus encodés générés",
            "Logs, certificats, charges utiles ou fichiers de configuration téléchargés pour le calcul des outils",
            "Profils de compte utilisateur ou comptes persistants",
            "Profils analytiques propriétaires liés à votre identité",
          ],
        },
        {
          heading: "2. Fonctionnement des outils",
          paragraphs: [
            "Dans la mesure du possible techniquement, les calculs s'effectuent entièrement dans votre navigateur via JavaScript côté client et des API navigateur telles que Web Crypto.",
          ],
          list: [
            "Les saisies des outils sont destinées à rester sur votre appareil",
            "Les résultats générés restent en mémoire du navigateur sauf si vous les copiez, exportez ou sauvegardez vous-même",
            "Certaines ressources tierces comme la publicité peuvent toujours déclencher des requêtes réseau externes",
          ],
        },
        {
          heading: "3. Stockage navigateur et préférences",
          paragraphs: [
            "L'application peut utiliser le stockage local du navigateur pour des préférences produit telles que le thème, la langue ou les paramètres de jeu. Ce stockage reste sur votre appareil et n'est pas traité comme un compte utilisateur hébergé.",
          ],
        },
        {
          heading: "4. Cookies et publicité",
          paragraphs: [
            "Nous n'utilisons pas de cookies de suivi propriétaires pour les fonctionnalités principales. Sur les pages autorisées (accueil, JSON Formatter, About, Privacy, Terms, changelog, blog et FAQ), nous pouvons charger Google AdSense en mode non personnalisé. Google et ses partenaires peuvent déposer des cookies et identifiants similaires — y compris des cookies associés à doubleclick.net et aux domaines Google — pour diffuser des annonces, limiter la fréquence, mesurer les performances agrégées et détecter la fraude. Ces annonces ne sont pas personnalisées à partir de votre historique de navigation sur d'autres sites. Nous n'utilisons pas Google Tag Manager ni Google Analytics. Les pages mot de passe, SSH, Token Studio, WireGuard, certificats, secret scanner et encodage ne chargent jamais de scripts publicitaires.",
            "Vous pouvez consulter ou refuser la publicité personnalisée sur https://adssettings.google.com et via https://www.aboutads.info. Google explique l'usage des données sur https://policies.google.com/technologies/ads et https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Infrastructure et tiers",
          paragraphs: [
            "Nous utilisons un petit ensemble de services tiers pour exploiter le site.",
          ],
          list: [
            "Cloudflare pour l'hébergement, la livraison CDN et la protection contre les abus",
            "Google AdSense non personnalisé uniquement sur les pages autorisées",
            "D'autres ressources délivrées par le navigateur uniquement lorsque nécessaires pour l'expérience utilisateur",
          ],
        },
        {
          heading: "6. Sécurité",
          paragraphs: [
            "Comme le service est principalement côté client, nous réduisons l'exposition en ne centralisant pas les charges utiles des outils. Nous utilisons également HTTPS, des en-têtes de sécurité stricts et des API navigateur modernes dans la mesure du possible.",
          ],
        },
        {
          heading: "7. Vos responsabilités",
          list: [
            "Vérifier que vous utilisez le site légitime de SimpleTool App",
            "Stocker les identifiants générés en lieu sûr",
            "Ne pas partager des informations sensibles via des canaux non sécurisés",
            "Maintenir votre navigateur et votre appareil à jour",
          ],
        },
        {
          heading: "8. Droits de confidentialité régionaux",
          paragraphs: [
            "Si une loi régionale sur la confidentialité vous est applicable, notez que notre rôle est intentionnellement limité car nous ne cherchons pas à recevoir ni à conserver la plupart des données de charge utile des outils. Les fournisseurs tiers peuvent néanmoins traiter des identifiants techniques ou des signaux publicitaires dans le cadre de leurs propres responsabilités légales.",
          ],
        },
        {
          heading: "9. Modifications de la politique",
          paragraphs: [
            "Nous pouvons mettre à jour cette politique de confidentialité lors de changements du produit, des lois ou des fournisseurs de service. La date de dernière révision apparaît sur cette page.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Questions sur cette politique de confidentialité :",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    de: {
      sections: [
        {
          heading: "Unser Datenschutzversprechen",
          paragraphs: [
            "SimpleTool App ist auf datenschutzorientierte Betrieb ausgelegt. Die meisten Tools verarbeiten Daten lokal in Ihrem Browser, und wir vermeiden es absichtlich, Tool-Eingaben oder generierte Ausgaben auf unseren Servern zu erfassen.",
            "Der Dienst wird durch Infrastruktur- und Werbeanbieter unterstützt, sodass eine begrenzte Menge technischer Anfragedaten durch diese Anbieter gemäß ihren eigenen Richtlinien verarbeitet werden kann.",
          ],
        },
        {
          heading: "1. Informationen, die wir nicht absichtlich erfassen",
          list: [
            "Generierte Passwörter, Tokens, Hashes oder kodierte Inhalte",
            "Hochgeladene Logs, Zertifikate, Nutzlasten oder Konfigurationsdateien für Tool-Berechnungen",
            "Benutzerkonten oder persistente Profile",
            "Erstanbieter-Analyseprofile, die mit Ihrer Identität verknüpft sind",
          ],
        },
        {
          heading: "2. Wie die Tools funktionieren",
          paragraphs: [
            "Soweit technisch möglich, erfolgen Berechnungen vollständig in Ihrem Browser mit clientseitigem JavaScript und Browser-APIs wie Web Crypto.",
          ],
          list: [
            "Tool-Eingaben sollen auf Ihrem Gerät verbleiben",
            "Generierte Ergebnisse verbleiben im Browser-Speicher, es sei denn, Sie kopieren, exportieren oder speichern sie selbst",
            "Einige Drittanbieter-Ressourcen wie die Anzeigenauslieferung können externe Netzwerkanfragen auslösen",
          ],
        },
        {
          heading: "3. Browser-Speicher und Einstellungen",
          paragraphs: [
            "Die App kann lokalen Browser-Speicher für Produkteinstellungen wie Theme, Sprache oder Spieleinstellungen verwenden. Dieser Speicher verbleibt auf Ihrem Gerät und wird nicht als gehostetes Benutzerkonto behandelt.",
          ],
        },
        {
          heading: "4. Cookies und Werbung",
          paragraphs: [
            "Wir verwenden keine Erstanbieter-Tracking-Cookies für die Kernfunktionalität. Auf freigegebenen Seiten (Startseite, JSON Formatter, About, Privacy, Terms, Changelog, Blog und FAQ) können wir Google AdSense im nicht personalisierten Modus laden. Google und Partner können Cookies und ähnliche Kennungen setzen — einschließlich Cookies von doubleclick.net und Google-Domains — um Anzeigen auszuliefern, die Häufigkeit zu begrenzen, aggregierte Leistung zu messen und Betrug zu erkennen. Diese Anzeigen werden nicht anhand Ihres Surfverlaufs auf anderen Websites personalisiert. Wir nutzen weder Google Tag Manager noch Google Analytics. Passwort-, SSH-, Token-Studio-, WireGuard-, Zertifikats-, Secret-Scanner- und Encoding-Seiten laden keine Werbeskripte.",
            "Personalisierte Werbung können Sie unter https://adssettings.google.com prüfen oder deaktivieren; branchenweite Opt-outs gibt es unter https://www.aboutads.info. Google beschreibt die Datennutzung unter https://policies.google.com/technologies/ads und https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Infrastruktur und Drittanbieter",
          paragraphs: [
            "Wir nutzen eine kleine Anzahl von Drittanbieterdiensten zum Betrieb der Website.",
          ],
          list: [
            "Cloudflare für Hosting, CDN-Auslieferung und Missbrauchsschutz",
            "Nicht personalisiertes Google AdSense nur auf freigegebenen Seiten",
            "Andere vom Browser gelieferte Assets nur wenn für die Benutzererfahrung erforderlich",
          ],
        },
        {
          heading: "6. Sicherheit",
          paragraphs: [
            "Da der Dienst primär clientseitig funktioniert, reduzieren wir die Exposition, indem wir keine Tool-Nutzlasten zentralisieren. Wir setzen außerdem HTTPS, strenge Sicherheits-Header und moderne Browser-APIs ein, wo möglich.",
          ],
        },
        {
          heading: "7. Ihre Verantwortung",
          list: [
            "Überprüfen Sie, dass Sie die legitime SimpleTool App-Website verwenden",
            "Bewahren Sie generierte Zugangsdaten sicher auf",
            "Teilen Sie keine Geheimnisse über unsichere Kanäle",
            "Halten Sie Ihren Browser und Ihr Gerät aktuell",
          ],
        },
        {
          heading: "8. Regionale Datenschutzrechte",
          paragraphs: [
            "Wenn ein regionales Datenschutzgesetz auf Sie zutrifft, beachten Sie, dass unsere Rolle absichtlich begrenzt ist, da wir nicht beabsichtigen, die meisten Tool-Nutzlastdaten zu empfangen oder zu speichern. Drittanbieter können jedoch technische Kennungen oder Werbesignale im Rahmen ihrer eigenen rechtlichen Verantwortlichkeiten verarbeiten.",
          ],
        },
        {
          heading: "9. Änderungen der Richtlinie",
          paragraphs: [
            "Wir können diese Datenschutzrichtlinie bei Änderungen des Produkts, der Gesetze oder der Dienstanbieter aktualisieren. Das neueste Revisionsdatum erscheint auf dieser Seite.",
          ],
        },
        {
          heading: "10. Kontakt",
          paragraphs: [
            "Fragen zu dieser Datenschutzrichtlinie:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    pt: {
      sections: [
        {
          heading: "Nosso compromisso com a privacidade",
          paragraphs: [
            "O SimpleTool App é projetado com foco em privacidade por padrão. A maioria das ferramentas processa dados localmente no seu navegador, e evitamos intencionalmente coletar entradas das ferramentas ou resultados gerados em nossos servidores.",
            "O serviço é suportado por provedores de infraestrutura, de modo que uma quantidade limitada de dados técnicos de requisição ainda pode ser processada por esses provedores de acordo com suas próprias políticas.",
          ],
        },
        {
          heading: "1. Informações que não coletamos intencionalmente",
          list: [
            "Senhas, tokens, hashes ou conteúdo codificado gerado",
            "Logs, certificados, payloads ou arquivos de configuração enviados para cálculo das ferramentas",
            "Perfis de conta de usuário ou contas persistentes",
            "Perfis analíticos próprios vinculados à sua identidade",
          ],
        },
        {
          heading: "2. Como as ferramentas funcionam",
          paragraphs: [
            "Sempre que tecnicamente possível, os cálculos ocorrem inteiramente no seu navegador usando JavaScript do lado do cliente e APIs do navegador como Web Crypto.",
          ],
          list: [
            "As entradas das ferramentas são destinadas a permanecer no seu dispositivo",
            "Os resultados gerados ficam na memória do navegador, a menos que você os copie, exporte ou salve",
            "Alguns recursos de terceiros como publicidade ainda podem acionar requisições de rede externas",
          ],
        },
        {
          heading: "3. Armazenamento do navegador e preferências",
          paragraphs: [
            "O aplicativo pode usar o armazenamento local do navegador para preferências de produto como tema, idioma ou configurações de jogos. Este armazenamento permanece no seu dispositivo e não é tratado como uma conta de usuário hospedada.",
          ],
        },
        {
          heading: "4. Cookies e publicidade",
          paragraphs: [
            "Não usamos cookies de rastreamento próprios para a funcionalidade principal das ferramentas. Nas páginas da lista permitida (página inicial, JSON Formatter, About, Privacy, Terms, changelog, blog e FAQ) podemos carregar o Google AdSense em modo não personalizado. A Google e os seus parceiros podem definir cookies e identificadores semelhantes — incluindo cookies associados a doubleclick.net e a domínios Google — para veicular anúncios, limitar a frequência, medir o desempenho agregado e detetar fraude. Estes anúncios não são personalizados a partir do seu histórico de navegação noutros sites. Não usamos Google Tag Manager nem Google Analytics. As páginas de palavra-passe, SSH, Token Studio, WireGuard, certificados, secret scanner e encoding nunca carregam scripts de publicidade.",
            "Pode rever ou recusar publicidade personalizada em https://adssettings.google.com e em https://www.aboutads.info. A Google explica o uso de dados em https://policies.google.com/technologies/ads e https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Infraestrutura e terceiros",
          paragraphs: [
            "Usamos um conjunto reduzido de serviços de terceiros para operar o site.",
          ],
          list: [
            "Cloudflare para hospedagem, entrega CDN e proteção contra abusos",
            "Google AdSense não personalizado apenas nas páginas da lista permitida",
            "Outros recursos entregues pelo navegador apenas quando necessários para a experiência do usuário",
          ],
        },
        {
          heading: "6. Segurança",
          paragraphs: [
            "Como o serviço é principalmente do lado do cliente, reduzimos a exposição ao não centralizar os payloads das ferramentas. Também usamos HTTPS, cabeçalhos de segurança rígidos e APIs modernas do navegador sempre que possível.",
          ],
        },
        {
          heading: "7. Suas responsabilidades",
          list: [
            "Verifique que está usando o site legítimo do SimpleTool App",
            "Armazene as credenciais geradas com segurança",
            "Evite compartilhar informações sensíveis por canais inseguros",
            "Mantenha seu navegador e dispositivo atualizados",
          ],
        },
        {
          heading: "8. Direitos de privacidade regionais",
          paragraphs: [
            "Se uma lei de privacidade regional se aplicar a você, observe que nosso papel é intencionalmente limitado porque não buscamos receber ou reter a maioria dos dados de payload das ferramentas. Os provedores terceiros ainda podem processar identificadores técnicos ou sinais de publicidade sob suas próprias responsabilidades legais.",
          ],
        },
        {
          heading: "9. Alterações na política",
          paragraphs: [
            "Podemos atualizar esta política de privacidade conforme o produto, as leis ou os provedores de serviço mudam. A data de revisão mais recente aparece nesta página.",
          ],
        },
        {
          heading: "10. Contato",
          paragraphs: [
            "Dúvidas sobre esta política de privacidade:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
    vi: {
      sections: [
        {
          heading: "Cam kết về quyền riêng tư của chúng tôi",
          paragraphs: [
            "SimpleTool App được thiết kế xoay quanh nguyên tắc ưu tiên quyền riêng tư. Hầu hết các công cụ xử lý dữ liệu cục bộ trong trình duyệt của bạn và chúng tôi cố ý tránh thu thập dữ liệu nhập vào công cụ hoặc kết quả được tạo ra trên máy chủ.",
            "Dịch vụ được hỗ trợ bởi các nhà cung cấp cơ sở hạ tầng và quảng cáo, vì vậy một lượng dữ liệu kỹ thuật nhỏ vẫn có thể được xử lý bởi những nhà cung cấp đó theo chính sách riêng của họ.",
          ],
        },
        {
          heading: "1. Thông tin chúng tôi không cố ý thu thập",
          list: [
            "Mật khẩu, token, hash hoặc nội dung được mã hóa đã tạo",
            "Log, chứng chỉ, payload hoặc tệp cấu hình tải lên để tính toán công cụ",
            "Hồ sơ tài khoản người dùng hoặc tài khoản lâu dài",
            "Hồ sơ phân tích nội bộ gắn với danh tính của bạn",
          ],
        },
        {
          heading: "2. Cách các công cụ hoạt động",
          paragraphs: [
            "Trong phạm vi kỹ thuật cho phép, các phép tính được thực hiện hoàn toàn trong trình duyệt của bạn sử dụng JavaScript phía máy khách và các API trình duyệt như Web Crypto.",
          ],
          list: [
            "Dữ liệu nhập vào công cụ được thiết kế để ở lại trên thiết bị của bạn",
            "Kết quả được tạo ra lưu trong bộ nhớ trình duyệt trừ khi bạn tự sao chép, xuất hoặc lưu",
            "Một số tài nguyên bên thứ ba như phân phối quảng cáo vẫn có thể kích hoạt các yêu cầu mạng bên ngoài",
          ],
        },
        {
          heading: "3. Bộ nhớ trình duyệt và tùy chọn",
          paragraphs: [
            "Ứng dụng có thể sử dụng bộ nhớ cục bộ của trình duyệt cho các tùy chọn sản phẩm như chủ đề, ngôn ngữ hoặc cài đặt trò chơi. Bộ nhớ này ở lại trên thiết bị của bạn và không được coi là tài khoản người dùng được lưu trữ.",
          ],
        },
        {
          heading: "4. Cookie và quảng cáo",
          paragraphs: [
            "Chúng tôi không dùng cookie theo dõi nội bộ cho chức năng công cụ cốt lõi. Trên các trang được phép (trang chủ, JSON Formatter, About, Privacy, Terms, changelog, blog và FAQ) chúng tôi có thể tải Google AdSense ở chế độ không cá nhân hóa. Google và các đối tác có thể đặt cookie và định danh tương tự — gồm cookie gắn với doubleclick.net và các tên miền Google — để phục vụ quảng cáo, giới hạn tần suất, đo lường tổng hợp và chống gian lận. Các quảng cáo này không được cá nhân hóa theo lịch sử duyệt web của bạn trên các trang khác. Chúng tôi không dùng Google Tag Manager hay Google Analytics. Các trang mật khẩu, SSH, Token Studio, WireGuard, chứng chỉ, quét bí mật và encoding không bao giờ tải script quảng cáo.",
            "Bạn có thể xem hoặc tắt quảng cáo cá nhân hóa tại https://adssettings.google.com và https://www.aboutads.info. Google mô tả cách dùng dữ liệu tại https://policies.google.com/technologies/ads và https://policies.google.com/privacy.",
          ],
        },
        {
          heading: "5. Cơ sở hạ tầng và bên thứ ba",
          paragraphs: [
            "Chúng tôi sử dụng một số ít dịch vụ của bên thứ ba để vận hành trang web.",
          ],
          list: [
            "Cloudflare để lưu trữ, phân phối CDN và bảo vệ chống lạm dụng",
            "Google AdSense không cá nhân hóa chỉ trên các trang được phép",
            "Các tài nguyên được phân phối qua trình duyệt khác chỉ khi cần thiết cho trải nghiệm người dùng",
          ],
        },
        {
          heading: "6. Bảo mật",
          paragraphs: [
            "Vì dịch vụ chủ yếu hoạt động phía máy khách, chúng tôi giảm thiểu rủi ro bằng cách không tập trung hóa payload của công cụ. Chúng tôi cũng sử dụng HTTPS, các header bảo mật nghiêm ngặt và các API trình duyệt hiện đại khi có thể.",
          ],
        },
        {
          heading: "7. Trách nhiệm của bạn",
          list: [
            "Xác nhận bạn đang sử dụng trang web SimpleTool App chính thức",
            "Lưu trữ thông tin đăng nhập được tạo ra một cách an toàn",
            "Tránh chia sẻ thông tin nhạy cảm qua các kênh không an toàn",
            "Giữ trình duyệt và thiết bị của bạn được cập nhật",
          ],
        },
        {
          heading: "8. Quyền riêng tư theo khu vực",
          paragraphs: [
            "Nếu luật bảo mật khu vực áp dụng cho bạn, hãy lưu ý rằng vai trò của chúng tôi bị hạn chế có chủ đích vì chúng tôi không tìm cách nhận hoặc lưu giữ hầu hết dữ liệu payload công cụ. Các nhà cung cấp bên thứ ba vẫn có thể xử lý mã nhận dạng kỹ thuật hoặc tín hiệu quảng cáo theo trách nhiệm pháp lý của riêng họ.",
          ],
        },
        {
          heading: "9. Thay đổi chính sách",
          paragraphs: [
            "Chúng tôi có thể cập nhật chính sách bảo mật này khi sản phẩm, luật pháp hoặc nhà cung cấp dịch vụ thay đổi. Ngày sửa đổi gần nhất xuất hiện trên trang này.",
          ],
        },
        {
          heading: "10. Liên hệ",
          paragraphs: [
            "Câu hỏi về chính sách bảo mật này:",
            "hello@simpletool.app",
          ],
        },
      ],
    },
  },
  security: {
    en: {
      sections: [
        {
          heading: "Reporting a Vulnerability",
          paragraphs: [
            "If you believe you have found a security issue, please report it responsibly.",
            "Email: security@simpletool.app",
          ],
        },
        {
          heading: "Scope",
          list: [
            "The SimpleTool App website and Cloudflare Worker endpoints",
            "Client-side tools and UI functionality",
          ],
        },
        {
          heading: "Response Expectations",
          paragraphs: [
            "Reports are reviewed as capacity allows. Include the affected URL, reproducible steps, impact, and a safe proof of concept; no acknowledgement or remediation deadline is promised.",
          ],
        },
      ],
    },
    ko: {
      sections: [
        {
          heading: "취약점 제보",
          paragraphs: [
            "보안 문제를 발견했다면 책임 있는 방식으로 제보해 주세요.",
            "이메일: security@simpletool.app",
          ],
        },
        {
          heading: "범위",
          list: [
            "SimpleTool App 웹사이트와 Cloudflare Worker 엔드포인트",
            "클라이언트 사이드 도구와 UI 기능",
          ],
        },
        {
          heading: "응답 기준",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    ja: {
      sections: [
        {
          heading: "脆弱性の報告",
          paragraphs: [
            "セキュリティ上の問題を見つけた場合は、責任ある開示でご連絡ください。",
            "メール: security@simpletool.app",
          ],
        },
        {
          heading: "対象範囲",
          list: [
            "SimpleTool App のWebサイトと Cloudflare Worker エンドポイント",
            "クライアントサイドのツールと UI 機能",
          ],
        },
        {
          heading: "対応方針",
          paragraphs: [
            "有効な報告は 3 営業日以内の受領確認を目標とし、修正状況も継続的に共有します。",
          ],
        },
      ],
    },
    es: {
      sections: [
        {
          heading: "Reporte de vulnerabilidades",
          paragraphs: [
            "Si crees que encontraste un problema de seguridad, repórtalo de forma responsable.",
            "Correo: security@simpletool.app",
          ],
        },
        {
          heading: "Alcance",
          list: [
            "El sitio web de SimpleTool App y los endpoints de Cloudflare Worker",
            "Las herramientas del lado del cliente y la funcionalidad de la UI",
          ],
        },
        {
          heading: "Tiempos de respuesta",
          paragraphs: [
            "Intentamos confirmar los reportes válidos en un plazo de 3 días hábiles y compartir actualizaciones mientras se implementan las correcciones.",
          ],
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          heading: "漏洞报告",
          paragraphs: [
            "如果您发现安全问题，请以负责任的方式进行披露。",
            "邮箱：security@simpletool.app",
          ],
        },
        {
          heading: "范围",
          list: [
            "SimpleTool App 网站及 Cloudflare Worker 端点",
            "客户端工具与 UI 功能",
          ],
        },
        {
          heading: "响应预期",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          heading: "漏洞回報",
          paragraphs: [
            "如果您發現安全問題，請以負責任的方式進行揭露。",
            "電子郵件：security@simpletool.app",
          ],
        },
        {
          heading: "範圍",
          list: [
            "SimpleTool App 網站及 Cloudflare Worker 端點",
            "用戶端工具與 UI 功能",
          ],
        },
        {
          heading: "回應預期",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    fr: {
      sections: [
        {
          heading: "Signalement d'une vulnérabilité",
          paragraphs: [
            "Si vous pensez avoir trouvé un problème de sécurité, veuillez le signaler de manière responsable.",
            "E-mail : security@simpletool.app",
          ],
        },
        {
          heading: "Périmètre",
          list: [
            "Le site web de SimpleTool App et les endpoints Cloudflare Worker",
            "Les outils côté client et les fonctionnalités de l'interface",
          ],
        },
        {
          heading: "Délais de réponse attendus",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    de: {
      sections: [
        {
          heading: "Sicherheitslücke melden",
          paragraphs: [
            "Wenn Sie ein Sicherheitsproblem entdeckt haben, melden Sie es bitte verantwortungsvoll.",
            "E-Mail: security@simpletool.app",
          ],
        },
        {
          heading: "Geltungsbereich",
          list: [
            "Die SimpleTool App-Website und Cloudflare Worker-Endpunkte",
            "Clientseitige Tools und UI-Funktionalität",
          ],
        },
        {
          heading: "Reaktionserwartungen",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    pt: {
      sections: [
        {
          heading: "Relatar uma vulnerabilidade",
          paragraphs: [
            "Se acredita ter encontrado um problema de segurança, por favor reporte-o de forma responsável.",
            "E-mail: security@simpletool.app",
          ],
        },
        {
          heading: "Escopo",
          list: [
            "O site do SimpleTool App e os endpoints do Cloudflare Worker",
            "Ferramentas do lado do cliente e funcionalidades de interface",
          ],
        },
        {
          heading: "Expectativas de resposta",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    vi: {
      sections: [
        {
          heading: "Báo cáo lỗ hổng bảo mật",
          paragraphs: [
            "Nếu bạn cho rằng đã tìm thấy vấn đề bảo mật, vui lòng báo cáo một cách có trách nhiệm.",
            "Email: security@simpletool.app",
          ],
        },
        {
          heading: "Phạm vi",
          list: [
            "Trang web SimpleTool App và các endpoint Cloudflare Worker",
            "Công cụ phía máy khách và chức năng giao diện người dùng",
          ],
        },
        {
          heading: "Kỳ vọng phản hồi",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
  },
  careers: {
    en: {
      sections: [
        {
          heading: "Open Roles",
          paragraphs: [
            "There are no open roles. We do not accept or retain unsolicited applications or résumés.",
            "For existing project information, visit https://github.com/trac3r00/simpletool or use the public contact page at /contact.",
          ],
        },
      ],
    },
    ko: {
      sections: [
        {
          heading: "채용 중인 역할",
          paragraphs: [
            "현재 공개 채용 중인 역할은 없습니다. 요청하지 않은 지원서나 이력서는 접수하거나 보관하지 않습니다.",
            "프로젝트 정보: https://github.com/trac3r00/simpletool · 문의: /contact",
          ],
        },
      ],
    },
    ja: {
      sections: [
        {
          heading: "募集中の職種",
          paragraphs: [
            "現在公開中の募集職種はありません。依頼していない応募書類や履歴書は受け付けず、保管もしません。",
            "プロジェクト情報: https://github.com/trac3r00/simpletool ・お問い合わせ: /contact",
          ],
        },
      ],
    },
    es: {
      sections: [
        {
          heading: "Vacantes abiertas",
          paragraphs: [
            "No hay vacantes abiertas. No aceptamos ni conservamos solicitudes o currículos no solicitados.",
            "Información del proyecto: https://github.com/trac3r00/simpletool · Contacto: /contact",
          ],
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          heading: "职位招募",
          paragraphs: [
            "目前没有公开职位。我们不接收或保留未经邀请的申请或简历。",
            "项目信息：https://github.com/trac3r00/simpletool；联系：/contact",
          ],
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          heading: "職位招募",
          paragraphs: [
            "目前沒有公開職位。我們不接收或保留未經邀請的申請或履歷。",
            "專案資訊：https://github.com/trac3r00/simpletool；聯絡：/contact",
          ],
        },
      ],
    },
    fr: {
      sections: [
        {
          heading: "Postes ouverts",
          paragraphs: [
            "Aucun poste n'est ouvert. Nous n'acceptons ni ne conservons les candidatures ou CV non sollicités.",
            "Projet : https://github.com/trac3r00/simpletool · Contact : /contact",
          ],
        },
      ],
    },
    de: {
      sections: [
        {
          heading: "Offene Stellen",
          paragraphs: [
            "Es gibt keine offenen Stellen. Unaufgeforderte Bewerbungen oder Lebensläufe werden weder angenommen noch gespeichert.",
            "Projekt: https://github.com/trac3r00/simpletool · Kontakt: /contact",
          ],
        },
      ],
    },
    pt: {
      sections: [
        {
          heading: "Vagas abertas",
          paragraphs: [
            "Não há vagas abertas. Não aceitamos nem armazenamos candidaturas ou currículos não solicitados.",
            "Projeto: https://github.com/trac3r00/simpletool · Contato: /contact",
          ],
        },
      ],
    },
    vi: {
      sections: [
        {
          heading: "Vị trí tuyển dụng",
          paragraphs: [
            "Không có vị trí tuyển dụng nào đang mở. Chúng tôi không tiếp nhận hoặc lưu hồ sơ ứng tuyển không được yêu cầu.",
            "Dự án: https://github.com/trac3r00/simpletool · Liên hệ: /contact",
          ],
        },
      ],
    },
  },
  contact: {
    en: {
      sections: [
        {
          paragraphs: [
            "We would love to hear from you. If you have questions, feedback, bug reports, or feature requests, feel free to reach out.",
          ],
        },
        {
          heading: "General Inquiries",
          paragraphs: [
            "For general questions about SimpleTool App:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Bug Reports & Feature Requests",
          paragraphs: [
            "Found a bug or have an idea for a new feature? When reporting bugs, please include:",
          ],
          list: [
            "Description of the issue",
            "Steps to reproduce (if applicable)",
            "Browser and operating system",
            "Any error messages you saw",
          ],
        },
        {
          heading: "Security Issues",
          paragraphs: [
            "If you discover a security vulnerability, please report it responsibly:",
            "security@simpletool.app",
            "Please do not disclose security issues publicly until we've had a chance to address them.",
          ],
        },
        {
          heading: "Press & Other Questions",
          paragraphs: [
            "For press, media, or other non-product questions:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Response Time",
          paragraphs: [
            "Messages are reviewed as capacity allows. No acknowledgement or resolution time is guaranteed.",
          ],
        },
      ],
    },
    ko: {
      sections: [
        {
          paragraphs: [
            "질문, 피드백, 버그 제보, 기능 요청이 있다면 언제든 연락해 주세요.",
          ],
        },
        {
          heading: "일반 문의",
          paragraphs: [
            "SimpleTool App 관련 일반 문의:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "버그 제보 및 기능 요청",
          paragraphs: [
            "버그를 발견했거나 새 기능 아이디어가 있다면 아래 내용을 함께 보내 주세요:",
          ],
          list: [
            "문제 설명",
            "재현 단계(가능한 경우)",
            "브라우저와 운영체제",
            "표시된 오류 메시지",
          ],
        },
        {
          heading: "보안 이슈",
          paragraphs: [
            "보안 취약점을 발견했다면 책임 있는 방식으로 제보해 주세요:",
            "security@simpletool.app",
            "대응할 시간을 확보할 때까지 공개 공유는 삼가 주세요.",
          ],
        },
        {
          heading: "보도 및 기타 문의",
          paragraphs: [
            "보도, 미디어, 그 외 제품 외 문의:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "응답 시간",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    ja: {
      sections: [
        {
          paragraphs: [
            "質問、フィードバック、不具合報告、機能提案があればお気軽にご連絡ください。",
          ],
        },
        {
          heading: "一般のお問い合わせ",
          paragraphs: [
            "SimpleTool App に関する一般的なお問い合わせ:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "不具合報告と機能要望",
          paragraphs: [
            "不具合の報告や新機能の提案を送る際は、次の情報を含めてください:",
          ],
          list: [
            "問題の説明",
            "再現手順（可能な場合）",
            "ブラウザとOS",
            "表示されたエラーメッセージ",
          ],
        },
        {
          heading: "セキュリティ問題",
          paragraphs: [
            "脆弱性を見つけた場合は、責任ある開示でご連絡ください:",
            "security@simpletool.app",
            "対応の時間を確保するまで公開しないでください。",
          ],
        },
        {
          heading: "報道とその他のお問い合わせ",
          paragraphs: [
            "報道、メディア、その他プロダクト以外のご相談:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "返信の目安",
          paragraphs: [
            "通常のお問い合わせは 2〜3 営業日以内の返信を目安としており、セキュリティ問題は優先して対応します。",
          ],
        },
      ],
    },
    es: {
      sections: [
        {
          paragraphs: [
            "Si tienes preguntas, comentarios, reportes de errores o solicitudes de funciones, no dudes en escribirnos.",
          ],
        },
        {
          heading: "Consultas generales",
          paragraphs: [
            "Para preguntas generales sobre SimpleTool App:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Errores y solicitudes de funciones",
          paragraphs: [
            "Si encontraste un error o tienes una idea para una nueva función, incluye lo siguiente:",
          ],
          list: [
            "Descripción del problema",
            "Pasos para reproducirlo (si aplica)",
            "Navegador y sistema operativo",
            "Mensajes de error observados",
          ],
        },
        {
          heading: "Problemas de seguridad",
          paragraphs: [
            "Si descubres una vulnerabilidad de seguridad, repórtala de forma responsable:",
            "security@simpletool.app",
            "No la divulges públicamente hasta que tengamos tiempo de corregirla.",
          ],
        },
        {
          heading: "Prensa y otras consultas",
          paragraphs: [
            "Para prensa, medios u otras preguntas que no sean de producto:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Tiempo de respuesta",
          paragraphs: [
            "Normalmente respondemos en 2 o 3 días hábiles. Los temas de seguridad reciben prioridad.",
          ],
        },
      ],
    },
    "zh-CN": {
      sections: [
        {
          paragraphs: [
            "我们很乐意听取您的意见。如有问题、反馈、错误报告或功能请求，欢迎随时联系。",
          ],
        },
        {
          heading: "一般咨询",
          paragraphs: [
            "关于 SimpleTool App 的一般问题：",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "错误报告与功能请求",
          paragraphs: [
            "发现了错误或有新功能的想法？报告错误时请包含以下信息：",
          ],
          list: [
            "问题描述",
            "复现步骤（如适用）",
            "浏览器与操作系统",
            "您看到的任何错误信息",
          ],
        },
        {
          heading: "安全问题",
          paragraphs: [
            "如发现安全漏洞，请以负责任的方式报告：",
            "security@simpletool.app",
            "在我们有机会处理之前，请勿公开披露安全问题。",
          ],
        },
        {
          heading: "媒体与其他咨询",
          paragraphs: [
            "媒体、新闻或其他非产品问题：",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "响应时间",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    "zh-TW": {
      sections: [
        {
          paragraphs: [
            "我們很樂意聽取您的意見。如有問題、回饋、錯誤回報或功能請求，歡迎隨時聯絡。",
          ],
        },
        {
          heading: "一般諮詢",
          paragraphs: [
            "關於 SimpleTool App 的一般問題：",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "錯誤回報與功能請求",
          paragraphs: [
            "發現了錯誤或有新功能的想法？回報錯誤時請包含以下資訊：",
          ],
          list: [
            "問題描述",
            "重現步驟（如適用）",
            "瀏覽器與作業系統",
            "您看到的任何錯誤訊息",
          ],
        },
        {
          heading: "安全問題",
          paragraphs: [
            "如發現安全漏洞，請以負責任的方式回報：",
            "security@simpletool.app",
            "在我們有機會處理之前，請勿公開揭露安全問題。",
          ],
        },
        {
          heading: "媒體與其他諮詢",
          paragraphs: [
            "媒體、新聞或其他非產品問題：",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "回應時間",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    fr: {
      sections: [
        {
          paragraphs: [
            "Nous serions ravis d'avoir de vos nouvelles. Si vous avez des questions, des commentaires, des rapports de bugs ou des demandes de fonctionnalités, n'hésitez pas à nous contacter.",
          ],
        },
        {
          heading: "Demandes générales",
          paragraphs: [
            "Pour les questions générales sur SimpleTool App :",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Rapports de bugs et demandes de fonctionnalités",
          paragraphs: [
            "Vous avez trouvé un bug ou une idée de nouvelle fonctionnalité ? Lors du signalement d'un bug, veuillez inclure :",
          ],
          list: [
            "Description du problème",
            "Étapes pour reproduire (si applicable)",
            "Navigateur et système d'exploitation",
            "Les messages d'erreur affichés",
          ],
        },
        {
          heading: "Problèmes de sécurité",
          paragraphs: [
            "Si vous découvrez une vulnérabilité de sécurité, veuillez la signaler de manière responsable :",
            "security@simpletool.app",
            "Veuillez ne pas divulguer publiquement les problèmes de sécurité avant que nous ayons eu la possibilité de les traiter.",
          ],
        },
        {
          heading: "Presse et autres questions",
          paragraphs: [
            "Pour la presse, les médias ou d'autres questions hors produit :",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Délai de réponse",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    de: {
      sections: [
        {
          paragraphs: [
            "Wir freuen uns von Ihnen zu hören. Bei Fragen, Feedback, Fehlerberichten oder Feature-Anfragen können Sie sich jederzeit melden.",
          ],
        },
        {
          heading: "Allgemeine Anfragen",
          paragraphs: [
            "Für allgemeine Fragen zu SimpleTool App:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Fehlerberichte & Feature-Anfragen",
          paragraphs: [
            "Einen Fehler gefunden oder eine Idee für eine neue Funktion? Beim Melden von Fehlern fügen Sie bitte folgendes hinzu:",
          ],
          list: [
            "Beschreibung des Problems",
            "Schritte zur Reproduktion (falls zutreffend)",
            "Browser und Betriebssystem",
            "Angezeigte Fehlermeldungen",
          ],
        },
        {
          heading: "Sicherheitsprobleme",
          paragraphs: [
            "Wenn Sie eine Sicherheitslücke entdecken, melden Sie diese bitte verantwortungsvoll:",
            "security@simpletool.app",
            "Bitte veröffentlichen Sie Sicherheitsprobleme nicht, bevor wir die Möglichkeit hatten, sie zu beheben.",
          ],
        },
        {
          heading: "Presse und weitere Fragen",
          paragraphs: [
            "Für Presse, Medien oder andere produktfremde Fragen:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Reaktionszeit",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    pt: {
      sections: [
        {
          paragraphs: [
            "Adoraríamos ouvir de você. Se tiver perguntas, feedback, relatórios de bugs ou solicitações de recursos, sinta-se à vontade para entrar em contato.",
          ],
        },
        {
          heading: "Consultas gerais",
          paragraphs: [
            "Para perguntas gerais sobre o SimpleTool App:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Relatórios de bugs e solicitações de recursos",
          paragraphs: [
            "Encontrou um bug ou tem uma ideia para um novo recurso? Ao relatar bugs, inclua:",
          ],
          list: [
            "Descrição do problema",
            "Passos para reproduzir (se aplicável)",
            "Navegador e sistema operacional",
            "Mensagens de erro que você viu",
          ],
        },
        {
          heading: "Problemas de segurança",
          paragraphs: [
            "Se descobrir uma vulnerabilidade de segurança, por favor reporte-a de forma responsável:",
            "security@simpletool.app",
            "Por favor, não divulgue problemas de segurança publicamente até que tenhamos tido a oportunidade de tratá-los.",
          ],
        },
        {
          heading: "Imprensa e outras perguntas",
          paragraphs: [
            "Para imprensa, mídia ou outras perguntas que não sejam de produto:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Tempo de resposta",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
    vi: {
      sections: [
        {
          paragraphs: [
            "Chúng tôi rất muốn nghe ý kiến của bạn. Nếu có câu hỏi, phản hồi, báo cáo lỗi hoặc yêu cầu tính năng, hãy liên hệ với chúng tôi.",
          ],
        },
        {
          heading: "Câu hỏi chung",
          paragraphs: [
            "Với các câu hỏi chung về SimpleTool App:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Báo cáo lỗi và yêu cầu tính năng",
          paragraphs: [
            "Tìm thấy lỗi hoặc có ý tưởng về tính năng mới? Khi báo cáo lỗi, vui lòng bao gồm:",
          ],
          list: [
            "Mô tả vấn đề",
            "Các bước tái hiện (nếu có)",
            "Trình duyệt và hệ điều hành",
            "Bất kỳ thông báo lỗi nào bạn thấy",
          ],
        },
        {
          heading: "Vấn đề bảo mật",
          paragraphs: [
            "Nếu phát hiện lỗ hổng bảo mật, vui lòng báo cáo một cách có trách nhiệm:",
            "security@simpletool.app",
            "Vui lòng không công khai các vấn đề bảo mật cho đến khi chúng tôi có cơ hội xử lý chúng.",
          ],
        },
        {
          heading: "Báo chí và câu hỏi khác",
          paragraphs: [
            "Với báo chí, truyền thông hoặc câu hỏi không liên quan đến sản phẩm:",
            "hello@simpletool.app",
          ],
        },
        {
          heading: "Thời gian phản hồi",
          paragraphs: [
            "Messages are reviewed as capacity allows; no response time is guaranteed.",
          ],
        },
      ],
    },
  },
};

export function getLegalSections(pageId, lang = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(lang);
  const page = LEGAL_CONTENT[pageId];
  if (!page) return [];
  const sections = page[normalized]?.sections || page[DEFAULT_LANGUAGE]?.sections || [];
  const policyIndex = pageId === "terms" ? 3 : pageId === "privacy" ? 4 : -1;
  const localizedLegal =
    REVIEWED_LEGAL_CONTENT[normalized] || REVIEWED_LEGAL_CONTENT[DEFAULT_LANGUAGE];

  return sections.map((section, index) => {
    const next = { ...section };
    if (
      (pageId === "contact" || pageId === "security") &&
      index === sections.length - 1
    ) {
      next.paragraphs = [localizedLegal.responseMessage];
    }
    if (pageId === "about" && next.html) {
      next.html = next.html.replace(
        /(<div class="text-3xl font-bold[^>]*)(>)(?:45|47)(<\/div>)/,
        `$1 data-public-tool-count$2${PRODUCTION_TOOL_COUNT}$3`,
      );
    }
    if (index === policyIndex) {
      next.adPolicy = getAdPolicySnapshot();
      next.adPolicyLabels = localizedLegal.adPolicy;
    }
    return next;
  });
}
