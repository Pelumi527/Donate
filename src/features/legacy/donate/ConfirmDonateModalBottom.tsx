import { Currency, CurrencyAmount, Fraction, Percent } from '@sushiswap/core-sdk'
import { Field } from 'src/state/donate/action'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import Button from 'src/components/Button'

export function ConfirmDonateModalBottom({
    currencies,
    parsedAmounts,
    onDonate,
}: {
    currencies: { [field in Field]?: Currency }
    parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
    onDonate: () => void
}) {
    const { i18n } = useLingui()
    return (
        <div className="p-6 mt-0 -m-6 bg-blue-800 rounded">
            <div className="grid gap-1 pb-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary">{i18n._(t`${currencies[Field.INPUT]?.symbol} Donated`)}</div>
                    <div className="text-sm font-bold justify-center items-center flex right-align pl-1.5 text-high-emphesis">
                        <div>{parsedAmounts[Field.INPUT]?.toSignificant(6)}</div>
                        <span className="ml-1">{parsedAmounts[Field.INPUT]?.currency.symbol}</span>
                    </div>
                </div>
            </div>
            <Button color='blue' size="lg" onClick={onDonate}>
                {i18n._(t`Confirm Donate`)}
            </Button>
        </div>
    )
}