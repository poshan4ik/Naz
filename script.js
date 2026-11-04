/* =========================================================
   script.js — логика главной страницы
   ========================================================= */
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };

    /* ---------------- Состояние ---------------- */
    var cart = Store.get('cart', {});          // id -> { qty }
    var activeCat = 'all';

    function saveCart() { Store.set('cart', cart); }

    function cartLines() {
        var lines = [];
        for (var id in cart) {
            var dish = dishById(id);
            if (!dish) continue;
            lines.push({ dish: dish, qty: cart[id].qty, sum: dish.price * cart[id].qty });
        }
        return lines;
    }

    function cartTotal() {
        return cartLines().reduce(function (s, l) { return s + l.sum; }, 0);
    }

    function cartPortions() {
        return cartLines().reduce(function (s, l) { return s + l.qty; }, 0);
    }

    /* ---------------- Вкладки меню ---------------- */
    function renderTabs() {
        $('menuTabs').innerHTML = CATEGORIES.map(function (c) {
            return '<button type="button" class="tab' + (c.id === activeCat ? ' active' : '') +
                   '" data-cat="' + c.id + '">' + c.title + '</button>';
        }).join('');
    }

    /* ---------------- Карточки блюд ---------------- */
    function renderProducts() {
        var html = MENU.filter(function (d) { return activeCat === 'all' || d.cat === activeCat; })
            .map(function (d) {
                var qty = cart[d.id] ? cart[d.id].qty : 1;
                var photo = d.img
                    ? '<img src="' + d.img + '" alt="' + d.name + '" loading="lazy">'
                    : '<span class="product-emoji">' + d.emoji + '</span>';

                return '' +
                '<article class="product-card reveal" data-id="' + d.id + '">' +
                    '<div class="product-media" data-open="' + d.id + '">' + photo +
                        (d.hit ? '<span class="hit-badge">Хит</span>' : '') +
                        '<span class="product-look">нажми, чтобы посмотреть состав</span>' +
                    '</div>' +
                    '<div class="product-body">' +
                        '<div class="product-top">' +
                            '<h3 data-open="' + d.id + '">' + d.name + '</h3>' +
                            '<span class="product-weight">' + d.weight + '</span>' +
                        '</div>' +
                        '<p class="product-desc">' + d.desc + '</p>' +
                        '<div class="product-meta">' +
                            '<span>' + d.kcal + ' ккал</span>' +
                            (d.veg ? '<span class="veg">🌿 вегетарианское</span>' : '') +
                        '</div>' +
                        '<div class="product-controls">' +
                            '<div class="stepper">' +
                                '<button type="button" class="step-btn" data-step="-1">−</button>' +
                                '<span class="qty" data-qty>' + qty + '</span>' +
                                '<button type="button" class="step-btn" data-step="1">+</button>' +
                            '</div>' +
                            '<div class="price-block">' +
                                '<span class="unit">' + money(d.price) + ' / порция</span>' +
                                '<strong class="line-total" data-total>Итого: ' + money(d.price * qty) + '</strong>' +
                            '</div>' +
                        '</div>' +
                        '<button type="button" class="button small wide add-btn">Добавить в корзину</button>' +
                    '</div>' +
                '</article>';
            }).join('');

        $('products').innerHTML = html || '<p class="empty-note">В этой категории пока нет блюд.</p>';
        observeReveal();
    }

    /* ---------------- Порции ---------------- */
    function cardQty(card) {
        return parseInt(card.querySelector('[data-qty]').textContent, 10) || 1;
    }

    function updateCardLine(card) {
        var id = card.getAttribute('data-id');
        var dish = dishById(id);
        var qty = cardQty(card);
        card.querySelector('[data-qty]').textContent = qty;
        card.querySelector('[data-total]').textContent = 'Итого: ' + money(dish.price * qty);
    }

    /* ---------------- Корзина ---------------- */
    function renderCart() {
        var lines = cartLines();
        var total = cartTotal();

        $('cartCount').textContent = cartPortions();
        $('cartTotal').textContent = money(total);
        $('cartPortions').textContent = cartPortions();
        $('payAmount').textContent = money(total);

        $('cartEmpty').style.display = lines.length ? 'none' : 'block';
        $('cartItems').innerHTML = lines.map(function (l) {
            return '' +
            '<div class="cart-item" data-id="' + l.dish.id + '">' +
                '<div class="cart-item-media">' +
                    (l.dish.img ? '<img src="' + l.dish.img + '" alt="">' : '<span>' + l.dish.emoji + '</span>') +
                '</div>' +
                '<div class="cart-item-info">' +
                    '<b>' + l.dish.name + '</b>' +
                    '<span>' + money(l.dish.price) + ' × ' + l.qty + ' порц.' +
                        ' = <b>' + money(l.sum) + '</b></span>' +
                    '<div class="cart-item-actions">' +
                        '<button type="button" class="mini-btn" data-minus>−</button>' +
                        '<span>' + l.qty + '</span>' +
                        '<button type="button" class="mini-btn" data-plus>+</button>' +
                        '<button type="button" class="mini-btn ghost" data-remove>удалить</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        // мини-корзина в блоке доставки
        $('miniTotal').textContent = money(total);
        $('miniCart').innerHTML = lines.length
            ? lines.map(function (l) {
                return '<div class="mini-row"><span>' + l.dish.name + ' × ' + l.qty + '</span><b>' + money(l.sum) + '</b></div>';
            }).join('')
            : '<p class="empty-note">Пока пусто — выберите блюда в меню.</p>';

        saveCart();
    }

    function addToCart(id, qty) {
        cart[id] = { qty: (cart[id] ? cart[id].qty : 0) + qty };
        renderCart();
        flash('Добавлено в корзину: ' + dishById(id).name + ' × ' + qty);
    }

    /* ---------------- Модалки ---------------- */
    function openOverlay(id) {
        $(id).classList.add('open');
        document.body.classList.add('no-scroll');
    }

    function closeOverlay(id) {
        $(id).classList.remove('open');
        if (!document.querySelector('.modal-overlay.open') && !$('cartDrawer').classList.contains('open')) {
            document.body.classList.remove('no-scroll');
        }
    }

    /* ---------------- Модалка блюда ---------------- */
    function openDish(id) {
        var d = dishById(id);
        if (!d) return;
        var qty = cart[id] ? cart[id].qty : 1;

        $('dishBody').innerHTML = '' +
        '<div class="dish-hero">' +
            (d.img ? '<img src="' + d.img + '" alt="' + d.name + '">'
                   : '<div class="dish-emoji">' + d.emoji + '</div>') +
        '</div>' +
        '<div class="dish-info">' +
            '<h2>' + d.name + '</h2>' +
            '<p class="dish-desc">' + d.desc + '</p>' +
            '<div class="dish-facts">' +
                '<div><span>Вес</span><b>' + d.weight + '</b></div>' +
                '<div><span>Калории</span><b>' + d.kcal + ' ккал</b></div>' +
                '<div><span>Цена</span><b>' + money(d.price) + '</b></div>' +
            '</div>' +
            '<h4>Состав</h4>' +
            '<ul class="ing-list">' + d.ingredients.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
            '<div class="dish-buy">' +
                '<div class="stepper">' +
                    '<button type="button" class="step-btn" id="dishMinus">−</button>' +
                    '<span class="qty" id="dishQty">' + qty + '</span>' +
                    '<button type="button" class="step-btn" id="dishPlus">+</button>' +
                '</div>' +
                '<strong id="dishTotal">Итого: ' + money(d.price * qty) + '</strong>' +
            '</div>' +
            '<button type="button" class="button big wide" id="dishAdd">Добавить в корзину</button>' +
        '</div>';

        openOverlay('dishOverlay');

        var q = qty;
        var recalc = function () {
            $('dishQty').textContent = q;
            $('dishTotal').textContent = 'Итого: ' + money(d.price * q);
        };
        $('dishMinus').onclick = function () { if (q > 1) { q--; recalc(); } };
        $('dishPlus').onclick = function () { if (q < 20) { q++; recalc(); } };
        $('dishAdd').onclick = function () {
            addToCart(d.id, q);
            closeOverlay('dishOverlay');
            openCart();
        };
    }

    /* ---------------- Корзина: открытие ---------------- */
    function openCart() {
        $('cartDrawer').classList.add('open');
        $('drawerOverlay').classList.add('open');
        document.body.classList.add('no-scroll');
    }

    function closeCart() {
        $('cartDrawer').classList.remove('open');
        $('drawerOverlay').classList.remove('open');
        if (!document.querySelector('.modal-overlay.open')) document.body.classList.remove('no-scroll');
    }

    /* ---------------- Оплата ---------------- */
    var payMode = 'delivery';   // delivery | booking
    var payData = {};

    function openPay(mode, extra) {
        payMode = mode;
        payData = extra || {};
        var total = mode === 'booking' && extra && extra.prepay ? extra.prepay : cartTotal();

        $('payTitle').textContent = mode === 'booking' ? 'Бронирование столика' : 'Доставка на дом';
        $('deliveryFields').style.display = mode === 'booking' ? 'none' : 'block';
        $('payAmount').textContent = money(total);
        $('payError').textContent = '';

        // сводка по заказу
        var lines = cartLines();
        $('orderRecap').innerHTML = lines.length
            ? lines.map(function (l) {
                return '<div class="mini-row"><span>' + l.dish.name + ' × ' + l.qty + '</span><b>' + money(l.sum) + '</b></div>';
            }).join('') + (mode === 'booking' && extra.prepay
                ? '<div class="mini-row"><span>Предоплата за бронь</span><b>' + money(extra.prepay) + '</b></div>'
                : '')
            : (mode === 'booking'
                ? '<div class="mini-row"><span>Бронь столика (без предзаказа)</span><b>0 ₸</b></div>'
                : '<p class="empty-note">Добавьте блюда, чтобы оформить доставку.</p>');

        $('payForm').classList.remove('hidden');
        $('payResult').classList.add('hidden');
        openOverlay('payOverlay');
    }

    function luhn(num) {
        var sum = 0, alt = false;
        for (var i = num.length - 1; i >= 0; i--) {
            var n = parseInt(num[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alt = !alt;
        }
        return num.length >= 13 && sum % 10 === 0;
    }

    function digits(el) { return el.value.replace(/\D/g, ''); }

    /* Срок действия: принимаем и «12/28», и просто «1228» */
    function expValue() {
        var raw = $('cardExp').value.trim();
        var d = raw.replace(/\D/g, '');
        if (/^\d{3,4}$/.test(d)) return d.slice(0, 2) + '/' + d.slice(2);
        if (/^\d{4}$/.test(d)) return d.slice(0, 2) + '/' + d.slice(2);
        return raw;
    }

    function validatePayment() {
        var number = digits($('cardNumber'));
        var exp = expValue();
        var cvv = digits($('cardCvv'));
        var holder = $('cardHolder').value.trim();

        if (number.length !== 16) return 'Введите 16 цифр номера карты.';
        if (!luhn(number)) return 'Номер карты не проходит проверку. Проверьте цифры.';
        if (!/^\d{2}\/\d{2}$/.test(exp)) return 'Срок карты в формате ММ/ГГ.';
        var mm = parseInt(exp.slice(0, 2), 10), yy = parseInt(exp.slice(3), 10);
        if (mm < 1 || mm > 12) return 'Неверный месяц срока действия.';
        var now = new Date();
        var expDate = new Date(2000 + yy, mm, 0);
        if (expDate < now) return 'Срок действия карты истёк.';
        if (cvv.length !== 3) return 'CVV/CVC — 3 цифры (поле скрыто, нажмите 👁 чтобы проверить).';
        if (holder.length < 3) return 'Укажите имя на карте.';
        if (payMode === 'delivery') {
            if ($('dvAddress').value.trim().length < 5) return 'Укажите адрес доставки.';
            if (digits($('dvPhone')).length < 10) return 'Укажите телефон для связи.';
        }
        return '';
    }

    function pay() {
        var err = validatePayment();
        $('payError').textContent = err;
        if (err) return;

        var total = payMode === 'booking' && payData.prepay ? payData.prepay : cartTotal();
        var number = digits($('cardNumber'));
        var exp = expValue();
        var id = orderId();

        // фиксируем заказ со временем
        var order = {
            id: id,
            type: payMode === 'booking' ? 'Бронирование' : 'Доставка',
            items: cartLines().map(function (l) {
                return { name: l.dish.name, qty: l.qty, sum: l.sum };
            }),
            total: total,
            card: '**** ' + number.slice(-4),
            exp: exp,
            address: payMode === 'delivery' ? $('dvAddress').value.trim() : '',
            status: payMode === 'booking' ? 'Бронь подтверждена' : 'Принят'
        };
        Orders.add(order);

        // бронирование фиксируем отдельно с временем
        if (payMode === 'booking') {
            Reservations.add({
                name: $('bkName').value.trim(),
                phone: $('bkPhone').value.trim(),
                date: $('bkDate').value,
                time: $('bkTime').value,
                guests: parseInt($('bkGuests').value, 10) || 2,
                prepaid: total,
                orderId: id
            });
        }

        // QR-код Kaspi
        var payload = 'KASPI|ORDER:' + id + '|AMOUNT:' + total + '|CUR:KZT|CARD:' +
            number.slice(-4) + '|EXP:' + exp + '|TYPE:' + (payMode === 'booking' ? 'BOOKING' : 'DELIVERY') +
            '|DATE:' + todayKey(0) + '|TIME:' + nowTime() +
            (order.address ? '|ADDR:' + order.address.replace(/\s+/g, '_') : '');

        try {
            QR.draw($('qrCanvas'), payload, { quiet: 4 });
        } catch (e) {
            $('qrPayload').textContent = 'Не удалось построить QR-код: ' + e.message;
        }

        $('resultInfo').innerHTML =
            'Заказ <b>' + id + '</b> зафиксирован в <b>' + nowTime() + '</b><br>' +
            'Сумма: <b>' + money(total) + '</b> · карта ' + order.card +
            (order.address ? '<br>Адрес: ' + order.address : '') +
            (payMode === 'booking'
                ? '<br>Столик: ' + $('bkDate').value + ' в ' + $('bkTime').value + ' (' + $('bkGuests').value + ' гостей)'
                : '');
        $('qrPayload').textContent = payload;

        $('payForm').classList.add('hidden');
        $('payResult').classList.remove('hidden');

        // очищаем корзину только при доставке
        if (payMode === 'delivery') {
            cart = {};
            renderCart();
        }
    }

    /* ---------------- Всплывающее уведомление ---------------- */
    var flashTimer;
    function flash(text) {
        var el = $('flash') || (function () {
            var d = document.createElement('div');
            d.id = 'flash';
            d.className = 'flash';
            document.body.appendChild(d);
            return d;
        })();
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
    }

    /* ---------------- ИИ-консультант ---------------- */
    var CHIPS = [
        'Что популярного?',
        'Сколько стоит бешбармак?',
        'Есть вегетарианское?',
        'Как забронировать столик?',
        'Как оплатить?',
        'Во сколько вы работаете?',
        'Номер поддержки',
        'Как работает доставка?'
    ];

    var KNOWLEDGE = [
        { keys: ['привет', 'здравств', 'салам', 'добрый', 'хай'], answer: 'Салам! Я Назымик — ИИ-консультант ресторана «Назым». Расскажу о меню, ценах, брони и доставке. Что интересует?' },
        { keys: ['популярн', 'хит', 'лучш', 'рекомен'], answer: 'Самое популярное: бешбармак (4 500 ₸), стейк из говядины (6 900 ₸), салат Цезарь (2 500 ₸) и чизкейк (1 800 ₸). Нажмите на блюдо в меню — покажу полный состав.' },
        { keys: ['вегетариан', 'веган', 'овощн'], answer: 'Да! Вегетарианские блюда: тыквенный крем-суп (2 300 ₸), баурсаки с мёдом (1 200 ₸), бэлиш с тыквой (1 500 ₸), чурек с орехами (1 100 ₸) и домашний компот (900 ₸).' },
        { keys: ['брон', 'столик', 'забронир'], answer: 'Бронирование — в разделе «Бронирование» наверху: имя, телефон, дата, время и число гостей. Можно внести предоплату картой — после оплаты появится QR-код подтверждения, а время брони зафиксируется. Отмена бесплатна за 2 часа.' },
        { keys: ['оплат', 'карта', 'kaspi', 'каспи', 'qr', 'кьюр'], answer: 'Мы принимаем карты Visa/Mastercard, наличные и оплату по QR-коду Kaspi. В форме оплаты вводите номер карты, срок (ММ/ГГ) и CVV — поле CVV скрыто, нажмите 👁, чтобы проверить цифры.' },
        { keys: ['доставк', 'курьер', 'привез'], answer: 'Доставка по Таразу — 40–60 минут, блюда едут в термосумке. Оформить: кнопка «🛵 Доставка на дом» в шапке. Бесплатная доставка от 15 000 ₸.' },
        { keys: ['работ', 'часы', 'график', 'во сколько', 'до сколь'], answer: 'Работаем ежедневно с 10:00 до 00:00. Кухня принимает заказы до 23:30.' },
        { keys: ['адрес', 'где', 'находит', 'карта проезда'], answer: 'Мы находимся в Таразе, Казахстан. Точный адрес уточняйте по телефону +7 (700) 000-00-00.' },
        { keys: ['поддержк', 'телефон', 'связ', 'позвон'], answer: 'Служба поддержки: +7 (700) 000-00-00 — ежедневно с 10:00 до 23:00. Также можно писать сюда в чат.' },
        { keys: ['состав', 'ингредиент', 'аллерг'], answer: 'Состав каждого блюда указан в карточке — нажмите на фото или название блюда в меню. Если есть аллергия, напишите название блюда, подскажу состав.' },
        { keys: ['ккал', 'калори', 'диет'], answer: 'Калорийность указана в карточке каждого блюда: от 15 ккал (американо) до 780 ккал (бешбармак). Средний диапазон основных блюд — 500–650 ккал.' },
        { keys: ['время', 'сколько ждать', 'приготовлен'], answer: 'В зале блюда готовятся 15–25 минут, на доставку — 40–60 минут. Время заказа фиксируется автоматически.' }
    ];

    function isMath(text) {
        var clean = text.replace(/,/g, '.').replace(/[\s=?]/g, '');
        if (!/^[-+*/().\d]+$/.test(clean)) return null;
        if (!/[-+*/]/.test(clean)) return null;
        if (!/\d/.test(clean)) return null;
        if (clean.length > 60) return null;
        try {
            /* безопасное вычисление: только цифры и арифметика */
            var result = Function('"use strict"; return (' + clean + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return null;
            return { expr: clean, result: result };
        } catch (e) {
            return null;
        }
    }

    function findDish(text) {
        var low = ' ' + text.toLowerCase() + ' ';
        var best = null, bestScore = 0;

        for (var i = 0; i < MENU.length; i++) {
            var dish = MENU[i];
            var name = dish.name.toLowerCase();
            var score = 0;

            if (low.indexOf(name) !== -1) score = name.length + 10;

            if (!score) {
                var words = name.split(/[\s«»(),\-]+/);
                for (var w = 0; w < words.length; w++) {
                    var word = words[w];
                    if (word.length < 4) continue;
                    var variants = [word, word.slice(0, -1), word.slice(0, -2)];
                    for (var v = 0; v < variants.length; v++) {
                        if (variants[v].length >= 4 && low.indexOf(variants[v]) !== -1) {
                            score = word.length;
                            break;
                        }
                    }
                    if (score) break;
                }
            }

            /* подсказки: блюда, которых нет дословно в названии */
            if (!score && dish.aliases) {
                for (var a = 0; a < dish.aliases.length; a++) {
                    if (low.indexOf(dish.aliases[a]) !== -1) { score = 6; break; }
                }
            }

            if (score > bestScore) { bestScore = score; best = dish; }
        }
        return best;
    }

    function botAnswer(text) {
        var math = isMath(text);
        if (math) {
            return math.expr + ' = <b>' +
                (Number.isInteger(math.result) ? math.result : math.result.toFixed(2)) + '</b>';
        }

        var dish = findDish(text);
        var low = text.toLowerCase();

        if (dish && /сколько|цена|стоим|стоит|дорог|дешев|почем/.test(low)) {
            return dish.name + ' — ' + money(dish.price) + ' за порцию (' + dish.weight + ', ' + dish.kcal + ' ккал).';
        }

        if (dish && /состав|ингредиент|аллерг|что внутри|ккал|калори|вес|порци/.test(low)) {
            return '<b>' + dish.name + '</b> (' + money(dish.price) + ', ' + dish.weight + ', ' + dish.kcal +
                   ' ккал). Состав: ' + dish.ingredients.join(', ') + '.';
        }

        for (var i = 0; i < KNOWLEDGE.length; i++) {
            for (var k = 0; k < KNOWLEDGE[i].keys.length; k++) {
                if (low.indexOf(KNOWLEDGE[i].keys[k]) !== -1) return KNOWLEDGE[i].answer;
            }
        }

        if (dish) {
            return dish.name + ' — ' + money(dish.price) + '. Состав: ' + dish.ingredients.join(', ') + '. Нажмите на блюдо в меню, чтобы добавить его в корзину.';
        }

        return 'Я отвечаю на вопросы о меню, ценах, составе, бронировании, доставке и оплате. Например: «Что популярного?» или «Сколько стоит бешбармак?»';
    }

    function chatAdd(text, who) {
        var body = $('chatBody');
        var msg = document.createElement('div');
        msg.className = 'chat-msg ' + who;
        msg.innerHTML = text;
        body.appendChild(msg);
        body.scrollTop = body.scrollHeight;
    }

    function botSay(text) {
        chatAdd(text, 'bot');
    }

    function initChat() {
        $('chatChips').innerHTML = CHIPS.map(function (c) {
            return '<button type="button" class="chip">' + c + '</button>';
        }).join('');

        chatAdd('Салам! Я <b>Назымик</b> — ИИ-консультант ресторана «Назым» 🍽<br>Спросите про меню, цены, состав, бронирование или доставку — отвечу сразу.', 'bot');

        $('chatForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var text = $('chatText').value.trim();
            if (!text) return;
            chatAdd(text, 'user');
            $('chatText').value = '';
            setTimeout(function () { botSay(botAnswer(text)); }, 220);
        });

        $('chatChips').addEventListener('click', function (e) {
            var chip = e.target.closest('.chip');
            if (!chip) return;
            chatAdd(chip.textContent, 'user');
            setTimeout(function () { botSay(botAnswer(chip.textContent)); }, 220);
        });
    }

    /* ---------------- Плавное появление блоков ---------------- */
    function observeReveal() {
        var items = document.querySelectorAll('.reveal:not(.in)');
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('in');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------------- Навигация ---------------- */
    function initNav() {
        $('burger').addEventListener('click', function () {
            $('nav').classList.toggle('open');
        });
        document.querySelectorAll('.nav a').forEach(function (a) {
            a.addEventListener('click', function () { $('nav').classList.remove('open'); });
        });
    }

    /* ---------------- События ---------------- */
    function initEvents() {
        // вкладки
        $('menuTabs').addEventListener('click', function (e) {
            var tab = e.target.closest('.tab');
            if (!tab) return;
            activeCat = tab.getAttribute('data-cat');
            renderTabs();
            renderProducts();
        });

        // карточки: порции, состав, добавление
        $('products').addEventListener('click', function (e) {
            var openId = e.target.closest('[data-open]');
            if (openId) { openDish(openId.getAttribute('data-open')); return; }

            var card = e.target.closest('.product-card');
            if (!card) return;

            var step = e.target.closest('.step-btn');
            if (step) {
                var qty = cardQty(card) + parseInt(step.getAttribute('data-step'), 10);
                card.querySelector('[data-qty]').textContent = Math.min(20, Math.max(1, qty));
                updateCardLine(card);
                return;
            }

            if (e.target.closest('.add-btn')) {
                addToCart(card.getAttribute('data-id'), cardQty(card));
            }
        });

        // корзина
        $('openCart').addEventListener('click', openCart);
        $('closeCart').addEventListener('click', closeCart);
        $('drawerOverlay').addEventListener('click', closeCart);

        $('cartItems').addEventListener('click', function (e) {
            var item = e.target.closest('.cart-item');
            if (!item) return;
            var id = item.getAttribute('data-id');
            if (e.target.closest('[data-plus]')) cart[id].qty++;
            if (e.target.closest('[data-minus]')) cart[id].qty--;
            if (e.target.closest('[data-remove]')) delete cart[id];
            if (cart[id] && cart[id].qty < 1) delete cart[id];
            renderCart();
        });

        $('checkoutBtn').addEventListener('click', function () {
            if (!cartPortions()) { flash('Сначала добавьте блюда в корзину'); return; }
            closeCart();
            openPay('delivery');
        });

        $('cartBookBtn').addEventListener('click', function () {
            closeCart();
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        });

        $('openDelivery').addEventListener('click', function () { openCart(); });
        $('deliveryOrder').addEventListener('click', function () { openCart(); });

        // вход для персонала
        $('openStaff').addEventListener('click', function () { openOverlay('staffOverlay'); });

        // бронирование
        $('heroBook').addEventListener('click', function () {
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        });

        $('bookingForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var name = $('bkName').value.trim();
            var phone = digits($('bkPhone'));
            var date = $('bkDate').value;
            var time = $('bkTime').value;
            if (name.length < 2) { $('bookError').textContent = 'Укажите имя.'; return; }
            if (phone.length < 10) { $('bookError').textContent = 'Укажите телефон.'; return; }
            if (!date || !time) { $('bookError').textContent = 'Укажите дату и время.'; return; }
            $('bookError').textContent = '';
            openPay('booking', { prepay: 2000 });
        });

        // оплата
        $('payBtn').addEventListener('click', pay);
        $('cvvToggle').addEventListener('click', function () {
            var cvv = $('cardCvv');
            var show = cvv.type === 'password';
            cvv.type = show ? 'text' : 'password';
            this.textContent = show ? '🙈' : '👁';
        });

        // маски ввода карты
        $('cardNumber').addEventListener('input', function () {
            var v = digits(this).slice(0, 16);
            this.value = v.replace(/(.{4})/g, '$1 ').trim();
            $('cardNumView').textContent = (v + '••••••••••••••••').slice(0, 19)
                .replace(/(.{4})/g, '$1 ').trim();
        });
        $('cardExp').addEventListener('input', function () {
            var v = digits(this).slice(0, 4);
            this.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
            $('cardExpView').textContent = this.value || 'ММ/ГГ';
        });
        $('cardCvv').addEventListener('input', function () {
            this.value = digits(this).slice(0, 3);
        });
        $('cardHolder').addEventListener('input', function () {
            $('cardHolderView').textContent = (this.value || 'ВЛАДЕЛЕЦ КАРТЫ').toUpperCase();
        });

        // закрытие модалок
        document.querySelectorAll('[data-close]').forEach(function (btn) {
            btn.addEventListener('click', function () { closeOverlay(btn.getAttribute('data-close')); });
        });
        document.querySelectorAll('.modal-overlay').forEach(function (ov) {
            ov.addEventListener('click', function (e) { if (e.target === ov) closeOverlay(ov.id); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            document.querySelectorAll('.modal-overlay.open').forEach(function (ov) { closeOverlay(ov.id); });
            closeCart();
        });

        // чат
        $('chatFab').addEventListener('click', function () {
            $('chatPanel').classList.toggle('open');
        });
        $('chatClose').addEventListener('click', function () {
            $('chatPanel').classList.remove('open');
        });
    }

    /* ---------------- Старт ---------------- */
    function init() {
        renderTabs();
        renderProducts();
        renderCart();
        initNav();
        initEvents();
        initChat();

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        $('bkDate').value = tomorrow.toISOString().slice(0, 10);
        $('bkDate').min = todayKey(0);

        var inHour = new Date(Date.now() + 60 * 60 * 1000);
        $('dvTime').value = String(inHour.getHours()).padStart(2, '0') + ':' +
                            String(inHour.getMinutes()).padStart(2, '0');

        observeReveal();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
