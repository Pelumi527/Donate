import application from './application/reducer'
import burn from './burn/reducer'
import { combineReducers } from '@reduxjs/toolkit'
import lists from './lists/reducer'
import multicall from './multicall/reducer'
import transactions from './transactions/reducer'
import user from './user/reducer'
import donate from './donate/reducer'

const reducer = combineReducers({
  application,
  user,
  transactions,
  burn,
  multicall,
  lists,
  donate,
})

export default reducer
