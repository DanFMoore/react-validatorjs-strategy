# React validatorjs strategy

Strategy for using [validatorjs](https://github.com/skaterdav85/validatorjs) with [react-validation-mixin](https://github.com/jurassix/react-validation-mixin).

The strategy interface for `react-validation-mixin` is defined [here](https://jurassix.gitbooks.io/docs-react-validation-mixin/content/overview/strategies.html) and that is what this library implements as an interface for  [validatorjs](https://github.com/skaterdav85/validatorjs).

## Installation

### Browser

First follow the instructions to install [validatorjs](https://github.com/skaterdav85/validatorjs) (tested with version 3.9) and then download `dist/strategy.min.js` and include via a script tag:

```html
<script src="dist/strategy.min.js" type="text/javascript"></script>
```

Or you can install with bower:

```
bower install react-validatorjs-strategy
```

### Node

Requires at least Node 4.0.0.

On the command line type:

```
npm install react-validatorjs-strategy
```

Then in your JavaScript file:

```javascript
var strategy = require('react-validatorjs-strategy')
```

This also works if you're using `webpack` or `browserify` to compile your React components.

## Usage

A working example containing the below can be found at <https://github.com/TheChech/react-tutorial>.

### In React components

`react-validation-mixin` requires a component to be validated to have `this.validatorTypes` defined. To create this, call `strategy.createSchema` either in the constructor if you're using classes, or in a function which is run very early, such as `getInitialState`. This method takes one required parameter and two optional ones:

```javascript
this.validatorTypes = strategy.createSchema(
    // First parameter is a list of rules for each element name
    {
        name: 'required',
        email: 'required|email',
        age: 'min:18'
    },
    // Second parameter is optional and is a list of custom error messages for elements
    {
        "required.email": "Without an :attribute we can't reach you!"
    }
    // Third parameter is also optional; a callback that takes the validator instance created
    // and can be used to call methods on it. This is run at the point of validation.
    function (validator) {
        validator.lang = 'ru';
    }
);
```

To call the validation on for example a form submission:

```javascript
handleSubmit = function (e) {
    e.preventDefault();

    this.props.validate(function (error) {
        if (!error) {
            // Submit the data
        }
    });
},
```

The use of this strategy makes no difference to how the validation is handled in the render method, but just for the sake of completeness, triggering the validation on blur and then rendering any validation messages under the element:

```html
<input
    name='name'
    type='text'
    placeholder='Your name'
    onBlur={this.props.handleValidation('name')}
/>

{this.props.getValidationMessages('name')}
```

Then after the component is defined:

```javascript
Component = validation(strategy)(Component);
```

#### Validating onChange

I prefer to validate on the change event of an input to get immediate feedback. However, this has a problem. If for example, you're validating for an email address, as soon as the user enters one character the field will be flagged up as invalid, even though they've not yet had a chance to enter valid data. What ideally should happen is that the field is not validated for the first time until it is blurred out and from then on, any change should be validated immediately.

To achieve this, there is another way of creating validation schemas; `createInactiveSchema`. This is called in exactly the same way, but all rules are turned off by default until `activateRule` is enabled, which should be called with `onBlur`.

An example:

```javascript
this.validatorTypes = strategy.createInactiveSchema(...);
```

Then the events bound to the element have to be changed slightly:

```html
<input
    type="text"
    placeholder="Your name"
    name="name"
    value={this.state.name}
    onBlur={this.activateValidation}
    onChange={this.handleChange}
/>
```

These methods have to be created in the component:

```javascript
/**
 * Activate the validation rule for the element on blur
 *
 * @param {Event} e
 */
activateValidation(e) {
    strategy.activateRule(this.validatorTypes, e.target.name);
    this.props.handleValidation(e.target.name)(e);
},
/**
 * Set the state of the changed variable and then when set, call validator
 *
 * @param {Event} e
 */
handleChange(e) {
    var state = {};
    state[e.target.name] = e.target.value;

    this.setState(state, () => {
        this.props.handleValidation(e.target.name)(e);
    });
},
```

Submitting the whole form (when `this.props.validate` is called) works the same way; it automatically activates all rules.

### Registering Custom Validation Rules

The Validator, accessible through the 3rd parameter of strategy.createSchema, enables [registering custom validations](https://github.com/skaterdav85/validatorjs#registering-custom-validation-rules).

```javascript
this.validatorTypes = strategy.createInactiveSchema({
  username: 'required|usernameAvailable',
}, {

  }, function(validator) {
  validator.constructor.registerAsync('usernameAvailable', function(username, attribute, req, passes) {
    // do your database/api checks here etc
    // then call the `passes` method where appropriate:
    passes(); // if username is available
    passes(false, 'Username has already been taken.');
  });
}
```

### On the server (e.g. in Express)

The validation can also be used isomorphically both in the browser in React components and on the server. This is done by creating the schema in the same way and then calling `validateServer` which returns a promise; the rejection of which can be handled by an error handler. Because the rejection returns an instance of `strategy.Error` it can be easily identified.

As an example in Express:

```javascript
app.post('/contact', function (req, res, next) {
    var schema = strategy.createSchema(...);

    strategy.validateServer(req.body, schema).then(function () {
        // Submit the data
    })
    .catch(next);
}

/**
 * If a validation error, output a 400 JSON response containing the error messages.
 * Otherwise, use the default error handler.
 */
app.use(function (err, req, res, next) {
    if (err instanceof strategy.Error) {
        res.status(400).json(err.errors);
    } else {
        next(err, req, res);
    }
});
```

Using this method also activates all rules if `createInactiveSchema` was used.

## Testing

Simply clone the repository, run `npm install` and then run `npm test`. The tests are in `tests/strategySpec.js`.
