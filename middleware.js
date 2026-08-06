// Vercel Edge Middleware — лозинка-порта (статички проект, без next/server)
// Лозинката се чита од environment variable SITE_PASSWORD (НЕ е во кодот).
// Без лозинка → екран „Внесете лозинка" на сите страници.
// Враќање на nothing (undefined) = продолжи кон статичкиот фајл.

const COOKIE = 'moneta_auth';
// Лозинката важи САМО 60 секунди (серверски, без разлика на browser-от).
// Дури и ако прелистувачот го задржи cookie-то по затворање (сесија во позадина,
// VS Code preview, итн.), по 60 сек middleware-от пак бара лозинка.
// Покрај тоа script.js го брише cookie-то при секоја навигација (pagehide).
// БЕЗ HttpOnly за да може JS (pagehide) да го избрише.
const TOKEN_TTL_MS = 60 * 1000;

export default async function middleware(req) {
  const url = new URL(req.url);
  const password = process.env.SITE_PASSWORD || '';

  // Ако нема поставено лозинка на Vercel → не заштитувај (безбедносна врата)
  if (!password) return;

  const valid = btoa(password);

  // Провери: cookie мора да е `btoa(лозинка).<epoch на истекување>` и да не е истечен
  let authed = false;
  {
    const cookie = req.headers.get('cookie') || '';
    const pair = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(COOKIE + '='));
    if (pair) {
      const token = pair.slice(COOKIE.length + 1);
      const dot = token.lastIndexOf('.');
      if (dot > 0) {
        const val = token.slice(0, dot);
        const exp = Number(token.slice(dot + 1));
        if (val === valid && Number.isFinite(exp) && exp > Date.now()) {
          authed = true;
        }
      }
    }
  }

  // Веќе логиран → продолжи кон страницата
  if (authed) return;

  // Обработи го логин-формуларот (POST)
  if (req.method === 'POST' && url.pathname === '/__login') {
    let pass = '';
    try {
      const form = await req.formData();
      pass = String(form.get('password') || '');
    } catch (e) { /* ignore */ }
    const nextParam = url.searchParams.get('next') || '/';
    const nextPath = nextParam.startsWith('/') ? nextParam : '/';
    if (pass === password) {
      const token = valid + '.' + (Date.now() + TOKEN_TTL_MS);
      return new Response(null, {
        status: 303,
        headers: {
          Location: nextPath,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; SameSite=Lax`,
        },
      });
    }
    // Погрешна лозинка → повторно логин екран со грешка
    return html(loginPage(true, url.pathname + url.search));
  }

  // Не е логиран:
  //  - страници (HTML) → логин екран
  //  - асети (css/js/слики/...) → 401 (заштитени)
  const ASSET = /\.(css|js|mjs|json|txt|xml|map|png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|eot|otf)(\?.*)?$/i;
  if (req.method === 'GET' && !ASSET.test(url.pathname)) {
    return html(loginPage(false, url.pathname + url.search));
  }
  return new Response('Unauthorized', { status: 401 });
}

function html(body) {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function loginPage(error, next) {
  const nextEnc = encodeURIComponent(next || '/');
  return `<!doctype html>
<html lang="mk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>МОНЕТА — Внесете лозинка</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(1200px 600px at 50% -10%, #ffe3ec 0%, #fbf8f7 45%, #ffffff 100%);font-family:'Segoe UI',Arial,sans-serif;padding:24px}
  .box{width:100%;max-width:380px;background:#fff;border:2px solid #EC1752;border-radius:20px;padding:36px 32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.10)}
  .logo{font-size:28px;font-weight:800;letter-spacing:1px;color:#17171C}
  .logo span{color:#EC1752}
  h1{font-size:17px;margin:14px 0 6px;color:#17171C}
  p{font-size:13px;color:#8a8784;margin-bottom:18px}
  input{width:100%;padding:13px 14px;border:2px solid #e6e3e1;border-radius:12px;font-size:15px;outline:none;margin-bottom:12px}
  input:focus{border-color:#EC1752}
  button{width:100%;padding:14px;background:#EC1752;color:#fff;border:0;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}
  button:hover{background:#d41149}
  .err{color:#d41149;font-size:13px;margin-bottom:10px}
  .foot{margin-top:16px;font-size:11px;color:#b5b2b0}
</style></head>
<body>
  <form class="box" method="post" action="/__login?next=${nextEnc}">
    <div class="logo">MONETA<span>.</span></div>
    <h1>Внесете лозинка</h1>
    <p>Страницата е во изработка</p>
    ${error ? '<div class="err">Погрешна лозинка. Обидете се повторно.</div>' : ''}
    <input type="password" name="password" placeholder="Лозинка" autofocus required>
    <button type="submit">Влези</button>
    <div class="foot">© 2026 МОНЕТА</div>
  </form>
</body></html>`;
}
