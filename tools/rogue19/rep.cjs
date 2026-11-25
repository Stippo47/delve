// tiny exact-text replacer that doesn't care about CRLF vs LF (the repo has both); throws when the text isn't there
const fs = require('fs');
const esc = (t) => t.split('').map((c) => ('.*+?^${}()|[]\\/'.includes(c) ? '\\' + c : c)).join('');
module.exports = (file) => {
  let s = fs.readFileSync(file, 'utf8'); const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const api = (a, b, all) => {
    const re = new RegExp(a.split(/\r?\n/).map(esc).join('\\r?\\n'), all ? 'g' : '');
    if (!re.test(s)) throw new Error(file + ': missing ' + a.slice(0, 80));
    s = s.replace(re, () => b.replace(/\r?\n/g, eol)); return api;
  };
  api.save = () => fs.writeFileSync(file, s); return api;
};
