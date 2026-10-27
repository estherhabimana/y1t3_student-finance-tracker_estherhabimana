import { valRecord, validateCap, validateCategory, valCurrencyCode, validateRate, checkImportedRecords } from "./validator.js"
import { loadrecords, downloadRecords } from "./storage.js";
import { startState, getrecords, getsettings,setOnChange,addRecord,updateRecord, delrecord, replaceRecords, updateSettings, sortRecords } from "./state.js";
import { compileRegex, matches } from "./search.js";
import { renderTable, renderStats, renderCategs } from "./ui.js";

const recordForm = document.querySelector('#record-form');
const formTitle = document.querySelector('#form-title');
const formStatus = document.querySelector('#form-status');
const recordIdInput = document.querySelector('#record-id');
const cancelButton = document.querySelector('#cancel-edit');
const searchBox = document.querySelector('#search');
const caseToggle = document.querySelector('#case-toggle');
const searchStatus = document.querySelector('#search-status');
const recordsBody = document.querySelector('#records-body');
const settingsStatus = document.querySelector('#settings-status');

const fieldNames = ['description', 'amount', 'category', 'date']

let sortKey = 'date'
let sortDesc = 'desc'
let searchText = ''
let ignoreCase = caseToggle.checked;

function refresh(){
    const search = compileRegex(searchText, ignoreCase);
    if (search.error) {
        searchBox.setAttribute('aria-invalid', 'true');
    } else {
        searchBox.removeAttribute('aria-invalid');
    }
    const allRecs = getrecords()
    const settings = getsettings()

    const visible = []
    for(const record of allRecs) {
        if(matches(record, search.regex)) visible.push(record)
    }
    const sorted = sortRecords(visible, sortKey, sortDesc)


    renderTable(sorted, search.regex);
    renderStats(allRecs, settings);          // the dashboard always uses ALL records
    renderCategs(settings.categories);

    if(search.error){
        searchStatus.textContent = 'Inval Pattern ' + search.error
    }else if (searchText !== '') {
        searchStatus.textContent = sorted.length + ' of ' + allRecs.length + ' records match.';
    } else {
        searchStatus.textContent = '';
    }
}


for (const button of document.querySelectorAll('button[data-sort]')){
    button.addEventListener('click', () => {
        const key = button.dataset.sort;
        if(key === sortKey) {
            sortDesc = sortDesc === 'asc'? 'desc': 'asc'
        }else{
            sortKey=key
            sortDesc = key==='date'? 'desc': 'asc'
        }
        refresh()
    });
}

searchBox.addEventListener('input', () => {
  searchText = searchBox.value;
  refresh();
});

caseToggle.addEventListener('change', () => {
  ignoreCase = caseToggle.checked;
  refresh();
});

function showFieldErrors(errors){
    for (const name of fieldNames){
        const input = document.querySelector('#'+name)
        const errorBox = document.querySelector('#'+ name +'-error')
        if(errors[name]){
            errorBox.textContent = errors[name]
            input.setAttribute('aria-invalid', 'true')
        }else{
            errorBox.textContent = ''
            input.removeAttribute('aria-invalid')
        }

    }
}
function stopEditing() {
  recordForm.reset();
  recordIdInput.value = '';
  formTitle.textContent = 'Add record';
  cancelButton.hidden = true;
  showFieldErrors({});
}

function startEditing(id){
    const record = getrecords().find((r) => r.id === id)
    if(!record) return;

    recordIdInput.value = id

    for (const name of fieldNames){
        recordForm.elements[name].value = record[name]
    }
    formTitle.textContent = 'Edit rec'
    cancelButton.hidden = false
    showFieldErrors({})
    recordForm.elements.description.focus()
}

recordForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const input = {}
    for(const name of fieldNames){
        input[name] = recordForm.elements[name].value
    }

    const result = valRecord(input)
    showFieldErrors(result.errors)

    if(!result.ok){
        let errorCount = 0
        let firstBad = null
        for (const name of fieldNames){
            if(result.errors[name]){
                errorCount++
                if(firstBad === null) firstBad = name
            }
            
        }
        recordForm.elements[firstBad].focus()
        formStatus.textContent = 'Please fix ' + errorCount + ' error/s'
        return
    }

    const id = recordIdInput.value;
    if(id !== ''){
        updateRecord(id, result.clean)
        formStatus.textContent = 'Record updated'
    }else{
        addRecord(result.clean)
        formStatus.textContent = 'Rec added'
    }
    stopEditing()
    recordForm.elements.description.focus()
})

cancelButton.addEventListener('click', () => {
    stopEditing()
    formStatus.textContent = 'Edit cancelled'
});

function delWithConfirm(id){
    const rec = getrecords().find((r) => r.id === id)
    if(!rec) return
    if(!confirm('Sure you want to delete "' + rec.description + '"?')) return;

    if(recordIdInput.value === id) stopEditing()
        delrecord(id)
    formStatus.textContent = 'Deleted "' + rec.description + '".';
    searchBox.focus()
}

recordsBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.closest('tr').dataset.id;
    if (button.dataset.action === 'edit') startEditing(id);
    if (button.dataset.action === 'delete') delWithConfirm(id);
});

const baseInput = document.querySelector('#base-currency');
const rate1Input = document.querySelector('#rate-1');
const rate2Input = document.querySelector('#rate-2');
const capInput = document.querySelector('#cap');
const categoriesInput = document.querySelector('#categories');

function problem(input, message){
    input.setAttribute('aria-invalid', 'true')
    settingsStatus.textContent = message
}

function fine(input) {
  input.removeAttribute('aria-invalid');
}

function fillSettingsForm() {
  const settings = getsettings();
  baseInput.value = settings.baseCurrency;
  rate1Input.value = settings.others[0].rate;
  rate2Input.value = settings.others[1].rate;
  capInput.value = settings.cap;
  categoriesInput.value = settings.categories.join(', ');
}

baseInput.addEventListener('change', () => {
    const code = baseInput.value.trim().toUpperCase()
    const result = valCurrencyCode(code)
    if (!result.ok) {
        problem(baseInput, result.message);
        return;
    }
    for (const other of getsettings().others) {
        if (other.code === code) {
            problem(baseInput, 'The base currency must be different from ' + other.code + '.');
            return;
        }
    }
    fine(baseInput);
    updateSettings({ baseCurrency: code });
    baseInput.value = code;
    settingsStatus.textContent = 'Base currency saved.';

})

function watchRate(input, index) {
    input.addEventListener('change', () => {
        const result = validateRate(input.value.trim());
        if (!result.ok) {
        problem(input, result.message);
        return;
        }
        fine(input);
        const others = getsettings().others.map((o) => ({ code: o.code, rate: o.rate }));
        others[index].rate = result.value;
        updateSettings({ others: others });
        settingsStatus.textContent = others[index].code + ' rate saved.';
    })
}
watchRate(rate1Input,0)
watchRate(rate2Input,1)

capInput.addEventListener('change', () => {
    const result = validateCap(capInput.value.trim());
    if (!result.ok) {
        problem(capInput, result.message);
        return;
    }
    fine(capInput);
    updateSettings({ cap: result.value });
    settingsStatus.textContent = result.value > 0 ? 'Cap set to ' + result.value.toFixed(2) + '.' : 'Cap turned off.';
});

categoriesInput.addEventListener('change', () => {
    const cleaned = [];
    for (const part of categoriesInput.value.split(',')) {
        const text = part.trim();
        if (text === '') continue;
        const result = validateCategory(text);
        if (!result.ok) {
            problem(categoriesInput, '"' + text + '": ' + result.message)
            return;
        }
        cleaned.push(result.value)
    }
    if (cleaned.length === 0) {
        problem(categoriesInput, 'Add at least one category')
        return;
    }
    fine(categoriesInput);
    updateSettings({ categories: cleaned });
    categoriesInput.value = cleaned.join(', ');
    settingsStatus.textContent = 'Categories saved.';
})

document.querySelector('#export-btn').addEventListener('click', () => {
  downloadRecords(getrecords());
  settingsStatus.textContent = 'Exported ' + getrecords().length + ' records.';
});

const importFile = document.querySelector('#import-file');
importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    if (!file) return;

    try {
        const data = JSON.parse(await file.text())
        const probs = checkImportedRecords(data)
        if (probs.length > 0) {
            settingsStatus.textContent = 'Import failed, nothing was changed. ' + probs.slice(0, 3).join(' ');
            return;
        }
        const sure = confirm('Replace your' + getrecords().length + ' records with the ' + data.length + 'in this file');
        if (!sure){
            settingsStatus.textContent = 'Import Cancelled'
            return
        }

        replaceRecords(data);
        settingsStatus.textContent = 'Imported ' + data.length + ' records.';
    } catch (error) {
        settingsStatus.textContent = 'Import failed, nothing was changed. ' + error.message;
    } finally {
        importFile.value = '';
    }
});

async function start() {
    let seed = []
    if(loadrecords() === null){
        try{
            const response = await fetch ('seed.json')
            seed = await response.json()

        }catch(error){
            console.error('could not load see.json', error)

        }
    }

    startState(seed)
    setOnChange(refresh)
    fillSettingsForm()
    refresh()
}

start()


console.log("Hello Sumamtive, How are you?")
