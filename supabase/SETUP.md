# Поставување: Supabase + Resend за формата „Следете ја вашата нарачка"

Формата (во `index.html` — footer) внесува **само е-пошта** и со копчето **„Испрати"** барањето се испраќа на мејлот на продавницата. Продавачот потоа **рачно** го внесува кодот за следење и му го враќа на клиентскиот мејл (заедно со линк до Карго Експрес каде клиентот го залепува кодот).

**Додека Supabase не е поставен**, формата работи преку fallback: ја отвора е-пошта програмата со готово барање (нема да се изгуби функционалност).

---

## Тестирање: користи свој мејл наместо info@calivita.mk
Додека тестираме, мејловите (и за нарачки и за следење) може да одат на **nudalsmudals@gmail.com**. По завршено тестирање → назад на `info@calivita.mk`.

- **Следење (Supabase):** `SHOP_EMAIL` secret → `nudalsmudals@gmail.com` (чекор 5)
- **Следење (mailto fallback):** `window.MONETA_SHOP_EMAIL = 'nudalsmudals@gmail.com'` во `script.js`
- **Нарачки (naracka.html):** `window.MONETA_ORDER_EMAIL = 'nudalsmudals@gmail.com'` во `script.js`

## 1. Креирај Supabase проект
1. Оди на https://supabase.com → Sign in / Sign up
2. **New project** → име: `moneta` → регион блиску до тебе (на пр. `Frankfurt (eu-central-1)`)
3. Постави силна database password (зачувај ја!)

## 2. Земи го Project URL
- Supabase Dashboard → **Settings → API**
- Копирај го **Project URL** (на пр. `https://abcd1234.supabase.co`)

## 3. Креирај Resend сметка + API клуч
1. Оди на https://resend.com → Sign up (бесплатен план: **3.000 мејлови/месец**)
2. **API Keys** → Create API Key → копирај го клучот (`re_...`)
3. **Domains** → додај го доменот `calivita.mk` и **верификувај го** (DNS записи од Resend)
   - *За тестирање без домен:* може да испраќаш од `onboarding@resend.dev` (само тест)

## 4. Поврзи го Supabase CLI (еднаш)
```powershell
supabase login
# отвори се во прелистувач и автентицирај се
```

## 5. Поврзи го проектот + постави secrets
```powershell
# во папката на проектот (каде што е supabase/)
supabase link --project-ref <project-ref>
# project-ref = делот од Project URL пред .supabase.co (на пр. abcd1234)

supabase secrets set RESEND_API_KEY=re_XXXXXXXX
supabase secrets set SENDER_EMAIL=on@calivita.mk
supabase secrets set SHOP_EMAIL=nudalsmudals@gmail.com   # за тест; подоцна info@calivita.mk
supabase secrets set ALLOWED_ORIGIN=https://moneta-v2-orpin.vercel.app
```
> `SENDER_EMAIL` мора да е од **верификуван домен** во Resend (или `onboarding@resend.dev` за тест).

## 6. Деплој ја Edge Function-та
```powershell
supabase functions deploy track-order
```

## 7. Ажурирај го URL-то во script.js
Во `script.js` (на врвот на крајниот дел):
```js
window.MONETA_SUPABASE_URL = 'https://abcd1234.supabase.co';
window.MONETA_SHOP_EMAIL = 'nudalsmudals@gmail.com'; // за тест; подоцна избриши (→ info@calivita.mk)
window.MONETA_ORDER_EMAIL = 'nudalsmudals@gmail.com'; // за тест; подоцна избриши (→ info@calivita.mk)
```
(без `/` на крајот) → комит + деплој на Vercel.

## 8. Тестирање
**Локално:**
```powershell
supabase functions serve track-order
# POST http://127.0.0.1:54321/functions/v1/track-order
# { "email": "test@primer.mk" }
```

**На production:** пополни ја формата на https://moneta-v2-orpin.vercel.app → треба да пристигне мејл (за тест: nudalsmudals@gmail.com) со „Барање за код за следење на нарачка" и линк до Карго Експрес.

---

## Како работи (технички)
- `index.html` → `#orderTrackerForm` (само е-пошта + „Испрати")
- `script.js` → `initOrderTrackerForm()` → `POST {SUPABASE_URL}/functions/v1/track-order` со `{ email }`
- `supabase/functions/track-order/index.ts` → преку **Resend API** испраќа мејл до `SHOP_EMAIL` (со клиентскиот мејл + линк до Карго)
- Долу стои копчето **„Следи ја нарачката"** → линк до Карго Експрес
- Продавачот рачно му го враќа кодот на клиентскиот мејл (со линкот до Карго)
