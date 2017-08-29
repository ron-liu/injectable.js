// @flow

import type {Fn1} from './basic-types'
import type {RawBizFunc, InjectableOption} from './types'

export const injectable: Fn1<InjectableOption, Fn1<RawBizFunc, RawBizFunc>> = (option = {}) => rawBizFunc =>{
	rawBizFunc.injectable = option
	return rawBizFunc
}
