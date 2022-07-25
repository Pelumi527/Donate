import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Container from 'src/components/Container'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { ButtonError } from 'src/components/Button'
import { CurrencyAmount, Currency } from '@sushiswap/core-sdk'
import { calculateGasMargin, maxAmountSpend } from 'src/functions'
import { Field } from 'src/state/donate/action'
import { useApproveCallback, ApprovalState } from 'src/hooks/useApproveCallback'
import { useUSDCValue } from 'src/hooks/useUSDCPrice'
import { useActiveWeb3React } from 'src/services/web3'
import Web3Connect from 'src/components/Web3Connect'
import Button from 'src/components/Button'
import { useDonationContract } from 'src/hooks/useContract'
import { t } from '@lingui/macro'
import { useTransactionAdder } from 'src/state/transactions/hooks'
import Dots from 'src/components/Dots'
import { useLingui } from '@lingui/react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useDonateActionHandlers, useDerivedDonateInfo } from '../../state/donate/hook'
import TransactionConfirmationModal from 'src/modals/TransactionConfirmationModal'
import { ConfirmationModalContent } from 'src/modals/TransactionConfirmationModal'
import { ConfirmDonateModalBottom } from 'src/features/legacy/donate/ConfirmDonateModalBottom'
import Image from 'src/components/Image'
import web3 from '../../../public/web3.svg'
import Typography from 'src/components/Typography'
import { useDonateState } from '../../state/donate/hook'




const Donate = () => {
  const { independentField, typedValue } = useDonateState()
  const { onCurrencySelection, onUserInput } = useDonateActionHandlers()
  const {
    currencyBalance,
    parsedAmount,
    currencies,
    inputError: donateInputerror
  } = useDerivedDonateInfo()

  const isValid = !donateInputerror
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')

  const { account, chainId, library } = useActiveWeb3React()
  const { i18n } = useLingui()
  const DonationContract = useDonationContract();

  const addTransaction = useTransactionAdder()

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const parsedAmounts = useMemo(
    () => {
      return {
        [Field.INPUT]: parsedAmount,
      }
    },
    [parsedAmount]
  )

  console.log(parsedAmount, "parsed")
  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])

  const formatedAmount = {
    [independentField]: typedValue
  }
  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const [approvalState, approveToken] = useApproveCallback(parsedAmounts[Field.INPUT], DonationContract?.address)
  console.log(approvalState, "approve")

  const onDonate = async () => {
    if (!account || !library || !DonationContract) return

    const { [Field.INPUT]: parsedAmount } = parsedAmounts

    console.log({ parsedAmount }, "parsed")

    if (!parsedAmount) {
      return
    }
    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (parsedAmount.currency.isNative) {
      estimate = DonationContract.estimateGas.donateNativeToken
      method = DonationContract.donateNativeToken
      args = []
      value = BigNumber.from(parsedAmount.quotient.toString())
    }
    else {
      estimate = DonationContract.estimateGas.donate
      method = DonationContract.donate
      args = [
        parsedAmount.currency.wrapped.address,
        parsedAmount.quotient.toString()
      ]
      value = null
    }
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then((response) => {
          setAttemptingTxn(false)
          addTransaction(response, {
            summary: i18n._(
              t`Donated ${parsedAmounts[Field.INPUT]?.toSignificant(3)} ${currencies[Field.INPUT]?.symbol}`
            ),
          })
          setTxHash(response.hash)
        }))
      .catch((error) => {
        setAttemptingTxn(false)
        if (error?.code !== 4001) {
          console.error(error)
        }

      })
  }

  // const handleDismissConfirmation= () => {
  //   setShowConfirm(false)
  // }
  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    if (txHash) {
      handleTypeInput("")
    }
    setTxHash("")
  }, [handleTypeInput, txHash])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    // if (approvalState === ApprovalState.PENDING) {
    //   setApprovalSubmitted(true)
    // }
  }, [approvalState, approvalSubmitted])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )


  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalance[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const pendingText = i18n._(
    t`Donating ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${currencies[Field.INPUT]?.symbol}`
  )

  const modalTop = () => {
    return (
      <div className="flex justify-center">
        <div className="flex items-center justify-center">
          <Image src={web3} alt={i18n._(t`web3bridge logo`)} className="mr-10" />
          <Typography component="h2" className="ml-2 font-semibold">
            {i18n._(t`Confirm Donation`)}
          </Typography>
        </div>
      </div>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmDonateModalBottom
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        onDonate={onDonate}
      />
    )
  }

  // <div className="flex flex-col space-y-4">
  //     <div className="intro">
  //       <h1>Giving it back to where we have all started.</h1>
  //       <p>
  //         Web3bridge has been a blessing for all of us. <br />
  //         It's time we give back to where we have all have started.
  //       </p>
  //     </div>
  return (
    <Container className="py-4 md:py-8 lg:py-12">
      {/* <h1 className="text-3xl text-black">Support the Web3Bridge Course</h1> */}
      <div className="flex flex-col space-y-4">
        <div className="mb-6">
          <Typography component="h1" className="mb-3 text-4xl text-black"  >
            {i18n._(t`Giving it back to where we all started`)}
          </Typography>
          <p className="text-xl text-gray-800">
            <span className="font-bold"> Web3bridge </span>{i18n._(t` has been a blessing for all of us.
          It's time we give back to where we have all have started.`)}
          </p>
        </div>
        <CurrencyInputPanel
          value={formatedAmount[Field.INPUT]}
          onUserInput={handleTypeInput}
          currency={currencies[Field.INPUT]}
          showMaxButton={showMaxButton}
          onCurrencySelect={handleInputSelect}
          showCommonBases={true}
          fiatValue={fiatValueInput ?? undefined}
          onMax={handleMaxInput}
          id="donate-input"
        />

        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          hash={txHash}
          attemptingTxn={attemptingTxn}
          content={() => (
            <ConfirmationModalContent
              title={i18n._(t`You are Donating`)}
              onDismiss={handleDismissConfirmation}
              topContent={modalTop}
              bottomContent={modalBottom}
            />
          )}
          pendingText={pendingText}
        />
        <div>
          {!account ? (<Web3Connect size="lg" color="red" className="w-full" />) :
            approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING
              || approvalState === ApprovalState.UNKNOWN && isValid == true ?
              <Button
                color="blue"
                onClick={approveToken}
                disabled={approvalState === ApprovalState.PENDING}
                size="lg">
                {approvalState === ApprovalState.PENDING ? (<Dots>{i18n._(t`Approving`)}</Dots>) :
                  i18n._(t`Approve`)}
              </Button> :
              <ButtonError
                onClick={() => {
                  setShowConfirm(true)
                }}
                color="blue"
                disabled={approvalState !== ApprovalState.APPROVED}
                error={isValid == true && !!parsedAmount[Field.INPUT]}
              >
                {donateInputerror ?? i18n._(t`Donate`)}
              </ButtonError>}
        </div>
      </div>
    </Container>
  )
}

export default Donate
