document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#business-table tbody');
    const modalOverlay = document.getElementById('modal-overlay');
    const tripModal = document.getElementById('trip-modal');
    const tripForm = document.getElementById('trip-form');
    let editingId = null;
    const API_BASE_URL = 'http://3.37.73.151:3001/api/business';

    const fetchTrips = async () => {
        try {
            const response = await axios.get(API_BASE_URL); // 절대 경로 사용
            tableBody.innerHTML = '';
            response.data.forEach(trip => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${trip.id}</td>
                    <td>${trip.NAME}</td>
                    <td>${trip.COUNTRY}</td>
                    <td>${trip.CITY}</td>
                    <td>${trip.START_DATE}</td>
                    <td>${trip.END_DATE}</td>
                    <td>
                        <button class="edit-btn" data-id="${trip.id}">Edit</button>
                        <button class="delete-btn" data-id="${trip.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

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
