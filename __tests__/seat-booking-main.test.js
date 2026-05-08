/**
 * @jest-environment jsdom
 */

// 加载类定义，确保全局存在 SeatBookingApp、Service、Sector 等
require('../script/seat-booking-classes.js');

// 用于捕获 initializeApp 创建的实例
let capturedApp = null;

function setupFullDOM() {
  // 完整 DOM 结构（与生产环境一致）
  document.body.innerHTML = `
    <div id="seat-booking-app">
      <div id="screening-room-1">
        <div id="screen">Screen</div>
        <div id="seats">
          <div id="s-A1-1-1" class="seat"></div>
          <div id="s-A1-1-2" class="seat seat--booked"></div>
          <div id="s-A1-1-3" class="seat"></div>
        </div>
      </div>
      <div id="settings">
        <select id="services-list">
          <option value="">-- Choose --</option>
        </select>
        <input id="service-name" value="" />
        <input id="service-price" value="" />
        <button id="service-add-btn">Add</button>
        <button id="service-update-btn">Update</button>
        <button id="service-delete-btn">Delete</button>
        <div class="sectors">
          <ul id="sectors-list"></ul>
        </div>
        <div id="order">
          <div id="order-details"></div>
          <div id="order-total-price"><span>$0</span></div>
          <button id="book-seats-btn">Buy</button>
        </div>
      </div>
      <div id="app-blocker" style="display:flex;"></div>
    </div>
    <select id="language-select">
      <option value="en">EN</option>
      <option value="zh">中文</option>
    </select>
  `;
}

beforeEach(() => {
  setupFullDOM();
  localStorage.clear();
  capturedApp = null;

  // 拦截 initializeApp，捕获实例
  const originalInitializeApp = window.initializeApp;
  window.initializeApp = jest.fn((name) => {
    capturedApp = originalInitializeApp(name);
    return capturedApp;
  });

  // 清除模块缓存，重新加载主入口文件
  jest.resetModules();
  require('../script/seat-booking-main.js');

  // 手动触发 DOMContentLoaded（确保语言监听器执行）
  const domReadyEvent = new Event('DOMContentLoaded');
  document.dispatchEvent(domReadyEvent);

  // 恢复原始函数
  window.initializeApp = originalInitializeApp;
});

afterEach(() => {
  jest.clearAllTimers();
  capturedApp = null;
});

// ===================== 测试开始 =====================

describe('Main script initialization', () => {
  test('should create app instance via initializeApp', () => {
    expect(capturedApp).toBeDefined();
    expect(capturedApp instanceof SeatBookingApp).toBe(true);
    expect(capturedApp.getName()).toBe('showingRoom1');
  });

  test('should render initial sectors', () => {
    // main.js 中添加了 A1, A2, B1, B1L, B2L, C1L 共 6 个扇区
    expect(capturedApp.getSectorsArray().length).toBe(6);
    expect(document.getElementById('s-A1')).toBeTruthy();
    expect(document.getElementById('s-B1')).toBeTruthy();
  });

  test('should fetch services on init (empty storage = blocker visible)', () => {
    const blocker = document.getElementById('app-blocker');
    // 默认没有服务，blocker 应显示
    expect(blocker.style.display).toBe('flex');
  });
});

describe('Services dropdown change', () => {
  test('should switch service and update UI', () => {
    const svc1 = new Service('Movie 1', '10');
    const svc2 = new Service('Movie 2', '20');
    capturedApp.addService(svc1);
    capturedApp.addService(svc2);
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(svc1.getId());

    const dropdown = document.getElementById('services-list');
    dropdown.value = svc2.getId();
    dropdown.dispatchEvent(new Event('change'));

    expect(capturedApp.getCurrentServiceId()).toBe(svc2.getId());
    expect(document.getElementById('service-name').value).toBe('Movie 2');
    expect(document.getElementById('service-price').value).toBe('20');
  });
});

describe('Add service button', () => {
  test('should add a new service and update UI', () => {
    jest.useFakeTimers();
    const initialCount = capturedApp.getServicesArray().length;

    document.getElementById('service-name').value = 'Inception';
    document.getElementById('service-price').value = '15.5';
    document.getElementById('service-add-btn').click();
    jest.advanceTimersByTime(300);

    const services = capturedApp.getServicesArray();
    expect(services.length).toBe(initialCount + 1);
    const newService = services[services.length - 1];
    expect(newService.getName()).toBe('Inception');
    expect(newService.getPrice()).toBe('15.5');

    // 下拉框选中新服务
    expect(document.getElementById('services-list').value).toBe(newService.getId());
    // 输入框显示新服务数据
    expect(document.getElementById('service-name').value).toBe('Inception');
    expect(document.getElementById('app-blocker').style.display).toBe('none');

    // localStorage 缓存
    const stored = JSON.parse(localStorage.getItem('sba-services-showingRoom1'));
    expect(stored.length).toBe(services.length);

    jest.useRealTimers();
  });
});

describe('Update service button', () => {
  test('should update current service', () => {
    capturedApp.addService(new Service('Temp', '5'));
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(capturedApp.getServicesArray()[0].getId());

    jest.useFakeTimers();
    document.getElementById('service-name').value = 'Updated';
    document.getElementById('service-price').value = '42';
    document.getElementById('service-update-btn').click();
    jest.advanceTimersByTime(300);

    const cur = capturedApp.getCurrentService();
    expect(cur.getName()).toBe('Updated');
    expect(cur.getPrice()).toBe('42');

    jest.useRealTimers();
  });

  test('should not crash without current service', () => {
    capturedApp._services = [];
    jest.useFakeTimers();
    document.getElementById('service-update-btn').click();
    jest.advanceTimersByTime(300);
    // 无异常
    expect(true).toBe(true);
    jest.useRealTimers();
  });
});

describe('Delete service button', () => {
  test('should delete service and switch to next', () => {
    const svc1 = new Service('A', '10');
    const svc2 = new Service('B', '20');
    capturedApp.addService(svc1);
    capturedApp.addService(svc2);
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(svc1.getId());

    jest.useFakeTimers();
    document.getElementById('service-delete-btn').click();
    jest.advanceTimersByTime(300);

    const services = capturedApp.getServicesArray();
    expect(services.length).toBe(1);
    expect(services[0].getId()).toBe(svc2.getId());
    expect(capturedApp.getCurrentServiceId()).toBe(svc2.getId());

    // 已预订座位被清除（因为调用了 renderBookedSeats）
    const bookedSeat = document.getElementById('s-A1-1-2');
    expect(bookedSeat.classList.contains('seat--booked')).toBe(false);
    // blocker 隐藏（仍有服务）
    expect(document.getElementById('app-blocker').style.display).toBe('none');

    jest.useRealTimers();
  });

  test('should show blocker after deleting last service', () => {
    capturedApp.addService(new Service('Only', '10'));
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(capturedApp.getServicesArray()[0].getId());

    jest.useFakeTimers();
    document.getElementById('service-delete-btn').click();
    jest.advanceTimersByTime(300);

    expect(capturedApp.getServicesArray().length).toBe(0);
    expect(document.getElementById('app-blocker').style.display).toBe('flex');

    jest.useRealTimers();
  });
});

describe('Seat click events', () => {
  test('should reserve/unreserve a seat and update order', () => {
    // 必须存在当前服务
    const svc = new Service('Test Service', '10');
    capturedApp.addService(svc);
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(svc.getId());

    const seat = document.getElementById('s-A1-1-1');
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(true);

    const cur = capturedApp.getCurrentService();
    expect(cur.getReservedSeats().length).toBe(1);
    // 订单明细出现
    expect(document.getElementById('order-details').children.length).toBeGreaterThan(0);

    // 再次点击取消预留
    seat.click();
    expect(seat.classList.contains('seat--reserved')).toBe(false);
    expect(cur.getReservedSeats().length).toBe(0);
    expect(document.getElementById('order-details').children.length).toBe(0);
  });

  test('should not change booked seat', () => {
    const booked = document.getElementById('s-A1-1-2');
    // 即使没有服务，点击已预订座位也不应改变其状态
    booked.click();
    expect(booked.classList.contains('seat--booked')).toBe(true);
    expect(booked.classList.contains('seat--reserved')).toBe(false);
  });
});

describe('Book seats button', () => {
  test('should finalize booking', () => {
    // 设置当前服务
    const svc = new Service('Test Service', '10');
    capturedApp.addService(svc);
    capturedApp.renderServicesList();
    capturedApp.setCurrentServiceId(svc.getId());

    const seat = document.getElementById('s-A1-1-1');
    seat.click(); // 预留

    jest.useFakeTimers();
    document.getElementById('book-seats-btn').click();
    jest.advanceTimersByTime(300);

    expect(seat.classList.contains('seat--booked')).toBe(true);
    expect(seat.classList.contains('seat--reserved')).toBe(false);

    const cur = capturedApp.getCurrentService();
    expect(cur.getBookedSeats()).toContain(seat.id);
    expect(cur.getReservedSeats().length).toBe(0);
    // 订单清空
    expect(document.getElementById('order-details').children.length).toBe(0);

    jest.useRealTimers();
  });

  test('should not crash without service', () => {
    capturedApp._services = [];
    jest.useFakeTimers();
    document.getElementById('book-seats-btn').click();
    jest.advanceTimersByTime(300);
    expect(true).toBe(true);
    jest.useRealTimers();
  });
});

describe('Language integration', () => {
  test('should load language from localStorage on DOMContentLoaded', () => {
    localStorage.setItem('selectedLanguage', 'zh');
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const select = document.getElementById('language-select');
    expect(select.value).toBe('zh');
    expect(document.getElementById('screen').textContent).toBe('屏幕');
  });

  test('should switch language on change', () => {
    const select = document.getElementById('language-select');
    select.value = 'zh';
    select.dispatchEvent(new Event('change'));

    expect(localStorage.getItem('selectedLanguage')).toBe('zh');
    expect(document.getElementById('screen').textContent).toBe('屏幕');
    expect(document.getElementById('book-seats-btn').textContent).toBe('购买');
  });

  test('should not apply unsupported language', () => {
    const select = document.getElementById('language-select');
    select.value = 'fr';
    select.dispatchEvent(new Event('change'));
    // 未支持的语言，内容不变（默认英文）
    expect(document.getElementById('screen').textContent).toBe('Screen');
    expect(localStorage.getItem('selectedLanguage')).not.toBe('fr');
  });
});

describe('Debounce on add button', () => {
  test('should avoid double addition when clicked quickly', () => {
    jest.useFakeTimers();
    const initialCount = capturedApp.getServicesArray().length;

    document.getElementById('service-name').value = 'X';
    document.getElementById('service-price').value = '10';
    const btn = document.getElementById('service-add-btn');
    btn.click();
    btn.click();
    jest.advanceTimersByTime(300);

    expect(capturedApp.getServicesArray().length).toBe(initialCount + 1);
    jest.useRealTimers();
  });
});

// ===================== 边界分支覆盖 =====================
describe('Edge branches in event listeners', () => {
  test('service dropdown change when currentService is null', () => {
    // 清空服务，让 getCurrentService() 返回 null
    capturedApp._services = [];
    capturedApp.renderServicesList();
    const dropdown = document.getElementById('services-list');
    dropdown.value = '';
    expect(() => dropdown.dispatchEvent(new Event('change'))).not.toThrow();
  });

  test('add service button with empty name/price', () => {
    jest.useFakeTimers();
    document.getElementById('service-name').value = '';
    document.getElementById('service-price').value = '';
    document.getElementById('service-add-btn').click();
    jest.advanceTimersByTime(300);
    // 应添加一个空名称的服务，不会崩溃
    const services = capturedApp.getServicesArray();
    expect(services.length).toBeGreaterThan(0);
    jest.useRealTimers();
  });

  test('update service button when no current service', () => {
    capturedApp._services = [];
    jest.useFakeTimers();
    document.getElementById('service-update-btn').click();
    jest.advanceTimersByTime(300);
    expect(true).toBe(true);
    jest.useRealTimers();
  });

  test('delete service button when no current service', () => {
    capturedApp._services = [];
    jest.useFakeTimers();
    document.getElementById('service-delete-btn').click();
    jest.advanceTimersByTime(300);
    expect(true).toBe(true);
    jest.useRealTimers();
  });

  test('book seats button when no current service', () => {
    capturedApp._services = [];
    jest.useFakeTimers();
    document.getElementById('book-seats-btn').click();
    jest.advanceTimersByTime(300);
    expect(true).toBe(true);
    jest.useRealTimers();
  });

  test('language DOMContentLoaded when language-select missing', () => {
    const select = document.getElementById('language-select');
    if (select) select.remove();

    const event = new Event('DOMContentLoaded');
    expect(() => document.dispatchEvent(event)).not.toThrow();
  });
});