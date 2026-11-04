/* =========================================================
   data.js — данные меню и общее хранилище сайта «Назым»
   ========================================================= */

var CATEGORIES = [
    { id: 'all',     title: 'Все блюда' },
    { id: 'salad',   title: 'Салаты' },
    { id: 'soup',    title: 'Первое' },
    { id: 'main',    title: 'Второе' },
    { id: 'bakery',  title: 'Выпечка' },
    { id: 'dessert', title: 'Десерты' },
    { id: 'tea',     title: 'Чай и кофе' },
    { id: 'drink',   title: 'Напитки' }
];

var MENU = [
    {
        id: 'cezar', cat: 'salad', name: 'Салат Цезарь', price: 2500, weight: '250 г', kcal: 320,
        img: 'images/cezar.jpg', emoji: '🥗', hit: true,
        desc: 'Римский салат с сочным куриным филе, хрустящими сухариками и фирменным соусом.',
        ingredients: ['Римский салат', 'Куриное филе', 'Сухарики', 'Пармезан', 'Томаты черри', 'Соус цезарь']
    },
    {
        id: 'borscht', cat: 'soup', name: 'Наваристый борщ', price: 2400, weight: '350 г', kcal: 380,
        img: 'images/borscht.jpg', emoji: '🍲', hit: true,
        desc: 'Классический борщ на говядине со сметаной и свежим укропом.',
        ingredients: ['Говядина', 'Свёкла', 'Капуста', 'Картофель', 'Морковь', 'Сметана', 'Укроп']
    },
    {
        id: 'cheese-soup', cat: 'soup', name: 'Сырный суп с гренками', price: 2600, weight: '350 г', kcal: 410,
        img: 'images/cheese-soup.jpg', emoji: '🥣',
        desc: 'Нежный суп на сливочном сыре с ароматными гренками и пармезаном.',
        ingredients: ['Сливочный сыр', 'Картофель', 'Сливки', 'Бульон', 'Гренки', 'Пармезан']
    },
    {
        id: 'pumpkin-soup', cat: 'soup', name: 'Тыквенный крем-суп', price: 2300, weight: '300 г', kcal: 290,
        img: 'images/pumpkin-soup.jpg', emoji: '🎃', veg: true,
        desc: 'Пышный крем-суп из спелой тыквы с тыквенными семечками.',
        ingredients: ['Тыква', 'Сливки', 'Семечки тыквы', 'Мускатный орех', 'Оливковое масло']
    },
    {
        id: 'beshbarmak', cat: 'main', name: 'Фирменный бешбармак', price: 4500, weight: '620 г', kcal: 780,
        img: 'images/beshbarmak.jpg', emoji: '🥩', hit: true,
        desc: 'Традиционное блюдо: нежное мясо, домашнее тесто и луковый соус.',
        ingredients: ['Говядина', 'Домашнее тесто', 'Луковый соус', 'Бульон', 'Лавровый лист']
    },
    {
        id: 'mants', cat: 'main', name: 'Сочные манты', price: 2800, weight: '480 г', kcal: 560,
        img: 'images/mants.jpg', emoji: '🥟',
        desc: 'Манты ручной лепки с рубленым мясом и восточными специями.',
        ingredients: ['Тесто', 'Рубленое мясо', 'Лук', 'Специи', 'Сметана']
    },
    {
        id: 'kurdyak', cat: 'main', name: 'Куырдак', price: 3400, weight: '550 г', kcal: 640,
        img: 'images/kurdyak.jpg', emoji: '🥘',
        desc: 'Жаркое из баранины с картофелем, перцем и зелёным луком.',
        ingredients: ['Баранина', 'Картофель', 'Лук', 'Сладкий перец', 'Зелёный лук', 'Специи']
    },
    {
        id: 'steak', cat: 'main', name: 'Стейк из говядины', price: 6900, weight: '350 г', kcal: 520,
        img: 'images/steak.jpg', emoji: '🍖', hit: true,
        desc: 'Мраморная говядина на гриле с соусом и микрозеленью.',
        ingredients: ['Мраморная говядина', 'Соус на выбор', 'Микрозелень', 'Красный лук', 'Специи']
    },
    {
        id: 'bolognese', cat: 'main', name: 'Паста Болоньезе', price: 3200, weight: '400 г', kcal: 610,
        img: 'images/bolognese.jpg', emoji: '🍝',
        desc: 'Спагетти в томатном соусе с мясным фаршем и базиликом.',
        ingredients: ['Спагетти', 'Говяжий фарш', 'Томаты', 'Базилик', 'Пармезан']
    },
    {
        id: 'alfredo', cat: 'main', name: 'Паста Альфредо с курицей', price: 3400, weight: '380 г', kcal: 650,
        img: 'images/alfredo.jpg', emoji: '🍜',
        desc: 'Феттуччини в сливочном соусе с куриным филе и пармезаном.',
        ingredients: ['Феттуччини', 'Куриное филе', 'Сливки', 'Пармезан', 'Петрушка']
    },
    {
        id: 'baursak', cat: 'bakery', name: 'Баурсаки с мёдом', price: 1200, weight: '160 г', kcal: 340,
        img: '', emoji: '🫓', veg: true,
        desc: 'Тёплые домашние баурсаки с мёдом и сливочным маслом.',
        ingredients: ['Тесто', 'Мёд', 'Сливочное масло']
    },
    {
        id: 'belish', cat: 'bakery', name: 'Бэлиш с тыквой', price: 1500, weight: '200 г', kcal: 400,
        img: '', emoji: '🥧', veg: true,
        desc: 'Открытый пирог с нежной тыквой и луком.',
        ingredients: ['Тесто', 'Тыква', 'Лук', 'Специи']
    },
    {
        id: 'churek', cat: 'bakery', name: 'Чурек с орехами', price: 1100, weight: '120 г', kcal: 380,
        img: '', emoji: '🍪', veg: true,
        desc: 'Традиционный чурек с кунжутом и грецким орехом.',
        ingredients: ['Мука', 'Грецкий орех', 'Кунжут', 'Мёд']
    },
    {
        id: 'cheesecake', cat: 'dessert', name: 'Чизкейк', price: 1800, weight: '160 г', kcal: 380,
        img: 'images/cheesecake.jpg', emoji: '🍰', hit: true,
        desc: 'Классический чизкейк со сливочным кремом и ягодой.',
        ingredients: ['Сливочный сыр', 'Печенье', 'Сливки', 'Ягоды', 'Ваниль']
    },
    {
        id: 'brownie', cat: 'dessert', name: 'Брауни с мороженым', price: 1900, weight: '180 г', kcal: 450,
        img: 'images/brownie.jpg', emoji: '🍫',
        desc: 'Тёплый шоколадный брауни с шариком мороженого.',
        ingredients: ['Тёмный шоколад', 'Масло', 'Яйца', 'Мороженое', 'Мята']
    },
    {
        id: 'latte', cat: 'tea', name: 'Латте', price: 1300, weight: '250 мл', kcal: 190,
        img: 'images/latte.jpg', emoji: '☕',
        desc: 'Эспрессо с нежной молочной пенкой.',
        ingredients: ['Эспрессо', 'Молоко', 'Пенка']
    },
    {
        id: 'americano', cat: 'tea', name: 'Американо', price: 1000, weight: '200 мл', kcal: 15,
        img: 'images/americano.jpg', emoji: '☕',
        desc: 'Классический американо на свежей обжарке.',
        ingredients: ['Эспрессо', 'Горячая вода']
    },
    {
        id: 'tea-pot', cat: 'tea', name: 'Чайник ароматного чая', price: 1500, weight: '1 л', kcal: 5,
        img: '', emoji: '🍵', veg: true,
        desc: 'Чайник чая на выбор: чёрный, зелёный или облепиховый с мятой.',
        ingredients: ['Чайные листья', 'Горячая вода', 'Мёд по вкусу']
    },
    {
        id: 'cocktail', cat: 'drink', name: 'Коктейль «Назым»', price: 1800, weight: '300 мл', kcal: 160,
        img: 'images/cocktail.jpg', emoji: '🍹', hit: true,
        desc: 'Авторский ягодно-цитрусовый коктейль с мятой.',
        ingredients: ['Свежие ягоды', 'Цитрус', 'Мята', 'Лёд', 'Сироп']
    },
    {
        id: 'kompot', cat: 'drink', name: 'Домашний компот', price: 900, weight: '300 мл', kcal: 90,
        img: '', emoji: '🥤', veg: true,
        desc: 'Компот из сезонных фруктов.',
        ingredients: ['Яблоки', 'Груши', 'Сухофрукты', 'Сахар']
    }
];

var TABLES_COUNT = 12;

/* ---------- Хранилище (localStorage) ---------- */
var Store = {
    get: function (key, fallback) {
        try {
            var raw = localStorage.getItem('nazym_' + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    },
    set: function (key, value) {
        try {
            localStorage.setItem('nazym_' + key, JSON.stringify(value));
        } catch (e) { /* приватный режим — просто игнорируем */ }
    }
};

/* ---------- Утилиты ---------- */
function money(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

function dishById(id) {
    for (var i = 0; i < MENU.length; i++) if (MENU[i].id === id) return MENU[i];
    return null;
}

function todayKey(offset) {
    var d = new Date();
    if (offset) d.setDate(d.getDate() - offset);
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function orderId() {
    return 'NZ-' + (1000 + Math.floor(Math.random() * 9000));
}

/* ---------- Заказы (фиксируются со временем) ---------- */
var Orders = {
    all: function () { return Store.get('orders', []); },
    add: function (order) {
        var list = Orders.all();
        order.createdAt = new Date().toISOString();
        order.time = nowTime();
        order.date = todayKey(0);
        order.status = order.status || 'Новый';
        list.unshift(order);
        Store.set('orders', list);
        Cash.add(order.total, order.date);
        return order;
    },
    setStatus: function (id, status) {
        var list = Orders.all();
        for (var i = 0; i < list.length; i++) if (list[i].id === id) list[i].status = status;
        Store.set('orders', list);
    }
};

/* ---------- Касса ---------- */
var Cash = {
    add: function (sum, date) {
        var cash = Store.get('cash', {});
        var key = date || todayKey(0);
        if (!cash[key]) cash[key] = { sum: 0, count: 0 };
        cash[key].sum += sum;
        cash[key].count += 1;
        Store.set('cash', cash);
    },
    day: function (offset) {
        var cash = Store.get('cash', {});
        return cash[todayKey(offset)] || { sum: 0, count: 0 };
    }
};

/* ---------- Бронирования ---------- */
var Reservations = {
    all: function () { return Store.get('reservations', []); },
    add: function (item) {
        var list = Reservations.all();
        item.id = 'BR-' + (100 + list.length + 1);
        item.createdAt = new Date().toISOString();
        item.status = 'Ожидает';
        item.table = item.table || (1 + (list.length % TABLES_COUNT));
        list.unshift(item);
        Store.set('reservations', list);
        return item;
    },
    setStatus: function (id, status) {
        var list = Reservations.all();
        for (var i = 0; i < list.length; i++) if (list[i].id === id) list[i].status = status;
        Store.set('reservations', list);
    }
};

/* ---------- Столы ---------- */
var Tables = {
    all: function () {
        var saved = Store.get('tables', null);
        if (saved && saved.length === TABLES_COUNT) return saved;
        var list = [];
        for (var i = 1; i <= TABLES_COUNT; i++) {
            list.push({ n: i, status: i % 5 === 0 ? 'Занят' : (i % 4 === 0 ? 'Забронирован' : 'Свободен'), note: '' });
        }
        Store.set('tables', list);
        return list;
    },
    set: function (n, status, note) {
        var list = Tables.all();
        for (var i = 0; i < list.length; i++) {
            if (list[i].n === n) {
                list[i].status = status;
                list[i].note = note || '';
            }
        }
        Store.set('tables', list);
    }
};

/* ---------- Запасы на кухне ---------- */
var Stock = {
    seed: function () {
        return [
            { name: 'Говядина', unit: 'кг', qty: 12, min: 8 },
            { name: 'Баранина', unit: 'кг', qty: 6, min: 8 },
            { name: 'Куриное филе', unit: 'кг', qty: 10, min: 6 },
            { name: 'Картофель', unit: 'кг', qty: 25, min: 15 },
            { name: 'Свёкла', unit: 'кг', qty: 7, min: 6 },
            { name: 'Тыква', unit: 'кг', qty: 4, min: 5 },
            { name: 'Сливочный сыр', unit: 'кг', qty: 3, min: 4 },
            { name: 'Сливки', unit: 'л', qty: 5, min: 6 },
            { name: 'Пармезан', unit: 'кг', qty: 2, min: 2 },
            { name: 'Мука', unit: 'кг', qty: 20, min: 10 },
            { name: 'Яйца', unit: 'шт', qty: 120, min: 100 },
            { name: 'Чай (листья)', unit: 'кг', qty: 2.5, min: 1.5 },
            { name: 'Кофе (зерно)', unit: 'кг', qty: 4, min: 2 }
        ];
    },
    all: function () { return Store.get('stock', Stock.seed()); },
    save: function (list) { Store.set('stock', list); },
    /* что докупить: остаток ниже минимума */
    low: function () {
        return Stock.all().filter(function (s) { return Number(s.qty) <= Number(s.min); });
    }
};

/* ---------- Заявки на закупку (посуда, моющие, салфетки...) ---------- */
var Supplies = {
    seed: function () {
        return [
            { name: 'Тарелки глубокие', unit: 'шт', qty: 40, min: 60, group: 'Посуда' },
            { name: 'Стаканы', unit: 'шт', qty: 120, min: 100, group: 'Посуда' },
            { name: 'Салфетки бумажные', unit: 'уп', qty: 8, min: 15, group: 'Салфетки' },
            { name: 'Салфетки текстильные', unit: 'шт', qty: 90, min: 80, group: 'Салфетки' },
            { name: 'Средство для мытья посуды', unit: 'л', qty: 3, min: 5, group: 'Моющие средства' },
            { name: 'Средство для пола', unit: 'л', qty: 6, min: 4, group: 'Моющие средства' },
            { name: 'Полотенца кухонные', unit: 'уп', qty: 5, min: 6, group: 'Расходники' }
        ];
    },
    all: function () { return Store.get('supplies', Supplies.seed()); },
    save: function (list) { Store.set('supplies', list); },
    low: function () {
        return Supplies.all().filter(function (s) { return Number(s.qty) <= Number(s.min); });
    }
};

/* ---------- Поставки продуктов ---------- */
var Deliveries = {
    seed: function () {
        return [
            { supplier: 'Ферма «Аруана»', items: 'Говядина 15 кг, куриное филе 10 кг', date: todayKey(0), time: '08:30', status: 'Доставлено' },
            { supplier: 'Овощная база', items: 'Картофель 30 кг, свёкла 10 кг, тыква 8 кг', date: todayKey(0), time: '11:00', status: 'В пути' },
            { supplier: 'Молочный комбинат', items: 'Сливки 10 л, сливочный сыр 5 кг', date: todayKey(1), time: '09:15', status: 'Доставлено' },
            { supplier: 'Кофе и чай KZ', items: 'Кофе 5 кг, чай 3 кг', date: todayKey(2), time: '14:00', status: 'Доставлено' }
        ];
    },
    all: function () { return Store.get('deliveries', Deliveries.seed()); },
    save: function (list) { Store.set('deliveries', list); }
};
