const { createStore, applyMiddleware } = require('redux');
const { createMiddleware, EventHelpers, Extensions } = require('redux-gtm');

/*
 * Define Redux actions
 */
const CHANGE_ROUTE = 'CHANGE_ROUTE';
const DISPLAY_ALERT = 'DISPLAY_ALERT';
const MULTIPLE_EVENTS = 'MULTIPLE_EVENTS';

const initialState = {
  currentRoute: '/',
  isConnected: true,
};

/*
 * Return a new state for a given action
 */
function reducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_ROUTE: {
      return Object.assign({}, state, { currentRoute: action.payload });
    }
    case 'CONNECTION_LOST': {
      return Object.assign({}, state, { isConnected: false });
    }
    case 'CONNECTION_MADE': {
      return Object.assign({}, state, { isConnected: true });
    }
    default:
      return state;
  }
}

/*
 * Map Redux actions to GTM events
 */
const eventDefinitionsMap = {
  CHANGE_ROUTE: {
    eventFields: (prevState, action) => EventHelpers.createGApageview(action.payload),
  },
  MULTIPLE_EVENTS: {
    eventFields: (prevState, action) => EventHelpers.createGAevent({
      eventCategory: 'multiple events',
      eventValue: 'some value',
    })
  },
};

const logger = Extensions.logger();
const isConnected = state => state.isConnected;
const offlineStorage = Extensions.OfflineStorage.indexedDB(isConnected);

/*
 * Create the Redux store to manage the app state
 */
const analyticsMiddleware = createMiddleware(eventDefinitionsMap, { logger, offlineStorage });
const store = createStore(reducer, applyMiddleware(analyticsMiddleware));

window.addEventListener('offline', () => {
  store.dispatch({ type: 'CONNECTION_LOST' });
});
window.addEventListener('online', () => {
  store.dispatch({ type: 'CONNECTION_MADE' });
});

/*
 * Fill the page container with different content depending on the
 * value of the currentRoute state property
 */
function updatePage() {
  const state = store.getState();
  const pageContainer = document.getElementById('page');
  if (state.currentRoute === '/') {
    pageContainer.innerHTML = '<p>This is the home page content</p>';
  } else if (state.currentRoute === '/page1') {
    pageContainer.innerHTML = "<p>This is page1's content</p>";
  } else if (state.currentRoute === '/page2') {
    pageContainer.innerHTML = "<p>This is page2's content</p>";
  }
}

/*
 * Update the page whenever the Redux state changes
 */
store.subscribe(updatePage);

/*
 * Dispatch a CHANGE_ROUTE action when the user clicks a nav link,
 * assign the new route in the action payload.
 */
document.getElementById('nav-link-home').addEventListener('click', function() {
  store.dispatch({ type: CHANGE_ROUTE, payload: '/' });
});

document.getElementById('nav-link-page1').addEventListener('click', function() {
  store.dispatch({ type: CHANGE_ROUTE, payload: '/page1' });
});

document.getElementById('nav-link-page2').addEventListener('click', function() {
  store.dispatch({ type: CHANGE_ROUTE, payload: '/page2' });
});

/*
 * Dispatch a DISPLAY_ALERT action when the user clicks the display
 * alert button
 */
document.getElementById('button').addEventListener('click', function() {
  store.dispatch({ type: DISPLAY_ALERT });
});

document.getElementById('multiple-events').addEventListener('click', function() {
  store.dispatch({ type: 'MULTIPLE_EVENTS' });
});

module.exports = {
  store,
};
