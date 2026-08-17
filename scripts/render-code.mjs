#!/usr/bin/env node
/**
 * Rendu d'un fichier source (ou d'une sortie de commande) en image PNG,
 * pour illustration dans un dossier technique.
 *
 * Le contenu provient toujours d'un fichier réel du dépôt : ce script met en
 * forme, il n'invente rien. Il ne produit délibérément aucune imitation
 * d'interface (GitHub, Sentry, console cloud) — une capture d'interface doit
 * venir de l'écran réel, sinon elle ne prouve rien.
 *
 * Usage :
 *   node scripts/render-code.mjs <fichier> --out <image.png>
 *   node scripts/render-code.mjs server/app.js --lines 40-95 --out extrait.png
 *   node scripts/render-code.mjs --stdin --lang console --title "npm audit" --out audit.png
 *
 * Options :
 *   --lines A-B    n'afficher que les lignes A à B (numérotation conservée)
 *   --title        texte de la barre de titre (par défaut : le chemin)
 *   --label        texte à droite (par défaut : flavienderoy/myvisuals-back)
 *   --lang         yaml | js | json | console | text  (déduit de l'extension)
 *   --width        largeur en px (défaut 1120)
 *   --out          chemin de l'image produite (obligatoire)
 *   --stdin        lire le contenu sur l'entrée standard
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename, extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ─── Arguments ────────────────────────────────────────────
const argv = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = argv.indexOf(`--${name}`);
    return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const flag = (name) => argv.includes(`--${name}`);

const useStdin = flag('stdin');
const inputPath = useStdin ? null : argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1]?.startsWith('--') === false);
const file = useStdin ? null : argv[0];
const outPath = opt('out');

if (!outPath) {
    console.error('❌ --out <image.png> est obligatoire.');
    process.exit(1);
}
if (!useStdin && !file) {
    console.error('❌ Indiquez un fichier, ou --stdin.');
    process.exit(1);
}

// ─── Contenu ──────────────────────────────────────────────
let raw = useStdin
    ? readFileSync(0, 'utf8')
    : readFileSync(resolve(file), 'utf8');

raw = raw.replace(/\s+$/, '');

let allLines = raw.split('\n');
let firstLine = 1;

const range = opt('lines');
if (range) {
    const [a, b] = range.split('-').map(Number);
    if (!a || !b || b < a) {
        console.error(`❌ Plage invalide : ${range} (attendu : 10-60)`);
        process.exit(1);
    }
    if (a > allLines.length) {
        console.error(`❌ La plage commence après la fin du fichier (${allLines.length} lignes).`);
        process.exit(1);
    }
    allLines = allLines.slice(a - 1, b);
    firstLine = a;
}

const title = opt('title', useStdin ? 'sortie de commande' : file);
const label = opt('label', 'flavienderoy/myvisuals-back');
const width = Number(opt('width', '1120'));

const ext = useStdin ? '' : extname(file);
const lang = opt('lang', {
    '.yml': 'yaml', '.yaml': 'yaml',
    '.js': 'js', '.mjs': 'js', '.cjs': 'js', '.jsx': 'js',
    '.json': 'json',
    '.sh': 'console', '.bash': 'console',
}[ext] || 'text');

// ─── Coloration ───────────────────────────────────────────
// Tokenisation en une passe : on isole d'abord commentaires et chaînes, puis
// on ne colore mots-clés et nombres que dans le reste. Une simple succession
// de `replace` corromprait le contenu d'une chaîne contenant `//` ou `#`.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const JS_KEYWORDS = new Set([
    'const','let','var','function','return','if','else','for','while','try','catch','finally',
    'throw','new','await','async','class','extends','import','export','from','default','of','in',
    'typeof','instanceof','delete','void','switch','case','break','continue','do','yield','static','get','set',
]);
const JS_LITERALS = new Set(['true','false','null','undefined','this','NaN','Infinity']);

function tokenize(line, lang) {
    if (lang === 'console') {
        if (/^\s*[$#>]\s/.test(line)) {
            const m = line.match(/^(\s*[$#>]\s)(.*)$/);
            return `<span class="prompt">${esc(m[1])}</span><span class="cmd">${esc(m[2])}</span>`;
        }
        if (/^\s*(✅|✔|OK\b)/.test(line)) return `<span class="ok">${esc(line)}</span>`;
        if (/^\s*(❌|✖|ERROR\b|error\b)/.test(line)) return `<span class="err">${esc(line)}</span>`;
        if (/^\s*(⚠|WARN)/.test(line)) return `<span class="warn">${esc(line)}</span>`;
        return `<span class="out">${esc(line)}</span>`;
    }

    if (lang === 'yaml') {
        if (/^\s*#/.test(line)) return `<span class="c">${esc(line)}</span>`;
        if (!line.trim()) return '';

        let body = line, trailing = '';
        const q = (body.match(/'/g) || []).length;
        const h = body.indexOf(' #');
        if (h > -1 && q % 2 === 0) {
            trailing = `<span class="c">${esc(body.slice(h))}</span>`;
            body = body.slice(0, h);
        }
        const m = body.match(/^(\s*)(-\s+)?(.*)$/);
        let out = esc(m[1] || '');
        if (m[2]) out += `<span class="p">${esc(m[2])}</span>`;

        const kv = (m[3] || '').match(/^([A-Za-z0-9_.\-]+)(:)([\s\S]*)$/);
        if (kv) {
            out += `<span class="k">${esc(kv[1])}</span><span class="p">:</span>`;
            out += colorValue(kv[3]);
        } else {
            out += colorValue(m[3] || '');
        }
        return out + trailing;
    }

    // js / json / text
    return tokenizeCode(line, lang);
}

function colorValue(v) {
    return esc(v)
        .replace(/(&#39;|')([^']*)('|&#39;)/g, '<span class="s">\'$2\'</span>')
        .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="s">$1</span>')
        .replace(/(?<![\w\-.])(\d+(?:\.\d+)*)(?![\w\-])/g, '<span class="n">$1</span>')
        .replace(/([[\],{}])/g, '<span class="p">$1</span>');
}

function tokenizeCode(line, lang) {
    if (!line.trim()) return '';
    let out = '';
    let i = 0;
    const n = line.length;

    while (i < n) {
        const two = line.slice(i, i + 2);

        // Commentaire de ligne
        if (two === '//' || (lang !== 'json' && line[i] === '#' && lang !== 'js')) {
            out += `<span class="c">${esc(line.slice(i))}</span>`;
            break;
        }
        // Commentaire de bloc (une ligne de bloc : * … , /* … )
        if (two === '/*' || /^\s*\*/.test(line.slice(i)) && out.trim() === '') {
            out += `<span class="c">${esc(line.slice(i))}</span>`;
            break;
        }
        // Chaîne
        if (line[i] === "'" || line[i] === '"' || line[i] === '`') {
            const quote = line[i];
            let j = i + 1;
            while (j < n && !(line[j] === quote && line[j - 1] !== '\\')) j++;
            out += `<span class="s">${esc(line.slice(i, Math.min(j + 1, n)))}</span>`;
            i = j + 1;
            continue;
        }
        // Identifiant / mot-clé
        if (/[A-Za-z_$]/.test(line[i])) {
            let j = i;
            while (j < n && /[\w$]/.test(line[j])) j++;
            const word = line.slice(i, j);
            const after = line.slice(j).match(/^\s*\(/);
            if (JS_KEYWORDS.has(word)) out += `<span class="kw">${esc(word)}</span>`;
            else if (JS_LITERALS.has(word)) out += `<span class="lit">${esc(word)}</span>`;
            else if (after) out += `<span class="fn">${esc(word)}</span>`;
            else out += esc(word);
            i = j;
            continue;
        }
        // Nombre
        if (/\d/.test(line[i]) && !/[\w]/.test(line[i - 1] || '')) {
            let j = i;
            while (j < n && /[\d._]/.test(line[j])) j++;
            out += `<span class="n">${esc(line.slice(i, j))}</span>`;
            i = j;
            continue;
        }
        // Ponctuation
        if (/[{}()[\];,.:=<>+\-*/%!?&|]/.test(line[i])) {
            out += `<span class="p">${esc(line[i])}</span>`;
            i++;
            continue;
        }
        out += esc(line[i]);
        i++;
    }
    return out;
}

// ─── Gabarit HTML ─────────────────────────────────────────
const LINE_H = 20.3;
const HEADER = 78;
const PAD = 120;
const height = Math.ceil(HEADER + PAD + allLines.length * LINE_H);

const rows = allLines
    .map((l, idx) => {
        const num = firstLine + idx;
        return `<span class="line"><span class="ln">${num}</span>${tokenize(l, lang)}</span>`;
    })
    .join('');

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
:root{--bg:#0d1117;--chrome:#161b22;--border:#30363d;--text:#e6edf3;--comment:#8b949e;
--key:#79c0ff;--string:#a5d6ff;--num:#ffa657;--punct:#c9d1d9;--kw:#ff7b72;--fn:#d2a8ff;
--lit:#79c0ff;--gutter:#6e7681;--ok:#3fb950;--err:#f85149;--warn:#d29922;--prompt:#7ee787;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1c2128;padding:40px;font-family:ui-sans-serif,-apple-system,system-ui,sans-serif;display:flex;justify-content:center}
.window{width:${width - 80}px;background:var(--bg);border:1px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55)}
.titlebar{background:var(--chrome);border-bottom:1px solid var(--border);padding:11px 16px;display:flex;align-items:center;gap:12px}
.dots{display:flex;gap:7px}.dot{width:11px;height:11px;border-radius:50%}
.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.filename{color:var(--text);font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px}
.repo{margin-left:auto;color:var(--comment);font-size:11.5px;font-family:ui-monospace,"SF Mono",Menlo,monospace}
pre{margin:0;padding:18px 0 22px;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:${LINE_H}px;color:var(--text);overflow:hidden}
.line{display:block;padding-right:20px;white-space:pre}
.ln{display:inline-block;width:46px;padding-right:16px;text-align:right;color:var(--gutter);user-select:none}
.c{color:var(--comment);font-style:italic}.k{color:var(--key)}.s{color:var(--string)}
.n{color:var(--num)}.p{color:var(--punct)}.kw{color:var(--kw)}.fn{color:var(--fn)}.lit{color:var(--lit)}
.prompt{color:var(--prompt)}.cmd{color:var(--text)}.out{color:var(--comment)}
.ok{color:var(--ok)}.err{color:var(--err)}.warn{color:var(--warn)}
</style></head><body><div class="window">
<div class="titlebar"><div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
<span class="filename">${esc(title)}</span><span class="repo">${esc(label)}</span></div>
<pre>${rows}</pre></div></body></html>`;

// ─── Rendu ────────────────────────────────────────────────
const tmp = `${tmpdir()}/render-${basename(outPath, '.png')}.html`;
writeFileSync(tmp, html);
mkdirSync(dirname(resolve(outPath)), { recursive: true });

execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    `--screenshot=${resolve(outPath)}`,
    `--window-size=${width},${height}`,
    `file://${tmp}`,
], { stdio: 'ignore' });

console.log(`✅ ${outPath}  —  ${allLines.length} lignes, ${width}×${height} px  (${lang})`);
