const RECORDS_KEY = 'sft:records'
const SETTINGS_KEY = 'sft:settings'

export const defaultSettings = {
    baseCurrency: 'RWF',
    others: [
        {code: 'SGD', rate: 0.005},
        {code: 'UGX', rate: 0.006}
    ],
    cap: 0,
    categories: ['Food', 'Fashion', 'Books', 'Medical', 'Entertainment', 'Fees', 'Other']
}

export function loadrecords(){
    try{
        const text = localStorage.getItem(RECORDS_KEY)
        if(text === null) return null;
        const data = JSON.parse(text);
        if(Array.isArray(data)) return data;
        return null;
    } catch (error){
        console.error("Couldn't read saved records: ", error)
        return null;
    }
}

export function saveRecords(records) {
    try{
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (error){
        console.error('Cound not save records', error)
    }
}

export function loadsettings(){
    try{ 
        const text = localStorage.getItem(SETTINGS_KEY)
        if(text===null) return structuredClone(defaultSettings)
        
        return{
            ...structuredClone(defaultSettings), ...JSON.parse(text)
        }    

    }catch (error){
        console.error("CRSS", error)
        return structuredClone(defaultSettings)
    }
}

export function saveSettings(settings){
    try{
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }catch(error) {
        console.error("CRSS", error)
    }
}


// download button
export function downloadRecords(records){
    const text = JSON.stringify(records, null,2);
    const blob = new Blob([text], {type: 'application/json'});
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'sft-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
}