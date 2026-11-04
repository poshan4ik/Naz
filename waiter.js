/* =========================================================
   waiter.js — официанты: схема зала, брони, заказы
   ========================================================= */
(function () {
    'use strict';

    var $ = Staff.$;

    /* ---------- Схема зала ---------- */
    function renderFloor() {
        var tables = Tables.all();
        $('floor').innerHTML = tables.map(function (t) {
            var cls = t.status === 'Свободен' ? 'free' : (t.status === 'Занят' ? 'busy' : 'booked');
            return '<div class="table-card ' + cls + '" data-n="' + t.n + '" title="Нажмите, чтобы изменить статус">' +
                '<div class="t-num">Стол ' + t.n + '</div>' +
                '<div class="t-status">' + t.status + '</div>' +
                (t.note ? '<div class="t-note">' + t.note + '</div>' : '<div class="t-note">—</div>') +
            '</div>';
        }).join('');

        $('kpiFree').textContent = tables.filter(function (t) { return t.status === 'Свободен'; }).length;
        $('kpiBusy').textContent = tables.filter(function (t) { return t.status === 'Занят'; }).length;
    }

    function cycleTable(n) {
        var tables = Tables.all();
        var current = null;
        tables.forEach(function (t) { if (t.n === n) current = t; });
        if (!current) return;

        var next = current.status === 'Свободен' ? 'Забронирован' :
                   current.status === 'Забронирован' ? 'Занят' : 'Свободен';

        var note = '';
        if (next === 'Занят') {
            var guests = prompt('Стол ' + n + ' — сколько гостей?', '4');
            if (guests === null) return;
            note = guests.trim() + ' гостей · ' + nowTime();
        } else if (next === 'Забронирован') {
            var who = prompt('Стол ' + n + ' — имя гостя и время брони:', '');
            if (who === null) return;
            note = who.trim() || 'бронь';
        }

        Tables.set(n, next, note);
        Staff.toast('Стол ' + n + ': ' + next);
        renderFloor();
    }

    /* ---------- Бронирования ---------- */
    function renderRes() {
        var list = Reservations.all();
        $('kpiRes').textContent = list.filter(function (r) { return r.date === todayKey(0); }).length;

        $('resRows').innerHTML = list.length ? list.map(function (r) {
            var actions = '';
            if (r.status === 'Ожидает') {
                actions = '<button class="btn-ghost" data-act="confirm" data-id="' + r.id + '">Подтвердить</button>';
            } else if (r.status === 'Подтверждена') {
                actions = '<button class="btn-ghost" data-act="seat" data-id="' + r.id + '">Заселить</button>';
            } else if (r.status === 'Заселён') {
                actions = '<button class="btn-ghost" data-act="free" data-id="' + r.id + '">Освободить</button>';
            }
            if (r.status !== 'Отменена' && r.status !== 'Заселён' && r.status !== 'Завершена') {
                actions += ' <button class="btn-ghost danger" data-act="cancel" data-id="' + r.id + '">Отменить</button>';
            }

            return '<tr>' +
                '<td><b>' + r.id + '</b>' + (r.prepaid ? '<br><span class="badge blue">предоплата ' + money(r.prepaid) + '</span>' : '') + '</td>' +
                '<td>' + (r.name || '—') + '<br><span style="color:var(--ink-soft);font-size:.8rem">' + (r.phone || '') + '</span></td>' +
                '<td>' + (r.date || '—') + '<br><b>' + (r.time || '—') + '</b></td>' +
                '<td>' + (r.guests || '—') + '</td>' +
                '<td>' + (r.table || '—') + '</td>' +
                '<td>' + Staff.badgeFor(r.status) + '</td>' +
                '<td><div class="row-controls">' + actions + '</div></td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="7" class="empty-row">Броней пока нет. Новые появятся здесь сразу после оплаты на сайте.</td></tr>';
    }

    function resAction(id, act) {
        var r = null;
        Reservations.all().forEach(function (x) { if (x.id === id) r = x; });
        if (!r) return;

        if (act === 'confirm') {
            Reservations.setStatus(id, 'Подтверждена');
            Tables.set(r.table, 'Забронирован', (r.name || 'гость') + ' · ' + r.time);
            Staff.toast('Бронь ' + id + ' подтверждена, стол ' + r.table + ' занят на ' + r.time);
        }
        if (act === 'seat') {
            Reservations.setStatus(id, 'Заселён');
            Tables.set(r.table, 'Занят', (r.name || 'гость') + ' · ' + (r.guests || '') + ' гостей');
            Staff.toast('Гости заселены за стол ' + r.table);
        }
        if (act === 'free') {
            Reservations.setStatus(id, 'Завершена');
            Tables.set(r.table, 'Свободен', '');
            Staff.toast('Стол ' + r.table + ' освобождён');
        }
        if (act === 'cancel') {
            if (!confirm('Отменить бронь ' + id + '?')) return;
            Reservations.setStatus(id, 'Отменена');
            Tables.set(r.table, 'Свободен', '');
            Staff.toast('Бронь ' + id + ' отменена');
        }
        renderRes(); renderFloor();
    }

    /* ---------- Заказы ---------- */
    function renderOrders() {
        var list = Store.get('orders', []).slice(0, 12);
        $('orderRows').innerHTML = list.length ? list.map(function (o) {
            var content = o.items.length
                ? o.items.map(function (i) { return i.name + ' ×' + i.qty; }).join(', ')
                : 'Бронирование · ' + (o.address || 'зал');

            var action = '';
            if (o.status === 'Готов') {
                action = '<button class="btn-ghost primary" data-next="' + o.id + '" data-status="Выдан">Выдать гостю</button>';
            } else if (o.status === 'Готовится') {
                action = '<span style="color:var(--ink-soft);font-size:.76rem">на кухне</span>';
            } else if (o.status === 'Новый') {
                action = '<span style="color:var(--ink-soft);font-size:.76rem">принят</span>';
            } else {
                action = '<span style="color:var(--ink-soft);font-size:.76rem">выдан</span>';
            }

            return '<tr>' +
                '<td><b>' + o.id + '</b><br>' + Staff.badgeFor(o.type) + '</td>' +
                '<td><b>' + o.time + '</b><br><span style="color:var(--ink-soft);font-size:.78rem">' + o.date + '</span></td>' +
                '<td style="max-width:200px;font-size:.85rem">' + content + '</td>' +
                '<td><b>' + money(o.total) + '</b><br><span style="color:var(--ink-soft);font-size:.78rem">' + (o.card || '') + '</span></td>' +
                '<td>' + Staff.badgeFor(o.status) + '</td>' +
                '<td>' + action + '</td>' +
            '</tr>';
        }).join('') : '<tr><td colspan="6" class="empty-row">Заказов пока нет.</td></tr>';
    }

    /* ---------- События ---------- */
    function bind() {
        $('floor').addEventListener('click', function (e) {
            var card = e.target.closest('.table-card');
            if (!card) return;
            cycleTable(parseInt(card.getAttribute('data-n'), 10));
        });

        $('resRows').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            resAction(btn.getAttribute('data-id'), btn.getAttribute('data-act'));
        });

        $('orderRows').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-next]');
            if (!btn) return;
            var id = btn.getAttribute('data-next');
            Orders.setStatus(id, btn.getAttribute('data-status'));
            Staff.toast('Заказ ' + id + ' выдан гостю ✅');
            renderOrders();
        });
    }

    /* ---------- Старт ---------- */
    Staff.auth('waiter', function () {
        renderFloor();
        renderRes();
        renderOrders();
        bind();
        Staff.decorate('waiter');
        Staff.startTicker('waiter');
        setInterval(renderRes, 30000);
    });
})();
