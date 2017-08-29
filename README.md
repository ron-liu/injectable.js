injectable.js
=========
A extendable IoC container 

[![Build Status](https://travis-ci.org/ron-liu/injectable.js.svg?branch=master)](https://travis-ci.org/ron-liu/injectable.js)

## Installation

  `yarn install injectable.js`
  
  `npm install injectable.js`

## Usage
```javascript
import {createCore, injectable} from 'injectable.js'

const core = createCore()

const add = injectable()(({}, {a,b})=> a+b)
const divide = injectable()(({}, {a,b}) => a/b)

const average = injectable({
	injects: ['add', 'divide']
})(
	({add, divide}, {a,b}) => {
		const sum = add({a,b})
		return divide({a: sum ,b:2})
	}
)

core.addService('add', add);
core.addService('divide', divide);
core.addService('average', average);

expect(core.getService('average')({a:4, b:2})).toEqual(3)

```

## Tests

  `yarn test`

## Contributing