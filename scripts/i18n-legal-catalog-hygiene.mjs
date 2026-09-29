#!/usr/bin/env node
// Keep legal disclosures aligned with the retired catalog. The English change
// removes the retired pipe page from the no-ad list; localized edits mirror it.
import fs from 'node:fs';

const file = new URL('../src/ui/legal-content.js', import.meta.url);
const before = fs.readFileSync(file, 'utf8');
const replacements = [
  ['secret scanner, encoding, and pipe pages', 'secret scanner, and encoding pages'],
  [', 인코딩, pipe 페이지', ', 인코딩 페이지'],
  ['·인코딩·pipe 페이지', '·인코딩 페이지'],
  ['エンコーディング、pipe のページ', 'エンコーディングのページ'],
  ['secret scanner, encoding y pipe', 'secret scanner y encoding'],
  ['编码和 pipe 页面', '编码页面'],
  ['編碼與 pipe 頁面', '編碼頁面'],
  ['secret scanner, encodage et pipe', 'secret scanner et encodage'],
  ['Secret-Scanner-, Encoding- und Pipe-Seiten', 'Secret-Scanner- und Encoding-Seiten'],
  ['secret scanner, encoding e pipe', 'secret scanner e encoding'],
  ['quét bí mật, encoding và pipe', 'quét bí mật và encoding'],
  // Japanese Terms still named the removed homepage unit. Privacy correctly
  // keeps the homepage in the client-script scope, so it is not changed here.
  ['ホームページのツールグリッド下、', ''],

  // Careers is informational only. Do not solicit or retain unsolicited
  // applications in any locale; point readers to existing public destinations.
  [
    '현재는 공개 채용 중인 포지션이 없습니다. 이후 기회가 생길 때 검토받고 싶다면 경력과 관심 분야를 짧게 보내 주세요.\",\n            \"이메일: business@simpletool.app',
    '현재 공개 채용 중인 역할은 없습니다. 요청하지 않은 지원서나 이력서는 접수하거나 보관하지 않습니다.\",\n            \"프로젝트 정보: https://github.com/trac3r00/simpletool · 문의: /contact',
  ],
  [
    '現在公開中の募集ポジションはありません。将来の機会に備えて検討をご希望の場合は、ご経歴と関心分野を簡単にお送りください。\",\n            \"メール: business@simpletool.app',
    '現在公開中の募集職種はありません。依頼していない応募書類や履歴書は受け付けず、保管もしません。\",\n            \"プロジェクト情報: https://github.com/trac3r00/simpletool ・お問い合わせ: /contact',
  ],
  [
    'En este momento no tenemos puestos abiertos. Si quieres que te tengamos en cuenta para futuras oportunidades, envíanos una nota breve con tu experiencia e intereses.\",\n            \"Correo: business@simpletool.app',
    'No hay vacantes abiertas. No aceptamos ni conservamos solicitudes o currículos no solicitados.\",\n            \"Información del proyecto: https://github.com/trac3r00/simpletool · Contacto: /contact',
  ],
  [
    '目前我们没有公开招募的职位。如果您希望在未来的机会中被考虑，请发送一封简短的邮件，介绍您的背景和兴趣。\",\n            \"邮箱：business@simpletool.app',
    '目前没有公开职位。我们不接收或保留未经邀请的申请或简历。\",\n            \"项目信息：https://github.com/trac3r00/simpletool；联系：/contact',
  ],
  [
    '目前我們沒有公開招募的職位。如果您希望在未來的機會中被考慮，請發送一封簡短的郵件，介紹您的背景和興趣。\",\n            \"電子郵件：business@simpletool.app',
    '目前沒有公開職位。我們不接收或保留未經邀請的申請或履歷。\",\n            \"專案資訊：https://github.com/trac3r00/simpletool；聯絡：/contact',
  ],
  [
    "Nous n'avons actuellement aucun poste ouvert. Si vous souhaitez être pris en considération pour de futures opportunités, envoyez-nous une courte note avec votre parcours et vos centres d'intérêt.\",\n            \"E-mail : business@simpletool.app",
    "Aucun poste n'est ouvert. Nous n'acceptons ni ne conservons les candidatures ou CV non sollicités.\",\n            \"Projet : https://github.com/trac3r00/simpletool · Contact : /contact",
  ],
  [
    'Wir haben derzeit keine offenen Stellen. Wenn Sie für zukünftige Möglichkeiten in Betracht gezogen werden möchten, senden Sie uns eine kurze Nachricht mit Ihrem Hintergrund und Ihren Interessen.\",\n            \"E-Mail: business@simpletool.app',
    'Es gibt keine offenen Stellen. Unaufgeforderte Bewerbungen oder Lebensläufe werden weder angenommen noch gespeichert.\",\n            \"Projekt: https://github.com/trac3r00/simpletool · Kontakt: /contact',
  ],
  [
    'No momento não temos posições abertas. Se quiser ser considerado para oportunidades futuras, envie uma breve nota com seu histórico e interesses.\",\n            \"E-mail: business@simpletool.app',
    'Não há vagas abertas. Não aceitamos nem armazenamos candidaturas ou currículos não solicitados.\",\n            \"Projeto: https://github.com/trac3r00/simpletool · Contato: /contact',
  ],
  [
    'Hiện tại chúng tôi không có vị trí tuyển dụng nào. Nếu bạn muốn được xem xét cho các cơ hội trong tương lai, hãy gửi một ghi chú ngắn giới thiệu về kinh nghiệm và sở thích của bạn.\",\n            \"Email: business@simpletool.app',
    'Không có vị trí tuyển dụng nào đang mở. Chúng tôi không tiếp nhận hoặc lưu hồ sơ ứng tuyển không được yêu cầu.\",\n            \"Dự án: https://github.com/trac3r00/simpletool · Liên hệ: /contact',
  ],
];
let after = before;
for (const [from, to] of replacements) after = after.split(from).join(to);

// About metrics are generated from the registry at module evaluation time. The
// source catalog must not carry a second volatile numeral in any locale.
after = after.replace(
  /(<div class="text-3xl font-bold[^>]*)(>)(?:45|47)(<\/div>)/g,
  '$1 data-public-tool-count$2${PRODUCTION_TOOL_COUNT}$3',
);

// Remove account-specific contact addresses and response-time promises from
// localized About cards. They are not supported by a published support SLA.
after = after
  .replace(/mailto:business@simpletool\.app/g, 'mailto:hello@simpletool.app')
  .replace(/>business@simpletool\.app</g, '>hello@simpletool.app<')
  .replace(
    /^\s*<p class="text-xs text-surface-500 mt-2">[^<]*(?:2-3|3 business|3일|3 日|3 个工作日|3 個工作日|3 jours|3 Werktage|3 dias|3 ngày)[^<]*<\/p>\n/gm,
    '',
  )
  .replace(
    /^([ \t]*)"[^"]*(?:2-3|within 3 business|3일|3 日|3 个工作日|3 個工作日|3 jours|3 Werktage|3 dias|3 ngày)[^"]*",\n/gm,
    '$1"Messages are reviewed as capacity allows; no response time is guaranteed.",\n',
  )
  .replace(
    'Unsere technische Philosophie basiert auf einem Zero-Trust-Modell: Wenn der Browser die Arbeit lokal erledigen kann, muss der Server Ihre Daten nie sehen.',
    'Wenn eine Browser-API eine Aufgabe ausführen kann, vermeidet das Tool einen zusätzlichen Upload-Endpunkt. Seiten, Assets und zugelassene Werbung bleiben Netzwerkvorgänge.',
  )
  .replace(
    'Ausgerichtet auf Zero-Trust-Betriebsmodelle',
    'Browserbasierte Verarbeitung mit dokumentierten Grenzen',
  )
  .replace(
    'Velocidad instantánea sin latencia de ida y vuelta',
    'Procesamiento en el navegador sin una carga adicional a la aplicación',
  )
  .replace(
    'Performances instantanées sans latence aller-retour',
    "Traitement dans le navigateur sans transfert supplémentaire vers l'application",
  )
  .replace(
    'Desempenho instantâneo sem latência de ida e volta',
    'Processamento no navegador sem envio adicional para a aplicação',
  )
  .replace(
    'Valoramos los comentarios de desarrolladores individuales, estudiantes y equipos enterprise.',
    'Valoramos los comentarios de desarrolladores individuales, estudiantes y equipos.',
  )
  .replace(
    'Nous valorisons les retours des développeurs individuels, des étudiants et des équipes enterprise.',
    'Nous valorisons les retours des développeurs individuels, des étudiants et des équipes.',
  )
  .replace(
    'Wir schätzen Feedback von einzelnen Entwicklern, Studierenden und Enterprise-Teams.',
    'Wir schätzen Feedback von einzelnen Entwicklern, Studierenden und Teams.',
  )
  .replace(
    'Valorizamos o feedback de desenvolvedores individuais, estudantes e equipes enterprise.',
    'Valorizamos o feedback de desenvolvedores individuais, estudantes e equipes.',
  );

if (/\bpipe\b/i.test(after)) throw new Error('Unclassified retired pipe reference remains in legal copy');
if (process.argv.includes('--check')) {
  if (after !== before) throw new Error('Legal copy requires regeneration');
} else if (after !== before) fs.writeFileSync(file, after);
console.log(after === before ? 'Legal catalog hygiene is current' : 'Legal catalog disclosures regenerated');
