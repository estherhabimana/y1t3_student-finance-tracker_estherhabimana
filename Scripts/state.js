import { loadrecords, saveRecords, loadsettings,saveSettings } from "./storage.js";

let records = []
let settings = loadsettings()
let onChange = () => {};

// naming records
export function nextID(list){
    let highest = 0
    for (const record of list){
        const number = parseInt(record.id.slice(4),10);
        if(number > highest) highest = number
    }
    return 'rec_' + String(highest+1).padStart(4, '0');
}

export function startState(seedRecords){
    const saved = loadrecords()
    if(saved === null){
        records = seedRecords
    }else{
        records = saved
    }

    settings = loadsettings()
    saveRecords(records)
}

export function getrecords(){
    return records;
}

export function getsettings(){
    return settings
}

export function setOnChange(callback){
    onChange = callback;
}

function recordschanged(){
    saveRecords(records)
    onChange()
}

export function addRecord(data){
    const now = new Date().toISOString();
    records.push({
        id: nextID(records),
        description: data.description,
        amount:data.amount,
        category: data.category,
        date:data.date,
        createdAt: now,
        updatedAt:now
    });
    recordschanged();
}

export function updateRecord(id, data){
    const record = records.find((r) => r.id === id);
    if(!record) return;
    record.description = data.description
    record.amount = data.amount
    record.category = data.category
    record.date = data.date
    record.updatedAt = new Date().toISOString();
    recordschanged();
}

export function delrecord(id){
    records = records.filter((r) => r.id !== id)
    recordschanged()
}

export function replaceRecords(newRecords){
    records = newRecords
    recordschanged()
}

export function updateSettings(changes){
    settings = {...settings, ...changes}
    saveSettings(settings)
    onChange()
}

export function sortRecords(list,key,direction) {
    const sorted = [...list];
    sorted.sort((a,b) => {
        let result;
        if(key === 'amount'){
            result = a.amount - b.amount;
        }else{
            result = String(a[key]).localeCompare(String(b[key]));
        }
        if(direction === 'asc') return result;
        return -result;
    })
    return sorted;
}