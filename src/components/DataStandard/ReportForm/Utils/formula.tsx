import { schema } from '@/ts/base';

var forms: schema.XForm[] = [];

export const analysisFormula = (str: string, rule: any) => {
  if (!isFormula(str)) {
    console.log('无效公式！');
    return;
  }

  const regex = /\{(.*?)\}/g;
  let formluaArr: any[] = [];
  let formulaObj: any = {
    execute: [],
    trigger: [],
    failExecute: [],
    message: rule.remark,
  };

  const analysisMatches = (matches: any, str: string, msg: string) => {
    let res = intercept(matches, str);
    res.forEach((item: any) => {
      item.formulaType = formulaObj.formulaType;
      item.trigger = [...formulaObj.trigger, ...item.trigger];
      item.jsCondition = formulaObj.jsCondition;
      item.message = msg;
      if (formulaObj.formulaType === 'check') {
        item.checkData = item.cleanedExpression;
      } else {
        item.execute = [item.cleanedExpression];
      }
    });
    return res;
  };

  const analysisExpression = (newStr: any) => {
    const res = parseExpression(newStr);
    formulaObj.trigger = [...formulaObj.trigger, ...res.trigger];
    if (formulaObj.formulaType === 'check') {
      formulaObj.checkData = res.cleanedExpression;
    } else {
      formulaObj.execute.push(res.cleanedExpression);
    }
    formluaArr.push(formulaObj);
  };

  if (str.includes('vif') || str.includes('chk')) {
    let trimmedStr: any;
    const regex2 = /\(([^()]*)\)/;
    const matchResult = str.match(regex2);
    if (matchResult && matchResult[1]) {
      trimmedStr = matchResult[1]; // 结果存放在第二个元素 [1] 中
    } else {
      console.log('无效公式！！！');
    }
    const chkRegex = /,(?![^[\]]*\])(?![^{}]*\})/g; /** 根据,匹配，不包含[]和{}里的, */
    const splitRes = trimmedStr.split(chkRegex);
    let middleComma, afterComma, beforeComma, matches;
    /** 左侧条件 */
    beforeComma = splitRes[0];
    if (beforeComma.indexOf('like') != -1) {
      const parts = beforeComma.split(' like ');
      const params = parts[0];
      const condition = parts[1].replace(/%/g, '');
      const obj = parseExpression(params);
      formulaObj = Object.assign(formulaObj, obj);
      formulaObj.jsCondition = `${obj.cleanedExpression.trim()}.startsWith(${condition})`;
    } else {
      const parts = beforeComma.split('==');
      const obj = parseExpression(parts[0]);
      const rightSide = parts[1].replace(/["']/g, '');
      formulaObj = Object.assign(formulaObj, obj);
      formulaObj.jsCondition = `${obj.cleanedExpression.trim()} == "${rightSide.trim()}"`;
    }
    /** 右侧公式 */
    if (str.includes('chk')) {
      formulaObj.formulaType = 'check';
      middleComma = splitRes[1];
      afterComma = splitRes.length === 3 ? splitRes[2] : '';
      matches = middleComma.match(regex);
      formulaObj.message = afterComma;
      if (matches) {
        /** 有{}遍历的情况 */
        let res = analysisMatches(matches, middleComma, afterComma);
        formluaArr.push(...res);
      } else {
        /** 没有的情况 */
        analysisExpression(middleComma);
      }
    } else {
      formulaObj.formulaType = str.includes('vif') ? 'condition' : 'check';
      middleComma = splitRes[1];
      afterComma = splitRes.length === 3 ? splitRes[2] : '';
      matches = middleComma.match(regex);
      const afterMatches = afterComma.match(regex);
      if (afterComma) {
        if (afterMatches) {
          let afterRes = intercept(afterMatches, afterComma);
          afterRes.forEach((item: any) => {
            formulaObj.failExecute.push(item.cleanedExpression.trim());
          });
        } else {
          const res = parseExpression(afterComma);
          formulaObj.failExecute.push(res.cleanedExpression.trim());
        }
      }
      if (matches) {
        let midRes = intercept(matches, middleComma);
        midRes.forEach((item: any) => {
          formulaObj.execute.push(item.cleanedExpression.trim());
        });
      } else {
        const res = parseExpression(middleComma);
        formulaObj.execute.push(res.cleanedExpression.trim());
      }
      formluaArr.push(formulaObj);
    }
  } else {
    /** 没有chk和vif的情况 */
    const singleEqualRegex = /[^=<>!']=[^=]/;
    if (singleEqualRegex.test(str)) {
      formulaObj.formulaType = 'calc';
      const matches = str.match(regex);
      if (matches) {
        let res = intercept(matches, str);
        res.forEach((item: any) => {
          item.trigger = [...formulaObj.trigger, ...item.trigger.slice(1)];
          item.execute = [item.cleanedExpression];
        });
        formluaArr.push(...res);
      } else {
        const res = parseExpression(str);
        formulaObj.trigger = [...formulaObj.trigger, ...res.trigger.slice(1)];
        formulaObj.execute.push(res.cleanedExpression);
        formluaArr.push(formulaObj);
      }
    } else {
      formulaObj.formulaType = 'check';
      const regex = /\{(.*?)\}/g;
      const matches = str.match(regex);
      if (matches) {
        let res = intercept(matches, str);
        res.forEach((item: any) => {
          item.trigger = [...formulaObj.trigger, ...item.trigger];
          item.jsCondition = item.cleanedExpression;
          item.message = rule.remark;
        });
        formluaArr.push(...res);
      } else {
        const res = parseExpression(str);
        formulaObj.trigger = [...formulaObj.trigger, ...res.trigger];
        formulaObj.jsCondition = res.cleanedExpression;
        formluaArr.push(formulaObj);
      }
    }
  }

  return formluaArr;
};

const isFormula = (str: string) => {
  var regex = /[=<>]/; // 定义正则表达式，匹配等号、小于号、大于号
  if (regex.test(str)) {
    return true; // 如果字符串中存在等号、小于号、大于号之一，返回true
  } else {
    return false; // 否则返回false
  }
};

const convert = (str: any) => {
  /** 解析字符串，转换为数组 */
  const parseRange = (rangeStr: any) => {
    const [start, end] = rangeStr.split('-').map((char: any) => char.charCodeAt(0));
    return Array.from({ length: end - start + 1 }, (_, i) =>
      String.fromCharCode(start + i),
    );
  };
  /** 解析数字范围到数字数组 */
  const parseNumberRange = (rangeStr: any) => {
    const [start, end] = rangeStr.split('-').map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  /** 判断是数字范围还是字母范围 */
  const classifyString = (str: any) => {
    const containsDigits = /\d/.test(str); // 检查是否包含数字
    const containsLetters = /[a-zA-Z]/.test(str); // 检查是否包含字母
    if (containsDigits) {
      return 'Digits';
    } else if (containsLetters) {
      return 'Letters';
    } else {
      return 'Neither';
    }
  };
  const processSequence = (sequence: any) => {
    let arr: any[] = [],
      type: any = '';
    const items = sequence.split(',');
    for (const item of items) {
      if (item.includes('-')) {
        // 处理范围，例如 "F-H", "8-20"
        type = classifyString(item);
        if (type === 'Digits') {
          arr = [...arr, ...parseNumberRange(item)];
        } else if (type === 'Letters') {
          const lettersArr = parseRange(item);
          const letterToNumber = (letter: any) =>
            letter.charCodeAt(0) - 'A'.charCodeAt(0);
          const convertLettersToNumbers = (arr: any) =>
            arr.map((letter: any) => letterToNumber(letter));
          arr = [...arr, ...convertLettersToNumbers(lettersArr)];
        } else {
          console.log('无效公式~');
        }
      } else {
        // 处理单个字符，例如 "C" 或 "4"
        const char = item;
        if (isLetter(char)) {
          type = 'Letters';
          arr.push(char.charCodeAt(0) - 'A'.charCodeAt(0));
        } else {
          type = 'Digits';
          arr.push(Number(char));
        }
      }
    }
    return { arr: arr, type: type };
  };
  const isLetter = (char: any) => {
    return /^[A-Za-z]$/.test(char);
  };
  return processSequence(str);
};

/** 解析{}遍历 */
const intercept = (matches: any, str: any) => {
  const newMatch = matches.map((match: any) => match.slice(1, -1));
  let lettersArr: any[] = [];
  let digitsArr: any[] = [];
  newMatch.forEach((match: any) => {
    const res = convert(match);
    if (res.type === 'Digits') {
      digitsArr = res.arr;
    } else if (res.type === 'Letters') {
      lettersArr = res.arr;
    }
  });
  const newStr = str.replace(/{.*?}/g, '').replace(/\)/g, '');
  let newArr: any[] = [];
  if (lettersArr.length > 0 && digitsArr.length > 0) {
    lettersArr.forEach((letter: any) => {
      digitsArr.forEach((digit: any) => {
        const replacedString = newStr.replace(/\[(.*?)\]/g, (_match: any, p1: any) => {
          // 提取[]内的内容，并用,分割成数组
          const parts = p1.split(',');
          if (parts[0].includes('*')) {
            parts[0] = parts[0].replace(/\*/g, letter);
          }
          if (parts[1] === '*') {
            parts[1] = digit;
          }
          // 重新组合并返回替换后的字符串
          return '[' + parts.join(',') + ']';
        });
        newArr.push(replacedString);
      });
    });
  } else if (lettersArr.length === 0 && digitsArr.length > 0) {
    digitsArr.forEach((digit: any) => {
      const replacedString = newStr.replace(/\[(.*?)\]/g, (_match: any, p1: any) => {
        const parts = p1.split(',');
        if (parts[1] === '*') {
          parts[1] = digit;
        }
        return '[' + parts.join(',') + ']';
      });
      newArr.push(replacedString);
    });
  } else if (lettersArr.length > 0 && digitsArr.length === 0) {
    lettersArr.forEach((letter: any) => {
      const replacedString = newStr.replace(/\[(.*?)\]/g, (_match: any, p1: any) => {
        const parts = p1.split(',');
        if (parts[0].includes('*')) {
          parts[0] = parts[0].replace(/\*/g, letter);
        }
        return '[' + parts.join(',') + ']';
      });
      newArr.push(replacedString);
    });
  } else {
    newArr.push(newStr);
  }
  let resultArr: any[] = [];
  newArr.forEach((arr: any) => {
    const res = parseExpression(arr);
    resultArr.push(res);
  });
  return resultArr;
};

const parseExpression = (expression: any) => {
  let condition: any = {
    trigger: [],
  };
  const cleanedExpression = expression.replace(/\[(.*?)\]/g, (_match: any, p1: any) => {
    const parts = p1.split(',');
    const tableAndColumn = parts[0].split('.');
    const column = tableAndColumn[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
    let id;
    forms.forEach((form) => {
      if (form.code === tableAndColumn[0]) {
        const setting = JSON.parse(form.reportDatas)[0].data.setting;
        setting.cells.forEach((cell: any) => {
          if (column == cell.col && parts[1] - 1 == cell.row) {
            id = cell.prop.propId;
          }
        });
      }
    });
    condition.tableCode = tableAndColumn[0];
    condition.column = column;
    condition.row = parts[1] - 1;
    condition.trigger.push(id);
    return '[' + tableAndColumn[0] + '.' + id + ']';
  });
  condition.cleanedExpression = cleanedExpression;
  return condition;
};

/** 解析换行 */
const deconstructionRule = (rule: any) => {
  let formulaArr: any[] | undefined = [];
  if (rule.formula.includes('\n')) {
    const ruleArr = rule.formula.split(';');
    ruleArr.forEach((ruleStr: any) => {
      let resultArr: any = analysisFormula(ruleStr.replace(/\r?\n|\r/g, ''), rule);
      formulaArr?.push(resultArr[0]);
    });
  } else {
    formulaArr = analysisFormula(rule.formula, rule);
  }
  return formulaArr;
};

export const analysisFormulas = async (rules: any, primaryForms: schema.XForm[]) => {
  forms = primaryForms;
  let analysisArr: any[] = [];
  rules.forEach((rule: any) => {
    const formulaArr = deconstructionRule(rule);
    formulaArr?.forEach((formula: any) => {
      let newObj = {
        type: 'code',
        formula,
      };
      analysisArr.push(newObj);
    });
  });
  return analysisArr;
};

export const contrastRule = (jsCondition: any, changedData: any) => {
  const newJsCondition = jsCondition.trim().replace(/\[(.*?)\]/g, (match: any) => {
    let parts = match.match(/\[(.*?)\]/)[1].split('.');
    let result;
    changedData.forEach((data: any) => {
      if (data.formCode === parts[0]) {
        Object.keys(data.after[0]).forEach((key) => {
          if (key === parts[1]) {
            result = '"' + data.after[0][key] + '"';
          }
        });
      }
    });
    return result;
  });
  return eval(newJsCondition);
};

export const expressionRule = async (executes: any[] = [], changedData: any) => {
  if (executes.length === 0) {
    return false;
  }
  let resultArr: any[] = [];
  executes.forEach((execute: any) => {
    let parts = execute.split('=');
    const newExecute = parts[1].trim().replace(/\[(.*?)\]/g, (match: any) => {
      let parts2 = match.match(/\[(.*?)\]/)[1].split('.');
      let result;
      changedData.forEach((data: any) => {
        if (data.formCode === parts2[0]) {
          Object.keys(data.after[0]).forEach((key) => {
            if (key === parts2[1]) {
              if (data.after[0][key]) {
                result = data.after[0][key];
              }
            }
          });
        }
      });
      return result;
    });
    const info = parts[0].trim().slice(1, -1).split('.');
    if (eval(newExecute)) {
      resultArr.push({
        execute: eval(newExecute),
        tableCode: info[0],
        target: info[1],
      });
    }
  });
  return resultArr;
};

export const checkRule = async (checkData: any, changedData: any) => {
  const newCheckData = checkData.replace(/\[(.*?)\]/g, (match: any) => {
    let parts = match.match(/\[(.*?)\]/)[1].split('.');
    let result;
    changedData.forEach((data: any) => {
      if (data.formCode === parts[0]) {
        Object.keys(data.after[0]).forEach((key) => {
          if (key === parts[1]) {
            result = data.after[0][key];
          }
        });
      }
    });
    return result;
  });
  return eval(newCheckData);
};
