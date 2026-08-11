# 🖥 Поставување на НОВ компјутер за работа на МОНЕТА (vloski.mk)

Овој водич ве води како да го подготвите новиот компјутер за да можете
да ја уредувате страницата (код) и да ги пуштате промените на GitHub.

---

## Чекор 1 — Инсталирајте потребните програми

| Програма | Зошто | Линк / команда |
|---|---|---|
| **Git** | за повлекување/пуштање код | https://git-scm.com/download/win (Next, Next, Next...) |
| **Node.js (LTS)** | за локалниот сервер и скриптите | https://nodejs.org (инсталирај LTS) |
| **Supabase CLI** (опционално) | за деплој на функции/адреси | `npm install -g supabase` |

По инсталација, отворете **PowerShell** и проверете дали се препознаваат:
```powershell
git --version
node --version
npm --version
```

---

## Чекор 2 — Поставете го Git-от (име + е-пошта)

Во PowerShell извршете (заменете ги со вашите податоци):
```powershell
git config --global user.name "alekkochev"
git config --global user.email "вашата@епошта.mk"
```

---

## Чекор 3 — Поврзете се со GitHub (еднаш)

**Најлесен начин (препорака):** инсталирајте го GitHub CLI:
```powershell
winget install --id GitHub.cli
gh auth login
```
- Изберете **GitHub.com** → **HTTPS** → **Login with a web browser**
- Ќе се отвори прозорец → пријавете се → **Authorize**

> Алтернатива (без GitHub CLI): креирајте **Personal Access Token** на
> https://github.com/settings/tokens (scope: `repo`) и при првото push ќе ве
> праша за корисник + лозинка (токенот ја игра улогата на лозинка).

---

## Чекор 4 — Преземете го проектот (clone)

Изберете папка (на пр. `C:\Users\ваше\Documents`) па:
```powershell
cd C:\Users\ваше\Documents
git clone https://github.com/alekkochev/Moneta-v2.git
cd Moneta-v2
```

---

## Чекор 5 — Инсталирајте ги зависимостите и стартувајте локално

```powershell
npm install
npm run dev
```
- Се стартува локалниот сервер → отворете го во прелистувач
  (обично **http://localhost:3000**, видете го портот во терминалот)

---

## Чекор 6 — Поврзете го Supabase-от (опционално, само ако деплоирате функции)

```powershell
supabase login
supabase link --project-ref wkpkrnjrtpywuzemirbw
```

---

## Чекор 7 — Секојдневна работа (push на промени)

1. Направете ги промените во кодот
2. **ВАЖНО:** ако сте менувале `script.js` или `styles.css`, прво зголемете ја верзијата:
   ```powershell
   node scripts/bump-version.mjs
   ```
   (во `scripts/bump-version.mjs` на врвот сменете `NEW_VERSION` во нов датум, на пр. `20260812`)
3. Пушти ги промените:
   ```powershell
   git add -A
   git commit -m "Опис на промената"
   git push origin main
   ```
4. **Vercel автоматски ја објавува страницата** (vloski.mk) по 1–2 минути ✓

---

## Чекор 8 — Проверете дали сѐ е на место

- `git status` → да нема необјавени промени
- `https://vloski.mk` → страницата работи
- (Ако се сомневате) споредете со GitHub: https://github.com/alekkochev/Moneta-v2

---

## ➕ Како да додадете НОВ СОРАБОТНИК (contributor) на GitHub

За да може друго лице да работи на кодот (да прави промени и да ги пушта):

### Чекор 1 — Отворете ги поставките на репото
Линк (директно): **https://github.com/alekkochev/Moneta-v2/settings/access**

Или рачно: отворете https://github.com/alekkochev/Moneta-v2 →
таб **Settings (Поставки)** → лево мени **Collaborators and teams** →
копче **Add people** (или **Add teams**).

### Чекор 2 — Додајте го соработникот
1. Кликнете **Add people**
2. Внесете го **GitHub корисничкото име** (на пр. `marko123`) или **е-поштата** на соработникот
3. Изберете **пристап (permission)**:
   - **Write** ✅ *(препорака — може да клонира, уредува и push-ува, но не може да брише репо/менува поставки)*
   - Maintain / Admin — само ако сакате целосна контрола
4. Кликнете **Add ... to this repository**

### Чекор 3 — Соработникот ја прифаќа поканата
- Ќе добие **е-пошта со покана** → **View invitation** → **Accept**
- (Или сам: https://github.com/alekkochev/Moneta-v2 → „You've been invited" → Accept)

### Чекор 4 — Соработникот го презема проектот
Откако прифати, на неговиот компјутер (PowerShell):
```powershell
git clone https://github.com/alekkochev/Moneta-v2.git
cd Moneta-v2
npm install
npm run dev
```
(За првото push GitHub ќе го праша за неговата најава — ќе се најави со СВОЈА сметка.)

### Чекор 5 — Права на соработникот
- ✅ Може: clone, уредува, commit, push (промените веднаш одат на Vercel → vloski.mk)
- ❌ Не може (со Write): да брише репо, да менува Settings, да додава други соработници
- Можете подоцна да ги смените/отповикате правата: истото мени → **Remove access**

> 💡 **За приватни репоа:** соработникот мора да биде додаден (нема пристап без покана).
> **За јавни репоа:** може да направи „fork", но за да push-ува директно мора да е додаден како соработник.

---

## Често поставувани прашања

**П:** Зошто ми треба Node.js ако страницата е обичен HTML?
**О:** За локално прегледување (`npm run dev`) и за скриптите (bump-version, import-stock).

**П:** Што ако ми треба и другата папка (all4net)?
**О:** Истото, но со repo-то `alekkochev/all4net` (ако е јавно/приватно — проверете го името).

**П:** Како да видам дали Vercel ја објави промената?
**О:** https://vercel.com → вашиот проект → последниот Deployment.
