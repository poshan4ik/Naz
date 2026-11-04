/* =========================================================
   kitchen.js — повара: запасы продовольствия и что докупить
   ========================================================= */
(function () {
    'use strict';

    var $ = Staff.$;

    /* ---------- Запасы ---------- */
    function statusOf(s) {
        var qty = Number(s.qty), min = Number(s.min);
        if (qty <= min * 0.5) return 'Критично';
        if (qty <= min) return 'Мало';
        return 'Норма';
    }

    function renderStock() {
        var list = Stock.all();
        $('stockRows').innerHTML = list.map(function (s, i) {
            var st = statusOf(s);
            return '<tr>' +
                '<td><b>' + s.name + '</b></td>' +
                '<td>' +
                    '<div class="row-controls">' +
                        '<button data-act="minus" data-i="' + i + '">−</button>' +
                        '<span style="min-width:56px;text-align:center">' + s.qty + ' ' + s.unit + '</span>' +
                        '<button data-act="plus" data-i="' + i + '">+</button>' +
                    '</div>' +
                '</td>' +
                '<td>' + s.min + ' ' + s.unit + '</td>' +
                '<td>' + Staff.badgeFor(st) + '</td>' +
                '<td><div class="row-controls">' +
                    '<button data-act="set" data-i="' + i + '">Ввести остаток</button>' +
                    '<button class="danger" data-act="del" data-i="' + i + '">✕</button>' +
                '</div></td>' +
            '</tr>';
        }).join('') || '<tr><td colspan="5" class="empty-row">Пока нет позиций — добавьте выше.</td></tr>';

        $('kpiItems').textContent = list.length;
        $('kpiLow').textContent = Stock.low().length;
    }

    function renderBuy() {
        var low = Stock.low();

        $('buyList').innerHTML = low.length
            ? low.map(function (s) {
                return '<li><b>' + s.name + '</b> — остаток ' + s.qty + ' ' + s.unit +
                       ', минимум ' + s.min + ' ' + s.unit +
                       ' (докупить ' + (Math.round((Number(s.min) * 2 - Number(s.qty)) * 10) / 10) + ' ' + s.unit + ')</li>';
            }).join('')
            : '<li>Все позиции в норме ✅</li>';

        $('buyRows').innerHTML = low.length
            ? low.map(function (s) {
                var need = Math.max(Number(s.min) * 2 - Number(s.qty), 0);
                return '<tr>' +
                    '<td><b>' + s.name + '</b></td>' +
                    '<td>' + s.min + ' ' + s.unit + ' (минимум)</td>' +
                    '<td style="color:var(--accent)"><b>' + (Math.round(need * 10) / 10) + ' ' + s.unit + '</b></td>' +
                '</tr>';
            }).join('')
            : '<tr><td colspan="3" class="empty-row">Закупать нечего — всё в наличии ✅</td></tr>';

        var sent = Store.get('purchase_requests', []);
        $('buySent').textContent = sent.length
            ? 'Отправлено администратору заявок: ' + sent.length + ' (см. вкладку «Заявки» у администратора)'
            : 'Заявки ещё не отправлялись.';
    }

    function sendBuy() {
        var low = Stock.low();
        if (!low.length) { Staff.toast('Закупать нечего — всё в наличии'); return; }
        var reqs = Store.get('purchase_requests', []);
        reqs.unshift({
            from: 'Кухня',
            date: todayKey(0),
            time: nowTime(),
            status: 'Отправлена',
            items: low.map(function (s) {
                var need = Math.max(Number(s.min) * 2 - Number(s.qty), 0);
                return { name: s.name, qty: Math.round(need * 10) / 10, unit: s.unit };
            })
        });
        Store.set('purchase_requests', reqs);
        Staff.toast('Заявка на закупку отправлена администратору');
        renderBuy();
    }

    /* ---------- Заказы ---------- */
    function renderOrders() {
        var list = Store.get('orders', []).filter(function (o) {
            return o.type !== 'Бронирование';
        }).slice(0, 8);

        $('kpiOrders').textContent = Store.get('orders', []).filter(function (o) {
            return o.date === todayKey(0);
        }).length;

        $('orderRows').innerHTML = list.length ? list.map(function (o) {
            var steps = ['Новый', 'Готовится', 'Готов', 'Выдан'];
            var idx = steps.indexOf(o.status);
            var next = steps[idx + 1];
            var content = o.items.length
                ? o.items.map(function (i) { return i.name + ' ×' + i.qty; }).join(', ')
                : 'Бронь столика (без заказа на готовку)';
            return '<tr>' +
                '<td><b>' + o.id + '</b></td>' +
                '<td>' + o.time + '</td>' +
                '<td style="max-width:230px">' + content + '</td>' +
                '<td>' + Staff.badgeFor(o.status) + '</td>' +
                '<td>' + (next
                    ? '<button class="btn-ghost" data-next="' + o.id + '" data-status="' + next + '">' + next + '</button>'
                    : '<span style="color:var(--ink-soft);font-size:.8rem">завершён</span>') + '</td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="5" class="empty-row">Заказов пока нет.</td></tr>';
    }

    /* ---------- События ---------- */
    function bind() {
        $('stockForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var name = $('stName').value.trim();
            var qty = parseFloat($('stQty').value);
            if (!name || isNaN(qty)) { Staff.toast('Укажите наименование и остаток'); return; }
            var list = Stock.all();
            var found = null;
            list.forEach(function (s) { if (s.name.toLowerCase() === name.toLowerCase()) found = s; });
            if (found) {
                found.qty = qty;
                if ($('stUnit').value.trim()) found.unit = $('stUnit').value.trim();
                if ($('stMin').value.trim() !== '') found.min = parseFloat($('stMin').value) || found.min;
            } else {
                list.push({
                    name: name, qty: qty,
                    unit: $('stUnit').value.trim() || 'кг',
                    min: parseFloat($('stMin').value) || 0
                });
            }
            Stock.save(list);
            $('stockForm').reset();
            Staff.toast('Остаток «' + name + '» сохранён: ' + qty);
            renderStock(); renderBuy();
        });

        $('stockRows').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var i = parseInt(btn.getAttribute('data-i'), 10);
            var act = btn.getAttribute('data-act');
            var list = Stock.all();
            var item = list[i];
            if (!item) return;

            if (act === 'plus') item.qty = Math.round((Number(item.qty) + (Number(item.min) || 1)) * 10) / 10;
            if (act === 'minus') item.qty = Math.max(0, Math.round((Number(item.qty) - (Number(item.min) || 1)) * 10) / 10);
            if (act === 'del') {
                if (!confirm('Удалить позицию «' + item.name + '»?')) return;
                list.splice(i, 1);
            }
            if (act === 'set') {
                var val = prompt('Остаток «' + item.name + '» (' + item.unit + '):', item.qty);
                if (val === null) return;
                var num = parseFloat(val);
                if (isNaN(num) || num < 0) { Staff.toast('Некорректный остаток'); return; }
                item.qty = num;
            }
            Stock.save(list);
            renderStock(); renderBuy();
        });

        $('orderRows').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-next]');
            if (!btn) return;
            Orders.setStatus(btn.getAttribute('data-next'), btn.getAttribute('data-status'));
            Staff.toast('Заказ ' + btn.getAttribute('data-next') + ' → ' + btn.getAttribute('data-status'));
            renderOrders();
        });

        $('sendBuyBtn').addEventListener('click', sendBuy);
    }

    /* ---------- Старт ---------- */
    Staff.auth('kitchen', function () {
        renderStock();
        renderBuy();
        renderOrders();
        bind();
        Staff.decorate('kitchen');
        Staff.startTicker('kitchen');
    });
})();
