/**
 * Приём заявок с сайта «Новый Свет» → Google Таблица.
 * Установка — в файле google-sheets/ИНСТРУКЦИЯ.md
 */
const NOTIFY_EMAIL = ''; // можно вписать nov-svet@list.ru, тогда каждая заявка ещё и придёт письмом

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return ok_(); // скрытое поле-ловушка для ботов
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Дата', 'Имя', 'Телефон', 'Какой станок нужен', 'Страница']);
      sh.getRange(1, 1, 1, 5).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const clean = v => String(v || '').replace(/^[=+\-@]/, "'$&").slice(0, 1000); // защита от формул
    sh.appendRow([new Date(), clean(p.name), clean(p.phone), clean(p.message), clean(p.page)]);
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'Заявка с сайта: ' + clean(p.name),
        'Имя: ' + clean(p.name) + '\nТелефон: ' + clean(p.phone) + '\nСтанок: ' + clean(p.message));
    }
  } finally { lock.releaseLock(); }
  return ok_();
}

function doGet() { return ContentService.createTextOutput('Приём заявок работает'); }
function ok_() { return ContentService.createTextOutput('ok'); }
