# Simple Compiler
Custom rule builder language , compiler and executer for conditions and counters.  
Safe-Sandbox instead of using eval()
Live Demo : https://solid-droid.github.io/SimpleCompiler/  
  
# How To Use:  
  
HTML  
```html
<script src="simpleCompiler.js"></script> 
```  
JS  
```javascript
let expression = '( 1 + 1 ) > 1' ;

let engine = new SimpleCompiler();
const{output , fail} =  engine.compileAndExecute(expression);
//output = true , fail = false
```
> supporter parameters
```
expression : string, 
machines : any[], 
postOperation = 'AND' | 'OR' | 'counter',
id : any
```
# Methods  

To compile only
```javascript
const{output , fail} =  engine.compile(expression);

//output = compiled code , fail = false
//output = error message  , fail = true
```

To execute only 
```javascript
const{output , fail} =  engine.execute(compiledCode);

//output = compiler rules , fail = false
//output = error message  , fail = true
```
> supporter parameters
```
compiledCode : <compiledCode array>[], 
machines : any[], 
postOperation = 'AND' | 'OR' | 'counter',
id : any
```

To add custom properties
```javascript
const properties = {PropertyMain1 : [PropertySub1, PropertySub2, ... ] ,
                    PropertyMain2 : [PropertySub1, PropertySub2, ... ]};
//to reset 
engine.updateProperties(properties);

//to append properties 
engine.updateProperties(properties , false);

```

# Attributes

```javascript
let engine = new SimpleCompiler(<expression : string> , {
{
  //return data to executer (return is must)
  data : (machine, PropertyMain, PropertySub) => return value , //properties
  counter  : name  =>  return value , 
  constant : name =>  return value , 
  
  //output data from executer (no need of return)
  assign : (machine, property, type , value, id) => { ... } , //asignProperties
  action : (name, type) => { ... } , //type = play | pause
  error  : error => console.log(error)
  
  
  properties      : {PropertyMain1 : [<PropertySub1 :string> , PropertySub2, ... ] ,
                    PropertyMain2 : [PropertySub1, PropertySub2, ... ]}, 
  asignProperties : {PropertyMain1 : [<PropertySub1 :string> , PropertySub2, ... ] ,
                    PropertyMain2 : [PropertySub1, PropertySub2, ... ]}, 
  machines: [ <machine1 :string> , machine2, ]
 }
});
```

# Expression Syntax

```
Operators.............................

Brackets      : ( , )
Ternary       : condition ? success :  fail
Conditions    : OR , AND , >, >= , == , <=, < , !=
Arithmetic    : + , - , * , / 
Booleans	    : true , false 
Variables     : name.counter, name.constant, 
Actions       : name.play, name.pause,
Property      : PropertyMain.PropertySub

Rules..................................
1. Atleas one space is must between all operators
2. chaining of condition / arithmetic operators are not allowed 
              => always use bracket to link more than one condition.
3. BODMAS rule not valid 
              => Bracket has higher priority ,
                 all other operators have same priority (left to right execution)
4. For string, use single quotes.
5. No space is allowed in string type / name => use underscore as a workaround.

```
