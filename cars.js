const API_URL = 'https://iit-playground.arondev.hu';
const NEPTUN_CODE = 'GEB15I';

const carListSection = document.getElementById('car-list-section');
const carDetailsSection = document.getElementById('car-details-section');
const carFormSection = document.getElementById('car-form-section');
const carList = document.getElementById('car-list');
const carDetails = document.getElementById('car-details');
const backToListButton = document.getElementById('back-to-list');
const carForm = document.getElementById('car-form');
const addNewCarButton = document.getElementById('add-new-car');

async function loadCars() {
    try {
        const response = await fetch(`${API_URL}/api/${NEPTUN_CODE}/car`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Hiba történt az autók betöltése során');
        }
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        showError(error.message);
        console.error('Hiba a kérés során:', error);
    }
}

function displayCars(cars) {
    carList.innerHTML = '';
    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.innerHTML = `
            <h3>${car.brand} ${car.model}</h3>
            <p>Tulajdonos: ${car.owner}</p>
            <p>Üzemanyagfogyasztás: ${car.fuelUse} l/100km</p>
            <p>Gyártás dátuma: ${car.dayOfCommission}</p>
            <p>${car.electric ? 'Elektromos' : 'Benzines/Dízel'}</p>
        `;
        carCard.addEventListener('click', () => showCarDetails(car));
        carList.appendChild(carCard);
    });
}

function showCarDetails(car) {
    carListSection.classList.add('hidden');
    carDetailsSection.classList.remove('hidden');
    
    carDetails.innerHTML = `
        <div class="car-details-card">
            <h3>${car.brand} ${car.model}</h3>
            <p>Tulajdonos: ${car.owner}</p>
            <p>Üzemanyagfogyasztás: ${car.fuelUse} l/100km</p>
            <p>Gyártás dátuma: ${car.dayOfCommission}</p>
            <p>${car.electric ? 'Elektromos' : 'Benzines/Dízel'}</p>
            <div class="button-group">
                <button class="button edit-button" data-id="${car.id}">Szerkesztés</button>
                <button class="button delete-button" data-id="${car.id}">Törlés</button>
            </div>
        </div>
    `;
    
    const editButton = carDetails.querySelector('.edit-button');
    editButton.addEventListener('click', () => showEditForm(car));
    
    const deleteButton = carDetails.querySelector('.delete-button');
    deleteButton.addEventListener('click', () => deleteCar(car.id));
}

backToListButton.addEventListener('click', () => {
    carDetailsSection.classList.add('hidden');
    carFormSection.classList.add('hidden');
    carListSection.classList.remove('hidden');
});

async function deleteCar(carId) {
    if (!confirm('Biztosan törölni szeretné ezt az autót?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/${NEPTUN_CODE}/car/${carId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Hiba történt az autó törlése során');
        }
        
        showSuccess('Az autó sikeresen törölve!');
        loadCars();
        backToListButton.click();
    } catch (error) {
        showError(error.message);
        console.error('Hiba a törlés során:', error);
    }
}

function showEditForm(car) {
    carDetailsSection.classList.add('hidden');
    carFormSection.classList.remove('hidden');
    
   
    document.getElementById('brand').value = car.brand;
    document.getElementById('model').value = car.model;
    document.getElementById('owner').value = car.owner;
    document.getElementById('fuelUse').value = car.fuelUse;
    document.getElementById('dayOfCommission').value = car.dayOfCommission;
    document.getElementById('electric').checked = car.electric;

    carForm.onsubmit = async (e) => {
        e.preventDefault();
        await updateCar(car.id);
    };
}

function showNewCarForm() {
    carListSection.classList.add('hidden');
    carFormSection.classList.remove('hidden');
    
    carForm.reset();
    
    carForm.onsubmit = async (e) => {
        e.preventDefault();
        await createNewCar();
    };
}

function validateCarData(carData) {
    const errors = [];

    // Márka validáció
    if (!carData.brand || carData.brand.trim() === '') {
        errors.push('A márka megadása kötelező');
    } else if (carData.brand.length < 2) {
        errors.push('A márka neve legalább 2 karakter hosszú kell, hogy legyen');
    }

    // Modell validáció
    if (!carData.model || carData.model.trim() === '') {
        errors.push('A modell megadása kötelező');
    } else if (carData.model.length < 2) {
        errors.push('A modell neve legalább 2 karakter hosszú kell, hogy legyen');
    }

    // Tulajdonos validáció
    if (!carData.owner || carData.owner.trim() === '') {
        errors.push('A tulajdonos nevének megadása kötelező');
    } else {
        const nameParts = carData.owner.trim().split(' ');
        if (nameParts.length < 2) {
            errors.push('A tulajdonos nevét Keresztnév Vezetéknév formátumban kell megadni');
        } else if (nameParts.some(part => part.length < 2)) {
            errors.push('A keresztnév és vezetéknév legalább 2 karakter hosszú kell, hogy legyen');
        }
    }

    // Üzemanyagfogyasztás validáció
    if (carData.electric) {
        if (carData.fuelUse !== 0) {
            errors.push('Elektromos autó esetén az üzemanyagfogyasztásnak 0-nak kell lennie');
        }
    } else {
        if (carData.fuelUse === '' || isNaN(carData.fuelUse)) {
            errors.push('Az üzemanyagfogyasztás megadása kötelező');
        } else if (carData.fuelUse < 0) {
            errors.push('Az üzemanyagfogyasztás nem lehet negatív');
        } else if (carData.fuelUse > 30) {
            errors.push('Az üzemanyagfogyasztás nem lehet nagyobb 30 l/100km-nél');
        }
    }

    // Gyártás dátum validáció
    if (!carData.dayOfCommission) {
        errors.push('A gyártás dátumának megadása kötelező');
    } else {
        const date = new Date(carData.dayOfCommission);
        const currentDate = new Date();
        if (date > currentDate) {
            errors.push('A gyártás dátuma nem lehet a jövőben');
        } else if (date.getFullYear() < 1886) {
            errors.push('A gyártás dátuma nem lehet 1886 előtt (az első autó gyártási éve)');
        }
    }

    return errors;
}

async function createNewCar() {
    const carData = {
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        owner: document.getElementById('owner').value,
        fuelUse: parseFloat(document.getElementById('fuelUse').value),
        dayOfCommission: document.getElementById('dayOfCommission').value,
        electric: document.getElementById('electric').checked
    };

    // Kliens oldali validáció
    const validationErrors = validateCarData(carData);
    if (validationErrors.length > 0) {
        showError(validationErrors.join('\n'));
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/${NEPTUN_CODE}/car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Hiba történt az autó létrehozása során');
        }
        
        showSuccess('Az autó sikeresen létrehozva!');
        loadCars();
        backToListButton.click();
    } catch (error) {
        showError(error.message);
        console.error('Hiba a létrehozás során:', error);
    }
}

async function updateCar(carId) {
    const carData = {
        id: carId,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        owner: document.getElementById('owner').value,
        fuelUse: parseFloat(document.getElementById('fuelUse').value),
        dayOfCommission: document.getElementById('dayOfCommission').value,
        electric: document.getElementById('electric').checked
    };

    // Kliens oldali validáció
    const validationErrors = validateCarData(carData);
    if (validationErrors.length > 0) {
        showError(validationErrors.join('\n'));
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/${NEPTUN_CODE}/car`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Hiba történt az autó frissítése során');
        }
        
        showSuccess('Az autó sikeresen frissítve!');
        loadCars();
        backToListButton.click();
    } catch (error) {
        showError(error.message);
        console.error('Hiba a frissítés során:', error);
    }
}

function showError(message) {
    const modal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const okButton = document.getElementById('error-ok-button');
    
    errorMessage.textContent = message;
    modal.classList.remove('hidden');
    
    okButton.onclick = () => {
        modal.classList.add('hidden');
    };
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCars();
    addNewCarButton.addEventListener('click', showNewCarForm);
}); 