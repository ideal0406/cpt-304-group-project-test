'use strict';

/* ========== 工具函数 ========== */
function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function localStorageSpace() {
  let data = '';
  console.log('Current local storage: ');
  for (let key in window.localStorage) {
    if (window.localStorage.hasOwnProperty(key)) {
      data += window.localStorage[key];
      console.log(
        key +
          ' = ' +
          ((window.localStorage[key].length * 16) / (8 * 1024)).toFixed(2) +
          ' KB'
      );
    }
  }
  console.log(
    data
      ? '\n' +
          'Total space used: ' +
          ((data.length * 16) / (8 * 1024)).toFixed(2) +
          ' KB'
      : 'Empty (0 KB)'
  );
  console.log(
    data
      ? 'Approx. space remaining: ' +
          (5120 - (data.length * 16) / (8 * 1024)).toFixed(2) +
          ' KB'
      : '5 MB'
  );
}

/* ========== 翻译功能 ========== */
const translations = {
  en: {
    languageLabel: 'Language:',
    servicesListLabel: 'Service list:',
    movieTitleLabel: 'Movie title:',
    priceBaseLabel: 'Price base:',
    addNew: 'Add new',
    saveChanges: 'Save changes',
    deleteText: 'Delete',
    editSectorPrices: "Edit sectors' prices",
    sectorMultipliersLabel: 'Price multipliers for each sector:',
    saveText: 'Save',
    ticketsLabel: 'Tickets:',
    buyText: 'Buy',
    screenText: 'Screen',
  },
  zh: {
    languageLabel: '语言：',
    servicesListLabel: '服务列表：',
    movieTitleLabel: '电影标题：',
    priceBaseLabel: '基础票价：',
    addNew: '新增',
    saveChanges: '保存修改',
    deleteText: '删除',
    editSectorPrices: '编辑分区价格',
    sectorMultipliersLabel: '各分区票价系数：',
    saveText: '保存',
    ticketsLabel: '票券：',
    buyText: '购买',
    screenText: '屏幕',
  },
};

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  const idsMap = {
    'language-label': t.languageLabel,
    'services-list-label': t.servicesListLabel,
    'movie-title-label': t.movieTitleLabel,
    'price-base-label': t.priceBaseLabel,
    'service-add-btn': t.addNew,
    'service-update-btn': t.saveChanges,
    'service-delete-btn': t.deleteText,
    'sectors-price-btn': t.editSectorPrices,
    'sector-multipliers-label': t.sectorMultipliersLabel,
    'sectors-save-btn': t.saveText,
    'tickets-label': t.ticketsLabel,
    'book-seats-btn': t.buyText,
    'screen': t.screenText,
  };

  Object.keys(idsMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = idsMap[id];
  });

  localStorage.setItem('selectedLanguage', lang);
}

/* ========== 核心类 ========== */
class SeatBookingApp {
  constructor(name) {
    this._name = name;
    this._sectors = [];
    this._priceMultipliers = [];
    this._services = [];
    this._currentServiceId = '';
    this._logs = [];
  }

  getName() {
    return this._name;
  }

  addAuditLog(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
    };
    this._logs.push(logEntry);
    try {
      localStorage.setItem(`sba-logs-${this._name}`, JSON.stringify(this._logs));
    } catch (e) {}
    console.table(logEntry);
  }

  addSector(sector) {
    this._sectors.push(sector);
  }

  getSectorsArray() {
    return this._sectors;
  }

  setPriceMultipliersArray() {
    const sectors = this.getSectorsArray();
    this._priceMultipliers = sectors.map((sector) => ({
      sector: sector.getId(),
      priceMultiplier: sector.getPriceMultiplier(),
    }));
  }

  getPriceMultipliersArray() {
    return this._priceMultipliers;
  }

  renderSectorsList() {
    const sectors = this.getPriceMultipliersArray();
    const container = document.querySelector(`#sectors-list`);
    if (!container) return;
    container.innerHTML = '';
    sectors.forEach((sector) => {
      const listElement = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = sector.sector;
      const price = document.createElement('input');
      price.setAttribute('id', `price-${sector.sector}`);
      price.setAttribute('aria-label', `Price multiplier for sector ${sector.sector}`);
      price.type = 'number';
      price.step = '0.1';
      price.value = sector.priceMultiplier;
      listElement.appendChild(name);
      listElement.appendChild(price);
      container.appendChild(listElement);
    });
  }

  addService(service) {
    this._services.push(service);
  }

  getServicesArray() {
    return this._services;
  }

  renderServicesList() {
    const services = this.getServicesArray();
    const dropdownElement = document.querySelector(`#services-list`);
    if (!dropdownElement) return;
    dropdownElement.innerHTML = '';
    services.forEach((service) => {
      const optionElement = document.createElement('option');
      optionElement.setAttribute('value', service.getId());
      optionElement.textContent = service.getName();
      dropdownElement.appendChild(optionElement);
    });
    if (services.length > 0) {
      dropdownElement.value = services[0].getId();   // 显式设置为第一项
      this.setCurrentServiceId(dropdownElement.value);
    }
}

  getCurrentServiceId() {
    return this._currentServiceId;
  }

  getCurrentService() {
    return this._services.find((s) => s.getId() === this.getCurrentServiceId()) || null;
  }

  setCurrentServiceId(serviceId) {
    this._currentServiceId = serviceId;
  }

  renderCurrentServiceData() {
    const currentService = this.getCurrentService();
    const inputName = document.querySelector(`#service-name`);
    const inputPrice = document.querySelector(`#service-price`);
    if (inputName) {
      inputName.value = currentService ? currentService.getName() : '';
    }
    if (inputPrice) {
      inputPrice.value = currentService ? currentService.getPrice() : '';
    }
  }

  updateBlockingLayer() {
    const blocker = document.querySelector('#app-blocker');
    const screeningRoom = document.querySelector('#screening-room-1');
    const orderSection = document.querySelector('#order');

    if (this._services.length === 0) {
      if (blocker) blocker.style.display = 'flex';
      if (screeningRoom) {
        screeningRoom.style.pointerEvents = 'none';
        screeningRoom.style.opacity = '0.4';
      }
      if (orderSection) {
        orderSection.style.pointerEvents = 'none';
        orderSection.style.opacity = '0.4';
      }
    } else {
      if (blocker) blocker.style.display = 'none';
      if (screeningRoom) {
        screeningRoom.style.pointerEvents = 'auto';
        screeningRoom.style.opacity = '1';
      }
      if (orderSection) {
        orderSection.style.pointerEvents = 'auto';
        orderSection.style.opacity = '1';
      }
    }
  }

  cacheServices() {
    if (typeof Storage !== 'undefined') {
      try {
        localStorage.setItem(
          `sba-services-${this.getName()}`,
          JSON.stringify(this.getServicesArray())
        );
      } catch (e) {}
    } else {
      alert('localStorage is not available');
      throw new Error('localStorage not available');
    }
  }

  fetchServices() {
    const raw = localStorage.getItem(`sba-services-${this.getName()}`);
    if (!raw) {
      console.log("Let's add some services. Use the form on the left.");
      this.updateBlockingLayer();
      return;
    }
    try {
      const servicesJSON = JSON.parse(raw);
      if (!servicesJSON || servicesJSON.length === 0) {
        this.updateBlockingLayer();
        return;
      }
      servicesJSON.forEach((s) => {
        const serviceInstance = new Service(s._name, s._price);
        if (s._seatsBooked) {
          serviceInstance.setBookedSeatsArray(s._seatsBooked);
        }
        this.addService(serviceInstance);
      });
    } catch (e) {
      console.error('Failed to fetch services from storage', e);
    }
    this.updateBlockingLayer();
  }

  updateOrderDetails() {
    const currentService = this.getCurrentService();
    if (!currentService) return;

    const servicePrice = parseFloat(currentService.getPrice()) || 0;
    const priceMultipliers = this.getPriceMultipliersArray();
    const reservedSeats = currentService.getReservedSeats();
    const container = document.querySelector(`#order-details`);
    const totalContainer = document.querySelector(`#order-total-price`);
    if (container) container.innerHTML = '';
    if (totalContainer) totalContainer.innerHTML = '';
    let totalPrice = 0;

    reservedSeats.forEach((seat) => {
      const sectorId = seat.parentElement?.parentElement?.id;
      if (!sectorId) return;
      const multiplierObj = priceMultipliers.find((m) => m.sector === sectorId);
      const multiplier = multiplierObj ? multiplierObj.priceMultiplier : 1;
      const seatPrice = parseFloat((servicePrice * multiplier).toFixed(2));
      totalPrice += seatPrice;

      if (container) {
        const listItem = document.createElement('li');
        const idSpan = document.createElement('span');
        idSpan.textContent = seat.id;
        const priceSpan = document.createElement('span');
        priceSpan.textContent = `$${seatPrice}`;
        listItem.appendChild(idSpan);
        listItem.appendChild(priceSpan);
        container.appendChild(listItem);
      }
    });

    if (totalContainer) {
      const totalSpan = document.createElement('span');
      totalSpan.textContent = `Total price: $${parseFloat(totalPrice.toFixed(2))}`;
      totalContainer.appendChild(totalSpan);
    }
  }
}

class Service {
  constructor(name, price) {
    this._id = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substr(2, 9);
    this._name = name;
    this._price = price;
    this._seatsReserved = [];
    this._seatsBooked = [];
  }

  getId() { return this._id; }
  getName() { return this._name; }
  getPrice() { return this._price; }
  setName(name) { this._name = name; }
  setPrice(price) { this._price = price; }
  getBookedSeats() { return this._seatsBooked; }

  bookSeats() {
    const reserved = this.getReservedSeats();
    reserved.forEach((seat) => {
      if (!this._seatsBooked.includes(seat.id)) {
        this._seatsBooked.push(seat.id);
      }
    });
    this.clearReservedSeats();
    this.markBookedSeats();
  }

  getReservedSeats() { return this._seatsReserved; }
  addReservedSeat(seat) { this._seatsReserved.push(seat); }

  removeReservedSeat(seatId) {
    const index = this._seatsReserved.findIndex((s) => s.id === seatId);
    if (index !== -1) this._seatsReserved.splice(index, 1);
  }

  clearReservedSeats() { this._seatsReserved = []; }

  setBookedSeatsArray(array) { this._seatsBooked = array; }

  markBookedSeats() {
    document.querySelectorAll('.seat').forEach((seat) => {
      if (this._seatsBooked.includes(seat.id)) {
        seat.classList.add('seat--booked');
        seat.classList.remove('seat--reserved');
      }
    });
  }
}

class Sector {
  constructor(id, priceMultiplier = 1, ...seatsInRow) {
    this._id = `s-${String(id)}`;
    this._priceMultiplier = priceMultiplier;
    this._rows = seatsInRow.length;
    this._seats = [];
    // 生成座位数据（用于 render）
    for (let i = 0; i < seatsInRow.length; i++) {
      const rowId = `${this._id}-${i + 1}`;
      for (let j = 1; j <= seatsInRow[i]; j++) {
        this._seats.push({
          sector: this._id,
          row: rowId,
          seat: `${rowId}-${j}`,
        });
      }
    }
  }

  getId() { return this._id; }
  getPriceMultiplier() { return this._priceMultiplier; }
  setPriceMultiplier(p) { this._priceMultiplier = p; }

  renderSector() {
    const appContainer = document.querySelector('#seat-booking-app');
    if (!appContainer) throw new Error('App container not found');
    const seatsContainer = document.querySelector('#seats');
    if (!seatsContainer) throw new Error('Seats container not found');

    const sectorId = this._id;
    const sectorName = sectorId.slice(2);
    const sectorElement = document.createElement('div');
    sectorElement.classList.add('sector');
    sectorElement.setAttribute('id', sectorId);
    sectorElement.style.gridArea = sectorName;
    seatsContainer.appendChild(sectorElement);

    // 按行分组
    const rowsMap = new Map();
    this._seats.forEach((s) => {
      if (!rowsMap.has(s.row)) rowsMap.set(s.row, []);
      rowsMap.get(s.row).push(s);
    });

    for (let i = 1; i <= this._rows; i++) {
      const rowId = `${sectorId}-${i}`;
      const rowElement = document.createElement('div');
      rowElement.classList.add('row');
      rowElement.setAttribute('id', rowId);
      sectorElement.appendChild(rowElement);

      const seatsInRow = rowsMap.get(rowId) || [];
      seatsInRow.forEach((seat) => {
        const seatElement = document.createElement('div');
        seatElement.classList.add('seat');
        seatElement.setAttribute('id', seat.seat);
        rowElement.appendChild(seatElement);
      });
    }

    const sectorLabel = document.createElement('span');
    sectorLabel.textContent = sectorId;
    sectorLabel.classList.add('sector__label');
    sectorElement.appendChild(sectorLabel);
  }
}

/* ========== 辅助函数（方便测试） ========== */
function initializeApp(instanceName) {
  return new SeatBookingApp(instanceName);
}

function renderBookedSeats(app) {
  const currentService = app.getCurrentService();
  document.querySelectorAll('.seat').forEach((seat) => {
    if (currentService && currentService.getBookedSeats().includes(seat.id)) {
      seat.classList.add('seat--booked');
    } else {
      seat.classList.remove('seat--booked');
    }
  });
}

function clearReservedUI(app) {
  const currentService = app.getCurrentService();
  if (currentService) {
    currentService.clearReservedSeats();
  }
  document.querySelectorAll('.seat--reserved').forEach((seat) => {
    seat.classList.remove('seat--reserved');
  });
  const container = document.querySelector('#order-details');
  if (container) container.innerHTML = '';
  const totalContainer = document.querySelector('#order-total-price');
  if (totalContainer) totalContainer.innerHTML = '';
}
// ========== 导出到全局，方便测试 ==========
window.SeatBookingApp = SeatBookingApp;
window.Service = Service;
window.Sector = Sector;
window.debounce = debounce;
window.localStorageSpace = localStorageSpace;
window.translations = translations;
window.applyLanguage = applyLanguage;
window.initializeApp = initializeApp;
window.renderBookedSeats = renderBookedSeats;
window.clearReservedUI = clearReservedUI;