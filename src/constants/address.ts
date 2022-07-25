import { ChainId } from '@sushiswap/core-sdk'

export const WEB3BRIDGE_DONATION_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MATIC_TESTNET]: '0xD6E9c4B2619f314DF16a7C998Ab9628faaFacF08',
}
