class SimpleCompiler {
    conditionOperators = ['==', '>', '<', '>=', '<=', '!=', 'AND', 'OR' , 'IN', 'LIKE', 'UNLIKE'];
	mathOperators = ['+', '-', '*', '/', '='];
	brackets = ['(', ')'];
	variables = ['counter', 'constant', 'play'];
	booleans = ['true', 'false', 'BREAK'];
	ternary = ['?', ':'];
    properties = {};
    asignProperties = {};
    compilerProperties = {};
    parsedRule = null;
    error = '';
    errorFunc = null;
    dataFunc = null;
    actionFunc = null;
    assignFunc = null;
    counterFunc = null;
    constantFunc = null;
    machines = [];
    postOperation;
    id = 0;
    expression =  'counter';
    
    constructor(expression = '', 
    {
       // methods
        data,
        counter,
        constant,
        assign,
        action, 
        error, 
        //attributes
        properties, 
        asignProperties,
        machines = ['<machineID>'] , 
        postOperation = 'counter'
    }={}){
        this.expression = expression;
        this.machines = machines;
        this.postOperation = postOperation;

        this.dataFunc = data;
        this.errorFunc = error;
        this.actionFunc = action;
        this.assignFunc = assign;
        this.counterFunc = counter;
        this.constantFunc = constant;
        this.asignProperties = asignProperties;

        if(properties) {
            this.updateProperties(properties);
        } else {
            this.updateProperties({});
        }
    }
    
    updateProperties(properties , reset = true){
        if(reset){
            this.properties = properties;
        } else {
            this.properties = {...this.properties, ...properties};
        }
        this.compilerProperties = {...this.properties, ...this.asignProperties};

    }

    compileAndExecute(expression = this.expression, machines = this.machines, postOperation = this.postOperation , id = 0){
        this.id = id;
        this.expression = expression;
        this.machines = machines;
        this.postOperation = postOperation;
        const {output , fail} = this.compile(expression);
        if(!fail){
            return this.execute(output, machines, postOperation, id);
        } else {
            return {output , fail};
        }
       
    }
    compile(expression = this.expression) {
       this.expression = expression;
       const _parsed = this.ruleParser(expression)
       this.parsedRule = _parsed;
       if(!_parsed ){
        return {output : this.error , fail: true};
       } else {
        return {output : _parsed , fail: false};
       }
    }

    execute(parsedRule = this.parsedRule, machines = this.machines, postOperation = this.postOperation, id =0 ){
        this.id = id;
        this.parsedRule = parsedRule;
        this.machines = machines;
        this.postOperation = postOperation;
        if(Array.isArray(parsedRule)){
           const splitRules = this.getSplitRules(parsedRule);
           if(splitRules.length>1){
            const results = [];
            splitRules.forEach(rule => {
                results.push({output: this.ruleLoop(machines, rule, postOperation, id), fail:false});
            });
            return results;
           } else {
            return {output: this.ruleLoop(machines, splitRules[0] , postOperation, id), fail:false};
           }
        } else {
            return {output: 'Please compile before executing', fail: true};
        }
        
    }

    getSplitRules(parsedRule){
        const splitArrays = [];
        let lastIndex = 0;
        parsedRule.forEach((x,i) => {
            if(x.type === 'control'&& x.module === 'operator' && x.value === 'BREAK'){
                splitArrays.push(parsedRule.slice(lastIndex, i));
                lastIndex = i+1;
            }
        });
        splitArrays.push(parsedRule.slice(lastIndex, parsedRule.length));
        return splitArrays;
    }
////////////////////////////////////////////////////////////////////////////////////////
    parserError (error = 'Syntax error. Unable to compile') {
        this.error = error;
        if(this.errorFunc){
            this.errorFunc(error);
        }
	}

    operatorParser2(parser, element) {
		let error = false;
		if (this.booleans.includes(element[0])) {
            if(element[0] == 'BREAK'){
                parser.push({ 
                    module: 'operator', 
                    value: element[0], 
                    type: 'control' });
            } else {
                parser.push({ 
                    module: 'constant', 
                    value: element[0]=='true' ? true : false, 
                    type: 'boolean' });
            }
		} else if (!isNaN(element[0])) {
            let num;
            if(element[1]){
                num = element.join('.');
            } else {
                num = element[0];
            }
			parser.push({ module: 'constant', value: parseFloat(num), type: 'number' });
		} else {
			// invalid operator
			error = true;
			this.parserError('invalid operator');
		}
		return {parser , error};
	}

operatorParser(parser, element, ternaryCounter, bracketCounter) {
		let error = false;
		//operator
		if (this.conditionOperators.includes(element[0])) {
			parser.push({ module: 'operator', value: element[0], type: 'condition' });
		} else if (element[0] === '?') {
			ternaryCounter++;
			parser.push({ module: 'ternary', value: `S${ternaryCounter}`, type: null , index : parser.length  });
		} else if (element[0] === ':') {
			if (ternaryCounter < 1) {
				error = true;
				this.parserError('invalid use of Ternary operator');
			}
			parser.push({ module: 'ternary', value: `E${ternaryCounter}`, type: null });
			ternaryCounter--;
		} else if (element[0] === '(') {
			bracketCounter++;
			parser.push({ module: 'bracket', value: `O${bracketCounter}`, type: null , index : parser.length  });
		} else if (element[0] === ')') {
			if (bracketCounter < 1) {
				error = true;
				this.parserError('invalid use of Brackets');
			}
			parser.push({ module: 'bracket', value: `C${bracketCounter}`, type: null });
			bracketCounter--;
		} else if (this.mathOperators.includes(element[0])) {
			parser.push({ module: 'operator', value: element[0], type: 'arithmetic' });
		} else {
			const data = this.operatorParser2(parser , element);
			parser = data.parser;
			error = data.error;
		}
		return { parser, error, ternaryCounter, bracketCounter };
	}

variableParser(parser, element) {
		let error = false;
		//variable
		if (element[1] === 'constant') {
			parser.push({ module: 'constant', value: element[0], type: 'variable' });
		} else if (element[1] === 'counter') {
			parser.push({ module: 'counter', value: element[0], type: null });
		} else if (element[1] === 'play' || element[1] === 'pause') {
			parser.push({ module: 'action', value: element[0], type: element[1] });
		} else if (Object.keys(this.compilerProperties).includes(element[0].toLowerCase())) {
			if (this.compilerProperties[element[0].toLowerCase()].includes(element[1].toLowerCase())) {
				parser.push({ module: 'property', value: element[0], type: element[1] });
			} else {
				error = true;
				this.parserError('Invalid property');
			}
		} else {
			//invalid property
			error = true;
			this.parserError('invalid variable type');
		}
		return { parser, error };
	}

ternaryParser(parser) {
		const slist = [], elist = [];
		parser.forEach((x, i) => {
			if (x.module === 'ternary') {
				if (x.value.charAt(0) === 'S') {
					slist.push({ index: i, count: x.value.charAt(1) });
				} else {
					elist.push({ index: i, count: x.value.charAt(1) });
				}
			}

		});
		slist.forEach((x, i) => {
			const element = elist.find(y => y.count === x.count);
			const index = elist.indexOf(element);
			parser[slist[i].index].type = element.index;
			if (index > -1) {
				elist.splice(index, 1);
			}
		});
		return parser;
	}

bracketParser(parser) {
		const olist = [], clist = [];
		parser.forEach((x, i) => {
			if (x.module === 'bracket') {
				if (x.value.charAt(0) === 'O') {
					olist.push({ index: i, count: x.value.charAt(1) });
				} else {
					clist.push({ index: i, count: x.value.charAt(1) });
				}
			}

		});
		olist.forEach((x, i) => {
			const element = clist.find(y => y.count === x.count);
			const index = clist.indexOf(element);
			parser[olist[i].index].type = element.index;
			if (index > -1) {
				clist.splice(index, 1);
			}
		});
		return parser;
	}

ruleParser(expression) {
		///////////////////lexer
		expression = (expression.replace(/\s\s+/g, ' ')).replace(/\r?\n|\r/g, ' ').trim();
        const _keys = expression.split("'");
        let keys =[];
        _keys.forEach((item , i ) => {
            if(i%2!==0) {
                keys.push(`'${item}'`);
            } else {
                keys.push(...item.split(' '))
            }
        })
        keys = keys.filter(x => x !== '');

        /////////////////////////////////
		let parser = [];
		let error = false;
		let ternaryCounter = 0;
		let bracketCounter = 0;
   		
        keys.forEach(item => {
			const element = item.split('.');
			if (!error) {
                if(item[0] === `'`) {
                    parser.push({ module: 'constant', value: item.slice(1, -1), type: 'string' });
                } else {
                    if (element.length === 1 || !isNaN(element[1])) {
                        const data = this.operatorParser(parser, element, ternaryCounter, bracketCounter);
                        parser = data.parser;
                        error = data.error;
                        ternaryCounter = data.ternaryCounter;
                        bracketCounter = data.bracketCounter;
                    } else if (element.length === 2) {
                        const data = this.variableParser(parser, element);
                        parser = data.parser;
                        error = data.error;
                    } else {
                        //invalid syntax
                        error = true;
                        this.parserError();
                    }
                }
				
			}
		});
		if (!error) 
        {
            if(ternaryCounter !== 0) {
                error = true;
                this.parserError('missing else condition for a ternary operator');
            } else {
                parser = this.ternaryParser(parser);
            }
            if (bracketCounter !== 0) {
                error = true;
                this.parserError('missing closing brackets');
            } else {
                parser = this.bracketParser(parser);
            }
        }

		return !error ? parser : false;
	}
/////////////////////////////////////////////////////////////////////////////////////
findData( property , type , machine, id){
    let result = 0;
    if (Object.keys(this.asignProperties).includes(property)) {
        result = `${property}-${type}-${machine}`
    } else {
        if(this.dataFunc){
            result = this.dataFunc(machine, property, type, id);
            if(!result){
                result = 0;
            }
        }
    }
    return result;
}

findConstant(value , type) {
    if(type === 'variable'){
        let result = 0
        if(this.constantFunc){
            result = this.constantFunc(value);
            if(!result){
                result = 0;
            }
        }
        return result;
    } else {
        return value;
    }
}

findCounter(counter){
    let result =0;
    if(this.counterFunc){
        result = this.counterFunc(counter);
        if(!result){
            result = 0;
        }
    }
    return result;
}

asignAction(action , value){
    if(this.assignFunc){
        const [property , type , machine ] = action.split('-');
        this.assignFunc(machine , property , type , value, this.id);
        return true;
    } else {
        return false;
    }
}

playAction(tune, type, machine, id) {
    if(this.actionFunc){
        this.actionFunc(tune, type, machine , id);
    }
    return false;
}

equals = (a , b) => a == b ? true : false; 
greaterthan = (a , b) => a > b ? true : false; 
lessthan = (a , b) => a < b ? true : false; 
greaterthanEqual = (a , b) => a >= b ? true : false; 
lessThanEqual = (a , b) => a <= b ? true : false; 
notEqual = (a , b) => a != b ? true : false; 
oppAnd = (a , b) => a && b ? true : false; 
oppOr = (a , b) => a || b ? true : false; 
add = (a , b) => a + b; 
sub = (a , b) => a - b; 
mult = (a , b) => a * b; 
div = (a , b) => a / b; 
in = (a , b) => b.includes(a);
like = (a , b) => a.includes(b);

findResult([data1, data2], opp) {
    let result = false;
    switch(opp){
        case '==' : 
        result = this.equals(data1 , data2);
        break;
        
        case '>'  : 
        result = this.greaterthan(data1, data2);
        break;

        case '<'  : 
        result = this.lessthan(data1, data2);
        break;
        
        case '>=' : 
        result = this.greaterthanEqual(data1, data2);
        break;
        
        case '<=' : 
        result = this.lessThanEqual(data1, data2);
        break;
        
        case '!=' : 
        result = this.notEqual(data1, data2);
        break;
        
        case 'AND': 
        result = this.oppAnd(data1 , data2);
        break;
        
        case 'OR' : 
        result = this.oppOr(data1 , data2);
        break;
        
        case '+'  : 
        result = this.add(data1 , data2);
        break;
        
        case '-'  : 
        result = this.sub(data1 , data2);
        break;
        
        case '*'  : 
        result = this.mult(data1 , data2);
        break;

        case '/'  : 
        result = this.mult(data1 , data2);
        break;

        case '=' :
        result = this.asignAction(data1, data2);
        break;

        case 'IN' :{
            if(typeof data2 == 'number') {
                data2 = String(data2);
            }
            if(typeof data1 == 'number') {
                data1 = String(data1);
            }
        const _arr = data2.split(',').map(x => x.trim());
        result = this.in(data1, _arr);
        break;
        }
        case 'LIKE' :{
            if(typeof data2 == 'number') {
                data2 = String(data2);
            }
            if(typeof data1 == 'number') {
                data1 = String(data1);
            }
        const _arr = data2.split(',').map(x => x.trim());
        result = false;
        _arr.forEach(x => {
            if(this.like(data1, x)){
                result = true;
            }
        }) 
        break;
        }
        case 'UNLIKE' :{
            if(typeof data2 == 'number') {
                data2 = String(data2);
            }
            if(typeof data1 == 'number') {
                data1 = String(data1);
            }
        const _arr = data2.split(',').map(x => x.trim());
        result = false;
        _arr.forEach(x => {
            if(!this.like(data1, x)){
                result = true;
            }
         }) 
        break;
        }
        default: break;
    }
    return result;
}

ruleExecuter (machine, rules, depth=0 , id) {
    let result = false;
    let End = rules.length;
    let data;
    let resultUpdate = false;
    let opp;
    let oppType;
    for(let index = 0; index < End; ++index){
        const rule = rules[index];
         if(rule.module === 'bracket' && rule.type){
            const _dat = this.ruleExecuter(machine ,[...rules].splice(index+1,rule.type-rule.index-1),depth+1, id);
            index += rule.type-rule.index;
            if (opp) {
                result = this.findResult([data ,_dat], opp)
                resultUpdate = true;
                opp = undefined;
            } else {
                data = _dat;
                result = data;
                resultUpdate = true;
            }
        } else if (['property','constant','counter', 'action'].includes(rule.module)) {
            let _dat;
            switch (rule.module) {
                case 'property' : 
                    _dat = this.findData(rule.value, rule.type, machine, id);
                    break;
                case 'constant' :
                    _dat = this.findConstant(rule.value, rule.type);
                    break;
                case 'action'  :
                    _dat = this.playAction(rule.value, rule.type,machine, id);
                    break;
                case 'counter' :
                    _dat = this.findCounter(rule.value)
                    break;
                default : break;
            }
            if(opp){
                if(oppType == "arithmetic") {
                    data = this.findResult([data,_dat], opp);
                    result = data;
                    resultUpdate = true;
                } else {
                    result =  this.findResult([data,_dat], opp);
                    resultUpdate = true;
                    data = undefined;
                }
                opp = undefined;
            }else{
                data = _dat;
            }

        } else if (rule.module === "operator"){
            opp = rule.value;
            oppType = rule.type;
        } else if (rule.module === "ternary" && rule.type) {
            const _end = index + rule.type - rule.index;
               resultUpdate = false;
            if(result){
                End = _end;
            } else {
                index = _end;
            }
        }

    }
    if(data && !resultUpdate){
        result = data;
    }
    return result;
};
ruleLoop(machines, rules , type, id) {
    const result = [];
    let output;
    machines.forEach(asset => {
        result.push(this.ruleExecuter(asset, rules, 0 , id)); 
    });
    output = result[0];
    if(type !== 'counter'){
        result.forEach(x => {
            if(type === 'AND'){
                output = output && x ? true : false;
            } else {
                output = output || x ? true : false;
            }
        })
    }
    return output;
}

}