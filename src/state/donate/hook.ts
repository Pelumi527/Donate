import { AppState } from '../index'
import { useAppDispatch, useAppSelector } from '../hooks'
import { Currency, ChainId, CurrencyAmount } from '@sushiswap/core-sdk'
import { Field, selectCurrency, typeInput } from './action'
import { useCallback } from 'react'
import { useLingui } from '@lingui/react'
import { useActiveWeb3React } from 'src/services/web3'
import { useCurrency } from 'src/hooks/Tokens'
import { t } from '@lingui/macro'
import { useCurrencyBalance } from '../wallet/hooks'
import { tryParseAmount } from 'src/functions'

export function useDonateState(): AppState['donate'] {
  return useAppSelector((state) => state.donate)
}

export function useDonateActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken
            ? currency.address
            : currency.isNative && currency.chainId !== ChainId.CELO
            ? 'ETH'
            : '',
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onCurrencySelection,
    onUserInput,
  }
}

export function useDerivedDonateInfo(doArcher = false): {
  currencies: { [field in Field]?: Currency }
  currencyBalance: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError: string
} {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
  } = useDonateState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const relevantTokenBalance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)
  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)
  const currencyBalance = {
    [Field.INPUT]: relevantTokenBalance,
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
  }

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!currencies[Field.INPUT]) {
    inputError = inputError ?? i18n._(t`Select a token`)
  }

  if (!parsedAmount) {
    inputError = inputError ?? i18n._(t`Enter an amount`)
  }

  const [balanceIn] = [currencyBalance[Field.INPUT]]
  console.log(balanceIn, 'balance')

  if (balanceIn && parsedAmount && balanceIn.lessThan(parsedAmount)) {
    inputError = i18n._(t`Insufficient ${parsedAmount.currency.symbol} balance`)
  }

  return {
    currencies,
    currencyBalance,
    parsedAmount,
    inputError,
  }
}
