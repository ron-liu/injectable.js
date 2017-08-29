import {createCore} from '../'

let core
beforeAll(()=> {
	core = createCore()
	const factorial = ({factorial: f}, {n}) => {
		
		if (n > 1) return f({n:n-1}) * n
		return 1
	}
	core.buildAndAddService({
		name: 'factorial',
		option: {
			injects: ['factorial']
		},
		func: factorial
	})
})
test('should work', () =>{
	expect(core.getService('factorial')({n:3})).toEqual(6)
})
