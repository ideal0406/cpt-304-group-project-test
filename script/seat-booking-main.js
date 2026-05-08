'use strict';

// 创建主应用实例
const showingRoom1 = initializeApp('showingRoom1');

// 创建各个扇区
const sectorA1 = new Sector('A1', 1.0, 20, 20);
sectorA1.renderSector();
const sectorA2 = new Sector('A2', 1.2, 20, 20, 20);
sectorA2.renderSector();
const sectorB1 = new Sector('B1', 1.2, 20, 20, 20, 20);
sectorB1.renderSector();
const sectorB1L = new Sector('B1L', 1.4, 1, 1, 1, 1, 1, 1);
sectorB1L.renderSector();
const sectorB2L = new Sector('B2L', 1.4, 1, 1, 1, 1, 1, 1);
sectorB2L.renderSector();
const sectorC1L = new Sector('C1L', 1.5, 12);
sectorC1L.renderSector();

// 注册扇区到应用
[
  sectorA1,
  sectorA2,
  sectorB1,
  sectorB1L,
  sectorB2L,
  sectorC1L,
].forEach((s) => showingRoom1.addSector(s));

showingRoom1.setPriceMultipliersArray();
showingRoom1.fetchServices();
showingRoom1.renderSectorsList();
showingRoom1.renderServicesList();
showingRoom1.renderCurrentServiceData();

// 座位悬停与点击事件
document.querySelectorAll('.seat').forEach((seat) => {
  seat.addEventListener('mouseover', (e) => {
    const seatInfo = document.createElement('div');
    seatInfo.classList.add('seat__info');
    seatInfo.textContent = e.target.id;
    e.target.parentElement.appendChild(seatInfo);
  });
  seat.addEventListener('mouseleave', () => {
    const info = document.querySelector('.seat__info');
    if (info) info.remove();
  });

  seat.addEventListener('click', (e) => {
    if (e.target.classList.contains('seat--booked')) return;
    e.target.classList.toggle('seat--reserved');
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) return;

    if (e.target.classList.contains('seat--reserved')) {
      showingRoom1.addAuditLog('SELECT_SEAT', {
        seatId: e.target.id,
        serviceId: currentService.getId(),
      });
      currentService.addReservedSeat(e.target);
    } else {
      showingRoom1.addAuditLog('DESELECT_SEAT', {
        seatId: e.target.id,
        serviceId: currentService.getId(),
      });
      currentService.removeReservedSeat(e.target.id);
    }
    showingRoom1.updateOrderDetails();
  });
});

// 服务列表切换
document.querySelector('#services-list').addEventListener('change', (e) => {
  showingRoom1.setCurrentServiceId(e.target.value);
  clearReservedUI(showingRoom1);
  renderBookedSeats(showingRoom1);
  showingRoom1.renderCurrentServiceData();
});

// 新增服务
const serviceAddBtn = document.querySelector('#service-add-btn');
serviceAddBtn.addEventListener(
  'click',
  debounce(() => {
    const name = document.querySelector('#service-name').value;
    const price = document.querySelector('#service-price').value;
    const newService = new Service(name, price);
    showingRoom1.addService(newService);
    showingRoom1.cacheServices();
    showingRoom1.renderServicesList();

    document.querySelector('#services-list').value = newService.getId();
    showingRoom1.setCurrentServiceId(newService.getId());
    clearReservedUI(showingRoom1);
    showingRoom1.renderCurrentServiceData();
    showingRoom1.addAuditLog('ADD_MOVIE', { name, price });
    showingRoom1.updateBlockingLayer();
  }, 300)
);

// 更新服务
document.querySelector('#service-update-btn').addEventListener(
  'click',
  debounce(() => {
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) return;
    const name = document.querySelector('#service-name').value;
    const price = document.querySelector('#service-price').value;
    currentService.setName(name);
    currentService.setPrice(price);
    showingRoom1.cacheServices();
    showingRoom1.renderCurrentServiceData();
    clearReservedUI(showingRoom1);
  }, 300)
);

// 删除服务
document.querySelector('#service-delete-btn').addEventListener(
  'click',
  debounce(() => {
    const currentServiceId = showingRoom1.getCurrentServiceId();
    const services = showingRoom1.getServicesArray();
    const index = services.findIndex((s) => s.getId() === currentServiceId);
    if (index !== -1) {
      services.splice(index, 1);
      showingRoom1.cacheServices();
      showingRoom1.renderServicesList();
      showingRoom1.renderCurrentServiceData();
      clearReservedUI(showingRoom1);
      renderBookedSeats(showingRoom1);
      showingRoom1.updateBlockingLayer();
    }
  }, 300)
);

// 预订按钮
document.querySelector('#book-seats-btn').addEventListener(
  'click',
  debounce(() => {
    const currentService = showingRoom1.getCurrentService();
    if (!currentService) return;
    currentService.bookSeats();
    showingRoom1.cacheServices();
    clearReservedUI(showingRoom1);
    showingRoom1.updateOrderDetails();
  }, 300)
);

// 语言切换
document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('language-select');
  const saved = localStorage.getItem('selectedLanguage') || 'en';
  if (langSelect) {
    langSelect.value = saved;
    applyLanguage(saved);
    langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
  }
});