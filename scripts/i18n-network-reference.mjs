#!/usr/bin/env node
/**
 * i18n backfill for the three reference tools embedded in /network-reference.
 *
 * `dns-reference` (ui.category.*, ui.title.*), `port-reference`
 * (cheatsheet.c0-c2, ui.tip0) and `protocol-headers` (cheatsheet.c0-c3)
 * referenced translation keys that no locale ever defined — including `en`.
 * They predate the network-reference merge and degraded silently to the
 * server-rendered English (`_patchDOM` skips a key it cannot resolve), which
 * is why no test caught them. `src/i18n/rendered-keys.test.js` now asserts
 * every rendered `data-i18n*` key resolves.
 *
 * Table STRUCTURE is identical in every locale — the same rows, the same
 * <code> literals, the same protocol field names (Destination MAC, IHL, TTL...)
 * and RFC terms, which must NOT be translated. Only prose is localised, so the
 * markup is assembled from one template per block and the dictionaries below
 * carry only the translatable strings.
 *
 *   node scripts/i18n-network-reference.mjs && npm run build
 *
 * Parity is enforced by src/i18n/embedded-tools.test.js and
 * src/i18n/rendered-keys.test.js.
 */
import fs from "node:fs";

const RECORDS = [
  ["A", 0],
  ["AAAA", 0],
  ["CNAME", 1],
  ["MX", 2],
  ["TXT", 3],
  ["NS", 4],
  ["SOA", 4],
  ["PTR", 5],
  ["SRV", 6],
  ["CAA", 7],
  ["DKIM", 8],
  ["SPF", 8],
  ["DMARC", 8],
  ["DS", 9],
  ["DNSKEY", 9],
];

// Order: Address, Alias, Mail, Text, Infrastructure, Reverse, Service,
//        Security, Email Security, DNSSEC
const L = {
  en: {
    cats: [
      "Address",
      "Alias",
      "Mail",
      "Text",
      "Infrastructure",
      "Reverse",
      "Service",
      "Security",
      "Email Security",
      "DNSSEC",
    ],
    title: "Click to view {t} details",
    tip0: "Type a port number (e.g., 443) or service name (e.g., HTTPS)",
    thRange: ["Range", "Name", "Description"],
    thRisk: ["Port", "Service", "Risk"],
    thField: ["Field", "Size", "Description"],
    thEther: ["Value", "Protocol"],
    ranges: [
      ["Well-Known", "Reserved for system services (HTTP, SSH, etc.)"],
      ["Registered", "User-registered ports for applications"],
      ["Dynamic/Private", "Ephemeral ports for client connections"],
    ],
    risks: [
      "Unencrypted file transfers",
      "Plain text authentication",
      "Email spam relay risk",
      "DDoS amplification attacks",
      "Ransomware propagation",
      "Brute force attacks",
    ],
    practices: [
      [
        "Close unused ports",
        "Reduce attack surface by disabling services you don't need",
      ],
      ["Use firewalls", "Implement network-level access controls"],
      ["Monitor traffic", "Log connections to sensitive ports (22, 443, 3389)"],
      [
        "Prefer encrypted protocols",
        "Use SSH (22) instead of Telnet (23), SFTP instead of FTP",
      ],
      [
        "Change defaults",
        "Consider non-standard ports for SSH/RDP (security through obscurity)",
      ],
    ],
    bytes: "{n} bytes",
    bits: "{n} bits",
    eth: [
      "Target hardware address",
      "Sender hardware address",
      "Protocol type (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "IP version (4)",
      "Header length in 32-bit words",
      "Type of Service / DSCP",
      "Total packet size",
      "Time to Live (hop limit)",
      "Next protocol (6=TCP, 17=UDP)",
      "Header checksum",
    ],
    tcp: [
      "Sender port number",
      "Receiver port number",
      "Sequence number",
      "Acknowledgment number",
      "Header length / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Receive window size",
    ],
  },
  ko: {
    cats: [
      "주소",
      "별칭",
      "메일",
      "텍스트",
      "인프라",
      "역방향",
      "서비스",
      "보안",
      "이메일 보안",
      "DNSSEC",
    ],
    title: "{t} 레코드 세부 정보 보기",
    tip0: "포트 번호(예: 443) 또는 서비스 이름(예: HTTPS)을 입력하세요",
    thRange: ["범위", "이름", "설명"],
    thRisk: ["포트", "서비스", "위험"],
    thField: ["필드", "크기", "설명"],
    thEther: ["값", "프로토콜"],
    ranges: [
      ["잘 알려진 포트", "시스템 서비스용으로 예약됨(HTTP, SSH 등)"],
      ["등록된 포트", "애플리케이션용으로 등록된 사용자 포트"],
      ["동적/사설 포트", "클라이언트 연결용 임시 포트"],
    ],
    risks: [
      "암호화되지 않은 파일 전송",
      "평문 인증",
      "이메일 스팸 릴레이 위험",
      "DDoS 증폭 공격",
      "랜섬웨어 확산",
      "무차별 대입 공격",
    ],
    practices: [
      [
        "사용하지 않는 포트 차단",
        "필요 없는 서비스를 비활성화해 공격 표면을 줄이세요",
      ],
      ["방화벽 사용", "네트워크 수준의 접근 제어를 구성하세요"],
      ["트래픽 모니터링", "민감한 포트(22, 443, 3389) 연결을 기록하세요"],
      [
        "암호화 프로토콜 우선",
        "Telnet(23) 대신 SSH(22), FTP 대신 SFTP를 사용하세요",
      ],
      [
        "기본값 변경",
        "SSH/RDP에 비표준 포트 사용을 고려하세요(보안을 위한 은닉)",
      ],
    ],
    bytes: "{n}바이트",
    bits: "{n}비트",
    eth: [
      "대상 하드웨어 주소",
      "발신자 하드웨어 주소",
      "프로토콜 유형(0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "IP 버전(4)",
      "32비트 워드 단위 헤더 길이",
      "서비스 유형 / DSCP",
      "전체 패킷 크기",
      "TTL(홉 제한)",
      "다음 프로토콜(6=TCP, 17=UDP)",
      "헤더 체크섬",
    ],
    tcp: [
      "발신 포트 번호",
      "수신 포트 번호",
      "시퀀스 번호",
      "확인 응답 번호",
      "헤더 길이 / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "수신 윈도 크기",
    ],
  },
  ja: {
    cats: [
      "アドレス",
      "エイリアス",
      "メール",
      "テキスト",
      "インフラ",
      "逆引き",
      "サービス",
      "セキュリティ",
      "メールセキュリティ",
      "DNSSEC",
    ],
    title: "{t} レコードの詳細を表示",
    tip0: "ポート番号（例: 443）またはサービス名（例: HTTPS）を入力してください",
    thRange: ["範囲", "名称", "説明"],
    thRisk: ["ポート", "サービス", "リスク"],
    thField: ["フィールド", "サイズ", "説明"],
    thEther: ["値", "プロトコル"],
    ranges: [
      ["ウェルノウン", "システムサービス用に予約（HTTP、SSH など）"],
      ["登録済み", "アプリケーション用に登録されたポート"],
      ["動的/プライベート", "クライアント接続用の一時ポート"],
    ],
    risks: [
      "暗号化されないファイル転送",
      "平文による認証",
      "メールスパム中継のリスク",
      "DDoS 増幅攻撃",
      "ランサムウェアの拡散",
      "ブルートフォース攻撃",
    ],
    practices: [
      [
        "未使用ポートを閉じる",
        "不要なサービスを無効化して攻撃対象領域を減らします",
      ],
      [
        "ファイアウォールを使う",
        "ネットワークレベルのアクセス制御を実装します",
      ],
      [
        "トラフィックを監視する",
        "重要なポート（22、443、3389）への接続を記録します",
      ],
      [
        "暗号化プロトコルを優先する",
        "Telnet(23) ではなく SSH(22)、FTP ではなく SFTP を使います",
      ],
      [
        "既定値を変更する",
        "SSH/RDP に非標準ポートの利用を検討します（隠蔽による安全性）",
      ],
    ],
    bytes: "{n} バイト",
    bits: "{n} ビット",
    eth: [
      "宛先ハードウェアアドレス",
      "送信元ハードウェアアドレス",
      "プロトコル種別（0x0800=IPv4、0x86DD=IPv6）",
    ],
    ipv4: [
      "IP バージョン（4）",
      "32 ビットワード単位のヘッダー長",
      "サービス種別 / DSCP",
      "パケット全体のサイズ",
      "Time to Live（ホップ制限）",
      "次のプロトコル（6=TCP、17=UDP）",
      "ヘッダーチェックサム",
    ],
    tcp: [
      "送信元ポート番号",
      "宛先ポート番号",
      "シーケンス番号",
      "確認応答番号",
      "ヘッダー長 / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "受信ウィンドウサイズ",
    ],
  },
  es: {
    cats: [
      "Dirección",
      "Alias",
      "Correo",
      "Texto",
      "Infraestructura",
      "Inversa",
      "Servicio",
      "Seguridad",
      "Seguridad de correo",
      "DNSSEC",
    ],
    title: "Ver detalles del registro {t}",
    tip0: "Escribe un número de puerto (p. ej., 443) o un nombre de servicio (p. ej., HTTPS)",
    thRange: ["Rango", "Nombre", "Descripción"],
    thRisk: ["Puerto", "Servicio", "Riesgo"],
    thField: ["Campo", "Tamaño", "Descripción"],
    thEther: ["Valor", "Protocolo"],
    ranges: [
      [
        "Bien conocidos",
        "Reservados para servicios del sistema (HTTP, SSH, etc.)",
      ],
      ["Registrados", "Puertos registrados por usuarios para aplicaciones"],
      ["Dinámicos/Privados", "Puertos efímeros para conexiones de cliente"],
    ],
    risks: [
      "Transferencias de archivos sin cifrar",
      "Autenticación en texto plano",
      "Riesgo de reenvío de spam",
      "Ataques de amplificación DDoS",
      "Propagación de ransomware",
      "Ataques de fuerza bruta",
    ],
    practices: [
      [
        "Cierra los puertos sin usar",
        "Reduce la superficie de ataque desactivando servicios que no necesitas",
      ],
      ["Usa cortafuegos", "Implementa controles de acceso a nivel de red"],
      [
        "Monitoriza el tráfico",
        "Registra las conexiones a puertos sensibles (22, 443, 3389)",
      ],
      [
        "Prefiere protocolos cifrados",
        "Usa SSH (22) en lugar de Telnet (23), y SFTP en lugar de FTP",
      ],
      [
        "Cambia los valores por defecto",
        "Considera puertos no estándar para SSH/RDP (seguridad por ocultación)",
      ],
    ],
    bytes: "{n} bytes",
    bits: "{n} bits",
    eth: [
      "Dirección de hardware de destino",
      "Dirección de hardware del emisor",
      "Tipo de protocolo (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "Versión de IP (4)",
      "Longitud del encabezado en palabras de 32 bits",
      "Tipo de servicio / DSCP",
      "Tamaño total del paquete",
      "Tiempo de vida (límite de saltos)",
      "Protocolo siguiente (6=TCP, 17=UDP)",
      "Suma de comprobación del encabezado",
    ],
    tcp: [
      "Número de puerto del emisor",
      "Número de puerto del receptor",
      "Número de secuencia",
      "Número de acuse de recibo",
      "Longitud del encabezado / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Tamaño de la ventana de recepción",
    ],
  },
  zhCN: {
    cats: [
      "地址",
      "别名",
      "邮件",
      "文本",
      "基础设施",
      "反向解析",
      "服务",
      "安全",
      "邮件安全",
      "DNSSEC",
    ],
    title: "查看 {t} 记录详情",
    tip0: "输入端口号（如 443）或服务名称（如 HTTPS）",
    thRange: ["范围", "名称", "说明"],
    thRisk: ["端口", "服务", "风险"],
    thField: ["字段", "大小", "说明"],
    thEther: ["值", "协议"],
    ranges: [
      ["知名端口", "保留给系统服务（HTTP、SSH 等）"],
      ["注册端口", "由用户为应用程序注册的端口"],
      ["动态/私有端口", "用于客户端连接的临时端口"],
    ],
    risks: [
      "未加密的文件传输",
      "明文身份验证",
      "邮件垃圾中继风险",
      "DDoS 放大攻击",
      "勒索软件传播",
      "暴力破解攻击",
    ],
    practices: [
      ["关闭未使用的端口", "停用不需要的服务以减少攻击面"],
      ["使用防火墙", "实施网络层访问控制"],
      ["监控流量", "记录到敏感端口（22、443、3389）的连接"],
      ["优先使用加密协议", "使用 SSH(22) 而非 Telnet(23)，使用 SFTP 而非 FTP"],
      ["更改默认设置", "考虑为 SSH/RDP 使用非标准端口（以隐蔽换取安全）"],
    ],
    bytes: "{n} 字节",
    bits: "{n} 位",
    eth: [
      "目标硬件地址",
      "发送方硬件地址",
      "协议类型（0x0800=IPv4，0x86DD=IPv6）",
    ],
    ipv4: [
      "IP 版本（4）",
      "以 32 位字为单位的首部长度",
      "服务类型 / DSCP",
      "数据包总大小",
      "生存时间（跳数限制）",
      "下一个协议（6=TCP，17=UDP）",
      "首部校验和",
    ],
    tcp: [
      "源端口号",
      "目标端口号",
      "序列号",
      "确认号",
      "首部长度 / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "接收窗口大小",
    ],
  },
  zhTW: {
    cats: [
      "位址",
      "別名",
      "郵件",
      "文字",
      "基礎架構",
      "反向解析",
      "服務",
      "安全",
      "郵件安全",
      "DNSSEC",
    ],
    title: "檢視 {t} 記錄詳細資料",
    tip0: "輸入通訊埠號（如 443）或服務名稱（如 HTTPS）",
    thRange: ["範圍", "名稱", "說明"],
    thRisk: ["通訊埠", "服務", "風險"],
    thField: ["欄位", "大小", "說明"],
    thEther: ["值", "協定"],
    ranges: [
      ["知名通訊埠", "保留給系統服務（HTTP、SSH 等）"],
      ["註冊通訊埠", "由使用者為應用程式註冊的通訊埠"],
      ["動態/私人通訊埠", "用於用戶端連線的暫時通訊埠"],
    ],
    risks: [
      "未加密的檔案傳輸",
      "明文身分驗證",
      "郵件垃圾轉送風險",
      "DDoS 放大攻擊",
      "勒索軟體傳播",
      "暴力破解攻擊",
    ],
    practices: [
      ["關閉未使用的通訊埠", "停用不需要的服務以縮小攻擊面"],
      ["使用防火牆", "實作網路層級的存取控制"],
      ["監控流量", "記錄連往敏感通訊埠（22、443、3389）的連線"],
      ["優先使用加密協定", "使用 SSH(22) 而非 Telnet(23)，使用 SFTP 而非 FTP"],
      ["變更預設值", "考慮為 SSH/RDP 使用非標準通訊埠（以隱蔽換取安全）"],
    ],
    bytes: "{n} 位元組",
    bits: "{n} 位元",
    eth: [
      "目標硬體位址",
      "傳送端硬體位址",
      "協定類型（0x0800=IPv4、0x86DD=IPv6）",
    ],
    ipv4: [
      "IP 版本（4）",
      "以 32 位元字組為單位的標頭長度",
      "服務類型 / DSCP",
      "封包總大小",
      "存活時間（跳躍限制）",
      "下一個協定（6=TCP、17=UDP）",
      "標頭總和檢查碼",
    ],
    tcp: [
      "來源通訊埠號",
      "目的通訊埠號",
      "序號",
      "確認號",
      "標頭長度 / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "接收視窗大小",
    ],
  },
  fr: {
    cats: [
      "Adresse",
      "Alias",
      "Courrier",
      "Texte",
      "Infrastructure",
      "Inverse",
      "Service",
      "Sécurité",
      "Sécurité e-mail",
      "DNSSEC",
    ],
    title: "Afficher les détails de l'enregistrement {t}",
    tip0: "Saisissez un numéro de port (p. ex. 443) ou un nom de service (p. ex. HTTPS)",
    thRange: ["Plage", "Nom", "Description"],
    thRisk: ["Port", "Service", "Risque"],
    thField: ["Champ", "Taille", "Description"],
    thEther: ["Valeur", "Protocole"],
    ranges: [
      ["Bien connus", "Réservés aux services système (HTTP, SSH, etc.)"],
      [
        "Enregistrés",
        "Ports enregistrés par les utilisateurs pour les applications",
      ],
      ["Dynamiques/Privés", "Ports éphémères pour les connexions client"],
    ],
    risks: [
      "Transferts de fichiers non chiffrés",
      "Authentification en clair",
      "Risque de relais de spam",
      "Attaques par amplification DDoS",
      "Propagation de rançongiciels",
      "Attaques par force brute",
    ],
    practices: [
      [
        "Fermez les ports inutilisés",
        "Réduisez la surface d'attaque en désactivant les services inutiles",
      ],
      [
        "Utilisez des pare-feux",
        "Mettez en place des contrôles d'accès au niveau réseau",
      ],
      [
        "Surveillez le trafic",
        "Journalisez les connexions aux ports sensibles (22, 443, 3389)",
      ],
      [
        "Préférez les protocoles chiffrés",
        "Utilisez SSH (22) au lieu de Telnet (23), et SFTP au lieu de FTP",
      ],
      [
        "Changez les valeurs par défaut",
        "Envisagez des ports non standard pour SSH/RDP (sécurité par obscurité)",
      ],
    ],
    bytes: "{n} octets",
    bits: "{n} bits",
    eth: [
      "Adresse matérielle de destination",
      "Adresse matérielle de l'émetteur",
      "Type de protocole (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "Version IP (4)",
      "Longueur d'en-tête en mots de 32 bits",
      "Type de service / DSCP",
      "Taille totale du paquet",
      "Durée de vie (limite de sauts)",
      "Protocole suivant (6=TCP, 17=UDP)",
      "Somme de contrôle de l'en-tête",
    ],
    tcp: [
      "Numéro de port de l'émetteur",
      "Numéro de port du destinataire",
      "Numéro de séquence",
      "Numéro d'acquittement",
      "Longueur d'en-tête / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Taille de la fenêtre de réception",
    ],
  },
  de: {
    cats: [
      "Adresse",
      "Alias",
      "Mail",
      "Text",
      "Infrastruktur",
      "Reverse",
      "Dienst",
      "Sicherheit",
      "E-Mail-Sicherheit",
      "DNSSEC",
    ],
    title: "Details zum {t}-Record anzeigen",
    tip0: "Geben Sie eine Portnummer (z. B. 443) oder einen Dienstnamen (z. B. HTTPS) ein",
    thRange: ["Bereich", "Name", "Beschreibung"],
    thRisk: ["Port", "Dienst", "Risiko"],
    thField: ["Feld", "Größe", "Beschreibung"],
    thEther: ["Wert", "Protokoll"],
    ranges: [
      ["Well-Known", "Reserviert für Systemdienste (HTTP, SSH usw.)"],
      ["Registriert", "Von Nutzern für Anwendungen registrierte Ports"],
      ["Dynamisch/Privat", "Ephemere Ports für Client-Verbindungen"],
    ],
    risks: [
      "Unverschlüsselte Dateiübertragungen",
      "Authentifizierung im Klartext",
      "Risiko als Spam-Relay",
      "DDoS-Amplifikationsangriffe",
      "Verbreitung von Ransomware",
      "Brute-Force-Angriffe",
    ],
    practices: [
      [
        "Nicht genutzte Ports schließen",
        "Verkleinern Sie die Angriffsfläche, indem Sie unnötige Dienste deaktivieren",
      ],
      [
        "Firewalls einsetzen",
        "Implementieren Sie Zugriffskontrollen auf Netzwerkebene",
      ],
      [
        "Datenverkehr überwachen",
        "Protokollieren Sie Verbindungen zu sensiblen Ports (22, 443, 3389)",
      ],
      [
        "Verschlüsselte Protokolle bevorzugen",
        "Nutzen Sie SSH (22) statt Telnet (23) und SFTP statt FTP",
      ],
      [
        "Standardwerte ändern",
        "Erwägen Sie nicht standardmäßige Ports für SSH/RDP (Sicherheit durch Verschleierung)",
      ],
    ],
    bytes: "{n} Bytes",
    bits: "{n} Bit",
    eth: [
      "Ziel-Hardwareadresse",
      "Hardwareadresse des Senders",
      "Protokolltyp (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "IP-Version (4)",
      "Header-Länge in 32-Bit-Wörtern",
      "Type of Service / DSCP",
      "Gesamtgröße des Pakets",
      "Time to Live (Hop-Limit)",
      "Nächstes Protokoll (6=TCP, 17=UDP)",
      "Header-Prüfsumme",
    ],
    tcp: [
      "Portnummer des Senders",
      "Portnummer des Empfängers",
      "Sequenznummer",
      "Bestätigungsnummer",
      "Header-Länge / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Größe des Empfangsfensters",
    ],
  },
  pt: {
    cats: [
      "Endereço",
      "Alias",
      "Correio",
      "Texto",
      "Infraestrutura",
      "Reversa",
      "Serviço",
      "Segurança",
      "Segurança de e-mail",
      "DNSSEC",
    ],
    title: "Ver detalhes do registro {t}",
    tip0: "Digite um número de porta (ex.: 443) ou nome de serviço (ex.: HTTPS)",
    thRange: ["Faixa", "Nome", "Descrição"],
    thRisk: ["Porta", "Serviço", "Risco"],
    thField: ["Campo", "Tamanho", "Descrição"],
    thEther: ["Valor", "Protocolo"],
    ranges: [
      [
        "Bem conhecidas",
        "Reservadas para serviços do sistema (HTTP, SSH, etc.)",
      ],
      ["Registradas", "Portas registradas por usuários para aplicações"],
      ["Dinâmicas/Privadas", "Portas efêmeras para conexões de cliente"],
    ],
    risks: [
      "Transferências de arquivos sem criptografia",
      "Autenticação em texto puro",
      "Risco de retransmissão de spam",
      "Ataques de amplificação DDoS",
      "Propagação de ransomware",
      "Ataques de força bruta",
    ],
    practices: [
      [
        "Feche portas não utilizadas",
        "Reduza a superfície de ataque desativando serviços desnecessários",
      ],
      ["Use firewalls", "Implemente controles de acesso em nível de rede"],
      [
        "Monitore o tráfego",
        "Registre conexões a portas sensíveis (22, 443, 3389)",
      ],
      [
        "Prefira protocolos criptografados",
        "Use SSH (22) em vez de Telnet (23) e SFTP em vez de FTP",
      ],
      [
        "Altere os padrões",
        "Considere portas não padrão para SSH/RDP (segurança por obscuridade)",
      ],
    ],
    bytes: "{n} bytes",
    bits: "{n} bits",
    eth: [
      "Endereço de hardware de destino",
      "Endereço de hardware do remetente",
      "Tipo de protocolo (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "Versão do IP (4)",
      "Comprimento do cabeçalho em palavras de 32 bits",
      "Tipo de serviço / DSCP",
      "Tamanho total do pacote",
      "Tempo de vida (limite de saltos)",
      "Próximo protocolo (6=TCP, 17=UDP)",
      "Soma de verificação do cabeçalho",
    ],
    tcp: [
      "Número da porta do remetente",
      "Número da porta do destinatário",
      "Número de sequência",
      "Número de confirmação",
      "Comprimento do cabeçalho / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Tamanho da janela de recepção",
    ],
  },
  vi: {
    cats: [
      "Địa chỉ",
      "Bí danh",
      "Thư",
      "Văn bản",
      "Hạ tầng",
      "Phân giải ngược",
      "Dịch vụ",
      "Bảo mật",
      "Bảo mật email",
      "DNSSEC",
    ],
    title: "Xem chi tiết bản ghi {t}",
    tip0: "Nhập số cổng (ví dụ: 443) hoặc tên dịch vụ (ví dụ: HTTPS)",
    thRange: ["Phạm vi", "Tên", "Mô tả"],
    thRisk: ["Cổng", "Dịch vụ", "Rủi ro"],
    thField: ["Trường", "Kích thước", "Mô tả"],
    thEther: ["Giá trị", "Giao thức"],
    ranges: [
      ["Cổng phổ biến", "Dành riêng cho dịch vụ hệ thống (HTTP, SSH, v.v.)"],
      ["Cổng đã đăng ký", "Cổng do người dùng đăng ký cho ứng dụng"],
      ["Động/Riêng tư", "Cổng tạm thời cho kết nối máy khách"],
    ],
    risks: [
      "Truyền tệp không được mã hoá",
      "Xác thực bằng văn bản thuần",
      "Rủi ro chuyển tiếp thư rác",
      "Tấn công khuếch đại DDoS",
      "Lây lan mã độc tống tiền",
      "Tấn công dò mật khẩu",
    ],
    practices: [
      [
        "Đóng các cổng không dùng",
        "Giảm bề mặt tấn công bằng cách tắt những dịch vụ không cần thiết",
      ],
      ["Dùng tường lửa", "Triển khai kiểm soát truy cập ở mức mạng"],
      [
        "Theo dõi lưu lượng",
        "Ghi lại các kết nối tới cổng quan trọng (22, 443, 3389)",
      ],
      [
        "Ưu tiên giao thức mã hoá",
        "Dùng SSH (22) thay cho Telnet (23), SFTP thay cho FTP",
      ],
      [
        "Thay đổi giá trị mặc định",
        "Cân nhắc dùng cổng không chuẩn cho SSH/RDP (bảo mật nhờ ẩn giấu)",
      ],
    ],
    bytes: "{n} byte",
    bits: "{n} bit",
    eth: [
      "Địa chỉ phần cứng đích",
      "Địa chỉ phần cứng của bên gửi",
      "Loại giao thức (0x0800=IPv4, 0x86DD=IPv6)",
    ],
    ipv4: [
      "Phiên bản IP (4)",
      "Độ dài tiêu đề theo từ 32 bit",
      "Loại dịch vụ / DSCP",
      "Tổng kích thước gói tin",
      "Thời gian sống (giới hạn bước nhảy)",
      "Giao thức tiếp theo (6=TCP, 17=UDP)",
      "Tổng kiểm tra tiêu đề",
    ],
    tcp: [
      "Số cổng bên gửi",
      "Số cổng bên nhận",
      "Số thứ tự",
      "Số xác nhận",
      "Độ dài tiêu đề / 4",
      "NS,CWR,ECE,URG,ACK,PSH,RST,SYN,FIN",
      "Kích thước cửa sổ nhận",
    ],
  },
};

const LANGS = {
  en: "en",
  ko: "ko",
  ja: "ja",
  es: "es",
  zhCN: "zh-CN",
  zhTW: "zh-TW",
  fr: "fr",
  de: "de",
  pt: "pt",
  vi: "vi",
};

const esc = (s) => String(s);
const row = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
const hrow = (tool, keys, labels) =>
  `<tr>${labels.map((l, i) => `<th data-i18n="tools.${tool}.ui.${keys[i]}">${l}</th>`).join("")}</tr>`;

/** Assembles the exact table shape the English route renders. */
function portC0(d) {
  const rows = [
    ["0-1023", 0],
    ["1024-49151", 1],
    ["49152-65535", 2],
  ]
    .map(([code, i]) =>
      row([`<code>${code}</code>`, esc(d.ranges[i][0]), esc(d.ranges[i][1])]),
    )
    .join("\n            ");
  return `\n          <table>\n            ${hrow("port-reference", ["th14", "th15", "th12"], d.thRange)}\n            ${rows}\n          </table>`;
}

function portC1(d) {
  const svc = [
    ["21", "FTP"],
    ["23", "Telnet"],
    ["25", "SMTP"],
    ["53", "DNS"],
    ["445", "SMB"],
    ["3389", "RDP"],
  ];
  const rows = svc
    .map(([p, s], i) => row([`<code>${p}</code>`, s, esc(d.risks[i])]))
    .join("\n            ");
  return `\n          <table>\n            ${hrow("port-reference", ["th10", "th11", "th13"], d.thRisk)}\n            ${rows}\n          </table>`;
}

function portC2(d) {
  const items = d.practices
    .map(
      ([label, text]) =>
        `<li><strong>${esc(label)}:</strong> ${esc(text)}</li>`,
    )
    .join("\n            ");
  return `\n          <ul>\n            ${items}\n          </ul>`;
}

function protoTable(d, fields, descs) {
  const rows = fields
    .map(([name, n, unit], i) =>
      row([
        name,
        (unit === "b" ? d.bits : d.bytes).replace("{n}", String(n)),
        esc(descs[i]),
      ]),
    )
    .join("\n            ");
  return `\n          <table>\n            ${hrow("protocol-headers", ["th9", "th10", "th11"], d.thField)}\n            ${rows}\n          </table>`;
}

const ETH = [
  ["Destination MAC", 6, "B"],
  ["Source MAC", 6, "B"],
  ["EtherType", 2, "B"],
];
const IPV4 = [
  ["Version", 4, "b"],
  ["IHL", 4, "b"],
  ["TOS", 1, "B"],
  ["Total Length", 2, "B"],
  ["TTL", 1, "B"],
  ["Protocol", 1, "B"],
  ["Checksum", 2, "B"],
];
const TCP = [
  ["Source Port", 2, "B"],
  ["Dest Port", 2, "B"],
  ["Seq Number", 4, "B"],
  ["Ack Number", 4, "B"],
  ["Data Offset", 4, "b"],
  ["Flags", 9, "b"],
  ["Window", 2, "B"],
];

function protoC3(d) {
  const rows = [
    ["0x0800", "IPv4"],
    ["0x0806", "ARP"],
    ["0x86DD", "IPv6"],
    ["0x8100", "VLAN (802.1Q)"],
  ]
    .map(([v, p]) => row([`<code>${v}</code>`, p]))
    .join("\n            ");
  return `\n          <table>\n            ${hrow("protocol-headers", ["th12", "th13"], d.thEther)}\n            ${rows}\n          </table>`;
}

/** The 38 keys, per locale. */
function build(key) {
  const d = L[key];
  const category = {},
    title = {};
  for (const [type, catIdx] of RECORDS) {
    category[type] = d.cats[catIdx];
    title[type] = d.title.replace("{t}", type);
  }
  return {
    "dns-reference": { ui: { category, title } },
    "port-reference": {
      ui: { tip0: d.tip0 },
      cheatsheet: { c0: portC0(d), c1: portC1(d), c2: portC2(d) },
    },
    "protocol-headers": {
      cheatsheet: {
        c0: protoTable(d, ETH, d.eth),
        c1: protoTable(d, IPV4, d.ipv4),
        c2: protoTable(d, TCP, d.tcp),
        c3: protoC3(d),
      },
    },
  };
}

// ---------------------------------------------------------------- upsert

const j = (v, indent) =>
  JSON.stringify(v, null, 2).replace(/\n/g, "\n" + " ".repeat(indent));

function toolBlock(src, tool) {
  const re = new RegExp(
    `^    "?${tool.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"?: \\{$[\\s\\S]*?^    \\},?$`,
    "m",
  );
  const m = src.match(re);
  if (!m) throw new Error(`no catalog entry for ${tool}`);
  return m;
}

/**
 * Start of the next key at section depth. Must accept a QUOTED key: catalogs
 * hold entries such as `"spin-button": "SPIN"` alongside `button0: "Copy"`,
 * and a `\\w+`-only boundary silently runs past them.
 */
const NEXT_KEY = '\\n        (?:"[^"]+"|\\w+):';

/**
 * Returns [start, end) of a section's body inside a tool block, so an upsert
 * cannot stray outside it. This matters: `dns-reference` has BOTH `ui` and
 * `cheatsheet`, and `cheatsheet` already defines `title`. Searching the whole
 * block for `title:` matched the cheatsheet's and clobbered it.
 */
function sectionBody(block, name) {
  const open = block.match(new RegExp(`^      ${name}: \\{$`, "m"));
  if (!open) return null;
  const from = open.index + open[0].length;
  const close = block.slice(from).match(/^      \},?$/m);
  if (!close) throw new Error(`unterminated ${name} section`);
  return [from, from + close.index];
}

/** Insert or replace `key:` inside the tool's `ui` section only. */
function upsertUi(block, key, value) {
  const span = sectionBody(block, "ui");
  if (!span) throw new Error("no ui section");
  const [from, to] = span;
  const body = block.slice(from, to);
  const entry = `\n        ${key}: ${j(value, 8)},`;
  const existing = new RegExp(`\\n        ${key}: [\\s\\S]*?(?=${NEXT_KEY}|$)`);
  // Function replacement: a plain string would let `$&`/`$1` in a translated
  // value be interpreted as a capture reference.
  const nextBody = existing.test(body)
    ? body.replace(existing, () => entry)
    : entry + body;
  return block.slice(0, from) + nextBody + block.slice(to);
}

/**
 * Merges keys INTO a section, creating it only if absent. Replacing the whole
 * section is wrong: `port-reference` and `protocol-headers` already define
 * `cheatsheet.title` and `cheatsheet.h*`, and only the `c*` bodies were ever
 * missing. An earlier version overwrote the section and silently deleted them.
 */
function upsertSectionKeys(block, name, values) {
  const span = sectionBody(block, name);
  if (!span) {
    const entry = `      ${name}: ${j(values, 6)},`;
    const close = block.lastIndexOf("\n    },");
    return block.slice(0, close) + "\n" + entry + block.slice(close);
  }
  let [from, to] = span;
  let body = block.slice(from, to);
  for (const [key, value] of Object.entries(values)) {
    const entry = `\n        ${key}: ${j(value, 8)},`;
    const existing = new RegExp(
      `\\n        ${key}: [\\s\\S]*?(?=${NEXT_KEY}|$)`,
    );
    body = existing.test(body)
      ? body.replace(existing, () => entry)
      : entry + body;
  }
  return block.slice(0, from) + body + block.slice(to);
}

let touched = 0;
for (const [key, lang] of Object.entries(LANGS)) {
  const file = `src/i18n/${lang}.js`;
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  const data = build(key);

  for (const [tool, spec] of Object.entries(data)) {
    const m = toolBlock(src, tool);
    let block = m[0];
    if (spec.ui) {
      for (const [k, v] of Object.entries(spec.ui))
        block = upsertUi(block, k, v);
    }
    if (spec.cheatsheet)
      block = upsertSectionKeys(block, "cheatsheet", spec.cheatsheet);
    src = src.slice(0, m.index) + block + src.slice(m.index + m[0].length);
  }

  if (src !== before) {
    fs.writeFileSync(file, src);
    touched += 1;
    console.log(`${lang}: backfilled dns/port/protocol keys`);
  } else {
    console.log(`${lang}: no change`);
  }
}
console.log(`\n${touched}/${Object.keys(LANGS).length} locale files updated`);
