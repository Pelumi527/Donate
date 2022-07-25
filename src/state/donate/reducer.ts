import { Field, replaceDonateState, typeInput, selectCurrency } from './action'
import { createReducer } from '@reduxjs/toolkit'

export interface DonateState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
}

const initialState: DonateState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: '',
  },
}

export default createReducer<DonateState>(initialState, (builder) => {
  builder
    .addCase(replaceDonateState, (state, { payload: { typedValue, field, inputCurrencyId } }) => {
      return {
        independentField: field,
        typedValue: typedValue,
        [Field.INPUT]: {
          currencyId: inputCurrencyId,
        },
      }
    })
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      return {
        ...state,
        [field]: { currencyId: currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
})
