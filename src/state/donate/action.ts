import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
}

export const selectCurrency = createAction<{
  field: Field
  currencyId: string
}>('donate/selectCurrency')
export const typeInput = createAction<{ field: Field; typedValue: string }>('donate/typeInput')
export const replaceDonateState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
}>('donate/replaceDonateState')
