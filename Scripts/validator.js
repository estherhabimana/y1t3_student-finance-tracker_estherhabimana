// patterns
export const patterns = {
    description: /^\S(?:.*\S)?$/,
    amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    duplicateWord: /\b(\w+)\s+\1\b/i,
    id: /^rec_\d{4,}$/,
    currency: /^[A-Z]{3}$/,
    rate: /^(0|[1-9]\d*)(\.\d{1,6})?$/
};

// helper functions
const good = (value) => ({ok:true,value});
const bad = (message) => ({ok:false,message});

export function collapseSpaces(s){
    return s.replace(/\s{2,}/g, " ")
}

// field validator
export function validateDesc(raw){
    const value = collapseSpaces(raw)
    if (!patterns.description.test(value)){
        return bad("required, no trailing spaces")
    }
    const dup = value.match(patterns.duplicateWord)
    if(dup) {
        return bad(`Repeated word: ${dup[0]}`)
    }
    return good(value);

}

export function validateAmount(raw){
    if(!patterns.amount.test(raw)){
        return bad('use a whole number or 2 max decimals like 10 or 10.55')
    }
    return good(Number(raw))

}

export function validateDate(raw) {
  if (!patterns.date.test(raw)) {
    return bad('Use the format YYYY-MM-DD, for example 2026-10-20.');
  }
  const parts = raw.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return bad('That date does not exist on the calendar.');
  }
  return good(raw);
}

export function validateCategory(raw) {
  const text = collapseSpaces(raw);
  if (!patterns.category.test(text)) {
    return bad('Letters, spaces and hyphens only, like "Food" or "Part-time job".');
  }
  return good(text);
}

export function validateCap(raw) {
  if (!patterns.amount.test(raw)) {
    return bad('Use num like 500 or 500.00 (0 turns the cap off).');
  }
  return good(Number(raw));
}

export function valCurrencyCode(raw){
    if(!patterns.currency.test(raw)){
        return bad('3 letter code??')

    }
    return good(raw)
}

export function validateRate(raw){
    if(!patterns.rate.test(raw) || Number(raw) <= 0){
        return bad('use num above 0')
    }
    return good(Number(raw));
}

export function valRecord(input){
    const results = {
        description: validateDesc(input.description),
        amount: validateAmount(input.amount),
        category: validateCategory(input.category),
        date: validateDate(input.date)
    };
    const errors = {};
    const clean = {};
    let ok = true;
    for (const name in results) {
        if (results[name].ok) {
            clean[name] = results[name].value;
        } else {
            errors[name] = results[name].message;
            ok = false;
        }
    }
    return { ok: ok, errors: errors, clean: clean };
}

export function checkImportedRecords(data){
    const probs = [];
    if(!Array.isArray(data)){
        probs.push('files should contain records')
        return probs;
    }

    const seenIds = [];
    for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const label = 'Record' + (i+1) 
    
        if(typeof r !=='object' || r === null){
            probs.push(label + 'is not an object')
            continue;
        }
        if (typeof r.id !== 'string' || !patterns.id.test(r.id)) {
            probs.push(label + ' has an invalid id');
            } else if (seenIds.includes(r.id)) {
            probs.push(label + ' repeated id' + r.id);
            } else {
            seenIds.push(r.id);
        }
        if(typeof r.description !=='string' || !patterns.description.test(r.description)){
            probs.push(label + 'has invalid description')
        }
        if(typeof r.amount !== 'number' || !patterns.amount.test(String(r.amount))){
            probs.push(label+ 'has invalid amount')
        }
        if(typeof r.date !== 'string' || !validateDate(r.date).ok){
            probs.push(label + 'has an invalid date')
        }
        if(typeof r.category !== 'string' || !patterns.category.test(r.category)){
            probs.push(label + 'has an invalid category')
        }
        if(typeof r.createdAt !== 'string' || isNan(Date.parse(r.createdAt))){
            probs.push(label + 'has an invalid createdAt')
        }
        if(typeof r.updatedAt !== 'string' || isNan(Date.parse(r.updatedAt))){
            probs.push(label + 'has an invalid updatedAt')
        }
    }
    return probs
}