import { highlight } from "./search.js";
import { totalSum, topCategory, last7Days, capStatus } from "./stats.js";

const recordsBody = document.querySelector('#records-body')

function makeElement(tag, className, text){
    const element = document.createElement(tag)
    if(className) element.className = className
    if(text) element.textContent = text
    return element
}

function makeCell(text, regex) {
    const cell = document.createElement('td');
    cell.append(highlight(text,regex))
    return cell
}

function makeButton(label, action, record){
    const button = makeElement('button', '', label)
    button.type = 'button'
    button.dataset.action = action

    button.setAttribute('aria-label', label + ' ' + record.description)
    return button
}

function setText(element, text){
    if(element.textContent !== text){
        element.textContent = text
    }
}

export function renderTable(records, regex){
    recordsBody.replaceChildren()

    if(records.length === 0) {
        const row = document.createElement('tr')
        const cell = makeElement('td', '', 'No records to show for now')
        cell.colSpan = 5
        row.append(cell)
        recordsBody.append(row)
        return
    }

    for (const rec of records) {
        const row = document.createElement('tr')
        row.dataset.id = rec.id
        row.append(
            makeCell(rec.date, regex),
            makeCell(rec.description, regex),
            makeCell(String(rec.amount), regex),
            makeCell(rec.category, regex)
        );

        const actions = document.createElement('td')
        actions.append(makeButton('Edit', 'edit', rec), makeButton('Delete', 'delete', rec))
        row.append(actions)


        recordsBody.append(row);
    }
}

function renderTrend(days){
    const trend = document.querySelector('#trend')
    trend.replaceChildren()

    let biggest = 0
    for (const day of days){
        if(day.total > biggest) biggest = day.total
    }

    const descriptions = []
    for(const day of days){
        const column = makeElement('div', 'bar-col')
        const value = makeElement('span', 'bar-value', day.total > 0 ? day.total.toFixed(2) : '')
        const track = makeElement('div', 'bar-track')
        const bar = makeElement('div', 'bar')
        bar.style.height = (biggest > 0 ? (day.total / biggest) * 100 : 0) + '%'
        track.append(bar)
        const label = makeElement('span', 'bar-label', day.date.slice(5))
        column.append(value, track, label)
        trend.append(column)
        descriptions.push(day.date + ': ' + day.total.toFixed(2))
    }
    trend.setAttribute('aria-label', 'Spending over last 7 days,' + descriptions.join(', '))
}


export function renderStats(records, settings){
    const total = totalSum(records)
    const top = topCategory(records)

    setText(document.querySelector('#stat-count'), String(records.length))

    const converted =[]
    for (const other of settings.others) {
        converted.push((total*other.rate).toFixed(2) + ''+other.code)
    }
    setText(
        document.querySelector('#stat-sum'),
        total.toFixed(2) + '' + settings.baseCurrency + '(=' + converted.join('.')+ ')'
    );

    if(top){
        setText(document.querySelector('#stat-top'), top.name + '(' + top.total.toFixed(2) + ')')
    }else{
        setText(document.querySelector('#stat-top'), '-')
    }

    renderTrend(last7Days(records))

    const cap = capStatus(total, settings.cap)
    setText(document.querySelector('#cap-polite'), cap.state === 'under'? cap.message: '')
    setText(document.querySelector('#cap-assertive'), cap.state === 'over'? cap.message: '')
}

export function renderCategs(categories){
    const suggestions = document.querySelector('#category-list')
    suggestions.replaceChildren();
    for (const name of categories) {
        const option = document.createElement('option')
        option.value = name
        suggestions.append(option)
    }
}