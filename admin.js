/* =========================================================
   admin.js — администратор: касса, поставки, остатки, заявки
   ========================================================= */
(function () {
    'use strict';

    var $ = Staff.$;

    /* ---------- Касса за 3 дня ---------- */
    function renderCash() {
        var labels = ['Сегодня', 'Вчера', 'Позавчера'];
        var total = 0, count = 0;

        for (var i = 0; i < 3; i++) {
            var day = Cash.day(i);
            total += day.sum;
            count += day.count;
            $('cash' + i).textContent = money(day.sum);
            $('cash' + i + 'sub').textContent = day.count + ' заказов · ' + todayKey(i);
        }

        $('cashSum3').textContent = money(total);
        $('cashCount3').textContent = count;
        $('cashAvg').textContent = money(count ? Math.round(total / count) : 0);

        var dates = [todayKey(0), todayKey(1), todayKey(2)];
        var orders = Store.get('orders', []).filter(function (o) {
            return dates.indexOf(o.date) !== -1;
        });

        $('cashRows').innerHTML = orders.length ? orders.map(function (o) {
            return '<tr>' +
                '<td>' + o.date + '</td>' +
                '<td><b>' + o.time + '</b></td>' +
                '<td>' + o.id + '</td>' +
                '<td>' + Staff.badgeFor(o.type) + '</td>' +
                '<td><b>' + money(o.total) + '</b></td>' +
                '<td>' + (o.card || 'наличные') + '</td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="6" class="empty-row">Оплат за последние 3 дня нет.</td></tr>';

        // подпись в шапке
        Staff.updateHeader('admin');
    }

    /* ---------- Поставки ---------- */
    function renderDeliv() {
        var list = Deliveries.all();
        $('delivRows').innerHTML = list.length ? list.map(function (d, i) {
            return '<tr>' +
                '<td>' + d.date + '</td>' +
                '<td><b>' + d.time + '</b></td>' +
                '<td>' + d.supplier + '</td>' +
                '<td style="max-width:280px;font-size:.87rem">' + d.items + '</td>' +
                '<td>' + Staff.badgeFor(d.status) + '</td>' +
                '<td><div class="row-controls">' +
                    '<button data-act="next" data-i="' + i + '">Изменить статус</button>' +
                    '<button class="danger" data-act="del" data-i="' + i + '">✕</button>' +
                '</div></td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="6" class="empty-row">Поставок пока нет.</td></tr>';
    }

    /* ---------- Остатки (со стороны кухни) ---------- */
    function stockStatus(s) {
        var qty = Number(s.qty), min = Number(s.min);
        if (qty <= min * 0.5) return 'Критично';
        if (qty <= min) return 'Мало';
        return 'Норма';
    }

    function renderStock() {
        var list = Stock.all();
        $('adminStockRows').innerHTML = list.length ? list.map(function (s) {
            return '<tr>' +
                '<td>' + s.name + '</td>' +
                '<td><b>' + s.qty + ' ' + s.unit + '</b></td>' +
                '<td>' + s.min + ' ' + s.unit + '</td>' +
                '<td>' + Staff.badgeFor(stockStatus(s)) + '</td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="4" class="empty-row">Кухня ещё не вводила остатки.</td></tr>';
    }

    /* ---------- Заявки от кухни ---------- */
    function renderReq() {
        var list = Store.get('purchase_requests', []);
        $('reqRows').innerHTML = list.length ? list.map(function (r, i) {
            var items = r.items.map(function (it) {
                return it.name + ' — ' + it.qty + ' ' + it.unit;
            }).join(', ');
            return '<tr>' +
                '<td>' + r.date + '<br><b>' + r.time + '</b></td>' +
                '<td>' + r.from + '</td>' +
                '<td style="max-width:320px;font-size:.86rem">' + items + '</td>' +
                '<td>' + Staff.badgeFor(r.status) + '</td>' +
                '<td><div class="row-controls">' +
                    (r.status !== 'Выполнена'
                        ? '<button class="primary" data-act="done" data-i="' + i + '">Выполнена</button>' +
                          '<button data-act="work" data-i="' + i + '">В работе</button>'
                        : '<button class="danger" data-act="drop" data-i="' + i + '">Удалить</button>') +
                '</div></td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="5" class="empty-row">Заявок от кухни нет.</td></tr>';
    }

    /* ---------- Посуда / моющие / салфетки ---------- */
    function supStatus(s) {
        var qty = Number(s.qty), min = Number(s.min);
        if (qty <= min * 0.5) return 'Критично';
        if (qty <= min) return 'Мало';
        return 'Норма';
    }

    function renderSupplies() {
        var list = Supplies.all();
        $('supRows').innerHTML = list.length ? list.map(function (s, i) {
            return '<tr>' +
                '<td><span class="badge gray">' + s.group + '</span></td>' +
                '<td>' + s.name + '</td>' +
                '<td><div class="row-controls">' +
                    '<button data-act="minus" data-i="' + i + '">−</button>' +
                    '<span style="min-width:52px;text-align:center">' + s.qty + ' ' + s.unit + '</span>' +
                    '<button data-act="plus" data-i="' + i + '">+</button>' +
                '</div></td>' +
                '<td>' + s.min + ' ' + s.unit + '</td>' +
                '<td>' + Staff.badgeFor(supStatus(s)) + '</td>' +
                '<td><button class="btn-ghost danger" data-act="del" data-i="' + i + '">✕</button></td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="6" class="empty-row">Позиций нет.</td></tr>';
    }

    function buySupplies() {
        var low = Supplies.low();
        if (!low.length) { Staff.toast('Всё в наличии — закупка не требуется'); return; }
        var reqs = Store.get('purchase_requests', []);
        reqs.unshift({
            from: 'Администратор (посуда/химия)',
            date: todayKey(0),
            time: nowTime(),
            status: 'Отправлена',
            items: low.map(function (s) {
                var need = Math.max(Number(s.min) * 2 - Number(s.qty), 0);
                return { name: s.group + ': ' + s.name, qty: need, unit: s.unit };
            })
        });
        Store.set('purchase_requests', reqs);
        Staff.toast('Заявка отправлена (позиций: ' + low.length + ')');
        renderReq();
    }

    /* ---------- Выгрузка отчёта в CSV (для Excel) ---------- */
    function exportCsv(silent) {
        var dates = [todayKey(0), todayKey(1), todayKey(2)];
        var orders = Store.get('orders', []).filter(function (o) {
            return dates.indexOf(o.date) !== -1;
        });

        var rows = [['Дата', 'Время', 'Номер', 'Тип', 'Статус', 'Сумма', 'Оплата', 'Адрес']];
        orders.forEach(function (o) {
            rows.push([o.date, o.time, o.id, o.type, o.status, o.total, o.card || 'наличные', o.address || '']);
        });
        rows.push([]);
        rows.push(['ИТОГО ЗА 3 ДНЯ', '', '', '', '', Cash.day(0).sum + Cash.day(1).sum + Cash.day(2).sum, '', '']);
        for (var i = 0; i < 3; i++) {
            var c = Cash.day(i);
            rows.push(['Справка', dates[i], c.count + ' заказов', '', '', c.sum, '', '']);
        }

        var csv = '\ufeff' + rows.map(function (r) {
            return r.map(function (cell) {
                var s = String(cell === null || cell === undefined ? '' : cell);
                return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            }).join(';');
        }).join('\r\n');

        if (silent) return csv;

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'nazym-kassa-' + todayKey(0) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        Staff.toast('Отчёт кассы сохранён в CSV');
    }

    /* ---------- Вкладки ---------- */
    function bindTabs() {
        document.querySelectorAll('.tabs-row .tab').forEach(function (t) {
            t.addEventListener('click', function () {
                document.querySelectorAll('.tabs-row .tab').forEach(function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); });
                $('tab-' + t.getAttribute('data-tab')).classList.remove('hidden');
            });
        });
    }

    /* ---------- События ---------- */
    function bind() {
        bindTabs();

        // выгрузка отчёта кассы
        $('cashCsvBtn').addEventListener('click', exportCsv);

        // поставки
        $('delivForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var supplier = $('dvSupplier').value.trim();
            var items = $('dvItems').value.trim();
            if (!supplier || !items) { Staff.toast('Укажите поставщика и состав'); return; }
            var list = Deliveries.all();
            list.unshift({
                supplier: supplier,
                items: items,
                date: $('dvDate').value || todayKey(0),
                time: $('dvTimeA').value || '09:00',
                status: 'Ожидает поставки'
            });
            Deliveries.save(list);
            $('delivForm').reset();
            $('dvDate').value = todayKey(0);
            Staff.toast('Поставка добавлена');
            renderDeliv();
        });

        $('delivRows').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var list = Deliveries.all();
            var i = parseInt(btn.getAttribute('data-i'), 10);
            var act = btn.getAttribute('data-act');
            if (act === 'del') {
                if (!confirm('Удалить запись о поставке?')) return;
                list.splice(i, 1);
            } else {
                var statuses = ['Ожидает поставки', 'В пути', 'Доставлено'];
                var idx = statuses.indexOf(list[i].status);
                list[i].status = statuses[(idx + 1) % statuses.length];
            }
            Deliveries.save(list);
            renderDeliv();
        });

        // заявки от кухни
        $('reqRows').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var list = Store.get('purchase_requests', []);
            var i = parseInt(btn.getAttribute('data-i'), 10);
            var act = btn.getAttribute('data-act');
            if (act === 'done') { list[i].status = 'Выполнена'; Staff.toast('Заявка закрыта'); }
            if (act === 'work') { list[i].status = 'В работе'; Staff.toast('Заявка в работе'); }
            if (act === 'drop') {
                if (!confirm('Удалить заявку?')) return;
                list.splice(i, 1);
            }
            Store.set('purchase_requests', list);
            renderReq();
        });

        // посуда / моющие / салфетки
        $('supForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var name = $('supName').value.trim();
            var qty = parseFloat($('supQty').value);
            if (!name || isNaN(qty)) { Staff.toast('Укажите наименование и остаток'); return; }
            var list = Supplies.all();
            list.push({
                name: name,
                group: $('supGroup').value,
                qty: qty,
                min: parseFloat($('supMin').value) || 0,
                unit: $('supUnit').value.trim() || 'шт'
            });
            Supplies.save(list);
            $('supForm').reset();
            Staff.toast('Позиция добавлена');
            renderSupplies();
        });

        $('supRows').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var list = Supplies.all();
            var i = parseInt(btn.getAttribute('data-i'), 10);
            var act = btn.getAttribute('data-act');
            var item = list[i];
            if (!item) return;
            if (act === 'plus') item.qty = Number(item.qty) + Math.max(Number(item.min) || 1, 1);
            if (act === 'minus') item.qty = Math.max(0, Number(item.qty) - Math.max(Number(item.min) || 1, 1));
            if (act === 'del') {
                if (!confirm('Удалить «' + item.name + '»?')) return;
                list.splice(i, 1);
            }
            Supplies.save(list);
            renderSupplies();
        });

        $('supBuyBtn').addEventListener('click', buySupplies);
    }

    /* ---------- Старт ---------- */
    Staff.auth('admin', function () {
        renderCash();
        renderDeliv();
        renderStock();
        renderReq();
        renderSupplies();
        bind();
        Staff.decorate('admin');
        Staff.startTicker('admin');
        setInterval(renderCash, 30000);
        $('dvDate').value = todayKey(0);
    });

    /* выгрузка отчёта доступна и программно */
    window.NazymExportCashCsv = exportCsv;
})();
