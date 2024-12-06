document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#business-table tbody');
    const modalOverlay = document.getElementById('modal-overlay');
    const tripModal = document.getElementById('trip-modal');
    const tripForm = document.getElementById('trip-form');
    let editingId = null;
    const API_BASE_URL = 'http://3.37.73.151:3001/api/business';

    const fetchTrips = async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}?${queryParams}`);
            tableBody.innerHTML = '';
            response.data.forEach(trip => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${trip.id}</td>
                    <td>${trip.NAME}</td>
                    <td>${trip.GROUP}</td>
                    <td>${trip.SITE}</td>
                    <td>${trip.COUNTRY}</td>
                    <td>${trip.CITY}</td>
                    <td>${trip.CUSTOMER}</td>
                    <td>${trip.EQUIPMENT}</td>
                    <td>${trip.START_DATE.split('T')[0]}</td>
                    <td>${trip.END_DATE.split('T')[0]}</td>
                    <td>
                        <button class="edit-btn" data-id="${trip.id}">Edit</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

    document.getElementById('search-button').addEventListener('click', () => {
        const filters = {
            name: document.getElementById('search-name').value,
            group: document.getElementById('search-group').value !== 'SELECT' ? document.getElementById('search-group').value : null,
            site: document.getElementById('search-site').value !== 'SELECT' ? document.getElementById('search-site').value : null,
            country: document.getElementById('search-country').value !== 'SELECT' ? document.getElementById('search-country').value : null,
            city: document.getElementById('search-city').value !== 'SELECT' ? document.getElementById('search-city').value : null,
            customer: document.getElementById('search-customer').value !== 'SELECT' ? document.getElementById('search-customer').value : null,
            equipment: document.getElementById('search-equipment').value !== 'SELECT' ? document.getElementById('search-equipment').value : null,
        };
    
        fetchTrips(filters);
    });

    const updateCityOptions = (country) => {
        const citySelect = document.getElementById('search-city');
        citySelect.innerHTML = '<option value="SELECT">City</option>'; // 초기화
    
        const cityOptions = {
            USA: ['Portland', 'Arizona'],
            Ireland: ['Leixlip'],
            Japan: ['Hiroshima'],
            China: ['Wuxi', 'Xian', 'Shanghai', 'Beijing'],
            Taiwan: ['Taichoung'],
            Singapore: ['Singapore'],
        };
    
        if (cityOptions[country]) {
            cityOptions[country].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    };
    
    document.getElementById('search-country').addEventListener('change', (event) => {
        const country = event.target.value;
        updateCityOptions(country);
    });
    

    const openModal = (trip = null) => {
        if (trip) {
            editingId = trip.id;
            tripForm.name.value = trip.NAME;
            tripForm.country.value = trip.COUNTRY;
            tripForm.city.value = trip.CITY;
            tripForm.start_date.value = trip.START_DATE;
            tripForm.end_date.value = trip.END_DATE;
        } else {
            editingId = null;
            tripForm.reset();
        }
        modalOverlay.style.display = 'block';
        tripModal.style.display = 'block';
    };

    const closeModal = () => {
        modalOverlay.style.display = 'none';
        tripModal.style.display = 'none';
    };

    const saveTrip = async (event) => {
        event.preventDefault();
        const tripData = {
            name: tripForm.name.value,
            country: tripForm.country.value,
            city: tripForm.city.value,
            startDate: tripForm.start_date.value,
            endDate: tripForm.end_date.value,
        };

        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/${editingId}`, tripData); // 수정된 경로
            } else {
                await axios.post(API_BASE_URL, tripData); // 추가 경로
            }
            closeModal();
            fetchTrips();
        } catch (error) {
            console.error('Error saving trip:', error);
        }
    };

    const deleteTrip = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/${id}`); // 수정된 경로
            fetchTrips();
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    tripForm.addEventListener('submit', saveTrip);

    document.getElementById('add-trip-btn').addEventListener('click', () => openModal());

    document.getElementById('close-modal').addEventListener('click', closeModal);

    tableBody.addEventListener('click', (event) => {
        const id = event.target.dataset.id;
        if (event.target.classList.contains('edit-btn')) {
            const row = event.target.closest('tr').children;
            openModal({
                id,
                NAME: row[1].textContent,
                COUNTRY: row[2].textContent,
                CITY: row[3].textContent,
                START_DATE: row[4].textContent,
                END_DATE: row[5].textContent,
            });
        } else if (event.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this trip?')) {
                deleteTrip(id);
            }
        }
    });

    fetchTrips();
});
