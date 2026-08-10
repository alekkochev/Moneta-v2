const fs = require('fs');
const path = require('path');
const root = 'c:/Users/alekk/OneDrive/Documents/MONETA v.2';
let n = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      const skip = ['_design-backup-20260804-082029', '_pgbackup', '_pginfo', 'node_modules', '.git', 'vendor', 'scripts', 'supabase', 'images', 'content'];
      if (skip.includes(f)) continue;
      walk(fp);
    } else if (fp.endsWith('.html')) {
      let s = fs.readFileSync(fp, 'utf8');
      if (s.includes('facebook.com/insoles.mk') && s.includes('noopener noreferrer') && !s.includes('nofollow')) {
        s = s.replace(/rel="noopener noreferrer" class="social__link social__link--facebook"/g, 'rel="noopener noreferrer nofollow" class="social__link social__link--facebook"');
        s = s.replace(/rel="noopener noreferrer" class="social__link social__link--instagram"/g, 'rel="noopener noreferrer nofollow" class="social__link social__link--instagram"');
        fs.writeFileSync(fp, s);
        n++;
      }
    }
  }
}

walk(root);
console.log('Updated', n, 'files with nofollow on social links');
