export function compileRegex(pattern, ignoreCase){
    if(pattern === ''){
        return{regex:null, error: null}
    }
    try{
        const flags = ignoreCase ? 'i' : '';
        return {
            regex: new RegExp(pattern, flags), error: null
        }
    }catch(error){
        return {
            regex: null, error: error.message
        }
    }
}

export function matches(record, regex){
    if(regex === null) return true;
    const fields = [record.description, record.category, String(record.amount), record.date]
    for (const text of fields){
        if(regex.test(text)) return true
    }
    return false
}

export function highlight(text, regex) {
    const result = document.createDocumentFragment();

    if(regex === null){
        result.append(text)
        return result
    }

    const globalReg = new RegExp(regex.source, regex.flags + 'g')
    let lastEnd = 0
    for(const match of text.matchAll(globalReg)){
        if(match[0] === '') continue;

        result.append(text.slice(lastEnd, match.index))
        const mark = document.createElement('mark')
        mark.textContent = match[0]
        result.append(mark)
        lastEnd = match.index + match[0].length
    }
    result.append(text.slice(lastEnd))
    return result;
}