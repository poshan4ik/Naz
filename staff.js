/* =========================================================
   staff.js — общая логика страниц персонала
   (вход, шапка, утилиты, таблицы)
   ========================================================= */
(function (global) {
    'use strict';

    var Staff = {};

    Staff.$ = function (id) { return document.getElementById(id); };

    /* ---------- Доступ ---------- */
    var ROLES = {
        kitchen: { title: 'Кухня — повара', role: 'Повар', passwords: ['2345', '1111'], home: 'index.html' },
        waiter:  { title: 'Зал — официанты', role: 'Официант', passwords: ['2345', '2222'], home: 'index.html' },
        admin:   { title: 'Администратор', role: 'Администратор', passwords: ['4444'], home: 'index.html' }
    };

    Staff.auth = function (roleKey, onReady) {
        var role = ROLES[roleKey];
        var login = Staff.$('login');
        var app = Staff.$('app');
        var key = 'nazym_session_' + roleKey;
        var pass = sessionStorage.getItem(key);

        function ok() {
            login.classList.add('hidden');
            app.classList.remove('hidden');
            var roleName = Staff.$('roleName');
            if (roleName) roleName.textContent = role.role;
            if (typeof onReady === 'function') onReady();
        }

        if (pass && role.passwords.indexOf(pass) !== -1) { ok(); return; }

        document.title = role.title + ' · Назым';
        Staff.$('loginTitle').textContent = role.title;
        Staff.$('loginRole').textContent = 'Вход для: ' + role.role;
        Staff.$('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var val = Staff.$('loginPass').value.trim();
            if (role.passwords.indexOf(val) !== -1) {
                sessionStorage.setItem(key, val);
                ok();
            } else {
                Staff.$('loginError').textContent = 'Неверный пароль. Попробуйте ещё раз.';
                Staff.$('loginPass').value = '';
                Staff.$('loginPass').focus();
            }
        });

        Staff.$('loginBack').addEventListener('click', function () {
            location.href = role.home;
        });
    };

    Staff.logout = function (roleKey) {
        sessionStorage.removeItem('nazym_session_' + roleKey);
        location.reload();
    };

    /* ---------- Шапка: живые показатели ---------- */
    Staff.updateHeader = function (roleKey) {
        var orders = Store.get('orders', []);
        var reservations = Store.get('reservations', []);
        var tables = Tables.all();

        var free = tables.filter(function (t) { return t.status === 'Свободен'; }).length;
        var busy = tables.filter(function (t) { return t.status === 'Занят'; }).length;
        var today = todayKey(0);

        var todayOrders = orders.filter(function (o) { return o.date === today; });
        var todayRes = reservations.filter(function (r) { return r.date === today; });

        var parts = [];
        if (roleKey === 'waiter') {
            parts.push('Столы: <b>' + free + '</b> свободно · <b>' + busy + '</b> занято');
            parts.push('Броней сегодня: <b>' + todayRes.length + '</b>');
        } else if (roleKey === 'kitchen') {
            parts.push('Низкий остаток: <b>' + Stock.low().length + '</b> позиций');
            parts.push('Заказов сегодня: <b>' + todayOrders.length + '</b>');
        } else {
            var cash = Cash.day(0);
            parts.push('Касса сегодня: <b>' + money(cash.sum) + '</b>');
            parts.push('Заказов: <b>' + todayOrders.length + '</b>');
        }
        parts.push('Сейчас: <b>' + nowTime() + '</b>');

        var box = Staff.$('staffStats');
        if (box) box.innerHTML = parts.map(function (p) {
            return '<span class="staff-stat">' + p + '</span>';
        }).join('');
    };

    /* ---------- Мелкие помощники UI ---------- */
    Staff.badgeFor = function (status) {
        var map = {
            'Свободен': 'green', 'Занят': 'red', 'Забронирован': 'gold',
            'Ожидает': 'gold', 'Подтверждена': 'blue', 'Подтверждено': 'blue',
            'Заселён': 'red', 'Отменена': 'gray',
            'Новый': 'blue', 'Готовится': 'gold', 'Готов': 'green', 'Выдан': 'gray',
            'Доставлено': 'green', 'В пути': 'gold', 'Ожидает поставки': 'gray',
            'Доставка': 'blue', 'Бронирование': 'gold',
            'Бронь подтверждена': 'green', 'Принят': 'blue',
            'Критично': 'red', 'Норма': 'green', 'Мало': 'gold',
            'Отправлена': 'gold', 'Выполнена': 'green', 'В работе': 'blue'
        };
        return '<span class="badge ' + (map[status] || 'gray') + '">' + status + '</span>';
    };

    Staff.field = function (label, html) {
        return '<label class="field"><span>' + label + '</span>' + html + '</label>';
    };

    Staff.toast = function (text) {
        var el = Staff.$('flash');
        if (!el) {
            el = document.createElement('div');
            el.id = 'flash';
            el.className = 'flash';
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(Staff._t);
        Staff._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
    };

    /* Обновление шапки раз в 30 секунд */
    Staff.startTicker = function (roleKey) {
        Staff.updateHeader(roleKey);
        setInterval(function () { Staff.updateHeader(roleKey); }, 30000);
    };

    /* Бейдж в шапке: название сайта */
    Staff.decorate = function (roleKey) {
        var out = Staff.$('logoutBtn');
        if (out) out.addEventListener('click', function () { Staff.logout(roleKey); });
    };

    global.Staff = Staff;
})(window);
