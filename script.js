        const firebaseConfig = {
          apiKey: "AIzaSyB7E8fEkrGoc6ODFO-2DDSJwPSnNalxyVY",
          authDomain: "calender-v2-14061.firebaseapp.com",
          projectId: "calender-v2-14061",
          storageBucket: "calender-v2-14061.firebasestorage.app",
          messagingSenderId: "114170285429",
          appId: "1:114170285429:web:28c686a2d1b7f36e5ad73c"
        };
      
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Initialize Firestore
        const db = firebase.firestore();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(() => {
      console.log('Service Worker Registered');
    });
  }

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderDate();
    loadEvents();
    initCalendar();
});

let currentDate = new Date();
let selectedDate = null;
let events = JSON.parse(localStorage.getItem('taskEvents')) || {};

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
const viewEventsModal = new bootstrap.Modal(document.getElementById('viewEventsModal'));

function updateHeaderDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = new Date().toLocaleDateString(undefined, options);
}

function saveEvents() {
    // Save to local storage for offline use
    localStorage.setItem('taskEvents', JSON.stringify(events));
  
    // If online, sync events to Firebase
    if (navigator.onLine) {
      syncEventWithFirebase(events);
    }
  }
  
  function syncEventWithFirebase(events) {
    const db = firebase.firestore(); // Ensure Firebase is initialized
  
    events.forEach((event) => {
      db.collection('taskEvents')
        .add(event)
        .then(() => {
          console.log('Event synced to Firebase:', event);
        })
        .catch((error) => {
          console.error('Error syncing event to Firebase:', error);
        });
    });
  }
  
  window.addEventListener('online', () => {
    const events = JSON.parse(localStorage.getItem('taskEvents')) || [];
    syncEventWithFirebase(events);
  });
  
  function loadEvents() {
    if (navigator.onLine) {
      // Online: Fetch events from Firebase
      const db = firebase.firestore();
      db.collection('taskEvents')
        .get()
        .then((querySnapshot) => {
          let events = [];
          querySnapshot.forEach((doc) => {
            events.push(doc.data());
          });
          updateUI(events); // Update your app's UI with the events
        })
        .catch((error) => {
          console.error('Error fetching events from Firebase:', error);
        });
    } else {
      // Offline: Load events from local storage
      const events = JSON.parse(localStorage.getItem('taskEvents')) || [];
      updateUI(events); // Update your app's UI with the events
    }
  }
  
function applyFilter() {
    initCalendar();
}

function saveEvent() {
    const dateStr = formatDate(selectedDate);
    const event = {
        title: document.getElementById('eventTitle').value,
        time: document.getElementById('eventTime').value,
        category: document.getElementById('eventCategory').value,
        description: document.getElementById('eventDescription').value
    };

    if (!events[dateStr]) {
        events[dateStr] = [];
    }
    events[dateStr].push(event);
    
    saveEvents();
    eventModal.hide();
    initCalendar();
    showViewEventsModal();
}

function deleteEvent(eventId) {
    // Delete from local storage
    let events = JSON.parse(localStorage.getItem('taskEvents')) || [];
    events = events.filter((event) => event.id !== eventId);
    localStorage.setItem('taskEvents', JSON.stringify(events));
  
    // Delete from Firebase if online
    if (navigator.onLine) {
      const db = firebase.firestore();
      db.collection('taskEvents')
        .where('id', '==', eventId)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref.delete().then(() => {
              console.log(`Event with ID ${eventId} deleted from Firebase`);
            });
          });
        })
        .catch((error) => {
          console.error('Error deleting event from Firebase:', error);
        });
    }
  }
  

function initCalendar() {
    const calendar = document.getElementById('calendar');
    const grid = calendar.querySelector('.calendar-grid');
    grid.innerHTML = '';

    const filter = document.getElementById('eventFilter').value;

    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'weekday-header';
        header.textContent = day.slice(0, 3);
        grid.appendChild(header);
    });

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell disabled';
        grid.appendChild(cell);
    }

    for (let day = 1; day <= lastDate; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';

        const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-number';
        dateDiv.textContent = day;

        cell.appendChild(dateDiv);

        if (events[dateStr]) {
            const eventContainer = document.createElement('div');
            events[dateStr].forEach(event => {
                if (filter === 'all' || event.category === filter) {
                    const dot = document.createElement('span');
                    dot.className = `event-dot ${event.category}`;
                    eventContainer.appendChild(dot);
                }
            });
            cell.appendChild(eventContainer);
        }

        cell.addEventListener('click', () => {
            selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            showViewEventsModal();
        });

        grid.appendChild(cell);
    }

    document.getElementById('monthYear').textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function showViewEventsModal() {
    const dateStr = formatDate(selectedDate);
    document.getElementById('selectedDate').textContent = selectedDate.toLocaleDateString();
    
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    if (events[dateStr] && events[dateStr].length > 0) {
        events[dateStr].forEach((event, index) => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'card mb-2';
            eventDiv.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-1">${event.title}</h5>
                        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${dateStr}', ${index})">Delete</button>
                    </div>
                    <p class="card-text mb-1">
                        <small class="text-muted">${event.time}</small>
                    </p>
                    <p class="card-text mb-1">
                        <span class="badge bg-${getBadgeColor(event.category)}">${event.category}</span>
                    </p>
                    <p class="card-text">${event.description}</p>
                </div>
            `;
            eventsList.appendChild(eventDiv);
        });
    } else {
        eventsList.innerHTML = '<p>No events for this date</p>';
    }
    
    viewEventsModal.show();
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function showAddEventModal() {
    viewEventsModal.hide();
    document.getElementById('eventForm').reset();
    eventModal.show();
}

function getBadgeColor(category) {
    switch(category) {
        case 'work': return 'primary';
        case 'study': return 'success';
        case 'personal': return 'danger';
        default: return 'secondary';
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    initCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    initCalendar();
}
window.addEventListener('online', () => {
    const offlineEvents = JSON.parse(localStorage.getItem('taskEvents')) || [];
  
    // Sync all events (additions/deletions) to Firebase
    syncEventWithFirebase(offlineEvents);
  
    // Optionally clear offline storage after syncing
    localStorage.removeItem('taskEvents');
  });
  
  function updateUI(events) {
    // Clear the existing calendar/task list
    const eventContainer = document.getElementById('event-container');
    eventContainer.innerHTML = '';
  
    // Render each event
    events.forEach((event) => {
      const eventElement = document.createElement('div');
      eventElement.textContent = `${event.title} - ${event.date}`;
      eventContainer.appendChild(eventElement);
    });
  }
  
