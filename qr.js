/* =========================================================
   qr.js — самостоятельный генератор QR-кодов
   Режим передачи: byte (8 бит)
   Уровень коррекции: M
   Поддерживаемые версии: 1–10 (до 213 байт данных)
   Без внешних зависимостей.
   ========================================================= */
(function (global) {
    'use strict';

    /* ---------- 1. Поле Галуа GF(256), полином 0x11D ---------- */
    var EXP = new Array(512);
    var LOG = new Array(256);
    (function () {
        var x = 1;
        for (var i = 0; i < 255; i++) {
            EXP[i] = x;
            LOG[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11d;
        }
        for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
    })();

    function gmul(a, b) {
        if (a === 0 || b === 0) return 0;
        return EXP[LOG[a] + LOG[b]];
    }

    /* ---------- 2. Код Рида — Соломона ---------- */
    function rsGenerator(deg) {
        var poly = [1];
        for (var i = 0; i < deg; i++) {
            var next = new Array(poly.length + 1);
            for (var k = 0; k < next.length; k++) next[k] = 0;
            for (var j = 0; j < poly.length; j++) {
                next[j] ^= poly[j];
                next[j + 1] ^= gmul(poly[j], EXP[i]);
            }
            poly = next;
        }
        return poly;
    }

    function rsEncode(data, ecLen) {
        var gen = rsGenerator(ecLen);
        var res = [];
        for (var i = 0; i < ecLen; i++) res.push(0);
        for (var d = 0; d < data.length; d++) {
            var factor = data[d] ^ res[0];
            res.shift();
            res.push(0);
            if (factor !== 0) {
                for (var j = 0; j < ecLen; j++) res[j] ^= gmul(gen[j + 1], factor);
            }
        }
        return res;
    }

    /* ---------- 3. Таблицы спецификации ---------- */
    // ec — кодов коррекции на блок, g1/d1 — блоки 1-й группы и их размер,
    // g2/d2 — блоки 2-й группы (есть начиная с 8 версии)
    var VERSIONS = [
        null,
        { ec: 10, g1: 1, d1: 16 },
        { ec: 16, g1: 1, d1: 28 },
        { ec: 26, g1: 1, d1: 44 },
        { ec: 18, g1: 2, d1: 32 },
        { ec: 24, g1: 2, d1: 43 },
        { ec: 16, g1: 4, d1: 27 },
        { ec: 18, g1: 4, d1: 31 },
        { ec: 22, g1: 2, d1: 38, g2: 2, d2: 39 },
        { ec: 22, g1: 3, d1: 36, g2: 2, d2: 37 },
        { ec: 26, g1: 4, d1: 43, g2: 1, d2: 44 }
    ];

    // Позиции выравнивающих узоров по версиям 1–10
    var ALIGN = [
        [], [], [6, 18], [6, 22], [6, 26], [6, 30],
        [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
    ];

    function dataCodewords(version) {
        var v = VERSIONS[version];
        return v.g1 * v.d1 + (v.g2 || 0) * (v.d2 || 0);
    }

    /* ---------- 4. Кодирование полезной нагрузки ---------- */
    function utf8Bytes(str) {
        var out = [];
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c < 0x80) {
                out.push(c);
            } else if (c < 0x800) {
                out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
            } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
                var c2 = str.charCodeAt(++i);
                var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63),
                         0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
            } else {
                out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
            }
        }
        return out;
    }

    function pickVersion(byteLen) {
        for (var v = 1; v <= 10; v++) {
            var countBits = v < 10 ? 8 : 16;
            if (4 + countBits + byteLen * 8 <= dataCodewords(v) * 8) return v;
        }
        return null;
    }

    function buildCodewords(bytes, version) {
        var countBits = version < 10 ? 8 : 16;
        var cap = dataCodewords(version) * 8;
        var bits = [];

        function push(val, len) {
            for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
        }

        push(4, 4);                    // режим byte = 0100
        push(bytes.length, countBits); // длина данных
        for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

        // терминатор, выравнивание до байта и байты-заполнители
        for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
        while (bits.length % 8 !== 0) bits.push(0);

        var pads = [0xec, 0x11], pi = 0;
        while (bits.length < cap) {
            push(pads[pi % 2], 8);
            pi++;
        }

        var codewords = [];
        for (var b = 0; b < bits.length; b += 8) {
            var v = 0;
            for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
            codewords.push(v);
        }
        return codewords;
    }

    function interleave(codewords, version) {
        var info = VERSIONS[version];
        var blocks = [];
        var idx = 0;
        var i;

        for (i = 0; i < info.g1; i++) {
            blocks.push(codewords.slice(idx, idx + info.d1));
            idx += info.d1;
        }
        if (info.g2) {
            for (i = 0; i < info.g2; i++) {
                blocks.push(codewords.slice(idx, idx + info.d2));
                idx += info.d2;
            }
        }

        var ecBlocks = blocks.map(function (b) { return rsEncode(b, info.ec); });
        var out = [];
        var maxLen = Math.max(info.d1, info.d2 || 0);

        for (i = 0; i < maxLen; i++) {
            for (var b1 = 0; b1 < blocks.length; b1++) {
                if (i < blocks[b1].length) out.push(blocks[b1][i]);
            }
        }
        for (i = 0; i < info.ec; i++) {
            for (var b2 = 0; b2 < ecBlocks.length; b2++) out.push(ecBlocks[b2][i]);
        }
        return out;
    }

    /* ---------- 5. BCH для формата и версии ---------- */
    function bchDigit(data) {
        var d = 0;
        while (data !== 0) {
            d++;
            data >>>= 1;
        }
        return d;
    }

    function bchFormat(data) {                       // полином 0x537, маска 0x5412
        var d = data << 10;
        while (bchDigit(d) - bchDigit(0x537) >= 0) {
            d ^= 0x537 << (bchDigit(d) - bchDigit(0x537));
        }
        return ((data << 10) | d) ^ 0x5412;
    }

    function bchVersion(version) {                   // полином 0x1F25
        var d = version << 12;
        while (bchDigit(d) - bchDigit(0x1f25) >= 0) {
            d ^= 0x1f25 << (bchDigit(d) - bchDigit(0x1f25));
        }
        return (version << 12) | d;
    }

    /* ---------- 6. Функциональные узоры ---------- */
    function setupFinder(m, size, row, col) {
        for (var r = -1; r <= 7; r++) {
            if (row + r < 0 || row + r >= size) continue;
            for (var c = -1; c <= 7; c++) {
                if (col + c < 0 || col + c >= size) continue;
                m[row + r][col + c] =
                    (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                    (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            }
        }
    }

    function setupTiming(m, size) {
        for (var i = 8; i < size - 8; i++) {
            m[6][i] = i % 2 === 0;
            m[i][6] = i % 2 === 0;
        }
    }

    function setupAlign(m, size, version) {
        var pos = ALIGN[version];
        for (var i = 0; i < pos.length; i++) {
            for (var j = 0; j < pos.length; j++) {
                var row = pos[i], col = pos[j];
                if (m[row][col] !== null) continue;    // накладывается на искатель
                for (var r = -2; r <= 2; r++) {
                    for (var c = -2; c <= 2; c++) {
                        m[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
                    }
                }
            }
        }
    }

    // Резервирование мест под информацию о формате, версии и тёмный модуль
    function setupReserved(m, size, version) {
        var i;
        for (i = 0; i <= 8; i++) {
            if (i === 6) continue;
            m[8][i] = false;
            m[i][8] = false;
        }
        for (i = 0; i < 8; i++) m[8][size - 1 - i] = false;
        for (i = 0; i < 8; i++) m[size - 1 - i][8] = false;
        m[size - 8][8] = true;                         // тёмный модуль

        if (version >= 7) {
            for (i = 0; i < 18; i++) {
                m[Math.floor(i / 3)][size - 11 + (i % 3)] = false;
                m[size - 11 + (i % 3)][Math.floor(i / 3)] = false;
            }
        }
    }

    function setupFormat(m, size, mask) {
        var bits = bchFormat((0 << 3) | mask);         // 00 = уровень M
        var i, mod;

        for (i = 0; i < 15; i++) {                     // вертикальная копия
            mod = ((bits >> i) & 1) === 1;
            if (i < 6) m[i][8] = mod;
            else if (i < 8) m[i + 1][8] = mod;
            else m[size - 15 + i][8] = mod;
        }
        for (i = 0; i < 15; i++) {                     // горизонтальная копия
            mod = ((bits >> i) & 1) === 1;
            if (i < 8) m[8][size - i - 1] = mod;
            else if (i < 9) m[8][15 - i] = mod;
            else m[8][14 - i] = mod;
        }
        m[size - 8][8] = true;
    }

    function setupVersion(m, size, version) {
        if (version < 7) return;
        var bits = bchVersion(version);
        for (var i = 0; i < 18; i++) {
            var mod = ((bits >> i) & 1) === 1;
            m[Math.floor(i / 3)][size - 11 + (i % 3)] = mod;
            m[size - 11 + (i % 3)][Math.floor(i / 3)] = mod;
        }
    }

    /* ---------- 7. Маски ---------- */
    function maskAt(mask, row, col) {
        switch (mask) {
            case 0: return (row + col) % 2 === 0;
            case 1: return row % 2 === 0;
            case 2: return col % 3 === 0;
            case 3: return (row + col) % 3 === 0;
            case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
            case 5: return (row * col) % 2 + (row * col) % 3 === 0;
            case 6: return ((row * col) % 2 + (row * col) % 3) % 2 === 0;
            default: return ((row * col) % 3 + (row + col) % 2) % 2 === 0;
        }
    }

    function mapData(m, size, data, mask) {
        var inc = -1;
        var row = size - 1;
        var bitIndex = 7;
        var byteIndex = 0;

        for (var col = size - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            while (true) {
                for (var c = 0; c < 2; c++) {
                    if (m[row][col - c] === null) {
                        var dark = false;
                        if (byteIndex < data.length) {
                            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
                        }
                        if (maskAt(mask, row, col - c)) dark = !dark;
                        m[row][col - c] = dark;
                        bitIndex--;
                        if (bitIndex === -1) {
                            byteIndex++;
                            bitIndex = 7;
                        }
                    }
                }
                row += inc;
                if (row < 0 || row >= size) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }

    /* ---------- 8. Штрафные очки (выбор лучшей маски) ---------- */
    var PAT_A = [true, false, true, true, true, false, true, false, false, false, false];
    var PAT_B = [false, false, false, false, true, false, true, true, true, false, true];

    function matchAt(get, start, pat) {
        for (var i = 0; i < 11; i++) {
            if (get(start + i) !== pat[i]) return false;
        }
        return true;
    }

    function penalty(m, size) {
        var score = 0;
        var r, c, i;

        function lineScore(get, len) {
            var s = 0;
            var run = 1;
            for (i = 1; i < len; i++) {
                if (get(i) === get(i - 1)) run++;
                else {
                    if (run >= 5) s += 3 + (run - 5);
                    run = 1;
                }
            }
            if (run >= 5) s += 3 + (run - 5);
            for (i = 0; i <= len - 11; i++) {
                if (matchAt(get, i, PAT_A)) s += 40;
                if (matchAt(get, i, PAT_B)) s += 40;
            }
            return s;
        }

        for (r = 0; r < size; r++) {
            (function (row) {
                score += lineScore(function (i) { return m[row][i]; }, size);
            })(r);
        }
        for (c = 0; c < size; c++) {
            (function (col) {
                score += lineScore(function (i) { return m[i][col]; }, size);
            })(c);
        }

        for (r = 0; r < size - 1; r++) {
            for (c = 0; c < size - 1; c++) {
                var v = m[r][c];
                if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
            }
        }

        var dark = 0;
        for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r][c]) dark++;
        var ratio = (dark * 100) / (size * size);
        score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

        return score;
    }

    /* ---------- 9. Сборка матрицы ---------- */
    function blankMatrix(size) {
        var m = [];
        for (var r = 0; r < size; r++) {
            m.push([]);
            for (var c = 0; c < size; c++) m[r].push(null);
        }
        return m;
    }

    function baseMatrix(size, version) {
        var m = blankMatrix(size);
        setupFinder(m, size, 0, 0);
        setupFinder(m, size, 0, size - 7);
        setupFinder(m, size, size - 7, 0);
        // ВАЖНО: выравнивающие узоры ставятся ДО синхро-паттерна,
        // иначе их центры на строке/столбце 6 уже заняты и узоры пропускаются
        setupAlign(m, size, version);
        setupTiming(m, size);
        setupReserved(m, size, version);
        return m;
    }

    function build(text) {
        var bytes = utf8Bytes(String(text));
        if (bytes.length > 213) bytes = bytes.slice(0, 213);   // предел версии 10

        var version = pickVersion(bytes.length);
        if (!version) throw new Error('Слишком длинные данные для QR-кода');

        var codewords = interleave(buildCodewords(bytes, version), version);
        var size = version * 4 + 17;
        var best = null;

        for (var mask = 0; mask < 8; mask++) {
            var m = baseMatrix(size, version);
            mapData(m, size, codewords, mask);
            setupFormat(m, size, mask);
            setupVersion(m, size, version);
            var p = penalty(m, size);
            if (!best || p < best.penalty) best = { mask: mask, penalty: p, modules: m };
        }

        return {
            version: version,
            mask: best.mask,
            size: size,
            codewords: codewords,
            modules: best.modules
        };
    }

    /* ---------- 10. Отрисовка на canvas ---------- */
    function draw(canvas, text, options) {
        var opts = options || {};
        var quiet = opts.quiet === undefined ? 4 : opts.quiet;
        var dark = opts.dark || '#000000';
        var light = opts.light || '#ffffff';
        var qr = build(text);
        var total = qr.size + quiet * 2;
        var cssWidth = canvas.clientWidth || canvas.width || 260;
        var scale = Math.max(1, Math.floor(cssWidth / total));
        var px = scale * total;

        canvas.width = px;
        canvas.height = px;

        var ctx = canvas.getContext('2d');
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, px, px);
        ctx.fillStyle = dark;

        for (var r = 0; r < qr.size; r++) {
            for (var c = 0; c < qr.size; c++) {
                if (qr.modules[r][c]) {
                    ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
                }
            }
        }
        return qr;
    }

    global.QR = { build: build, draw: draw };
})(typeof window !== 'undefined' ? window : this);
