import reduxThunk from 'redux-thunk'
import { applyMiddleware, combineReducers, createStore } from 'redux'

import { connectStore as connectXo } from '../xo'

import reducer from './reducer'

// ===================================================================

const store = createStore(combineReducers(reducer), applyMiddleware(reduxThunk))

connectXo(store)

export default store
