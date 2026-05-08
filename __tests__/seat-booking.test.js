/**
 * @jest-environment jsdom
 */

// 引入类定义文件
require('../script/seat-booking-classes.js');

// 因为类定义在全局，可以直接使用
const { SeatBookingApp, Service, Sector, debounce, localStorageSpace, translations, applyLanguage, initializeApp, renderBookedSeats, clearReservedUI } = window;

// 辅助：创建简单的 DOM 结构
function setupBasicDOM() {
  document.body.innerHTML = `
    <div id="seat-booking-app">
      <div id="screening-room-1">
        <div id="screen">Screen</div>
        <div id="seats"></div>
      </div>
      <div id="settings">
        <select id="services-list"></select>
        <input id="service-name" />
        <input id="service-price" />
        <button id="service-add-btn">Add</button>
        <button id="service-update-btn">Update</button>
        <button id="service-delete-btn">Delete</button>
        <div class="sectors">
          <ul id="sectors-list"></ul>
        </div>
        <div id="order">
          <div id="order-details"></div>
          <div id="order-total-price"></div>
          <button id="book-seats-btn">Buy</button>
        </div>
      </div>
      <div id="app-blocker" style="display:none;"></div>
    </div>
  `;
}

function setupLanguageDOM() {
  document.body.innerHTML += `
    <span id="language-label"></span>
    <span id="services-list-label"></span>
    <span id="movie-title-label"></span>
    <span id="price-base-label"></span>
    <span id="service-add-btn">Add</span>
    <span id="service-update-btn">Save</span>
    <span id="service-delete-btn">Delete</span>
    <span id="sectors-price-btn">Edit</span>
    <span id="sector-multipliers-label">Multipliers</span>
    <span id="sectors-save-btn">Save</span>
    <span id="tickets-label">Tickets</span>
    <span id="book-seats-btn">Buy</span>
    <div id="screen">Screen</div>
    <select id="language-select"><option value="en">EN</option><option value="zh">ZH</option></select>
  `;
}

// 在每个测试前重置 localStorage
beforeEach(() => {
  localStorage.clear();
});

/* ==================== 测试 Sector 类 ==================== */
describe('Sector', () => {
  test('constructor sets id, priceMultiplier, and generates seats', () => {
    const s = new Sector('A1', 1.5, 3, 2);
    expect(s.getId()).toBe('s-A1');
    expect(s.getPriceMultiplier()).toBe(1.5);
    // 3 seats in row 1, 2 in row 2 -> total 5
    expect(s._seats.length).toBe(5);
    expect(s._seats[0].seat).toBe('s-A1-1-1');
    expect(s._seats[4].seat).toBe('s-A1-2-2');
  });

  test('setPriceMultiplier works', () => {
    const s = new Sector('X', 1, 1);
    s.setPriceMultiplier(2.5);
    expect(s.getPriceMultiplier()).toBe(2.5);
  });

  test('renderSector creates correct DOM structure', () => {
    setupBasicDOM();
    const s = new Sector('B1', 1.2, 2, 2);
    s.renderSector();
    const sectorDiv = document.getElementById('s-B1');
    expect(sectorDiv).toBeTruthy();
    expect(sectorDiv.classList.contains('sector')).toBe(true);
    expect(sectorDiv.querySelectorAll('.row').length).toBe(2);
    const seats = sectorDiv.querySelectorAll('.seat');
    expect(seats.length).toBe(4);
    expect(seats[0].id).toBe('s-B1-1-1');
    expect(seats[3].id).toBe('s-B1-2-2');
  });

  test('renderSector throws if containers missing', () => {
    document.body.innerHTML = '';
    const s = new Sector('A', 1, 1);
    expect(() => s.renderSector()).toThrow();
  });
});

/* ==================== 测试 Service 类 ==================== */
describe('Service', () => {
  beforeEach(() => {
    setupBasicDOM();
  });

  test('constructor initializes properties', () => {
    const svc = new Service('Test', '10');
    expect(svc.getName()).toBe('Test');
    expect(svc.getPrice()).toBe('10');
    expect(svc.getReservedSeats()).toEqual([]);
    expect(svc.getBookedSeats()).toEqual([]);
    expect(svc.getId()).toBeTruthy();
  });

  test('setName and setPrice work', () => {
    const svc = new Service('Old', '5');
    svc.setName('New');
    svc.setPrice('8');
    expect(svc.getName()).toBe('New');
    expect(svc.getPrice()).toBe('8');
  });

  test('addReservedSeat and removeReservedSeat', () => {
    const svc = new Service('S', '10');
    const mockSeat = { id: 'seat-1' };
    svc.addReservedSeat(mockSeat);
    expect(svc.getReservedSeats().length).toBe(1);
    svc.removeReservedSeat('seat-1');
    expect(svc.getReservedSeats().length).toBe(0);
  });

  test('clearReservedSeats removes all', () => {
    const svc = new Service('S', '10');
    svc.addReservedSeat({ id: 's1' });
    svc.addReservedSeat({ id: 's2' });
    svc.clearReservedSeats();
    expect(svc.getReservedSeats()).toEqual([]);
  });

  test('setBookedSeatsArray', () => {
    const svc = new Service('S', '10');
    svc.setBookedSeatsArray(['a', 'b']);
    expect(svc.getBookedSeats()).toEqual(['a', 'b']);
  });

  test('markBookedSeats adds class to matching seats', () => {
    document.body.innerHTML = `
      <div id="seat-1" class="seat"></div>
      <div id="seat-2" class="seat"></div>
    `;
    const svc = new Service('S', '10');
    svc.setBookedSeatsArray(['seat-1']);
    svc.markBookedSeats();
    const seat1 = document.getElementById('seat-1');
    const seat2 = document.getElementById('seat-2');
    expect(seat1.classList.contains('seat--booked')).toBe(true);
    expect(seat2.classList.contains('seat--booked')).toBe(false);
  });

  test('bookSeats transfers reserved to booked and calls markBookedSeats', () => {
    // 创建一个带有预定座位的DOM
    document.body.innerHTML = `
      <div id="seat-10" class="seat seat--reserved"></div>
    `;
    const svc = new Service('Test', '10');
    const seatEl = document.getElementById('seat-10');
    svc.addReservedSeat(seatEl);
    svc.bookSeats();
    expect(svc.getReservedSeats()).toEqual([]);
    expect(svc.getBookedSeats()).toContain('seat-10');
    expect(seatEl.classList.contains('seat--booked')).toBe(true);
    expect(seatEl.classList.contains('seat--reserved')).toBe(false);
  });
});

/* ==================== 测试 SeatBookingApp 类 ==================== */
describe('SeatBookingApp', () => {
  let app;
  beforeEach(() => {
    setupBasicDOM();
    app = new SeatBookingApp('testApp');
  });

  test('getName and addSector', () => {
    expect(app.getName()).toBe('testApp');
    const sector = new Sector('S1', 1, 2);
    app.addSector(sector);
    expect(app.getSectorsArray().length).toBe(1);
  });

  test('setPriceMultipliersArray builds multipliers from sectors', () => {
    app.addSector(new Sector('A', 1.5, 1));
    app.addSector(new Sector('B', 2.0, 1));
    app.setPriceMultipliersArray();
    const arr = app.getPriceMultipliersArray();
    expect(arr.length).toBe(2);
    expect(arr[0]).toEqual({ sector: 's-A', priceMultiplier: 1.5 });
    expect(arr[1]).toEqual({ sector: 's-B', priceMultiplier: 2.0 });
  });

  test('renderSectorsList populates #sectors-list', () => {
    app.addSector(new Sector('X', 1.2, 1));
    app.setPriceMultipliersArray();
    app.renderSectorsList();
    const list = document.querySelector('#sectors-list');
    expect(list.children.length).toBe(1);
    const input = list.querySelector('input');
    expect(input.value).toBe('1.2');
  });

  test('addService and getServicesArray', () => {
    const svc = new Service('Movie', '12');
    app.addService(svc);
    expect(app.getServicesArray().length).toBe(1);
  });

  test('renderServicesList populates dropdown and sets currentServiceId', () => {
    const svc = new Service('Film', '8');
    app.addService(svc);
    app.renderServicesList();
    const dropdown = document.querySelector('#services-list');
    expect(dropdown.children.length).toBe(1);
    expect(dropdown.value).toBe(svc.getId());
    expect(app.getCurrentServiceId()).toBe(svc.getId());
  });

  test('getCurrentService returns correct service', () => {
    const svc = new Service('A', '5');
    app.addService(svc);
    app.renderServicesList();
    expect(app.getCurrentService().getName()).toBe('A');
  });

  test('renderCurrentServiceData fills inputs', () => {
    const svc = new Service('F', '9.99');
    app.addService(svc);
    app.renderServicesList(); // sets current
    app.renderCurrentServiceData();
    expect(document.querySelector('#service-name').value).toBe('F');
    expect(document.querySelector('#service-price').value).toBe('9.99');
  });

  test('renderCurrentServiceData clears inputs if no service', () => {
    app.renderCurrentServiceData();
    expect(document.querySelector('#service-name').value).toBe('');
    expect(document.querySelector('#service-price').value).toBe('');
  });

  test('updateBlockingLayer shows blocker when no services', () => {
    app._services = [];
    app.updateBlockingLayer();
    const blocker = document.querySelector('#app-blocker');
    expect(blocker.style.display).toBe('flex');
    const room = document.querySelector('#screening-room-1');
    expect(room.style.pointerEvents).toBe('none');
  });

  test('updateBlockingLayer hides blocker when services exist', () => {
    app.addService(new Service('M', '5'));
    app.updateBlockingLayer();
    const blocker = document.querySelector('#app-blocker');
    expect(blocker.style.display).toBe('none');
    const room = document.querySelector('#screening-room-1');
    expect(room.style.pointerEvents).toBe('auto');
  });

  test('cacheServices stores to localStorage', () => {
    const svc = new Service('M1', '10');
    app.addService(svc);
    app.cacheServices();
    const stored = localStorage.getItem('sba-services-testApp');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed.length).toBe(1);
    expect(parsed[0]._name).toBe('M1');
  });

  test('fetchServices loads services from localStorage', () => {
    const svc = new Service('Loaded', '12');
    svc.setBookedSeatsArray(['seat-1']);
    // 先手动存入
    localStorage.setItem('sba-services-testApp', JSON.stringify([svc]));
    app.fetchServices();
    expect(app.getServicesArray().length).toBe(1);
    expect(app.getServicesArray()[0].getName()).toBe('Loaded');
    expect(app.getServicesArray()[0].getBookedSeats()).toContain('seat-1');
  });

  test('fetchServices handles empty storage gracefully', () => {
    app.fetchServices();
    expect(app.getServicesArray().length).toBe(0);
    // 应该触发 blocker
    const blocker = document.querySelector('#app-blocker');
    expect(blocker.style.display).toBe('flex');
  });

  test('updateOrderDetails calculates total and renders list', () => {
    // 创建一个服务并添加预定座位（模拟座位元素）
    const svc = new Service('Movie', '10');
    app.addService(svc);
    app.renderServicesList();
    app.addSector(new Sector('VIP', 2.0, 1));
    app.setPriceMultipliersArray();

    // 创建座位元素并设置父元素链（模拟 DOM 结构）
    const sectorDiv = document.createElement('div');
    sectorDiv.id = 's-VIP';
    const rowDiv = document.createElement('div');
    const seatEl = document.createElement('div');
    seatEl.id = 's-VIP-1-1';
    seatEl.classList.add('seat');
    rowDiv.appendChild(seatEl);
    sectorDiv.appendChild(rowDiv);
    document.body.appendChild(sectorDiv);

    svc.addReservedSeat(seatEl);
    app.updateOrderDetails();

    const details = document.querySelector('#order-details');
    expect(details.children.length).toBe(1);
    expect(details.querySelector('li span:last-child').textContent).toBe('$20');
    const total = document.querySelector('#order-total-price span');
    expect(total.textContent).toContain('20');
  });
});

/* ==================== 测试工具函数 ==================== */
describe('Utility functions', () => {
  test('debounce delays execution', (done) => {
    jest.useFakeTimers();
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 100);
    debounced();
    debounced();
    expect(mockFn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
    done();
  });

  test('initializeApp returns SeatBookingApp instance', () => {
    const instance = initializeApp('test');
    expect(instance instanceof SeatBookingApp).toBe(true);
    expect(instance.getName()).toBe('test');
  });

test('renderBookedSeats updates seat classes', () => {
    document.body.innerHTML = `
      <div id="seat-a" class="seat"></div>
      <div id="seat-b" class="seat"></div>
    `;
    const app = new SeatBookingApp('x');
    const svc = new Service('S', '10');
    svc.setBookedSeatsArray(['seat-a']);
    app.addService(svc);
    app.renderServicesList();          // 确保下拉列表渲染
    // 显式确保当前服务是 svc（以防万一）
    app.setCurrentServiceId(svc.getId());
    renderBookedSeats(app);
    expect(document.getElementById('seat-a').classList.contains('seat--booked')).toBe(true);
    expect(document.getElementById('seat-b').classList.contains('seat--booked')).toBe(false);
});

test('clearReservedUI clears reserved seats and order details', () => {
    document.body.innerHTML = `
      <div id="seat-1" class="seat seat--reserved"></div>
      <div id="order-details"><li>something</li></div>
      <div id="order-total-price"><span>$10</span></div>
    `;
    const app = new SeatBookingApp('x');
    const svc = new Service('S', '10');
    svc.addReservedSeat(document.getElementById('seat-1'));
    app.addService(svc);
    app.renderServicesList();
    app.setCurrentServiceId(svc.getId());   // 显式设置
    clearReservedUI(app);
    expect(svc.getReservedSeats()).toEqual([]);
    expect(document.getElementById('seat-1').classList.contains('seat--reserved')).toBe(false);
    expect(document.getElementById('order-details').innerHTML).toBe('');
    expect(document.getElementById('order-total-price').innerHTML).toBe('');
});
});

/* ==================== 测试翻译功能 ==================== */
describe('Translations', () => {
  beforeEach(() => {
    setupLanguageDOM();
  });

  test('applyLanguage updates all elements to English', () => {
    applyLanguage('en');
    expect(document.getElementById('language-label').textContent).toBe('Language:');
    expect(document.getElementById('book-seats-btn').textContent).toBe('Buy');
    expect(document.getElementById('screen').textContent).toBe('Screen');
  });

  test('applyLanguage updates to Chinese', () => {
    applyLanguage('zh');
    expect(document.getElementById('language-label').textContent).toBe('语言：');
    expect(document.getElementById('book-seats-btn').textContent).toBe('购买');
    expect(document.getElementById('screen').textContent).toBe('屏幕');
  });

  test('applyLanguage stores selection in localStorage', () => {
    applyLanguage('zh');
    expect(localStorage.getItem('selectedLanguage')).toBe('zh');
    applyLanguage('en');
    expect(localStorage.getItem('selectedLanguage')).toBe('en');
  });
});
// ---------- 额外分支覆盖测试 ----------

describe('Branch coverage additions', () => {
  test('renderSectorsList does nothing if container missing', () => {
    // 移除 #sectors-list
    document.body.innerHTML = '<div id="seat-booking-app"></div>';
    const app = new SeatBookingApp('x');
    app.addSector(new Sector('X', 1, 1));
    app.setPriceMultipliersArray();
    // 不应抛出异常
    expect(() => app.renderSectorsList()).not.toThrow();
  });

  test('renderServicesList does nothing if container missing', () => {
    document.body.innerHTML = '<div id="seat-booking-app"></div>';
    const app = new SeatBookingApp('x');
    app.addService(new Service('A', '10'));
    expect(() => app.renderServicesList()).not.toThrow();
  });

  test('fetchServices with corrupted JSON logs error', () => {
    const app = new SeatBookingApp('test');
    localStorage.setItem('sba-services-test', '{invalid}');
    // 模拟 console.error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // 需要加载脚本重新定义 fetchServices，但直接测试内部逻辑
    // 实际 fetchServices 读取 getItem 并 JSON.parse，我们直接调用
    // 因为 fetchServices 内部读取 app._name
    expect(() => app.fetchServices()).not.toThrow();
    expect(console.error).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('updateOrderDetails with seat missing parentElement does not crash', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    const svc = new Service('Film', '10');
    app.addService(svc);
    app.renderServicesList();
    // 手动构造一个没有 parentElement 的座位
    const fakeSeat = { id: 'orphan' };
    svc.addReservedSeat(fakeSeat);
    expect(() => app.updateOrderDetails()).not.toThrow();
    const details = document.querySelector('#order-details');
    expect(details.children.length).toBe(0); // 被跳过
  });
});
// ========== 分支补充测试 ==========
describe('Edge branches for full coverage', () => {
  // 覆盖 localStorageSpace 的两个分支
  test('localStorageSpace with data', () => {
    localStorage.setItem('a', '123');
    localStorage.setItem('b', '456');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorageSpace();
    // 确保没有报错，且日志被调用
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('localStorageSpace without data', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorageSpace();
    // 应该输出 “Empty (0 KB)” 那条分支
    const emptyLog = logSpy.mock.calls.find(call => call[0] && call[0].includes('Empty'));
    expect(emptyLog).toBeTruthy();
    logSpy.mockRestore();
  });

  // 覆盖 renderServicesList 中 services.length === 0 的分支
  test('renderServicesList with empty services does not set currentServiceId', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    // 不添加任何 service
    const oldId = app.getCurrentServiceId(); // 初始为 ''
    app.renderServicesList();
    // 下拉框应该为空
    const dropdown = document.querySelector('#services-list');
    expect(dropdown.children.length).toBe(0);
    // currentServiceId 不应该被改变（依然是 '' 或旧值）
    expect(app.getCurrentServiceId()).toBe(oldId);
  });

  // 覆盖 fetchServices 中 JSON 解析成功但数组为空的分支
  test('fetchServices with empty array from storage', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    localStorage.setItem('sba-services-test', '[]');
    app.fetchServices();
    // 应该没有添加任何 service
    expect(app.getServicesArray().length).toBe(0);
    // 应该调用了 updateBlockingLayer，因此 blocker 应该显示
    const blocker = document.querySelector('#app-blocker');
    expect(blocker.style.display).toBe('flex');
  });

  // 覆盖 fetchServices 中服务缺少 _seatsBooked 属性的分支
  test('fetchServices with service without booked seats', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    const serviceData = { _name: 'Simple', _price: '5' }; // 没有 _seatsBooked
    localStorage.setItem('sba-services-test', JSON.stringify([serviceData]));
    app.fetchServices();
    expect(app.getServicesArray().length).toBe(1);
    const svc = app.getServicesArray()[0];
    expect(svc.getBookedSeats()).toEqual([]); // 默认为空
  });

  // 覆盖 updateOrderDetails 中找不到价格乘数（priceMultipliers 为空）的分支
  test('updateOrderDetails without price multipliers', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    const svc = new Service('Film', '10');
    app.addService(svc);
    app.renderServicesList(); // 设置为当前服务

    // 创建一个座位元素并模拟其父元素链
    const sectorDiv = document.createElement('div');
    sectorDiv.id = 's-Unknown';   // 这个 sector 不在 multipliers 里
    const rowDiv = document.createElement('div');
    const seatEl = document.createElement('div');
    seatEl.id = 's-Unknown-1-1';
    rowDiv.appendChild(seatEl);
    sectorDiv.appendChild(rowDiv);
    document.body.appendChild(sectorDiv);

    svc.addReservedSeat(seatEl);
    app.updateOrderDetails(); // 不应崩溃
    const details = document.querySelector('#order-details');
    expect(details.children.length).toBe(1);
    // 没有 multiplier，价格应为原价
    expect(details.querySelector('li span:last-child').textContent).toBe('$10');
  });

  // 覆盖 applyLanguage 传入不支持的语言（if (!t) return; 分支）
  test('applyLanguage with unsupported language does nothing', () => {
    setupLanguageDOM();
    const enLabel = document.getElementById('language-label').textContent;
    applyLanguage('fr'); // 不支持
    // 元素内容不应该变化
    expect(document.getElementById('language-label').textContent).toBe(enLabel);
    // localStorage 也不应更新
    expect(localStorage.getItem('selectedLanguage')).not.toBe('fr');
  });

  // 覆盖 cacheServices 中 try-catch 的异常情况（localStorage 不可用时）
  test('cacheServices when localStorage.setItem throws', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    app.addService(new Service('A', '10'));
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => { throw new Error('QuotaExceeded'); });
    // 不应抛出异常
    expect(() => app.cacheServices()).not.toThrow();
    localStorage.setItem = originalSetItem;
  });
});
  // 覆盖 renderCurrentServiceData 输入框缺失的分支
  test('renderCurrentServiceData when input elements are missing', () => {
    // 只留下 app 容器，删除 service-name 和 service-price 输入框
    document.body.innerHTML = `
      <div id="seat-booking-app">
        <select id="services-list"></select>
      </div>
    `;
    const app = new SeatBookingApp('test');
    const svc = new Service('Test', '10');
    app.addService(svc);
    app.renderServicesList();
    // 此时 inputName 和 inputPrice 都是 null，不应报错
    expect(() => app.renderCurrentServiceData()).not.toThrow();
  });

  // 覆盖 cacheServices 中 localStorage 不可用的分支
  test('cacheServices when Storage is undefined', () => {
    // 模拟 alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    // 临时删除 Storage 构造器
    const originalStorage = global.Storage;
    delete global.Storage;

    const app = new SeatBookingApp('test');
    app.addService(new Service('A', '10'));
    // 应该抛出错误
    expect(() => app.cacheServices()).toThrow('localStorage not available');
    expect(window.alert).toHaveBeenCalledWith('localStorage is not available');

    // 恢复
    global.Storage = originalStorage;
    window.alert.mockRestore();
  });
    test('addAuditLog does not crash when localStorage.setItem throws', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => { throw new Error('QuotaExceeded'); });
    // 不应抛出错误
    expect(() => app.addAuditLog('TEST', { data: 1 })).not.toThrow();
    // 日志仍被写入内部数组
    expect(app._logs.length).toBe(1);
    localStorage.setItem = originalSetItem;
  });
    // 1. addAuditLog 正常写入 localStorage（覆盖 try 成功分支）
  test('addAuditLog writes to localStorage when no error', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    app.addAuditLog('LOG', { info: 'test' });
    const stored = localStorage.getItem('sba-logs-test');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed.length).toBe(1);
    expect(parsed[0].action).toBe('LOG');
  });

  // 2. updateBlockingLayer 缺少 DOM 元素时不会崩溃
  test('updateBlockingLayer when blocker/screening/order are missing', () => {
    document.body.innerHTML = '<div id="seat-booking-app"></div>';
    const app = new SeatBookingApp('test');
    app._services = [];
    expect(() => app.updateBlockingLayer()).not.toThrow();

    app.addService(new Service('A', '10'));
    expect(() => app.updateBlockingLayer()).not.toThrow();
  });

  // 3. renderBookedSeats 无当前服务（currentService 为 null）
  test('renderBookedSeats when no current service', () => {
    document.body.innerHTML = `
      <div id="seat-a" class="seat seat--booked"></div>
    `;
    const app = new SeatBookingApp('test');
    // 不添加任何服务，currentService 为空
    renderBookedSeats(app);
    // 应该移除所有 booked 类
    expect(document.getElementById('seat-a').classList.contains('seat--booked')).toBe(false);
  });

  // 4. clearReservedUI 当 #order-details 或 #order-total-price 不存在时
  test('clearReservedUI when order containers are missing', () => {
    document.body.innerHTML = '<div id="seat-1" class="seat seat--reserved"></div>';
    const app = new SeatBookingApp('test');
    const svc = new Service('S', '10');
    svc.addReservedSeat(document.getElementById('seat-1'));
    app.addService(svc);
    // 显式设置当前服务，不依赖 renderServicesList
    app.setCurrentServiceId(svc.getId());
    expect(() => clearReservedUI(app)).not.toThrow();
    expect(svc.getReservedSeats()).toEqual([]);
  });

  // 5. fetchServices 解析出 null 值（!servicesJSON 分支）
  test('fetchServices with null parsed from storage', () => {
    setupBasicDOM();
    const app = new SeatBookingApp('test');
    localStorage.setItem('sba-services-test', 'null');
    app.fetchServices();
    expect(app.getServicesArray().length).toBe(0);
    const blocker = document.querySelector('#app-blocker');
    expect(blocker.style.display).toBe('flex');
  });

  // 6. updateOrderDetails 当 order-details 或 total-price 容器缺失
  test('updateOrderDetails without order containers', () => {
    document.body.innerHTML = `
      <div id="seat-booking-app">
        <select id="services-list"></select>
      </div>
    `;
    const app = new SeatBookingApp('test');
    const svc = new Service('Film', '10');
    app.addService(svc);
    app.renderServicesList();
    const seatEl = document.createElement('div');
    seatEl.id = 'orphan';
    svc.addReservedSeat(seatEl); // 没有 parentElement
    expect(() => app.updateOrderDetails()).not.toThrow();
  });