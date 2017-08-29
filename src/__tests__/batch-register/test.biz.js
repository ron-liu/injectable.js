import {injectable} from '../../index'


export const add = injectable()(({}, {a,b})=> a+b)

export const divide = injectable()(({}, {a,b}) => a/b)

export const average = injectable({
	injects: ['add', 'divide']
})(
	({add, divide}, {a,b}) => {
		const sum = add({a,b})
		return divide({a: sum ,b:2})
	}
)